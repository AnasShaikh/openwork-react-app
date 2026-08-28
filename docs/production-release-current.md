# Current OpenWork Production Release

This file is the canonical application release pointer. It describes deployed application infrastructure only; it does not claim that unexecuted smart-contract source changes are live on-chain.

## Active release

| Field | Value |
|---|---|
| Deployed at | 28 August 2026 11:21 IST |
| Git branch | `main` |
| Git commit | `d05197d09c09590d460421d65a78e95a03d128dc` |
| Release gate | GitHub CI `33145233064`; frontend tests (`133/133`), backend tests (`95/95`), backend high-severity production dependency gate, JavaScript parse checks, production frontend build and `git diff --check` passed; local desktop/mobile and production browser QA passed; CodeBuild, App Runner, public endpoint, natural-language action, live read-tool and production-log checks succeeded |
| Source archive | `s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-d05197d09c09590d460421d65a78e95a03d128dc.zip` |
| Source archive SHA-256 | `e477b6c39a836c6228e2472b573cdd217751eda087f4acfc9109894da2ae05ad` |
| CodeBuild | `openwork-react-app-prod-build:c429d1cf-2362-44f9-94b4-815a96497aaf` — succeeded |
| ECR image | `openwork-app:prod-d05197d-20260828053758` |
| ECR digest | `sha256:5bf88fdd1066c5e38608f923566889cf227f6b55d9c6a75650a094aa00d9af3e` |
| App Runner service | `openwork-react-app-prod` |
| App Runner operation | `91ff14a935014bb9acdbe7306cf936c3` — succeeded |
| Public application | `https://app.openwork.technology` |
| Deployed JS asset | `/assets/index-DqLq8psL.js` — SHA-256 `87126c9a347fd87eb295ba4f76169ca14b07dfe79faed715949dbfe8bb3ea155` |
| Rollback target | `openwork-app:prod-72bca49-20260826100546` |
| Rollback digest | `sha256:ba7507a27c997c20cc83f68a211c1a61684b123b52ea17dcf009cb21c968596b` |

## Oppy bounded natural-language transaction agent

Oppy now treats deterministic intent matching as a fast path rather than a capability
limit. When ordinary wording does not match a predefined phrase, Sonnet can select one
validated review-card action from the user's meaning or request a bounded read-only
inspection. The four live readers cover source receipts plus cross-chain delivery,
native and USDC funding, canonical job state and the latest sanitized wallet attempt.
Several independent reads are executed in parallel and returned in one tool-result
round; the model must then answer. The default ceiling is two model calls, one read
round, 12 safe history messages, a 1,000-token transaction response and a 20 KiB
tool-result payload. Common deterministic balance, identity, explorer and exact status
questions continue to use zero Bedrock calls.

The model still cannot broadcast a write. It can produce only one allowlisted review
card, after which the existing browser preflight and the user's selected wallet remain
the signing boundary. Mixed or multiple write calls fail closed. Live evidence never
unlocks retry while a receipt is pending or unavailable, and provider failure is
reported rather than converted into a success claim.

The cross-chain status card now publishes each live poll into the transaction memory
used by the next message. This removes the stale-chip failure where a completed direct
contract status remained visually attached while the user had moved on to a payment
release; every update is keyed to its source transaction and action.

Production acceptance used no wallet and submitted no transaction. The layman request
`Set aside 0.1 USDC for ... to polish a React screen` produced a validated
`startDirectContract` review card with the exact recipient and 0.1 USDC budget in one
model call. A second request—`The last thing still feels stuck ... should I poke it
again?`—batched `inspectLatestAttempt` and `inspectTransaction`, verified XDC receipt
`0xecc503...1090b`, LayerZero delivery and canonical job `30365-10`, then correctly
answered that the action was complete and must not be retried. Production logs recorded
one call/zero reads for the review and two calls/two reads for the live diagnosis; no
prompt or raw tool result was logged.

`/healthz`, `/`, and `/chat` returned HTTP 200. The deployed browser rendered the
reviewed chat with no warnings or errors; the local 390×844 gate had zero horizontal
overflow and preserved a 42×42 px Send control. The release changed application and
documentation code only. It made no smart-contract deployment, token transfer,
approval or wallet signature. The known no-database and low relayer-wallet warnings
remain operationally separate from Oppy's non-custodial transaction workflow.

## Oppy deterministic action execution and retry

Oppy previously allowed the model to respond to a retry request with prose such as
`Preparing the transaction card now` without actually emitting a transaction tool.
The chat now persists the exact validated action associated with the latest attempt,
revalidates it on the backend and deterministically replays it for natural retry
commands such as `try again`, `retry it`, `go ahead` and `Prepared?`. The current
message still wins when the user explicitly requests a different action.

Failures that occur before any write adapter is entered—including wallet discovery
or network-switch failures—are now recorded as pre-broadcast failures with an
explicit `Safe to retry` state. Once a write-capable adapter has been entered, the
existing conservative transaction diagnostics continue to protect pending, unknown
or potentially broadcast transactions from accidental duplication. Stored actions
are allowlisted, bounded and validated on both client and server.

Local QA reproduced a missing-wallet pre-submission failure, verified the new
plain-language diagnostic and sent the exact reported command
`have updated RPC lets try again`. The same action card returned immediately with the
original title, 0.1 USDC budget, description, freelancer and XDC intent. The identical
flow passed on production after rollout. The application log recorded
`replayed verified safe action` for `startDirectContract`, proving that the backend
used deterministic replay rather than a model promise. The public bundle contains the
new pre-submission and persisted-action markers, `/healthz` returned
`{"status":"ok"}` and App Runner reports `RUNNING` on the immutable image above.
The browser used for verification had no EVM wallet, so no signature, approval or
on-chain transaction was requested or submitted.

## Oppy transaction copilot

Oppy now observes every supported chat-initiated write as a bounded transaction
attempt. It records wallet and chain state, the approval and action phases, separate
transaction hashes, broadcast and receipt progress, public-RPC freshness, native gas
balance and pending nonce gaps. When an attempt stalls or fails, the chat explains
what happened in plain language, gives the next useful step, exposes optional technical
details and can recheck the live chain state without leaving `/chat`.

Retry is deliberately state-based rather than model-decided. Confirmed, pending and
unknown transactions are protected from duplicate submission. A retry is enabled for
definitive pre-broadcast failures, user cancellation and reverted transactions; a
missing transaction can be treated as dropped only after at least 30 seconds and three
independent public-RPC misses. Oppy memory receives only a bounded sanitized summary:
no private keys, signatures, raw calldata or secrets are stored or sent to the model.

All Oppy-supported writes use the same tracked adapter, including USDC approval,
job posting, applying, direct contracts, starting work, submissions, payments,
disputes and profile creation. Regression coverage exercises classification,
hash/receipt transitions, retry protection, memory sanitization and model context.
The maintenance model, state machine, privacy boundary, limitations and test matrix
are documented in `docs/oppy-transaction-copilot.md`.

Local and production browser QA used a no-wallet pre-broadcast failure so no signature
or transaction could be created. Production correctly displayed `No signing wallet
was available`, preserved `Safe to retry` after a live-status check, and kept the
diagnostic and recovery controls fully visible above the composer. At 1280×720 the
chat was scrolled to the recovery state, the full diagnostic was visible and horizontal
overflow was zero. `/healthz` returned `{"status":"ok"}`, App Runner served the exact
immutable image above and the deployed bundle contained all diagnostic and guarded-
retry markers.

The first immutable-source CodeBuild attempt
`openwork-react-app-prod-build:55cda4ae-e56e-4dfe-90f5-d6b89c247f3c`
failed in `DOWNLOAD_SOURCE` because the CodeBuild role lacks `s3:ListBucket`; it
produced no image. The documented canonical-source fallback then built the exact
release archive. The canonical source object was restored immediately after source
download, before deployment.

## Oppy explicit multi-wallet transaction binding

Oppy previously used the browser-global `window.ethereum` provider. In Brave with
both Brave Wallet and MetaMask installed, the global belonged to MetaMask while the
user was watching the Brave Wallet panel. The XDC USDC preflight succeeded through
OpenWork's read-only RPC, but the approval write went to MetaMask, which returned
`RPC endpoint not found or unavailable`; consequently Brave Wallet showed no request.
No approval or contract transaction was submitted in the reported attempt.

