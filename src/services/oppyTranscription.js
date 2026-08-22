import { EventStreamCodec } from '@smithy/eventstream-codec';

const TARGET_SAMPLE_RATE = 16000;
const SOCKET_OPEN_TIMEOUT_MS = 8000;
const FINAL_TRANSCRIPT_TIMEOUT_MS = 3000;
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8');
const eventStreamCodec = new EventStreamCodec(
  (value) => textDecoder.decode(value),
  (value) => textEncoder.encode(value),
);

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function joinTranscriptParts(parts) {
  return parts.map((part) => part.trim()).filter(Boolean).join(' ').trim();
}

export function mergeComposerTranscript(existingText, transcript) {
  return joinTranscriptParts([existingText, transcript]);
}

export function downsampleAudio(buffer, inputSampleRate, outputSampleRate = TARGET_SAMPLE_RATE) {
  if (outputSampleRate > inputSampleRate) {
    throw new Error('Audio input sample rate is below the transcription sample rate');
  }
  if (outputSampleRate === inputSampleRate) return buffer;

  const ratio = inputSampleRate / outputSampleRate;
  const result = new Float32Array(Math.round(buffer.length / ratio));
  let inputOffset = 0;

  for (let outputOffset = 0; outputOffset < result.length; outputOffset += 1) {
    const nextInputOffset = Math.min(buffer.length, Math.round((outputOffset + 1) * ratio));
    let sum = 0;
    let count = 0;
    for (let index = inputOffset; index < nextInputOffset; index += 1) {
      sum += buffer[index];
      count += 1;
    }
    result[outputOffset] = count > 0 ? sum / count : 0;
    inputOffset = nextInputOffset;
  }

  return result;
}

export function encodePcm16(samples) {
  const bytes = new Uint8Array(samples.length * 2);
  const view = new DataView(bytes.buffer);
  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    view.setInt16(index * 2, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  });
  return bytes;
}

export function encodeAudioEvent(audioBytes = new Uint8Array()) {
  return eventStreamCodec.encode({
    headers: {
      ':message-type': { type: 'string', value: 'event' },
      ':event-type': { type: 'string', value: 'AudioEvent' },
    },
    body: audioBytes,
  });
}

export function decodeTranscriptEvent(data) {
  const message = eventStreamCodec.decode(new Uint8Array(data));
  const messageType = message.headers[':message-type']?.value;
  const body = JSON.parse(textDecoder.decode(message.body) || '{}');

  if (messageType === 'exception') {
    throw new Error(body.Message || body.message || 'Amazon Transcribe rejected the stream');
  }
  if (message.headers[':event-type']?.value !== 'TranscriptEvent') return [];

  return (body.Transcript?.Results || []).flatMap((result) => {
    const text = result.Alternatives?.[0]?.Transcript?.trim();
    if (!text) return [];
    return [{
      resultId: result.ResultId || '',
      text,
      isPartial: Boolean(result.IsPartial),
    }];
  });
}

export function voiceErrorMessage(error) {
  if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
    return 'Microphone access is blocked. Allow it in your browser settings and try again.';
  }
  if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
    return 'No microphone was found on this device.';
  }
  if (error?.code === 'UNSUPPORTED_BROWSER') {
    return 'Voice input is not supported in this browser. Try the latest Chrome, Safari, or Edge.';
  }
  return 'Voice transcription is unavailable right now. Please try again.';
}

