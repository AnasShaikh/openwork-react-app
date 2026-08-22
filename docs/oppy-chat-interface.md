# Oppy chat interface

## Purpose

Oppy is the application's global assistant entry point. The interface has two parts:

- `HomeChatLauncher` is the fixed launcher used across application pages.
- `OppyChat` is the full job-management chat at `/chat`.

The visual treatment follows the existing OpenWork system: Satoshi typography, white
surfaces, restrained blue gradients, fine cool-grey borders, compact radii and soft
depth. The launcher and composer should feel like part of the product rather than a
separate chat widget.

## Global launcher routing

`GlobalOppyLauncher` lives inside `BrowserRouter` in `src/App.jsx`, so route changes
update the launcher without a page reload. It renders on every application route except
`/chat` and `/oppy`, where another Oppy entry point would be redundant. The mobile
desktop-only warning renders the same launcher directly so users can still reach the
mobile-compatible chat.

The launcher is a normal link to `/chat`, retains an explicit accessible name and has
visible keyboard focus. On desktop it shows the Oppy icon, availability indicator,
label and destination cue. At the mobile breakpoint it becomes an icon-only 52 px
control while retaining the same accessible name and destination.

## Chat composition

`src/pages/OppyChat/OppyChat.jsx` owns the chat shell and `OppyChat.css` owns its visual
states. The composer uses one `chat-input-shell` for the text field, microphone and Send
action. `:focus-within` gives the group one focus treatment, while each button keeps its
own keyboard focus ring.

The microphone remains a secondary action. Send is the primary blue action and uses an
up arrow consistent with modern messaging interfaces. Disabled, recording, error and
focused states must remain visibly distinct. Voice input only fills the editable text
field; it never submits a message automatically. The voice runtime and support runbook
are documented in `docs/oppy-voice-transcription.md`.

Assistant messages use a small Oppy avatar and soft neutral bubbles. User messages use
the OpenWork blue gradient. Suggestions remain horizontally scrollable on narrow
screens, and wallet status is presented as a quiet structured row rather than a group
of unrelated pills.

## Chat-native job workflows

All job-management tools exposed to Oppy must complete inside `/chat`. The application
must not route a user to a legacy form after Oppy has gathered the required details.
The wallet's own secure panel is the only external surface: network switching, token
approval and transaction signatures still happen there because the application must
never imitate or bypass a wallet confirmation.

The currently supported tools are grouped as follows:

- Read-only: `browseJobs`, `openJob`, `openMyJobs` and `viewApplications` append the
  deterministic explorer card returned by `/api/oppy/explore/*`.
- Non-funding writes: `postJob`, `applyToJob`, `submitWork` and `createProfile` render
  an inline review card and use the existing chain write adapters.
- Funding or lifecycle writes: `startDirectContract`, `startJob`, `releasePayment` and
  `raiseDispute` run their posting-chain, role, balance and allowance checks from the
  inline card before asking the wallet to sign.

Links inside explorer cards are also chat-native. Job rows append a job deep-dive;
profile links append that wallet's dashboard; open-job applications expose an inline
Hire action; open jobs expose an inline Apply form; and attention items prepare the
relevant submission or payment action. Do not reintroduce `navigate()` calls for these
flows. The back button is the only product navigation owned by `OppyChat`.

`src/services/oppyActionService.js` contains read-only explorer loading, exact
six-decimal USDC conversion, reusable balance/allowance preflight, active-oracle reads
and payment-target resolution. `src/services/localChainService.js` remains the write
boundary and owns the live ABI routing, fee quote and receipt. In particular, direct
contracts use the deployed five-argument native Arbitrum signature or six-argument
cross-chain signature through `contractWriteRouter`; UI code must not construct a
contract selector independently.

Backend explorer reads first use the configured Arbitrum RPC and retry the public
Arbitrum endpoint when that provider is unavailable or out of capacity. Both chat and
`/api/oppy/explore/*` go through the same fallback boundary. This is read-only
resilience; wallet writes and transaction preflights keep their existing chain
adapters and must never be rerouted through the backend explorer fallback.

