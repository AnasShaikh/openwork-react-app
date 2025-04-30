import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Web3 from "web3";
import L1ABI from "../../L1ABI.json";
import JobsTable from "../../components/JobsTable/JobsTable";
import "./BrowseJobs.css";
import SkillBox from "../../components/SkillBox/SkillBox";
import DetailButton from "../../components/DetailButton/DetailButton";

const OptionItems = [
    'talent1','talent2','talent3',
]

export default function BrowseJobs() {
    //   const [jobs, setJobs] = useState([]);
    const [account, setAccount] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 5; // Number of jobs per page
    const [walletAddress, setWalletAddress] = useState("");
    const [loading, setLoading] = useState(true); // Loading state

    const headers = ["Job Title", "Posted by", "Skills Required", "Timeline", "Budget", ""];

    const jobs = [
        {
            id: 0,
            title: 'UI for OpenWork',
            postedBy: 'Mllie Hall',
            skills: 'UX Design',
            timeline: '3',
            budget: '7624.14'
        },
        {
            id: 1,
            title: 'UI for OpenWork',
            postedBy: 'Jollie Hall',
            skills: 'UX Design',
            timeline: '7',
            budget: '24.14'
        },
        {
            id: 2,
            title: 'UI for OpenWork',
            postedBy: 'Mllie Hall',
            skills: 'UX Design',
            timeline: '12',
            budget: '762'
        },
        {
            id: 2,
            title: 'UI for OpenWork',
            postedBy: 'Mllie Hall',
            skills: 'UX Design',
            timeline: '12',
            budget: '762'
        },
        {
            id: 2,
            title: 'UI for OpenWork',
            postedBy: 'Mllie Hall',
            skills: 'UX Design',
            timeline: '12',
            budget: '762'
        },
        {
            id: 2,
            title: 'UI for OpenWork',
            postedBy: 'Mllie Hall',
            skills: 'UX Design',
            timeline: '12',
            budget: '762'
        },
        {
            id: 2,
            title: 'UI for OpenWork',
            postedBy: 'Mllie Hall',
            skills: 'UX Design',
            timeline: '12',
            budget: '762'
        },
    ]

    const titleOptions = [
        {
            title : 'Jobs View',
            items: [
                'view1', 'view2'
            ]
        },
        {
            title : 'Initiated',
            items: [
                'initiated1', 'initiated2'
            ]
        }
    ]

    const filterOptions = [
        {
            title : 'Listings',
            items: [
                'listing1', 'listing2'
            ]
        },
        {
            title : 'Table Columns',
            items: [
                'column1', 'column2'
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
                <div>{job.postedBy}</div>,
                <div className="skills-required">
                    <SkillBox title={job.skills}/>
                    <SkillBox title="+2"/>
                </div>,
                <div>{job.timeline+" Weeks"}</div>,
                <div className="budget">
                    <span>{job.budget}</span>
                    <img src="/xdc.svg" alt="Budget" />
                </div>,
                <div className="view-detail">
                    <DetailButton to={`/job-details/${job.id}`} imgSrc="/view.svg" alt="detail"  />
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
