import { Web3 } from 'web3';
import { switchToChain } from '../utils/switchNetwork';
import { applyTxTimeouts } from './txReliability';
import { buildCctpFeeEnvelope, cctpWalletErrorMessage } from './cctpFee';

const BACKEND_URL = import.meta.env?.VITE_BACKEND_URL || '';

export async function readCctpRecoveryPlan(tracking, dependencies = {}) {
  const fetchImpl = dependencies.fetchImpl || fetch;
  const response = await fetchImpl(`${dependencies.backendUrl ?? BACKEND_URL}/api/oppy/cctp-recovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: tracking.action,
      jobId: tracking.jobId,
      sourceTxHash: tracking.sourceTxHash,
      sourceChainId: tracking.sourceChainId,
      targetDomain: tracking.targetDomain ?? null,
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success || !payload?.plan) {
    throw new Error(payload?.error || `Circle recovery could not be prepared (HTTP ${response.status}).`);
  }
  return payload.plan;
}

export async function completeCctpTransferWithWallet({ tracking, walletProvider, onStatus, dependencies = {} }) {
  if (!walletProvider) throw new Error('Connect an EVM wallet to complete the USDC transfer.');
  const emit = typeof onStatus === 'function' ? onStatus : () => {};
  emit({ phase: 'preparing', message: 'Checking Circle attestation and replay protection…' });
  let plan = await readCctpRecoveryPlan(tracking, dependencies);
  if (plan.alreadyCompleted) return { alreadyCompleted: true, chainId: plan.destination?.chainId || null, transactionHash: null };
  if (!plan.ready) throw new Error('Circle is still preparing the attestation. Oppy will keep checking.');

  const accounts = await walletProvider.request({ method: 'eth_requestAccounts' });
  const from = accounts?.[0];
  if (!from) throw new Error('Wallet connection was not completed.');
  const currentChainId = parseInt(await walletProvider.request({ method: 'eth_chainId' }), 16);
  if (currentChainId !== Number(plan.chainId)) {
    emit({ phase: 'wallet', message: `Switch to ${plan.chainName} to finish the USDC transfer.` });
    await switchToChain(Number(plan.chainId), walletProvider);
  }

  const web3 = applyTxTimeouts(new Web3(walletProvider), Number(plan.chainId));
  // Re-read after account access and any network switch. The relayer may have
  // completed the permissionless receive while the wallet UI was open.
  plan = await readCctpRecoveryPlan(tracking, dependencies);
  if (plan.alreadyCompleted) {
    return { alreadyCompleted: true, chainId: plan.destination?.chainId || plan.chainId || null, transactionHash: null };
  }
  if (!plan.ready) throw new Error('Circle is still preparing the attestation. Oppy will keep checking.');
  try {
    await web3.eth.call({ from, to: plan.to, data: plan.data });
  } catch (error) {
    plan = await readCctpRecoveryPlan(tracking, dependencies);
    if (plan.alreadyCompleted) return { alreadyCompleted: true, chainId: plan.destination?.chainId || plan.chainId, transactionHash: null };
    throw new Error(`The destination contract rejected the recovery preflight: ${error.message}`);
  }

  const [estimatedGas, balance] = await Promise.all([
    web3.eth.estimateGas({ from, to: plan.to, data: plan.data }),
    web3.eth.getBalance(from),
  ]);
  const gas = BigInt(estimatedGas) * 135n / 100n;
  const fee = await buildCctpFeeEnvelope(web3);
  const required = gas * fee.costPerGas;
  if (BigInt(balance) < required) {
    const shortfall = required - BigInt(balance);
    throw new Error(
      `This wallet needs about ${web3.utils.fromWei(shortfall.toString(), 'ether')} more ${plan.nativeSymbol} to complete the transfer.`,
    );
  }

  emit({ phase: 'wallet', message: `Confirm the one-time Circle receive transaction on ${plan.chainName}. No USDC approval is required.` });
  let receipt;
  try {
    receipt = await web3.eth.sendTransaction({
      from,
      to: plan.to,
      data: plan.data,
      gas: gas.toString(),
      ...fee.fields,
    });
  } catch (error) {
    // A second actor can consume the Circle nonce while this wallet is open.
    // Prove that outcome before telling the user to retry anything.
    const latest = await readCctpRecoveryPlan(tracking, dependencies).catch(() => null);
    if (latest?.alreadyCompleted) {
      return { alreadyCompleted: true, chainId: latest.destination?.chainId || latest.chainId || plan.chainId, transactionHash: null };
    }
    throw new Error(cctpWalletErrorMessage(error));
  }
  if (!(receipt?.status === true || receipt?.status === 1n || receipt?.status === '0x1')) {
    throw new Error('The Circle receive transaction was mined but reverted.');
  }
  emit({ phase: 'confirmed', txHash: receipt.transactionHash, message: 'USDC delivery completed on the destination chain.' });
  return {
    alreadyCompleted: false,
    transactionHash: receipt.transactionHash,
    chainId: Number(plan.chainId),
    explorerUrl: `${plan.explorerBaseUrl || ''}${receipt.transactionHash}`,
  };
}
