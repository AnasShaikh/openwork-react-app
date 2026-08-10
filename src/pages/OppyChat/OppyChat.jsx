import { uploadAuthHeaders } from '../../services/uploadAuth';
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowRight, Bot, BriefcaseBusiness, ChartNoAxesColumn, CircleCheck, Search, Send, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BlueButton from '../../components/BlueButton/BlueButton';
import CrossChainSyncStatus from '../../components/CrossChainSyncStatus/CrossChainSyncStatus';
import {
  postJob,
  applyToJob,
  submitWork,
  createProfile,
} from '../../services/localChainService';
import { extractChainIdFromJobId, getChainConfig, getNativeChain } from '../../config/chainConfig';
import { switchToChain } from '../../utils/switchNetwork';
import GenesisABI from '../../ABIs/genesis_ABI.json';
import {
  OPPY_JOB_GREETING,
  activeJobFromMessage,
  historyForOppy,
  loadOppyMemory,
  recordOppyTransaction,
  sanitizeOppyText,
  sanitizeActiveJob,
  saveOppyMemory,
} from '../../services/oppyMemory';
import './OppyChat.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const SUGGESTED_PROMPTS = [
  'What needs my attention?',
  'Show my OpenWork summary',
  'Platform overview',
  'Find open design jobs',
  'Post a job',
];

const SUPPORTED_CHAINS = [
  { chainId: 42161, hex: '0xa4b1', label: 'Arbitrum' },
  { chainId: 10, hex: '0xa', label: 'Optimism' },
  { chainId: 50, hex: '0x32', label: 'XDC' },
];

const SUPPORTED_CHAIN_HEX = new Set(SUPPORTED_CHAINS.map((chain) => chain.hex));

function formatToolParamValue(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None';
    return value.map((item, index) => {
      if (!item || typeof item !== 'object') return String(item);

      const label = item.title || `Milestone ${index + 1}`;
      const description = item.description || item.content;
      const amount = Number.isFinite(Number(item.amount)) ? `${Number(item.amount)} USDC` : null;
      return [label, description, amount].filter(Boolean).join(' — ');
    }).join('\n');
  }

  if (value && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, nestedValue]) => `${key}: ${String(nestedValue)}`)
      .join('\n');
  }

  return String(value ?? '');
}

function formatToolParamLabel(key) {
  const labels = {
    jobId: 'Job ID',
    jobTaker: 'Freelancer',
    applicantAddress: 'Applicant',
    applicationId: 'Application',
    proposedAmount: 'Proposed amount',
    hourlyRate: 'Hourly rate',
    workDetails: 'Work details',
    useAppMilestones: 'Use proposed milestones',
  };
  if (labels[key]) return labels[key];
  return key.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase());
}

