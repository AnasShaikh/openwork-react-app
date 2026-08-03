import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import registry from '../../../docs/mainnet-contracts.json';
import ArchitectureDiagram from '../../components/ArchitectureDiagram/ArchitectureDiagram';
import './PublicDocs.css';

const CONTRACT_SOURCE_ROOT = 'https://github.com/AnasShaikh/openwork-contracts-final/blob/main/';

const statusLabel = (value) => ({
  live: 'Live',
  'runtime-verified': 'Runtime verified',
  'source-verified': 'Source verified',
  'source-pending': 'Source pending',
  'proxy-linked': 'Proxy linked',
  'end-to-end-tested': 'End-to-end tested',
  configured: 'Configured',
  disabled: 'Disabled'
}[value] || value);

const StatusBadge = ({ value }) => (
  <span className={`public-docs-status public-docs-status-${value}`}>
    {statusLabel(value)}
  </span>
);

const formatAuditDate = (value) => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${value}T00:00:00Z`));

const compactAddress = (address) => `${address.slice(0, 8)}…${address.slice(-6)}`;

const AddressLink = ({ chain, address, label }) => (
  <span className="public-docs-address-row">
    <a
      className="public-docs-address"
      href={`${chain.explorer}${address}#code`}
      target="_blank"
      rel="noreferrer"
      aria-label={`${label || address} on ${chain.name} explorer`}
      title={address}
    >
      {compactAddress(address)}
    </a>
    <CopyAddressButton address={address} label={label || address} />
  </span>
);

const CopyAddressButton = ({ address, label }) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      className="public-docs-copy"
      type="button"
      onClick={copyAddress}
      aria-label={`Copy ${label} address`}
      title={`Copy ${address}`}
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

const VerificationStatus = ({ contract }) => (
  <div className="public-docs-verification">
    <div>
      <span>Runtime</span>
      <StatusBadge value={contract.runtimeVerification} />
    </div>
    {contract.kind === 'proxy' ? (
      <>
        <div>
          <span>Proxy source</span>
          <StatusBadge value={contract.proxySource} />
        </div>
        <div>
          <span>Implementation</span>
          <StatusBadge value={contract.implementationSource} />
        </div>
        <div>
          <span>Explorer link</span>
          <StatusBadge value={contract.proxyLink} />
        </div>
      </>
    ) : (
      <div>
        <span>Explorer source</span>
        <StatusBadge value={contract.sourceVerification} />
      </div>
    )}
  </div>
);

