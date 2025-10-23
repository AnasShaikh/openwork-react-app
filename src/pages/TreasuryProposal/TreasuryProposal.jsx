import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";
import "./TreasuryProposal.css";

export default function TreasuryProposal() {
    const navigate = useNavigate();
    const [selectedWallet, setSelectedWallet] = useState("Treasury Wallet 1");
    const [amount, setAmount] = useState("48.81");
    const [receiverWallet, setReceiverWallet] = useState("0xDEAF...fB8B");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState(null);
    const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState(false);

    const wallets = [
        "Treasury Wallet 1",
        "Treasury Wallet 2",
        "Treasury Wallet 3"
    ];

    const handleFileUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = () => {
        // Handle proposal submission
        console.log({
            selectedWallet,
            amount,
            receiverWallet,
            description,
            file
        });
    };

    return (
        <div className="treasury-proposal-container">
            <div className="treasury-proposal-card">
                <div className="treasury-proposal-header">
                    <BackButton to="/new-proposal" title="Treasury Proposal" />
                </div>

                <div className="treasury-proposal-content">
                    <div className="form-section">
                        <div className="form-fields">
                            {/* Treasury Wallet Dropdown */}
                            <div className="dropdown-field">
                                <button 
                                    className="dropdown-button"
                                    onClick={() => setIsWalletDropdownOpen(!isWalletDropdownOpen)}
                                >
                                    <span>{selectedWallet}</span>
                                    <img 
                                        src="/chevron-down.svg" 
                                        alt="Dropdown" 
                                        className={`dropdown-icon ${isWalletDropdownOpen ? 'open' : ''}`}
                                    />
                                </button>
                                {isWalletDropdownOpen && (
                                    <div className="dropdown-menu">
                                        {wallets.map((wallet, index) => (
                                            <div 
                                                key={index}
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setSelectedWallet(wallet);
                                                    setIsWalletDropdownOpen(false);
                                                }}
                                            >
                                                {wallet}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Wallet Balance Display */}
                            <div className="info-box">
                                <div className="info-content">
                                    <p className="info-label">WALLET BALANCE</p>
                                    <div className="info-value">
                                        <span className="balance-amount">100,000,000</span>
                                        <img src="/ow-token-icon.png" alt="OW Token" className="token-icon" />
                                    </div>
                                </div>
                            </div>

                            {/* Amount Input */}
                            <div className="input-field">
                                <input
                                    type="text"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="amount-input"
                                />
                                <img src="/ow-token-icon.png" alt="OW Token" className="token-icon-input" />
                            </div>

                            {/* Receiver Wallet Display */}
                            <div className="info-box">
                                <div className="info-content">
                                    <p className="info-label">RECEIVER WALLET</p>
                                    <div className="info-value-text">
                                        <span>{receiverWallet}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Job Details Section */}
                        <div className="job-details-section">
                            <p className="section-label">JOB DETAILS</p>
                            <div className="job-details-content">
                                <textarea
                                    className="description-textarea"
                                    placeholder="Enter proposal description..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5}
                                />
                                
                                <label className="file-upload-box">
                                    <input 
                                        type="file" 
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <div className="file-upload-content">
                                        <img src="/upload-icon.svg" alt="Upload" className="upload-icon" />
                                        <p className="upload-text">
                                            {file ? file.name : 'click here to upload a file if relevant'}
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button className="submit-button" onClick={handleSubmit}>
                        Submit Proposal
                    </button>
                </div>
            </div>
        </div>
    );
}
