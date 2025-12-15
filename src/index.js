#!/usr/bin/env node
import 'dotenv/config';
import { Command } from 'commander';
import { editFile } from './services/fileEdit.service.js';
import { initDB } from './models/AuditLog.js';
import logger from './utils/logger.js';

// Initialize database connection if DATABASE_URL is set
if (process.env.DATABASE_URL) {
    initDB().catch((error) => { 
        logger.error('Database initialization failed:', error.message);
        logger.warn('Continuing without audit logging...');
    });
}

const program = new Command();

program
  .name('ghostdock')
  .description('Securely modify local files using AI')
  .version('1.0.0');

// Server mode - start Express server
program
  .command('server')
  .description('Start the web server')
  .action(() => {
    import('./server.js').catch((error) => {
      logger.error('Failed to start server:', error.message);
      process.exit(1);
    });
  });

// CLI edit command
program
  .command('edit')
  .argument('<file>', 'The file you want to modify')
  .option('-i, --instruction <text>', 'Instruction')
  .action(editFile);

program.parse();