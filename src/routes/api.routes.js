import express from 'express';
import { uploadSingle, cleanupTempFile } from '../middleware/upload.middleware.js';
import { editFile } from '../services/fileEdit.service.js';
import logger from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

/**
 * POST /api/process
 * Upload a file, process it, and return the processed file
 */
router.post('/process', uploadSingle, async (req, res) => {
    let uploadedFilePath = null;

    try {
        // Check if file was uploaded
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                error: 'No file uploaded' 
            });
        }

        uploadedFilePath = req.file.path;
        const instruction = req.body.instruction || '';

        if (!instruction.trim()) {
            cleanupTempFile(uploadedFilePath);
            return res.status(400).json({ 
                success: false, 
                error: 'Instruction is required' 
            });
        }

        logger.info(`Processing file: ${req.file.originalname} with instruction: ${instruction}`);

        // Process the file
        const result = await editFile(uploadedFilePath, {
            instruction: instruction,
            silent: true // Don't show spinner in API mode
        });

        if (!result.success) {
            cleanupTempFile(uploadedFilePath);
            return res.status(500).json({
                success: false,
                error: result.error || 'File processing failed'
            });
        }

        // Check if output file exists
        if (!fs.existsSync(result.filePath)) {
            cleanupTempFile(uploadedFilePath);
            return res.status(500).json({
                success: false,
                error: 'Processed file not found'
            });
        }

        // Determine download filename
        const outputFileName = path.basename(result.filePath);
        const originalName = path.basename(req.file.originalname, path.extname(req.file.originalname));
        const outputExt = path.extname(result.filePath);
        
        // If it's a new file, use its name; otherwise append _processed
        let downloadName;
        if (result.filePath !== uploadedFilePath) {
            // New file created - use its actual name
            downloadName = outputFileName;
        } else {
            // Original file modified - append _processed
            downloadName = `${originalName}_processed${outputExt}`;
        }

        res.download(result.filePath, downloadName, (err) => {
            // Clean up temp file after download (or on error)
            if (err) {
                logger.error('Error sending file:', err.message);
            }
            
            // Clean up both original uploaded file and processed file
            cleanupTempFile(uploadedFilePath);
            cleanupTempFile(result.filePath);
        });

    } catch (error) {
        logger.error('API error:', error.message);
        
        // Clean up temp file on error
        if (uploadedFilePath) {
            cleanupTempFile(uploadedFilePath);
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error'
        });
    }
});

export default router;