Oppy now discovers wallets through EIP-6963 and the legacy injected-provider array.
One installed wallet is selected automatically; two or more require an explicit
choice in the chat wallet row, and that choice is remembered. The selected wallet is
named on every review card and the exact provider object is passed to account reads,
network switching, USDC approval and every OpenWork write adapter. Provider/RPC
failures identify the selected wallet and network and state that no transaction was
submitted instead of leaving the card in a misleading pending state.

Automated coverage includes real provider-selection behavior for Brave Wallet,
MetaMask and an EIP-6963 Coinbase announcement. Local visual QA reviewed the connected
wallet row and direct-contract review card at desktop and 390×844; the mobile selector
is 42 px and the page has no horizontal overflow. Production returned HTTP 200 for
`/chat`, `/healthz` returned `{"status":"ok"}`, the live JS and CSS assets contained
the wallet-selection markers, the 390 px live chat had no horizontal overflow and its
voice and Send controls remained 42×42 px. Live browser logs contained no warnings or
errors. Verification did not request a signature, approve USDC, move tokens or submit
an on-chain transaction.

The first immutable CodeBuild attempt
`openwork-react-app-prod-build:3b056afc-2cd1-462f-bcb3-643ce425e3da`
failed during `DOWNLOAD_SOURCE` because the build role lacks `s3:ListBucket`; it
produced no image. The documented pinned-project-source fallback built the exact
archive above, and the CodeBuild project source was restored immediately to
`source/openwork-react-app-src.zip` before deployment.

## Oppy chat-native job workflows

Oppy now keeps job exploration, job deep-dives, applications, hiring, work
submissions, milestone releases, disputes, direct contracts, ordinary job posts and
profile creation inside `/chat`. Read-only job and profile links append structured
cards; write actions append review forms with network, USDC, wallet-signature,
confirmation and recoverable-error states. The only external UI is the wallet's own
secure confirmation panel. The legacy direct-contract page also gives provider-neutral
pending-request guidance after 18 seconds and warns against duplicate submission.

The inline action cards were visually reviewed at 1280×720 and 390×844, including
job search, job drill-down, application and dispute forms. Live QA found two issues
before handoff: read-only navigation was still model-decided, and the configured
Alchemy endpoint had exhausted its monthly capacity. Navigation is now deterministic,
and chat plus all `/api/oppy/explore/*` routes retry read-only calls through the public
Arbitrum endpoint. Wallet writes and transaction preflights do not use this fallback.

Production returned HTTP 200 for `/healthz` and `/chat`. The exact prompt `Find open
design jobs` returned a `job-search` explorer with no model tool; `Browse jobs`
returned 16 live results, and opening `30111-105` plus its application form preserved
the `/chat` URL. App Runner reports `RUNNING` on the immutable image above. Verification
connected no wallet and submitted no approval, signature, token transfer or on-chain
transaction. The maintenance boundary and regression checklist are in
`docs/oppy-chat-interface.md`.

## Global Oppy launcher and chat interface polish

The `Ask Oppy` launcher is now available across product routes rather than only on the
home page. It is intentionally absent from `/chat` and `/oppy`, where an additional
entry point would be redundant. Desktop uses a compact assistant card with the Oppy
icon, availability indicator, label and destination cue; mobile collapses it to a 52 px
icon control while preserving its accessible name and `/chat` destination.

The public chat now has a cohesive assistant header, message hierarchy and composer.
Assistant messages have a restrained Oppy avatar, user messages use the OpenWork blue
gradient, suggestions are lighter action cards and wallet state is a structured status
row. Text input, voice input and Send share one focus-aware surface; the microphone is
secondary and the enabled Send action uses a clear blue up arrow. Voice remains
dictation only and never sends automatically. Maintenance rules and responsive and
accessibility requirements are in `docs/oppy-chat-interface.md`.

Automated coverage verifies global route placement, Oppy-route exclusions, accessible
labels, responsive launcher behavior and the unified composer. Local browser review
covered 1280×720 and 390×844 layouts, including disabled, focused and enabled composer
states. It also found and removed pre-existing missing-key warnings in the jobs table.
Live checks confirmed the 191×58 px desktop launcher, 52×52 px mobile launcher, 42 px
mic and Send targets, successful mobile click-through, no horizontal overflow and no
launcher duplication inside chat. The deployed bundle contains the release copy and
style markers. `/`, `/healthz`, `/chat` and `/oppy-transcription-worklet.js` returned
HTTP 200, and the sanitized voice-session response remained `en-IN`, 16 kHz, 45 seconds
with a signed `wss` stream URL. Verification submitted no chat message, microphone
audio, wallet request or on-chain transaction.

## Oppy Indian English voice dictation

Oppy's public job chat now has voice-to-composer dictation. The user explicitly starts
and stops microphone capture, sees partial transcription in the composer, reviews or
edits the result and presses Send separately. Existing draft text is preserved, and
neither stopping nor the 45-second recording cap submits a message.

The App Runner backend issues rate-limited, non-cacheable, 60-second SigV4 WebSocket
URLs using its instance role. Browser audio is downsampled to 16 kHz signed PCM and
streams directly to Amazon Transcribe with `en-IN`; OpenWork does not proxy or store
the recording. The browser closes microphone tracks and its audio context after every
session. IAM adds only `transcribe:StartStreamTranscriptionWebSocket`; AWS requires
the wildcard resource for this action, while the existing Bedrock resources remain
restricted to Sonnet 4.6. The design, configuration, privacy and support runbook is in
`docs/oppy-voice-transcription.md`.

AWS Access Analyzer reported no policy findings and IAM simulation returned `allowed`.
Production returned HTTP 200 for `/healthz`, `/chat` and the audio worklet. The public
session endpoint reported `en-IN`, 16 kHz and 45 seconds without exposing its URL in
logs, and a zero-audio connection to Amazon Transcribe opened and closed normally with
WebSocket code 1000. Live desktop and 390×844 checks found the enabled accessible mic,
no horizontal overflow and no console warnings or errors. No speech, chat message,
wallet request, token transfer or on-chain transaction was submitted during release
verification.

The frontend dependency audit still reports two pre-existing moderate React Router
advisories whose available remediation crosses into React Router 7. They are outside
this feature and require a separately tested migration; there are no high or critical
findings in the release gate, and the backend production audit reports zero findings.

## Home-page Oppy chat launcher

The application home page now exposes a persistent `Ask Oppy` launcher in the
bottom-right corner. It links directly to `/chat` and uses the existing Satoshi
typography, OpenWork blue gradient, pill geometry, icon treatment and shadow language.
The control has an explicit accessible name, visible keyboard focus, reduced-motion
support and responsive spacing. It is present on both `/` and `/home`, including the
mobile home warning surface, without adding another action to the radial navigation.

Automated coverage verifies the home integration, `/chat` destination, accessible
label, fixed positioning, brand treatment, focus state and mobile breakpoint. Local
browser checks at 1440×900 and 390×844 confirmed the launcher dimensions and spacing,
no horizontal overflow and successful navigation to a visible Agent Oppy chat. The
same checks passed against production: desktop rendered at 155×58 px with 32 px edge
spacing, the narrow viewport rendered at 144×54 px with 18 px right and 20 px bottom
spacing, and both click-throughs reached `/chat` with no console warnings or errors.

Release verification caught two build-source issues before handoff. A direct immutable
source override failed before compilation because the CodeBuild role lacks
`s3:ListBucket`; no IAM permission was added. A canonical-key retry produced tag
`prod-dd2f4fc-20260816124532`, but the public bundle check proved that it contained
stale source, so it was rejected as the release image. The successful build temporarily
used the immutable archive as the project's configured source, after which the project
was restored to `source/openwork-react-app-src.zip`. Only the verified image and digest
above are the active release. Production `/` and `/healthz` returned HTTP 200. All
verification was read-only and submitted no wallet request or on-chain transaction.

## Oppy action-continuation and internal-trace repair

Oppy previously chose transaction tools from the current message alone. A short
answer such as `yes, just 1 milestone` therefore lost the direct-contract intent from
the immediately preceding Oppy question, and no native Bedrock tool was made
available. The model then improvised a textual `<function_calls><invoke ...>` block
and claimed that a review screen was open even though the application had received no
validated action. This was a server orchestration and output-safety defect, not an
Armand wallet, browser, balance or cache problem.

The backend now resolves bounded transaction continuations from the latest assistant
question and recent history, while an explicit current action still takes precedence.
It exposes exactly one matching tool, rejects every other tool and uses deterministic
public copy after an accepted native tool. A continuation can resume an action only
when it is a short answer to the latest action-specific assistant question; unrelated
questions, ambiguous actions and replies following a completed statement cannot
inherit stale transaction intent.

