class OppyTranscriptionProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.chunkSize = 4096;
    this.chunk = new Float32Array(this.chunkSize);
    this.offset = 0;
    this.port.onmessage = (event) => {
      if (event.data?.type === 'flush') {
        this.flush();
        this.port.postMessage({ type: 'flushed' });
      }
    };
  }

  emit(samples) {
    this.port.postMessage({ type: 'audio', samples }, [samples.buffer]);
  }

  flush() {
    if (this.offset === 0) return;
    this.emit(this.chunk.slice(0, this.offset));
    this.chunk = new Float32Array(this.chunkSize);
    this.offset = 0;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    let sourceOffset = 0;
    while (sourceOffset < input.length) {
      const copyLength = Math.min(input.length - sourceOffset, this.chunkSize - this.offset);
      this.chunk.set(input.subarray(sourceOffset, sourceOffset + copyLength), this.offset);
      this.offset += copyLength;
      sourceOffset += copyLength;

      if (this.offset === this.chunkSize) {
        this.emit(this.chunk);
        this.chunk = new Float32Array(this.chunkSize);
        this.offset = 0;
      }
    }

    return true;
  }
}

registerProcessor('oppy-transcription-processor', OppyTranscriptionProcessor);
