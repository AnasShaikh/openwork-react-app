import React, { useCallback, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, LoaderCircle, RefreshCw } from 'lucide-react';
import {
  CROSS_CHAIN_SYNC_POLL_MS,
  getCrossChainSource,
  getCrossChainTrackingLinks,
  readCanonicalJobSyncStatus,
} from '../../services/crossChainSyncService';
import './CrossChainSyncStatus.css';

function stepStateClass(complete, active = false) {
  if (complete) return 'cross-chain-sync__step cross-chain-sync__step--complete';
  if (active) return 'cross-chain-sync__step cross-chain-sync__step--active';
  return 'cross-chain-sync__step';
}

function StepIcon({ complete, active }) {
  if (complete) return <CheckCircle2 aria-hidden="true" size={18} />;
  if (active) return <LoaderCircle aria-hidden="true" className="cross-chain-sync__spinner" size={18} />;
  return <span aria-hidden="true" className="cross-chain-sync__waiting-dot" />;
}

export default function CrossChainSyncStatus({ activeJob }) {
  const source = getCrossChainSource(activeJob);
  const links = getCrossChainTrackingLinks(activeJob);
  const [sync, setSync] = useState({ state: 'checking', checkedAt: null, error: null });
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    if (!source || activeJob?.sourceReceiptConfirmed !== true) return undefined;
    let cancelled = false;
    let timer = null;

    const check = async () => {
      setSync((current) => ({ ...current, state: current.state === 'synced' ? 'synced' : 'checking', error: null }));
      try {
        const next = await readCanonicalJobSyncStatus(activeJob);
        if (cancelled) return;
        setSync(next);
        if (next.state !== 'synced') timer = window.setTimeout(check, CROSS_CHAIN_SYNC_POLL_MS);
      } catch (error) {
        if (cancelled) return;
        setSync({
          state: 'unavailable',
          checkedAt: new Date().toISOString(),
          error: error.message || 'Arbitrum status is temporarily unavailable',
        });
        timer = window.setTimeout(check, CROSS_CHAIN_SYNC_POLL_MS * 2);
      }
    };

    check();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [activeJob?.jobId, activeJob?.sourceReceiptConfirmed, activeJob?.sourceTxHash, refreshKey, source?.chainId]);

  if (!source || activeJob?.sourceReceiptConfirmed !== true) return null;

  const synced = sync.state === 'synced';
  const checking = sync.state === 'checking' || sync.state === 'syncing';
  const checkedTime = sync.checkedAt
    ? new Date(sync.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <section
      className={`cross-chain-sync ${synced ? 'cross-chain-sync--synced' : ''}`}
      aria-live="polite"
      aria-label={`Cross-chain sync status for job ${activeJob.jobId}`}
    >
      <div className="cross-chain-sync__header">
        <div>
          <span className="cross-chain-sync__eyebrow">Job sync</span>
          <h3>{source.name} <ArrowRight aria-hidden="true" size={16} /> Arbitrum</h3>
          <p>Job <strong>{activeJob.jobId}</strong></p>
        </div>
        <span className={`cross-chain-sync__badge ${synced ? 'cross-chain-sync__badge--synced' : ''}`}>
          {synced ? 'Synced' : (sync.state === 'unavailable' ? 'Checking' : 'In progress')}
        </span>
      </div>

      <ol className="cross-chain-sync__steps">
        <li className={stepStateClass(true)}>
          <StepIcon complete />
          <div><strong>Job submitted</strong><span>Confirmed on {source.name}</span></div>
        </li>
        <li className={stepStateClass(synced, checking)}>
          <StepIcon complete={synced} active={checking} />
          <div><strong>Network delivery</strong><span>{synced ? 'Delivered' : 'Sending to Arbitrum'}</span></div>
        </li>
        <li className={stepStateClass(synced, false)}>
          <StepIcon complete={synced} />
          <div><strong>OpenWork update</strong><span>{synced ? 'Job is ready' : 'Finalizing job'}</span></div>
        </li>
      </ol>

      {sync.state === 'unavailable' && (
        <p className="cross-chain-sync__notice">
          Your job is safe. We're having trouble checking the final status and will retry automatically.
        </p>
      )}

      <div className="cross-chain-sync__footer">
        <div className="cross-chain-sync__links">
          {links.sourceExplorerUrl && <a href={links.sourceExplorerUrl} target="_blank" rel="noreferrer">View transaction</a>}
          {links.layerZeroScanUrl && <a href={links.layerZeroScanUrl} target="_blank" rel="noreferrer">Delivery details</a>}
          {synced && links.canonicalJobUrl && <a href={links.canonicalJobUrl}>Open job</a>}
        </div>
        <button type="button" onClick={refresh} aria-label="Refresh cross-chain status">
          <RefreshCw aria-hidden="true" size={14} />
          {checkedTime ? `Checked ${checkedTime}` : 'Check now'}
        </button>
      </div>
    </section>
  );
}
