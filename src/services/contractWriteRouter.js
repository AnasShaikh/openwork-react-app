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

export function getLOWJCRoute(chainConfig, operation) {
  return { ...getRoute(lowjcRoutes, chainConfig, operation) };
}

export function getAthenaRoute(chainConfig, operation) {
  return { ...getRoute(athenaRoutes, chainConfig, operation) };
}
