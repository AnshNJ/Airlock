/**
 * Docker-related utility functions
 */

/**
 * STRIPS DOCKER HEADERS (The Magic Fix)
 * Docker attaches an 8-byte header to every log line. We must remove it.
 */
export function stripDockerHeaders(buffer) {
    let output = '';
    let i = 0;
    while (i < buffer.length) {
        if (i + 8 > buffer.length) break;
        // The size of the message is stored in bytes 4-7
        const payloadSize = buffer.readUInt32BE(i + 4);
        const payloadStart = i + 8;
        const payloadEnd = payloadStart + payloadSize;
        
        if (payloadEnd > buffer.length) break;
        
        output += buffer.subarray(payloadStart, payloadEnd).toString('utf-8');
        i = payloadEnd;
    }
    return output;
}

/**
 * Formats a Windows-style path to a format Docker can understand.
 * e.g., "D:\GhostDock" -> "/d/GhostDock"
 * @param {string} rawPath - The original file path.
 * @returns {string} The Docker-compatible path.
 */
export function formatPathForDocker(rawPath) {
  let safePath = rawPath.replace(/\\/g, '/');
  
  if (/^[a-zA-Z]:\//.test(safePath)) {
    const driveLetter = safePath.charAt(0).toLowerCase();
    safePath = `/${driveLetter}${safePath.slice(2)}`;
  }
  return safePath;
}

