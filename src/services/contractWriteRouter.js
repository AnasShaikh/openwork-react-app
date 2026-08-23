/**
 * Central selector router for write-capable OpenWork contracts.
 *
 * Arbitrum's frontend adapters are direct contracts: they do not accept
 * LayerZero options and they are non-payable. Other local chains use the
 * cross-chain LOWJC/AthenaClient selectors and append LayerZero options.
 * Keeping the selector decision here prevents individual pages from mixing
 * the two incompatible interfaces.
 */

export const WRITE_MODES = Object.freeze({
  DIRECT: "direct",
  CROSS_CHAIN: "cross_chain",
});

const PUBLIC_RPC_FALLBACKS = Object.freeze({
  10: ['https://mainnet.optimism.io'],
  50: ['https://rpc.xinfin.network', 'https://erpc.xinfin.network'],
  42161: ['https://arb1.arbitrum.io/rpc'],
});

export const LOWJC_OPERATIONS = Object.freeze({
  POST_JOB: "postJob",
  APPLY_TO_JOB: "applyToJob",
  START_DIRECT_CONTRACT: "startDirectContract",
  START_JOB: "startJob",
  SUBMIT_WORK: "submitWork",
  RELEASE_PAYMENT: "releasePayment",
  LOCK_NEXT_MILESTONE: "lockNextMilestone",
  RELEASE_AND_LOCK_NEXT: "releaseAndLockNext",
  CREATE_PROFILE: "createProfile",
  UPDATE_PROFILE: "updateProfile",
  ADD_PORTFOLIO: "addPortfolio",
  UPDATE_PORTFOLIO: "updatePortfolioItem",
  REMOVE_PORTFOLIO: "removePortfolioItem",
  RATE: "rate",
});

export const ATHENA_OPERATIONS = Object.freeze({
  RAISE_DISPUTE: "raiseDispute",
  SUBMIT_SKILL_VERIFICATION: "submitSkillVerification",
  ASK_ATHENA: "askAthena",
});

const lowjcRoutes = Object.freeze({
  [LOWJC_OPERATIONS.POST_JOB]: {
    direct: { method: "postJob", argCount: 3, signature: "postJob(string,string[],uint256[])" },
    cross_chain: { method: "postJob", argCount: 3, appendOptions: true, signature: "postJob(string,string[],uint256[],bytes)" },
  },
  [LOWJC_OPERATIONS.APPLY_TO_JOB]: {
    direct: { method: "applyToJob", argCount: 5, signature: "applyToJob(string,string,string[],uint256[],uint32)" },
    cross_chain: { method: "applyToJob", argCount: 5, appendOptions: true, signature: "applyToJob(string,string,string[],uint256[],uint32,bytes)" },
  },
  [LOWJC_OPERATIONS.START_DIRECT_CONTRACT]: {
    direct: { method: "startDirectContract", argCount: 5, signature: "startDirectContract(address,string,string[],uint256[],uint32)" },
    cross_chain: { method: "startDirectContract", argCount: 5, appendOptions: true, signature: "startDirectContract(address,string,string[],uint256[],uint32,bytes)" },
  },
  [LOWJC_OPERATIONS.START_JOB]: {
    direct: { method: "startJob", argCount: 3, signature: "startJob(string,uint256,bool)" },
    cross_chain: { method: "startJob", argCount: 3, appendOptions: true, signature: "startJob(string,uint256,bool,bytes)" },
  },
  [LOWJC_OPERATIONS.SUBMIT_WORK]: {
    direct: { method: "submitWork", argCount: 2, signature: "submitWork(string,string)" },
    cross_chain: { method: "submitWork", argCount: 2, appendOptions: true, signature: "submitWork(string,string,bytes)" },
  },
  [LOWJC_OPERATIONS.RELEASE_PAYMENT]: {
    direct: { method: "releasePayment", argCount: 1, signature: "releasePayment(string)" },
    cross_chain: { method: "releasePaymentCrossChain", argCount: 3, appendOptions: true, signature: "releasePaymentCrossChain(string,uint32,address,bytes)" },
  },
  [LOWJC_OPERATIONS.LOCK_NEXT_MILESTONE]: {
    direct: { method: "lockNextMilestone", argCount: 1, signature: "lockNextMilestone(string)" },
    cross_chain: { method: "lockNextMilestone", argCount: 1, appendOptions: true, signature: "lockNextMilestone(string,bytes)" },
  },
  [LOWJC_OPERATIONS.RELEASE_AND_LOCK_NEXT]: {
    direct: { method: "releaseAndLockNext", argCount: 1, signature: "releaseAndLockNext(string)" },
    cross_chain: { method: "releaseAndLockNext", argCount: 1, appendOptions: true, signature: "releaseAndLockNext(string,bytes)" },
  },
  [LOWJC_OPERATIONS.CREATE_PROFILE]: {
    direct: { method: "createProfile", argCount: 2, signature: "createProfile(string,address)" },
    cross_chain: { method: "createProfile", argCount: 2, appendOptions: true, signature: "createProfile(string,address,bytes)" },
  },
  [LOWJC_OPERATIONS.UPDATE_PROFILE]: {
    direct: { method: "updateProfile", argCount: 1, signature: "updateProfile(string)" },
    cross_chain: { method: "updateProfile", argCount: 1, appendOptions: true, signature: "updateProfile(string,bytes)" },
  },
  [LOWJC_OPERATIONS.ADD_PORTFOLIO]: {
    direct: { method: "addPortfolio", argCount: 1, signature: "addPortfolio(string)" },
    cross_chain: { method: "addPortfolio", argCount: 1, appendOptions: true, signature: "addPortfolio(string,bytes)" },
  },
  [LOWJC_OPERATIONS.UPDATE_PORTFOLIO]: {
    direct: { method: "updatePortfolioItem", argCount: 2, signature: "updatePortfolioItem(uint256,string)" },
    cross_chain: { method: "updatePortfolioItem", argCount: 2, appendOptions: true, signature: "updatePortfolioItem(uint256,string,bytes)" },
  },
  [LOWJC_OPERATIONS.REMOVE_PORTFOLIO]: {
    direct: { method: "removePortfolioItem", argCount: 1, signature: "removePortfolioItem(uint256)" },
    cross_chain: { method: "removePortfolioItem", argCount: 1, appendOptions: true, signature: "removePortfolioItem(uint256,bytes)" },
  },
  [LOWJC_OPERATIONS.RATE]: {
    direct: { method: "rate", argCount: 3, signature: "rate(string,address,uint256)" },
    cross_chain: { method: "rate", argCount: 3, appendOptions: true, signature: "rate(string,address,uint256,bytes)" },
  },
});

