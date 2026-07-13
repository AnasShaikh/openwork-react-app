# Documentation, Verification, and Publishing

## Required records

Maintain four distinct records:

1. **Live registry:** one row per live contract, with chain, proxy, implementation, version, exact source file, explorer links, and verification/link status.
2. **Verification tracker:** explorer submission/result, compiler/settings, and proxy linking.
3. **Dated execution log:** plan, approval cap, each paid call, receipts, costs, state readbacks, test evidence, and remaining work.
4. **Source control evidence:** dated source copies, deployment/config scripts, focused tests, and safe public broadcast artifacts when useful.

Avoid a second address catalog that will drift. README/index documents should link to the canonical live registry.

## Verification checklist

For each implementation or non-upgradeable contract, record:

- exact address and creation transaction;
- fully qualified source path and contract name;
- compiler build;
- optimizer enabled/runs;
- `viaIR` and EVM version;
- constructor arguments;
- explorer result and link;
- live runtime code size.

For each proxy, additionally record:

- proxy source verification;
- ERC-1967 implementation slot;
- explorer proxy-link result;
- initializer arguments and initialized owner/configuration.

“Already verified” can be valid for identical proxy bytecode, but still verify and record the implementation link.

## Cost accounting

Compute actual cost from receipt fields and cross-check balance deltas:

```text
gas cost = gasUsed × effectiveGasPrice
total transaction cost = gas cost + explicit native value
```

For LayerZero sends, explicit native value may include the quoted message fee and dwarf gas. Keep deployment-phase spend and later approved test/configuration spend separately, then show any overall total clearly.

## Dated-log minimum fields

- status and stop boundary;
- signer public address;
- source immutability/copy decision;
- network constants and dependencies;
- predicted versus confirmed addresses;
- numbered paid call sequence;
- transaction hash, nonce, gas, effective price, cost, and value;
- source verification and proxy link;
- pre/post configuration audit;
- LayerZero/CCTP security configuration;
- end-to-end GUID/source/destination/application evidence;
- cumulative cap result;
- known limitations and external repository work.

Never place private keys, raw signed transactions containing unnecessary sensitive context, API keys, or `.env` content in logs.

## Repository hygiene

Before publishing:

1. Inspect all modified and untracked files.
2. Exclude `.env`, OS metadata, caches, build artifacts, disposable-fork receipts, and unrelated dependency dirt.
3. Ensure every included broadcast artifact is public-chain evidence or clearly labeled rehearsal data.
4. Run focused tests and skill validation.
5. Re-read the final diff for addresses, totals, stale status text, and secrets.
6. Commit only the intended scope with a descriptive message.
7. Push the intended branch and verify the remote commit.
8. Confirm the worktree is clean, including submodules.

When an older legitimate local edit exists and the user explicitly requires a clean tree, either include it as a separately understood part of the commit or obtain direction. Never silently discard it.
