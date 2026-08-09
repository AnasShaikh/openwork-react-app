# OpenWork App Runner permissions

`bedrock-sonnet-4-6-policy.json` is the least-privilege inline policy used by the
`OpenWorkAppRunnerInstanceRole` for Agent Oppy. It permits inference only through
the US Claude Sonnet 4.6 inference profile and the three foundation-model destinations
currently listed by that profile.

Sonnet 5 was catalog-visible and reported authorized on 9 August 2026, but a real
runtime invocation was sales-gated for this account. Sonnet 4.6 was then verified
with a successful live invocation and selected as the closest available model.

The application uses the App Runner instance role through the AWS SDK default
credential chain. Static AWS access keys must not be added to App Runner environment
variables or repository configuration.
