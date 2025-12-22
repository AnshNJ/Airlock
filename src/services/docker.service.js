import Docker from 'dockerode';
import ora from 'ora';
import { stripDockerHeaders } from '../utils/dockerUtils.js';
import logger from '../utils/logger.js';

const docker = new Docker();

/**
 * Runs the AI-generated Python code in a sandboxed Docker container.
 * @param {string} aiCode - The Python code to execute.
 * @param {string} dockerSafeDir - The directory to mount into the container.
 * @returns {Promise<void>}
 */
export async function runInContainer(aiCode, dockerSafeDir) {
    const spinner = ora('Spinning up OFFLINE container...').start();
    let container;

    try {
        container = await docker.createContainer({
            Image: 'ghostdock-base',
            Cmd: ['python', '-c', aiCode],
            NetworkDisabled: true,
            HostConfig: {
                Binds: [`${dockerSafeDir}:/data`]
            }
        });

        await container.start();
        const data = await container.wait();
        const logsBuffer = await container.logs({ stdout: true, stderr: true });
        const cleanLogs = stripDockerHeaders(logsBuffer);

        spinner.succeed('Container execution finished.');

        return {
            success: data.StatusCode === 0,
            logs: cleanLogs
        };

    } finally {
        if (container) {
            await container.remove();
        }
    }
}