The action card owns its progress instead of replacing unrelated chat messages. The
minimum states are preparing, network switch, USDC approval, wallet signature,
broadcast, confirmed and failed. After 12 seconds in a wallet state, or 8 seconds after
a broadcast, it runs read-only wallet and network diagnostics and warns against
starting a duplicate. Retry remains disabled for pending or unknown outcomes and is
unlocked only after an explicit cancellation, a reverted receipt or a repeatedly
verified drop. A confirmed receipt permanently replaces the action button with its
explorer link. The state machine, privacy boundary, limitations and maintenance
runbook are documented in `docs/oppy-transaction-copilot.md`.

Cross-chain progress is also owned by the transaction card that created it. Never
render a singleton tracker from `activeJob`, and never preserve a completed tracker
when the action name or source transaction hash changes. Job creation and Direct
Contract creation may use canonical job creation as their final application-state
proof. Payment release must instead compare canonical `totalPaid` with the snapshot
taken immediately before the release; an already-existing job is not evidence that a
new payment completed.

`GET /api/oppy/cross-chain-status` combines the source receipt already observed by the
client with the LayerZero destination transaction and a minimal Arbitrum Genesis read.
For an Optimism or XDC payout, completion additionally requires Circle's attestation
and a non-zero `usedNonces(bytes32)` result on the destination MessageTransmitter. The
card may say `Payment received` only when every required signal agrees. A provider
failure remains an in-progress/unavailable state and is retried automatically; it must
never be converted into a green result. The verifier is read-only and falls back from
the configured Arbitrum provider to the public Arbitrum RPC when necessary.

Use provider-neutral language (`your wallet` or `EVM wallet`). Oppy discovers injected
wallets through EIP-6963, with `window.ethereum.providers` as the compatibility
fallback. When more than one wallet is installed, injection order must never choose
the signer: the user explicitly selects Brave Wallet, MetaMask or another provider in
the wallet status row. The choice is stored under `ow_selected_wallet_provider`, and
the selected wallet name also appears in every transaction review card.

`src/services/injectedWalletProviders.js` owns discovery, identity, remembered
selection and provider/RPC error copy. `OppyChat` must pass that exact provider to
network switching, USDC approval and every `localChainService` write. Do not reintroduce
bare `window.ethereum` reads or writes in the Oppy action path; doing so can show a
Brave Wallet panel while silently sending the request to MetaMask. If the selected
provider cannot reach the network, fail the card with the provider and network names
and state that no transaction was submitted.

Never claim MetaMask is required, never ask for a seed phrase or private key, and
never submit a second write while the first provider request is unresolved.

## Responsive and accessibility requirements

- Do not introduce horizontal page overflow at 390 px.
- Keep interactive chat controls at least 42 px in both dimensions.
- Keep the composer input at 16 px on mobile to prevent iOS focus zoom.
- Preserve accessible names for launcher, microphone and Send actions.
- Preserve `aria-pressed` for the recording state and the live voice status region.
- Preserve visible `:focus-visible` states and reduced-motion behavior.
- Never render the global launcher on `/chat` or `/oppy`.

## Verification

Run the regression suite and production build before release:

```bash
npm test
npm run build
git diff --check
```

The Oppy interface regression tests are in `tests/oppyChat.test.js`; provider discovery
behavior is covered by `tests/injectedWalletProviders.test.js`; transaction diagnosis
and duplicate-safe retry are covered by `tests/transactionDiagnostics.test.js` and
`tests/txReliability.test.js`; transaction-scoped cross-chain proof is covered by
`tests/crossChainSync.test.js` and
`backend/tests/cross-chain-action-status.test.js`. Browser review
must cover desktop and 390 x 844 mobile layouts, the enabled and disabled composer
states, read-only action cards that preserve the `/chat` URL, job drill-down, inline
application and dispute forms, launcher presence on a non-Oppy route, launcher absence
on `/chat`, keyboard focus, control dimensions and horizontal overflow. Wallet-write
QA must use a mock provider or stop before the action button. A multi-wallet mock must
verify explicit selection, the wallet label on the review card, a 42 px mobile selector
and zero horizontal overflow. Release verification
must never approve USDC or submit a real transaction. After deployment, repeat the
same checks against `https://app.openwork.technology` and confirm `/healthz` and
`/chat` return HTTP 200.
