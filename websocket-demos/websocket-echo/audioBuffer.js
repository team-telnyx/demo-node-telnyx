/**
 * The AudioBuffer class efficiently manages audio data chunks, 
 * Eensuring each chunk, identified by a unique sequence number, is processed once to avoid duplicates. 
 * It buffers audio data until a set time interval elapses, then flushes it via a callback function. 
 * The class supports automatic and manual flushing, and offers methods to check the buffer's emptiness 
 * And to get its size in terms of chunk count.
 * 
 * Constructor Parameters:
 * - flushCallback: A callback function that executes with the combined audio data when the buffer is flushed.
 * - flushInterval: The time interval in milliseconds after which the buffer is automatically flushed. Defaults to 3000ms.
 * 
 * Methods:
 * - add(chunk, sequenceNumber): Adds an audio chunk to the buffer if it has not been processed before. Automatically flushes the buffer if the flush interval is exceeded.
 * - flush(): Combines all buffered chunks and executes the flushCallback with the combined data. Clears the buffer and processed sequence numbers after flushing.
 * - isBufferEmpty(): Returns a boolean indicating whether the buffer is currently empty.
 * - getBufferSize(): Returns the current size of the buffer in terms of the number of chunks it contains.
 */
export class AudioBuffer {

    constructor(flushCallback, flushInterval = 3000) {
        if (typeof flushCallback !== 'function') {
            throw new Error('flushCallback must be a function');
        }
        if (typeof flushInterval !== 'number') {
            throw new Error('flushInterval must be a number');
        }

        this.buffer = [];
        this.flushCallback = flushCallback;
        this.lastFlushTime = Date.now();
        this.flushInterval = flushInterval;
        this.processedSequenceNumbers = new Set();
    }

    add(chunk, sequenceNumber) {
        if (this.processedSequenceNumbers.has(sequenceNumber)) {
            console.log(`Duplicate chunk detected and skipped: Sequence Number ${sequenceNumber}`);
            return;
        }

        this.buffer.push(chunk);
        this.processedSequenceNumbers.add(sequenceNumber);

        const currentTime = Date.now();
        if (currentTime - this.lastFlushTime > this.flushInterval) {
            this.flush();
        }
    }

    flush() {
        if (this.buffer.length > 0) {
            try {
                const combinedChunks = Buffer.concat(this.buffer);
                this.flushCallback(combinedChunks);
                console.log(`Flushed ${this.buffer.length} chunks from the buffer.`);
            } catch (error) {
                console.error('Error flushing audio buffer:', error);
            } finally {
                this.buffer = [];
                this.processedSequenceNumbers.clear();
                this.lastFlushTime = Date.now();
            }
        }
    }

    isBufferEmpty() {
        return this.buffer.length === 0;
    }

    getBufferSize() {
        return this.buffer.length;
    }
}