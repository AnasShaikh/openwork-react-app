/**
 * Wallet-signature headers for IPFS uploads.
 *
 * Uploads are pinned permanently on a node with a fixed storage ceiling, so they
 * need an identity to charge a quota against. This signs a short-lived message
 * with the connected wallet; the backend recovers the address and meters per
 * address rather than per IP, which is free to rotate.
 *
 * Deliberately degrades to no headers when a wallet is unavailable. Enforcement
 * lives on the backend behind IPFS_REQUIRE_SIGNATURE, so an unmigrated or
 * wallet-less caller keeps working until that flag is turned on.
 */

// The backend accepts a signature for five minutes. Re-use ours for four, so a
// cached header never arrives just after expiring.
const REUSE_WINDOW_MS = 4 * 60 * 1000;
const CACHE_KEY = 'openwork.uploadAuth';

/** Must match buildAuthMessage in backend/middleware/wallet-auth.js exactly. */
function buildAuthMessage(address, timestamp) {
  return [
    'OpenWork upload authorization',
    `address: ${address.toLowerCase()}`,
    `timestamp: ${timestamp}`,
  ].join('\n');
}

function readCache(address) {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached.address !== address.toLowerCase()) return null;
    if (Date.now() - cached.timestamp > REUSE_WINDOW_MS) return null;
    return cached;
  } catch {
    return null;
  }
}

function writeCache(entry) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Private browsing or a full quota. Signing again each time still works.
  }
}

async function connectedAddress() {
  if (!window.ethereum) return null;
  try {
    // eth_accounts does not prompt. If the user has not connected, we get an
    // empty list and skip signing rather than interrupting them with a popup.
    const accounts = await window.ethereum.request({ method: 'eth_accounts' });
    return accounts?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<Record<string,string>>} headers to merge into an upload
 *   request, or an empty object when no wallet is connected.
 */
export async function uploadAuthHeaders() {
  const address = await connectedAddress();
  if (!address) return {};

  const cached = readCache(address);
  if (cached) {
    return {
      'x-wallet-address': cached.address,
      'x-wallet-timestamp': String(cached.timestamp),
      'x-wallet-signature': cached.signature,
    };
  }

  const timestamp = Date.now();
  let signature;
  try {
    signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [buildAuthMessage(address, timestamp), address],
    });
  } catch (error) {
    // User declined, or the wallet cannot sign. Upload unattributed rather than
    // blocking; the backend decides whether that is acceptable.
    console.warn('Upload authorization was not signed:', error?.message || error);
    return {};
  }

  writeCache({ address: address.toLowerCase(), timestamp, signature });

  return {
    'x-wallet-address': address.toLowerCase(),
    'x-wallet-timestamp': String(timestamp),
    'x-wallet-signature': signature,
  };
}

/** Clears the cached signature. Call when the wallet account changes. */
export function clearUploadAuth() {
  try {
    sessionStorage.removeItem(CACHE_KEY);
  } catch {
    // Nothing to do.
  }
}