Server and browser sanitizers now remove both singular and plural function/tool call
and response tag families, including `function_calls`, `invoke` and `parameter`, as
well as malformed or unclosed blocks. If trace-like output appears without an accepted
native tool, Oppy fails closed with a neutral retry message. Previously saved malformed
responses are sanitized when conversation memory is loaded, so exposed protocol text
is not rendered again after refresh.

Regression coverage includes the exact reported XML shape and the exact continuation
`yes, just 1 milestone`. It verifies a native `startDirectContract` review, preservation
of the `0.001 USDC` budget, rejection of unrelated or stale continuations and removal
of false completion prose. A post-deploy synthetic replay through the public API
returned `startDirectContract`, budget `0.001`, deterministic review copy and no XML.
Production returned HTTP 200 for `/`, `/healthz`, `/chat`, `/docs` and `/oppy`, and
App Runner reports `RUNNING` on the immutable image above. Verification used synthetic
data and submitted no wallet request or on-chain transaction.

## Oppy product language and trace safety polish

Oppy's public `/chat`, `/docs` and `/oppy` surfaces now use finished-product
language. Provider, registry, provenance and transaction implementation labels were
removed from ordinary customer-facing headers, suggestions, cards and progress
messages. Platform values are described as budgets or total job value rather than
internal nominal-value terminology. Technical architecture remains available when a
user explicitly asks a technical question.

Assistant output and saved conversation history are sanitized on both the server and
the browser. Internal tool/function call and response blocks are removed before they
can be rendered or reused as model history, including conversations saved before this
release. Markdown tables returned by the model are converted to readable bullets in
the public job chat.

Production returned HTTP 200 for `/`, `/healthz`, `/chat`, `/docs` and `/oppy`.
A live platform-overview request reported `Total budget posted` and contained neither
the word `nominal` nor an internal trace. A live request to `release payment for
30365-8`, after stale direct-contract history, returned only the `releasePayment`
review for job `30365-8`; it did not expose a trace. App Runner reports `RUNNING` on
the immutable image above. These checks prepared no wallet request and sent no
on-chain transaction.

## Canonical Oppy data explorer

Oppy now provides a read-only data-exploration layer alongside transaction review.
Connected wallets can ask what needs attention, inspect their complete OpenWork
activity and earnings, group jobs by role, status and chain, and open canonical job
details without initiating a wallet request. Platform-wide exploration includes live
job, application, budget, payment, chain, status and skill summaries plus canonical
job search.

Job deep dives join Arbitrum Genesis state, Genesis Reader applications, Profile
Genesis data, milestones, work submissions and IPFS metadata. Structured cards link
back to the existing job, profile and review screens and explicitly show provenance.
Read-only prompts have no transaction tools available; an explicit write request
still receives only its matching review tool. Explorer cards are derived from live
data and are not persisted as stale conversation messages.

Production verification returned HTTP 200 for `/healthz` and all four explorer
routes. The platform overview reported 141 canonical jobs and 93 applications. The
deployer wallet resolved 73 related jobs across job-giver, applicant and selected-
applicant roles. XDC job `30365-8` resolved as `React Developer – Test Job`, status
In progress, budget `0.1 USDC`, one selected application and no submission. A live
`Platform overview` chat request returned the explorer card with no tool, while
`release payment for 30365-8` returned only `releasePayment`. Both used Sonnet 4.6.
Desktop and 390px mobile visual checks passed with no horizontal overflow. These
checks submitted no wallet request, token transfer or on-chain transaction.

## Current-turn transaction intent isolation

Oppy previously received all transaction tools on every turn. After a direct-contract
conversation, the explicit request `release payment for 30365-8` could therefore
produce a stale `startDirectContract` tool and open the direct-contract form even
though the frontend correctly maps `releasePayment` to the canonical release screen.

The backend now detects one unambiguous action in the current user message, marks that
current-turn intent as overriding older conversation actions and exposes only the
matching Bedrock tool for that request. Response validation independently rejects any
tool outside the current allowed set before it can reach the browser. Ambiguous
multi-action messages remain unforced so Oppy can ask the user which action to take.

The regression suite covers the exact transition from a direct-contract conversation
to `release payment for 30365-8`, verifies that Bedrock receives only
`releasePayment`, and rejects a structurally valid but stale `startDirectContract`
response. The pre-deploy Sonnet 4.6 replay and post-deploy public `/api/chat` replay
both returned `releasePayment` with job ID `30365-8`. Production also resolved the
canonical XDC job as `React Developer – Test Job`, status In progress, with the
connected wallet as job giver. App Runner reported `RUNNING` and `/healthz` returned
HTTP 200. Verification opened no review page, wallet request or on-chain transaction.

## Deterministic Oppy EVM address validation

Oppy previously rejected the valid direct-contract recipient
`0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724` after incorrectly claiming that it
contained 41 hexadecimal characters after `0x`. The browser was not stale: the
Bedrock model was attempting to count the address itself before proposing the direct
contract action.

The transaction backend now extracts structurally valid EVM addresses from the
current user request and recent user-authored conversation history before invoking
Bedrock. It supplies an authoritative validation fact for each unique address—42
characters total, `0x` plus 40 hexadecimal characters—and instructs Oppy to preserve
the exact input rather than replace deterministic validation with a model-generated
length or checksum guess. The existing tool validator independently accepts the same
address for `startDirectContract`.

The regression test uses the exact reported address, a preceding incorrect Oppy
message and an overlong negative control. A pre-deploy live Bedrock check and the
post-deploy public `/api/chat` check both accepted the wallet and asked only for the
missing contract title, description and USDC budget. App Runner reported `RUNNING`,
`/healthz` returned HTTP 200, and the public response used Sonnet 4.6. Verification
prepared no tool call, wallet request, transaction or other on-chain write.

## XDC and Optimism cross-chain job sync status

Oppy now renders a persistent three-stage tracker for a source-confirmed XDC or
Optimism job: source-chain receipt, LayerZero delivery and canonical Arbitrum
Genesis availability. It polls the configured Arbitrum RPC every eight seconds and
stops once `jobExists(jobId)` is true. The tracker distinguishes a temporary status
read failure from a failed source transaction and retries automatically.

Each tracker provides direct links to the source transaction, LayerZero Scan and,
after delivery, the canonical job page. Its active-job metadata survives reloads, and
explicit follow-up references to the same job no longer discard the source transaction
hash or confirmed-receipt state.

Live validation confirmed XDC source transaction
`0xedee1ef1777ddd80c23f84d21fe452d56d5d37e2ead196bcea12ea8c9dc0c47a`
succeeded and the new tracker service returned `synced` because Arbitrum Genesis
`jobExists("30365-7")` is true. Production returned HTTP 200 for `/`, `/healthz`
and `/chat`; the deployed JS and CSS contain the tracker implementation, the desktop
chat had no horizontal overflow, and the browser console reported no warnings or
errors. No wallet request or on-chain write was submitted by this release.

## Durable Oppy conversation, job and deployed-code context

Oppy now retains up to 60 conversation messages per connected wallet in browser
storage, sends the latest 24 safe messages to Bedrock and remembers the active job
plus recent confirmed job transactions. A newly posted job is resolved from the
contract counter and indexed event topic, so XDC and Optimism job IDs survive the
source receipt while their LayerZero delivery to canonical Arbitrum state is still
pending.

The backend reads the connected wallet's complete canonical Genesis history across
Open, In progress, Completed and Cancelled states, prioritizes the active job and
recent receipts, and loads job titles from IPFS. Follow-ups such as “this XDC job”
therefore resolve against explicit conversation memory and live job state instead of
asking the user to re-enter a known ID. Lifecycle rules prevent Oppy from proposing a
second payment release for a completed or cancelled job.

Oppy's documentation and transaction prompts now include the exact deployed source
paths, proxy and implementation addresses, source-chain job-ID prefixes and the
LayerZero/CCTP/Arbitrum-Genesis state model. Production verification resolved active
XDC job `30365-5` as “XDC Community Manager,” status Completed, nominal budget and
paid amount `0.1 USDC`, and returned no release tool. A separate production code query
identified the XDC Lite V3 source, live proxy and implementation, and canonical
Arbitrum Genesis destination correctly.

Public checks returned HTTP 200 for `/`, `/healthz`, `/docs`, `/oppy` and `/chat`.
The deployed bundle contains the versioned Oppy memory store. The release made no
wallet request, smart-contract transaction, token transfer or other on-chain write.

## Agent Oppy IPFS posting repair

