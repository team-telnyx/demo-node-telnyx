/**
 * Overrides the default console.log behavior to extend logging functionality, 
 * Ensuring all log messages are also written to a file. 
 * It utilizes a custom log file path derived from the current directory, appending messages with timestamps. 
 *
 * The `logToFile` function supports this by writing each log message, along with a timestamp, to 'app.log' 
 * Within the same directory as the script. It handles file write operations asynchronously, logging any errors encountered during the write process to the console.
 *
 * The `setupLogger` function captures and overrides the native console.log method. 
 * It formats log messages, preserving object representations by converting them to JSON strings when necessary, 
 * And delegates both to the original console.log for standard output and to `logToFile` for file logging. 
 *
 * Usage:
 * - Invoke `setupLogger()` at the application's initialization phase 
 * To activate file logging for all subsequent console.log calls.
 */

import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFilePath = path.join(__dirname, 'app.log');

function logToFile(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}${os.EOL}`;

    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

export function setupLogger() {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
        const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
        originalConsoleLog.apply(console, args);
        logToFile(message);
    };
}