async function fetchSession(backendUrl) {
  const response = await fetch(`${backendUrl}/api/transcription/session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.success || !payload.streamUrl) {
    throw new Error(payload.error || `Transcription session failed (HTTP ${response.status})`);
  }
  return payload;
}

function requireBrowserSupport() {
  if (
    !navigator.mediaDevices?.getUserMedia
    || !window.AudioContext
    || !window.AudioWorkletNode
    || !window.WebSocket
  ) {
    const error = new Error('Required browser audio APIs are unavailable');
    error.code = 'UNSUPPORTED_BROWSER';
    throw error;
  }
}

function waitForSocketOpen(socket) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Transcription connection timed out')), SOCKET_OPEN_TIMEOUT_MS);
    socket.addEventListener('open', () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
    socket.addEventListener('error', () => {
      clearTimeout(timeout);
      reject(new Error('Transcription connection failed'));
    }, { once: true });
  });
}

function flushWorklet(worklet) {
  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, 250);
    const handleMessage = (event) => {
      if (event.data?.type !== 'flushed') return;
      clearTimeout(timeout);
      worklet.port.removeEventListener('message', handleMessage);
      resolve();
    };
    worklet.port.addEventListener('message', handleMessage);
    worklet.port.postMessage({ type: 'flush' });
  });
}

export async function startOppyTranscription({
  backendUrl = '',
  onTranscript = () => {},
  onStatus = () => {},
  onComplete = () => {},
  onError = () => {},
} = {}) {
  requireBrowserSupport();
  onStatus('starting');

  const audioContext = new AudioContext({ latencyHint: 'interactive' });
  let mediaStream;
  let socket;
  let source;
  let worklet;
  let silentGain;
  let maxDurationTimer;
  let stopping = false;
  let cancelled = false;
  let stopPromise;
  let errorReported = false;
  let capturedTranscript = '';
  let partialTranscript = '';
  const finalSegments = [];
  const finalResultIds = new Set();
  let resolveSocketClosed;
  const socketClosed = new Promise((resolve) => { resolveSocketClosed = resolve; });

  const stopCapture = async () => {
    clearTimeout(maxDurationTimer);
    worklet?.disconnect();
    source?.disconnect();
    silentGain?.disconnect();
    mediaStream?.getTracks().forEach((track) => track.stop());
    if (audioContext.state !== 'closed') await audioContext.close().catch(() => {});
  };

  const reportError = async (error) => {
    if (errorReported || cancelled) return;
    errorReported = true;
    await stopCapture();
    if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) {
      socket.close();
    }
    onError(error);
  };

  const stop = (reason = 'manual') => {
    if (stopPromise) return stopPromise;
    stopPromise = (async () => {
      if (cancelled) return;
      stopping = true;
      onStatus('finalizing');
      clearTimeout(maxDurationTimer);
      if (worklet) await flushWorklet(worklet);
      if (socket?.readyState === WebSocket.OPEN) socket.send(encodeAudioEvent());
      await stopCapture();
      await Promise.race([socketClosed, wait(FINAL_TRANSCRIPT_TIMEOUT_MS)]);
      if (socket?.readyState === WebSocket.OPEN) socket.close(1000, 'Dictation complete');
      onStatus('idle');
      onComplete({ hadTranscript: Boolean(capturedTranscript.trim()), reason });
    })();
    return stopPromise;
  };

  const cancel = async () => {
    cancelled = true;
    stopping = true;
    clearTimeout(maxDurationTimer);
    await stopCapture();
    if (socket?.readyState === WebSocket.OPEN || socket?.readyState === WebSocket.CONNECTING) {
      socket.close(1000, 'Dictation cancelled');
    }
  };

  try {
    // This call happens immediately within the user's click, which keeps the
    // microphone permission flow reliable on mobile Safari.
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
      video: false,
    });

    const session = await fetchSession(backendUrl);
    socket = new WebSocket(session.streamUrl);
    socket.binaryType = 'arraybuffer';
    socket.addEventListener('close', () => {
      resolveSocketClosed();
      if (!stopping && !cancelled) reportError(new Error('Transcription connection closed unexpectedly'));
    });
    socket.addEventListener('error', () => {
      if (!stopping && !cancelled) reportError(new Error('Transcription connection failed'));
    });
    socket.addEventListener('message', (event) => {
      try {
        decodeTranscriptEvent(event.data).forEach((result) => {
          if (result.isPartial) {
            partialTranscript = result.text;
          } else {
            partialTranscript = '';
            if (!result.resultId || !finalResultIds.has(result.resultId)) {
              finalSegments.push(result.text);
              if (result.resultId) finalResultIds.add(result.resultId);
            }
          }
          capturedTranscript = joinTranscriptParts([...finalSegments, partialTranscript]);
          onTranscript({ text: capturedTranscript, isPartial: result.isPartial });
        });
      } catch (error) {
        reportError(error);
      }
    });

    await waitForSocketOpen(socket);
    await audioContext.audioWorklet.addModule('/oppy-transcription-worklet.js');
    if (audioContext.state === 'suspended') await audioContext.resume();

    source = audioContext.createMediaStreamSource(mediaStream);
    worklet = new AudioWorkletNode(audioContext, 'oppy-transcription-processor');
    silentGain = audioContext.createGain();
    silentGain.gain.value = 0;
    worklet.port.onmessage = (event) => {
      if (event.data?.type !== 'audio' || socket.readyState !== WebSocket.OPEN || stopping) return;
      const downsampled = downsampleAudio(event.data.samples, audioContext.sampleRate, session.sampleRate);
      socket.send(encodeAudioEvent(encodePcm16(downsampled)));
    };
    source.connect(worklet);
    worklet.connect(silentGain);
    silentGain.connect(audioContext.destination);

    maxDurationTimer = setTimeout(() => stop('limit'), session.maxDurationSeconds * 1000);
    onStatus('listening');
    return { cancel, stop };
  } catch (error) {
    await cancel();
    throw error;
  }
}