Agent Oppy's job-posting confirmation used the nonexistent
`/api/ipfs/upload` route, while the production backend exposes the canonical
`/api/ipfs/upload-json` and `/api/ipfs/upload-file` routes. The request therefore
returned HTTP 404 before reaching the managed AWS IPFS node, MetaMask or any smart
contract. Oppy now uploads all job, application, submission and profile JSON through
`/api/ipfs/upload-json`, verifies that a content hash is returned and surfaces the
backend provider error instead of replacing it with the generic `IPFS upload failed`.

Structured transaction parameters no longer pass nested objects through `String()`.
Milestones render as readable numbered lines containing the milestone label,
description and USDC amount, and long values wrap without splitting every word.

Production verification confirmed HTTP 200 for `/chat`, `/docs` and `/healthz`. The
deployed bundle contains the canonical upload route and no reference to the obsolete
route. A live Bedrock transaction-review request rendered
`Milestone 1 — QA milestone — 0.1 USDC` with no browser-console errors. The canonical
production upload endpoint successfully pinned a small JSON probe and returned a CID.
Verification prepared a review object only; it did not open a wallet request or submit
an on-chain transaction.

## Agent Oppy interface polish

The `/docs` Agent Oppy panel now uses a clear assistant header, 14–16px interactive
type, a balanced suggestions-and-conversation layout, proper assistant/user message
structure and a full-size composer. Bedrock Markdown is rendered as semantic headings,
lists, tables and code rather than exposed punctuation. The production browser test
returned three structured headings and three list items with no visible raw Markdown.

The public `/chat` shell no longer inherits the old jobs page's 88px relative offset,
1,200px minimum or padded container. It begins 30px below the desktop application
header, centers the title independently of the back control and uses the standard
48px desktop/44px mobile back target. Message scrolling is now contained inside the
conversation instead of `scrollIntoView` moving the whole page during mount, and input
focus uses `preventScroll`. The desktop card remained at scroll position zero with its
title center matching the viewport center exactly. Mobile verification found no
horizontal overflow, a centered title, 16px composer type and no global-header overlap.

Production checks returned HTTP 200 for `/docs`, `/oppy` and `/chat`. Desktop and
390px mobile browser checks passed with no console warnings or errors. The release
changed application presentation and client-side scrolling only; it submitted no
wallet request or on-chain transaction.

## Bedrock Agent Oppy and chat-based job management

Agent Oppy is live in the `Agent Oppy` tab at `/docs`, as a full-screen
documentation assistant at `/oppy`, and as a public job-management chat at `/chat`.
The backend uses the App Runner instance role and the AWS default credential chain;
no static AWS credential is present in the browser, image or repository configuration.
The role can invoke only the selected Sonnet 4.6 inference profile and its three
regional foundation-model resources.

The Bedrock catalog reported Sonnet 5 as available and authorized, but a real invoke
was rejected by AWS as sales-gated. A direct invoke of
`us.anthropic.claude-sonnet-4-6` succeeded, so production explicitly uses that model.
The chat endpoint has separate documentation and transaction prompts, a 2,000-character
message limit, 12 requests per minute per IP, a 20-request process concurrency ceiling,
bounded history and sanitized logs.

Transaction chat supports Arbitrum, Optimism and XDC. Bedrock prepares validated action
objects, but the server never signs or sends a wallet transaction. The browser presents
the contract method, network and parameters for review before a wallet request. Posting
a job does not approve, lock or transfer USDC. Application amounts fail closed rather
than inventing a fallback, and payment release, dispute, start-job and direct-contract
actions route into the existing canonical preflight/review screens.

Post-deploy checks returned HTTP 200 for `/`, `/healthz`, `/docs`, `/oppy` and `/chat`.
Live documentation and transaction requests both completed on Sonnet 4.6; the latter
returned a validated `postJob` review object without executing it. Browser verification
confirmed the docs tab, the public review card, no console warnings or errors, and no
horizontal overflow at a 390px viewport. The final mobile regression prevents Oppy from
inheriting the legacy global 1,200px minimum width. Deployment and verification sent no
smart-contract transaction and changed no wallet, token balance or on-chain state.

Two pre-existing backend operational alerts remain outside this release: no external
database is configured for CCTP state persistence, and the Arbitrum service wallet
`0x93514040f43aB16D52faAe7A3f380c4089D844F9` reported `0.000500 ETH`, below the
listener's configured safety threshold.

## Job actions and complete profile history

Job detail pages now preserve all four radial action positions. Actions that are not
available to the connected wallet or current job state remain visible but disabled,
with an explicit reason, instead of disappearing and leaving an apparently incomplete
two-button menu.

The Job Details `FROM` and `TO` profile links now route to the wallet displayed in
their row rather than the connected wallet's own profile. Profile job history now
reads Open, InProgress, Completed and Cancelled Genesis records and filters both the
job giver and selected applicant, so direct contracts and completed work are no
longer omitted.

## Compact audited contract documentation release

The production `/docs` page now opens with a compact four-chain network overview
instead of a long document stack. Its 31 active contract functions are grouped by
chain and function, and the page explicitly explains that those functions are backed
by 50 deployed addresses. Every tile opens a polished detail drawer containing the
live address, current implementation, explorer-source status, configuration evidence
and connected contracts. Function flows, Agent Oppy and status/change evidence remain
one click away without competing with the initial network view.

The transport strip uses bounded, separate two-way lanes for LayerZero messages and
Circle CCTP USDC, with distinct Arbitrum hub ports and no overlapping arrowheads. At
mobile widths it becomes a complete compact route list rather than a horizontally
panned fragment. It shows only the three active Arbitrum-hub message pathways and the
two active CCTP pathways.

The grey XDC–Ethereum line and its disabled-route claim were removed after checking
the current contracts, application calls and live LayerZero configuration. The
intended production topology has four documented pathways: Arbitrum direct,
XDC–Arbitrum, Optimism–Arbitrum and Ethereum–Arbitrum. Generic bridge source can
support a direct DAO-upgrade message and Ethereum retains a historical peer value for
the retired XDC bridge, but there is no reciprocal active security stack or current
application flow that makes XDC–Ethereum a production route. That legacy value remains
in the technical registry as history rather than being drawn as present topology.

The registry was re-audited against the current deployment ledgers and live readbacks
on 7 August 2026. It distinguishes runtime verification, explorer source publication
and configuration status rather than collapsing them into one ambiguous label. The
status view records direct Arbitrum production job `42161-24`, current NOWJC zero-fee
storage, LayerZero peer/security state, CCTP keeper configuration and known evidence
gaps. The public `/api/docs/contracts` projection exposes the same
status definitions, 31 per-contract configurations, live configuration, recent changes
and limitations consumed by the page.

Deployment and verification changed application and documentation code only. No
smart-contract deployment, upgrade, wallet transaction, token transfer or other
on-chain write was submitted.

## What this release fixes

The reported profile `0x840EcF6f33428bDfd877A185737FaCd504e8B9F4` previously showed
only one job because the profile service called `getInProgressJobs()` and discarded
every other lifecycle state. The deployed all-status read returns seven jobs for that
wallet across two pages, including completed direct contracts and jobs where the
wallet was the selected applicant. Production browser verification also confirmed
that Direct Contract `30111-106` links to the exact giver and taker profiles shown in
the detail card.

### Earlier transaction reliability release

Payment screens previously reported a healthy transaction as failed. Job `42161-23`
showed a release payment as "not mined within 80 blocks… might still be mined" when
the transaction did not exist at all — neither mined nor in the mempool — so nothing
had moved, but the user had no way to know that and retrying appeared to risk paying
twice.

- web3 counts its block timeout in blocks, and Arbitrum produces one every ~0.25s, so
  80 blocks was 20 seconds, with the countdown starting at `send()` before the wallet
  prompt was answered. The budget is now wall-clock and converted per chain: 2400
  blocks on Arbitrum against 50 on Ethereum.
- A timeout is no longer treated as an outcome. The failure path queries the chain and
  distinguishes already-succeeded, mined-but-reverted, still-pending and dropped,
  telling the user in each case whether funds moved and whether retrying is safe.
- Sending is now preceded by a check for unconfirmed transactions from the same
  wallet, since a queued nonce is the most likely way to reach the timeout at all.

Applied to both the release and lock-milestone paths.

Three follow-up corrections after review, all in this release:

- The first version of the timeout fix was **inert**. It tuned a `Web3` created in
  the page, but `getLOWJCContract` builds its own internally and returns a contract
  from that one, so the sending object kept the default. The tuning now happens
  inside `getLOWJCContract` and `getAthenaClientContract`, and a source-level test
  fails if either getter stops doing it.
