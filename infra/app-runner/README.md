# OpenWork App Runner permissions

`bedrock-sonnet-5-policy.json` is the least-privilege inline policy used by the
`OpenWorkAppRunnerInstanceRole` for Agent Oppy. It permits inference only through
the US Claude Sonnet 5 inference profile and the three foundation-model destinations
currently listed by that profile.

The application uses the App Runner instance role through the AWS SDK default
credential chain. Static AWS access keys must not be added to App Runner environment
variables or repository configuration.
