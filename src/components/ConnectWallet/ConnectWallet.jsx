import React from "react";
import "./ConnectWallet.css";
import { useWalletConnection } from "../../functions/useWalletConnection";

import BackButton from "../../components/BackButton/BackButton";
import Warning from "../../components/Warning/Warning";


const WALLETITEMS = [
    {
      icon: 'metamask.svg',
      label: 'Metamask Wallet'  
    },
]

function WalletButton({icon, label, onClick, disabled}) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="wallet-button"
        disabled={disabled}
      >
        <div className="wallet">
            <img src={icon} alt="" />
            <span>{label}</span>
        </div>
        <img src="/arrowRight.svg" alt="" />
      </button>
    )
}

export default function ConnectWallet() {
    const { walletAddress, walletError, isConnecting, connectWallet } = useWalletConnection();
    
  return (
    <>
      <div className="form-containerDC form-post">
        <div className="form-header">
          <BackButton to="/" title="Connect Wallet"/>
        </div>
        <div className="form-body">
          <p id="pDC2">
              Select the wallet you would like to connect to
          </p>
          <div className="wallet-list">
              {
                  WALLETITEMS.map((item, index) => (
                      <WalletButton
                        key={index}
                        label={item.label}
                        icon={item.icon}
                        onClick={connectWallet}
                        disabled={isConnecting}
                      />
                  ))
              }
          </div>
          {isConnecting && (
            <Warning content="Waiting for MetaMask approval…" variant="info" />
          )}
          {walletError && (
            <Warning content={walletError} variant="error" />
          )}
          {walletAddress && (
            <Warning content="MetaMask is connected. You can return to the job flow." variant="success" />
          )}
        </div>
      </div>
    </>
  );
}
