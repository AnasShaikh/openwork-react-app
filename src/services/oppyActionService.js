import Web3 from 'web3';
import genesisABI from '../ABIs/genesis_ABI.json';
import nativeAthenaABI from '../ABIs/native-athena_ABI.json';
import { getChainConfig, getNativeChain } from '../config/chainConfig';
import { getReadOnlyWeb3 } from './localChainService';
import { applyTxTimeouts, sendTrackedContractMethod } from './txReliability';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
const USDC_BASE = 1_000_000n;
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

export function toUsdcBaseUnits(amount, label = 'Amount') {
  const number = Number(amount);
  const scaled = Math.round(number * Number(USDC_BASE));
  if (!Number.isFinite(number) || !Number.isSafeInteger(scaled) || scaled <= 0) {
    throw new Error(`${label} must be a valid amount greater than zero.`);
  }
  return BigInt(scaled);
}

export function formatUsdcBaseUnits(value) {
  const amount = BigInt(value || 0);
  const whole = amount / USDC_BASE;
  const fractional = (amount % USDC_BASE).toString().padStart(6, '0').replace(/0+$/, '');
  return fractional ? `${whole}.${fractional}` : whole.toString();
}

export function chainDomainFromName(name) {
  const normalized = String(name || '').toLowerCase();
  if (normalized.includes('optimism')) return 2;
  if (normalized.includes('arbitrum')) return 3;
  if (normalized.includes('xdc')) return 18;
  return null;
}

export function explorerUrl(chainId, transactionHash) {
  const base = getChainConfig(Number(chainId))?.blockExplorer || 'https://arbiscan.io';
  return `${base}/tx/${transactionHash}`;
}

export async function fetchOppyExplorer(path) {
  const response = await fetch(`${BACKEND_URL}/api/oppy/explore${path}`);
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success || !payload?.explorer) {
    throw new Error(payload?.error || `OpenWork data could not be loaded (HTTP ${response.status}).`);
  }
  return payload.explorer;
}

export async function ensureUsdcFunding({ chainId, owner, spender, amount, onStatus, walletProvider }) {
  const required = BigInt(amount);
  const config = getChainConfig(chainId);
  if (!config?.contracts?.usdc || !spender) {
    throw new Error(`USDC funding is not configured for ${config?.name || `chain ${chainId}`}.`);
  }

  const readWeb3 = getReadOnlyWeb3(chainId);
  const readToken = new readWeb3.eth.Contract(ERC20_ABI, config.contracts.usdc);
  onStatus?.({ phase: 'preparing', message: 'Checking USDC balance and existing approval…' });
  const [balance, allowance] = await Promise.all([
    readToken.methods.balanceOf(owner).call(),
    readToken.methods.allowance(owner, spender).call(),
  ]);

  if (BigInt(balance) < required) {
    throw new Error(
      `Insufficient USDC on ${config.name}. This action requires ${formatUsdcBaseUnits(required)} USDC; the connected wallet has ${formatUsdcBaseUnits(balance)} USDC.`,
    );
  }
  if (BigInt(allowance) >= required) {
    onStatus?.({ phase: 'preparing', step: 'approval', message: 'Existing USDC approval is sufficient.' });
    return { approved: false, allowance: BigInt(allowance) };
  }

  onStatus?.({
    phase: 'wallet',
    step: 'approval',
    message: `Approve ${formatUsdcBaseUnits(required)} USDC in your wallet. The contract transaction comes next.`,
  });
  if (!walletProvider) throw new Error('Select and connect the wallet you want to use, then retry.');
  const walletWeb3 = new Web3(walletProvider);
  const walletToken = new walletWeb3.eth.Contract(ERC20_ABI, config.contracts.usdc);
  applyTxTimeouts(walletToken, chainId);
  const approvalMethod = walletToken.methods.approve(spender, required.toString());
  const approval = await sendTrackedContractMethod(
    approvalMethod,
    { from: owner, gas: 100000 },
    onStatus,
    {
      step: 'approval',
      pendingMessage: 'USDC approval submitted; checking confirmation…',
      confirmedMessage: 'USDC approval confirmed. The OpenWork action comes next.',
    },
  );
  if (!approval?.transactionHash) throw new Error('The USDC approval did not return a transaction hash.');
  onStatus?.({ phase: 'preparing', step: 'action', message: 'USDC approval confirmed. Preparing the contract transaction…' });
  return { approved: true, transactionHash: approval.transactionHash };
}

export async function loadActiveOracles() {
  const native = getNativeChain();
  if (!native?.rpcUrl || !native?.contracts?.genesis || !native?.contracts?.nativeAthena) return [];
  const web3 = new Web3(native.rpcUrl);
  const genesis = new web3.eth.Contract(genesisABI, native.contracts.genesis);
  const athena = new web3.eth.Contract(nativeAthenaABI, native.contracts.nativeAthena);
  const names = await genesis.methods.getAllOracleNames().call();
  const rows = await Promise.all(Array.from(names || []).map(async (name) => {
    const [active, members] = await Promise.all([
      athena.methods.isOracleActive(name).call(),
      genesis.methods.getOracleMembers(name).call(),
    ]);
    return { name: String(name), active: Boolean(active), memberCount: Array.from(members || []).length };
  }));
  return rows.filter((oracle) => oracle.active && oracle.memberCount > 0);
}

export function resolveSelectedApplication(jobData, applicantAddress) {
  const applications = Array.isArray(jobData?.applications) ? jobData.applications : [];
  const normalized = String(applicantAddress || '').toLowerCase();
  return applications.find((application) => String(application.applicant || '').toLowerCase() === normalized)
    || applications.find((application) => application.selected)
    || null;
}

export function resolveReleaseTarget(jobData) {
  const selected = (jobData?.applications || []).find((application) => application.selected) || null;
  const address = jobData?.job?.paymentTargetAddress
    || selected?.preferredPaymentAddress
    || jobData?.job?.selectedApplicant;
  const domain = chainDomainFromName(jobData?.job?.paymentTargetChain)
    || chainDomainFromName(selected?.preferredPaymentChain);
  if (!address || String(address).toLowerCase() === ZERO_ADDRESS) {
    throw new Error('The selected applicant payment address is not available.');
  }
  return { targetRecipient: address, targetChainDomain: domain };
}
