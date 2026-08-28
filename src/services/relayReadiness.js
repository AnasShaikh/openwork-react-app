const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || '';
const CACHE_TTL_MS = 5000;
const cache = new Map();

function keyFor(input) {
  return [input.action, input.sourceChainId, input.targetDomain ?? 'none'].join(':');
}

export async function readRelayReadiness(input, dependencies = {}) {
  const key = keyFor(input);
  const cached = !dependencies.disableCache && cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;
  const fetchImpl = dependencies.fetchImpl || fetch;
  const response = await fetchImpl(`${dependencies.backendUrl ?? BACKEND_URL}/api/oppy/relay-readiness`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success || !payload?.readiness) {
    const error = new Error(payload?.error || `Automatic delivery preflight failed (HTTP ${response.status}).`);
    error.code = 'RELAYER_READINESS_UNAVAILABLE';
    throw error;
  }
  if (!dependencies.disableCache) cache.set(key, { at: Date.now(), value: payload.readiness });
  return payload.readiness;
}

export async function preflightRelay(input, onStatus, dependencies = {}) {
  const emit = typeof onStatus === 'function' ? onStatus : () => {};
  const readiness = await readRelayReadiness(input, dependencies);
  if (!readiness.required) return readiness;
  if (readiness.ready) {
    emit({ phase: 'preparing', message: `Automatic USDC delivery is ready on ${readiness.destination?.chainName}.` });
    return readiness;
  }
  if (readiness.recoverySupported) {
    emit({
      phase: 'preparing',
      message: `Automatic USDC delivery is unavailable on ${readiness.destination?.chainName || 'the destination chain'}. You may continue; Oppy will let you complete the final Circle step with your wallet.`,
      relayReadiness: readiness,
    });
    return readiness;
  }
  const error = new Error('Automatic USDC delivery is not ready. No safe recovery path is currently available.');
  error.code = 'RELAYER_NOT_READY';
  error.readiness = readiness;
  throw error;
}

export function clearRelayReadinessCache() {
  cache.clear();
}
