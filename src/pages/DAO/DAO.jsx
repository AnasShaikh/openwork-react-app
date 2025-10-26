import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import JobsTable from "../../components/JobsTable/JobsTable";
import "./DAO.css";
import DetailButton from "../../components/DetailButton/DetailButton";
import BlueButton from "../../components/BlueButton/BlueButton";

export default function DAO() {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const proposalsPerPage = 4;

    const headers = ["Request Title", "Proposed By", "Vote Submissions", "Type", "Time Left", ""];

    const proposals = [
        {
            id: "0x1234",
            title: "OpenWork Token Contract Upgrade",
            proposedBy: "0xDEAF...f8BB",
            voteSubmissions: 70,
            type: "Upgrade",
            timeLeft: "2 days",
            color: "#FFA500",
            viewUrl: "/contract-upgrade-proposal-view"
        },
        {
            id: "0x2345",
            title: "OpenWork Token Contract Update",
            proposedBy: "0xDEAF...f8BB",
            voteSubmissions: 90,
            type: "Update",
            timeLeft: "5 days",
            color: "#00C853",
            viewUrl: "/contract-update-proposal-view"
        },
        {
            id: "0x3456",
            title: "Treasury Proposal",
            proposedBy: "Jollie Hall",
            voteSubmissions: 40,
            type: "Treasury",
            timeLeft: "1 day",
            color: "#F44336",
            viewUrl: "/treasury-proposal-view"
        },
        {
            id: "0x4567",
            title: "Dissolve General Skill Oracle",
            proposedBy: "0xDEAF...f8BB",
            voteSubmissions: 60,
            type: "Dissolve Oracle",
            timeLeft: "2 hrs",
            color: "#FFA500",
            viewUrl: "/dissolve-oracle-proposal-view"
        },
        {
            id: "0x5678",
            title: "Recruit Member to Skill Oracle",
            proposedBy: "Mollie Hall",
            voteSubmissions: 80,
            type: "Recruitment",
            timeLeft: "3 days",
            color: "#00C853",
            viewUrl: "/recruitment-proposal-view"
        }
    ];

    const titleOptions = [
        {
            title: 'DAO View',
            items: [
                'Jobs View',
                'Skill Oracle View',
                'Talent View',
                'DAO View'
            ]
        },
        {
            title: 'Proposals',
            items: [
                'Members',
                'Proposals'
            ]
        }
    ];

    const filterOptions = [
        {
            title: 'Table Columns',
            items: [
                'Title',
                'Proposed by',
                'Vote Submission',
                'Type',
                'Time Left'
            ]
        },
        {
            title: 'Filter',
            items: [
                'All',
                'Active',
                'Completed'
            ]
        }
    ];

    const tableData = useMemo(() => {
        return proposals.map((proposal) => {
            return [
                <div className="proposal-title">
                    <img src="/doc.svg" alt="" className="docIcon" />
                    {proposal.title && <span>{proposal.title}</span>}
                </div>,
                <div className="proposed-by">
                    <span>{proposal.proposedBy}</span>
                </div>,
                <div className="vote-progress">
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar-fill" 
                            style={{ 
                                width: `${proposal.voteSubmissions}%`,
                                backgroundColor: proposal.color 
                            }}
                        />
                    </div>
                    <span className="vote-percentage">{proposal.voteSubmissions}%</span>
                </div>,
                <div className="proposal-type">{proposal.type}</div>,
                <div className="time-left">{proposal.timeLeft}</div>,
                <div className="view-detail">
                    <DetailButton to={proposal.viewUrl} imgSrc="/view.svg" alt="detail" />
                </div>
            ];
        });
    }, [proposals]);

    // Calculate indices for pagination
    const indexOfLastProposal = currentPage * proposalsPerPage;
    const indexOfFirstProposal = indexOfLastProposal - proposalsPerPage;
    const currentProposals = tableData.slice(indexOfFirstProposal, indexOfLastProposal);

    const totalPages = Math.ceil(proposals.length / proposalsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const customBoxItems = [
        {
            icon: '/proposals.svg',
            title: 'SKILL ORACLES',
            number: '12'
        },
        {
            icon: '/members.svg',
            title: 'DAO MEMBERS',
            number: '120'
        },
        {
            icon: '/stakings.svg',
            title: 'MY CURRENT STAKINGS',
            number: '0'
        }
    ];

    const handleReferEarnClick = () => {
        navigate('/refer-earn');
    };

    return (
        <div className="body-container">
            <div className="view-jobs-container">
                <JobsTable
                    title={`OpenWork DAO`}
                    ledgerTitle={`OpenWork Ledger`}
                    backUrl="/governance"
                    tableData={currentProposals}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={paginate}
                    headers={headers}
                    titleOptions={titleOptions}
                    filterOptions={filterOptions}
                    applyNow={false}
                    boxSection={true}
                    customBoxItems={customBoxItems}
                    customButtonLabel="New Proposal"
                    customButtonIcon="/plus.svg"
                    onCustomButtonClick={() => navigate('/new-proposal')}
                    onReferEarnClick={handleReferEarnClick}
                />
            </div>
        </div>
    );
}