const athenaRoutes = Object.freeze({
  [ATHENA_OPERATIONS.RAISE_DISPUTE]: {
    direct: { method: "raiseDispute", argCount: 5, signature: "raiseDispute(string,string,string,uint256,uint256)" },
    cross_chain: { method: "raiseDispute", argCount: 5, appendOptions: true, signature: "raiseDispute(string,string,string,uint256,uint256,bytes)" },
  },
  [ATHENA_OPERATIONS.SUBMIT_SKILL_VERIFICATION]: {
    direct: { method: "submitSkillVerification", argCount: 3, signature: "submitSkillVerification(string,uint256,string)" },
    cross_chain: { method: "submitSkillVerification", argCount: 3, appendOptions: true, signature: "submitSkillVerification(string,uint256,string,bytes)" },
  },
  [ATHENA_OPERATIONS.ASK_ATHENA]: {
    direct: { method: "askAthena", argCount: 4, signature: "askAthena(string,string,string,uint256)" },
    cross_chain: { method: "askAthena", argCount: 4, appendOptions: true, signature: "askAthena(string,string,string,uint256,bytes)" },
  },
});

export function getWriteMode(chainConfig) {
  return chainConfig?.requiresLzFee === false
    ? WRITE_MODES.DIRECT
    : WRITE_MODES.CROSS_CHAIN;
}

export function isDirectWrite(chainConfig) {
  return getWriteMode(chainConfig) === WRITE_MODES.DIRECT;
}

function getRoute(routes, chainConfig, operation) {
  const operationRoutes = routes[operation];
  if (!operationRoutes) throw new Error(`Unsupported contract operation: ${operation}`);
  return operationRoutes[getWriteMode(chainConfig)];
}

function createWrite(contract, routes, chainConfig, operation, args, nativeOptions) {
  const route = getRoute(routes, chainConfig, operation);
  if (args.length < route.argCount) {
    throw new Error(`${operation} requires ${route.argCount} arguments, received ${args.length}`);
  }

  const routedArgs = args.slice(0, route.argCount);
  if (route.appendOptions) {
    if (!nativeOptions) throw new Error(`LayerZero options are required for ${operation}`);
    routedArgs.push(nativeOptions);
  }

  const method = contract?.methods?.[route.method];
  if (typeof method !== "function") {
    throw new Error(`Configured ABI does not expose ${route.signature}`);
  }
  return method(...routedArgs);
}

export function createLOWJCWrite(contract, chainConfig, operation, args, nativeOptions) {
  return createWrite(contract, lowjcRoutes, chainConfig, operation, args, nativeOptions);
}

export function createAthenaWrite(contract, chainConfig, operation, args, nativeOptions) {
  return createWrite(contract, athenaRoutes, chainConfig, operation, args, nativeOptions);
}

