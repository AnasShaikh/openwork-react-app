'use strict';

const { Sha256 } = require('@aws-crypto/sha256-js');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { formatUrl } = require('@aws-sdk/util-format-url');
const { HttpRequest } = require('@smithy/protocol-http');
const { SignatureV4 } = require('@smithy/signature-v4');

const DEFAULT_LANGUAGE_CODE = 'en-IN';
const DEFAULT_SAMPLE_RATE = 16000;
const DEFAULT_MAX_DURATION_SECONDS = 45;
const DEFAULT_URL_TTL_SECONDS = 60;

function boundedInteger(value, fallback, { min, max }) {
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}

function getTranscriptionConfig(env = process.env) {
  const region = String(env.TRANSCRIBE_AWS_REGION || env.AWS_REGION || 'us-east-1').trim();
  const languageCode = String(env.TRANSCRIBE_LANGUAGE_CODE || DEFAULT_LANGUAGE_CODE).trim();
  const vocabularyName = String(env.TRANSCRIBE_VOCABULARY_NAME || '').trim();

  if (!/^[a-z]{2}(?:-[a-z0-9]+)+$/i.test(region)) {
    throw new Error('AWS_REGION is invalid');
  }
  if (!/^[a-z]{2}-[A-Z]{2}$/.test(languageCode)) {
    throw new Error('TRANSCRIBE_LANGUAGE_CODE must be a language-locale code such as en-IN');
  }
  if (vocabularyName && !/^[0-9A-Za-z._-]{1,200}$/.test(vocabularyName)) {
    throw new Error('TRANSCRIBE_VOCABULARY_NAME contains unsupported characters');
  }

  return {
    region,
    languageCode,
    vocabularyName,
    sampleRate: DEFAULT_SAMPLE_RATE,
    maxDurationSeconds: boundedInteger(
      env.TRANSCRIBE_MAX_DURATION_SECONDS,
      DEFAULT_MAX_DURATION_SECONDS,
      { min: 10, max: 300 },
    ),
    urlTtlSeconds: boundedInteger(
      env.TRANSCRIBE_SESSION_URL_TTL_SECONDS,
      DEFAULT_URL_TTL_SECONDS,
      { min: 15, max: 300 },
    ),
  };
}

function createTranscribeSigner(config) {
  return new SignatureV4({
    credentials: defaultProvider(),
    region: config.region,
    service: 'transcribe',
    sha256: Sha256,
  });
}

function createStreamingRequest(config) {
  const hostname = `transcribestreaming.${config.region}.amazonaws.com`;
  const query = {
    'enable-partial-results-stabilization': 'true',
    'language-code': config.languageCode,
    'media-encoding': 'pcm',
    'partial-results-stability': 'high',
    'sample-rate': String(config.sampleRate),
  };

  if (config.vocabularyName) query['vocabulary-name'] = config.vocabularyName;

  return new HttpRequest({
    protocol: 'https:',
    hostname,
    port: 8443,
    method: 'GET',
    path: '/stream-transcription-websocket',
    headers: { host: `${hostname}:8443` },
    query,
  });
}

async function createPresignedTranscriptionSession({
  env = process.env,
  signer,
  now = Date.now(),
} = {}) {
  const config = getTranscriptionConfig(env);
  const resolvedSigner = signer || createTranscribeSigner(config);
  const signedRequest = await resolvedSigner.presign(createStreamingRequest(config), {
    expiresIn: config.urlTtlSeconds,
  });

  // Only the already-signed WebSocket URL reaches the browser. The App Runner
  // role credentials and signing operation remain on the server.
  const streamUrl = formatUrl({ ...signedRequest, protocol: 'wss:' });

  return {
    streamUrl,
    languageCode: config.languageCode,
    sampleRate: config.sampleRate,
    maxDurationSeconds: config.maxDurationSeconds,
    expiresAt: new Date(now + config.urlTtlSeconds * 1000).toISOString(),
  };
}

module.exports = {
  DEFAULT_LANGUAGE_CODE,
  DEFAULT_MAX_DURATION_SECONDS,
  DEFAULT_SAMPLE_RATE,
  DEFAULT_URL_TTL_SECONDS,
  createPresignedTranscriptionSession,
  createStreamingRequest,
  getTranscriptionConfig,
};
