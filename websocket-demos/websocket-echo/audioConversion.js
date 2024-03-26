/**
 * Converts PCMU (G.711 mu-law) audio data encoded in base64 to MP3 format, 
 * Returning the result as a base64-encoded string via a callback. 
 * This function initializes an FFmpeg process to perform the audio format conversion and apply noise reduction. 
 * It decodes the input base64 string to a buffer, feeds the audio data to FFmpeg through stdin, 
 * And collects the MP3 output from stdout.
 *
 * @param {string} pcmuBuffer The PCMU audio data encoded as a base64 string.
 * @param {Function} callback 
 * A callback function that is invoked with the MP3 data encoded as base64 upon successful conversion, 
 * Or an error if the conversion fails.
 *
 * The function listens for data from FFmpeg's stdout to construct the MP3 buffer
 * And encodes this buffer to base64 upon process completion. 
 * It handles FFmpeg process exit and error events
 * To ensure proper callback invocation with either the converted audio data or an error.
 */

import { spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from '@ffmpeg-installer/ffmpeg';

ffmpeg.setFfmpegPath(ffmpegPath.path);

export function pcmuToMp3Base64(pcmuBuffer, callback) {
    const pcmuDecodedBuffer = Buffer.from(pcmuBuffer, 'base64');

    const ffmpegProcess = spawn(ffmpegPath.path, [
        '-f', 'mulaw',
        '-ar', '8000',
        '-ac', '1',
        '-i', 'pipe:0',
        '-af', 'silencedetect=noise=-30dB:d=0.5',
        '-f', 'mp3',
        'pipe:1'
    ], { stdio: ['pipe', 'pipe', 'inherit'] });

    let mp3Buffer = Buffer.alloc(0);

    ffmpegProcess.stdout.on('data', (chunk) => {
        mp3Buffer = Buffer.concat([mp3Buffer, chunk]);
    });

    ffmpegProcess.on('close', (code) => {
        if (code === 0) {
            const mp3Base64 = mp3Buffer.toString('base64');
            callback(mp3Base64);
        } else {
            console.error(`FFmpeg exited with code ${code}`);
            callback(null, new Error(`FFmpeg exited with code ${code}`));
        }
    });

    ffmpegProcess.on('error', (err) => {
        console.error('Failed to start FFmpeg process:', err);
        callback(null, err);
    });

    ffmpegProcess.stdin.write(pcmuDecodedBuffer);
    ffmpegProcess.stdin.end();
}