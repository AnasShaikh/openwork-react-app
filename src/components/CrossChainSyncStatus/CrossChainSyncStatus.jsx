import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleAlert, LoaderCircle, RefreshCw, WalletCards } from 'lucide-react';
import {
  CROSS_CHAIN_SYNC_POLL_MS,
  crossChainTrackingKey,
  getCrossChainSource,
  getCrossChainTrackingLinks,
  isCrossChainSyncCandidate,
  readCrossChainActionStatus,
} from '../../services/crossChainSyncService';
import './CrossChainSyncStatus.css';

const DOMAIN_NAMES = new Map([[2, 'Optimism'], [3, 'Arbitrum'], [18, 'XDC Network']]);

function stepStateClass(complete, active = false, failed = false) {
  if (complete) return 'cross-chain-sync__step cross-chain-sync__step--complete';
  if (failed) return 'cross-chain-sync__step cross-chain-sync__step--failed';
  if (active) return 'cross-chain-sync__step cross-chain-sync__step--active';
  return 'cross-chain-sync__step';
}

function StepIcon({ complete, active, failed }) {
  if (complete) return <CheckCircle2 aria-hidden="true" size={18} />;
  if (failed) return <CircleAlert aria-hidden="true" size={18} />;
  if (active) return <LoaderCircle aria-hidden="true" className="cross-chain-sync__spinner" size={18} />;
  return <span aria-hidden="true" className="cross-chain-sync__waiting-dot" />;
}

function actionCopy(action) {
  if (action === 'releasePayment') {
    return {
      eyebrow: 'Payment delivery',
      sourceTitle: 'Release submitted',
      canonicalTitle: 'OpenWork payment',
      canonicalPending: 'Recording the payment',
      canonicalComplete: 'Payment recorded',
      completeBadge: 'Payment received',
    };
  }
  if (action === 'startDirectContract') {
    return {
      eyebrow: 'Direct contract sync',
      sourceTitle: 'Contract submitted',
      canonicalTitle: 'OpenWork contract',
      canonicalPending: 'Creating the contract',
      canonicalComplete: 'Contract is ready',
      completeBadge: 'Contract ready',
    };
  }
  return {
    eyebrow: 'Job sync',
    sourceTitle: 'Job submitted',
    canonicalTitle: 'OpenWork job',
    canonicalPending: 'Creating the job',
    canonicalComplete: 'Job is ready',
    completeBadge: 'Job ready',
  };
}

