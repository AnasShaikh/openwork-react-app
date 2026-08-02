import React, { createContext, useContext, useState, useEffect } from "react";

const WalletContext = createContext(null);

function getInjectedProvider() {
  if (typeof window === "undefined") return null;
  return window.ethereum || null;
}

function getWalletErrorMessage(error) {
  if (error?.code === 4001) {
    return "Wallet connection was cancelled. Open MetaMask and try again.";
  }

  const message = error?.message || "MetaMask could not be connected.";
  if (String(message).toLowerCase().includes("already pending")) {
    return "A MetaMask connection request is already open. Complete or cancel it in MetaMask, then try again.";
  }

  return message;
}

export function WalletProvider({ children }) {
  // Never treat a cached address as an active wallet connection. MetaMask's
  // eth_accounts response is the authority after reload/reconnect.
  const [walletAddress, setWalletAddressState] = useState("");
  const [walletError, setWalletError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const setWalletAddress = (address) => {
    setWalletAddressState(address);
    if (address) {
      localStorage.setItem("ow_wallet_address", address);
    } else {
      localStorage.removeItem("ow_wallet_address");
    }
  };

  useEffect(() => {
    let provider = null;
    let cleanupProviderListeners = () => {};

    const handleAccountsChanged = (accounts = []) => {
      setWalletAddress(accounts[0] || "");
      if (accounts.length > 0) setWalletError("");
    };

    const handleDisconnect = () => {
      setWalletAddress("");
      setWalletError("MetaMask disconnected. Reconnect it to continue.");
    };

    const syncProvider = async () => {
      const nextProvider = getInjectedProvider();
      if (!nextProvider) {
        setWalletAddress("");
        return;
      }

      if (provider !== nextProvider) {
        cleanupProviderListeners();
        provider = nextProvider;
        provider.on?.("accountsChanged", handleAccountsChanged);
        provider.on?.("disconnect", handleDisconnect);
        cleanupProviderListeners = () => {
          provider?.removeListener?.("accountsChanged", handleAccountsChanged);
          provider?.removeListener?.("disconnect", handleDisconnect);
        };
      }

      try {
        const accounts = await nextProvider.request({ method: "eth_accounts" });
        handleAccountsChanged(accounts);
      } catch (error) {
        console.error("Failed to check wallet connection:", error);
        setWalletAddress("");
      }
    };

    const handleEthereumInitialized = () => syncProvider();
    window.addEventListener("ethereum#initialized", handleEthereumInitialized);
    syncProvider();

    // Some extension builds inject after the initialization event has already
    // fired. One short fallback check prevents a permanently inert connect UI.
    const lateInjectionTimer = window.setTimeout(syncProvider, 1000);

    return () => {
      window.clearTimeout(lateInjectionTimer);
      window.removeEventListener("ethereum#initialized", handleEthereumInitialized);
      cleanupProviderListeners();
    };
  }, []);

  const connectWallet = async () => {
    const provider = getInjectedProvider();
    setWalletError("");

    if (!provider) {
      setWalletError("MetaMask was not detected. Install or enable the extension, then reload this page.");
      return null;
    }

    setIsConnecting(true);
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      const address = accounts?.[0] || "";
      if (!address) throw new Error("MetaMask did not return an account.");
      setWalletAddress(address);
      return address;
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      setWalletAddress("");
      setWalletError(getWalletErrorMessage(error));
      return null;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    const provider = getInjectedProvider();
    try {
      await provider?.request?.({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });
    } catch (error) {
      // Some injected wallets do not support permission revocation. Clearing
      // app state still gives the user a predictable local disconnect.
      console.warn("Wallet permission revocation was unavailable:", error);
    }
    setWalletAddress("");
    setWalletError("");
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        walletError,
        isConnecting,
        connectWallet,
        disconnectWallet,
        clearWalletError: () => setWalletError(""),
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
