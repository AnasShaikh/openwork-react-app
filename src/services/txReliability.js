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

/**
 * Watches a pending transaction until it actually resolves.
 *
 * "Pending" is not a terminal state, and treating it as one strands the user:
 * observed in production, a release payment was correctly reported as pending,
 * was then dropped from the mempool, and nothing ever told the user — leaving a
 * "do not resend" warning on screen while retrying had in fact become safe.
 *
 * A transaction is only declared dropped once it has been missing from both the
 * mempool and the chain for several consecutive polls, because a node can briefly
 * fail to return a transaction it still holds.
 *
 * @param onUpdate called with the same shape explainSendFailure returns
 */
export async function watchPendingTransaction(web3, txHash, onUpdate, options = {}) {
  const { intervalMs = 4000, timeoutMs = 900000, missesBeforeDropped = 3 } = options;
  const deadline = Date.now() + timeoutMs;
  let consecutiveMisses = 0;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    let receipt = null;
    try {
      receipt = await web3.eth.getTransactionReceipt(txHash);
    } catch {
      receipt = null;
    }

    if (receipt) {
      const ok = receipt.status === true || receipt.status === 1n || receipt.status === '0x1';
      const verdict = ok
        ? {
            outcome: 'succeeded',
            txHash,
            safeToRetry: false,
            message: 'Confirmed on-chain. Reloading to show the updated state.',
          }
        : {
            outcome: 'reverted',
            txHash,
            safeToRetry: true,
            message:
              'The transaction was mined but reverted, so nothing changed on-chain and no funds moved. Safe to try again.',
          };
      onUpdate(verdict);
      return verdict;
    }

    let known = null;
    try {
      known = await web3.eth.getTransaction(txHash);
    } catch {
      known = null;
    }

    if (known) {
      consecutiveMisses = 0;
      continue;
    }

    consecutiveMisses += 1;
    if (consecutiveMisses >= missesBeforeDropped) {
      const verdict = {
        outcome: 'dropped',
        txHash,
        safeToRetry: true,
        message:
          'The transaction was dropped by the network without being mined. Nothing was charged and nothing changed on-chain. Safe to try again.',
      };
      onUpdate(verdict);
      return verdict;
    }
  }

  const verdict = {
    outcome: 'pending',
    txHash,
    safeToRetry: false,
    message:
      'Still unresolved after 15 minutes. Check the transaction in your wallet or a block explorer before sending another.',
  };
  onUpdate(verdict);
  return verdict;
}

/**
 * Confirms the network actually received a transaction the wallet claims to have
 * sent.
 *
 * A wallet can return a transaction hash and still fail to propagate it — seen on
 * job 42161-23, where the hash existed, the nonce never advanced and the network
 * never held the transaction. Waiting for `send()` to settle hides this for
 * minutes while the wallet retries internally, so check independently as soon as
 * a hash exists rather than after the send promise gives up.
 *
 * Resolves true if the network knows the transaction, false if it does not know
 * it within the window.
 */
export async function verifyBroadcast(web3, txHash, options = {}) {
  const { windowMs = 30000, intervalMs = 3000 } = options;
  const deadline = Date.now() + windowMs;

  while (Date.now() < deadline) {
    try {
      const known = await web3.eth.getTransaction(txHash);
      if (known) return true;
    } catch {
      // Treat a failed lookup as inconclusive and keep trying.
    }
    try {
      const receipt = await web3.eth.getTransactionReceipt(txHash);
      if (receipt) return true;
    } catch {
      // Same.
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  return false;
}

/**
 * Explicit EIP-1559 fee fields derived from the chain's live base fee.
 *
 * Left to itself, MetaMask pads maxFeePerGas to a default in the low gwei range.
 * On Arbitrum, where the base fee is around 0.02 gwei, that reserves roughly a
 * hundred times the real cost — and the wallet then refuses the transaction for
 * "insufficient funds" against a balance that could pay for it a hundred times
 * over. Observed on job 42161-23: a real cost of 0.0000099 ETH was rejected
 * against a 0.00107 ETH balance because the wallet wanted to reserve 0.000987.
 *
 * The multiplier gives headroom for the base fee rising between estimate and
 * inclusion. Returns an empty object on any failure, so callers fall back to the
 * wallet's own values rather than losing the ability to transact.
 */
export async function buildFeeOverrides(web3, options = {}) {
  const { multiplier = 5n, floorWei = 10000000n } = options; // floor 0.01 gwei
  try {
    const block = await web3.eth.getBlock('latest');
    const baseFee = block?.baseFeePerGas;
    if (baseFee === undefined || baseFee === null) return {};

    const base = BigInt(baseFee);
    if (base <= 0n) return {};

    const maxFeePerGas = base * multiplier > floorWei ? base * multiplier : floorWei;

    return {
      maxFeePerGas: maxFeePerGas.toString(),
      // Arbitrum's sequencer orders by arrival, not by tip, so a priority fee
      // buys nothing and only inflates the amount the wallet reserves.
      maxPriorityFeePerGas: '0',
    };
  } catch {
    return {};
  }
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
