import React, { useEffect, useMemo, useState } from "react";
import JobsTable from "../../components/JobsTable/JobsTable";
import "./DAOMembers.css";
import DetailButton from "../../components/DetailButton/DetailButton";

export default function DAOMembers() {
    const [account, setAccount] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const membersPerPage = 5; // Number of members per page
    const [walletAddress, setWalletAddress] = useState("");
    const [loading, setLoading] = useState(true); // Loading state

    const headers = ["Member Name", "Proposals Created", "Proposals Voted on", "Last Activity", "Wallet Address", "Tokens Staked"];

    const members = [
        {
            id: 0,
            name: 'Mollie Hall',
            proposalsCreated: 23,
            proposalsVoted: 23,
            lastActivity: '10 days ago',
            walletAddress: '0912412jg...1sg',
            tokensStaked: 129487
        },
        {
            id: 1,
            name: 'Jollie Hall',
            proposalsCreated: 51,
            proposalsVoted: 51,
            lastActivity: '10 days ago',
            walletAddress: '0912412jg...1sg',
            tokensStaked: 5215555
        },
        {
            id: 2,
            name: 'Mollie Hall',
            proposalsCreated: 2,
            proposalsVoted: 2,
            lastActivity: '10 days ago',
            walletAddress: '0912412jg...1sg',
            tokensStaked: 12511111
        },
        {
            id: 3,
            name: 'Jollie Hall',
            proposalsCreated: 5,
            proposalsVoted: 5,
            lastActivity: '10 days ago',
            walletAddress: '0912412jg...1sg',
            tokensStaked: 52512636
        },
        {
            id: 4,
            name: 'Mollie Hall',
            proposalsCreated: 611,
            proposalsVoted: 611,
            lastActivity: '10 days ago',
            walletAddress: '0912412jg...1sg',
            tokensStaked: 216263626
        }
    ]

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
            title: 'Members',
            items: [
                'Members',
                'Proposals'
            ]
        }
    ]

    const filterOptions = [
        {
            title: 'Table Columns',
            items: [
                'Member Name',
                'Proposals Created',
                'Proposals Voted on',
                'Last Activity',
                'Wallet Address',
                'Tokens Staked'
            ]
        },
        {
            title: 'Filter',
            items: [
                'All',
                'Active',
                'Inactive'
            ]
        }
    ] 

    const tableData = useMemo(() => {
        return members.map((member) => {
            return [
                <div className="member-name">
                    <img src="/avatar-profile.png" alt="User Icon" className="userIcon" />
                    {member.name && <span>{member.name}</span>}
                </div>,
                <div className="proposals-created">
                    <span>{member.proposalsCreated}</span>
                </div>,
                <div className="proposals-voted">
                    <span>{member.proposalsVoted}</span>
                </div>,
                <div className="last-activity">
                    <span>{member.lastActivity}</span>
                </div>,
                <div className="wallet-address">
                    <span>{member.walletAddress}</span>
                </div>,
                <div className="tokens-staked">
                    <span>{member.tokensStaked.toLocaleString()}</span>
                    <img src="/openwork-token.svg" alt="OW Token" className="tokenIcon" />
                </div>
            ];
        });
    }, [members])

    const indexOfLastMember = currentPage * membersPerPage;
    const indexOfFirstMember = indexOfLastMember - membersPerPage;
    const currentMembers = tableData.slice(indexOfFirstMember, indexOfLastMember);

    const totalPages = Math.ceil(members.length / membersPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="body-container">
            <div className="view-jobs-container">
                    <JobsTable
                        title={`OpenWork Ledger`}
                        backUrl="/governance"
                        tableData={currentMembers}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={paginate}
                        headers={headers}
                        titleOptions={titleOptions}
                        filterOptions={filterOptions}
                        addMember={true}
                    />
            </div>
        </div>
    );
}