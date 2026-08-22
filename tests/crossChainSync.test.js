import assert from 'node:assert/strict';
import test from 'node:test';
import {
  crossChainTrackingKey,
  getCrossChainSource,
  getCrossChainTrackingLinks,
  isCrossChainSyncCandidate,
  readCrossChainActionStatus,
} from '../src/services/crossChainSyncService.js';

const txHash = `0x${'a'.repeat(64)}`;
const xdcRelease = {
  action: 'releasePayment',
  jobId: '30365-7',
  sourceChainId: 50,
  sourceTxHash: txHash,
  sourceReceiptConfirmed: true,
  targetDomain: 18,
  baselineTotalPaidRaw: '0',
};

test('only an action-scoped confirmed XDC transaction is a tracking candidate', () => {
  assert.equal(isCrossChainSyncCandidate(xdcRelease), true);
  assert.equal(getCrossChainSource(xdcRelease).name, 'XDC Network');
  assert.equal(isCrossChainSyncCandidate({ ...xdcRelease, action: 'submitWork' }), false);
  assert.equal(isCrossChainSyncCandidate({ ...xdcRelease, sourceTxHash: null }), false);
  assert.equal(isCrossChainSyncCandidate({ ...xdcRelease, jobId: '42161-27', sourceChainId: 42161 }), false);
  assert.equal(crossChainTrackingKey(xdcRelease), `releasePayment:30365-7:50:${txHash}`);
});

test('tracking links stay attached to the source transaction and accept verified destination links', () => {
  const links = getCrossChainTrackingLinks(xdcRelease, {
    links: { canonicalExplorerUrl: `https://arbiscan.io/tx/0x${'b'.repeat(64)}` },
  });
  assert.equal(links.sourceExplorerUrl, `https://xdcscan.com/tx/${txHash}`);
  assert.equal(links.layerZeroScanUrl, `https://layerzeroscan.com/tx/${txHash}`);
  assert.equal(links.canonicalExplorerUrl, `https://arbiscan.io/tx/0x${'b'.repeat(64)}`);
  assert.equal(links.canonicalJobUrl, '/job-details/30365-7');
});

test('status requests carry the action, transaction, payment baseline and destination', async () => {
  let requestedUrl = null;
  const expected = { state: 'in-progress', complete: false };
  const result = await readCrossChainActionStatus(xdcRelease, {
    backendUrl: 'https://api.example',
    fetchImpl: async (url) => {
      requestedUrl = new URL(url);
      return { ok: true, async json() { return { success: true, status: expected }; } };
    },
  });

  assert.deepEqual(result, expected);
  assert.equal(requestedUrl.pathname, '/api/oppy/cross-chain-status');
  assert.equal(requestedUrl.searchParams.get('action'), 'releasePayment');
  assert.equal(requestedUrl.searchParams.get('sourceTxHash'), txHash);
  assert.equal(requestedUrl.searchParams.get('baselineTotalPaidRaw'), '0');
  assert.equal(requestedUrl.searchParams.get('targetDomain'), '18');
});