- The buttons now follow the verdict. Previously the warning said "do NOT send it
  again" beside a live Release button, so the interface contradicted itself.
- Nothing diagnosed anything until `send()` settled, so a wallet retrying against
  an unreachable RPC left the user on a spinner for minutes. `verifyBroadcast` now
  runs as soon as a hash exists, in parallel with the send, and reports within 30
  seconds if the network never received the transaction.

Twenty-one tests cover this area, including the dropped, pending-then-dropped and
hash-without-broadcast cases observed on job 42161-23.

### Fee ceiling, now set in one place

Two opposite defects produced the same symptom, a transaction that never mines.

Release payment set no ceiling at all, so the wallet padded maxFeePerGas into the
low gwei range and reserved roughly a hundred times the real cost, then refused
the transaction for insufficient funds against a balance that could pay it many
times over.

Post job, apply to job and start job set `maxFeePerGas` to `eth_gasPrice`. On
Arbitrum `eth_gasPrice` equals `baseFeePerGas` exactly — both measured at
20000000 wei — so the ceiling sat on the base fee with no headroom, and any rise
between estimate and inclusion left the transaction unmineable until it dropped.

`buildEstimatedWriteSendOptions` now derives the ceiling from the chain's live
base fee with a 5x multiplier and a 0.01 gwei floor, sets no priority fee because
Arbitrum's sequencer orders by arrival, and applies it only when the caller
expressed no fee preference so deliberate legacy `gasPrice` on cross-chain paths
is untouched. Thirteen files and twenty-three call sites route through that
function, so they are fixed together rather than one page at a time. The
per-page fee fields were removed from the three audited paths, and a regression
test fails if any of them pins the ceiling to `eth_gasPrice` again.

### Public documentation rebuilt around a relationship diagram

`/docs` previously showed what exists — chain cards and a contract table — but not
what talks to what. It now leads with an interactive diagram: selecting one of
eleven flows dims the uninvolved contracts and draws the path between the rest,
coloured by transport, so the difference between a job that crosses a bridge, one
that runs both transports at once, and one that crosses nothing is visible rather
than described.

Nodes carry a contract id into `docs/mainnet-contracts.json`, so address, explorer
link and verification status come from the registry and cannot drift from
deployment. Verified on the deployed page: 11 flows, 28 nodes, 28 explorer links
with none malformed, and the release-payment flow drawing 4 wires of which 2 are
the CCTP legs.

It replaces `openwork-complete-architecture.html`, correcting three claims that
file carried: governance labelled "Main Chain (Base)" when it is Ethereum, XDC
omitted entirely, and no Arbitrum direct adapters. Arrows are measured from
rendered node positions rather than hardcoded on a fixed canvas, so the layout
reflows; below 720px the wires are hidden and uninvolved contracts are removed,
because curves computed for a wide layout do not survive a single-column reflow.

`lastAudited` moves to 4 August and the page now records the Arbitrum direct cycle
verified with job 42161-23, the permissionless bounty-incentivised nature of CCTP
relaying, and the XDC reward-cap correction.

### Page length halved

Measured at 1440x900 the documentation page ran to 11,634px, about thirteen
screens, of which the contract tables were 6,006px and the stacked architecture
zones a further 2,222px. Each chain registry now collapses, costing 782px closed,
and above 1100px the zones lay out as columns rather than stacking, taking the
diagram to 1,406px. Total is 5,595px, 6.2 screens, verified on the deployed page
with no horizontal overflow at either 1440px or 375px and no degenerate or
out-of-bounds arrows in either layout.

## Verification

- Commit `d29bff2c71e6f21d3b5a9b720f58fa183a4243bd` passed `84/84`
  frontend tests, `37/37` backend tests, the backend high-severity dependency audit,
  the mainnet frontend build, GitHub CI and immutable CodeBuild image creation.
  Production `/`, `/health`, `/healthz`, the reported profile jobs route and Direct
  Contract detail route all returned HTTP 200 after App Runner operation
  `4378870a6b07435fa1c1b220bb75aff6`.
- Live browser verification rendered seven profile jobs over two pages. Direct
  Contract `30111-106` linked `FROM` to `0x840E...B9F4` and `TO` to
  `0x9218...5A73`. Job `42161-24` retained all four radial actions; unavailable
  payment and dispute actions were present, disabled and labelled with their reason.
- The deployed bundle is `/assets/index-Xb5EdRmD.js`, SHA-256
  `06728681e3b8c9b8d5e0b361068da12a8f98f8d1638eb13e77d64c758625aa4e`.
  The new backend instance selected the masked Alchemy Arbitrum host, so the public
  RPC fallback did not engage.
- The deployed `/api/docs/contracts` response contains exactly four pathways and no
  pathway joining XDC to Ethereum. Live desktop and `390 × 844` browser checks show
  no grey XDC–Ethereum line or disabled-route legend; the mobile route groups contain
  only LayerZero and CCTP, the status view reports `4 tracked routes`, and the browser
  console contains no warnings or errors.
- A user-authorized live follow-up on 7 August completed native-Arbitrum Direct
  Contract job `42161-24`: exact approval and escrow of `0.10 USDC`, followed by
  a same-chain `0.10 USDC` release to the selected applicant 23 seconds after
  contract start. ArbLOWJC and Genesis both report `Completed`; the local adapter
  reports `0` locked and `0.10 USDC` released, and the production page displays
  the definitive final-state notice with both payment buttons disabled. This was
  a user wallet test after deployment, not an automatic deployment write. The
  full evidence record is
  `contracts/references/deployments/arbitrum-direct-contract-job-42161-24-7-aug-2026.md`.
