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
        <strong id="ow-network-routes-title">Messages and value travel independently</strong>
      </div>
      <div className="ow-network-routes__graphic">
        <svg viewBox="0 0 1000 106" role="img" aria-labelledby="ow-route-title ow-route-description">
          <title id="ow-route-title">OpenWork production cross-chain routes</title>
          <desc id="ow-route-description">LayerZero connects Optimism, XDC and Ethereum to the Arbitrum hub. Circle CCTP connects Optimism and XDC USDC to Arbitrum. Direct XDC to Ethereum messaging is disabled.</desc>
          <defs>
            <marker id="ow-route-arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
            <marker id="ow-route-arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
          </defs>
          <path className="ow-route-line ow-route-line--message" d="M 115 31 C 210 31, 300 42, 392 42" markerEnd="url(#ow-route-arrow-blue)" />
          <path className="ow-route-line ow-route-line--message" d="M 660 31 C 570 31, 500 31, 410 31" markerEnd="url(#ow-route-arrow-blue)" />
          <path className="ow-route-line ow-route-line--message" d="M 895 31 C 750 8, 565 8, 408 20" markerEnd="url(#ow-route-arrow-blue)" />
          <path className="ow-route-line ow-route-line--message-spine" d="M 400 20 L 400 42" />
          <path className="ow-route-line ow-route-line--usdc" d="M 115 73 C 210 73, 280 73, 390 73" markerEnd="url(#ow-route-arrow-green)" />
          <path className="ow-route-line ow-route-line--usdc" d="M 660 73 C 570 73, 500 73, 410 73" markerEnd="url(#ow-route-arrow-green)" />
          <path className="ow-route-line ow-route-line--disabled" d="M 680 91 L 875 91" />
          {[
            [105, 'Optimism', true],
            [400, 'Arbitrum hub', true],
            [670, 'XDC', true],
            [900, 'Ethereum', false],
          ].map(([x, label, hasCctp]) => (
            <g key={label} transform={`translate(${x} 0)`}>
              <circle className="ow-route-node" cx="0" cy="31" r="7" />
              {hasCctp && <circle className="ow-route-node ow-route-node--usdc" cx="0" cy="73" r="7" />}
              <text x="0" y="104" textAnchor="middle">{label}</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="ow-network-routes__legend" aria-label="Route legend">
        <span className="is-message">LayerZero message</span>
        <span className="is-usdc">Circle CCTP USDC</span>
        <span className="is-disabled">Direct route disabled</span>
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
        <span><ShieldCheck aria-hidden="true" /> All 31 live roles and 19 proxy slots checked on 7 August 2026</span>
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
