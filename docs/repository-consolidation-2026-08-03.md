# Repository Consolidation — 3 August 2026

This record describes how the OpenWork web application and the OpenWork contracts
became one repository, what was deleted in the process, and which hazards the merge
removed versus which ones it only made visible. Read it before concluding that
something in this repository is misplaced or duplicated.

## Prior arrangement

Two repositories:

| Repository | Contents |
|---|---|
| `AnasShaikh/openwork-react-app` | React application, managed backend, deployment pipeline |
| `AnasShaikh/openwork-contracts-final` | Solidity sources, Foundry tests, deploy scripts, deployment reference library |

The dependency ran one way. The application named the contract repository as canonical
in its `README.md` and pinned it precisely in `docs/mainnet-contracts.json` through
`canonicalSource` and `deploymentLedger` URLs. The contract repository did not reference
the application at all, though it carried a `references/UI Integration docs/` directory
written for whoever was building the frontend.

## Why it was consolidated

The split was not merely inconvenient; it was actively producing wrong data.

The application repository carried its own partial copy of the contract sources under
`contracts/`. At merge time that copy held **21 `.sol` files against 55 canonical
ones**. Everything deployed in the July 2026 upgrades was missing from it, and
`native-athena.sol` had already diverged in content from the canonical version. Nine
documentation filenames existed in both repositories.

The same drift had reached runtime configuration. Two mainnet entries in
`backend/config.js` disagreed with the live registry: `NATIVE_BRIDGE` pointed at a
January V2 address rather than the live V3, and `LOCAL_BRIDGE_XDC` pointed at the
Optimism bridge rather than the XDC one. Neither key was read at runtime, so neither
caused an incident — but nothing in either repository would have caught them, and the
same class of error in a consumed key would have sent user transactions to a dead
contract.

Consolidation makes contract sources, the live registry, and the frontend runtime
manifest reviewable in a single diff, and makes an automated consistency check possible.

## What was done

Four commits on `main`, merged fast-forward and pushed to `origin`:

| Commit | Effect |
|---|---|
| `e899fd3` | Removed the stale vendored contract snapshot from the application repository. |
| `eb17fed` | Relocated every path in the contract repository under `contracts/`. |
| `d4862e5` | Merged the two histories. |
| `f9b82a7` | Re-homed the contracts CI workflow to the monorepo root. |

History was preserved on both sides. All 210 contract commits kept their original SHAs,
so existing pull-request and commit links still resolve, and the relocation was recorded
as pure renames so `git log --follow` and `git blame` traverse the move. The merged
`main` carries 454 commits. No history was rewritten and nothing was force-pushed.

### Deletions

The application's vendored `contracts/` directory was removed except for three items
that live code reads: `out-minsize/` and `deployed-test-addrs.json`, consumed by
`scripts/*.cjs`, and `openwork-contracts-current-addresses 27 nov.md`, consumed by
`backend/utils/import-deployments.js`. Every deleted Solidity suite has a canonical
equivalent under `contracts/src/suites/`. A third copy of the live registry was deleted
from that directory.

### Three details that would have failed silently

- **`.gitmodules` must sit at the repository root.** Git only reads it from the top
  level, so leaving it at `contracts/.gitmodules` would have orphaned all nine Foundry
  submodules. It was moved to the root and its paths rewritten to `contracts/lib/*`.
- **GitHub only reads workflows from the root `.github/workflows`.** The contracts CI
  would have quietly stopped running. It is now `.github/workflows/contracts.yml` with
  `working-directory: contracts` and a path filter so frontend-only changes do not pay
  for a recursive submodule checkout.
- **`foundry.toml` and `remappings.txt` use only relative paths**, which is why Foundry
  behaves identically when run from `contracts/`. Keep it that way.

## Verification performed

Every CI step was run against the merged tree before the push, and both workflows then
passed on GitHub, including the ported contracts workflow on its first run.

| Check | Result |
|---|---|
| Frontend `npm test` | 45/45 pass |
| `VITE_NETWORK_MODE=mainnet npm run build` | Succeeds |
| Backend `npm test` | 21/21 pass |
| `forge fmt --check test` | Clean |
| `forge build` release boundary | Compiles, Solc 0.8.23 |
| `forge test` current-mainnet | 44/44 pass |
| LayerZero harness profile | 3/3 pass |

## State after the merge

`openwork-contracts-final` is retired. It remains on GitHub as a historical archive and
must not receive new commits. Its content is fully present here.

Two remotes were deliberately **not** updated and still point at the pre-merge commit:
`upstream` (`botopenwork-ui/openwork-react-app`) and `vercel`
(`AnasShaikh/openwork-react-app-vercel`). Pushing to the latter may trigger a production
Vercel deployment, so it was left for an explicit decision.

Three files existed only as uncommitted working-tree changes in the contract repository
and did not come along: a `fundraising/` directory, an Arbitrum relay wallet funding
record, and an IPFS verification SVG.

## Landing site, merged the same day

`krishnaprasath-k/openwork-landing` was merged into `landing/` with its 13 commits.
It is the exact source of `www.openwork.technology`: commit `5d68562`, confirmed by
rebuilding from `landing/` inside this repository and byte-comparing the output against
the live bundle. `index-D93FVCTK.js` and `index-Dc0ogmOU.css` match production exactly.

`krishnaprasath-k/openwork-landing-page` was evaluated and **excluded**. It is an older
variant of the same site — last commit November 2025, 96 filenames shared with the live
repository — and is not deployed anywhere. Merging it would have imported a second,
dead copy of the marketing site.

Two stale worktrees were also removed, `public-docs-current-mainnet` and
`public-docs-release-record`. Each held exactly one unique commit and both were
superseded: one recorded the 1 August release when `main` already had 2 August, and the
other documented a "Retry CCTP Transfer" control that `b48281f` had removed in favour of
automatic reconciliation. Merging either would have regressed the documentation. Their
branches are retained locally as trace.

**The landing deploy still points at the original repository.** It publishes to S3
`openwork-technology-landing-prod-256309399568` behind CloudFront `E1ANKLS7O4YGAE`,
entirely separate from the App Runner pipeline. Until that pipeline is repointed at
`landing/` here, or the original repository is archived, the two copies will drift —
the same failure this consolidation was carried out to end.

## Known follow-ups

- The stale `NATIVE_BRIDGE` and `LOCAL_BRIDGE_XDC` entries in `backend/config.js` are
  still wrong. They are unused, so this is a correctness cleanup rather than an
  incident, and it is now a one-line fix against an in-tree registry.
- Root `references/` and `contracts/references/` share nine duplicate filenames.
- `docs/mainnet-contracts.json` can now be checked against the live registry and
  `src/config/chainConfig.js` in CI. Nothing enforces their agreement yet, which was the
  original motivation for merging.
- Dated records elsewhere in `docs/` still link to `openwork-contracts-final` for pull
  requests and pinned commits. Those links are historically accurate and should be left
  alone.
