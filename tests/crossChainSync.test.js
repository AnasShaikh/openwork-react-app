import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getCrossChainSource,
  getCrossChainTrackingLinks,
  isCrossChainSyncCandidate,
  readCanonicalJobSyncStatus,
} from '../src/services/crossChainSyncService.js';

const txHash = `0x${'a'.repeat(64)}`;
const xdcJob = {
  jobId: '30365-7',
  sourceChainId: 50,
  sourceTxHash: txHash,
  sourceReceiptConfirmed: true,
};

function contractReturning(value) {
  return {
    methods: {
      jobExists(jobId) {
        assert.equal(jobId, '30365-7');
        return { async call() { return value; } };
      },
    },
  };
}

test('XDC jobs are cross-chain candidates with source and LayerZero links', () => {
  assert.equal(isCrossChainSyncCandidate(xdcJob), true);
  assert.equal(getCrossChainSource(xdcJob).name, 'XDC Network');
  assert.equal(isCrossChainSyncCandidate({ ...xdcJob, jobId: '42161-27', sourceChainId: 42161 }), false);

  const links = getCrossChainTrackingLinks(xdcJob);
  assert.equal(links.sourceExplorerUrl, `https://xdcscan.com/tx/${txHash}`);
  assert.equal(links.layerZeroScanUrl, `https://layerzeroscan.com/tx/${txHash}`);
  assert.equal(links.canonicalJobUrl, '/job-details/30365-7');
});

test('canonical Genesis presence determines syncing versus synced state', async () => {
  const nativeChain = { rpcUrl: 'unused', contracts: { genesis: '0xgenesis' } };
  const syncing = await readCanonicalJobSyncStatus(xdcJob, {
    nativeChain,
    contract: contractReturning(false),
  });
  assert.equal(syncing.state, 'syncing');
  assert.equal(syncing.canonicalExists, false);

  const synced = await readCanonicalJobSyncStatus(xdcJob, {
    nativeChain,
    contract: contractReturning(true),
  });
  assert.equal(synced.state, 'synced');
  assert.equal(synced.canonicalExists, true);
  assert.equal(synced.canonicalChainName, 'Arbitrum One');
});
