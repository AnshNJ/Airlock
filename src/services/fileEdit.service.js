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

export async function editFile(filePath, options) {
    const spinner = ora('Initializing GhostDock...').start();
    let auditEntry = null;

    try {
        const absolutePath = path.resolve(filePath);

        // Validate file exists BEFORE creating audit entry
        if (!fs.existsSync(absolutePath)) {
            spinner.fail('File not found!');
            return;
        }

        const fileDir = path.dirname(absolutePath);
        const dockerSafeDir = formatPathForDocker(fileDir);

        // Create audit entry
        auditEntry = await createAuditEntry(absolutePath, options.instruction);

        spinner.succeed('GhostDock Initialized.');

        // --- THE SELF-HEALING LOOP ---
        let attempts = 0;
        const MAX_ATTEMPTS = parseInt(process.env.MAX_ATTEMPTS) || 3;
        let lastError = null;
        let success = false;
        let finalAiCode = null;

        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            logger.info(`Attempt ${attempts}/${MAX_ATTEMPTS}`);

            const aiCode = await getAICode(absolutePath, options.instruction, lastError);
            finalAiCode = aiCode; // Store the code for audit log (last attempt if failed, successful if succeeded)

            const result = await runInContainer(aiCode, dockerSafeDir);

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

        // Finalize audit entry with results
        await finalizeAuditEntry(auditEntry, {
            success,
            errorMessage: success ? null : lastError,
            script: finalAiCode,
            attempts
        });

        if (success) {
            logger.success('Process complete. File has been updated.');
        } else {
            logger.error(`Failed after ${MAX_ATTEMPTS} attempts`);
            logger.warn('Last error from container:');
            logger.raw(lastError);
        }

    } catch (error) {
        if (spinner.isSpinning) spinner.stop();
        
        // Mark audit entry as failed
        await markAuditEntryFailed(auditEntry, error.message);
        
        logger.error('Critical error:', error.message);
        throw error;
    }
}