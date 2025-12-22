import { AuditLog } from '../models/AuditLog.js';
import { calculateFileHash } from '../utils/fileUtils.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';

/**
 * Audit Logging Service
 * Handles all audit trail operations for compliance and tracking
 */

/**
 * Creates a new audit entry for a file operation
 * @param {string} filePath - Absolute path to the file
 * @param {string} instruction - User instruction for the operation
 * @returns {Promise<AuditLog|null>} The created audit entry or null if failed
 */
export async function createAuditEntry(filePath, instruction) {
    try {
        if (!fs.existsSync(filePath)) {
            logger.warn('Cannot create audit entry: file does not exist');
            return null;
        }

        const fileStats = fs.statSync(filePath);
        const initialFileHash = calculateFileHash(filePath);

        const auditEntry = await AuditLog.create({
            fileName: path.basename(filePath),
            instruction: instruction || '',
            status: 'PENDING',
            fileHash: initialFileHash,
            script: '', 
            metadata: {
                fileSize: fileStats.size,
                fileType: path.extname(filePath),
                filePath: filePath,
                fileCreatedAt: fileStats.birthtime.toISOString(),
                fileModifiedAt: fileStats.mtime.toISOString(),
                attempts: 0
            }
        });

        logger.debug(`Audit entry created: ${auditEntry.id}`);
        return auditEntry;
    } catch (error) {
        logger.warn('Failed to create audit entry:', error.message);
        return null; // Don't break the main flow if audit logging fails
    }
}

/**
 * Updates an audit entry with the executed script
 * @param {AuditLog} auditEntry - The audit entry to update
 * @param {string} script - The AI-generated script that was executed
 * @returns {Promise<void>}
 */
export async function updateAuditScript(auditEntry, script) {
    if (!auditEntry) return;

    try {
        await auditEntry.update({ script });
        logger.debug(`Audit script updated: ${auditEntry.id}`);
    } catch (error) {
        logger.debug('Failed to update audit script:', error.message);
    }
}

/**
 * Finalizes an audit entry with operation results
 * @param {AuditLog} auditEntry - The audit entry to update
 * @param {Object} options - Update options
 * @param {boolean} options.success - Whether the operation succeeded
 * @param {string|null} options.errorMessage - Error message if failed
 * @param {string|null} options.script - Final script that was executed
 * @param {number} options.attempts - Number of attempts made
 * @returns {Promise<void>}
 */
export async function finalizeAuditEntry(auditEntry, { success, errorMessage, script, attempts }) {
    if (!auditEntry) return;

    try {
        let finalFileHash = null;
        const filePath = auditEntry.metadata?.filePath;

        // Calculate final file hash if file still exists
        if (filePath && fs.existsSync(filePath)) {
            finalFileHash = calculateFileHash(filePath);
        }

        const updateData = {
            status: success ? 'SUCCESS' : 'FAILED',
            errorMessage: success ? null : errorMessage,
            fileHash: finalFileHash || auditEntry.fileHash,
            script: script || auditEntry.script,
            metadata: {
                ...auditEntry.metadata,
                attempts: attempts,
                completedAt: new Date().toISOString()
            }
        };

        await auditEntry.update(updateData);
        logger.debug(`Audit entry finalized: ${auditEntry.id} - Status: ${updateData.status}`);
    } catch (error) {
        logger.warn('Failed to finalize audit entry:', error.message);
    }
}

/**
 * Marks an audit entry as failed due to a critical error
 * @param {AuditLog} auditEntry - The audit entry to update
 * @param {string} errorMessage - The error message
 * @returns {Promise<void>}
 */
export async function markAuditEntryFailed(auditEntry, errorMessage) {
    if (!auditEntry) return;

    try {
        await auditEntry.update({
            status: 'FAILED',
            errorMessage: errorMessage
        });
        logger.debug(`Audit entry marked as failed: ${auditEntry.id}`);
    } catch (error) {
        logger.debug('Failed to update audit entry on error:', error.message);
    }
}

