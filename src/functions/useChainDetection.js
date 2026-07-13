import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getActiveChainConfig,
  getChainConfig as getConfiguredChain,
  getChainLogo,
  isMainnet,
} from '../config/chainConfig';

/**
 * Custom hook for reliable chain detection and switching
 * Single source of truth for all chain-related state and operations
 * Supports both testnet and mainnet based on VITE_NETWORK_MODE
 */
export function useChainDetection(walletAddress) {
  const [currentChainId, setCurrentChainId] = useState(null);
  const [isDetecting, setIsDetecting] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  // Supported chains configuration - varies by network mode
  const SUPPORTED_CHAINS = useMemo(() => {
    return Object.fromEntries(
      Object.entries(getActiveChainConfig()).map(([chainId, config]) => [
        Number(chainId),
        {
          name: config.shortName || config.name,
          icon: getChainLogo(Number(chainId)),
          fullName: config.name,
        },
      ])
    );
  }, []);

  // Get chain config for adding to MetaMask
  const getWalletChainConfig = useCallback((chainId) => {
    const config = getConfiguredChain(chainId);
    if (!config) return null;

    return {
      chainId: `0x${Number(chainId).toString(16)}`,
      chainName: config.name,
      nativeCurrency: config.nativeCurrency,
      rpcUrls: [config.rpcUrl],
      blockExplorerUrls: [config.blockExplorer],
    };
  }, []);

  // Core detection function
  const detectCurrentChain = useCallback(async () => {
    if (!window.ethereum) {
      console.log('🔴 MetaMask not installed');
      setIsDetecting(false);
      return null;
    }

    try {
      // Step 1: Verify wallet is connected
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        console.log('⚠️ No wallet connected');
        setCurrentChainId(null);
        setIsDetecting(false);
        return null;
      }

      // Step 2: Get current chain ID
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      const chainId = parseInt(chainIdHex, 16);

      console.log('🔍 Detected Chain ID:', chainId, isMainnet() ? '(mainnet mode)' : '(testnet mode)');

      // Step 3: Update state
      setCurrentChainId(chainId);
      setIsDetecting(false);
      return chainId;
    } catch (error) {
      console.error('🔴 Error detecting chain:', error);
      setIsDetecting(false);
      return null;
    }
  }, []);

  // Switch to a different chain
  const switchToChain = useCallback(async (targetChainId) => {
    console.log('🔄 switchToChain called with:', targetChainId, isMainnet() ? '(mainnet)' : '(testnet)');

    if (!window.ethereum) {
      alert('Please install MetaMask');
      return false;
    }

    // Verify wallet is connected
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        alert('Please connect your wallet first');
        return false;
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }

    setIsSwitching(true);
    const chainIdHex = `0x${targetChainId.toString(16)}`;

    try {
      console.log('🔄 Switching to chain:', targetChainId);

      // Try to switch
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });

      console.log('✅ Successfully switched to chain:', targetChainId);
      setIsSwitching(false);
      return true;

    } catch (switchError) {
      // Chain not added to MetaMask
      if (switchError.code === 4902) {
        console.log('📝 Chain not found, adding...');

        try {
          const config = getWalletChainConfig(targetChainId);
          if (!config) {
            alert('Chain configuration not found');
            setIsSwitching(false);
            return false;
          }
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [config]
          });

          console.log('✅ Successfully added and switched to chain:', targetChainId);
          setIsSwitching(false);
          return true;

        } catch (addError) {
          console.error('🔴 Error adding chain:', addError);
          alert(`Failed to add network. Please add it manually in MetaMask.`);
          setIsSwitching(false);
          return false;
        }
      }
      // User rejected
      else if (switchError.code === 4001) {
        console.log('❌ User rejected network switch');
        setIsSwitching(false);
        return false;
      }
      // Other errors
      else {
        console.error('🔴 Error switching chain:', switchError);
        alert(`Failed to switch network: ${switchError.message}`);
        setIsSwitching(false);
        return false;
      }
    }
  }, [getWalletChainConfig]);

  // Effect: Detect chain when wallet connects
  useEffect(() => {
    if (walletAddress) {
      console.log('🚀 Wallet connected, detecting chain...');
      setIsDetecting(true);

      // Small delay to ensure wallet state is settled
      const timer = setTimeout(() => {
        detectCurrentChain();
      }, 150);

      return () => clearTimeout(timer);
    } else {
      console.log('⚠️ Wallet disconnected');
      setCurrentChainId(null);
      setIsDetecting(false);
    }
  }, [walletAddress, detectCurrentChain]);

  // Effect: Listen to chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleChainChanged = (chainIdHex) => {
      const chainId = parseInt(chainIdHex, 16);
      console.log('🔄 Chain changed to:', chainId);
      setCurrentChainId(chainId);
      setIsSwitching(false);
    };

    const handleAccountsChanged = (accounts) => {
      console.log('👤 Accounts changed');
      if (accounts.length > 0) {
        // Re-detect chain when account changes
        detectCurrentChain();
      } else {
        setCurrentChainId(null);
      }
    };

    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [detectCurrentChain]);

  // Effect: Handle late-arriving ethereum provider (MetaMask loads after React, or mock injection)
  useEffect(() => {
    const handleEthereumInitialized = () => {
      if (walletAddress) {
        console.log('🔄 ethereum#initialized — re-detecting chain');
        setIsDetecting(true);
        setTimeout(() => detectCurrentChain(), 100);
      }
    };
    window.addEventListener('ethereum#initialized', handleEthereumInitialized);
    return () => window.removeEventListener('ethereum#initialized', handleEthereumInitialized);
  }, [walletAddress, detectCurrentChain]);

  return {
    currentChainId,
    isDetecting,
    isSwitching,
    switchToChain,
    supportedChains: SUPPORTED_CHAINS,
    isMainnetMode: isMainnet()
  };
}
