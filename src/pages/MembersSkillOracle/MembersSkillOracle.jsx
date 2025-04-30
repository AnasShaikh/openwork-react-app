import React, { useEffect, useMemo, useState } from "react";
import JobsTable from "../../components/JobsTable/JobsTable";
import "./MembersSkillOracle.css";
import SkillBox from "../../components/SkillBox/SkillBox";
import DetailButton from "../../components/DetailButton/DetailButton";
import ProgressBar from "../../components/ProgressBar/ProgressBar";

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
            prcent: '70'
        },
        {
            id: 1,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: '90'
        },
        {
            id: 0,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: '40'
        },
        {
            id: 0,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: '60'
        },
        {
            id: 0,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: '20'
        },
        {
            id: 0,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: '80'
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
            title : 'Skill Oracle View',
            items: [
                'view1', 'view2'
            ]
        },
        {
            title : 'Members',
            items: [
                'initiated1', 'initiated2'
            ]
        }
    ]

    const filterOptions = [
        {
            title : 'Table Columns',
            items: [
                'column1', 'column2'
            ]
        },
        {
            title : 'Filter',
            items: [
                'column1', 'column2'
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
                <div className="hourly-rate experience-percent">
                    <ProgressBar percent={user.prcent}/>
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
