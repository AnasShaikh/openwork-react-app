import Web3 from 'web3';

const HASH_PATTERN = /^0x[a-fA-F0-9]{64}$/;
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

function nowIso() {
  return new Date().toISOString();
}

function makeAttemptId() {
  try {
    return globalThis.crypto?.randomUUID?.() || `oppy-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  } catch {
    return `oppy-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

function nestedErrorMessage(error) {
  const candidates = [
    error?.shortMessage,
    error?.reason,
    error?.data?.message,
    error?.cause?.message,
    error?.message,
  ];
  return candidates.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
}

function errorCode(error) {
  return error?.code ?? error?.data?.code ?? error?.cause?.code ?? null;
}

function extractHash(value) {
  const direct = value?.txHash || value?.transactionHash || value?.receipt?.transactionHash;
  if (typeof direct === 'string' && HASH_PATTERN.test(direct)) return direct;
  const match = nestedErrorMessage(value).match(/0x[a-fA-F0-9]{64}/);
  return match?.[0] || null;
}

export function classifyTransactionError(error) {
  const message = nestedErrorMessage(error) || 'The wallet action did not complete.';
  const code = errorCode(error);
  const txHash = extractHash(error);

  if (code === 'NATIVE_BALANCE_TOO_LOW') {
    return {
      category: 'insufficient_gas',
      status: 'failed',
      safeToRetry: true,
      summary: 'The live native-token balance cannot cover this transaction.',
      nextStep: 'Top up the amount shown in the funding check, then retry. Nothing was submitted.',
      message,
      code,
      txHash,
    };
  }
  if (code === 'NATIVE_BALANCE_UNAVAILABLE') {
    return {
      category: 'rpc',
      status: 'failed',
      safeToRetry: true,
      summary: 'Oppy could not verify the live native-token balance.',
      nextStep: 'Nothing was submitted. Restore the network RPC connection, then retry.',
      message,
      code,
      txHash,
    };
  }

  if (code === 4001 || /user rejected|user denied|request rejected|cancelled by user/i.test(message)) {
    return {
      category: 'cancelled',
      status: 'cancelled',
      safeToRetry: true,
      summary: 'The wallet request was cancelled.',
      nextStep: 'Nothing was submitted. You can retry whenever you are ready.',
      message,
      code,
      txHash,
    };
  }
  if (/enable .*wallet|no evm wallet|no evm wallet provider|no wallet provider|wallet extension to continue|select and connect the wallet/i.test(message)) {
    return {
      category: 'wallet_missing',
      status: 'failed',
      safeToRetry: true,
      summary: 'No signing wallet was available.',
      nextStep: 'Nothing was submitted. Enable or connect an EVM wallet, then retry.',
      message,
      code,
      txHash,
    };
  }
  if (/insufficient funds|insufficient balance|exceeds balance/i.test(message)) {
    return {
      category: 'insufficient_gas',
      status: 'failed',
      safeToRetry: true,
      summary: 'The wallet could not cover the network fee.',
      nextStep: 'Add the network’s native gas token, then retry.',
      message,
      code,
      txHash,
    };
  }
  if (/allowance|approve|transfer amount exceeds balance|insufficient usdc/i.test(message)) {
    return {
      category: 'funding',
      status: 'failed',
      safeToRetry: true,
      summary: 'The USDC funding check did not pass.',
      nextStep: 'Check the USDC balance and approval in this wallet, then retry.',
      message,
      code,
      txHash,
    };
  }
  if (/rpc endpoint not found|rpc endpoint.*unavailable|failed to fetch|network error|disconnected|connection/i.test(message)) {
    return {
      category: 'rpc',
      status: 'unknown',
      safeToRetry: false,
      summary: 'The wallet or network connection stopped responding.',
      nextStep: 'Check the live status before retrying so Oppy can rule out an existing transaction.',
      message,
      code,
      txHash,
    };
  }
  if (/revert|execution reverted|transaction has been reverted/i.test(message)) {
    return {
      category: 'reverted',
      status: 'reverted',
      safeToRetry: true,
      summary: 'The network rejected this action.',
      nextStep: 'Review the reason below, correct the input or job state, then retry.',
      message,
      code,
      txHash,
    };
  }

  return {
    category: 'unknown',
    status: txHash ? 'pending' : 'unknown',
    safeToRetry: false,
    summary: txHash ? 'The transaction outcome is not confirmed yet.' : 'Oppy could not prove whether anything was submitted.',
    nextStep: 'Run a live status check before retrying.',
    message,
    code,
    txHash,
  };
}

export function createTransactionDiagnostic({ action, jobId, walletName, walletAddress, chainId, chainName, attemptNumber = 1 }) {
  const normalizedChainId = chainId !== null && chainId !== undefined && chainId !== '' && Number.isInteger(Number(chainId))
    ? Number(chainId)
    : null;
  const timestamp = nowIso();
  return {
    attemptId: makeAttemptId(),
    attemptNumber,
    action: String(action || 'transaction').slice(0, 40),
    jobId: typeof jobId === 'string' && /^\d+-\d+$/.test(jobId) ? jobId : null,
    walletName: String(walletName || 'Browser wallet').slice(0, 80),
    walletAddress: ADDRESS_PATTERN.test(walletAddress || '') ? walletAddress : null,
    chainId: normalizedChainId,
    chainName: chainName || (chainId ? `Chain ${chainId}` : 'Unknown network'),
    phase: 'preparing',
    step: 'action',
    status: 'preparing',
    summary: 'Oppy is preparing the action.',
    nextStep: 'Keep this chat open while the checks finish.',
    txHash: null,
    approvalTxHash: null,
    safeToRetry: false,
    startedAt: timestamp,
    updatedAt: timestamp,
    broadcastAt: null,
    notFoundChecks: 0,
    checks: {},
    error: null,
  };
}

export function updateTransactionDiagnostic(current, update = {}) {
  if (!current) return current;
  const next = { ...current, updatedAt: nowIso() };
  const phase = update.phase || next.phase;
  const step = update.step || next.step || 'action';
  const hash = extractHash(update);
  next.phase = phase;
  next.step = step;

  if (update.nativeFunding && typeof update.nativeFunding === 'object') {
    const funding = update.nativeFunding;
    const digits = (value) => (typeof value === 'string' && /^\d+$/.test(value) ? value : null);
    next.checks = {
      ...(next.checks || {}),
      nativeBalanceWei: digits(funding.balanceWei),
      nativeRequiredWei: digits(funding.requiredWei),
      nativeValueWei: digits(funding.nativeValueWei),
      nativeGasCostWei: digits(funding.gasCostWei),
      nativeShortfallWei: digits(funding.shortfallWei),
      nativeSymbol: typeof funding.symbol === 'string' ? funding.symbol.slice(0, 16) : null,
      nativeFundingSufficient: funding.sufficient === true,
      nativeFundingGasIncluded: funding.gasIncluded === true,
      nativeFundingCheckedAt: typeof funding.checkedAt === 'string' ? funding.checkedAt.slice(0, 40) : nowIso(),
    };
  }

  if (hash) {
    if (step === 'approval') next.approvalTxHash = hash;
    else next.txHash = hash;
  }

  if (phase === 'funding') {
    next.status = 'preparing';
    next.safeToRetry = false;
    next.summary = next.checks?.nativeFundingSufficient
      ? 'The live native-token balance covers the quoted transaction.'
      : 'The live native-token balance is too low for the quoted transaction.';
    next.nextStep = next.checks?.nativeFundingSufficient
      ? 'Oppy is continuing with the wallet request.'
      : 'Top up the shortfall shown below. No transaction was submitted.';
  } else if (phase === 'wallet') {
    next.status = 'wallet';
    next.safeToRetry = false;
    next.summary = step === 'approval' ? 'Your wallet is waiting for USDC approval.' : 'Your wallet is waiting for confirmation.';
    next.nextStep = 'Open the selected wallet and approve or reject its pending request.';
  } else if (phase === 'broadcast') {
    next.status = 'pending';
    next.safeToRetry = false;
    next.broadcastAt = next.broadcastAt || nowIso();
    next.summary = step === 'approval' ? 'The USDC approval was submitted.' : 'The transaction was submitted.';
    next.nextStep = 'Oppy is checking the network. Do not submit a duplicate.';
  } else if (phase === 'confirmed') {
    if (step === 'approval') {
      next.status = 'preparing';
      next.summary = 'USDC approval confirmed.';
      next.nextStep = 'The OpenWork action comes next in your wallet.';
    } else {
      next.status = 'confirmed';
      next.safeToRetry = false;
      next.summary = 'Transaction confirmed on-chain.';
      next.nextStep = 'No retry is needed.';
    }
  } else if (phase === 'error') {
    const classified = classifyTransactionError(update.error || update);
    next.status = update.outcome || classified.status;
    next.safeToRetry = typeof update.safeToRetry === 'boolean' ? update.safeToRetry : classified.safeToRetry;
    next.summary = update.summary || classified.summary;
    next.nextStep = update.nextStep || classified.nextStep;
    next.error = {
      category: update.category || classified.category,
      code: classified.code,
      message: String(update.rawMessage || classified.message || update.message || '').slice(0, 500),
    };
    if (classified.txHash && !next.txHash) next.txHash = classified.txHash;
  }

  if (update.message) next.lastMessage = String(update.message).slice(0, 500);
  return next;
}

function receiptSucceeded(receipt) {
  return receipt?.status === true || receipt?.status === 1n || receipt?.status === 1 || receipt?.status === '0x1';
}

async function inspectWallet(walletProvider, attempt) {
  const checks = {};
  if (!walletProvider?.request) return { walletReachable: false };
  try {
    const [accounts, chainHex] = await Promise.all([
      walletProvider.request({ method: 'eth_accounts' }),
      walletProvider.request({ method: 'eth_chainId' }),
    ]);
    const selected = accounts?.[0] || null;
    checks.walletReachable = true;
    checks.walletChainId = Number.parseInt(chainHex, 16);
    checks.accountMatches = !attempt.walletAddress || selected?.toLowerCase() === attempt.walletAddress.toLowerCase();
    checks.walletConnected = Boolean(selected);
  } catch (error) {
    checks.walletReachable = false;
    checks.walletError = nestedErrorMessage(error).slice(0, 180);
  }
  return checks;
}

/**
 * Performs read-only checks only. It never invokes eth_sendTransaction,
 * requests a signature, switches networks, or changes wallet state.
 */
export async function inspectTransactionDiagnostic(attempt, { walletProvider, rpcUrl, web3Factory } = {}) {
  if (!attempt) return null;
  const checkedAt = nowIso();
  const checks = {
    ...(attempt.checks || {}),
    ...(await inspectWallet(walletProvider, attempt)),
    checkedAt,
  };
  let next = { ...attempt, checks, updatedAt: checkedAt };
  const hasObservedHash = Boolean(attempt.txHash || attempt.approvalTxHash);
  if (attempt.safeToRetry && !hasObservedHash && ['cancelled', 'failed', 'reverted'].includes(attempt.status)) {
    return next;
  }
  if (!rpcUrl) {
    return {
      ...next,
      status: 'unknown',
      safeToRetry: false,
      summary: 'No read-only RPC is configured for this network.',
      nextStep: 'Verify the selected network before retrying.',
    };
  }

  try {
    const web3 = web3Factory ? web3Factory(rpcUrl) : new Web3(rpcUrl);
    const [blockNumber, balance, latestNonce, pendingNonce] = await Promise.all([
      web3.eth.getBlockNumber(),
      attempt.walletAddress ? web3.eth.getBalance(attempt.walletAddress) : null,
      attempt.walletAddress ? web3.eth.getTransactionCount(attempt.walletAddress, 'latest') : null,
      attempt.walletAddress ? web3.eth.getTransactionCount(attempt.walletAddress, 'pending') : null,
    ]);
    checks.rpcReachable = true;
    checks.blockNumber = Number(blockNumber);
    checks.nativeBalanceWei = balance === null ? null : String(balance);
    checks.latestNonce = latestNonce === null ? null : Number(latestNonce);
    checks.pendingNonce = pendingNonce === null ? null : Number(pendingNonce);
    checks.pendingNonceGap = latestNonce === null || pendingNonce === null ? null : Number(pendingNonce) - Number(latestNonce);

    const lookupHash = attempt.txHash || (attempt.step === 'approval' ? attempt.approvalTxHash : null);
    if (lookupHash) {
      const [receipt, transaction] = await Promise.all([
        web3.eth.getTransactionReceipt(lookupHash).catch(() => null),
        web3.eth.getTransaction(lookupHash).catch(() => null),
      ]);
      if (receipt) {
        if (receiptSucceeded(receipt)) {
          return {
            ...next,
            checks,
            phase: 'confirmed',
            status: attempt.step === 'approval' && !attempt.txHash ? 'preparing' : 'confirmed',
            safeToRetry: false,
            summary: attempt.step === 'approval' && !attempt.txHash
              ? 'The USDC approval is confirmed.'
              : 'The transaction is confirmed on-chain.',
            nextStep: attempt.step === 'approval' && !attempt.txHash
              ? 'Return to the wallet request for the OpenWork action.'
              : 'No retry is needed.',
            notFoundChecks: 0,
          };
        }
        return {
          ...next,
          checks,
          phase: 'error',
          status: 'reverted',
          safeToRetry: true,
          summary: 'The transaction was mined but reverted.',
          nextStep: 'Nothing changed on-chain. Review the reason, then retry.',
          notFoundChecks: 0,
        };
      }
      if (transaction) {
        return {
          ...next,
          checks,
          status: 'pending',
          safeToRetry: false,
          summary: 'The network still has this transaction pending.',
          nextStep: checks.pendingNonceGap > 0
            ? `Your wallet has ${checks.pendingNonceGap} unconfirmed transaction${checks.pendingNonceGap === 1 ? '' : 's'}. Wait or use the wallet’s speed-up option.`
            : 'Wait for confirmation. Do not submit a duplicate.',
          notFoundChecks: 0,
        };
      }

      const notFoundChecks = Number(attempt.notFoundChecks || 0) + 1;
      const broadcastAge = attempt.broadcastAt ? Date.now() - Date.parse(attempt.broadcastAt) : 0;
      const definitelyDropped = notFoundChecks >= 3 && broadcastAge >= 30_000;
      return {
        ...next,
        checks,
        phase: definitelyDropped ? 'error' : next.phase,
        status: definitelyDropped ? 'dropped' : 'unknown',
        safeToRetry: definitelyDropped,
        summary: definitelyDropped
          ? 'The network did not receive this transaction.'
          : 'The transaction is not visible on the network yet.',
        nextStep: definitelyDropped
          ? 'Nothing was mined. It is safe to retry.'
          : 'Oppy will check again. Do not retry yet.',
        notFoundChecks,
      };
    }

    if (attempt.phase === 'wallet') {
      return {
        ...next,
        checks,
        status: 'wallet',
        safeToRetry: false,
        summary: checks.walletConnected
          ? `No transaction has been broadcast; ${attempt.walletName} is still the active signing boundary.`
          : 'The selected wallet is no longer connected.',
        nextStep: checks.walletConnected
          ? 'Open the wallet’s pending requests and approve or reject this request.'
          : 'Reconnect the selected wallet before continuing.',
      };
    }

    return {
      ...next,
      checks,
      safeToRetry: next.status === 'cancelled' || next.status === 'reverted' || next.status === 'dropped',
    };
  } catch (error) {
    checks.rpcReachable = false;
    checks.rpcError = nestedErrorMessage(error).slice(0, 180);
    return {
      ...next,
      checks,
      status: 'unknown',
      safeToRetry: false,
      summary: 'Oppy could not reach the read-only network endpoint.',
      nextStep: 'Wait a moment and check again before retrying.',
    };
  }
}

export function diagnosticTechnicalRows(diagnostic) {
  if (!diagnostic) return [];
  const rows = [
    ['Attempt', `${diagnostic.attemptNumber || 1} · ${diagnostic.attemptId}`],
    ['Action', diagnostic.action],
    ['Step', diagnostic.step],
    ['Wallet', diagnostic.walletName],
    ['Network', `${diagnostic.chainName}${diagnostic.chainId ? ` (${diagnostic.chainId})` : ''}`],
    ['State', `${diagnostic.phase} · ${diagnostic.status}`],
  ];
  if (diagnostic.checks?.nativeBalanceWei) rows.push(['Native balance (wei)', diagnostic.checks.nativeBalanceWei]);
  if (diagnostic.checks?.nativeRequiredWei) rows.push(['Native required (wei)', diagnostic.checks.nativeRequiredWei]);
  if (diagnostic.checks?.nativeShortfallWei && diagnostic.checks.nativeShortfallWei !== '0') {
    rows.push(['Native shortfall (wei)', diagnostic.checks.nativeShortfallWei]);
  }
  if (diagnostic.txHash) rows.push(['Transaction', diagnostic.txHash]);
  if (diagnostic.approvalTxHash) rows.push(['Approval', diagnostic.approvalTxHash]);
  if (diagnostic.checks?.blockNumber !== undefined) rows.push(['Latest block', String(diagnostic.checks.blockNumber)]);
  if (diagnostic.checks?.pendingNonceGap !== undefined && diagnostic.checks.pendingNonceGap !== null) {
    rows.push(['Nonce queue', String(diagnostic.checks.pendingNonceGap)]);
  }
  if (diagnostic.checks?.rpcReachable !== undefined) rows.push(['Read-only RPC', diagnostic.checks.rpcReachable ? 'Reachable' : 'Unavailable']);
  if (diagnostic.checks?.walletReachable !== undefined) rows.push(['Wallet RPC', diagnostic.checks.walletReachable ? 'Reachable' : 'Unavailable']);
  if (diagnostic.error?.code !== null && diagnostic.error?.code !== undefined) rows.push(['Error code', String(diagnostic.error.code)]);
  if (diagnostic.error?.message) rows.push(['Wallet detail', diagnostic.error.message]);
  if (diagnostic.checks?.checkedAt) rows.push(['Checked', diagnostic.checks.checkedAt]);
  return rows.filter(([, value]) => value !== null && value !== undefined && value !== '');
}
