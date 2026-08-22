'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  createPresignedTranscriptionSession,
  createStreamingRequest,
  getTranscriptionConfig,
} = require('../services/transcribe-session');

test('Transcribe config defaults to Indian English and bounded session settings', () => {
  const config = getTranscriptionConfig({
    AWS_REGION: 'us-east-1',
    TRANSCRIBE_AWS_REGION: 'ap-south-1',
  });

  assert.equal(config.region, 'ap-south-1');
  assert.equal(config.languageCode, 'en-IN');
  assert.equal(config.sampleRate, 16000);
  assert.equal(config.maxDurationSeconds, 45);
  assert.equal(config.urlTtlSeconds, 60);
});

test('streaming request uses PCM, stabilized partial results, and an optional vocabulary', () => {
  const config = getTranscriptionConfig({
    AWS_REGION: 'ap-south-1',
    TRANSCRIBE_LANGUAGE_CODE: 'en-IN',
    TRANSCRIBE_VOCABULARY_NAME: 'openwork-india',
  });
  const request = createStreamingRequest(config);

  assert.equal(request.hostname, 'transcribestreaming.ap-south-1.amazonaws.com');
  assert.equal(request.port, 8443);
  assert.equal(request.path, '/stream-transcription-websocket');
  assert.equal(request.query['language-code'], 'en-IN');
  assert.equal(request.query['media-encoding'], 'pcm');
  assert.equal(request.query['sample-rate'], '16000');
  assert.equal(request.query['enable-partial-results-stabilization'], 'true');
  assert.equal(request.query['partial-results-stability'], 'high');
  assert.equal(request.query['vocabulary-name'], 'openwork-india');
});

test('session response exposes only a short-lived presigned WebSocket URL and public metadata', async () => {
  let capturedRequest;
  let capturedOptions;
  const signer = {
    async presign(request, options) {
      capturedRequest = request;
      capturedOptions = options;
      return {
        ...request,
        query: {
          ...request.query,
          'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
          'X-Amz-Signature': 'test-signature',
        },
      };
    },
  };

  const session = await createPresignedTranscriptionSession({
    env: { AWS_REGION: 'ap-south-1' },
    signer,
    now: Date.parse('2026-08-22T00:00:00.000Z'),
  });

  assert.equal(capturedOptions.expiresIn, 60);
  assert.equal(capturedRequest.query['language-code'], 'en-IN');
  assert.match(session.streamUrl, /^wss:\/\/transcribestreaming\.ap-south-1\.amazonaws\.com:8443\//);
  assert.match(session.streamUrl, /X-Amz-Signature=test-signature/);
  assert.equal(session.languageCode, 'en-IN');
  assert.equal(session.maxDurationSeconds, 45);
  assert.equal(session.expiresAt, '2026-08-22T00:01:00.000Z');
  assert.deepEqual(Object.keys(session).sort(), [
    'expiresAt',
    'languageCode',
    'maxDurationSeconds',
    'sampleRate',
    'streamUrl',
  ]);
});

test('transcription route is rate limited and never logs or embeds AWS credentials', () => {
  const route = fs.readFileSync(path.join(__dirname, '../routes/transcription.js'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '../services/transcribe-session.js'), 'utf8');

  assert.match(route, /createRateLimiter/);
  assert.match(route, /Cache-Control', 'no-store'/);
  assert.doesNotMatch(route, /streamUrl.*console|console.*streamUrl/);
  assert.doesNotMatch(service, /accessKeyId\s*:|secretAccessKey\s*:/);
});