- The exact consolidated `main` source at `90ebc3a` passed `51/51` frontend tests, `37/37` backend tests, the backend dependency audit and parse checks, the frontend build and CodeBuild before the immutable image was deployed.
- App Runner's HTTP health gate passed, and read-only production checks returned HTTP 200 for `/`, `/health`, `/healthz`, `/docs`, `/documentation` and `/api/docs`. No wallet transaction or other on-chain write was submitted.
- The deployed backend startup log selected the masked Alchemy Arbitrum host (`arb-mainnet.g.alchemy.com/***`). The public `arb1.arbitrum.io` fallback did not engage, confirming that the production RPC secret reaches the newly deployed fallback-capable code.
- The release includes wallet-attributed IPFS upload metering, bounded relay waiters, in-page toast errors and the disk-headroom circuit breaker. Signature enforcement remains controlled by `IPFS_REQUIRE_SIGNATURE`; the node-side authenticated `repo/stat` route is live and preserved in the IPFS CloudFormation source.
- Frontend tests (`45/45`), backend tests (`21/21`), the mainnet frontend build, CodeBuild and the production image build passed for the exact source commit.
- MetaMask connection is now provider-authoritative after reload or disconnect, handles delayed extension injection, and renders rejected, pending and missing-extension errors in the page instead of leaving an inert wallet choice.
- Job metadata now retries the managed same-origin IPFS gateway before a public fallback, never settles on `Untitled Job`, and exposes a safe display-only retry. Production browser verification loaded job `42161-22` as `Arb Dev` without a metadata warning.
- Completed jobs no longer expose release-payment or dispute actions. Work submission is limited to an in-progress job and its selected applicant, and its LayerZero quote plus exact gas preflight use the configured chain RPC before the final user-signed MetaMask write.
- Switching Direct Contract between single and multiple milestones preserves the amount already entered instead of silently resetting compensation. Production browser verification passed `/connect-wallet`, `/direct-contract`, `/job-details/42161-22`, `/add-update/42161-22` and `/release-payment/42161-22`; every HTTP gate returned `200`.
- This release changed application code only. It sent no smart-contract transaction and changed no contract, wallet, token balance or on-chain state.
- CCTP receive execution now reconciles generic provider or duplicate-relay errors against Circle's destination `usedNonces(bytes32)` state. A consumed nonce is recorded as delivered instead of a false failure; an unused nonce is never presented as success.
- Release Payment and Start Job no longer expose protected operator retry endpoints in the browser or interpolate missing backend fields into `undefined` error messages. Job `30365-5` now renders its contract-recorded final state: `Completed`, `0.10 USDC` released, `0` locked, both payment buttons disabled and a definitive success notice.
- Production browser verification of `/release-payment/30365-5` found no console warnings or errors. The deployed bundle contains the final-state message and contains neither browser CCTP retry endpoint nor the obsolete retry-attempt text.
- The current relay status store remains process-local because production has no usable external database configured. On-chain destination-nonce reconciliation prevents false failures within a running process, while durable historical relay status across restarts still requires a real external database.
- This repair deployed application/backend code only. It sent no chain transaction and changed no smart contract, wallet, token balance or on-chain state.
- Post-deploy checks returned HTTP 200 for `/`, `/health`, `/healthz`, `/docs`, `/documentation` and every documentation API endpoint. Browser verification confirmed the production title and subtitle, registry summary, contract rows and client-side `/documentation` redirect on the deployed bundle.
- The public documentation route is now `/docs`; `/documentation` redirects to it and the former documentation explorer remains available at `/docs/legacy` with a legacy notice.
- The published registry documents 31 production roles represented by 50 deployed artifacts across Arbitrum, Optimism, Ethereum and XDC. It distinguishes role status from explorer source-verification status and links each deployment to its chain explorer.
- The documentation API exposes the canonical skill, references, contract registry and combined bundle through `/api/docs`, `/api/docs/skill`, `/api/docs/references`, `/api/docs/contracts` and `/api/docs/full`.
- The architecture overview reflects the active Arbitrum and XDC bridge deployments, CCTP pathways, LayerZero peers and direct-contract modules. It documents only the four intended production routes and does not promote legacy peer storage into a live-path claim.
- This release changed the public application and repository documentation only. It performed no smart-contract deployment or upgrade and changed no wallet, token balance or on-chain state.
- Frontend tests (`36/36`), backend tests (`17/17`), the mainnet frontend build and the production image build passed for the exact source commit. The backend dependency lock continues to resolve the disclosed high-severity `brace-expansion` and `fast-uri` advisories with zero audit findings.
- App Runner HTTP health checks passed. The production root and `/healthz` returned HTTP 200, and browser smoke checks passed for `/direct-contract` and the durable `/direct-contract-status/:transactionHash` fallback.
- XDC Direct Contract creation now checks the connected wallet's native XDC USDC balance before uploading metadata or requesting approval, reports the exact required and available amounts, and reuses a sufficient existing allowance instead of charging for another approval. Counter reads, LayerZero quotes and exact gas estimation now use the configured browser-safe XDC HTTP RPC; only the final signed write is sent through MetaMask.
- The reported XDC attempt was reproduced read-only against live state. Wallet `0x7a2B...6384C` had approved `100,000` raw USDC units to LOWJC but held only `12,361`; an exact `eth_call` reverted with `ERC20: transfer amount exceeds balance`. Approval transaction `0x18fb958c5f5582fd7173c5de5af37f06c038edb6b11cf619bd7a9c3e5c6484b1` succeeded, but no Direct Contract transaction or outgoing USDC `Transfer` was present, so the intended `0.1 USDC` did not move.
- Live XDC reads confirmed chain ID `50`, LOWJC implementation `0x7898B41BB04428bf3ccaC5a321d1513D4A00A47D`, bridge `0xDae5036a1d9E7C6CE953604FF238E13BD2B83951`, CCTP sender `0x00c70838cA0de7F1Eb192Bd7a11A7F2e14407510` and native XDC USDC `0xfA2958CB79b0491CC627c1557F441eF849Ca8eb1`.
- The backend now treats the indexed `PaymentReleased(string)` topic as an opaque hash instead of a decoded job ID, ignores native Arbitrum releases that require no cross-chain relay, accepts genuinely decoded cross-chain IDs, deduplicates by transaction and only marks processing complete after success. A 5,000-block production startup scan completed without replaying the malformed topic hash into the CCTP flow.
- Native Arbitrum payment release now estimates the exact routed call through the configured Arbitrum HTTP RPC instead of the injected wallet provider. MetaMask receives only the signed write request and manages its own fee fields, avoiding the pre-confirmation `Internal JSON-RPC error` observed on job `42161-22`.
- The Release Payment page now rejects a connected account that is not the recorded job giver before requesting any wallet transaction. Nested wallet/RPC errors are surfaced when providers return useful underlying details.
- The exact production payment path was rehearsed on an Arbitrum fork at live state: `releasePayment("42161-22")` used `356,211` gas, moved exactly `100,000` raw USDC units from NOWJC to `0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724`, cleared the locked balance and completed the job. The fork was stopped and mainnet was read back unchanged afterward.
- The production Arbitrum RPC secret was rotated from the exhausted Alchemy endpoint to `https://arb1.arbitrum.io/rpc`, the canonical public Arbitrum endpoint already used by the frontend build. App Runner was recycled so its backend event listener and service-wallet health checks load the replacement endpoint.
- The refreshed health check exposed that relay wallet `0x93514040f43aB16D52faAe7A3f380c4089D844F9` has `0 ETH` on Arbitrum. Automatic relay transactions that require this signer remain blocked until a separately authorized gas-funding transaction is completed; no funds were moved during this release.
- Direct Contract now scopes placeholder styling to actual placeholders, makes the displayed milestone amount directly editable, renders progress states in orange instead of error red, prevents duplicate submission once a receipt is confirmed, and persists a transaction-hash progress route that can be revisited safely.
- The wallet-provider `deceptive request` warning is not emitted by OpenWork application code and is unchanged in this application release; it requires separate wallet/security-provider reputation remediation.
- No smart contract, wallet, token balance or on-chain state changed during this application release or its verification.
- The live ledger decodes `30365-*` job IDs as XDC Network and now loads `/xdc-chain.svg`, while USDC budget amounts continue to use the separate `/xdc.svg` token icon. The deployed XDC asset SHA-256 exactly matched the reviewed source asset.
- The ledger still preserves Genesis creation order and reverses it so newest jobs render first. During IPFS enrichment it now shows `Loading job details…` instead of temporarily presenting a raw job ID as the title.
- After a Post Job wallet confirmation produces a transaction hash, the form dismisses its loading overlay and smoothly reveals the transaction and cross-chain status region at the bottom of the form.
- The deployed bundle contains the browser-compatible XDC RPC `https://rpc.xinfin.network` and no occurrence of the CORS-incompatible `https://erpc.xinfin.network` default.
- A browser-origin preflight and JSON-RPC `eth_chainId` request to the replacement RPC returned CORS headers and chain ID `50`; live LOWJC reads and an exact `quoteNativeChain` call also succeeded through it.
- The Post Job page now derives Type-3 LayerZero options from `DESTINATION_GAS_ESTIMATES.POST_JOB` (`800,000` destination gas), matching the validated production transaction path instead of reusing the stale `500,000` static chain option.
- Production XDC job `30365-3` completed the real post, application, selection/start, USDC escrow, CCTP mint, work submission, release and CCTP payout flow. Its public page shows `1 / 1 Milestones Completed`, `0.10 USDC` paid and `0.10 USDC` received.
- The AWS-hosted IPFS provider remained healthy after deployment. A post-deploy production upload returned CID `QmTr7iGdvFAt3RQy7QnMEe3TxMY8o579N8fvRDmWDVSfoW` with HTTP 200.

## Public production documentation release

Commit `8f98a50535468208ab5a6ad86ac8e78d74c5b183` replaces the stale public documentation landing route with a production-focused reference for OpenWork's architecture, deployed contracts, cross-chain pathways and verification state. The page is responsive at laptop and mobile widths, uses compact copyable addresses, and keeps historical or incomplete verification claims visibly separate from active deployment status.

The release registry is derived from the contract repository's canonical live registry and deployment ledgers. Its audit date is 1 August 2026. Source verification is confirmed for 31 artifacts and remains pending for 19 artifacts; pending explorer publication is not presented as a deployment failure. Optimism and Ethereum pathway proof remains explicitly incomplete, and LocalAthena V2 remains held rather than live.

## XDC browser quote correction

The previous production bundle failed before opening MetaMask when Post Job constructed a read-only Web3 client for `https://erpc.xinfin.network`. The endpoint served XDC RPC responses but omitted `Access-Control-Allow-Origin`, so Brave blocked its preflight request and the UI displayed `Failed to fetch`. The same browser flow also selected the chain's stale static `500,000`-gas option instead of the operation-specific `800,000` post-job estimate.

Commit `7bbe46529cadaaa25f65faa282d54b602b7c6884` corrects both defects. It changes the release build argument and fallback to the official, CORS-compatible `https://rpc.xinfin.network` endpoint and makes the Post Job page call `buildLzOptions(DESTINATION_GAS_ESTIMATES.POST_JOB)`. No contract, wallet, token balance or on-chain state changed during this repair or deployment.

## Job ledger experience correction

