import React, { useEffect, useMemo, useState } from "react";
import JobsTable from "../../components/JobsTable/JobsTable";
import "./MembersSkillOracle.css";
import SkillBox from "../../components/SkillBox/SkillBox";
import DetailButton from "../../components/DetailButton/DetailButton";

export default function MembersSkillOracle() {
    //   const [jobs, setJobs] = useState([]);
    const [account, setAccount] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5; // Number of jobs per page
    const [walletAddress, setWalletAddress] = useState("");
    const [loading, setLoading] = useState(true); // Loading state

    const headers = ["Member Name", "Rating", "Skills", "Experience", "Resolution Accuracy", ""];

    const users = [
        {
            id: 0,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: 70,
            color: '#FFA500'
        },
        {
            id: 1,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: 90,
            color: '#00C853'
        },
        {
            id: 2,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: 40,
            color: '#F44336'
        },
        {
            id: 3,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: 60,
            color: '#FFA500'
        },
        {
            id: 4,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: 20,
            color: '#F44336'
        },
        {
            id: 5,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: 80,
            color: '#00C853'
        },
        {
            id: 0,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: '20'
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
            title: 'Members',
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
                'Name',
                'Rating',
                'Skills',
                'Experience',
                'Completion Rate'
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
        return users.map((user) => {
            return [
                <div className="user">
                    <img src="/user.png" alt="User Icon" className="userIcon" />
                    {user.name && <span>{user.name}</span>}
                </div>,
                <div className="rating">
                    <span>{user.rating}</span>
                    <img src="/star.svg" alt="" />
                </div>,
                <div className="skills-required">
                    <SkillBox title={user.skills}/>
                    <SkillBox title="+2"/>
                </div>,
                <div className="experience">{user.experience+" Years"}</div>,
                <div className="vote-progress">
                    <div className="progress-bar-container">
                        <div 
                            className="progress-bar-fill" 
                            style={{ 
                                width: `${user.prcent}%`,
                                backgroundColor: user.color 
                            }}
                        />
                    </div>
                    <span className="vote-percentage">{user.prcent}%</span>
                </div>,
                <div className="view-detail">
                    <DetailButton to={`/members-governance/0`} title={'Governance'} imgSrc="/view.svg" alt="detail"/>
                </div>
            ];
        });
    }, [users])

    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = tableData.slice(indexOfFirstUser, indexOfLastUser);

    const totalPages = Math.ceil(users.length / usersPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="body-container">
            <div className="view-jobs-container">
                    <JobsTable
                        title={`OpenWork Ledger`}
                        backUrl="/governance"
                        tableData={currentUsers}
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
