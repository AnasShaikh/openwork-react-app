import assert from "node:assert/strict";
import test from "node:test";
import { keccak256 } from "web3-utils";
import {
  clearDirectContractProgress,
  loadDirectContractProgress,
  resolveDirectContractJobId,
  saveDirectContractProgress,
} from "../src/utils/directContractReceipt.js";

const currentJobPostedSignature = keccak256("JobPosted(string,address,string)");
const legacyJobPostedSignature = keccak256("JobPosted(string,address)");

function fakeContract(counterAfter) {
  return {
    methods: {
      getJobCount: () => ({
        call: async () => String(counterAfter),
      }),
    },
  };
}

function fakeStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

test("direct-contract receipt resolves the indexed job ID", async () => {
  const jobId = "30365-42";
  const resolved = await resolveDirectContractJobId({
    receipt: {
      logs: [{
        topics: [currentJobPostedSignature, keccak256(jobId)],
      }],
    },
    contract: fakeContract(42),
    jobIdPrefix: 30365,
    counterBefore: 41,
  });

  assert.equal(resolved, jobId);
});

test("receipt resolution handles another transaction incrementing the counter", async () => {
  const jobId = "42161-103";
  const resolved = await resolveDirectContractJobId({
    receipt: {
      logs: [{
        topics: [legacyJobPostedSignature, keccak256(jobId)],
      }],
    },
    contract: fakeContract(104),
    jobIdPrefix: 42161,
    counterBefore: 100,
  });

  assert.equal(resolved, jobId);
});

test("counter fallback is accepted only for one unambiguous increment", async () => {
  const common = {
    receipt: { logs: [] },
    jobIdPrefix: 30365,
    counterBefore: 9,
  };

  assert.equal(
    await resolveDirectContractJobId({
      ...common,
      contract: fakeContract(10),
    }),
    "30365-10",
  );
  assert.equal(
    await resolveDirectContractJobId({
      ...common,
      contract: fakeContract(11),
    }),
    null,
  );
});

test("direct-contract progress survives reload and expires after 24 hours", () => {
  const storage = fakeStorage();
  const now = 1_800_000_000_000;
  const progress = {
    jobId: "30365-42",
    sourceTxHash: `0x${"a".repeat(64)}`,
    sourceChainId: 50,
    sourceDomain: 14,
    createdAt: now,
  };

  assert.equal(saveDirectContractProgress(progress, storage), true);
  assert.deepEqual(loadDirectContractProgress(progress.jobId, storage, now), progress);
  assert.equal(
    loadDirectContractProgress(progress.jobId, storage, now + (25 * 60 * 60 * 1000)),
    null,
  );

  saveDirectContractProgress(progress, storage);
  assert.equal(clearDirectContractProgress(progress.jobId, storage), true);
  assert.equal(loadDirectContractProgress(progress.jobId, storage, now), null);
});
