import fs from 'fs';
import path from 'path';
import ora from 'ora';
import chalk from 'chalk';
import { formatPathForDocker, stripDockerHeaders } from './utils.js';
import { getAICode } from './ai.js';
import { runInContainer } from './docker.js';

export async function editFile(filePath, options) {
    const spinner = ora('Initializing GhostDock...').start();

    try {
        const absolutePath = path.resolve(filePath);
        const fileDir = path.dirname(absolutePath);
        const dockerSafeDir = formatPathForDocker(fileDir);

        if (!fs.existsSync(absolutePath)) {
            spinner.fail('File not found!');
            return;
        }
        spinner.succeed('GhostDock Initialized.');

        // --- THE SELF-HEALING LOOP ---
        let attempts = 0;
        const MAX_ATTEMPTS = 3;
        let lastError = null;
        let success = false;

        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            
            // Step 1: Get AI Code (Passing error context if it exists)
            // If this is attempt #2, 'lastError' tells Gemini what to fix.
            const aiCode = await getAICode(absolutePath, options.instruction, lastError);
            
            // Optional: Show code for debugging
            // console.log(chalk.gray(aiCode)); 

            // Step 2: Execute in Container
            // runInContainer MUST return { success: boolean, logs: string }
            const result = await runInContainer(aiCode, dockerSafeDir);

            if (result.success) {
                console.log(chalk.green(`\n✔ Success on attempt ${attempts}!`));
                console.log(chalk.blue('\n--- Final Container Logs ---'));
                console.log(result.logs);
                success = true;
                break; // EXIT THE LOOP
            } else {
                // FAILURE: Capture the logs to feed back into the AI
                spinner.warn(`Attempt ${attempts} Failed. Analyzing error...`);
                lastError = result.logs; 
            }
        }

        if (success) {
            console.log(chalk.green('\nProcess Complete. Check your file!'));
        } else {
            console.error(chalk.red(`\n✖ Mission Failed after ${MAX_ATTEMPTS} attempts.`));
            console.error(chalk.yellow('Last Error from Container:'));
            console.error(lastError);
        }

    } catch (error) {
        if (spinner.isSpinning) spinner.stop();
        console.error(chalk.red('Critical Error:', error.message));
    }
}