export function buildWriteSendOptions(chainConfig, { from, value, ...options }) {
  const sendOptions = { from, ...options };
  if (!isDirectWrite(chainConfig)) {
    if (value === undefined || value === null) {
      throw new Error("A LayerZero fee is required for cross-chain writes");
    }
    sendOptions.value = value.toString();
  }
  return sendOptions;
}

/**
 * Estimate gas for the exact routed call and add a buffer for small state
 * changes between estimation and mining. Fixed gas limits are especially
 * unsafe for milestone arrays because execution cost grows with their size.
 */
export async function buildEstimatedWriteSendOptions(
  method,
  chainConfig,
  options,
  {
    bufferBps = 2500,
    readNativeFunding,
    onNativeBalanceCheck,
  } = {}
) {
  if (typeof method?.estimateGas !== "function") {
    throw new Error("The configured contract method cannot estimate gas");
  }
  if (!Number.isInteger(bufferBps) || bufferBps < 0) {
    throw new Error("Gas estimate buffer must be a non-negative integer");
  }

  const sendOptions = buildWriteSendOptions(chainConfig, options);
  const { gas: _ignoredGas, ...estimateOptions } = sendOptions;
  const fundingSnapshot = await readNativeFundingSnapshot(
    chainConfig,
    sendOptions.from,
    { readNativeFunding },
  );
  const nativeValueWei = BigInt(sendOptions.value || 0);

  // Some RPCs reject eth_estimateGas when msg.value already exceeds the
  // sender's balance. Resolve that case ourselves first so the UI can explain
  // the exact shortfall and, critically, never opens a doomed wallet request.
  if (fundingSnapshot && fundingSnapshot.balanceWei < nativeValueWei) {
    const result = nativeFundingResult(chainConfig, fundingSnapshot, {
      nativeValueWei,
      gasCostWei: 0n,
      gasIncluded: false,
    });
    onNativeBalanceCheck?.(result);
    throw nativeFundingError(chainConfig, result);
  }

  const estimatedGas = BigInt(await method.estimateGas(estimateOptions));
  if (estimatedGas <= 0n) {
    throw new Error("Contract gas estimation returned an invalid value");
  }

  const basisPoints = 10000n;
  const bufferedGas = (
    estimatedGas * (basisPoints + BigInt(bufferBps)) + basisPoints - 1n
  ) / basisPoints;

  const withGas = { ...sendOptions, gas: bufferedGas.toString() };

  // Wallets reserve gasLimit multiplied by maxFeePerGas, and pad that ceiling to
  // a default in the low gwei range. On Arbitrum, where the base fee is about
  // 0.02 gwei, that reserves roughly a hundred times the real cost and the wallet
  // then refuses the transaction for insufficient funds against a balance that
  // could pay for it many times over. Deriving the ceiling from the chain's own
  // base fee fixes every caller that routes through here at once.
  //
  // Only applied when the caller has expressed no fee preference. Cross-chain
  // paths set an explicit legacy gasPrice and must not be overridden.
  const callerChoseFees =
    withGas.gasPrice !== undefined ||
    withGas.maxFeePerGas !== undefined ||
    withGas.maxPriorityFeePerGas !== undefined;

  const finalized = callerChoseFees
    ? withGas
    : { ...withGas, ...(await deriveFeeCeiling(chainConfig)) };

  if (fundingSnapshot) {
    const feePerGas = BigInt(
      finalized.maxFeePerGas
      || finalized.gasPrice
      || fundingSnapshot.gasPriceWei,
    );
    const result = nativeFundingResult(chainConfig, fundingSnapshot, {
      nativeValueWei,
      gasCostWei: bufferedGas * feePerGas,
      gasIncluded: true,
    });
    onNativeBalanceCheck?.(result);
    if (!result.sufficient) throw nativeFundingError(chainConfig, result);
  }

  return finalized;
}

