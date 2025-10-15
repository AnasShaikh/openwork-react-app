import React from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";
import "./ContractUpgradeProposal.css";

export default function ContractUpgradeProposal() {
    const navigate = useNavigate();

    const contracts = [
        {
            id: 1,
            name: "OpenWork DAO Smart Contract",
            route: "/contract-upgrade-dao"
        },
        {
            id: 2,
            name: "OpenWork Token Smart Contract",
            route: "/contract-upgrade-token"
        },
        {
            id: 3,
            name: "OpenWork's Athena (Skill Oracles)",
            route: "/contract-upgrade-athena"
        },
        {
            id: 4,
            name: "OpenWork's Job Contract",
            route: "/contract-upgrade-job"
        }
    ];

    const handleContractClick = (route) => {
        navigate(route);
    };

    return (
        <div className="contract-upgrade-container">
            <div className="contract-upgrade-card">
                <div className="contract-upgrade-header">
                    <BackButton to="/new-proposal" title="Contract Upgrade Proposal" />
                </div>

                <div className="contract-upgrade-content">
                    <p className="contract-upgrade-description">
                        Select the contract you wish to propose a change for
                    </p>

                    <div className="contracts-list">
                        {contracts.map((contract) => (
                            <button
                                key={contract.id}
                                className="contract-item"
                                onClick={() => handleContractClick(contract.route)}
                            >
                                <div className="contract-item-content">
                                    <img 
                                        src="/file-icon.svg" 
                                        alt="Contract" 
                                        className="contract-icon"
                                    />
                                    <span className="contract-name">{contract.name}</span>
                                </div>
                                <img 
                                    src="/chevron-right.svg" 
                                    alt="Arrow" 
                                    className="contract-arrow"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
