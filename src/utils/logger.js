import chalk from 'chalk';

/**
 * Simple logger utility with log levels and color support
 * Log levels: error, warn, info, debug
 * Set LOG_LEVEL environment variable to control verbosity (default: info)
 */

const LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LOG_LEVELS.info;

const logger = {
    error: (message, ...args) => {
        if (LOG_LEVEL >= LOG_LEVELS.error) {
            console.error(chalk.red('✖'), message, ...args);
        }
    },

    warn: (message, ...args) => {
        if (LOG_LEVEL >= LOG_LEVELS.warn) {
            console.warn(chalk.yellow('⚠'), message, ...args);
        }
    },

    info: (message, ...args) => {
        if (LOG_LEVEL >= LOG_LEVELS.info) {
            console.log(chalk.blue('ℹ'), message, ...args);
        }
    },

    success: (message, ...args) => {
        if (LOG_LEVEL >= LOG_LEVELS.info) {
            console.log(chalk.green('✔'), message, ...args);
        }
    },

    debug: (message, ...args) => {
        if (LOG_LEVEL >= LOG_LEVELS.debug) {
            console.log(chalk.gray('🔍'), message, ...args);
        }
    },

    // For raw output (like container logs)
    raw: (message) => {
        if (LOG_LEVEL >= LOG_LEVELS.info) {
            console.log(message);
        }
    },

    // For code preview (debug level)
    code: (code) => {
        if (LOG_LEVEL >= LOG_LEVELS.debug) {
            console.log(chalk.gray('\n--- Generated Code ---'));
            console.log(chalk.gray(code));
        }
    }
};

export default logger;

