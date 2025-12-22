import fs from 'fs';
import crypto from 'crypto';

/**
 * File-related utility functions
 */

/**
 * Reads the first 1000 characters of a file for AI context.
 * @param {string} filePath - The path to the file.
 * @returns {string} A preview of the file content.
 */
export function getFilePreview(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.substring(0, 1000) + (content.length > 1000 ? '\n...(truncated)' : '');
}

/**
 * Calculates SHA-256 hash of a file.
 * @param {string} filePath - The path to the file.
 * @returns {string} The hexadecimal hash of the file.
 */
export function calculateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

