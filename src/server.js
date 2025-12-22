#!/usr/bin/env node
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './models/AuditLog.js';
import logger from './utils/logger.js';
import apiRoutes from './routes/api.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database connection if DATABASE_URL is set
if (process.env.DATABASE_URL) {
    initDB().catch((error) => {
        logger.error('Database initialization failed:', error.message);
        logger.warn('Continuing without audit logging...');
    });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use('/api', apiRoutes);

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
    const frontendBuildPath = path.join(__dirname, '..', 'frontend', 'dist');
    app.use(express.static(frontendBuildPath));
    
    // Serve React app for all non-API routes
    app.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
    if (process.env.NODE_ENV !== 'production') {
        logger.info(`API available at http://localhost:${PORT}/api`);
    }
});

export default app;

