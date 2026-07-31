import { keccak256 } from "web3-utils";

export const DIRECT_CONTRACT_JOB_EVENT_SIGNATURES = [
  "JobPosted(string,address)",
  "JobPosted(string,address,string)",
].map((signature) => keccak256(signature).toLowerCase());

const DIRECT_CONTRACT_PROGRESS_PREFIX = "openwork:direct-contract:";
const DIRECT_CONTRACT_PROGRESS_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function collectIndexedJobIdTopics(receipt) {
  const eventSignatures = new Set(DIRECT_CONTRACT_JOB_EVENT_SIGNATURES);
  const logs = Array.isArray(receipt?.logs) ? receipt.logs : [];

  return new Set(
    logs
      .filter((log) => (
        Array.isArray(log?.topics)
        && log.topics.length > 1
        && eventSignatures.has(String(log.topics[0]).toLowerCase())
      ))
      .map((log) => String(log.topics[1]).toLowerCase()),
  );
}

/**
 * Indexed Solidity strings are stored as hashes in receipt topics. Resolve the
 * actual job ID by matching those topics against the counter range that changed
 * while this transaction was pending.
 */
export async function resolveDirectContractJobId({
  receipt,
  contract,
  jobIdPrefix,
  counterBefore,
  maxCounterScan = 5000,
}) {
  const indexedJobIdTopics = collectIndexedJobIdTopics(receipt);
  const firstPossibleCounter = BigInt(counterBefore) + 1n;
  const firstPossibleJobId = `${jobIdPrefix}-${firstPossibleCounter}`;

  if (indexedJobIdTopics.has(keccak256(firstPossibleJobId).toLowerCase())) {
    return firstPossibleJobId;
  }

  let counterAfter;
  try {
    counterAfter = BigInt(await contract.methods.getJobCount().call());
  } catch {
    return null;
  }

  if (counterAfter < firstPossibleCounter) {
    return null;
  }

  if (indexedJobIdTopics.size === 0) {
    return counterAfter === firstPossibleCounter ? firstPossibleJobId : null;
  }

  const countersToScan = counterAfter - firstPossibleCounter + 1n;
  if (countersToScan > BigInt(maxCounterScan)) {
    return null;
  }

  for (
    let counter = firstPossibleCounter;
    counter <= counterAfter;
    counter += 1n
  ) {
    const candidate = `${jobIdPrefix}-${counter}`;
    if (indexedJobIdTopics.has(keccak256(candidate).toLowerCase())) {
      return candidate;
    }
  }

  return null;
}

function progressStorageKey(jobId) {
  return `${DIRECT_CONTRACT_PROGRESS_PREFIX}${jobId}`;
}

function defaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function saveDirectContractProgress(progress, storage = defaultStorage()) {
  if (
    !storage
    || !progress?.jobId
    || !progress?.sourceTxHash
    || !Number.isFinite(Number(progress?.createdAt))
  ) {
    return false;
  }

  try {
    storage.setItem(progressStorageKey(progress.jobId), JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}

export function loadDirectContractProgress(jobId, storage = defaultStorage(), now = Date.now()) {
  if (!storage || !jobId) {
    return null;
  }

  try {
    const key = progressStorageKey(jobId);
    const rawProgress = storage.getItem(key);
    if (!rawProgress) {
      return null;
    }

    const progress = JSON.parse(rawProgress);
    const age = Number(now) - Number(progress?.createdAt);
    const isValid = (
      progress?.jobId === jobId
      && typeof progress?.sourceTxHash === "string"
      && /^0x[a-fA-F0-9]{64}$/.test(progress.sourceTxHash)
      && Number.isFinite(age)
      && age >= 0
      && age <= DIRECT_CONTRACT_PROGRESS_MAX_AGE_MS
    );

    if (!isValid) {
      storage.removeItem(key);
      return null;
    }

    return progress;
  } catch {
    return null;
  }
}

export function clearDirectContractProgress(jobId, storage = defaultStorage()) {
  if (!storage || !jobId) {
    return false;
  }

  try {
    storage.removeItem(progressStorageKey(jobId));
    return true;
  } catch {
    return false;
  }
}
