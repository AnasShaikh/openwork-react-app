import React from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";
import "./ContractUpdateProposelStep2.css";

export default function ContractUpdateProposelStep2() {
  const navigate = useNavigate();

  const aspects = [
    {
      id: 1,
      name: "No. of votes required to pass a proposal",
      route: "/dao-votes-update-form"
    },
    {
      id: 2,
      name: "Minimum staking amount to join DAO",
      route: "/dao-staking-update-form"
    }
  ];

  const handleAspectClick = (route) => {
    navigate(route);
  };

  return (
    <div className="contract-update-step2-container">
      <div className="contract-update-step2-card">
        <div className="contract-update-step2-header">
          <BackButton to="/contractupdateproposel" title="Select an aspect" />
        </div>

        <div className="contract-update-step2-content">
          <p className="contract-update-step2-description">
            Select an aspect from the OpenWork DAO Smart Contract you wish to propose a change for
          </p>

          <div className="contract-update-step2-list">
            {aspects.map((aspect) => (
              <button
                key={aspect.id}
                className="contract-update-step2-item"
                onClick={() => handleAspectClick(aspect.route)}
              >
                <div className="contract-update-step2-item-content">
                  <img src="/file-icon.svg" alt="" className="aspect-file-icon" />
                  <span className="aspect-name">{aspect.name}</span>
                </div>
                <img src="/chevron-right.svg" alt="" className="aspect-arrow" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
