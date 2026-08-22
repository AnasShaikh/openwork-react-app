const SELECTED_WALLET_KEY = 'ow_selected_wallet_provider';

const registry = [];
const subscribers = new Set();
let discoveryStarted = false;

function inferredWalletInfo(provider) {
  if (provider?.isBraveWallet) return { id: 'com.brave.wallet', name: 'Brave Wallet' };
  if (provider?.isRabby) return { id: 'io.rabby', name: 'Rabby Wallet' };
  if (provider?.isCoinbaseWallet) return { id: 'com.coinbase.wallet', name: 'Coinbase Wallet' };
  if (provider?.isMetaMask) return { id: 'io.metamask', name: 'MetaMask' };
  return { id: 'injected-wallet', name: 'Browser wallet' };
}

function notifySubscribers() {
  const wallets = registry.map((wallet) => ({ ...wallet }));
  subscribers.forEach((subscriber) => subscriber(wallets));
}

function registerProvider(provider, info = {}) {
  if (!provider?.request) return false;

  const existing = registry.find((wallet) => wallet.provider === provider);
  const inferred = inferredWalletInfo(provider);
  const next = {
    id: info.rdns || info.uuid || inferred.id,
    name: info.name || inferred.name,
    icon: info.icon || '',
    provider,
  };

  if (existing) {
    const changed = existing.id !== next.id || existing.name !== next.name || existing.icon !== next.icon;
    Object.assign(existing, next);
    if (changed) notifySubscribers();
    return changed;
  }

  // A legacy provider and its EIP-6963 announcement can arrive as different
  // wrapper objects. Keep both only when they really have different identities.
  const sameIdentity = registry.find((wallet) => wallet.id === next.id);
  if (sameIdentity) {
    if (!info.rdns && !info.uuid) return false;
    const changed = sameIdentity.provider !== next.provider
      || sameIdentity.name !== next.name
      || sameIdentity.icon !== next.icon;
    Object.assign(sameIdentity, next);
    if (changed) notifySubscribers();
    return changed;
  }

  registry.push(next);
  notifySubscribers();
  return true;
}

function startDiscovery() {
  if (typeof window === 'undefined') return;

  if (!discoveryStarted) {
    discoveryStarted = true;
    window.addEventListener('eip6963:announceProvider', (event) => {
      registerProvider(event?.detail?.provider, event?.detail?.info);
    });
    window.addEventListener('ethereum#initialized', () => {
      const injected = window.ethereum;
      const providers = Array.isArray(injected?.providers) ? injected.providers : [];
      providers.forEach((provider) => registerProvider(provider));
      registerProvider(injected);
    });
  }

  const injected = window.ethereum;
  const legacyProviders = Array.isArray(injected?.providers) ? injected.providers : [];
  legacyProviders.forEach((provider) => registerProvider(provider));
  registerProvider(injected);
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}

export function getInjectedWallets() {
  startDiscovery();
  return registry.map((wallet) => ({ ...wallet }));
}

export async function discoverInjectedWallets(waitMs = 100) {
  startDiscovery();
  if (typeof window === 'undefined') return [];
  if (waitMs > 0) await new Promise((resolve) => window.setTimeout(resolve, waitMs));
  return getInjectedWallets();
}

export function subscribeInjectedWallets(subscriber) {
  subscribers.add(subscriber);
  startDiscovery();
  return () => subscribers.delete(subscriber);
}

export function getPreferredInjectedWallet(wallets = getInjectedWallets()) {
  if (!wallets.length) return null;

  let storedId = '';
  try {
    storedId = window.localStorage.getItem(SELECTED_WALLET_KEY) || '';
  } catch {
    // Storage can be disabled without disabling wallet use.
  }

  const remembered = wallets.find((wallet) => wallet.id === storedId);
  if (remembered) return remembered;

  // Never let extension injection order choose a signer. A single wallet is
  // unambiguous; two or more require one explicit user choice.
  return wallets.length === 1 ? wallets[0] : null;
}

export function rememberInjectedWallet(walletId) {
  try {
    if (walletId) window.localStorage.setItem(SELECTED_WALLET_KEY, walletId);
    else window.localStorage.removeItem(SELECTED_WALLET_KEY);
  } catch {
    // Selection remains valid for this page even if storage is unavailable.
  }
}

export function walletRpcErrorMessage(error, walletName, chainName) {
  const raw = String(error?.message || '');
  if (!/rpc endpoint not found|rpc.*unavailable|failed to fetch|network error|internal json-rpc/i.test(raw)) {
    return null;
  }

  return `${walletName || 'The selected wallet'} could not reach ${chainName || 'this network'}. `
    + 'Select the wallet you intend to use below, then retry. No transaction was submitted.';
}
