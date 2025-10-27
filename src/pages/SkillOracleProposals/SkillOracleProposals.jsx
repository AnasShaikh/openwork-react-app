import React, { useEffect, useMemo, useState } from "react";
import JobsTable from "../../components/JobsTable/JobsTable";
import "./SkillOracleProposals.css";
import DetailButton from "../../components/DetailButton/DetailButton";

export default function SkillOracleProposals() {
    const [account, setAccount] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const proposalsPerPage = 5; // Number of proposals per page
    const [walletAddress, setWalletAddress] = useState("");
    const [loading, setLoading] = useState(true); // Loading state

    const headers = ["Request Title", "Submitted By", "Type", "Vote Submissions", ""];

    const proposals = [
        {
            id: 0,
            title: 'React Development Oracle Recruitment Suggestion',
            submittedBy: '0xDEAF...fB8B',
            type: 'Eligibility Application',
            votePercent: 70,
            color: '#FFA500'
        },
        {
            id: 1,
            title: 'UX/UI Oracle Recruitment Suggestion',
            submittedBy: '0xDEAF...fB8B',
            type: 'Recruitment Proposal',
            votePercent: 90,
            color: '#00C853'
        },
        {
            id: 2,
            title: 'Member Removal Suggestion',
            submittedBy: 'Jollie Hall',
            type: 'Removal Proposal',
            votePercent: 40,
            color: '#F44336'
        },
        {
            id: 3,
            title: 'Branding Oracle Recruitment Suggestion',
            submittedBy: '0xDEAF...fB8B',
            type: 'Recruitment Proposal',
            votePercent: 60,
            color: '#FFA500'
        },
        {
            id: 4,
            title: 'UX/UI Skill Verification Request',
            submittedBy: '0xDEAF...fB8B',
            type: 'Skill Verification',
            votePercent: 20,
            color: '#F44336'
        },
        {
            id: 5,
            title: 'Web Development Oracle Update',
            submittedBy: '0xDEAF...fB8B',
            type: 'Recruitment Proposal',
            votePercent: 80,
            color: '#00C853'
        },
        {
            id: 6,
            title: 'Member Activity Review',
            submittedBy: 'Jollie Hall',
            type: 'Removal Proposal',
            votePercent: 30,
            color: '#F44336'
        },
    ]

    const titleOptions = [
        {
            title: 'Skill Oracle View',
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
                'Oracles',
                'Members',
                'Disputes',
                'Proposals'
            ]
        }
    ]

    const filterOptions = [
        {
            title: 'Table Columns',
            items: [
                'Request Title',
                'Submitted By',
                'Type',
                'Vote Submissions'
            ]
        },
        {
            title: 'Filter',
            items: [
                'All',
                'Eligibility Application',
                'Recruitment Proposal',
                'Removal Proposal',
                'Skill Verification'
            ]
        }
    ] 

    const tableData = useMemo(() => {
        return proposals.map((proposal) => {
            return [
                <div className="proposal-title">
                    <img src="/file-05.svg" alt="File Icon" className="fileIcon" />
                    <span>{proposal.title}</span>
                </div>,
                <div className="submitted-by">
                    <span>{proposal.submittedBy}</span>
                </div>,
                <div className="proposal-type">
                    <span>{proposal.type}</span>
                </div>,
                <div className="vote-progress">
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar-fill" 
                            style={{ 
                                width: `${proposal.votePercent}%`,
                                backgroundColor: proposal.color 
                            }}
                        />
                    </div>
                    <span className="vote-percentage">{proposal.votePercent}%</span>
                </div>,
                <div className="view-detail">
                    <DetailButton to={`/proposal-review/${proposal.id}`} title={'Review'} imgSrc="/view.svg" alt="review"/>
                </div>
            ];
        });
    }, [proposals])

    const indexOfLastProposal = currentPage * proposalsPerPage;
    const indexOfFirstProposal = indexOfLastProposal - proposalsPerPage;
    const currentProposals = tableData.slice(indexOfFirstProposal, indexOfLastProposal);

    const totalPages = Math.ceil(proposals.length / proposalsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="body-container">
            <div className="view-jobs-container">
                    <JobsTable
                        title={`OpenWork Ledger`}
                        backUrl="/governance"
                        tableData={currentProposals}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={paginate}
                        headers={headers}
                        titleOptions={titleOptions}
                        filterOptions={filterOptions}
                    />
            </div>
        </div>
    );
}