function formatNativeWei(value, decimals = 18, precision = 6) {
  const amount = BigInt(value || 0);
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const fraction = (amount % base).toString().padStart(decimals, '0').slice(0, precision).replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function nativeFundingResult(chainConfig, snapshot, { nativeValueWei, gasCostWei, gasIncluded }) {
  const requiredWei = nativeValueWei + gasCostWei;
  const shortfallWei = requiredWei > snapshot.balanceWei
    ? requiredWei - snapshot.balanceWei
    : 0n;
  return {
    chainId: Number(chainConfig?.chainId) || null,
    chainName: chainConfig?.name || 'this network',
    symbol: chainConfig?.nativeCurrency?.symbol || 'native token',
    balanceWei: snapshot.balanceWei.toString(),
    requiredWei: requiredWei.toString(),
    nativeValueWei: nativeValueWei.toString(),
    gasCostWei: gasCostWei.toString(),
    shortfallWei: shortfallWei.toString(),
    sufficient: shortfallWei === 0n,
    gasIncluded,
    checkedAt: new Date().toISOString(),
  };
}

function nativeFundingError(chainConfig, result) {
  const symbol = result.symbol;
  const balance = formatNativeWei(result.balanceWei);
  const required = formatNativeWei(result.requiredWei);
  const shortfall = formatNativeWei(result.shortfallWei);
  const qualifier = result.gasIncluded ? 'including the quoted cross-chain value and buffered gas' : 'before gas';
  const error = new Error(
    `Not enough ${symbol} on ${chainConfig?.name || 'this network'}. `
    + `This action requires at least ${required} ${symbol} ${qualifier}; `
    + `the connected wallet has ${balance} ${symbol} and is short by at least ${shortfall} ${symbol}. `
    + 'No transaction was submitted.',
  );
  error.code = 'NATIVE_BALANCE_TOO_LOW';
  error.nativeFunding = result;
  return error;
}

/**
 * Read the sender's native balance and current gas price from the configured
 * read-only RPC. This deliberately does not use the injected wallet provider:
 * balance checks are public reads and must not depend on MetaMask middleware.
 *
 * A configured production RPC is fail-closed. If Oppy cannot verify funding,
 * it does not open a wallet request whose affordability is unknown.
 */
async function readNativeFundingSnapshot(chainConfig, address, dependencies = {}) {
  const rpcUrl = chainConfig?.rpcUrl;
  if (!rpcUrl || !address) return null;

  try {
    const read = dependencies.readNativeFunding || (async (url, owner) => {
      const { default: Web3 } = await import('web3');
      const web3 = new Web3(url);
      const [balanceWei, gasPriceWei] = await Promise.all([
        web3.eth.getBalance(owner),
        web3.eth.getGasPrice(),
      ]);
      return { balanceWei, gasPriceWei };
    });
    const rpcUrls = [
      rpcUrl,
      ...(PUBLIC_RPC_FALLBACKS[Number(chainConfig?.chainId)] || []),
    ].filter((value, index, all) => value && all.indexOf(value) === index);
    const timedRead = (url) => {
      let timer;
      const timeout = new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('Native balance read timed out')), 7000);
      });
      return Promise.race([read(url, address), timeout]).finally(() => clearTimeout(timer));
    };
    const snapshot = await Promise.any(rpcUrls.map(timedRead));
    const balanceWei = BigInt(snapshot?.balanceWei);
    const gasPriceWei = BigInt(snapshot?.gasPriceWei);
    if (balanceWei < 0n || gasPriceWei <= 0n) throw new Error('Invalid native funding response');
    return { balanceWei, gasPriceWei };
  } catch (cause) {
    const symbol = chainConfig?.nativeCurrency?.symbol || 'native-token';
    const error = new Error(
      `Oppy could not verify the live ${symbol} balance on ${chainConfig?.name || 'this network'}, `
      + 'so no wallet request was opened. Check the network RPC and try again.',
    );
    error.code = 'NATIVE_BALANCE_UNAVAILABLE';
    error.cause = cause;
    throw error;
  }
}

/**
 * Fee ceiling from the chain's live base fee, read through the configured RPC
 * rather than the wallet provider so wallet middleware stays out of the
 * preflight. Returns an empty object on a non-EIP-1559 chain or any failure, so
 * a diagnostic problem can never stop a transaction being sent.
 */
async function deriveFeeCeiling(chainConfig, dependencies = {}) {
  const rpcUrl = chainConfig?.rpcUrl;
  if (!rpcUrl) return {};

  try {
    const readBaseFee =
      dependencies.readBaseFee ||
      (async (url) => {
        const { default: Web3 } = await import("web3");
        const block = await new Web3(url).eth.getBlock("latest");
        return block?.baseFeePerGas;
      });

    const raw = await readBaseFee(rpcUrl);
    if (raw === undefined || raw === null) return {};

    const baseFee = BigInt(raw);
    if (baseFee <= 0n) return {};

    const headroomMultiplier = 5n;
    const floorWei = 10000000n; // 0.01 gwei, Arbitrum's practical minimum
    const ceiling = baseFee * headroomMultiplier;

    return {
      maxFeePerGas: (ceiling > floorWei ? ceiling : floorWei).toString(),
      // Arbitrum's sequencer orders by arrival rather than by tip, so a priority
      // fee buys nothing and only inflates what the wallet reserves.
      maxPriorityFeePerGas: "0",
    };
  } catch {
    return {};
  }
}

export { deriveFeeCeiling };

export function getLOWJCRoute(chainConfig, operation) {
  return { ...getRoute(lowjcRoutes, chainConfig, operation) };
}

export function getAthenaRoute(chainConfig, operation) {
  return { ...getRoute(athenaRoutes, chainConfig, operation) };
}
