import assert from 'node:assert/strict';
import test from 'node:test';

function provider(flags = {}) {
  return {
    ...flags,
    request: async ({ method }) => {
      if (method === 'eth_accounts') return [];
      if (method === 'eth_chainId') return '0x32';
      return null;
    },
  };
}

test('wallet discovery keeps Brave and MetaMask distinct and remembers the explicit choice', async () => {
  const brave = provider({ isBraveWallet: true });
  const metamask = provider({ isMetaMask: true });
  const coinbase = provider({ isCoinbaseWallet: true });
  const storage = new Map();
  const browserWindow = new EventTarget();
  browserWindow.ethereum = metamask;
  browserWindow.ethereum.providers = [metamask, brave];
  browserWindow.localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  browserWindow.setTimeout = setTimeout;
  browserWindow.addEventListener('eip6963:requestProvider', () => {
    const announcement = new Event('eip6963:announceProvider');
    announcement.detail = {
      info: { uuid: 'coinbase-test', name: 'Coinbase Wallet', rdns: 'com.coinbase.wallet' },
      provider: coinbase,
    };
    browserWindow.dispatchEvent(announcement);
  });
  globalThis.window = browserWindow;

  const service = await import(`../src/services/injectedWalletProviders.js?test=${Date.now()}`);
  const wallets = service.getInjectedWallets();
  assert.deepEqual(wallets.map((wallet) => wallet.name).sort(), ['Brave Wallet', 'Coinbase Wallet', 'MetaMask']);
  assert.equal(service.getPreferredInjectedWallet(wallets), null);

  service.rememberInjectedWallet('com.brave.wallet');
  assert.equal(service.getPreferredInjectedWallet(wallets).name, 'Brave Wallet');

  delete globalThis.window;
});

test('RPC failures explain the selected-wallet mismatch and confirm no submission', async () => {
  const service = await import('../src/services/injectedWalletProviders.js');
  const message = service.walletRpcErrorMessage(
    new Error('RPC endpoint not found or unavailable.'),
    'MetaMask',
    'XDC Network',
  );

  assert.match(message, /MetaMask could not reach XDC Network/);
  assert.match(message, /Select the wallet you intend to use/);
  assert.match(message, /No transaction was submitted/);
});
