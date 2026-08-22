# Oppy voice-to-composer transcription

## Scope

Oppy voice input is dictation, not conversational audio. A user taps the microphone,
speaks, stops recording and reviews an editable transcript in the existing chat
composer. Oppy never sends the transcript automatically. The normal Send action is
the only path that submits text to `/api/chat`.

The production default is Amazon Transcribe Streaming with Indian English (`en-IN`).
This is deliberately separate from the Bedrock model that answers the resulting chat
message.

## Runtime design

1. The browser requests microphone permission after an explicit user click.
2. The backend creates a SigV4-presigned Amazon Transcribe WebSocket URL from the App
   Runner instance role and returns it from `POST /api/transcription/session`.
3. The browser captures mono audio with an `AudioWorklet`, downsamples it to 16 kHz,
   encodes signed 16-bit little-endian PCM and sends AWS event-stream frames directly
   to Transcribe.
4. Partial and final `TranscriptEvent` results update the Oppy composer while keeping
   any text that was already present.
5. Stop sends an empty `AudioEvent`, waits briefly for the final transcript, closes
   the WebSocket, stops every microphone track and closes the audio context.

Audio does not pass through the OpenWork backend and OpenWork does not store a
recording or transcript as part of this feature. Amazon Transcribe receives the live
audio stream. The transcript becomes normal chat data only if the user presses Send.

## Security and cost controls

- AWS credentials remain in the App Runner instance-role credential chain. No static
  credentials are in the browser, environment configuration or repository.
- Presigned WebSocket URLs expire after 60 seconds and responses use
  `Cache-Control: no-store`. Never log a signed URL.
- Session creation is limited to six requests per IP per minute by default.
- Each recording stops after 45 seconds by default.
- Language, PCM encoding and sample rate are set by the backend rather than accepted
  from the browser.
- IAM grants only `transcribe:StartStreamTranscriptionWebSocket`. AWS requires
  `Resource: "*"` for this action because it has no resource-level ARN.
- The feature does not grant batch transcription, S3 access or broader Transcribe
  administration permissions.

The policy source of truth is `infra/app-runner/oppy-runtime-policy.json`.

## Configuration

Backend environment variables:

| Variable | Default | Purpose |
|---|---:|---|
| `TRANSCRIBE_AWS_REGION` | `AWS_REGION`, then `us-east-1` | Region used for the streaming endpoint |
| `TRANSCRIBE_LANGUAGE_CODE` | `en-IN` | Amazon Transcribe language-locale code |
| `TRANSCRIBE_MAX_DURATION_SECONDS` | `45` | Browser recording cap, accepted range 10–300 |
| `TRANSCRIBE_SESSION_URL_TTL_SECONDS` | `60` | Presigned URL lifetime, accepted range 15–300 |
| `TRANSCRIBE_SESSIONS_PER_MINUTE` | `6` | Per-IP session creation limit |
| `TRANSCRIBE_VOCABULARY_NAME` | empty | Optional vocabulary in the configured region |

Keep `TRANSCRIBE_LANGUAGE_CODE=en-IN` for the Indian English launch. A custom
vocabulary can improve OpenWork names and domain terms later; create and evaluate it
before setting the optional environment variable.

## Browser support and UX

The feature requires HTTPS plus `getUserMedia`, `AudioContext`, `AudioWorkletNode` and
WebSocket support. Current Chrome, Edge and Safari releases are the supported target.
If microphone permission is denied, no device exists or a required API is missing,
Oppy leaves typed text untouched and displays a recoverable message. While recording,
the composer and Send button are disabled to prevent transcript/edit races.

The microphone button has explicit Start/Stop accessible names, a pressed state,
visible keyboard focus and a live status message. A red stop icon indicates active
capture. Stopping never submits the text.

## Verification

Pre-release gates:

```bash
npm test
npm run build
cd backend && npm test
git diff --check
```

Production smoke test:

1. Open `https://app.openwork.technology/chat` in a supported browser.
2. Enter a few words in the composer, tap the microphone and allow permission.
3. Speak a sentence using an Indian English accent, then tap the red stop button.
4. Confirm the original words and transcript are both present and editable.
5. Confirm no message appears in the chat until Send is pressed.
6. Refresh browser permissions or inspect the address-bar microphone indicator to
   confirm capture ends after Stop.

The session endpoint should return HTTP 200 with `success`, a `wss://` URL,
`languageCode: "en-IN"`, `sampleRate: 16000` and the configured duration. Do not copy
the returned signed URL into tickets or logs.

## Troubleshooting

- `403` or a WebSocket close from AWS: verify the App Runner instance role contains
  `transcribe:StartStreamTranscriptionWebSocket` and the signing region supports the
  selected language.
- Session endpoint `503`: inspect App Runner logs for the sanitized
  `[transcription] session creation failed` event and verify the role credential chain.
- Microphone permission error: enable microphone access for the site at the browser or
  operating-system level, then retry.
- Empty transcript: confirm the correct input device, reduce background noise and
  verify audio capture was not muted by the operating system.
- Product terms are misheard: evaluate an `en-IN` custom vocabulary and then set
  `TRANSCRIBE_VOCABULARY_NAME`; do not silently change the launch language.

Rollback is the normal immutable App Runner image rollback. If IAM must also be
rolled back, remove only the `StartOppyStreamingTranscription` statement after the old
image is active so the running application and role never drift.
