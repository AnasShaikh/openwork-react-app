import { uploadAuthHeaders } from '../../services/uploadAuth';
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ArrowRight, ArrowUp, Bot, BriefcaseBusiness, ChartNoAxesColumn, CircleAlert, CircleCheck, Mic, RefreshCw, Search, Square, UserRound, WalletCards } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BlueButton from '../../components/BlueButton/BlueButton';
import CrossChainSyncStatus from '../../components/CrossChainSyncStatus/CrossChainSyncStatus';
import {
  postJob,
  applyToJob,
  startDirectContract,
  startJob,
  submitWork,
  releasePaymentCrossChain,
  raiseDispute,
  createProfile,
} from '../../services/localChainService';
import {
  extractChainIdFromJobId,
  getChainConfig,
  getNativeChain,
  supportsApplicantMilestones,
  usesAsyncApplicantMilestoneStart,
} from '../../config/chainConfig';
import { switchToChain } from '../../utils/switchNetwork';
import GenesisABI from '../../ABIs/genesis_ABI.json';
import {
  ensureUsdcFunding,
  explorerUrl,
  fetchOppyExplorer,
  loadActiveOracles,
  resolveReleaseTarget,
  resolveSelectedApplication,
  toUsdcBaseUnits,
} from '../../services/oppyActionService';
import {
  OPPY_JOB_GREETING,
  activeJobFromMessage,
  historyForOppy,
  loadOppyMemory,
  recordOppyTransaction,
  sanitizeOppyText,
  sanitizeActiveJob,
  sanitizePreparedAction,
  saveOppyMemory,
  updateOppyTransactionDelivery,
} from '../../services/oppyMemory';
import {
  assertOppyActionSemantics,
  getOppyActionSemanticConflict,
} from '../../services/oppyActionSemantics';
import {
  mergeComposerTranscript,
  startOppyTranscription,
  voiceErrorMessage,
} from '../../services/oppyTranscription';
import {
  discoverInjectedWallets,
  getInjectedWallets,
  getPreferredInjectedWallet,
  rememberInjectedWallet,
  subscribeInjectedWallets,
  walletRpcErrorMessage,
} from '../../services/injectedWalletProviders';
import {
  createTransactionDiagnostic,
  diagnosticTechnicalRows,
  inspectTransactionDiagnostic,
  updateTransactionDiagnostic,
} from '../../services/transactionDiagnostics';
import './OppyChat.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

async function requestStartJobRelay({ jobId, txHash, asyncApplicantMilestones = false }) {
  const response = await fetch(`${BACKEND_URL}/api/start-job`, {
    method: 'POST',
    headers: { ...(await uploadAuthHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, txHash, asyncApplicantMilestones }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error || `USDC delivery could not be started (HTTP ${response.status})`);
  }
  return payload;
}

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

function usdcDecimalToBaseUnits(value) {
  const text = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,6})?$/.test(text)) return null;
  const [whole, fractional = ''] = text.split('.');
  return (BigInt(whole) * 1_000_000n + BigInt(fractional.padEnd(6, '0'))).toString();
}