Commit `835098412e76ec580c91092969e123934f38d399` separates the XDC Network chain mark from the USDC payment-token icon, removes the confusing raw-ID metadata-loading flash and reveals the Post Job transaction status immediately after wallet confirmation. The XDC mark comes from the official XDC Foundation brand asset package and remains distinct from all budget icons. This was an application-only release: no smart contract, wallet, token balance or on-chain state changed.

## Direct Contract transaction experience correction

Commit `7f9c01deba2624fd308c3436b3fdc44d8e318791` implements the four application-owned experience corrections reported on 31 July 2026. Commit `8f1b2503da38f288fd92453c649bf86ee1ca8eec` refreshes only the backend dependency lock so the same source release passes the production audit gate. Receipt-confirmed transactions now leave the submission form and continue on a durable status route; retrying the wallet transaction is no longer the recovery path.

## Native Arbitrum payment release preflight correction

Commit `ffa05619c3771121acbc04881bc2aaf4d0d3b9bf` fixes the production Release Payment path after MetaMask returned a generic `Internal JSON-RPC error` before opening its confirmation screen. Native Arbitrum gas estimation now uses the configured browser-safe RPC and omits application-specified fee fields, while the actual write remains entirely user-signed through the connected wallet. The change is application-only; it performs no automatic wallet, token or contract write.

## PaymentReleased recovery correction

Commit `6426381b58f199511eff9a9d3919885507525574` prevents the backend listener from interpreting the indexed hash of a dynamic `string` event field as a literal OpenWork job ID. Native Arbitrum payments remain final on Arbitrum and are not queued for CCTP; decoded cross-chain IDs still enter the relay path. The correction is covered by four focused classifier tests and the existing backend suite. Deployment and startup recovery performed no wallet, token or contract write.

## XDC Direct Contract preflight correction

Commit `9b2c112a0578de3aaf146dae80d48a4fefbdb04b` corrects the production XDC Direct Contract path after MetaMask surfaced a generic `Internal JSON-RPC error` for an on-chain insufficient-USDC revert. The application now fails early with the exact balance shortfall, skips redundant approval when allowance is already sufficient and performs all read-only preflight through the configured XDC RPC. The deployment itself performed no wallet, token or smart-contract write.

## CCTP destination-delivery reconciliation

Commits `7655f91702345832ffb515b94b6e7ac150dccce3`, `b48281fd4c679f8babc5b62a3d80015e288d7d13` and `fec743f07cbc56659bb623830208fed82d38929d` correct the misleading failed/incomplete state observed after XDC job `30365-5` paid its applicant successfully. The backend now treats the destination Circle MessageTransmitter nonce as the delivery authority, including before a service-wallet write and after a generic provider error. The user-facing pages no longer call protected operator-retry routes, and a contract-completed job is rendered as final with no further payment action available.

The verified release path burned `0.1 USDC` on Arbitrum in transaction `0x45985996d8bbd0ad39d36db06a4238cb3b6d8b636498f1e8b460d34a74f34f17`; XDC transaction `0x28ce7065d9190d3a016126a31676cb6207cf65a4ad5de8fa4187f9f6ff1a9518` consumed the Circle message and delivered `99,986` raw USDC units to applicant `0xC28455B90eEeA6d95B6f0Cd01A0b03f9D50a7724` after the 14-unit protocol fee. This release only corrected application interpretation and UI state; it did not replay or alter those transactions.

## Oppy transaction-scoped cross-chain status correction

Oppy's former singleton Job Sync card was rendered from persisted `activeJob` memory.
It also preserved its `synced` state across inputs and considered `Genesis.jobExists`
sufficient proof for every action. Releasing a payment for an already-created job could
therefore reuse the old green creation state immediately, even while LayerZero and CCTP
were still processing.

The tracker now lives inside the exact transaction review card and is keyed by action
plus source transaction hash. Post Job and Direct Contract creation verify their own
canonical creation state. Release Payment snapshots `totalPaid` before submission and
requires all of the following before rendering `Payment received`: source receipt,
LayerZero delivery with its Arbitrum destination transaction, an increase in canonical
`totalPaid`, Circle completion and destination `usedNonces(bytes32)` consumption when
the applicant is paid on Optimism or XDC. Temporary LayerZero, RPC or Circle failures
remain non-final and retry automatically.

Read-only verification against the reported XDC release
`0x277cc1dda1dd882bac958c957be4db0f96ca95b039d69bfe6bbd3ca89d8515f9`
resolved LayerZero destination transaction
`0x8d26f0ccd6b744a8588402b38fed039545254fb0587ddd51a57c529bce1a954c`,
canonical job `30365-9` at `0.1 USDC` total paid and consumed XDC event nonce
`0x1a31b796c540b0da1c8b0e88fa9f1e5f56f20693680d167d781bfc5f206e1c21`.
The configured Arbitrum provider was out of monthly capacity during this check, so the
new public-RPC fallback was also exercised successfully. Desktop and 390 x 844 visual
QA covered the tracker inside its transaction card; container-aware four-, two- and
one-column layouts prevent cramped steps and horizontal overflow. This correction and
its verification are read-only and submit no wallet or on-chain transaction.

The production smoke check also found that `https://rpc.xdc.network` aborts the exact
`usedNonces(bytes32)` proof after five seconds even though its basic block query is
healthy. Commit `3fd8419d64f043b8a82c6571f5ecbd1e482a1c5e` adds ordered, read-only
destination RPC fallbacks; it never treats an unavailable provider as proof of
delivery. The reported release now resolves `complete: true` in production only after
the XDC MessageTransmitter returns `1` for the Circle event nonce.

| Release field | Verified value |
|---|---|
| Feature commit | `70be95ee76fda4a56e53cc3987e2749437567bc9` |
| Deployed commit | `3fd8419d64f043b8a82c6571f5ecbd1e482a1c5e` |
| Frontend tests | `127/127` passed |
| Backend tests | `71/71` passed |
| Source archive | `s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-3fd8419.zip` |
| Source SHA-256 | `0e4c745e83fa0029b7cf732f1a27a3b1fc0326e5f2b0a45e27914a08f8d39cc1` |
| CodeBuild | `openwork-react-app-prod-build:573bd81a-9b05-417e-837c-77246824dbc0` — succeeded |
| ECR image | `openwork-app:prod-3fd8419-20260822222527` |
| ECR digest | `sha256:509c743d9fc715703d9b9d30fe890093b2bfae1be3862b4e24f22201aea03948` |
| App Runner operation | `9a6d49cecc9b4b599f9ae4e05bc0613a` — succeeded 22 August 2026 at 22:32:39 IST |
| Live JavaScript | `/assets/index-BOPjcjQ3.js` — SHA-256 `0d79fc0537f9e3cb8606d8a5600affe39d0ae6e10a33a5007a816aadf000976c` |
| Live stylesheet | `/assets/index-BPtjwY2Q.css` — SHA-256 `744351d515274ba530d4016c8b2a57eb6a5cf7f35730100d48a44cc1ae5e725e` |
| Public gates | `/healthz` returned `{"status":"ok"}`; `/chat` returned HTTP `200`; historical release verifier returned `complete: true` |

## Oppy follow-up completion-answer correction

Commit `4c619950c3e7d3df461d58d87c74e54fa63ed010` fixes the contradictory
answer observed immediately after Direct Contract job `30365-10` showed
`Contract ready`. The visual tracker already had transaction-scoped LayerZero and
Arbitrum proof, but the next message used the separate broad wallet-ledger context.
When the configured provider was over capacity, the model saw only that degraded read,
called the Direct Contract a job post and incorrectly said final delivery was unknown.

Short status follow-ups such as `is it done?`, `did it go through?` and `status for
30365-10` now bypass generative interpretation. The backend selects the exact latest
confirmed transaction for the active job, reruns the same action-specific cross-chain
verifier and returns a deterministic answer. Direct Contract answers require the
contract-ready canonical state. Release Payment memory now also preserves the target
CCTP domain and pre-release `totalPaid` baseline, so a later status question cannot
declare payment completion without its independent payment delta and destination
receipt evidence.

Production verification replayed `is it done?` with source transaction
`0xecc5034446bc27421dfd528f1e7aa2557daf3c997956083889744ef91f71090b`.
The live `/api/chat` response used model label `deterministic-cross-chain-status`,
identified action `startDirectContract`, resolved LayerZero destination transaction
`0x30e275108466f80a6a9abe19ab31fde2b2be580312eb4db6f1d25dd0c0a79e3d`,
confirmed canonical job `30365-10` at status `1`, and answered that the Direct Contract
is active with no retry needed.

