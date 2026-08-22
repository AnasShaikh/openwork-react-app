# OpenWork App Runner permissions

`oppy-runtime-policy.json` is the least-privilege inline policy used by the
`OpenWorkAppRunnerInstanceRole` for Agent Oppy. It permits inference only through
the US Claude Sonnet 4.6 inference profile and the three foundation-model destinations
currently listed by that profile. It also permits starting Amazon Transcribe Streaming
WebSocket sessions for the voice-to-composer feature.

The Transcribe action uses `Resource: "*"` because this streaming API does not expose
a resource ARN that IAM can constrain. The application reduces exposure at its own
boundary with fixed server-side language and encoding parameters, short-lived signed
URLs, per-IP session rate limiting and a hard recording duration. The signed URL must
not be logged.

Sonnet 5 was catalog-visible and reported authorized on 9 August 2026, but a real
runtime invocation was sales-gated for this account. Sonnet 4.6 was then verified
with a successful live invocation and selected as the closest available model.

The application uses the App Runner instance role through the AWS SDK default
credential chain. Static AWS access keys must not be added to App Runner environment
variables or repository configuration.

Apply this policy to the instance role, not the App Runner access role. Operational
details and verification steps are in `docs/oppy-voice-transcription.md`.