const RegistryTable = ({ chain }) => (
  <div className="public-docs-table-wrap">
    <table className="public-docs-table">
      <thead>
        <tr>
          <th>Contract</th>
          <th>Proxy / address</th>
          <th>Implementation</th>
          <th>Version</th>
          <th>Explorer status</th>
        </tr>
      </thead>
      <tbody>
        {chain.contracts.map((contract) => (
          <tr key={contract.id}>
            <td data-label="Contract">
              <strong>{contract.name}</strong>
              <span className="public-docs-purpose">{contract.purpose}</span>
              <a
                className="public-docs-source-link"
                href={`${CONTRACT_SOURCE_ROOT}${contract.source}`}
                target="_blank"
                rel="noreferrer"
              >
                Source
              </a>
            </td>
            <td data-label="Proxy / address">
              <span className="public-docs-kind">{contract.kind === 'proxy' ? 'UUPS proxy' : 'Standalone'}</span>
              <AddressLink chain={chain} address={contract.address} label={contract.name} />
            </td>
            <td data-label="Implementation">
              {contract.implementation ? (
                <AddressLink
                  chain={chain}
                  address={contract.implementation}
                  label={`${contract.name} implementation`}
                />
              ) : <span className="public-docs-muted">Not applicable</span>}
            </td>
            <td data-label="Version">{contract.version}</td>
            <td data-label="Verification">
              <VerificationStatus contract={contract} />
              {contract.notes && <p className="public-docs-note">{contract.notes}</p>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const PublicDocs = () => {
  const { summary } = registry;

  return (
    <main className="public-docs-shell">
      <header className="public-docs-hero" id="top">
        <p className="public-docs-eyebrow">OpenWork production documentation</p>
        <h1>OpenWork protocol architecture and mainnet contracts</h1>
        <p className="public-docs-lead">
          A verified reference for OpenWork&apos;s production architecture, deployed contracts,
          cross-chain pathways and explorer status.
        </p>
        <div className="public-docs-meta">
          <span>Last audited: {formatAuditDate(registry.lastAudited)}</span>
          <a href={registry.canonicalSource} target="_blank" rel="noreferrer">Canonical registry</a>
          <a href={registry.deploymentLedger} target="_blank" rel="noreferrer">July 19 deployment ledger</a>
          <a href="/api/docs/contracts">Machine-readable JSON</a>
        </div>
      </header>

      <nav className="public-docs-nav" aria-label="Documentation sections">
        <a href="#architecture">Architecture</a>
        <a href="#registry">Contracts</a>
        <a href="#pathways">Cross-chain status</a>
        <a href="#changes">Recent changes</a>
        <a href="#limitations">Known limitations</a>
      </nav>

      <section className="public-docs-summary" aria-label="Registry summary">
        <article><strong>{summary.activeNetworks}</strong><span>active networks</span></article>
        <article><strong>{summary.activeContractRoles}</strong><span>active contract roles</span></article>
        <article><strong>{summary.activeArtifacts}</strong><span>tracked live artifacts</span></article>
        <article><strong>{summary.explorerSourceVerifiedArtifacts}</strong><span>source verified</span></article>
        <article className="public-docs-summary-warning"><strong>{summary.explorerSourcePendingArtifacts}</strong><span>source publication pending</span></article>
      </section>

      <aside className="public-docs-alert">
        <strong>Verification status is intentionally explicit.</strong>
        <span>
          All 19 artifacts deployed on July 19 are live and runtime-verified, but their source is
          not yet published on the relevant explorer. Existing linked proxies continue to point to
          those implementations through their audited ERC-1967 slots.
        </span>
      </aside>

      <section className="public-docs-section public-docs-section--feature" id="architecture">
        <div className="public-docs-section-heading">
          <p className="public-docs-eyebrow">Current production topology</p>
          <h2>How the contracts work together</h2>
          <p>
            Four chains and two transport layers. LayerZero carries application messages,
            Circle CCTP moves native USDC, and the two travel independently so the Arbitrum
            hub reconciles them. Pick an action below to see which contracts it touches and
            over which transport. Every contract links to its address on the explorer.
          </p>
        </div>

        <ArchitectureDiagram registry={registry} />
      </section>

      <section className="public-docs-section" id="registry">
        <div className="public-docs-section-heading">
          <p className="public-docs-eyebrow">Live contracts</p>
          <h2>Addresses, implementations and source status</h2>
          <p>Addresses below were compared with live code, ERC-1967 slots and the latest deployment ledger.</p>
        </div>

        {registry.chains.map((chain) => (
          <article className="public-docs-chain-registry" key={chain.key} id={`chain-${chain.key}`}>
            <div className="public-docs-chain-heading">
              <div>
                <p className="public-docs-eyebrow">{chain.role}</p>
                <h3>{chain.name}</h3>
              </div>
              <dl>
                <div><dt>Chain ID</dt><dd>{chain.chainId}</dd></div>
                <div><dt>LZ EID</dt><dd>{chain.lzEid}</dd></div>
                <div><dt>CCTP domain</dt><dd>{chain.cctpDomain}</dd></div>
                <div><dt>Audit block</dt><dd>{registry.auditedBlocks[chain.key]}</dd></div>
              </dl>
            </div>
            <RegistryTable chain={chain} />
            <details className="public-docs-dependencies">
              <summary>External dependencies</summary>
              <dl>
                {Object.entries(chain.dependencies).map(([name, address]) => (
                  <div key={name}><dt>{name}</dt><dd>{address}</dd></div>
                ))}
              </dl>
            </details>
          </article>
        ))}
      </section>

      <section className="public-docs-section" id="pathways">
        <div className="public-docs-section-heading">
          <p className="public-docs-eyebrow">Cross-chain readiness</p>
          <h2>Connected is not the same as tested</h2>
        </div>
        <div className="public-docs-pathways">
          {registry.pathways.map((pathway) => (
            <article key={pathway.name}>
              <div><h3>{pathway.name}</h3><StatusBadge value={pathway.status} /></div>
              <p>{pathway.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="public-docs-section" id="changes">
        <div className="public-docs-section-heading">
          <p className="public-docs-eyebrow">July 19 to August 4</p>
          <h2>Architecture changes now represented here</h2>
        </div>
        <div className="public-docs-change-grid">
          <article><h3>Replacement bridges</h3><p>NativeLZOpenworkBridge V3 on Arbitrum and LocalLZOpenworkBridge V2 on XDC replaced the active production pointers and added applicant-milestone callbacks.</p></article>
          <article><h3>Historical governance power</h3><p>OpenworkVotingPowerCheckpoints V1 was deployed behind separate proxies on Ethereum and Arbitrum, then seeded from audited live accounts.</p></article>
          <article><h3>Reliable DAO messaging</h3><p>ETHDAOMessaging V1 now owns retryable, exactly-once outbound governance notifications outside the near-limit DAO implementation.</p></article>
          <article><h3>Ordered stake sync</h3><p>NativeDAOStakeSync V1 applies Ethereum staking updates on Arbitrum in order and fails closed instead of silently losing updates.</p></article>
          <article><h3>Lifecycle and rating fixes</h3><p>NOWJC V5, ArbLOWJC V5, NativeAthena V9, ProfileGenesis V2 and ProfileManager V3 add lifecycle validation, XDC routing and canonical job-bound rating checks.</p></article>
          <article><h3>Rewards configuration</h3><p>On August 1, NativeRewards.profileGenesis was configured to the current ProfileGenesis proxy. No new contract was deployed for that correction.</p></article>
          <article><h3>Arbitrum direct execution verified</h3><p>On August 4 a full job cycle ran end to end on Arbitrum through ArbLOWJC V5 — posted, started and released — settling 0.10 USDC to the selected applicant. Same-chain jobs use neither LayerZero nor CCTP, so there is nothing to relay and nothing to reconcile.</p></article>
          <article><h3>Keeper bounties funded</h3><p>Relaying a CCTP message is permissionless, and each transceiver pays the caller a gas-based reward, which is why third parties complete these transfers. All three transceivers were funded on August 4 after running empty, which had silently removed that incentive without producing any error.</p></article>
          <article><h3>XDC reward cap corrected</h3><p>The XDC transceiver reward was capped below the cost of the relay itself, so no rational keeper would take it. maxRewardAmount was raised to 0.01 XDC on August 4, restoring a reward of roughly twice the gas spent.</p></article>
        </div>
      </section>

      <section className="public-docs-section" id="limitations">
        <div className="public-docs-section-heading">
          <p className="public-docs-eyebrow">Do not infer beyond these facts</p>
          <h2>Known limitations and held work</h2>
        </div>
        <ul className="public-docs-limitations">
          <li>The 19 artifacts deployed on July 19 remain pending explorer source publication even though live runtimes and proxy slots were verified.</li>
          <li>The direct XDC/Ethereum LayerZero pathway is disabled; route application traffic through Arbitrum.</li>
          <li>NOWJC currently calculates zero platform commission because both live proxy settings are zero. Historical 1%/$1 descriptions are not current production behavior.</li>
          <li>LocalAthena V2 exists in source but is intentionally not live pending a production dispute-minimum decision.</li>
          <li>The old Arbitrum and XDC bridges remain deployed for rollback/in-flight compatibility; they are not the active application pointers.</li>
        </ul>

        <details className="public-docs-legacy">
          <summary>Legacy bridge deployments</summary>
          {registry.legacyDeployments.map((contract) => (
            <p key={`${contract.chain}-${contract.address}`}>
              <strong>{contract.chain}: {contract.name}</strong> — <code>{contract.address}</code> — {contract.status}.
            </p>
          ))}
        </details>
      </section>

      <footer className="public-docs-footer">
        <p>This page is the public production summary. The previous interactive contract explorer is retained for historical reference only.</p>
        <div>
          <a href={registry.canonicalSource} target="_blank" rel="noreferrer">Canonical registry</a>
          <a href="/api/docs/skill">Agent documentation</a>
          <Link to="/docs/legacy">Open legacy explorer</Link>
          <a href="#top">Back to top</a>
        </div>
      </footer>
    </main>
  );
};

export default PublicDocs;
