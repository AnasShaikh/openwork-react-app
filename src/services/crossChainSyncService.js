const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || '';

const CROSS_CHAIN_SOURCES = {
  10: {
    name: 'Optimism',
    explorer: 'https://optimistic.etherscan.io/tx/',
    jobPrefix: '30111',
  },
  50: {
    name: 'XDC Network',
    explorer: 'https://xdcscan.com/tx/',
    jobPrefix: '30365',
  },
};

const TRACKED_ACTIONS = new Set(['postJob', 'startDirectContract', 'releasePayment']);
const VALID_JOB_ID = /^\d+-\d+$/;
const VALID_TX_HASH = /^0x[a-fA-F0-9]{64}$/;

export const CROSS_CHAIN_SYNC_POLL_MS = 8_000;

export function getCrossChainSource(tracking) {
  if (!tracking || !VALID_JOB_ID.test(tracking.jobId || '') || !TRACKED_ACTIONS.has(tracking.action)) return null;
  const sourceChainId = Number(tracking.sourceChainId);
  const source = CROSS_CHAIN_SOURCES[sourceChainId];
  if (!source || !tracking.jobId.startsWith(`${source.jobPrefix}-`)) return null;
  return { ...source, chainId: sourceChainId };
}

export function isCrossChainSyncCandidate(tracking) {
  return Boolean(
    getCrossChainSource(tracking)
    && tracking?.sourceReceiptConfirmed === true
    && VALID_TX_HASH.test(tracking?.sourceTxHash || ''),
  );
}

export function getCrossChainTrackingLinks(tracking, status = null) {
  const source = getCrossChainSource(tracking);
  const txHash = VALID_TX_HASH.test(tracking?.sourceTxHash || '') ? tracking.sourceTxHash : null;
  return {
    sourceExplorerUrl: status?.links?.sourceExplorerUrl || (source && txHash ? `${source.explorer}${txHash}` : null),
    layerZeroScanUrl: status?.links?.layerZeroScanUrl || (txHash ? `https://layerzeroscan.com/tx/${txHash}` : null),
    canonicalExplorerUrl: status?.links?.canonicalExplorerUrl || null,
    circleStatusUrl: status?.links?.circleStatusUrl || null,
    canonicalJobUrl: status?.links?.canonicalJobUrl || (VALID_JOB_ID.test(tracking?.jobId || '')
      ? `/job-details/${encodeURIComponent(tracking.jobId)}`
      : null),
  };
}

export function crossChainTrackingKey(tracking) {
  return [tracking?.action, tracking?.jobId, tracking?.sourceChainId, tracking?.sourceTxHash]
    .filter((value) => value !== null && value !== undefined)
    .join(':');
}

export async function readCrossChainActionStatus(tracking, dependencies = {}) {
  if (!isCrossChainSyncCandidate(tracking)) throw new Error('A supported confirmed cross-chain action is required');
  const params = new URLSearchParams({
    action: tracking.action,
    jobId: tracking.jobId,
    sourceChainId: String(tracking.sourceChainId),
    sourceTxHash: tracking.sourceTxHash,
  });
  if (tracking.targetDomain !== null && tracking.targetDomain !== undefined) {
    params.set('targetDomain', String(tracking.targetDomain));
  }
  if (tracking.baselineTotalPaidRaw !== null && tracking.baselineTotalPaidRaw !== undefined) {
    params.set('baselineTotalPaidRaw', String(tracking.baselineTotalPaidRaw));
  }

  const fetchImpl = dependencies.fetchImpl || fetch;
  const response = await fetchImpl(`${dependencies.backendUrl ?? BACKEND_URL}/api/oppy/cross-chain-status?${params}`);
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success || !payload?.status) {
    throw new Error(payload?.error || `Cross-chain status could not be loaded (HTTP ${response.status}).`);
  }
  return payload.status;
}

// Compatibility alias for older imports. Completion now comes from
// transaction-specific LayerZero, canonical-state and CCTP evidence.
export const readCanonicalJobSyncStatus = readCrossChainActionStatus;
