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

The Oppy interface regression tests are in `tests/oppyChat.test.js`. Browser review
must cover desktop and 390 x 844 mobile layouts, the enabled and disabled composer
states, launcher presence on a non-Oppy route, launcher absence on `/chat`, keyboard
focus, control dimensions and horizontal overflow. After deployment, repeat the same
checks against `https://app.openwork.technology` and confirm `/healthz` and `/chat`
return HTTP 200.