| Release field | Verified value |
|---|---|
| Deployed commit | `4c619950c3e7d3df461d58d87c74e54fa63ed010` |
| Frontend tests | `127/127` passed |
| Backend tests | `76/76` passed |
| Production build | Vite build passed; existing chunk-size warnings only |
| Source archive | `s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-4c61995.zip` |
| Source SHA-256 | `95f62d459d84fe30fa3ff965c00631c56a87ed04360bc0add2dbdac651d7fac2` |
| CodeBuild | `openwork-react-app-prod-build:aa781e63-782f-4f5e-930b-45533acdfdf1` — succeeded |
| ECR image | `openwork-app:prod-4c61995-20260823111610` |
| ECR digest | `sha256:ad43e7e06534b0d8da48ed275d59b5be790a6ff4508b2c8ff4b4773030cd6c64` |
| App Runner operation | `438baa39924a4885a68eb8f442b7ed87` — succeeded 23 August 2026 at 12:29:13 IST |
| Live JavaScript | `/assets/index-UHjdeSzX.js` — SHA-256 `be18df660a62290ddaa178d202bd428984db9701b41388350476643d0f240c07` |
| Public gates | `/healthz` returned `{"status":"ok"}`; exact `/api/chat` replay returned `complete: true` and the correct Direct Contract answer |

The managed runtime still reports two pre-existing infrastructure warnings: no external
database persistence and an exhausted configured Alchemy allowance for the global
PaymentReleased recovery listener. The transaction-scoped Oppy verifier is insulated
by its public Arbitrum fallback and passed this release gate. The listener warning is a
separate relayer-availability item and is not represented as fixed by this release.

## Oppy live native-balance and funding-preflight release

Commit `d671e169d774f9159b304eae1629291954abb787` makes native-token
funding a mandatory, transaction-scoped preflight rather than an indexer-dependent
guess. Oppy can answer XDC, Optimism and Arbitrum native-balance questions directly
from read-only chain RPCs. Before any supported payable wallet write, the frontend now
compares the live native balance with the current LayerZero quote plus buffered gas and
fails closed before opening the injected wallet when funds are insufficient or every
balance endpoint is unavailable.

The exact production balance replay for wallet
`0x7a2B7feAB9b0e30A5368d3CC4CB8279c9606384C` used model label
`deterministic-native-balance` and returned `0.289296832824877939 XDC` directly from
XDC Network. A separate read-only quote for releasing the current milestone on job
`30365-10` returned `4.504461534394187956 XDC` before gas, establishing a minimum
shortfall of `4.215164701569310017 XDC`. No wallet request, contract write or on-chain
transaction was submitted during either verification.

| Release field | Verified value |
|---|---|
| Deployed commit | `d671e169d774f9159b304eae1629291954abb787` |
| GitHub CI | Run `32627825937` — succeeded |
| Frontend tests | `132/132` passed |
| Backend tests | `80/80` passed |
| Production build | Vite build passed; existing chunk-size warnings only |
| Source archive | `s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-d671e169d774f9159b304eae1629291954abb787.zip` |
| Source SHA-256 | `63efe8b43de5ee6023afe36518d33f56ed399ee65ac8ee0861f0f9323c25eb39` |
| CodeBuild | `openwork-react-app-prod-build:8f98199d-2d5d-4f81-bd19-5787bb57a814` — succeeded |
| ECR image | `openwork-app:prod-d671e16-20260823134749` |
| ECR digest | `sha256:da8c9a8f3a96a3064aab1960bfb2d8b6612f35bb517aff290082d5c0bc74c191` |
| App Runner operation | `e7f6afd919cd4060a51a4ac9c069d284` — succeeded 24 August 2026 at 18:03:13 IST |
| Live JavaScript | `/assets/index-aB5KpIVa.js` — SHA-256 `14ea374d6b79b49c4a2179b0c0aa035fe6343e67f86dea45a95524f7deb767dd` |
| Public gates | `/healthz` returned `{"status":"ok"}`; `/chat` returned HTTP `200`; the exact `/api/chat` balance replay returned the live XDC balance with model `deterministic-native-balance` |
| Visual gate | Production `/chat` rendered the Oppy composer, voice-input button and wallet boundary with no browser warnings or errors |

## Oppy latest-job identity recovery release

Commit `72bca49a95888f961b44a133d6578bda068ca2f8` fixes the stale-job answer
reported after Oppy remembered job `30365-7` and then treated an exhausted provider as
a reason to ask the user for the newer job ID. Latest-job identity questions now bypass
generative interpretation. Oppy first checks source-confirmed browser receipts, then
server receipt history when configured, and independently reads the connected wallet's
ordered `getJobsByPoster` history. The lightweight identity read is separate from the
full job-ledger/indexer path, retries the public Arbitrum endpoint, and updates the
active chat job so the next lifecycle action uses the recovered ID.

The exact production replay supplied stale active-job and receipt memory for
`30365-7`, followed by `I dont remember, can you check?`. The live `/api/chat`
response used model label `deterministic-job-identity`, recovered `30365-10` from the
wallet's canonical creation order and answered: `Your latest posted job is 30365-10
on XDC Network. It is present in OpenWork's live job history.` It did not invoke
Bedrock, prepare a transaction, ask the user to inspect an explorer or submit an
on-chain write.

The release also corrected production configuration drift. The App Runner Arbitrum
parameter still referenced an exhausted Alchemy allowance even though an earlier
release record said it had been rotated. SSM parameter
`/openwork/react-app/prod/ARBITRUM_MAINNET_RPC_URL` is now version `4` and resolves to
`https://arb1.arbitrum.io/rpc`. The same immutable image was recycled to load it.
Post-restart logs contain no monthly-capacity error; the 5,000-block startup scan
completed and the PaymentReleased listener began at block `498546655`. CodeBuild's
role was also missing the `s3:ListBucket` action now required to download an overridden
source object. Its inline policy now grants that action only for the existing build
bucket and `source/*` prefix.

| Release field | Verified value |
|---|---|
| Deployed commit | `72bca49a95888f961b44a133d6578bda068ca2f8` |
| Frontend tests | `132/132` passed |
| Backend tests | `86/86` passed |
| Production build | Vite build passed; existing chunk-size warnings only |
| Source archive | `s3://openwork-react-app-build-source-256309399568/source/releases/openwork-react-app-72bca49a95888f961b44a133d6578bda068ca2f8.zip` |
| Source SHA-256 | `38c345716915d4b38fa452d84d4089ea92a83507bb016f4365cb0b2d9c410ae2` |
| CodeBuild | `openwork-react-app-prod-build:02250a5c-04f3-4d5c-8eca-9509871b8591` — succeeded |
| ECR image | `openwork-app:prod-72bca49-20260826100546` |
| ECR digest | `sha256:ba7507a27c997c20cc83f68a211c1a61684b123b52ea17dcf009cb21c968596b` |
| App Runner image update | `fcf76fc19a6a4d33aa4994e04097077d` — succeeded 26 August 2026 at 15:48:45 IST |
| App Runner RPC reload | `105eab9bcbe541b0b02b005d6b4ebe42` — succeeded 26 August 2026 at 15:55:15 IST |
| Public gates | `/healthz` returned `{"status":"ok"}`; `/chat` returned HTTP `200`; exact stale-memory `/api/chat` replay returned `30365-10` with model `deterministic-job-identity` |

Two unrelated operational warnings remain explicit rather than being represented as
fixed: App Runner has no external database configured, so the chain and browser memory
remain the durable recovery sources; and the Arbitrum service wallet
`0x93514040f43aB16D52faAe7A3f380c4089D844F9` has approximately `0.000500 ETH`, below
the backend's relayer reserve threshold. Funding that service wallet is a separate
on-chain operation and was not performed by this release.

## IPFS infrastructure

Production uploads no longer depend on the unhealthy Lighthouse and Pinata accounts. The frugal AWS provider uses one `t4g.small`, an encrypted retained 30 GiB data volume, CloudFront TLS and four weekly incremental snapshots. Its verified fixed estimate is approximately `$18.95/month` before AWS credits, plus small usage-based transfer and snapshot charges. The complete record is `docs/ipfs-aws-production-2026-07-19.md`.

## Rollback target

If this release regresses, update the same App Runner service back to:

| Field | Value |
|---|---|
| ECR image | `openwork-app:prod-72bca49-20260826100546` |
| ECR digest | `sha256:ba7507a27c997c20cc83f68a211c1a61684b123b52ea17dcf009cb21c968596b` |

Rollback should be followed by the same App Runner operation, health, and public read-only verification gates.
