/**
 * Transaction reliability helpers for the money paths.
 *
 * Two problems this solves, both observed in production on Arbitrum job 42161-23:
 *
 * 1. web3's block timeout is counted in BLOCKS, and Arbitrum produces one every
 *    ~0.25s — so the default 50–80 blocks is 12–20 seconds. The countdown starts
 *    when send() is called, which is before the user has finished reading the
 *    MetaMask prompt. A perfectly healthy transaction therefore "times out"
 *    before it is even broadcast.
 *
 * 2. When that fires, web3 says the transaction "was not mined within N blocks"
 *    and "might still be mined". On a payment screen that is the worst possible
 *    message: the user cannot tell whether their money moved, whether to retry,
 *    or whether retrying would double-spend. The chain knows the answer, so ask
 *    it instead of guessing.
 */

// Approximate seconds per block, used to convert a wall-clock budget into the
// block count web3 actually counts in.
const SECONDS_PER_BLOCK = {
  42161: 0.25, // Arbitrum One
  10: 2,       // Optimism
  50: 2,       // XDC
  1: 12,       // Ethereum
  421614: 0.25,
  11155420: 2,
  11155111: 12,
  84532: 2,
};

const DEFAULT_SECONDS_PER_BLOCK = 2;

// How long a user should be able to sit on the MetaMask prompt and still have
// their transaction tracked. Deliberately generous: the cost of waiting too long
// is a slow spinner, while the cost of giving up too early is a payment screen
// that cannot tell the user what happened to their money.
const TRACKING_BUDGET_SECONDS = 600;

/** Blocks equivalent to the tracking budget on this chain. */
export function blockTimeoutForChain(chainId) {
  const perBlock = SECONDS_PER_BLOCK[Number(chainId)] ?? DEFAULT_SECONDS_PER_BLOCK;
  return Math.max(50, Math.ceil(TRACKING_BUDGET_SECONDS / perBlock));
}

/**
 * Applies chain-appropriate timeouts to a Web3 instance.
 *
 * Safe to call on any instance; unknown chains get a conservative default.
 */
export function applyTxTimeouts(web3, chainId) {
  const blocks = blockTimeoutForChain(chainId);
  try {
    web3.transactionBlockTimeout = blocks;
    web3.transactionPollingTimeout = TRACKING_BUDGET_SECONDS * 1000;
    // One confirmation is enough to consider a write settled here; waiting for
    // more just extends the spinner on a chain with sub-second blocks.
    web3.transactionConfirmationBlocks = 1;
  } catch {
    // Older or wrapped instances may not expose these as writable properties.
    // Losing the tuning is acceptable; failing the transaction is not.
  }
  return web3;
}

const TIMEOUT_PATTERN = /was not mined within|not mined within|TransactionBlockTimeout|transaction was not mined/i;

/** Pulls a 0x-prefixed 32-byte hash out of an error, wherever web3 put it. */
function extractTxHash(error) {
  const direct =
    error?.transactionHash ||
    error?.receipt?.transactionHash ||
    error?.data?.transactionHash;
  if (typeof direct === 'string' && /^0x[a-fA-F0-9]{64}$/.test(direct)) return direct;

  const text = `${error?.message || ''} ${JSON.stringify(error?.data ?? '')}`;
  const match = text.match(/0x[a-fA-F0-9]{64}/);
  return match ? match[0] : null;
}

/**
 * Asks the chain what actually happened after a send() rejection.
 *
 * @returns {Promise<{outcome:string, message:string, txHash:string|null, safeToRetry:boolean}>}
 *   outcome is one of: succeeded | reverted | pending | dropped | unknown
 */
export async function explainSendFailure(web3, error) {
  const txHash = extractTxHash(error);
  const isTimeout = TIMEOUT_PATTERN.test(String(error?.message || ''));

  if (!isTimeout || !txHash) {
    return {
      outcome: 'unknown',
      txHash,
      safeToRetry: true,
      message: error?.message || 'The transaction could not be submitted.',
    };
  }

  // A timeout is not an outcome. Resolve it against the chain.
  let receipt = null;
  try {
    receipt = await web3.eth.getTransactionReceipt(txHash);
  } catch {
    receipt = null;
  }

  if (receipt) {
    const ok = receipt.status === true || receipt.status === 1n || receipt.status === '0x1';
    return ok
      ? {
          outcome: 'succeeded',
          txHash,
          safeToRetry: false,
          message:
            'This actually succeeded — it just confirmed after the app stopped watching. Reload to see the updated state. Do not send it again.',
        }
      : {
          outcome: 'reverted',
          txHash,
          safeToRetry: true,
          message:
            'The transaction was mined but reverted, so nothing changed on-chain and no funds moved. Safe to try again.',
        };
  }

  let stillKnown = null;
  try {
    stillKnown = await web3.eth.getTransaction(txHash);
  } catch {
    stillKnown = null;
  }

  if (stillKnown) {
    return {
      outcome: 'pending',
      txHash,
      safeToRetry: false,
      message:
        'Your transaction is still pending on the network — it has not been dropped. Do NOT send it again, or you may pay twice. Wait for it to confirm, then reload.',
    };
  }

  return {
    outcome: 'dropped',
    txHash,
    safeToRetry: true,
    message:
      'The transaction never reached the network and nothing was charged or changed on-chain. It is safe to try again.',
  };
}

/**
 * Detects an earlier transaction stuck in the mempool.
 *
 * A gap between the pending and latest nonce means a previous transaction is
 * unconfirmed. Anything sent now queues behind it and will appear to hang, which
 * is the most likely way to reach the timeout above.
 */
export async function findStuckTransaction(web3, address) {
  try {
    const [latest, pending] = await Promise.all([
      web3.eth.getTransactionCount(address, 'latest'),
      web3.eth.getTransactionCount(address, 'pending'),
    ]);
    const gap = Number(pending) - Number(latest);
    if (gap > 0) {
      return {
        stuck: true,
        gap,
        message: `You have ${gap} unconfirmed transaction${gap === 1 ? '' : 's'} from this wallet. Anything sent now will queue behind ${gap === 1 ? 'it' : 'them'} and may appear to hang. Wait for ${gap === 1 ? 'it' : 'them'} to confirm, or speed ${gap === 1 ? 'it' : 'them'} up in your wallet, before continuing.`,
      };
    }
  } catch {
    // Not all providers answer the pending count. Never block a payment on a
    // diagnostic that failed.
  }
  return { stuck: false, gap: 0, message: null };
}

/** Rough native-currency cost of a write, for a pre-flight affordability check. */
export async function hasEnoughGas(web3, address, gasLimit) {
  try {
    const [balance, gasPrice] = await Promise.all([
      web3.eth.getBalance(address),
      web3.eth.getGasPrice(),
    ]);
    const needed = BigInt(gasLimit) * BigInt(gasPrice);
    return { ok: BigInt(balance) >= needed, balance: BigInt(balance), needed };
  } catch {
    return { ok: true, balance: null, needed: null };
  }
}
