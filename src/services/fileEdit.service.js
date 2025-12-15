import fs from 'fs';
import path from 'path';
import ora from 'ora';
import { formatPathForDocker } from '../utils/dockerUtils.js';
import { getAICode } from './ai.service.js';
import { runInContainer } from './docker.service.js';
import logger from '../utils/logger.js';
import {
    createAuditEntry,
    updateAuditScript,
    finalizeAuditEntry,
    markAuditEntryFailed
} from './auditLog.service.js';

/**
 * Processes a file using AI and Docker container
 * @param {string} filePath - Path to the file to process
 * @param {Object} options - Processing options
 * @param {string} options.instruction - User instruction for processing
 * @param {boolean} options.silent - If true, don't show spinner (for API usage)
 * @returns {Promise<{success: boolean, filePath: string, error?: string}>} Result object
 */
export async function editFile(filePath, options) {
    const spinner = options.silent ? null : ora('Initializing GhostDock...').start();
    let auditEntry = null;

    try {
        const absolutePath = path.resolve(filePath);

        // Validate file exists BEFORE creating audit entry
        if (!fs.existsSync(absolutePath)) {
            if (spinner) spinner.fail('File not found!');
            return { success: false, filePath: absolutePath, error: 'File not found' };
        }

        const fileDir = path.dirname(absolutePath);
        const dockerSafeDir = formatPathForDocker(fileDir);

        // Create audit entry
        auditEntry = await createAuditEntry(absolutePath, options.instruction);

        if (spinner) spinner.succeed('GhostDock Initialized.');

        // --- THE SELF-HEALING LOOP ---
        let attempts = 0;
        const MAX_ATTEMPTS = parseInt(process.env.MAX_ATTEMPTS) || 3;
        let lastError = null;
        let success = false;
        let finalAiCode = null;

        // Get list of files before processing to detect new files
        const filesBefore = new Set();
        try {
            const dirFiles = fs.readdirSync(fileDir);
            dirFiles.forEach(file => {
                const fullPath = path.join(fileDir, file);
                if (fs.statSync(fullPath).isFile()) {
                    filesBefore.add(fullPath);
                }
            });
        } catch (err) {
            logger.debug('Could not read directory before processing:', err.message);
        }

        let containerLogs = '';
        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            logger.info(`Attempt ${attempts}/${MAX_ATTEMPTS}`);

            const aiCode = await getAICode(absolutePath, options.instruction, lastError);
            finalAiCode = aiCode; // Store the code for audit log (last attempt if failed, successful if succeeded)

            const result = await runInContainer(aiCode, dockerSafeDir);
            containerLogs = result.logs;

            if (result.success) {
                logger.success(`Execution succeeded on attempt ${attempts}`);
                logger.info('Container output:');
                logger.raw(result.logs);
                success = true;
                break;
            } else {
                logger.warn(`Attempt ${attempts} failed. Retrying...`);
                lastError = result.logs;
            }
        }

        // Detect newly created files after processing
        let outputFilePath = absolutePath; // Default to original file
        try {
            const dirFiles = fs.readdirSync(fileDir);
            const filesAfter = new Set();
            dirFiles.forEach(file => {
                const fullPath = path.join(fileDir, file);
                if (fs.statSync(fullPath).isFile()) {
                    filesAfter.add(fullPath);
                }
            });

            // Find files that exist after but not before
            const newFiles = Array.from(filesAfter).filter(file => !filesBefore.has(file));
            
            if (newFiles.length > 0) {
                // Use the most recently modified new file
                newFiles.sort((a, b) => {
                    const statA = fs.statSync(a);
                    const statB = fs.statSync(b);
                    return statB.mtime - statA.mtime;
                });
                outputFilePath = newFiles[0];
                logger.info(`Detected new output file: ${path.basename(outputFilePath)}`);
            } else {
                // Check if original file was modified (check modification time)
                const originalStat = fs.statSync(absolutePath);
                // If file was modified recently (within last minute), assume it's the output
                const now = new Date();
                const modifiedTime = new Date(originalStat.mtime);
                const timeDiff = (now - modifiedTime) / 1000; // seconds
                
                if (timeDiff < 60) {
                    logger.info('Using modified original file as output');
                    outputFilePath = absolutePath;
                }
            }
        } catch (err) {
            logger.debug('Could not detect new files, using original:', err.message);
        }

        // Finalize audit entry with results
        await finalizeAuditEntry(auditEntry, {
            success,
            errorMessage: success ? null : lastError,
            script: finalAiCode,
            attempts
        });

        if (success) {
            if (spinner) spinner.succeed('Process complete. File has been updated.');
            return { success: true, filePath: outputFilePath, logs: containerLogs };
        } else {
            if (spinner) {
                spinner.fail(`Failed after ${MAX_ATTEMPTS} attempts`);
            }
            logger.error(`Failed after ${MAX_ATTEMPTS} attempts`);
            logger.warn('Last error from container:');
            logger.raw(lastError);
            return { success: false, filePath: absolutePath, error: lastError };
        }

    } catch (error) {
        if (spinner && spinner.isSpinning) spinner.stop();
        
        // Mark audit entry as failed
        await markAuditEntryFailed(auditEntry, error.message);
        
        logger.error('Critical error:', error.message);
        return { success: false, filePath: filePath, error: error.message };
    }
}