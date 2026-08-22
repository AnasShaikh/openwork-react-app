import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { EventStreamCodec } from '@smithy/eventstream-codec';
import {
  decodeTranscriptEvent,
  downsampleAudio,
  encodeAudioEvent,
  encodePcm16,
  mergeComposerTranscript,
} from '../src/services/oppyTranscription.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dirname, '..');
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8');
const codec = new EventStreamCodec(
  (value) => textDecoder.decode(value),
  (value) => textEncoder.encode(value),
);

test('dictation preserves existing composer text and remains user-editable', () => {
  assert.equal(mergeComposerTranscript('', 'Find design jobs'), 'Find design jobs');
  assert.equal(mergeComposerTranscript('Oppy,', 'find design jobs'), 'Oppy, find design jobs');
});

test('browser audio is downsampled and encoded as signed 16-bit little-endian PCM', () => {
  const downsampled = downsampleAudio(new Float32Array([1, 1, -1, -1]), 32000, 16000);
  assert.deepEqual(Array.from(downsampled), [1, -1]);

  const pcm = encodePcm16(new Float32Array([-1, 0, 1]));
  const view = new DataView(pcm.buffer);
  assert.equal(view.getInt16(0, true), -32768);
  assert.equal(view.getInt16(2, true), 0);
  assert.equal(view.getInt16(4, true), 32767);
});

test('audio chunks are wrapped in AWS event-stream AudioEvent frames', () => {
  const frame = encodeAudioEvent(new Uint8Array([1, 2, 3]));
  const decoded = codec.decode(frame);
  assert.equal(decoded.headers[':message-type'].value, 'event');
  assert.equal(decoded.headers[':event-type'].value, 'AudioEvent');
  assert.deepEqual(Array.from(decoded.body), [1, 2, 3]);
});

test('Amazon Transcribe event-stream results decode into partial and final transcript updates', () => {
  const frame = codec.encode({
    headers: {
      ':message-type': { type: 'string', value: 'event' },
      ':event-type': { type: 'string', value: 'TranscriptEvent' },
    },
    body: textEncoder.encode(JSON.stringify({
      Transcript: {
        Results: [{
          ResultId: 'result-1',
          IsPartial: false,
          Alternatives: [{ Transcript: 'Show my OpenWork summary' }],
        }],
      },
    })),
  });

  assert.deepEqual(decodeTranscriptEvent(frame), [{
    resultId: 'result-1',
    text: 'Show my OpenWork summary',
    isPartial: false,
  }]);
});

test('Oppy voice UI is explicit, accessible, capped, and never auto-sends', () => {
  const component = fs.readFileSync(path.join(root, 'src/pages/OppyChat/OppyChat.jsx'), 'utf8');
  const service = fs.readFileSync(path.join(root, 'src/services/oppyTranscription.js'), 'utf8');
  const worklet = fs.readFileSync(path.join(root, 'public/oppy-transcription-worklet.js'), 'utf8');

  assert.match(component, /aria-label=\{voiceStatus === 'listening' \? 'Stop voice input' : 'Start voice input'\}/);
  assert.match(component, /mergeComposerTranscript\(voiceBaseInputRef\.current, text\)/);
  assert.doesNotMatch(component, /onTranscript:[\s\S]{0,300}sendMessage/);
  assert.match(service, /setTimeout\(\(\) => stop\('limit'\), session\.maxDurationSeconds \* 1000\)/);
  assert.match(service, /\/api\/transcription\/session/);
  assert.match(worklet, /registerProcessor\('oppy-transcription-processor'/);
});
