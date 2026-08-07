import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Braces,
  ExternalLink,
  FileCheck2,
  GitBranch,
  MessageSquare,
  Network,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import registry from '../../../docs/mainnet-contracts.json';
import ContractNetwork, { ContractDrawer } from '../../components/ContractNetwork/ContractNetwork';
import { CONTRACT_PRESENTATION, FLOWS, NODES, indexContracts } from './architecture';
import OppyPanel from './OppyPanel';
import './PublicDocs.css';

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

const formatAuditDate = (value) => new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${value}T00:00:00Z`));

const viewTabs = [
  { id: 'network', label: 'Network', icon: Network },
  { id: 'flows', label: 'Function flows', icon: Workflow },
  { id: 'oppy', label: 'Agent Oppy', icon: MessageSquare },
  { id: 'status', label: 'Status & changes', icon: ShieldCheck },
];

function StatusBadge({ value }) {
  return <span className={`public-docs-status public-docs-status--${value}`}>{statusLabel(value)}</span>;
}

function FunctionFlowsView({ registry: productionRegistry, onSelectContract }) {
  const flows = FLOWS.filter((flow) => flow.id !== 'overview');
  const [activeFlowId, setActiveFlowId] = useState('direct');
  const activeFlow = flows.find((flow) => flow.id === activeFlowId) || flows[0];
  const contracts = useMemo(() => indexContracts(productionRegistry), [productionRegistry]);
  const usedContracts = activeFlow.nodes
    .map((nodeId) => NODES[nodeId]?.contractId)
    .filter(Boolean)
    .map((contractId) => contracts[contractId])
    .filter(Boolean);

  return (
    <section className="public-docs-flows" aria-labelledby="public-docs-flows-title">
      <header className="public-docs-view-heading">
        <div>
          <p className="public-docs-kicker">Action-by-action routes</p>
          <h2 id="public-docs-flows-title">Follow one protocol operation</h2>
        </div>
        <p>Each view lists only the contracts and transports involved—no overlapping architecture lines.</p>
      </header>

      <div className="public-docs-flow-tabs" role="tablist" aria-label="OpenWork function flows">
        {flows.map((flow) => (
          <button
            key={flow.id}
            type="button"
            role="tab"
            aria-selected={flow.id === activeFlow.id}
            className={flow.id === activeFlow.id ? 'is-active' : ''}
            onClick={() => setActiveFlowId(flow.id)}
          >
            {flow.label}
            {flow.badge && <span>{flow.badge}</span>}
          </button>
        ))}
      </div>

      <article className="public-docs-flow-detail">
        <header>
          <div>
            <span>Selected flow</span>
            <h3>{activeFlow.label}</h3>
          </div>
          {activeFlow.badge && <StatusBadge value={activeFlow.id === 'direct' ? 'end-to-end-tested' : 'configured'} />}
        </header>
        <p>{activeFlow.summary}</p>

        <div className="public-docs-flow-steps">
          {(activeFlow.steps || []).map((step, index) => (
            <React.Fragment key={step}>
              <div>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
              {index < activeFlow.steps.length - 1 && <ArrowRight aria-hidden="true" />}
            </React.Fragment>
          ))}
        </div>

        <div className="public-docs-flow-contracts">
          <span>Contracts touched</span>
          <div>
            {usedContracts.map((contract) => (
              <button key={contract.id} type="button" onClick={() => onSelectContract(contract)}>
                <img src={`/${CONTRACT_PRESENTATION[contract.id]?.icon || 'file-icon.svg'}`} alt="" />
                <span>
                  <strong>{CONTRACT_PRESENTATION[contract.id]?.label || contract.name}</strong>
                  <small>{contract.chainName}</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </article>

      <aside className="public-docs-flow-legend">
        <span className="is-message">LayerZero carries application messages</span>
        <span className="is-usdc">Circle CCTP carries native USDC</span>
        <span className="is-local">Same-chain calls use neither transport</span>
      </aside>
    </section>
  );
}
function StatusPanel({ registry: productionRegistry, onSelectContract }) {
  const contracts = useMemo(() => indexContracts(productionRegistry), [productionRegistry]);
  const commission = productionRegistry.liveConfiguration.commission;

  return (
    <section className="public-docs-status-view" aria-labelledby="public-docs-status-title">
      <header className="public-docs-view-heading">
        <div>
          <p className="public-docs-kicker">Evidence, not inference</p>
          <h2 id="public-docs-status-title">Live production status</h2>
        </div>
        <p>{productionRegistry.liveConfiguration.verificationScope}</p>
      </header>

      <div className="public-docs-status-summary">
        <article><strong>{productionRegistry.summary.activeContractRoles}</strong><span>active contract functions</span></article>
        <article><strong>19 / 19</strong><span>proxy slots matched</span></article>
        <article><strong>{productionRegistry.summary.explorerSourceVerifiedArtifacts}</strong><span>source verified</span></article>
        <article className="is-warning"><strong>{productionRegistry.summary.explorerSourcePendingArtifacts}</strong><span>source pending</span></article>
      </div>

      <div className="public-docs-status-grid">
        <section className="public-docs-status-section">
          <div className="public-docs-status-section__heading">
            <div><GitBranch aria-hidden="true" /><h3>Cross-chain pathways</h3></div>
            <span>{productionRegistry.pathways.length} tracked routes</span>
          </div>
          <div className="public-docs-pathways">
            {productionRegistry.pathways.map((pathway) => (
              <article key={pathway.name}>
                <div><strong>{pathway.name}</strong><StatusBadge value={pathway.status} /></div>
                <p>{pathway.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="public-docs-status-section">
          <div className="public-docs-status-section__heading">
            <div><FileCheck2 aria-hidden="true" /><h3>Configuration readbacks</h3></div>
            <span>{productionRegistry.liveConfiguration.verifiedAt}</span>
          </div>
          <div className="public-docs-config-cards">
            <article>
              <span>NOWJC fees</span>
              <strong>{commission.commissionBasisPoints} bps · {commission.minimumUsdcUnits} minimum</strong>
              <p>The live proxy values are authoritative; the source initializers are not current production behavior.</p>
              <button type="button" onClick={() => onSelectContract(contracts.nowjc)}>Open NOWJC</button>
            </article>
            <article>
              <span>LayerZero security</span>
              <strong>Four required DVNs</strong>
              <p>Active Arbitrum routes have locked libraries, executor and ULN configuration. Direct XDC/Ethereum remains disabled.</p>
              <button type="button" onClick={() => onSelectContract(contracts['native-lz-openwork-bridge'])}>Open Native bridge</button>
            </article>
            <article>
              <span>CCTP keeper incentives</span>
              <strong>3 funded reward pools</strong>
              <p>Arbitrum, Optimism and XDC caps and pool balances matched the 7 August readback. Balances remain operational state.</p>
              <button type="button" onClick={() => onSelectContract(contracts['xdc-cctp-transceiver'])}>Open XDC CCTP</button>
            </article>
          </div>
        </section>
      </div>

      <div className="public-docs-status-lower">
        <section className="public-docs-status-section">
          <div className="public-docs-status-section__heading">
            <div><ShieldCheck aria-hidden="true" /><h3>Recent proven changes</h3></div>
          </div>
          <ol className="public-docs-changes">
            {productionRegistry.recentChanges.map((change) => (
              <li key={`${change.date}-${change.title}`}>
                <time dateTime={change.date}>{change.date}</time>
                <div><strong>{change.title}</strong><p>{change.detail}</p></div>
              </li>
            ))}
          </ol>
        </section>

        <section className="public-docs-status-section public-docs-limitations">
          <div className="public-docs-status-section__heading">
            <div><ShieldCheck aria-hidden="true" /><h3>Known limitations</h3></div>
          </div>
          <ul>
            {productionRegistry.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
          </ul>
          <details>
            <summary>Legacy bridge deployments</summary>
            {productionRegistry.legacyDeployments.map((contract) => (
              <p key={`${contract.chain}-${contract.address}`}>
                <strong>{contract.chain}: {contract.name}</strong><br />
                <code>{contract.address}</code><br />{contract.status}.
              </p>
            ))}
          </details>
        </section>
      </div>
    </section>
  );
}

export default function PublicDocs() {
  const [activeView, setActiveView] = useState('network');
  const [selectedContract, setSelectedContract] = useState(null);

  const selectView = (viewId) => {
    setActiveView(viewId);
    setSelectedContract(null);
  };

  return (
    <main className="public-docs-shell" id="top">
      <header className="public-docs-header">
        <div className="public-docs-header__intro">
          <p className="public-docs-kicker">OpenWork production documentation</p>
          <h1>OpenWork mainnet contracts</h1>
          <p>A compact, audited map of 31 active contract functions—and the deployed addresses that implement them—across four production chains.</p>
        </div>

        <div className="public-docs-header__facts" aria-label="Registry summary">
          <div><strong>{registry.summary.activeNetworks}</strong><span>networks</span></div>
          <div><strong>{registry.summary.activeContractRoles}</strong><span>active contract functions</span></div>
          <div><strong>{registry.summary.activeArtifacts}</strong><span>deployed addresses</span></div>
          <div className="is-audit"><strong><ShieldCheck aria-hidden="true" /> {formatAuditDate(registry.lastAudited)}</strong><span>last audited</span></div>
        </div>

        <div className="public-docs-header__links">
          <a href={registry.canonicalSource} target="_blank" rel="noreferrer"><FileCheck2 aria-hidden="true" /> Registry <ExternalLink aria-hidden="true" /></a>
          <a href={registry.deploymentLedger} target="_blank" rel="noreferrer"><GitBranch aria-hidden="true" /> Deployment ledger <ExternalLink aria-hidden="true" /></a>
          <a href="/api/docs/contracts"><Braces aria-hidden="true" /> JSON</a>
        </div>
      </header>

      <nav className="public-docs-tabs" role="tablist" aria-label="Documentation views">
        {viewTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeView === tab.id}
              className={activeView === tab.id ? 'is-active' : ''}
              onClick={() => selectView(tab.id)}
            >
              <Icon aria-hidden="true" />
              {tab.label}
              {tab.id === 'network' && <span>31</span>}
            </button>
          );
        })}
        <span className="public-docs-tabs__note">All addresses link to the relevant explorer.</span>
      </nav>

      <section className="public-docs-workspace">
        {activeView === 'network' && (
          <section aria-labelledby="public-docs-network-title">
            <header className="public-docs-view-heading public-docs-view-heading--compact">
              <div>
                <p className="public-docs-kicker">Complete production topology</p>
                <h2 id="public-docs-network-title">The whole contract network</h2>
              </div>
              <p>Each of the 31 tiles represents one active contract function. Open one to inspect the address—or proxy and implementation—that performs it.</p>
            </header>
            <ContractNetwork
              registry={registry}
              selectedContract={selectedContract}
              onSelectContract={setSelectedContract}
            />
          </section>
        )}

        {activeView === 'flows' && <FunctionFlowsView registry={registry} onSelectContract={setSelectedContract} />}
        {activeView === 'oppy' && <OppyPanel registry={registry} />}
        {activeView === 'status' && <StatusPanel registry={registry} onSelectContract={setSelectedContract} />}
      </section>

      <footer className="public-docs-footer">
        <span>Audited production summary · Runtime and explorer verification are reported separately.</span>
        <div>
          <a href="/api/docs/skill">Agent documentation</a>
          <Link to="/docs/legacy">Legacy explorer</Link>
          <a href="#top">Back to top</a>
        </div>
      </footer>

      {selectedContract && (
        <ContractDrawer
          registry={registry}
          contract={selectedContract}
          onClose={() => setSelectedContract(null)}
          onSelect={setSelectedContract}
        />
      )}
    </main>
  );
}