export default function CrossChainSyncStatus({ tracking, onStatusChange, onCompleteCctp }) {
  const source = getCrossChainSource(tracking);
  const trackingKey = crossChainTrackingKey(tracking);
  const copy = actionCopy(tracking?.action);
  const [sync, setSync] = useState({ state: 'checking', checkedAt: null, error: null });
  const [refreshKey, setRefreshKey] = useState(0);
  const [recovery, setRecovery] = useState({ state: 'idle', message: null });
  const onStatusChangeRef = useRef(onStatusChange);
  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  useEffect(() => {
    setRecovery({ state: 'idle', message: null });
  }, [trackingKey]);

  useEffect(() => {
    setSync({ state: 'checking', checkedAt: null, error: null });
    if (!isCrossChainSyncCandidate(tracking)) return undefined;
    let cancelled = false;
    let timer = null;

    const check = async () => {
      try {
        const next = await readCrossChainActionStatus(tracking);
        if (cancelled) return;
        setSync(next);
        onStatusChangeRef.current?.(tracking, next);
        if (!next.complete && next.state !== 'failed') {
          const delay = next.state === 'unavailable' ? CROSS_CHAIN_SYNC_POLL_MS * 2 : CROSS_CHAIN_SYNC_POLL_MS;
          timer = window.setTimeout(check, delay);
        }
      } catch (error) {
        if (cancelled) return;
        setSync({
          state: 'unavailable',
          checkedAt: new Date().toISOString(),
          error: error.message || 'Cross-chain status is temporarily unavailable',
        });
        onStatusChangeRef.current?.(tracking, {
          state: 'unavailable',
          complete: false,
          checkedAt: new Date().toISOString(),
        });
        timer = window.setTimeout(check, CROSS_CHAIN_SYNC_POLL_MS * 2);
      }
    };

    check();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [trackingKey, refreshKey]);

  const links = useMemo(() => getCrossChainTrackingLinks(tracking, sync), [tracking, sync]);
  if (!isCrossChainSyncCandidate(tracking) || !source) return null;

  const complete = sync.complete === true;
  const failed = sync.state === 'failed';
  const layerZeroComplete = sync.layerZero?.state === 'delivered';
  const layerZeroFailed = sync.layerZero?.state === 'failed';
  const canonicalComplete = sync.canonical?.state === 'complete';
  const cctpRequired = sync.cctp?.required === true
    || (tracking.action === 'releasePayment' && Number(tracking.targetDomain) !== 3);
  const cctpComplete = !cctpRequired || sync.cctp?.state === 'received';
  const resolvedTargetName = sync.cctp?.targetChainName || DOMAIN_NAMES.get(Number(tracking.targetDomain));
  const targetName = resolvedTargetName || 'the destination chain';
  const showSeparatePaymentTarget = cctpRequired
    && resolvedTargetName
    && !/^Arbitrum(?: One)?$/i.test(resolvedTargetName);
  const checkedTime = sync.checkedAt
    ? new Date(sync.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;
  const unavailable = sync.state === 'unavailable';
  const needsAction = sync.state === 'requires-action';
  const canSelfRelay = sync.cctp?.selfRelayAvailable === true && typeof onCompleteCctp === 'function';
  const completeWithWallet = async () => {
    if (!canSelfRelay || recovery.state === 'working') return;
    setRecovery({ state: 'working', message: 'Preparing the destination transaction…' });
    try {
      const result = await onCompleteCctp(tracking, (update) => {
        setRecovery({ state: 'working', message: update?.message || String(update || '') });
      });
      setRecovery({
        state: 'complete',
        message: result?.alreadyCompleted ? 'This USDC transfer was already completed.' : 'USDC delivery transaction confirmed.',
      });
      refresh();
    } catch (error) {
      setRecovery({ state: 'failed', message: error.message || 'The wallet completion was not finished.' });
    }
  };

  return (
    <section
      className={`cross-chain-sync ${complete ? 'cross-chain-sync--synced' : ''} ${failed ? 'cross-chain-sync--failed' : ''} ${needsAction ? 'cross-chain-sync--action' : ''}`}
      aria-live="polite"
      aria-label={`${copy.eyebrow} status for job ${tracking.jobId}`}
    >
      <div className="cross-chain-sync__header">
        <div>
          <span className="cross-chain-sync__eyebrow">{copy.eyebrow}</span>
          <h3>
            {source.name} <ArrowRight aria-hidden="true" size={16} /> Arbitrum
            {showSeparatePaymentTarget && <><ArrowRight aria-hidden="true" size={16} /> {targetName}</>}
          </h3>
          <p>Job <strong>{tracking.jobId}</strong></p>
        </div>
        <span className={`cross-chain-sync__badge ${complete ? 'cross-chain-sync__badge--synced' : ''} ${failed ? 'cross-chain-sync__badge--failed' : ''} ${needsAction ? 'cross-chain-sync__badge--action' : ''}`}>
          {complete ? copy.completeBadge : (failed || needsAction ? 'Needs attention' : 'In progress')}
        </span>
      </div>

      <ol className={`cross-chain-sync__steps ${cctpRequired ? 'cross-chain-sync__steps--four' : ''}`}>
        <li className={stepStateClass(true)}>
          <StepIcon complete />
          <div><strong>{copy.sourceTitle}</strong><span>Confirmed on {source.name}</span></div>
        </li>
        <li className={stepStateClass(layerZeroComplete, !layerZeroComplete && !layerZeroFailed, layerZeroFailed)}>
          <StepIcon complete={layerZeroComplete} active={!layerZeroComplete && !layerZeroFailed} failed={layerZeroFailed} />
          <div><strong>Network delivery</strong><span>{layerZeroComplete ? 'Delivered to Arbitrum' : (layerZeroFailed ? 'Delivery needs attention' : 'Sending to Arbitrum')}</span></div>
        </li>
        <li className={stepStateClass(canonicalComplete, layerZeroComplete && !canonicalComplete)}>
          <StepIcon complete={canonicalComplete} active={layerZeroComplete && !canonicalComplete} />
          <div><strong>{copy.canonicalTitle}</strong><span>{canonicalComplete ? copy.canonicalComplete : copy.canonicalPending}</span></div>
        </li>
        {cctpRequired && (
          <li className={stepStateClass(cctpComplete, canonicalComplete && !cctpComplete && !needsAction, needsAction)}>
            <StepIcon complete={cctpComplete} active={canonicalComplete && !cctpComplete && !needsAction} failed={needsAction} />
            <div><strong>USDC received</strong><span>{cctpComplete
              ? `Confirmed on ${targetName}`
              : (sync.cctp?.reason === 'attestation_incomplete'
                ? 'Waiting for Circle attestation'
                : (canSelfRelay ? 'Ready to complete with a wallet' : `Transferring to ${targetName}`))}</span></div>
          </li>
        )}
      </ol>

      {unavailable && (
        <p className="cross-chain-sync__notice">
          The confirmed source transaction is safe. One live status provider is temporarily unavailable, so Oppy will keep checking and will not show completion early.
        </p>
      )}
      {failed && (
        <p className="cross-chain-sync__notice cross-chain-sync__notice--failed">
          LayerZero reports that this delivery needs attention. Open Delivery details before attempting another transaction.
        </p>
      )}
      {canSelfRelay && (
        <div className="cross-chain-sync__recovery">
          <div>
            <strong>{needsAction ? 'Automatic delivery cannot continue' : 'USDC is ready to finalize'}</strong>
            <span>
              {needsAction
                ? (sync.relayer?.reason === 'service_wallet_underfunded'
                  ? `The OpenWork relayer needs more ${sync.relayer?.destination?.nativeSymbol || 'gas'} on ${sync.relayer?.destination?.chainName || 'the destination chain'}.`
                  : 'The automatic destination relay is unavailable.')
                : 'Automatic delivery may still finish it, or you can complete the permissionless receive now.'}
              {' '}Your source transaction is safe; do not submit it again.
            </span>
          </div>
          <button type="button" onClick={completeWithWallet} disabled={recovery.state === 'working'}>
            <WalletCards aria-hidden="true" size={15} />
            {recovery.state === 'working' ? 'Waiting for wallet…' : 'Complete with my wallet'}
          </button>
          {recovery.message && (
            <p className={`cross-chain-sync__recovery-message cross-chain-sync__recovery-message--${recovery.state}`}>{recovery.message}</p>
          )}
        </div>
      )}

      <div className="cross-chain-sync__footer">
        <div className="cross-chain-sync__links">
          {links.sourceExplorerUrl && <a href={links.sourceExplorerUrl} target="_blank" rel="noreferrer">Source transaction</a>}
          {links.layerZeroScanUrl && <a href={links.layerZeroScanUrl} target="_blank" rel="noreferrer">Delivery details</a>}
          {links.canonicalExplorerUrl && <a href={links.canonicalExplorerUrl} target="_blank" rel="noreferrer">Arbitrum transaction</a>}
          {links.circleStatusUrl && cctpRequired && <a href={links.circleStatusUrl} target="_blank" rel="noreferrer">Circle status</a>}
          {complete && links.canonicalJobUrl && <a href={links.canonicalJobUrl}>Open job</a>}
        </div>
        <button type="button" onClick={refresh} aria-label="Refresh cross-chain status">
          <RefreshCw aria-hidden="true" size={14} />
          {checkedTime ? `Checked ${checkedTime}` : 'Check now'}
        </button>
      </div>
    </section>
  );
}
