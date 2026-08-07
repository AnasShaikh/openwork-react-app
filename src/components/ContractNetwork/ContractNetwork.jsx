import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  CHAIN_LAYOUT,
  CONTRACT_PRESENTATION,
  indexContracts,
} from '../../pages/PublicDocs/architecture';
import './ContractNetwork.css';

const SOURCE_ROOT = 'https://github.com/AnasShaikh/openwork-react-app/blob/main/contracts/';

const STATUS_LABELS = {
  live: 'Live',
  'runtime-verified': 'Runtime verified',
  'source-verified': 'Source verified',
  'source-pending': 'Source pending',
  'proxy-linked': 'Proxy linked',
  configured: 'Configured',
  'end-to-end-tested': 'End-to-end tested',
  disabled: 'Disabled',
};

const statusLabel = (status) => STATUS_LABELS[status] || status;

const compactAddress = (address) => `${address.slice(0, 7)}…${address.slice(-5)}`;

const sourceStatus = (contract) => {
  if (contract.kind === 'proxy') {
    return contract.proxySource === 'source-pending' || contract.implementationSource === 'source-pending'
      ? 'source-pending'
      : 'source-verified';
  }
  return contract.sourceVerification;
};

function CopyValueButton({ value, label }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button type="button" className="ow-contract-copy" onClick={copy} aria-label={`Copy ${label}`}>
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      <span>{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

function AddressRow({ chain, address, label }) {
  return (
    <div className="ow-contract-address">
      <a href={`${chain.explorer}${address}#code`} target="_blank" rel="noreferrer" title={address}>
        <code>{address}</code>
        <ExternalLink aria-hidden="true" />
      </a>
      <CopyValueButton value={address} label={label} />
    </div>
  );
}

function VerificationRows({ contract }) {
  const rows = [{ label: 'Runtime', value: contract.runtimeVerification }];

  if (contract.kind === 'proxy') {
    rows.push(
      { label: 'Proxy source', value: contract.proxySource },
      { label: 'Implementation source', value: contract.implementationSource },
      { label: 'Proxy link', value: contract.proxyLink },
    );
  } else {
    rows.push({ label: 'Explorer source', value: contract.sourceVerification });
  }

  return (
    <dl className="ow-contract-verification">
      {rows.map((row) => (
        <div key={row.label}>
          <dt>{row.label}</dt>
          <dd className={`ow-status ow-status--${row.value}`}>{statusLabel(row.value)}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ContractDrawer({ registry, contract, onClose, onSelect }) {
  const closeRef = useRef(null);
  const chain = registry.chains.find((entry) => entry.key === contract.chainKey);
  const presentation = CONTRACT_PRESENTATION[contract.id] || {};
  const configuration = registry.configurationByContract?.[contract.id];
  const contracts = useMemo(() => indexContracts(registry), [registry]);
  const related = (presentation.related || []).map((id) => contracts[id]).filter(Boolean);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [contract.id, onClose]);

  return (
    <div className="ow-contract-drawer-layer" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside
        className="ow-contract-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ow-contract-drawer-title"
      >
        <header className="ow-contract-drawer__header">
          <div>
            <span className="ow-contract-drawer__chain">{chain.name} · {presentation.role}</span>
            <h2 id="ow-contract-drawer-title">{contract.name}</h2>
          </div>
          <button ref={closeRef} type="button" className="ow-contract-drawer__close" onClick={onClose} aria-label="Close contract details">
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="ow-contract-drawer__content">
          <div className="ow-contract-drawer__badges">
            <span className="ow-status ow-status--runtime-verified">Runtime verified</span>
            <span className={`ow-status ow-status--${sourceStatus(contract)}`}>{statusLabel(sourceStatus(contract))}</span>
            {configuration && (
              <span className={`ow-status ow-status--${configuration.status}`}>{statusLabel(configuration.status)}</span>
            )}
          </div>

          <section className="ow-contract-drawer__section">
            <h3>Production role</h3>
            <p className="ow-contract-drawer__purpose">{contract.purpose}</p>
            <dl className="ow-contract-facts">
              <div><dt>Version</dt><dd>{contract.version}</dd></div>
              <div><dt>Deployment</dt><dd>{contract.kind === 'proxy' ? 'UUPS proxy' : 'Standalone'}</dd></div>
              <div><dt>Chain ID</dt><dd>{chain.chainId}</dd></div>
              <div><dt>Audit block</dt><dd>{registry.auditedBlocks[chain.key].toLocaleString()}</dd></div>
            </dl>
          </section>

          <section className="ow-contract-drawer__section">
            <h3>{contract.kind === 'proxy' ? 'Live proxy' : 'Live address'}</h3>
            <AddressRow chain={chain} address={contract.address} label={`${contract.name} address`} />
            {contract.implementation && (
              <>
                <h4>Current implementation</h4>
                <AddressRow chain={chain} address={contract.implementation} label={`${contract.name} implementation`} />
              </>
            )}
          </section>

          <section className="ow-contract-drawer__section">
            <div className="ow-contract-drawer__section-heading">
              <h3>Verification</h3>
              <span>Checked {registry.lastAudited}</span>
            </div>
            <VerificationRows contract={contract} />
          </section>

          {configuration && (
            <section className="ow-contract-drawer__section ow-contract-drawer__section--configuration">
              <div className="ow-contract-drawer__configuration-title">
                <ShieldCheck aria-hidden="true" />
                <div>
                  <h3>Live configuration</h3>
                  <span>{statusLabel(configuration.status)}</span>
                </div>
              </div>
              <p>{configuration.detail}</p>
            </section>
          )}

          {contract.notes && (
            <section className="ow-contract-drawer__note">
              <strong>Important live-state note</strong>
              <p>{contract.notes}</p>
            </section>
          )}

          <section className="ow-contract-drawer__section">
            <h3>Source</h3>
            <a className="ow-contract-source" href={`${SOURCE_ROOT}${contract.source}`} target="_blank" rel="noreferrer">
              <code>{contract.source}</code>
              <ExternalLink aria-hidden="true" />
            </a>
          </section>

          {related.length > 0 && (
            <section className="ow-contract-drawer__section">
              <h3>Connected contracts</h3>
              <div className="ow-contract-related">
                {related.map((entry) => (
                  <button key={entry.id} type="button" onClick={() => onSelect(entry)}>
                    <span>{CONTRACT_PRESENTATION[entry.id]?.label || entry.name}</span>
                    <small>{entry.chainName}</small>
                    <ArrowRight aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          )}

          <details className="ow-contract-dependencies">
            <summary>External chain dependencies</summary>
            <dl>
              {Object.entries(chain.dependencies || {}).map(([name, address]) => (
                <div key={name}><dt>{name}</dt><dd><code>{address}</code></dd></div>
              ))}
            </dl>
          </details>
        </div>
      </aside>
    </div>
  );
}

function RouteRail() {
  return (
    <section className="ow-network-routes" aria-labelledby="ow-network-routes-title">
      <div className="ow-network-routes__copy">
        <span>Transport layer</span>
        <strong id="ow-network-routes-title">Messages and USDC use separate routes</strong>
      </div>
      <div className="ow-network-routes__graphic">
        <svg viewBox="0 0 920 118" role="img" aria-labelledby="ow-route-title ow-route-description">
          <title id="ow-route-title">OpenWork production cross-chain routes</title>
          <desc id="ow-route-description">Separate, two-way LayerZero message lanes connect Optimism, XDC and Ethereum with the Arbitrum hub. Separate Circle CCTP lanes move USDC between Optimism and Arbitrum, and between XDC and Arbitrum. Direct XDC to Ethereum messaging is disabled.</desc>
          <defs>
            <marker id="ow-route-arrow-blue" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
            <marker id="ow-route-arrow-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
          </defs>

          <rect className="ow-route-hub" x="350" y="10" width="100" height="76" rx="14" />
          <text className="ow-route-hub__eyebrow" x="400" y="45" textAnchor="middle">ARBITRUM</text>
          <text className="ow-route-hub__label" x="400" y="60" textAnchor="middle">hub</text>

          <path className="ow-route-line ow-route-line--message" d="M 100 26 H 335" markerStart="url(#ow-route-arrow-blue)" markerEnd="url(#ow-route-arrow-blue)" />
          <path className="ow-route-line ow-route-line--message" d="M 465 43 H 635" markerStart="url(#ow-route-arrow-blue)" markerEnd="url(#ow-route-arrow-blue)" />
          <path className="ow-route-line ow-route-line--message" d="M 465 26 C 560 3, 745 3, 835 26" markerStart="url(#ow-route-arrow-blue)" markerEnd="url(#ow-route-arrow-blue)" />
          <path className="ow-route-line ow-route-line--usdc" d="M 100 70 H 335" markerStart="url(#ow-route-arrow-green)" markerEnd="url(#ow-route-arrow-green)" />
          <path className="ow-route-line ow-route-line--usdc" d="M 465 70 H 635" markerStart="url(#ow-route-arrow-green)" markerEnd="url(#ow-route-arrow-green)" />
          <path className="ow-route-line ow-route-line--disabled" d="M 665 91 H 835" />

          <circle className="ow-route-node" cx="85" cy="26" r="7" />
          <circle className="ow-route-node ow-route-node--usdc" cx="85" cy="70" r="7" />
          <circle className="ow-route-port" cx="350" cy="26" r="5" />
          <circle className="ow-route-port ow-route-port--usdc" cx="350" cy="70" r="5" />
          <circle className="ow-route-port" cx="450" cy="26" r="5" />
          <circle className="ow-route-port" cx="450" cy="43" r="5" />
          <circle className="ow-route-port ow-route-port--usdc" cx="450" cy="70" r="5" />
          <circle className="ow-route-node" cx="650" cy="43" r="7" />
          <circle className="ow-route-node ow-route-node--usdc" cx="650" cy="70" r="7" />
          <circle className="ow-route-node" cx="850" cy="26" r="7" />
          <circle className="ow-route-node ow-route-node--disabled" cx="650" cy="91" r="4" />
          <circle className="ow-route-node ow-route-node--disabled" cx="850" cy="91" r="4" />

          <text x="85" y="116" textAnchor="middle">Optimism</text>
          <text x="400" y="106" textAnchor="middle">Arbitrum hub</text>
          <text x="650" y="116" textAnchor="middle">XDC</text>
          <text x="850" y="116" textAnchor="middle">Ethereum</text>
        </svg>
        <div
          className="ow-network-routes__mobile"
          role="img"
          aria-label="LayerZero messages travel both ways between Arbitrum and Optimism, XDC, and Ethereum. Circle CCTP moves USDC both ways between Arbitrum and Optimism, and between Arbitrum and XDC. Direct XDC to Ethereum messaging is disabled."
        >
          <div className="is-message">
            <strong>LayerZero messages</strong>
            <span><b>Optimism</b><i>↔</i><b>Arbitrum</b></span>
            <span><b>XDC</b><i>↔</i><b>Arbitrum</b></span>
            <span><b>Ethereum</b><i>↔</i><b>Arbitrum</b></span>
          </div>
          <div className="is-usdc">
            <strong>Circle CCTP USDC</strong>
            <span><b>Optimism</b><i>↔</i><b>Arbitrum</b></span>
            <span><b>XDC</b><i>↔</i><b>Arbitrum</b></span>
          </div>
          <div className="is-disabled">
            <strong>Direct route disabled</strong>
            <span><b>XDC</b><i>···</i><b>Ethereum</b></span>
          </div>
        </div>
      </div>
      <div className="ow-network-routes__legend" aria-label="Route legend">
        <span className="is-message">LayerZero messages · two-way</span>
        <span className="is-usdc">Circle CCTP USDC · two-way</span>
        <span className="is-disabled">XDC ↔ Ethereum disabled</span>
      </div>
    </section>
  );
}

function ContractTile({ contract, isSelected, isRelated, isDimmed, configuration, onSelect }) {
  const presentation = CONTRACT_PRESENTATION[contract.id] || { label: contract.name, role: contract.purpose };
  const publicationStatus = sourceStatus(contract);

  return (
    <button
      type="button"
      className={[
        'ow-contract-tile',
        isSelected ? 'is-selected' : '',
        isRelated ? 'is-related' : '',
        isDimmed ? 'is-dimmed' : '',
      ].filter(Boolean).join(' ')}
      onClick={() => onSelect(contract)}
      aria-label={`Open ${contract.name} production details`}
    >
      <img src={`/${presentation.icon || 'file-icon.svg'}`} alt="" />
      <span className="ow-contract-tile__copy">
        <strong>{presentation.label}</strong>
        <small>{presentation.role}</small>
      </span>
      <span className="ow-contract-tile__status" aria-label={`${statusLabel(publicationStatus)}; ${statusLabel(configuration?.status || 'configured')}`}>
        <i className={`is-${publicationStatus}`} title={statusLabel(publicationStatus)} />
        <i className={`is-${configuration?.status || 'configured'}`} title={statusLabel(configuration?.status || 'configured')} />
      </span>
    </button>
  );
}

export default function ContractNetwork({ registry, selectedContract, onSelectContract }) {
  const contracts = useMemo(() => indexContracts(registry), [registry]);
  const selectedId = selectedContract?.id;
  const relatedIds = new Set(selectedId ? [selectedId, ...(CONTRACT_PRESENTATION[selectedId]?.related || [])] : []);

  return (
    <div className="ow-network">
      <RouteRail />

      <div className="ow-network__hint">
        <span><ShieldCheck aria-hidden="true" /> All 31 active contract functions and 19 proxy slots checked on 7 August 2026</span>
        <span>Select a tile for addresses, verification and configuration</span>
      </div>

      <div className="ow-network__chains">
        {CHAIN_LAYOUT.map((layout) => {
          const chain = registry.chains.find((entry) => entry.key === layout.chainKey);
          return (
            <section className={`ow-chain ow-chain--${chain.key}`} key={chain.key} aria-labelledby={`ow-chain-${chain.key}`}>
              <header className="ow-chain__header">
                <div>
                  <span>{layout.shortRole}</span>
                  <h3 id={`ow-chain-${chain.key}`}>{chain.name}</h3>
                </div>
                <strong>{chain.contracts.length}</strong>
              </header>
              <div className="ow-chain__meta">
                <span>ID {chain.chainId}</span>
                <span>LZ {chain.lzEid}</span>
                <span>CCTP {chain.cctpDomain}</span>
              </div>

              <div className="ow-chain__groups">
                {layout.groups.map((group) => (
                  <section className="ow-chain__group" key={group.label}>
                    <h4>{group.label}</h4>
                    <div className="ow-chain__tiles">
                      {group.contracts.map((contractId) => {
                        const contract = contracts[contractId];
                        if (!contract) return null;
                        return (
                          <ContractTile
                            key={contractId}
                            contract={contract}
                            configuration={registry.configurationByContract?.[contractId]}
                            isSelected={selectedId === contractId}
                            isRelated={Boolean(selectedId && relatedIds.has(contractId) && selectedId !== contractId)}
                            isDimmed={Boolean(selectedId && !relatedIds.has(contractId))}
                            onSelect={onSelectContract}
                          />
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
