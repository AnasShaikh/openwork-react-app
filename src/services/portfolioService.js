import Web3 from 'web3';
import ProfileGenesisABI from '../ABIs/profile-genesis_ABI.json';
import { getLOWJCContract, isNativeArbChain } from './localChainService';
import { getChainConfig } from '../config/chainConfig';
import {
  LOWJC_OPERATIONS,
  buildWriteSendOptions,
  createLOWJCWrite,
} from './contractWriteRouter';

/**
 * Portfolio Service for blockchain and IPFS operations
 */

// IPFS Gateways for fetching (with fallback)
const IPFS_GATEWAYS = [
  '/api/ipfs/content/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://dweb.link/ipfs/'
];

/**
 * Fetch data from IPFS with multiple gateway fallback
 */
export const fetchFromIPFS = async (hash, timeout = 5000) => {
  if (!hash || hash === '') {
    console.warn('Empty IPFS hash provided');
    return null;
  }

  for (const gateway of IPFS_GATEWAYS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${gateway}${hash}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.warn(`Failed to fetch from ${gateway}:`, error.message);
    }
  }
  
  throw new Error(`Failed to fetch IPFS data from all gateways for hash: ${hash}`);
};

/**
 * Upload file to IPFS via backend (avoids CORS and exposes API keys)
 */
export const uploadFileToIPFS = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
    const response = await fetch(`${BACKEND_URL}/api/ipfs/upload-file`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Failed to upload file to IPFS');
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw error;
  }
};

/**
 * Upload JSON to IPFS via backend (avoids CORS and exposes API keys)
 */
export const uploadJSONToIPFS = async (jsonData, filename = 'data.json') => {
  try {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
    const response = await fetch(`${BACKEND_URL}/api/ipfs/upload-json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pinataContent: jsonData,
        pinataMetadata: {
          name: filename
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to upload JSON to IPFS');
    }

    const data = await response.json();
    return data.IpfsHash;
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw error;
  }
};

/**
 * Get ProfileGenesis contract instance
 */
const getProfileGenesisContract = (web3) => {
  const contractAddress = import.meta.env.VITE_PROFILE_GENESIS_ADDRESS;
  return new web3.eth.Contract(ProfileGenesisABI, contractAddress);
};

/**
 * Fetch all portfolio items for a user from blockchain
 */
export const fetchUserPortfolios = async (userAddress) => {
  try {
    if (!userAddress) {
      console.warn('❌ No user address provided');
      return [];
    }


    const web3 = new Web3(import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL);
    const contract = getProfileGenesisContract(web3);

    // Check if profile exists
    const hasProfile = await contract.methods.hasProfile(userAddress).call();
    
    if (!hasProfile) {
      return [];
    }

    // Get profile data
    const profile = await contract.methods.getProfile(userAddress).call();
    
    const portfolioHashes = profile.portfolioHashes || profile[3] || []; // Try both property name and index

    // Fetch each portfolio's data from IPFS
    const portfolios = [];
    for (let i = 0; i < portfolioHashes.length; i++) {
      try {
        const hash = portfolioHashes[i];
        const portfolioData = await fetchFromIPFS(hash);
        portfolios.push({
          id: i,
          ipfsHash: hash,
          ...portfolioData
        });
      } catch (error) {
        console.error(`❌ Failed to fetch portfolio ${i}:`, error);
        // Add placeholder for failed fetch
        portfolios.push({
          id: i,
          ipfsHash: portfolioHashes[i],
          title: 'Failed to load',
          description: 'Error loading portfolio data',
          skills: [],
          images: []
        });
      }
    }

    return portfolios;
  } catch (error) {
    console.error('❌ Error fetching user portfolios:', error);
    throw error;
  }
};

async function sendPortfolioWrite(walletAddress, operation, args, payloadTypes, payloadValues) {
  const web3 = new Web3(window.ethereum);
  const chainId = Number(await web3.eth.getChainId());
  const chainConfig = getChainConfig(chainId);
  if (!chainConfig?.allowed) {
    throw new Error(`Portfolio writes are not available on chain ${chainId}`);
  }

  const lowjcContract = await getLOWJCContract(chainId);
  const isNativeArbitrum = isNativeArbChain(chainId);
  const lzOptions = isNativeArbitrum ? null : chainConfig.layerzero?.options;
  let layerZeroFee;

  if (!isNativeArbitrum) {
    if (!lzOptions) throw new Error(`LayerZero options are not configured for ${chainConfig.name}`);
    const bridgeAddress = await lowjcContract.methods.bridge().call();
    const bridgeContract = new web3.eth.Contract([{
      inputs: [{ type: 'bytes' }, { type: 'bytes' }],
      name: 'quoteNativeChain',
      outputs: [{ type: 'uint256' }],
      stateMutability: 'view',
      type: 'function'
    }], bridgeAddress);
    const payload = web3.eth.abi.encodeParameters(payloadTypes, payloadValues);
    layerZeroFee = (await bridgeContract.methods.quoteNativeChain(payload, lzOptions).call()).toString();
  }

  const gasPrice = await web3.eth.getGasPrice();
  const method = createLOWJCWrite(lowjcContract, chainConfig, operation, args, lzOptions);
  const estimateOptions = buildWriteSendOptions(chainConfig, {
    from: walletAddress,
    value: layerZeroFee,
    gasPrice,
  });
  const gasEstimate = await method.estimateGas(estimateOptions);
  return method.send({
    ...estimateOptions,
    gas: Math.floor(Number(gasEstimate) * 1.2),
  });
}

/** Add a new portfolio item to the connected write chain. */
export const addPortfolioToBlockchain = async (walletAddress, portfolioHash) => {
  try {
    return await sendPortfolioWrite(
      walletAddress,
      LOWJC_OPERATIONS.ADD_PORTFOLIO,
      [portfolioHash],
      ['string', 'address', 'string'],
      ['addPortfolio', walletAddress, portfolioHash]
    );
  } catch (error) {
    console.error('Error adding portfolio to blockchain:', error);
    throw error;
  }
};

/** Update an existing portfolio item on the connected write chain. */
export const updatePortfolioOnBlockchain = async (walletAddress, index, newPortfolioHash) => {
  try {
    return await sendPortfolioWrite(
      walletAddress,
      LOWJC_OPERATIONS.UPDATE_PORTFOLIO,
      [index, newPortfolioHash],
      ['string', 'address', 'uint256', 'string'],
      ['updatePortfolioItem', walletAddress, index, newPortfolioHash]
    );
  } catch (error) {
    console.error('Error updating portfolio on blockchain:', error);
    throw error;
  }
};

/** Delete a portfolio item from the connected write chain. */
export const deletePortfolioFromBlockchain = async (walletAddress, index) => {
  try {
    return await sendPortfolioWrite(
      walletAddress,
      LOWJC_OPERATIONS.REMOVE_PORTFOLIO,
      [index],
      ['string', 'address', 'uint256'],
      ['removePortfolioItem', walletAddress, index]
    );
  } catch (error) {
    console.error('Error deleting portfolio from blockchain:', error);
    throw error;
  }
};
