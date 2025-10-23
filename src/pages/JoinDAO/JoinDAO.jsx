import React from "react";
import { useNavigate, Link } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";
import "./JoinDAO.css";

export default function JoinDAO() {
    const navigate = useNavigate();

    return (
        <div className="join-dao-container">
            <div className="join-dao-card">
                <div className="join-dao-header">
                    <BackButton to="/dao" title="Join the DAO" />
                </div>

                <div className="join-dao-content">
                    <div className="dao-content-wrapper">
                        <div className="dao-icon-wrapper">
                            <img src="/dao.svg" alt="DAO Icon" className="dao-icon" />
                        </div>

                        <div className="dao-info-section">
                            <p className="dao-description">
                                OpenWork token holders govern the OpenWork DAO, which in turn governs the smart contracts, treasury and Athena's Skill Oracles. Read the OpenWork Paper to understand how it all works
                            </p>

                            <Link to="/about" className="dao-paper-link">
                                <span>Read the OpenWork Paper</span>
                                <img src="/arrowRight.svg" alt="Arrow" className="arrow-icon" />
                            </Link>
                        </div>
                    </div>

                    <div className="dao-staking-section">
                        <div className="staking-box">
                            <div className="staking-box-row">
                                <span className="staking-label">MINIMUM STAKING AMOUNT</span>
                                <div className="staking-value">
                                    <span className="value-text">1,000,000</span>
                                    <img src="/OWToken.svg" alt="OW Token" className="token-icon" />
                                </div>
                            </div>
                        </div>

                        <div className="balance-box">
                            <span className="balance-value">48.81</span>
                            <img src="/OWToken.svg" alt="OW Token" className="token-icon" />
                        </div>

                        <button className="join-dao-button">
                            <span>Join DAO</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
