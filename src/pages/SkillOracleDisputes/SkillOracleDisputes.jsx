import React, { useEffect, useMemo, useState } from "react";
import JobsTable from "../../components/JobsTable/JobsTable";
import "./SkillOracleDisputes.css";
import DetailButton from "../../components/DetailButton/DetailButton";

export default function SkillOracleDisputes() {
    const [account, setAccount] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const disputesPerPage = 5; // Number of disputes per page
    const [walletAddress, setWalletAddress] = useState("");
    const [loading, setLoading] = useState(true); // Loading state

    const headers = ["Request Title", "Proposed By", "Role", "Vote Submissions", "Amount", ""];

    const disputes = [
        {
            id: "0x1234",
            title: 'OpenWork UX/UI',
            proposedBy: '0xDEAF...fB8B',
            role: 'Job Giver',
            voteSubmissions: 70,
            amount: '7624.14',
            color: "#FFA500"
        },
        {
            id: "0x2345",
            title: 'OpenWork UX/UI',
            proposedBy: '0xDEAF...fB8B',
            role: 'Job Taker',
            voteSubmissions: 90,
            amount: '24.14',
            color: "#00C853"
        },
        {
            id: "0x3456",
            title: 'OpenWork UX/UI',
            proposedBy: 'Jollie Hall',
            role: 'Job Giver',
            voteSubmissions: 40,
            amount: '762',
            color: "#F44336"
        },
        {
            id: "0x4567",
            title: 'OpenWork UX/UI',
            proposedBy: 'Jollie Hall',
            role: 'Job Giver',
            voteSubmissions: 40,
            amount: '762',
            color: "#F44336"
        },
        {
            id: "0x5678",
            title: 'OpenWork UX/UI',
            proposedBy: '0xDEAF...fB8B',
            role: 'Job Taker',
            voteSubmissions: 60,
            amount: '624.14',
            color: "#FFA500"
        },
        {
            id: "0x6789",
            title: 'Web Development Dispute',
            proposedBy: '0xDEAF...fB8B',
            role: 'Job Giver',
            voteSubmissions: 80,
            amount: '1024.50',
            color: "#00C853"
        },
        {
            id: "0x7890",
            title: 'Smart Contract Review',
            proposedBy: 'Jollie Hall',
            role: 'Job Taker',
            voteSubmissions: 30,
            amount: '500.00',
            color: "#F44336"
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
            title: 'Disputes',
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
                'Proposed By',
                'Role',
                'Vote Submissions',
                'Amount'
            ]
        },
        {
            title: 'Filter',
            items: [
                'All',
                'Job Giver',
                'Job Taker',
                'Oracle Member'
            ]
        }
    ] 

    const tableData = useMemo(() => {
        return disputes.map((dispute) => {
            return [
                <div className="dispute-title">
                    <img src="/file-05.svg" alt="File Icon" className="fileIcon" />
                    <span>{dispute.title}</span>
                </div>,
                <div className="proposed-by">
                    <span>{dispute.proposedBy}</span>
                </div>,
                <div className="dispute-role">
                    <span>{dispute.role}</span>
                </div>,
                <div className="vote-progress">
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar-fill" 
                            style={{ 
                                width: `${dispute.voteSubmissions}%`,
                                backgroundColor: dispute.color 
                            }}
                        />
                    </div>
                    <span className="vote-percentage">{dispute.voteSubmissions}%</span>
                </div>,
                <div className="dispute-amount">
                    <span>{dispute.amount}</span>
                    <img src="/usdc.svg" alt="USDC" className="currencyIcon" />
                </div>,
                <div className="view-detail">
                    <DetailButton to={`/dispute-view/${dispute.id}`} title={'View'} imgSrc="/view.svg" alt="view"/>
                </div>
            ];
        });
    }, [disputes])

    const indexOfLastDispute = currentPage * disputesPerPage;
    const indexOfFirstDispute = indexOfLastDispute - disputesPerPage;
    const currentDisputes = tableData.slice(indexOfFirstDispute, indexOfLastDispute);

    const totalPages = Math.ceil(disputes.length / disputesPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="body-container">
            <div className="view-jobs-container">
                    <JobsTable
                        title={`OpenWork Ledger`}
                        backUrl="/governance"
                        tableData={currentDisputes}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={paginate}
                        headers={headers}
                        titleOptions={titleOptions}
                        filterOptions={filterOptions}
                        applyNow={true}
                    />
            </div>
        </div>
    );
}