import React from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";
import "./ContractUpdateProposel.css";

export default function ContractUpdateProposel() {
  const navigate = useNavigate();

  const contracts = [
    {
      id: 1,
      name: "OpenWork DAO Smart Contract",
      route: "/contract-update-step2"
    },
    {
      id: 2,
      name: "OpenWork Token Smart Contract",
      route: "/token-contract-update-step2"
    },
    {
      id: 3,
      name: "OpenWork's Athena (Skill Oracles)",
      route: "/athena-contract-update-step2"
    },
    {
      id: 4,
      name: "OpenWork's Job Contract",
      route: "/job-contract-update-step2"
    }
  ];

  const handleContractClick = (route) => {
    navigate(route);
  };

  return (
    <div className="contract-update-container">
      <div className="contract-update-card">
        <div className="contract-update-header">
          <BackButton to="/new-proposal" title="Contract Update Proposal" />
        </div>

        <div className="contract-update-content">
          <p className="contract-update-description">
            Select the contract you wish to propose a change for
          </p>

          <div className="contract-update-list">
            {contracts.map((contract) => (
              <button
                key={contract.id}
                className="contract-update-item"
                onClick={() => handleContractClick(contract.route)}
              >
                <div className="contract-update-item-content">
                  <img src="/file-icon.svg" alt="" className="contract-file-icon" />
                  <span className="contract-name">{contract.name}</span>
                </div>
                <img src="/chevron-right.svg" alt="" className="contract-arrow" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
