import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Web3 from "web3";
import L1ABI from "../../L1ABI.json";
import JobsTable from "../../components/JobsTable/JobsTable";
import "./BrowseTalent.css";
import SkillBox from "../../components/SkillBox/SkillBox";
import DetailButton from "../../components/DetailButton/DetailButton";

export default function BrowseTalent() {
    //   const [jobs, setJobs] = useState([]);
    const [account, setAccount] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5; // Number of jobs per page
    const [walletAddress, setWalletAddress] = useState("");
    const [loading, setLoading] = useState(true); // Loading state

    const headers = ["Name", "Rating", "Skills", "Experience", "Hourly Rate", ""];

    const users = [
        {
            id: 0,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            hourly_rate: '30'
        },
        {
            id: 1,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            hourly_rate: '30'
        },
        {
            id: 0,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            hourly_rate: '30'
        },
        {
            id: 0,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            hourly_rate: '30'
        },
        {
            id: 0,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            hourly_rate: '30'
        },
        {
            id: 0,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            hourly_rate: '30'
        },
        {
            id: 0,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            hourly_rate: '30'
        },
    ]

    const titleOptions = [
        {
            title: 'Talent View',
            items: [
                'Jobs View',
                'Skill Oracle View',
                'Talent View',
                'DAO View'
            ]
        },
        {
            title: 'People',
            items: [
                'People',
                'Packages'
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
                'Hourly Rate'
            ]
        },
        {
            title: 'Filter',
            items: [
                'All',
                'Top Rated',
                'Available Now'
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
                <div className="hourly-rate">
                    <span>{user.hourly_rate + ' / Hr'}</span>
                    <img src="/xdc.svg" alt="Budget" />
                </div>,
                <div className="view-detail">
                    <DetailButton to={`/profile`} imgSrc="/view.svg" alt="detail" title="Profile" />
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
                        tableData={currentUsers}
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
