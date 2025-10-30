import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Web3 from "web3";
import L1ABI from "../../L1ABI.json";
import JobsTable from "../../components/JobsTable/JobsTable";
import "./ProfileJobs.css";
import SkillBox from "../../components/SkillBox/SkillBox";
import DetailButton from "../../components/DetailButton/DetailButton";

const OptionItems = [
    'talent1','talent2','talent3',
]

function JobStatus({status}) {
    return (
        <div className={`job-status ${status}`}>
            {status}
        </div>
    )
}

export default function ProfileJobs() {
    //   const [jobs, setJobs] = useState([]);
    const [account, setAccount] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 5; // Number of jobs per page
    const [walletAddress, setWalletAddress] = useState("");
    const [loading, setLoading] = useState(true); // Loading state

    const headers = ["Job Title", "From", "To", "Status", "Amount", ""];

    const jobs = [
        {
            id: 0,
            title: 'UI for OpenWork',
            from: 'Me',
            to: 'Mllie Hall',
            status: 'Disputed',
            amount: '7624.14'
        },
        {
            id: 1,
            title: 'UI for OpenWork',
            from: 'Me',
            to: 'Mllie Hall',
            status: 'Ongoing',
            amount: '24.14'
        },
        {
            id: 2,
            title: 'UI for OpenWork',
            from: 'Mllie Hall',
            to: 'Me',
            status: 'Disputed',
            amount: '762'
        },
        {
            id: 2,
            title: 'UI for OpenWork',
            from: 'Me',
            to: 'Mllie Hall',
            status: 'Complete',
            amount: '762'
        },
        {
            id: 2,
            title: 'UI for OpenWork',
            from: 'Mllie Hall',
            to: 'Me',
            status: 'Ongoing',
            amount: '762'
        },
        {
            id: 2,
            title: 'UI for OpenWork',
            from: 'Mllie Hall',
            to: 'Me',
            status: 'Disputed',
            amount: '762'
        },
        {
            id: 2,
            title: 'UI for OpenWork',
            from: 'Me',
            to: 'Mllie Hall',
            status: 'Disputed',
            amount: '762'
        },
    ]

    const titleOptions = [
        {
            title: 'Jobs View',
            items: [
                'Jobs View',
                'Skill Oracle View',
                'Talent View',
                'DAO View'
            ]
        },
        {
            title: 'Initiated',
            items: [
                'Listings',
                'Initiated',
                'Applications'
            ]
        }
    ]

    const filterOptions = [
        {
            title: 'Table Columns',
            items: [
                'Title',
                'From',
                'To',
                'Status',
                'Amount'
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
    ] 

    const tableData = useMemo(() => {
        return jobs.map((job) => {
            return [
                <div>
                    <img src="/doc.svg" alt="Document Icon" className="docIcon" />
                    {job.title && <span>{job.title}</span>}
                </div>,
                <div className="job-from">
                    <span>{job.from}</span>
                    <img src="/arrow-circle-right.svg" alt="" />
                </div>,
                <div className="skills-required">
                    {job.to}
                </div>,
                <div className="">
                    <JobStatus status={job.status} />
                </div>,
                <div className="budget">
                    <span>{job.amount}</span>
                    <img src="/xdc.svg" alt="Budget" />
                </div>,
                <div className="view-detail">
                    <DetailButton to={`/view-job-details/${job.id}`} imgSrc="/view.svg" alt="detail"  />
                </div>
            ];
        });
    }, [jobs])

    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = tableData.slice(indexOfFirstJob, indexOfLastJob);

    const totalPages = Math.ceil(jobs.length / jobsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="body-container">
            <div className="view-jobs-container">
                    <JobsTable
                        title={"OpenWork Ledger"}
                        tableData={currentJobs}
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