// ── Transaction Card ─────────────────────────────────────────────
function TransactionCard({ tool, walletState, onConfirm, onCancel, onDiagnose, onDiagnosticChange, onTrackingChange }) {
  const [txHash, setTxHash] = useState(null);
  const [txChainId, setTxChainId] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle');
  const [progress, setProgress] = useState(null);
  const [walletWaitExtended, setWalletWaitExtended] = useState(false);
  const [diagnostic, setDiagnostic] = useState(null);
  const [diagnosticChecking, setDiagnosticChecking] = useState(false);
  const diagnosticRef = useRef(null);
  const [oracles, setOracles] = useState([]);
  const [oraclesLoading, setOraclesLoading] = useState(tool.name === 'raiseDispute');
  const [formValues, setFormValues] = useState({
    reason: tool.params?.reason || '',
    disputedAmount: tool.params?.disputedAmount || '',
    compensation: tool.params?.compensation || '',
    oracleName: tool.params?.oracleName || '',
    proposal: tool.params?.proposal || '',
    proposedAmount: tool.params?.proposedAmount || '',
    workDetails: tool.params?.workDetails || '',
  });

  useEffect(() => {
    if (tool.name !== 'raiseDispute') return undefined;
    let active = true;
    loadActiveOracles()
      .then((rows) => {
        if (!active) return;
        setOracles(rows);
        setFormValues((current) => ({
          ...current,
          oracleName: current.oracleName || rows[0]?.name || '',
        }));
      })
      .catch(() => { if (active) setOracles([]); })
      .finally(() => { if (active) setOraclesLoading(false); });
    return () => { active = false; };
  }, [tool.name]);

  const publishDiagnostic = (next) => {
    if (!next) return;
    diagnosticRef.current = next;
    setDiagnostic(next);
    const editableParams = tool.name === 'applyToJob'
      ? { proposal: formValues.proposal, proposedAmount: formValues.proposedAmount || undefined }
      : (tool.name === 'submitWork'
        ? { workDetails: formValues.workDetails }
        : (tool.name === 'raiseDispute'
          ? {
              reason: formValues.reason,
              disputedAmount: formValues.disputedAmount,
              compensation: formValues.compensation,
              oracleName: formValues.oracleName,
            }
          : {}));
    onDiagnosticChange?.(next, {
      ...tool,
      params: { ...(tool.params || {}), ...editableParams },
    });
  };

  const runDiagnosticCheck = async () => {
    const current = diagnosticRef.current;
    if (!current || diagnosticChecking) return;
    setDiagnosticChecking(true);
    try {
      const inspected = await onDiagnose(current);
      if (!inspected) return;
      publishDiagnostic(inspected);
      if (inspected.txHash) {
        setTxHash(inspected.txHash);
        setTxChainId(inspected.chainId || null);
      }
      if (inspected.status === 'confirmed') {
        setStatus('submitted');
        setLoading(false);
        setProgress({ phase: 'confirmed', message: inspected.summary });
      } else if (['dropped', 'reverted', 'cancelled'].includes(inspected.status)) {
        setStatus('failed');
        setLoading(false);
        setProgress({ phase: 'error', message: inspected.summary });
      }
    } catch (error) {
      const failedCheck = {
        ...current,
        status: 'unknown',
        safeToRetry: false,
        summary: 'Oppy could not complete the live status check.',
        nextStep: 'Wait a moment and check again before retrying.',
        error: { category: 'diagnostic', code: error?.code ?? null, message: error?.message || 'Status check failed.' },
      };
      publishDiagnostic(failedCheck);
    } finally {
      setDiagnosticChecking(false);
    }
  };

  useEffect(() => {
    if (status !== 'working' || !['wallet', 'broadcast'].includes(progress?.phase)) {
      setWalletWaitExtended(false);
      return undefined;
    }
    const delay = progress.phase === 'wallet' ? 12000 : 8000;
    const timer = setTimeout(() => {
      setWalletWaitExtended(true);
      runDiagnosticCheck();
    }, delay);
    return () => clearTimeout(timer);
    // The check reads the latest attempt through diagnosticRef; progress changes
    // deliberately restart the timer for the new approval/action phase.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, progress?.phase, progress?.message]);

  const handleConfirm = async () => {
    if (tool.name === 'applyToJob' && !formValues.proposal.trim()) {
      setStatus('failed');
      setProgress({ phase: 'error', message: 'Add a short proposal before continuing.' });
      return;
    }
    if (tool.name === 'submitWork' && !formValues.workDetails.trim()) {
      setStatus('failed');
      setProgress({ phase: 'error', message: 'Describe the completed work before continuing.' });
      return;
    }
    if (tool.name === 'raiseDispute') {
      if (!formValues.reason.trim()) {
        setStatus('failed');
        setProgress({ phase: 'error', message: 'Add a clear dispute reason before continuing.' });
        return;
      }
      if (!(Number(formValues.disputedAmount) > 0) || !(Number(formValues.compensation) > 0)) {
        setStatus('failed');
        setProgress({ phase: 'error', message: 'Disputed amount and oracle fee must both be greater than zero.' });
        return;
      }
      if (!formValues.oracleName) {
        setStatus('failed');
        setProgress({ phase: 'error', message: 'Choose an active Skill Oracle before continuing.' });
        return;
      }
    }
    const currentChainId = walletState.chainId ? parseInt(walletState.chainId, 16) : null;
    const attempt = createTransactionDiagnostic({
      action: tool.name,
      jobId: tool.params?.jobId,
      walletName: walletState.providerName,
      walletAddress: walletState.address,
      chainId: currentChainId,
      chainName: getChainConfig(currentChainId)?.name,
      attemptNumber: Number(diagnosticRef.current?.attemptNumber || 0) + 1,
    });
    publishDiagnostic(attempt);
    setLoading(true);
    setStatus('working');
    setProgress({ phase: 'preparing', message: tool.kind === 'navigation' ? 'Loading OpenWork data…' : 'Preparing action…' });
    try {
      const result = await onConfirm(tool, formValues, (update) => {
        const normalized = typeof update === 'string' ? { phase: 'preparing', message: update } : update;
        setStatus('working');
        setProgress(normalized);
        if (normalized?.txHash && normalized.step !== 'approval') {
          setTxHash(normalized.txHash);
          setTxChainId(currentChainId);
        }
        publishDiagnostic(updateTransactionDiagnostic(diagnosticRef.current, normalized));
      });
      if (result?.txHash) {
        setTxHash(result.txHash);
        setTxChainId(result.chainId || null);
        setJobId(result.jobId || tool.params?.jobId || null);
        setTracking(result.tracking || null);
        setStatus('submitted');
        setProgress({ phase: 'confirmed', message: result.message || 'Transaction confirmed.' });
        publishDiagnostic(updateTransactionDiagnostic(diagnosticRef.current, {
          phase: 'confirmed',
          step: 'action',
          txHash: result.txHash,
          message: result.message || 'Transaction confirmed.',
        }));
      } else if (result?.openedInline) {
        setStatus('opened');
        setProgress({ phase: 'confirmed', message: 'Loaded below without leaving this chat.' });
      } else {
        setProgress({ phase: 'error', message: result?.error || 'The action was not completed.' });
        setStatus('failed');
        publishDiagnostic(updateTransactionDiagnostic(diagnosticRef.current, {
          phase: 'error',
          error: result?.diagnosticError || new Error(result?.error || 'The action was not completed.'),
          message: result?.error || 'The action was not completed.',
          outcome: result?.outcome,
          safeToRetry: result?.safeToRetry,
          summary: result?.summary,
          nextStep: result?.nextStep,
          category: result?.category,
        }));
      }
    } catch (error) {
      setProgress({ phase: 'error', message: error?.message || 'The action was not completed.' });
      setStatus('failed');
      publishDiagnostic(updateTransactionDiagnostic(diagnosticRef.current, { phase: 'error', error }));
    } finally {
      setLoading(false);
    }
  };

  const chainId = walletState.chainId ? parseInt(walletState.chainId, 16) : null;
  const chainConfig = chainId ? getChainConfig(chainId) : null;
  const actionLabel = tool.kind === 'navigation'
    ? 'Show in chat'
    : (walletState.connected ? 'Continue in wallet' : 'Connect and continue');
  const technicalRows = diagnosticTechnicalRows(diagnostic);
  const retryAllowed = !diagnostic || diagnostic.safeToRetry === true;

  const updateField = (field) => (event) => {
    setFormValues((current) => ({ ...current, [field]: event.target.value }));
    if (status === 'failed') {
      setStatus('idle');
      setProgress(null);
    }
  };

  return (
    <div className="tx-card">
      <div className="tx-card-action">Review action</div>
      <div className="tx-card-display">{tool.display}</div>
      <div className="tx-card-context">
        <div><span>Network</span><strong>{chainConfig?.name || 'Connect a supported wallet'}</strong></div>
        {tool.kind !== 'navigation' && walletState.providerName && (
          <div><span>Wallet</span><strong>{walletState.providerName}</strong></div>
        )}
      </div>
      <div className="tx-card-params">
        {Object.entries(tool.params || {}).filter(([k, v]) => v !== '' && !(
          tool.name === 'raiseDispute' && ['reason', 'disputedAmount', 'compensation', 'oracleName'].includes(k)
        )).map(([k, v]) => (
          <div className="tx-param-row" key={k}>
            <span className="tx-param-key">{formatToolParamLabel(k)}:</span>
            <span className="tx-param-value">{formatToolParamValue(v)}</span>
          </div>
        ))}
      </div>
      {tool.name === 'postJob' && (
        <p className="tx-card-note">Posting this job will not move any USDC.</p>
      )}
      {tool.name === 'applyToJob' && (
        <div className="tx-card-form">
          <label>
            <span>Proposal</span>
            <textarea value={formValues.proposal} onChange={updateField('proposal')} rows={3} placeholder="What makes you a good fit?" />
          </label>
          <label>
            <span>Proposed total (USDC, optional)</span>
            <input inputMode="decimal" value={formValues.proposedAmount} onChange={updateField('proposedAmount')} placeholder="Use the job milestones" />
          </label>
        </div>
      )}
      {tool.name === 'submitWork' && (
        <div className="tx-card-form">
          <label>
            <span>Completed work and deliverables</span>
            <textarea value={formValues.workDetails} onChange={updateField('workDetails')} rows={4} placeholder="Describe what you completed and where to review it." />
          </label>
        </div>
      )}
      {tool.name === 'raiseDispute' && (
        <div className="tx-card-form">
          <label>
            <span>Reason and evidence</span>
            <textarea value={formValues.reason} onChange={updateField('reason')} rows={3} />
          </label>
          <div className="tx-card-form__grid">
            <label>
              <span>Amount disputed (USDC)</span>
              <input inputMode="decimal" value={formValues.disputedAmount} onChange={updateField('disputedAmount')} placeholder="0.00" />
            </label>
            <label>
              <span>Oracle fee (USDC)</span>
              <input inputMode="decimal" value={formValues.compensation} onChange={updateField('compensation')} placeholder="0.00" />
            </label>
          </div>
          <label>
            <span>Skill Oracle</span>
            <select value={formValues.oracleName} onChange={updateField('oracleName')} disabled={oraclesLoading}>
              <option value="">{oraclesLoading ? 'Loading active oracles…' : 'Choose an active oracle'}</option>
              {oracles.map((oracle) => (
                <option key={oracle.name} value={oracle.name}>{oracle.name} · {oracle.memberCount} member{oracle.memberCount === 1 ? '' : 's'}</option>
              ))}
            </select>
          </label>
          <p className="tx-card-note">The oracle fee is charged in USDC. You will approve it separately if your current allowance is insufficient.</p>
        </div>
      )}
      {progress && ['working', 'failed'].includes(status) && (
        <div className={`tx-progress tx-progress--${progress.phase || 'preparing'}`} aria-live="polite">
          <span className="tx-progress__indicator" aria-hidden="true" />
          <span><strong>{progress.phase === 'wallet' ? 'Waiting for your wallet' : progress.phase === 'error' ? 'Needs attention' : 'In progress'}</strong><small>{progress.message}</small></span>
        </div>
      )}
      {walletWaitExtended && status === 'working' && (
        <p className="tx-wallet-help">Oppy is checking the selected wallet and network in the background. Do not start a second transaction.</p>
      )}
      {diagnostic && status !== 'idle' && (
        <section className={`tx-diagnostic tx-diagnostic--${diagnostic.status}`} aria-live="polite">
          <div className="tx-diagnostic__summary">
            {diagnostic.status === 'confirmed'
              ? <CircleCheck size={17} aria-hidden="true" />
              : <CircleAlert size={17} aria-hidden="true" />}
            <span><strong>{diagnostic.summary}</strong><small>{diagnostic.nextStep}</small></span>
          </div>
          <div className="tx-diagnostic__actions">
            <button type="button" onClick={runDiagnosticCheck} disabled={diagnosticChecking}>
              <RefreshCw size={13} className={diagnosticChecking ? 'is-spinning' : ''} aria-hidden="true" />
              {diagnosticChecking ? 'Checking…' : 'Check live status'}
            </button>
            <span className={diagnostic.safeToRetry ? 'is-safe' : 'is-blocked'}>
              {diagnostic.safeToRetry ? 'Safe to retry' : 'Retry protected'}
            </span>
          </div>
          <details className="tx-diagnostic__details">
            <summary>Technical details</summary>
            <dl>
              {technicalRows.map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </details>
        </section>
      )}
      {['idle', 'failed'].includes(status) ? (
        <div className="tx-card-actions">
          <BlueButton
            label={loading ? 'Working…' : (status === 'failed' ? 'Retry safely' : actionLabel)}
            onClick={handleConfirm}
            disabled={loading || oraclesLoading || (status === 'failed' && !retryAllowed)}
            style={{ fontSize: '13px', height: '40px', padding: '0 16px', opacity: (loading || (status === 'failed' && !retryAllowed)) ? 0.55 : 1 }}
          />
          {!loading && <button className="tx-cancel-btn" onClick={onCancel}>Cancel</button>}
        </div>
      ) : status === 'working' ? null : status === 'submitted' && txHash ? (
        <>
          <div className="tx-success-msg">✓ {jobId ? `Job ${jobId} confirmed` : 'Transaction confirmed'}</div>
          <a className="tx-hash-link" href={explorerUrl(txChainId || chainId, txHash)} target="_blank" rel="noreferrer">
            View on Explorer: {txHash.slice(0, 18)}…
          </a>
          <CrossChainSyncStatus
            key={`${tool.name}:${txHash}`}
            tracking={tracking}
            onStatusChange={onTrackingChange}
          />
        </>
      ) : status === 'opened' ? (
        <div className="tx-success-msg">✓ Loaded here in Oppy</div>
      ) : (
        <div className="tx-failed-msg">The action was not completed.</div>
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

function ExplorerLink({ href, children, onOpen }) {
  if (!href) return null;
  return (
    <button type="button" className="oppy-data-link" onClick={() => onOpen(href)}>
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

function JobRows({ jobs = [], onOpen }) {
  if (!jobs.length) return <p className="oppy-data-empty">No matching jobs.</p>;
  return (
    <div className="oppy-data-job-list">
      {jobs.map((job) => (
        <button type="button" key={job.jobId} className="oppy-data-job" onClick={() => onOpen(job.href)}>
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

function WalletDashboardCard({ data, onOpen }) {
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
              <ExplorerLink href={item.href} onOpen={onOpen}>Open here</ExplorerLink>
            </div>
          ))}
        </div>
      ) : <p className="oppy-data-empty">You're all caught up.</p>}
      <details className="oppy-data-details">
        <summary>Recent jobs <span>{data.jobs?.length || 0}</span></summary>
        <JobRows jobs={data.jobs} onOpen={onOpen} />
      </details>
    </div>
  );
}

function PlatformOverviewCard({ data, onOpen }) {
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
      <JobRows jobs={data.recentJobs} onOpen={onOpen} />
    </div>
  );
}

function SearchResultsCard({ data, onOpen }) {
  return (
    <div className="oppy-data-card">
      <div className="oppy-data-heading">
        <div className="oppy-data-icon"><Search size={18} /></div>
        <div><span>JOB SEARCH</span><h3>{data.resultCount} result{data.resultCount === 1 ? '' : 's'} for “{data.query}”</h3></div>
      </div>
      <JobRows jobs={data.results} onOpen={onOpen} />
    </div>
  );
}

function JobDeepDiveCard({ data, onOpen, onAction }) {
  if (data.available === false) return <div className="oppy-data-card oppy-data-card--error">{data.error}</div>;
  const job = data.job || {};
  return (
    <div className="oppy-data-card oppy-data-card--deep">
      <div className="oppy-data-heading">
        <div className="oppy-data-icon"><BriefcaseBusiness size={18} /></div>
        <div><span>JOB {job.jobId}</span><h3>{job.title || `Job ${job.jobId}`}</h3><p>{job.chain} · {job.status}{job.viewerRole ? ` · You are the ${job.viewerRole}` : ''}</p></div>
        <span className="oppy-data-live"><i />Live</span>
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
          {data.nextAction.kind === 'review-work' ? (
            <button type="button" className="oppy-data-link" onClick={() => onAction({
              name: 'releasePayment', kind: 'transaction',
              display: `Release the current milestone payment for job ${data.job.jobId}`,
              params: { jobId: data.job.jobId },
            })}>Continue here<ArrowRight size={14} /></button>
          ) : data.nextAction.kind === 'submit-work' ? (
            <button type="button" className="oppy-data-link" onClick={() => onAction({
              name: 'submitWork', kind: 'transaction',
              display: `Submit work for job ${data.job.jobId}`,
              params: { jobId: data.job.jobId, workDetails: '' },
            })}>Continue here<ArrowRight size={14} /></button>
          ) : (
            <ExplorerLink href={data.nextAction.href} onOpen={onOpen}>Continue here</ExplorerLink>
          )}
        </div>
      )}
      {data.job.statusCode === 0 && data.job.viewerRole !== 'job giver' && (
        <div className="oppy-inline-cta">
          <span><strong>Interested in this job?</strong><small>Prepare an application without leaving Oppy.</small></span>
          <button type="button" className="oppy-data-link" onClick={() => onAction({
            name: 'applyToJob', kind: 'transaction', display: `Apply to job ${data.job.jobId}`,
            params: { jobId: data.job.jobId, proposal: '' },
          })}>Apply here<ArrowRight size={14} /></button>
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
                <span className="oppy-application__actions">
                  {data.job.viewerRole === 'job giver' && data.job.statusCode === 0 && (
                    <button type="button" className="oppy-data-link" onClick={() => onAction({
                      name: 'startJob',
                      kind: 'transaction',
                      display: `Hire ${application.profile?.name || application.applicant} for job ${data.job.jobId}`,
                      params: { jobId: data.job.jobId, applicantAddress: application.applicant, applicationId: application.id, useAppMilestones: false },
                    })}>Hire here<ArrowRight size={14} /></button>
                  )}
                  {application.profile?.href && <ExplorerLink href={application.profile.href} onOpen={onOpen}>Profile here</ExplorerLink>}
                </span>
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

function ExplorerCard({ data, onOpen, onAction }) {
  if (!data) return null;
  if (data.type === 'wallet-dashboard') return <WalletDashboardCard data={data} onOpen={onOpen} />;
  if (data.type === 'platform-overview') return <PlatformOverviewCard data={data} onOpen={onOpen} />;
  if (data.type === 'job-search') return <SearchResultsCard data={data} onOpen={onOpen} />;
  if (data.type === 'job-deep-dive') return <JobDeepDiveCard data={data} onOpen={onOpen} onAction={onAction} />;
  return null;
}

// ── Wallet status bar ────────────────────────────────────────────
function WalletSelector({ walletOptions, activeWalletId, onSelectWallet }) {
  if (walletOptions.length <= 1) return null;
  return (
    <select
      className="wallet-status-bar__selector"
      aria-label="Wallet used for transactions"
      value={activeWalletId}
      onChange={(event) => onSelectWallet(event.target.value)}
    >
      {!activeWalletId && <option value="">Choose wallet</option>}
      {walletOptions.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
    </select>
  );
}

function WalletBar({ walletState, walletOptions, activeWalletId, onConnect, onSwitchChain, onSelectWallet }) {
  if (!walletState.installed) {
    return (
      <div className="wallet-status-bar wallet-status-bar--warning">
        <span className="wallet-status-bar__icon" aria-hidden="true"><WalletCards size={17} /></span>
        <span className="wallet-status-bar__copy">
          <strong>Wallet features are off</strong>
          <small>Enable an EVM wallet extension to use job and payment actions.</small>
        </span>
        <span className="wallet-status-bar__hint">Brave Wallet, MetaMask, or another EVM wallet</span>
      </div>
    );
  }
  if (!walletState.connected) {
    return (
      <div className="wallet-status-bar">
        <span className="wallet-status-bar__icon" aria-hidden="true"><WalletCards size={17} /></span>
        <span className="wallet-status-bar__copy">
          <strong>Wallet not connected</strong>
          <small>Connect when you want Oppy to prepare an action.</small>
        </span>
        <WalletSelector walletOptions={walletOptions} activeWalletId={activeWalletId} onSelectWallet={onSelectWallet} />
        <button type="button" className="wallet-status-bar__action" onClick={onConnect}>Connect wallet</button>
      </div>
    );
  }
  if (!walletState.isCorrectChain) {
    return (
      <div className="wallet-status-bar wallet-status-bar--warning wallet-status-bar--wrap">
        <span className="wallet-status-bar__icon" aria-hidden="true"><CircleAlert size={17} /></span>
        <span className="wallet-status-bar__copy">
          <strong>Choose a supported network</strong>
          <small>Switch before preparing a wallet action.</small>
        </span>
        <span className="wallet-status-bar__actions">
          <WalletSelector walletOptions={walletOptions} activeWalletId={activeWalletId} onSelectWallet={onSelectWallet} />
          {SUPPORTED_CHAINS.map((chain) => (
            <button key={chain.chainId} type="button" className="wallet-status-bar__action" onClick={() => onSwitchChain(chain.chainId)}>
              {chain.label}
            </button>
          ))}
        </span>
      </div>
    );
  }
  const short = walletState.address
    ? `${walletState.address.slice(0, 6)}…${walletState.address.slice(-4)}`
    : '';
  return (
    <div className="wallet-status-bar wallet-status-bar--connected">
      <span className="wallet-status-bar__icon" aria-hidden="true"><CircleCheck size={17} /></span>
      <span className="wallet-status-bar__copy">
        <strong>{walletState.providerName || 'Wallet'} connected</strong>
        <small>
          <code>{short}</code>
          <span aria-hidden="true"> · </span>
          {getChainConfig(parseInt(walletState.chainId, 16))?.name}
        </small>
      </span>
      <WalletSelector walletOptions={walletOptions} activeWalletId={activeWalletId} onSelectWallet={onSelectWallet} />
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────
const OppyChat = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [voiceNotice, setVoiceNotice] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [walletOptions, setWalletOptions] = useState(() => getInjectedWallets());
  const [activeWalletId, setActiveWalletId] = useState(() => getPreferredInjectedWallet(getInjectedWallets())?.id || '');
  const [walletState, setWalletState] = useState({
    installed: false,
    connected: false,
    address: null,
    chainId: null,
    isCorrectChain: false,
    providerId: null,
    providerName: null,
  });
  const [chat, setChat] = useState([OPPY_JOB_GREETING]);
  const [activeJob, setActiveJob] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [latestTransactionDiagnostic, setLatestTransactionDiagnostic] = useState(null);
  const [lastPreparedAction, setLastPreparedAction] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const transcriptionControllerRef = useRef(null);
  const voiceBaseInputRef = useRef('');
  const walletProviderRef = useRef(null);
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
    setLatestTransactionDiagnostic(memory.latestTransactionDiagnostic);
    setLastPreparedAction(memory.lastPreparedAction);
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
      latestTransactionDiagnostic,
      lastPreparedAction,
    });
  }, [memoryScope, chat, activeJob, recentTransactions, latestTransactionDiagnostic, lastPreparedAction]);

  useEffect(() => {
    const messagesArea = messagesEndRef.current?.parentElement;
    if (messagesArea) messagesArea.scrollTop = messagesArea.scrollHeight;
  }, [chat, latestTransactionDiagnostic]);

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => () => {
    transcriptionControllerRef.current?.cancel();
    transcriptionControllerRef.current = null;
  }, []);

  // Wallet discovery and binding. EIP-6963 keeps Brave Wallet, MetaMask, and
  // other injected wallets separate instead of relying on whichever extension
  // happened to win window.ethereum.
  async function detectWallet(provider = walletProviderRef.current, walletOption = null) {
    if (!provider) {
      setWalletState({ installed: false, connected: false, address: null, chainId: null, isCorrectChain: false, providerId: null, providerName: null });
      return;
    }
    const accounts = await provider.request({ method: 'eth_accounts' });
    const chainId = await provider.request({ method: 'eth_chainId' });
    const normalizedChainId = chainId.toLowerCase();
    setWalletState({
      installed: true,
      connected: accounts.length > 0,
      address: accounts[0] || null,
      chainId: normalizedChainId,
      isCorrectChain: SUPPORTED_CHAIN_HEX.has(normalizedChainId),
      providerId: walletOption?.id || activeWalletId,
      providerName: walletOption?.name || 'Browser wallet',
    });
  }

  useEffect(() => {
    let mounted = true;
    const updateWalletOptions = (options) => {
      if (!mounted) return;
      setWalletOptions(options);
      setActiveWalletId((current) => (
        options.some((wallet) => wallet.id === current)
          ? current
          : (getPreferredInjectedWallet(options)?.id || '')
      ));
    };
    const unsubscribe = subscribeInjectedWallets(updateWalletOptions);
    discoverInjectedWallets().then(updateWalletOptions);
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const walletOption = walletOptions.find((wallet) => wallet.id === activeWalletId)
      || getPreferredInjectedWallet(walletOptions);
    const provider = walletOption?.provider || null;
    walletProviderRef.current = provider;
    if (!provider) {
      setWalletState({ installed: walletOptions.length > 0, connected: false, address: null, chainId: null, isCorrectChain: false, providerId: null, providerName: null });
      return undefined;
    }

    rememberInjectedWallet(walletOption.id);
    const sync = () => detectWallet(provider, walletOption).catch((error) => {
      console.error('[OppyChat] Wallet detection failed:', error);
      setWalletState({ installed: true, connected: false, address: null, chainId: null, isCorrectChain: false, providerId: walletOption.id, providerName: walletOption.name });
    });
    provider.on?.('accountsChanged', sync);
    provider.on?.('chainChanged', sync);
    sync();
    const lateSync = window.setTimeout(sync, 750);

    return () => {
      window.clearTimeout(lateSync);
      provider.removeListener?.('accountsChanged', sync);
      provider.removeListener?.('chainChanged', sync);
    };
  }, [activeWalletId, walletOptions]);

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
            latestTransactionDiagnostic,
            lastPreparedAction,
          },
        }),
      });

      if (!response.ok) throw new Error(`API error: ${response.status}`);
      const data = await response.json();

      if (data.success) {
        const legacy = parseToolBlock(data.response);
        const proposedCandidate = data.tool || legacy.tool;
        const semanticConflict = getOppyActionSemanticConflict(proposedCandidate);
        const proposedTool = semanticConflict ? null : proposedCandidate;
        const cleanText = semanticConflict
          ? `${semanticConflict} No wallet request was opened. Please ask Oppy to prepare the action again.`
          : (data.tool ? data.response : legacy.cleanText);
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
    if (['starting', 'listening', 'finalizing'].includes(voiceStatus)) return;
    sendMessage(input);
    setInput('');
  };

  const handleVoiceButton = async () => {
    if (voiceStatus === 'listening') {
      const controller = transcriptionControllerRef.current;
      if (controller) await controller.stop();
      return;
    }
    if (voiceStatus === 'starting' || voiceStatus === 'finalizing') return;

    voiceBaseInputRef.current = input;
    setVoiceNotice('Preparing microphone…');
    setVoiceStatus('starting');

    try {
      const controller = await startOppyTranscription({
        backendUrl: BACKEND_URL,
        onTranscript: ({ text }) => {
          setInput(mergeComposerTranscript(voiceBaseInputRef.current, text));
        },
        onStatus: (status) => {
          setVoiceStatus(status);
          if (status === 'listening') setVoiceNotice('Listening… tap stop when you are done.');
          if (status === 'finalizing') setVoiceNotice('Finishing transcription…');
        },
        onComplete: ({ hadTranscript, reason }) => {
          transcriptionControllerRef.current = null;
          setVoiceStatus('idle');
          setVoiceNotice(
            hadTranscript
              ? (reason === 'limit' ? 'Recording limit reached. Review your text before sending.' : '')
              : 'No speech detected. Try again.',
          );
          inputRef.current?.focus({ preventScroll: true });
        },
        onError: (error) => {
          transcriptionControllerRef.current = null;
          setVoiceStatus('error');
          setVoiceNotice(voiceErrorMessage(error));
        },
      });
      transcriptionControllerRef.current = controller;
    } catch (error) {
      transcriptionControllerRef.current = null;
      setVoiceStatus('error');
      setVoiceNotice(voiceErrorMessage(error));
    }
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

  const appendExplorerCard = (data) => {
    setChat((current) => [...current, { role: 'bot', isDataCard: true, data }]);
  };

  const appendActionCard = (tool) => {
    const conflict = getOppyActionSemanticConflict(tool);
    if (conflict) {
      addBotMessage(`${conflict} No wallet request was opened. Please prepare the action again.`);
      return;
    }
    setChat((current) => [...current, { role: 'bot', isTxCard: true, tool }]);
  };

  const handleDiagnoseTransaction = (diagnostic) => inspectTransactionDiagnostic(diagnostic, {
    walletProvider: walletProviderRef.current,
    rpcUrl: getChainConfig(diagnostic.chainId)?.rpcUrl,
  });

  const loadExplorerIntoChat = async (path, report) => {
    report?.({ phase: 'preparing', message: 'Loading live OpenWork data…' });
    const explorer = await fetchOppyExplorer(path);
    appendExplorerCard(explorer);
    return explorer;
  };

  const openInlineHref = async (href) => {
    try {
      const value = String(href || '');
      const jobMatch = value.match(/\/(?:job-details|job-deep-view|view-job-applications)\/([^/?#]+)/);
      const releaseMatch = value.match(/\/release-payment\/([^/?#]+)/);
      const disputeMatch = value.match(/\/raise-dispute\/([^/?#]+)/);
      const profileMatch = value.match(/\/profile\/(0x[a-fA-F0-9]{40})/);
      if (releaseMatch) {
        const jobId = decodeURIComponent(releaseMatch[1]);
        appendActionCard({ name: 'releasePayment', kind: 'transaction', display: `Release the current milestone payment for job ${jobId}`, params: { jobId } });
        return;
      }
      if (disputeMatch) {
        const jobId = decodeURIComponent(disputeMatch[1]);
        appendActionCard({ name: 'raiseDispute', kind: 'transaction', display: `Raise a dispute for job ${jobId}`, params: { jobId, reason: '' } });
        return;
      }
      if (jobMatch) {
        const jobId = decodeURIComponent(jobMatch[1]);
        await loadExplorerIntoChat(`/jobs/${encodeURIComponent(jobId)}${walletState.address ? `?wallet=${walletState.address}` : ''}`);
        return;
      }
      if (profileMatch) {
        await loadExplorerIntoChat(`/wallet/${profileMatch[1]}`);
        return;
      }
      throw new Error('This OpenWork view is not available inside Oppy yet.');
    } catch (error) {
      addBotMessage(`I couldn't load that here: ${error.message}`);
    }
  };

  // ── Chat-native action handler ───────────────────────────────
  const handleTransaction = async (tool, formValues = {}, report = () => {}) => {
    console.log('[OppyChat] Action requested:', tool.name);
    // Defense in depth: a stale or malformed review card must not cross the
    // wallet boundary when its human meaning conflicts with its function.
    assertOppyActionSemantics(tool);
    const walletProvider = walletProviderRef.current;
    const walletOption = walletOptions.find((wallet) => wallet.provider === walletProvider) || null;
    let submissionAttempted = false;

    try {
      if (tool.name === 'browseJobs') {
        await loadExplorerIntoChat('/search?status=Open', report);
        return { openedInline: true };
      }
      if (tool.name === 'openJob' || tool.name === 'viewApplications') {
        await loadExplorerIntoChat(`/jobs/${encodeURIComponent(tool.params.jobId)}${walletState.address ? `?wallet=${walletState.address}` : ''}`, report);
        return { openedInline: true };
      }
      if (tool.name === 'openMyJobs') {
        let address = walletState.address;
        if (!address && walletProvider) {
          report({ phase: 'wallet', message: 'Connect your wallet to load your OpenWork activity.' });
          [address] = await walletProvider.request({ method: 'eth_requestAccounts' });
          await detectWallet(walletProvider, walletOption);
        }
        if (!address) throw new Error('Connect an EVM wallet to show your jobs.');
        await loadExplorerIntoChat(`/wallet/${address}`, report);
        return { openedInline: true };
      }

      if (!walletProvider) {
        throw new Error('Enable Brave Wallet, MetaMask, or another EVM wallet extension to continue.');
      }

      let accounts = await walletProvider.request({ method: 'eth_accounts' });
      if (!accounts[0]) {
        report({ phase: 'wallet', message: `Connect ${walletOption?.name || 'your selected wallet'} to continue.` });
        accounts = await walletProvider.request({ method: 'eth_requestAccounts' });
      }
      const userAddress = accounts[0];
      if (!userAddress) throw new Error('Wallet connection was not completed.');

      let chainIdDecimal = parseInt(await walletProvider.request({ method: 'eth_chainId' }), 16);
      const postingChainId = ['startJob', 'releasePayment', 'raiseDispute'].includes(tool.name) && tool.params?.jobId
        ? extractChainIdFromJobId(tool.params.jobId)
        : null;
      if (postingChainId && postingChainId !== chainIdDecimal) {
        const postingChain = getChainConfig(postingChainId);
        report({ phase: 'wallet', message: `Switch to ${postingChain?.name || `chain ${postingChainId}`} in your wallet.` });
        await switchToChain(postingChainId, walletProvider);
        chainIdDecimal = postingChainId;
        await detectWallet(walletProvider, walletOption);
      }
      const chainConfig = getChainConfig(chainIdDecimal);
      if (!chainConfig?.allowed) throw new Error(chainConfig?.reason || 'Switch to Arbitrum, Optimism, or XDC.');

      const onStatus = (message) => {
        if (message && typeof message === 'object') {
          report(message);
          return;
        }
        const text = String(message || 'Preparing action…');
        const lower = text.toLowerCase();
        const phase = lower.includes('confirm in') || lower.includes('your wallet')
          ? 'wallet'
          : (lower.includes('quote') || lower.includes('estimating') ? 'quoting' : 'preparing');
        report({ phase, message: text.replace(/metaMask/gi, 'your wallet') });
      };

      const uploadToIPFS = async (data) => {
        const res = await fetch(`${BACKEND_URL}/api/ipfs/upload-json`, {
          method: 'POST',
          headers: { ...(await uploadAuthHeaders()), 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json().catch(() => null);
        if (!res.ok) throw new Error(json?.error || `IPFS upload failed (HTTP ${res.status})`);
        const hash = json?.hash || json?.IpfsHash;
        if (!hash) throw new Error('IPFS upload response did not contain a content hash');
        return hash;
      };

      let result;
      let trackingContext = null;
      let relayContext = null;
      switch (tool.name) {
        case 'postJob': {
          report({ phase: 'preparing', message: 'Preparing job details…' });
          const budget = Number(tool.params.budget) || 0;
          const milestones = (tool.params.milestones || [{ description: tool.params.description, amount: budget }]).map((milestone, index) => ({
            title: milestone.title || `Milestone ${index + 1}`,
            content: milestone.content || milestone.description,
            description: milestone.description,
            amount: Number(milestone.amount),
          }));
          const milestoneHashes = await Promise.all(milestones.map((milestone) => uploadToIPFS(milestone)));
          const milestoneAmounts = milestones.map((milestone) => Number(toUsdcBaseUnits(milestone.amount, 'Milestone amount')));
          const jobDetailHash = await uploadToIPFS({
            title: tool.params.title,
            description: tool.params.description,
            skills: tool.params.skills || [],
            milestoneType: milestones.length === 1 ? 'Single Milestone' : 'Multiple Milestones',
            milestones,
            milestoneHashes,
            attachments: [],
            totalCompensation: milestones.reduce((sum, milestone) => sum + milestone.amount, 0),
            jobGiver: userAddress,
            timestamp: new Date().toISOString(),
          });
          submissionAttempted = true;
          result = await postJob(chainIdDecimal, userAddress, { jobDetailHash, descriptions: milestoneHashes, amounts: milestoneAmounts }, onStatus, walletProvider);
          break;
        }
        case 'applyToJob': {
          // Determine amounts from the explicit proposal or authoritative on-chain milestones.
          // Never invent a payment amount if the read fails.
          let applyAmounts;
          const proposal = tool.params.proposal || formValues.proposal;
          const proposedAmount = tool.params.proposedAmount || formValues.proposedAmount;
          if (Number(proposedAmount) > 0) {
            applyAmounts = [Number(toUsdcBaseUnits(proposedAmount, 'Proposed amount'))];
          } else {
            report({ phase: 'preparing', message: 'Loading the job’s milestone amounts…' });
            const nativeChain = getNativeChain();
            const Web3 = (await import('web3')).default;
            const arbWeb3 = new Web3(nativeChain?.rpcUrl || 'https://arb1.arbitrum.io/rpc');
            const genesisContract = new arbWeb3.eth.Contract(GenesisABI, nativeChain?.contracts?.genesis);
            const jobData = await genesisContract.methods.getJob(tool.params.jobId).call();
            const milestones = jobData?.milestonePayments || jobData[6] || [];
            if (!milestones.length) throw new Error('The job has no authoritative milestone amounts.');
            applyAmounts = milestones.map((milestone) => Number(milestone.amount || milestone[1] || 0));
            if (applyAmounts.some((amount) => !Number.isFinite(amount) || amount <= 0)) throw new Error('The job contains an invalid milestone amount.');
          }
          const proposedMilestones = applyAmounts.map((amount, index) => ({
            title: `Milestone ${index + 1}`,
            content: proposal,
            description: proposal,
            amount: amount / 1e6,
          }));
          const milestoneHashes = await Promise.all(proposedMilestones.map((milestone) => uploadToIPFS(milestone)));
          const applicationHash = await uploadToIPFS({
            description: proposal,
            applicant: userAddress,
            jobId: tool.params.jobId,
            milestones: proposedMilestones,
            attachments: [],
            preferredChain: chainConfig.name,
            appliedFromChain: chainConfig.name,
            appliedFromChainId: chainIdDecimal,
            timestamp: new Date().toISOString(),
          });
          submissionAttempted = true;
          result = await applyToJob(chainIdDecimal, userAddress, {
            jobId: tool.params.jobId,
            applicationHash,
            descriptions: milestoneHashes,
            amounts: applyAmounts,
            preferredChainDomain: chainConfig.cctpDomain,
          }, onStatus, walletProvider);
          break;
        }
        case 'startDirectContract': {
          report({ phase: 'preparing', message: 'Preparing direct-contract milestones…' });
          const milestones = (tool.params.milestones || [{ description: tool.params.description, amount: tool.params.budget }]).map((milestone, index) => ({
            title: milestone.title || `Milestone ${index + 1}`,
            content: milestone.content || milestone.description,
            description: milestone.description,
            amount: Number(milestone.amount),
          }));
          const milestoneAmounts = milestones.map((milestone) => toUsdcBaseUnits(milestone.amount, 'Milestone amount'));
          const milestoneHashes = await Promise.all(milestones.map((milestone) => uploadToIPFS(milestone)));
          const jobDetailHash = await uploadToIPFS({
            title: tool.params.title,
            description: tool.params.description,
            milestoneType: milestones.length === 1 ? 'Single Milestone' : 'Multiple Milestones',
            milestones,
            milestoneHashes,
            attachments: [],
            totalCompensation: milestones.reduce((sum, milestone) => sum + milestone.amount, 0),
            jobGiver: userAddress,
            jobTaker: tool.params.jobTaker,
            timestamp: new Date().toISOString(),
          });
          submissionAttempted = true;
          await ensureUsdcFunding({
            chainId: chainIdDecimal,
            owner: userAddress,
            spender: chainConfig.contracts.lowjc,
            amount: milestoneAmounts[0],
            onStatus,
            walletProvider,
          });
          result = await startDirectContract(chainIdDecimal, userAddress, {
            jobTaker: tool.params.jobTaker,
            jobDetailHash,
            descriptions: milestoneHashes,
            amounts: milestoneAmounts.map(String),
            jobTakerChainDomain: chainConfig.cctpDomain,
          }, onStatus, walletProvider);
          relayContext = { asyncApplicantMilestones: false };
          break;
        }
        case 'startJob': {
          const deepDive = await fetchOppyExplorer(`/jobs/${encodeURIComponent(tool.params.jobId)}?wallet=${userAddress}`);
          let application = tool.params.applicationId
            ? deepDive.applications?.find((candidate) => Number(candidate.id) === Number(tool.params.applicationId))
            : resolveSelectedApplication(deepDive, tool.params.applicantAddress);
          if (!application && tool.params.applicantAddress) {
            report({ phase: 'preparing', message: 'Finding the selected application in the full job history…' });
            const nativeChain = getNativeChain();
            const Web3 = (await import('web3')).default;
            const arbWeb3 = new Web3(nativeChain?.rpcUrl || 'https://arb1.arbitrum.io/rpc');
            const genesis = new arbWeb3.eth.Contract(GenesisABI, nativeChain?.contracts?.genesis);
            const applicationCount = Number(await genesis.methods.getJobApplicationCount(tool.params.jobId).call());
            for (let applicationId = 1; applicationId <= applicationCount; applicationId += 1) {
              const candidate = await genesis.methods.getJobApplication(tool.params.jobId, applicationId).call();
              const address = candidate?.applicant || candidate?.[2];
              if (address?.toLowerCase() === tool.params.applicantAddress.toLowerCase()) {
                const proposedMilestones = Array.from(candidate?.proposedMilestones || candidate?.[4] || []).map((milestone) => ({
                  amount: Number(milestone?.amount || milestone?.[1] || 0) / 1e6,
                }));
                application = { id: Number(candidate?.id || candidate?.[0] || applicationId), applicant: address, proposedMilestones };
                break;
              }
            }
          }
          if (!application) throw new Error('The selected application is not available for this job.');
          if (deepDive.job?.viewerRole !== 'job giver') throw new Error('Only the job poster can start this job.');
          const useAppMilestones = Boolean(tool.params.useAppMilestones && supportsApplicantMilestones(chainIdDecimal));
          const firstAmount = useAppMilestones
            ? application.proposedMilestones?.[0]?.amount
            : deepDive.milestones?.[0]?.amount;
          const firstAmountRaw = toUsdcBaseUnits(firstAmount, 'First milestone amount');
          submissionAttempted = true;
          await ensureUsdcFunding({ chainId: chainIdDecimal, owner: userAddress, spender: chainConfig.contracts.lowjc, amount: firstAmountRaw, onStatus, walletProvider });
          result = await startJob(chainIdDecimal, userAddress, {
            jobId: tool.params.jobId,
            applicationId: Number(application.id),
            useAppMilestones,
          }, onStatus, walletProvider);
          relayContext = {
            asyncApplicantMilestones: useAppMilestones && usesAsyncApplicantMilestoneStart(chainIdDecimal),
          };
          break;
        }
        case 'submitWork': {
          report({ phase: 'preparing', message: 'Preparing the work submission…' });
          const workDetails = tool.params.workDetails || formValues.workDetails;
          const submissionHash = await uploadToIPFS({ workDetails, jobId: tool.params.jobId, submittedBy: userAddress, timestamp: new Date().toISOString() });
          submissionAttempted = true;
          result = await submitWork(chainIdDecimal, userAddress, { jobId: tool.params.jobId, submissionHash }, onStatus, walletProvider);
          break;
        }
        case 'releasePayment': {
          const deepDive = await fetchOppyExplorer(`/jobs/${encodeURIComponent(tool.params.jobId)}?wallet=${userAddress}`);
          if (deepDive.job?.viewerRole !== 'job giver') throw new Error('Only the job poster can release this payment.');
          const target = resolveReleaseTarget(deepDive);
          const baselineTotalPaidRaw = usdcDecimalToBaseUnits(deepDive.job?.totalPaid);
          trackingContext = {
            targetDomain: target.targetChainDomain,
            baselineTotalPaidRaw,
          };
          submissionAttempted = true;
          result = await releasePaymentCrossChain(chainIdDecimal, userAddress, {
            jobId: tool.params.jobId,
            targetChainDomain: target.targetChainDomain,
            targetRecipient: target.targetRecipient,
            baselineTotalPaidRaw,
          }, onStatus, walletProvider);
          break;
        }
        case 'raiseDispute': {
          const deepDive = await fetchOppyExplorer(`/jobs/${encodeURIComponent(tool.params.jobId)}?wallet=${userAddress}`);
          if (!['job giver', 'selected applicant'].includes(deepDive.job?.viewerRole)) throw new Error('Only the job poster or selected freelancer can raise this dispute.');
          if (deepDive.job?.statusCode !== 1) throw new Error('Disputes can only be raised while a job is in progress.');
          const feeAmount = toUsdcBaseUnits(formValues.compensation, 'Oracle fee');
          const disputedAmount = toUsdcBaseUnits(formValues.disputedAmount, 'Disputed amount');
          submissionAttempted = true;
          await ensureUsdcFunding({ chainId: chainIdDecimal, owner: userAddress, spender: chainConfig.contracts.athenaClient, amount: feeAmount, onStatus, walletProvider });
          report({ phase: 'preparing', message: 'Securing the dispute details…' });
          const disputeHash = await uploadToIPFS({
            title: `Dispute for job ${tool.params.jobId}`,
            description: formValues.reason,
            disputeAmount: Number(formValues.disputedAmount),
            compensation: Number(formValues.compensation),
            selectedOracle: formValues.oracleName,
            jobId: tool.params.jobId,
            raisedBy: userAddress,
            respondent: deepDive.job.viewerRole === 'job giver' ? deepDive.job.selectedApplicant : deepDive.job.jobGiver,
            timestamp: new Date().toISOString(),
          });
          result = await raiseDispute(chainIdDecimal, userAddress, {
            jobId: tool.params.jobId,
            disputeHash,
            oracleName: formValues.oracleName,
            feeAmount: feeAmount.toString(),
            disputedAmount: disputedAmount.toString(),
          }, onStatus, walletProvider);
          break;
        }
        case 'createProfile': {
          report({ phase: 'preparing', message: 'Preparing profile details…' });
          const ipfsHash = await uploadToIPFS({ name: tool.params.name, skills: tool.params.skills, hourlyRate: tool.params.hourlyRate, walletAddress: userAddress });
          submissionAttempted = true;
          result = await createProfile(chainIdDecimal, userAddress, { ipfsHash }, onStatus, walletProvider);
          break;
        }
        default:
          throw new Error(`Oppy does not recognize the action “${tool.name}”.`);
      }

      if (!result?.transactionHash) throw new Error('The wallet action did not return a transaction hash.');
      const confirmedJobId = result.jobId || tool.params?.jobId || null;
      let relayWarning = null;
      if (confirmedJobId && relayContext && chainIdDecimal !== 42161) {
        report({ phase: 'preparing', message: 'Starting the first-milestone USDC delivery…' });
        try {
          await requestStartJobRelay({
            jobId: confirmedJobId,
            txHash: result.transactionHash,
            ...relayContext,
          });
        } catch (relayError) {
          relayWarning = relayError?.message || 'The USDC delivery service did not accept the request.';
          console.warn('[OppyChat] Start-job relay notification failed:', relayWarning);
        }
      }
      if (confirmedJobId) {
        setActiveJob(sanitizeActiveJob({
          jobId: confirmedJobId,
          title: ['postJob', 'startDirectContract'].includes(tool.name) ? tool.params.title : activeJob?.title,
          sourceChainId: chainIdDecimal,
          sourceChainName: chainConfig.name,
          sourceTxHash: result.transactionHash,
          sourceReceiptConfirmed: true,
        }));
        setRecentTransactions((current) => recordOppyTransaction(current, {
          action: tool.name,
          jobId: confirmedJobId,
          txHash: result.transactionHash,
          chainId: chainIdDecimal,
          confirmed: true,
          ...trackingContext,
        }));
      }
      const crossChainDeliveryPending = chainIdDecimal !== 42161
        && ['postJob', 'startDirectContract', 'releasePayment'].includes(tool.name);
      if (result.canonicalDeliveryPending || crossChainDeliveryPending) {
        addBotMessage('Your source transaction is confirmed. The live status card above shows the latest network, OpenWork and USDC delivery state; you can remain in this chat.');
        if (relayWarning) {
          addBotMessage('The contract transaction is safe, but its USDC delivery needs attention. Do not submit the contract again; use **Check live status** so Oppy can guide recovery without creating a duplicate.');
        }
      }
      return {
        txHash: result.transactionHash,
        jobId: confirmedJobId,
        chainId: chainIdDecimal,
        tracking: confirmedJobId ? {
          action: tool.name,
          jobId: confirmedJobId,
          sourceChainId: chainIdDecimal,
          sourceTxHash: result.transactionHash,
          sourceReceiptConfirmed: true,
          ...trackingContext,
        } : null,
        message: result.canonicalDeliveryPending || crossChainDeliveryPending
          ? 'Source transaction confirmed; network delivery is in progress.'
          : 'Transaction confirmed.',
      };
    } catch (error) {
      let message = error?.message || 'Transaction failed.';
      const chainName = getChainConfig(parseInt(walletState.chainId || '0x0', 16))?.name;
      message = walletRpcErrorMessage(error, walletOption?.name || walletState.providerName, chainName) || message;
      if (/user rejected|user denied|4001/i.test(message)) message = 'The wallet request was cancelled. Nothing else was submitted.';
      else if (/insufficient funds/i.test(message)) {
        const symbol = getChainConfig(parseInt(walletState.chainId || '0x0', 16))?.nativeCurrency?.symbol || 'native currency';
        message = `The wallet does not have enough ${symbol} for network fees.`;
      }
      const verifiedPreBroadcast = ['NATIVE_BALANCE_TOO_LOW', 'NATIVE_BALANCE_UNAVAILABLE'].includes(error?.code);
      const preBroadcastFailure = !submissionAttempted || verifiedPreBroadcast;
      report({
        phase: 'error',
        message,
        error,
        ...(preBroadcastFailure ? {
          outcome: 'failed',
          safeToRetry: true,
          summary: 'The action stopped before any transaction was submitted.',
          nextStep: error?.code === 'NATIVE_BALANCE_TOO_LOW'
            ? 'Top up the native-token shortfall shown in the live funding check, then retry safely.'
            : 'The wallet or network setting can be corrected, then this action can be retried safely.',
          category: error?.code === 'NATIVE_BALANCE_TOO_LOW' ? 'insufficient_gas' : 'pre_broadcast',
        } : {}),
      });
      return {
        error: message,
        diagnosticError: error,
        ...(preBroadcastFailure ? {
          outcome: 'failed',
          safeToRetry: true,
          summary: 'The action stopped before any transaction was submitted.',
          nextStep: error?.code === 'NATIVE_BALANCE_TOO_LOW'
            ? 'Top up the native-token shortfall shown in the live funding check, then retry safely.'
            : 'The wallet or network setting can be corrected, then this action can be retried safely.',
          category: error?.code === 'NATIVE_BALANCE_TOO_LOW' ? 'insufficient_gas' : 'pre_broadcast',
        } : {}),
      };
    }
  };

  const handleConnectWallet = async () => {
    try {
      const walletProvider = walletProviderRef.current;
      const walletOption = walletOptions.find((wallet) => wallet.provider === walletProvider) || null;
      if (!walletProvider) throw new Error('No EVM wallet is available.');
      await walletProvider.request({ method: 'eth_requestAccounts' });
      detectWallet(walletProvider, walletOption);
    } catch (err) {
      console.error('[OppyChat] Connect wallet error:', err);
    }
  };

  const handleSwitchChain = async (targetChainId = 42161) => {
    try {
      const walletProvider = walletProviderRef.current;
      const walletOption = walletOptions.find((wallet) => wallet.provider === walletProvider) || null;
      await switchToChain(targetChainId, walletProvider);
      await detectWallet(walletProvider, walletOption);
    } catch (switchError) {
      console.error('[OppyChat] Switch chain error:', switchError);
    }
  };

  const handleSelectWallet = (walletId) => {
    rememberInjectedWallet(walletId);
    setActiveWalletId(walletId);
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
  const mobInput  = mob ? { padding:'10px 12px 16px 12px', flexShrink:0, background:'#fff', display:'flex', alignItems:'center', gap:10, boxSizing:'border-box', width:'100%', maxWidth:'100vw' } : {};
  const mobField  = mob ? { fontSize:16, padding:'12px 13px', flex:'1 1 0%', minWidth:0, boxSizing:'border-box' } : {};
  const mobBtn    = mob ? { width:42, minWidth:42, height:42, flexShrink:0 } : {};
  const mobSugg   = mob ? { padding:'8px 14px 8px 49px', flexWrap:'nowrap', overflowX:'auto', WebkitOverflowScrolling:'touch', flexShrink:0 } : {};

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
            <ArrowLeft size={19} strokeWidth={2.2} aria-hidden="true" />
          </button>
          <div className="oppy-chat-header">
            <div className="oppy-chat-icon">
              <Bot size={19} color="#fff" strokeWidth={2.1} />
              <span className="oppy-chat-icon__presence" aria-hidden="true" />
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
                    <ExplorerCard data={msg.data} onOpen={openInlineHref} onAction={appendActionCard} />
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
                      onDiagnose={handleDiagnoseTransaction}
                      onDiagnosticChange={(diagnostic, preparedAction) => {
                        setLatestTransactionDiagnostic(diagnostic);
                        setLastPreparedAction(sanitizePreparedAction(preparedAction));
                      }}
                      onTrackingChange={(trackingUpdate, statusUpdate) => {
                        setRecentTransactions((current) => updateOppyTransactionDelivery(current, trackingUpdate, statusUpdate));
                      }}
                      onCancel={() => handleCancelTx(idx)}
                    />
                  </div>
                );
              }
              if (msg.isThinking) {
                return (
                  <div className="chat-msg-row bot" key={idx}>
                    <span className="chat-message-avatar" aria-hidden="true"><Bot size={14} /></span>
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
                  {msg.role === 'bot' && (
                    <span className="chat-message-avatar" aria-hidden="true"><Bot size={14} /></span>
                  )}
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
            walletOptions={walletOptions}
            activeWalletId={activeWalletId}
            onConnect={handleConnectWallet}
            onSwitchChain={handleSwitchChain}
            onSelectWallet={handleSelectWallet}
          />

          {/* Input bar */}
          <div className="chat-composer">
            {voiceNotice && (
              <div
                className={`chat-voice-status chat-voice-status--${voiceStatus}`}
                role="status"
                aria-live="polite"
              >
                <span className="chat-voice-status__dot" aria-hidden="true" />
                {voiceNotice}
              </div>
            )}
            <form className="chat-input-bar" onSubmit={handleSubmit} style={mobInput}>
              <div className="chat-input-shell">
                <input
                  ref={inputRef}
                  className="chat-input"
                  type="text"
                  placeholder="Ask Oppy anything…"
                  value={input}
                  onChange={e => {
                    setInput(e.target.value);
                    if (voiceStatus === 'error') {
                      setVoiceStatus('idle');
                      setVoiceNotice('');
                    }
                  }}
                  disabled={loading || ['starting', 'listening', 'finalizing'].includes(voiceStatus)}
                  style={mobField}
                />
                <button
                  type="button"
                  className={`chat-voice-btn${voiceStatus === 'listening' ? ' chat-voice-btn--recording' : ''}`}
                  onClick={handleVoiceButton}
                  disabled={loading || voiceStatus === 'starting' || voiceStatus === 'finalizing'}
                  aria-label={voiceStatus === 'listening' ? 'Stop voice input' : 'Start voice input'}
                  aria-pressed={voiceStatus === 'listening'}
                  title={voiceStatus === 'listening' ? 'Stop voice input' : 'Start voice input'}
                  style={mobBtn}
                >
                  {voiceStatus === 'listening' ? <Square size={13} fill="currentColor" /> : <Mic size={17} />}
                </button>
                <button
                  type="submit"
                  className="chat-send-btn"
                  disabled={loading || !input.trim() || ['starting', 'listening', 'finalizing'].includes(voiceStatus)}
                  aria-label="Send"
                  title="Send message"
                  style={mobBtn}
                >
                  <ArrowUp size={18} strokeWidth={2.3} />
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
    </div>
  );
};

export default OppyChat;
