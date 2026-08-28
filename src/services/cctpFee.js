import { buildFeeOverrides } from './txReliability.js';

const PRE_BROADCAST_FEE_ERROR = /(?:max fee per gas|fee cap).*(?:less than|below).*(?:base fee)|base fee.*(?:exceeds|higher than).*(?:max fee|fee cap)/i;

export async function buildCctpFeeEnvelope(web3) {
  const eip1559 = await buildFeeOverrides(web3);
  if (eip1559.maxFeePerGas !== undefined) {
    return {
      fields: eip1559,
      costPerGas: BigInt(eip1559.maxFeePerGas),
    };
  }

  // A legacy chain has no base fee. Add modest headroom so the quoted gas
  // price is not stale by the time the wallet broadcasts the transaction.
  const quoted = BigInt(await web3.eth.getGasPrice());
  const gasPrice = quoted * 125n / 100n;
  return {
    fields: { gasPrice: gasPrice.toString() },
    costPerGas: gasPrice,
  };
}

export function cctpWalletErrorMessage(error) {
  const message = error?.message || String(error || '');
  if (PRE_BROADCAST_FEE_ERROR.test(message)) {
    return 'The network fee changed before the transaction was broadcast. No transaction was sent; use Complete with my wallet again.';
  }
  return message || 'The wallet completion was not finished.';
}