// ── Transaction Card ─────────────────────────────────────────────
function TransactionCard({ tool, walletState, onConfirm, onCancel }) {
  const [txHash, setTxHash] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const result = await onConfirm(tool);
      if (result?.txHash) {
        setTxHash(result.txHash);
        setJobId(result.jobId || tool.params?.jobId || null);
        setStatus('submitted');
      } else if (result?.navigated) {
        setStatus('opened');
      } else {
        setStatus('failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const chainId = walletState.chainId ? parseInt(walletState.chainId, 16) : null;
  const chainConfig = chainId ? getChainConfig(chainId) : null;
  const actionLabel = tool.kind === 'navigation'
    ? 'Open'
    : (tool.kind === 'review' ? 'Review details' : 'Confirm in wallet');

  // Build explorer URL based on connected chain
  const getExplorerUrl = (hash) => {
    if (!window.ethereum) return `https://arbiscan.io/tx/${hash}`;
    const chainId = parseInt(window.ethereum.chainId, 16);
    const base = chainId === 10 ? 'https://optimistic.etherscan.io/tx/' :
                 chainId === 50 ? 'https://xdcscan.com/tx/' :
                 chainId === 8453 ? 'https://basescan.org/tx/' :
                 chainId === 1 ? 'https://etherscan.io/tx/' :
                 'https://arbiscan.io/tx/';
    return `${base}${hash}`;
  };

  return (
    <div className="tx-card">
      <div className="tx-card-action">Review action</div>
      <div className="tx-card-display">{tool.display}</div>
      <div className="tx-card-context">
        <div><span>Network</span><strong>{chainConfig?.name || 'Connect a supported wallet'}</strong></div>
      </div>
      <div className="tx-card-params">
        {Object.entries(tool.params || {}).map(([k, v]) => (
          <div className="tx-param-row" key={k}>
            <span className="tx-param-key">{formatToolParamLabel(k)}:</span>
            <span className="tx-param-value">{formatToolParamValue(v)}</span>
          </div>
        ))}
      </div>
      {tool.name === 'postJob' && (
        <p className="tx-card-note">Posting this job will not move any USDC.</p>
      )}
      {tool.kind === 'review' && (
        <p className="tx-card-note">You can check the latest job details before continuing.</p>
      )}
      {status === 'idle' ? (
        <div className="tx-card-actions">
          <BlueButton
            label={loading ? 'Opening…' : actionLabel}
            onClick={handleConfirm}
            disabled={loading}
            style={{ fontSize: '13px', height: '36px', padding: '0 16px', opacity: loading ? 0.7 : 1 }}
          />
          {!loading && <button className="tx-cancel-btn" onClick={onCancel}>Cancel</button>}
        </div>
      ) : status === 'submitted' && txHash ? (
        <>
          <div className="tx-success-msg">✓ {jobId ? `Job ${jobId} transaction submitted` : 'Transaction submitted'}</div>
          <a className="tx-hash-link" href={getExplorerUrl(txHash)} target="_blank" rel="noreferrer">
            View on Explorer: {txHash.slice(0, 18)}…
          </a>
        </>
      ) : status === 'opened' ? (
        <div className="tx-success-msg">✓ Opened the review screen</div>
      ) : (
        <div className="tx-failed-msg">The action was not completed. Review Oppy's latest message.</div>
      )}
    </div>
  );
}

// ── Tool parsing ─────────────────────────────────────────────────
function parseToolBlock(text) {
  const match = text.match(/<tool>([\s\S]*?)<\/tool>/);
  if (!match) return { tool: null, cleanText: text };
  try {
    const tool = JSON.parse(match[1].trim());
    const cleanText = text.replace(/<tool>[\s\S]*?<\/tool>/, '').trim();
    return { tool, cleanText };
  } catch {
    return { tool: null, cleanText: text };
  }
}

function metricValue(value, suffix = '') {
  if (value === null || value === undefined || value === '') return '—';
  return `${value}${suffix}`;
}

function ExplorerLink({ href, children, navigate }) {
  if (!href) return null;
  return (
    <button type="button" className="oppy-data-link" onClick={() => navigate(href)}>
      {children}<ArrowRight size={14} aria-hidden="true" />
    </button>
  );
}

function StatusBreakdown({ values = {} }) {
  const entries = Object.entries(values);
  if (!entries.length) return null;
  return (
    <div className="oppy-data-breakdown">
      {entries.map(([label, value]) => (
        <span key={label}><strong>{value}</strong> {label}</span>
      ))}
    </div>
  );
}

function JobRows({ jobs = [], navigate }) {
  if (!jobs.length) return <p className="oppy-data-empty">No matching jobs.</p>;
  return (
    <div className="oppy-data-job-list">
      {jobs.map((job) => (
        <button type="button" key={job.jobId} className="oppy-data-job" onClick={() => navigate(job.href)}>
          <span className="oppy-data-job-main">
            <strong>{job.title || `Job ${job.jobId}`}</strong>
            <small>{job.jobId} · {job.chain} · {job.status}</small>
          </span>
          <span className="oppy-data-job-side">
            <strong>{job.nominalBudget} USDC</strong>
            {job.applicationCount !== undefined && <small>{job.applicationCount} applicant{job.applicationCount === 1 ? '' : 's'}</small>}
          </span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

function WalletDashboardCard({ data, navigate }) {
  if (data.available === false) {
    return <div className="oppy-data-card oppy-data-card--error">{data.error}</div>;
  }
  const summary = data.summary || {};
  return (
    <div className="oppy-data-card">
      <div className="oppy-data-heading">
        <div className="oppy-data-icon"><BriefcaseBusiness size={18} /></div>
        <div><span>YOUR WORK</span><h3>Jobs and activity</h3></div>
        <span className="oppy-data-live"><i />Live</span>
      </div>
      <div className="oppy-data-metrics">
        <div><span>Jobs</span><strong>{summary.totalJobs ?? 0}</strong></div>
        <div><span>Needs attention</span><strong>{summary.attentionCount ?? 0}</strong></div>
        <div><span>Earned</span><strong>{metricValue(summary.earnedByWallet, ' USDC')}</strong></div>
        <div><span>Paid</span><strong>{metricValue(summary.paidByWallet, ' USDC')}</strong></div>
      </div>
      {data.profile?.available && (
        <div className="oppy-profile-strip">
          <UserRound size={18} />
          <span><strong>{data.profile.name || 'OpenWork profile'}</strong><small>{data.profile.skills?.slice(0, 4).join(' · ') || 'No skills listed'}</small></span>
          <span className="oppy-profile-rating">{data.profile.ratingAverage ?? '—'} ★ <small>{data.profile.ratingCount} ratings</small></span>
        </div>
      )}
      <StatusBreakdown values={summary.statusCounts} />
      <div className="oppy-data-section-title"><h4>To do</h4><span>{data.attention?.length || 0}</span></div>
      {data.attention?.length ? (
        <div className="oppy-attention-list">
          {data.attention.map((item) => (
            <div className={`oppy-attention-item ${item.priority === 'high' ? 'is-high' : ''}`} key={`${item.kind}-${item.jobId}`}>
              <CircleCheck size={17} />
              <span><strong>{item.label}</strong><small>{item.title} · {item.jobId} · {item.chain}</small><em>{item.detail}</em></span>
              <ExplorerLink href={item.href} navigate={navigate}>Open</ExplorerLink>
            </div>
          ))}
        </div>
      ) : <p className="oppy-data-empty">You're all caught up.</p>}
      <details className="oppy-data-details">
        <summary>Recent jobs <span>{data.jobs?.length || 0}</span></summary>
        <JobRows jobs={data.jobs} navigate={navigate} />
      </details>
    </div>
  );
}

function PlatformOverviewCard({ data, navigate }) {
  const summary = data.summary || {};
  return (
    <div className="oppy-data-card">
      <div className="oppy-data-heading">
        <div className="oppy-data-icon"><ChartNoAxesColumn size={18} /></div>
        <div><span>OPENWORK</span><h3>Platform overview</h3></div>
        <span className="oppy-data-live"><i />Live</span>
      </div>
      <div className="oppy-data-metrics">
        <div><span>Total jobs</span><strong>{summary.totalJobs ?? 0}</strong></div>
        <div><span>Applications</span><strong>{summary.totalApplications ?? 0}</strong></div>
        <div><span>Total job value</span><strong>{metricValue(summary.nominalBudget, ' USDC')}</strong></div>
        <div><span>Paid</span><strong>{metricValue(summary.totalPaid, ' USDC')}</strong></div>
      </div>
      <StatusBreakdown values={summary.statusCounts} />
      <StatusBreakdown values={summary.chainCounts} />
      {!!data.topSkills?.length && (
        <div className="oppy-skill-cloud">
          {data.topSkills.map((item) => <span key={item.skill}>{item.skill}<strong>{item.count}</strong></span>)}
        </div>
      )}
      <div className="oppy-data-section-title"><h4>Recent jobs</h4><span>Newest first</span></div>
      <JobRows jobs={data.recentJobs} navigate={navigate} />
    </div>
  );
}

function SearchResultsCard({ data, navigate }) {
  return (
    <div className="oppy-data-card">
      <div className="oppy-data-heading">
        <div className="oppy-data-icon"><Search size={18} /></div>
        <div><span>JOB SEARCH</span><h3>{data.resultCount} result{data.resultCount === 1 ? '' : 's'} for “{data.query}”</h3></div>
      </div>
      <JobRows jobs={data.results} navigate={navigate} />
    </div>
  );
}

function JobDeepDiveCard({ data, navigate }) {
  if (data.available === false) return <div className="oppy-data-card oppy-data-card--error">{data.error}</div>;
  const job = data.job || {};
  return (
    <div className="oppy-data-card oppy-data-card--deep">
      <div className="oppy-data-heading">
        <div className="oppy-data-icon"><BriefcaseBusiness size={18} /></div>
        <div><span>JOB {job.jobId}</span><h3>{job.title || `Job ${job.jobId}`}</h3><p>{job.chain} · {job.status}{job.viewerRole ? ` · You are the ${job.viewerRole}` : ''}</p></div>
        <ExplorerLink href={job.href} navigate={navigate}>Job page</ExplorerLink>
      </div>
      {job.description && <p className="oppy-job-description">{job.description}</p>}
      <div className="oppy-data-metrics">
        <div><span>Budget</span><strong>{job.nominalBudget} USDC</strong></div>
        <div><span>Paid</span><strong>{job.totalPaid} USDC</strong></div>
        <div><span>Applications</span><strong>{job.applicationCount}</strong></div>
        <div><span>Submissions</span><strong>{job.submissionCount}</strong></div>
      </div>
      {!!job.skills?.length && <div className="oppy-skill-cloud">{job.skills.map(skill => <span key={skill}>{skill}</span>)}</div>}
      {data.nextAction && (
        <div className="oppy-next-action">
          <span><strong>{data.nextAction.label}</strong><small>{data.nextAction.detail}</small></span>
          <ExplorerLink href={data.nextAction.href} navigate={navigate}>Review</ExplorerLink>
        </div>
      )}
      <div className="oppy-data-section-title"><h4>Milestones</h4><span>{data.milestones?.length || 0}</span></div>
      <div className="oppy-milestones">
        {data.milestones?.map((milestone) => (
          <div className={`oppy-milestone is-${milestone.state}`} key={milestone.number}>
            <i>{milestone.number}</i><span><strong>{milestone.title}</strong><small>{milestone.description || milestone.state}</small></span><em>{milestone.amount} USDC</em>
          </div>
        ))}
      </div>
      {!!data.applications?.length && (
        <details className="oppy-data-details">
          <summary>Applications <span>{data.applications.length}</span></summary>
          <div className="oppy-applications">
            {data.applications.map((application) => (
              <div className={`oppy-application ${application.selected ? 'is-selected' : ''}`} key={application.id}>
                <span><strong>{application.profile?.name || `${application.applicant.slice(0, 8)}…${application.applicant.slice(-4)}`}</strong><small>Application #{application.id}{application.selected ? ' · Selected' : ''}</small></span>
                <span>{application.profile?.ratingAverage ?? '—'} ★<small>{application.profile?.portfolioCount ?? 0} portfolio items</small></span>
                {application.profile?.href && <ExplorerLink href={application.profile.href} navigate={navigate}>Profile</ExplorerLink>}
              </div>
            ))}
          </div>
        </details>
      )}
      {!!data.submissions?.length && (
        <details className="oppy-data-details">
          <summary>Work submissions <span>{data.submissions.length}</span></summary>
          <div className="oppy-submissions">
            {data.submissions.map((submission) => <p key={submission.hash}><strong>Submission {submission.number}</strong>{submission.description || 'Submission details added.'}</p>)}
          </div>
        </details>
      )}
    </div>
  );
}

function ExplorerCard({ data, navigate }) {
  if (!data) return null;
  if (data.type === 'wallet-dashboard') return <WalletDashboardCard data={data} navigate={navigate} />;
  if (data.type === 'platform-overview') return <PlatformOverviewCard data={data} navigate={navigate} />;
  if (data.type === 'job-search') return <SearchResultsCard data={data} navigate={navigate} />;
  if (data.type === 'job-deep-dive') return <JobDeepDiveCard data={data} navigate={navigate} />;
  return null;
}

// ── Wallet status bar ────────────────────────────────────────────
function WalletBar({ walletState, onConnect, onSwitchChain }) {
  const barStyle = {
    borderTop: '1px solid #f0f0f0',
    padding: '8px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };
  const pillBase = {
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '12px',
    fontWeight: 600,
    border: 'none',
    cursor: 'default',
  };
  const greenPill = { ...pillBase, background: '#e8f5e9', color: '#2e7d32' };
  const amberPill = { ...pillBase, background: '#fff8e1', color: '#f57f17' };
  const orangePill = { ...pillBase, background: '#fff3e0', color: '#e65100' };
  const blueBtn = { ...pillBase, background: '#0047FF', color: 'white', cursor: 'pointer' };

  if (!walletState.installed) {
    return (
      <div className="wallet-status-bar" style={barStyle}>
        <span style={amberPill}>⚠ MetaMask not installed</span>
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noreferrer"
          style={{ ...blueBtn, textDecoration: 'none', display: 'inline-block' }}
        >
          Install MetaMask
        </a>
      </div>
    );
  }
  if (!walletState.connected) {
    return (
      <div className="wallet-status-bar" style={barStyle}>
        <button style={blueBtn} onClick={onConnect}>Connect Wallet</button>
      </div>
    );
  }
  if (!walletState.isCorrectChain) {
    return (
      <div className="wallet-status-bar wallet-status-bar--wrap" style={barStyle}>
        <span style={orangePill}>Wrong network</span>
        {SUPPORTED_CHAINS.map((chain) => (
          <button key={chain.chainId} style={blueBtn} onClick={() => onSwitchChain(chain.chainId)}>
            {chain.label}
          </button>
        ))}
      </div>
    );
  }
  const short = walletState.address
    ? `${walletState.address.slice(0, 6)}…${walletState.address.slice(-4)}`
    : '';
  return (
    <div className="wallet-status-bar" style={barStyle}>
      <span style={greenPill}>● Connected</span>
      <span style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>{short}</span>
      <span style={{ fontSize: '12px', color: '#555' }}>
        {getChainConfig(parseInt(walletState.chainId, 16))?.name}
      </span>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
const OppyChat = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [walletState, setWalletState] = useState({
    installed: false,
    connected: false,
    address: null,
    chainId: null,
    isCorrectChain: false,
  });
  const [chat, setChat] = useState([OPPY_JOB_GREETING]);
  const [activeJob, setActiveJob] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hydratedMemoryScopeRef = useRef(null);
  const skipMemoryPersistRef = useRef(false);

  const memoryScope = walletState.address?.toLowerCase() || 'anonymous';

  useEffect(() => {
    if (hydratedMemoryScopeRef.current === memoryScope) return;
    const memory = loadOppyMemory(memoryScope, [OPPY_JOB_GREETING]);
    skipMemoryPersistRef.current = true;
    hydratedMemoryScopeRef.current = memoryScope;
    setChat(memory.messages);
    setActiveJob(memory.activeJob);
    setRecentTransactions(memory.recentTransactions);
    setShowSuggestions(memory.messages.length <= 1);
  }, [memoryScope]);

  useEffect(() => {
    if (hydratedMemoryScopeRef.current !== memoryScope) return;
    if (skipMemoryPersistRef.current) {
      skipMemoryPersistRef.current = false;
      return;
    }
    saveOppyMemory(memoryScope, {
      messages: chat,
      activeJob,
      recentTransactions,
    });
  }, [memoryScope, chat, activeJob, recentTransactions]);

  useEffect(() => {
    const messagesArea = messagesEndRef.current?.parentElement;
    if (messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight;
  }, [chat]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  // Wallet detection
  async function detectWallet() {
    if (!window.ethereum) {
      setWalletState({ installed: false, connected: false, address: null, chainId: null, isCorrectChain: false });
      return;
    }
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    const normalizedChainId = chainId.toLowerCase();
    setWalletState({
      installed: true,
      connected: accounts.length > 0,
      address: accounts[0] || null,
      chainId: normalizedChainId,
      isCorrectChain: SUPPORTED_CHAIN_HEX.has(normalizedChainId),
    });
  }

  useEffect(() => {
    // MetaMask mobile injects window.ethereum slightly after page load
    // Try immediately, then retry after 500ms and 1500ms if not found
    detectWallet();
    const t1 = setTimeout(detectWallet, 500);
    const t2 = setTimeout(detectWallet, 1500);

    // Also listen for MetaMask's explicit init event
    const onInit = () => detectWallet();
    window.addEventListener('ethereum#initialized', onInit, { once: true });

    const wireEvents = () => {
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', detectWallet);
        window.ethereum.on('chainChanged', detectWallet);
      }
    };
    wireEvents();
    // Re-wire after retries in case ethereum appeared late
    const t3 = setTimeout(wireEvents, 1500);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      window.removeEventListener('ethereum#initialized', onInit);
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', detectWallet);
        window.ethereum.removeListener('chainChanged', detectWallet);
      }
    };
  }, []);

  const sendMessage = async (userMsg) => {
    if (!userMsg.trim() || loading) return;

    setShowSuggestions(false);
    const history = historyForOppy(chat);
    const messageActiveJob = activeJobFromMessage(userMsg, activeJob);
    if (messageActiveJob?.jobId !== activeJob?.jobId) setActiveJob(messageActiveJob);
    setChat(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    setChat(prev => [...prev, { role: 'bot', text: '', isThinking: true }]);

    try {
      const walletChainId = walletState.chainId ? parseInt(walletState.chainId, 16) : null;

      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          mode: 'transactions',
          history,
          wallet: {
            connected: walletState.connected,
            address: walletState.address,
            chainId: walletChainId,
          },
          memory: {
            activeJob: messageActiveJob,
            recentTransactions,
          },
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();

      if (data.success) {
        const legacy = parseToolBlock(data.response);
        const proposedTool = data.tool || legacy.tool;
        const cleanText = data.tool ? data.response : legacy.cleanText;
        const contextualJob = sanitizeActiveJob(
          proposedTool?.params?.jobId
            ? { jobId: proposedTool.params.jobId }
            : data.context?.activeJob,
        );
        if (contextualJob) setActiveJob(contextualJob);
        setChat(prev => {
          const withoutThinking = prev.filter(m => !m.isThinking);
          const msgs = [...withoutThinking, { role: 'bot', text: cleanText }];
          if (data.explorer) msgs.push({ role: 'bot', isDataCard: true, data: data.explorer });
          if (proposedTool) msgs.push({ role: 'bot', isTxCard: true, tool: proposedTool });
          return msgs;
        });
      } else {
        throw new Error(data.error || 'Chat API failed');
      }
    } catch (err) {
      console.error('Chat error:', err);
      setChat(prev => {
        const withoutThinking = prev.filter(m => !m.isThinking);
        return [...withoutThinking, { role: 'bot', text: "Sorry, I couldn't reach the server. Please try again." }];
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
    setInput('');
  };

  const handleSuggestion = (prompt) => {
    sendMessage(prompt);
  };

  // ── Chat helper ──────────────────────────────────────────────
  function addBotMessage(text, replaceLast = false) {
    setChat(prev => {
      if (replaceLast && prev.length > 0 && prev[prev.length - 1].role === 'bot') {
        return [...prev.slice(0, -1), { role: 'bot', text }];
      }
      return [...prev, { role: 'bot', text }];
    });
  }

  // ── Transaction handler ──────────────────────────────────────
  const handleTransaction = async (tool) => {
    console.log('[OppyChat] Transaction requested:', tool);

    try {
      if (tool.name === 'browseJobs') {
        navigate('/browse-jobs');
        return { navigated: true };
      }
      if (tool.name === 'openJob') {
        navigate(`/job-details/${encodeURIComponent(tool.params.jobId)}`);
        return { navigated: true };
      }
      if (tool.name === 'viewApplications') {
        navigate(`/view-job-applications/${encodeURIComponent(tool.params.jobId)}`);
        return { navigated: true };
      }

      if (!window.ethereum) {
        addBotMessage('Please install MetaMask to use wallet-backed job actions.');
        return { error: 'Wallet unavailable' };
      }

      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const chainHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainIdDecimal = parseInt(chainHex, 16);
      const userAddress = accounts[0];

      if (!userAddress) {
        addBotMessage('Please connect your wallet first.');
        return { error: 'Wallet not connected' };
      }

      if (tool.name === 'openMyJobs') {
        navigate(`/profile/${userAddress}/jobs`);
        return { navigated: true };
      }

      const reviewOnPostingChain = async (path) => {
        const postingChainId = extractChainIdFromJobId(tool.params.jobId);
        if (postingChainId && postingChainId !== chainIdDecimal) {
          const postingChain = getChainConfig(postingChainId);
          addBotMessage(`Switching to ${postingChain?.name || `chain ${postingChainId}`} to continue…`);
          await switchToChain(postingChainId);
          await detectWallet();
        }
        navigate(path);
        return { navigated: true };
      };

      if (tool.name === 'releasePayment') {
        return reviewOnPostingChain(`/release-payment/${encodeURIComponent(tool.params.jobId)}`);
      }
      if (tool.name === 'raiseDispute') {
        return reviewOnPostingChain(`/raise-dispute/${encodeURIComponent(tool.params.jobId)}`);
      }
      if (tool.name === 'startDirectContract') {
        const dcParams = new URLSearchParams({
          title: tool.params.title || '',
          description: tool.params.description || '',
          budget: String(tool.params.budget || ''),
          taker: tool.params.jobTaker || '',
        });
        navigate(`/direct-contract?${dcParams.toString()}`);
        return { navigated: true };
      }

      const onStatus = (msg) => addBotMessage(msg, true);

      const explorerBase =
        chainIdDecimal === 42161 ? 'https://arbiscan.io/tx/' :
        chainIdDecimal === 10    ? 'https://optimistic.etherscan.io/tx/' :
        chainIdDecimal === 50    ? 'https://xdcscan.com/tx/' :
        chainIdDecimal === 8453  ? 'https://basescan.org/tx/' :
                                   'https://etherscan.io/tx/';

      // ── Helper: IPFS upload ────────────────────────────────
      const uploadToIPFS = async (data) => {
        const res = await fetch(`${BACKEND_URL}/api/ipfs/upload-json`, {
          method: 'POST',
          headers: {
            ...(await uploadAuthHeaders()), 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(json?.error || `IPFS upload failed (HTTP ${res.status})`);
        }
        const hash = json?.hash || json?.IpfsHash;
        if (!hash) throw new Error('IPFS upload response did not contain a content hash');
        return hash;
      };

      let result;

      switch (tool.name) {
        case 'postJob': {
          addBotMessage('Preparing your job…');
          const budget = Number(tool.params.budget) || 0;
          const milestones = (tool.params.milestones || [{ description: tool.params.description, amount: budget }])
            .map((milestone, index) => ({
              title: milestone.title || `Milestone ${index + 1}`,
              content: milestone.content || milestone.description,
              description: milestone.description,
              amount: Number(milestone.amount),
            }));

          // Upload each milestone description to IPFS
          const milestoneHashes = await Promise.all(milestones.map((milestone) => uploadToIPFS(milestone)));
          const milestoneAmounts = milestones.map((milestone) => Math.floor(milestone.amount * 1000000));
          const jobDetailHash = await uploadToIPFS({
            title: tool.params.title,
            description: tool.params.description,
            skills: tool.params.skills || [],
            milestoneType: milestones.length === 1 ? 'Single Milestone' : 'Multiple Milestones',
            milestones,
            milestoneHashes,
            attachments: [],
            totalCompensation: milestoneAmounts.reduce((sum, amount) => sum + amount, 0) / 1000000,
            jobGiver: userAddress,
            timestamp: new Date().toISOString(),
          });

          result = await postJob(chainIdDecimal, userAddress, {
            jobDetailHash,
            descriptions: milestoneHashes,
            amounts: milestoneAmounts,
          }, onStatus);
          break;
        }

        case 'applyToJob': {
          // Determine amounts: use the explicit proposal, or the canonical job milestones.
          // Never invent a payment amount if the read fails.
          let applyAmounts;
          if (tool.params.proposedAmount && Number(tool.params.proposedAmount) > 0) {
            applyAmounts = [Math.round(Number(tool.params.proposedAmount) * 1e6)];
          } else {
            try {
              addBotMessage('Fetching job milestone amounts from contract…', true);
              const nativeChain = getNativeChain();
              const arbRpc = nativeChain?.rpcUrl || 'https://arb1.arbitrum.io/rpc';
              const genesisAddress = nativeChain?.contracts?.genesis;
              if (!genesisAddress) throw new Error('No genesis address');
              const Web3 = (await import('web3')).default;
              const arbWeb3 = new Web3(arbRpc);
              const genesisContract = new arbWeb3.eth.Contract(GenesisABI, genesisAddress);
              const jobData = await genesisContract.methods.getJob(tool.params.jobId).call();
              const milestones = jobData?.milestonePayments || jobData[6] || [];
              if (!milestones.length) throw new Error('The job has no canonical milestone amounts');
              applyAmounts = milestones.map((milestone) => Number(milestone.amount || milestone[1] || 0));
              if (applyAmounts.some((amount) => !Number.isFinite(amount) || amount <= 0)) {
                throw new Error('The job contains an invalid canonical milestone amount');
              }
            } catch (e) {
              console.warn('[applyToJob] Could not fetch job milestones:', e.message);
              throw new Error(`Could not load the job's milestone amounts: ${e.message}`);
            }
          }

          addBotMessage('Preparing your application…', true);
          const proposedMilestones = applyAmounts.map((amount, index) => ({
            title: `Milestone ${index + 1}`,
            content: tool.params.proposal,
            description: tool.params.proposal,
            amount: amount / 1000000,
          }));
          const milestoneHashes = await Promise.all(proposedMilestones.map((milestone) => uploadToIPFS(milestone)));
          const chainConfig = getChainConfig(chainIdDecimal);
          const applicationHash = await uploadToIPFS({
            description: tool.params.proposal,
            applicant: userAddress,
            jobId: tool.params.jobId,
            milestones: proposedMilestones,
            attachments: [],
            preferredChain: chainConfig?.name,
            appliedFromChain: chainConfig?.name,
            appliedFromChainId: chainIdDecimal,
            timestamp: new Date().toISOString(),
          });

          result = await applyToJob(chainIdDecimal, userAddress, {
            jobId: tool.params.jobId,
            applicationHash,
            descriptions: milestoneHashes,
            amounts: applyAmounts,
            preferredChainDomain: chainConfig?.cctpDomain,
          }, onStatus);
          break;
        }

        case 'startJob': {
          // Determine applicationId: use provided value, or look up from Genesis contract
          let resolvedApplicationId = tool.params.applicationId;
          const applicantAddress = tool.params.applicantAddress || tool.params.applicant;

          if (!resolvedApplicationId && applicantAddress) {
            try {
              addBotMessage(`Looking up application ID for ${applicantAddress.slice(0, 8)}… on Arbitrum…`);
              const nativeChain = getNativeChain();
              const arbRpc = nativeChain?.rpcUrl || 'https://arb1.arbitrum.io/rpc';
              const genesisAddress = nativeChain?.contracts?.genesis;
              if (!genesisAddress) throw new Error('No genesis address');
              const Web3 = (await import('web3')).default;
              const arbWeb3 = new Web3(arbRpc);
              const genesisContract = new arbWeb3.eth.Contract(GenesisABI, genesisAddress);
              const appCount = Number(await genesisContract.methods.getJobApplicationCount(tool.params.jobId).call());
              // Genesis application IDs are 1-indexed.
              for (let i = 1; i <= appCount; i++) {
                const app = await genesisContract.methods.getJobApplication(tool.params.jobId, i).call();
                const appApplicant = app?.applicant || app[2];
                if (appApplicant && appApplicant.toLowerCase() === applicantAddress.toLowerCase()) {
                  resolvedApplicationId = Number(app?.id ?? app[0] ?? i);
                  break;
                }
              }
              if (resolvedApplicationId === undefined || resolvedApplicationId === null) {
                throw new Error(`No application found for ${applicantAddress} on job ${tool.params.jobId}`);
              }
              addBotMessage('Opening the hiring review…', true);
            } catch (e) {
              addBotMessage(`Could not auto-lookup application ID: ${e.message}`);
              return { error: e.message };
            }
          }

          if (resolvedApplicationId === undefined || resolvedApplicationId === null) {
            addBotMessage('Please provide the applicant\'s wallet address so I can look up their application.');
            return { error: 'Application not found' };
          }

          const postingChainId = extractChainIdFromJobId(tool.params.jobId);
          if (postingChainId && postingChainId !== chainIdDecimal) {
            await switchToChain(postingChainId);
            await detectWallet();
          }
          const startParams = new URLSearchParams({
            jobId: tool.params.jobId,
            applicationId: String(resolvedApplicationId),
            useAppMilestones: String(tool.params.useAppMilestones === true),
          });
          navigate(`/view-received-application?${startParams.toString()}`);
          return { navigated: true };
        }

        case 'submitWork': {
          addBotMessage('Preparing your work submission…');
          const submissionHash = await uploadToIPFS({ workDetails: tool.params.workDetails, jobId: tool.params.jobId });
          result = await submitWork(chainIdDecimal, userAddress, {
            jobId: tool.params.jobId,
            submissionHash,
          }, onStatus);
          break;
        }

        case 'createProfile': {
          addBotMessage('Preparing your profile…');
          const ipfsHash = await uploadToIPFS({
            name: tool.params.name,
            skills: tool.params.skills,
            hourlyRate: tool.params.hourlyRate,
            walletAddress: userAddress,
          });
          result = await createProfile(chainIdDecimal, userAddress, {
            ipfsHash,
          }, onStatus);
          break;
        }

        default:
          addBotMessage(`Unknown transaction type: ${tool.name}`);
          return { error: 'Unknown action' };
      }

      if (!result?.transactionHash) throw new Error('The wallet action did not return a transaction hash');
      const confirmedJobId = result.jobId || tool.params?.jobId || null;
      if (confirmedJobId) {
        const nextActiveJob = sanitizeActiveJob({
          jobId: confirmedJobId,
          title: tool.name === 'postJob' ? tool.params.title : activeJob?.title,
          sourceChainId: chainIdDecimal,
          sourceChainName: getChainConfig(chainIdDecimal)?.name,
          sourceTxHash: result.transactionHash,
          sourceReceiptConfirmed: true,
        });
        setActiveJob(nextActiveJob);
        setRecentTransactions((current) => recordOppyTransaction(current, {
          action: tool.name,
          jobId: confirmedJobId,
          txHash: result.transactionHash,
          chainId: chainIdDecimal,
          confirmed: true,
        }));
      }
      const jobCopy = confirmedJobId ? ` for job **${confirmedJobId}**` : '';
      const deliveryCopy = result.canonicalDeliveryPending
        ? '\n\nYour job is syncing across networks. The status below will update automatically.'
        : '';
      addBotMessage(`✅ Transaction confirmed${jobCopy}!\n\n[View on explorer](${explorerBase}${result.transactionHash})${deliveryCopy}`);
      return { txHash: result.transactionHash, jobId: confirmedJobId };

    } catch (error) {
      const msg = error.message || 'Transaction failed';
      if (msg.includes('user rejected') || msg.includes('4001')) {
        addBotMessage("Transaction cancelled. Let me know when you're ready to try again.");
      } else if (msg.includes('insufficient funds')) {
        const nativeSymbol = getChainConfig(parseInt(walletState.chainId || '0x0', 16))?.nativeCurrency?.symbol || 'native currency';
        addBotMessage(`You don't have enough ${nativeSymbol} for gas fees on the connected chain.`);
      } else {
        addBotMessage(`Transaction failed: ${msg}`);
      }
      return { error: msg };
    }
  };

  const handleConnectWallet = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      detectWallet();
    } catch (err) {
      console.error('[OppyChat] Connect wallet error:', err);
    }
  };

  const handleSwitchChain = async (targetChainId = 42161) => {
    try {
      await switchToChain(targetChainId);
      await detectWallet();
    } catch (switchError) {
      console.error('[OppyChat] Switch chain error:', switchError);
    }
  };

  const handleCancelTx = (idx) => {
    setChat(prev => prev.filter((_, i) => i !== idx));
  };

  // Inline styles guarantee mobile layout wins regardless of CSS import order
  const mob = typeof window !== 'undefined' && window.innerWidth <= 768;

  const mobPage   = mob ? { position:'fixed', top:0, left:0, right:0, bottom:0, display:'flex', flexDirection:'column', background:'#fff', zIndex:20000, overflow:'hidden', width:'100vw', maxWidth:'100vw', padding:0 } : {};
  const mobBody   = mob ? { padding:0, flex:1, display:'flex', flexDirection:'column', overflow:'hidden', width:'100vw', maxWidth:'100vw', alignItems:'stretch' } : {};
  const mobVjc    = mob ? { position:'relative', top:0, maxWidth:'100vw', minWidth:0, margin:0, flex:1, display:'flex', flexDirection:'column', overflow:'hidden', width:'100vw', boxSizing:'border-box' } : {};
  const mobTitle  = mob ? { borderRadius:0, borderLeft:'none', borderRight:'none', borderTop:'none', height:64, minHeight:64, flexShrink:0, padding:'0 62px', width:'100%', boxSizing:'border-box' } : {};
  const mobCard   = mob ? { flex:1, display:'flex', flexDirection:'column', borderRadius:0, border:'none', overflow:'hidden', minHeight:0, minWidth:0, width:'100%', boxSizing:'border-box' } : {};
  const mobMsgs   = mob ? { flex:'1 1 0%', minHeight:0, minWidth:0, maxHeight:'none', padding:'14px 14px 8px 14px', overflowY:'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch', width:'100%', boxSizing:'border-box' } : {};
  const mobInput  = mob ? { padding:'10px 12px 16px 12px', flexShrink:0, background:'#fff', display:'flex', alignItems:'center', gap:10, boxSizing:'border-box', width:'100%', maxWidth:'100vw', borderTop:'1.5px solid #f0f0f0' } : {};
  const mobField  = mob ? { fontSize:16, padding:'12px 13px', flex:'1 1 0%', minWidth:0, boxSizing:'border-box' } : {};
  const mobBtn    = mob ? { width:46, minWidth:46, height:46, flexShrink:0 } : {};
  const mobSugg   = mob ? { padding:'8px 14px', flexWrap:'nowrap', overflowX:'auto', WebkitOverflowScrolling:'touch', flexShrink:0 } : {};

  return (
    <div className="oppy-chat-page" style={mobPage}>
    <div className="body-container" style={mobBody}>
      <div className="view-jobs-container" style={mobVjc}>

        {/* Title section */}
        <div className="title-section" style={mobTitle}>
          <button
            type="button"
            className="backButtonV"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            <img className="backIconV" src="/back.svg" alt="Back" />
          </button>
          <div className="oppy-chat-header">
            <div className="oppy-chat-icon">
              <Bot size={18} color="#fff" />
            </div>
            <div className="oppy-chat-header-text">
              <span className="oppy-chat-title">Agent Oppy</span>
              <span className="oppy-chat-subtitle">Your OpenWork assistant</span>
            </div>
          </div>
        </div>

        {/* Chat card */}
        <div className="table-section" style={mobCard}>

          {/* Messages */}
          <div className="chat-messages-area" style={mobMsgs}>
            {chat.map((msg, idx) => {
              if (msg.isDataCard) {
                return (
                  <div className="chat-msg-row bot chat-msg-row--data" key={idx}>
                    <ExplorerCard data={msg.data} navigate={navigate} />
                  </div>
                );
              }
              if (msg.isTxCard) {
                return (
                  <div className="chat-msg-row bot" key={idx}>
                    <TransactionCard
                      tool={msg.tool}
                      walletState={walletState}
                      onConfirm={handleTransaction}
                      onCancel={() => handleCancelTx(idx)}
                    />
                  </div>
                );
              }
              if (msg.isThinking) {
                return (
                  <div className="chat-msg-row bot" key={idx}>
                    <div className="chat-bubble bot">
                      <div className="thinking-dots">
                        <span /><span /><span />
                      </div>
                    </div>
                  </div>
                );
              }
              return (
                <div className={`chat-msg-row ${msg.role === 'user' ? 'user' : 'bot'}`} key={idx}>
                  <div className={`chat-bubble ${msg.role === 'user' ? 'user' : 'bot'}`}>
                    {msg.role === 'bot' ? (
                      <ReactMarkdown>{sanitizeOppyText(msg.text)}</ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              );
            })}
            <CrossChainSyncStatus activeJob={activeJob} />
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts */}
          {showSuggestions && (
            <div className="chat-suggestions" style={mobSugg}>
              {SUGGESTED_PROMPTS.map(p => (
                <button
                  key={p}
                  className="chat-suggestion-chip"
                  onClick={() => handleSuggestion(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Wallet status bar */}
          <WalletBar
            walletState={walletState}
            onConnect={handleConnectWallet}
            onSwitchChain={handleSwitchChain}
          />

          {/* Input bar */}
          <form className="chat-input-bar" onSubmit={handleSubmit} style={mobInput}>
            <input
              ref={inputRef}
              className="chat-input"
              type="text"
              placeholder="Ask Oppy or describe what you want to do…"
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              style={mobField}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={loading || !input.trim()}
              aria-label="Send"
              style={mobBtn}
            >
              <Send size={16} />
            </button>
          </form>

        </div>
      </div>
    </div>
    </div>
  );
};

export default OppyChat;
