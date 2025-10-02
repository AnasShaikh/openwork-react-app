import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Web3 from "web3";
import contractABI from "../../ABIs/nowjc_ABI.json";
import JobsTable from "../../components/JobsTable/JobsTable";
import "./BrowseJobs.css";
import SkillBox from "../../components/SkillBox/SkillBox";
import DetailButton from "../../components/DetailButton/DetailButton";

const CONTRACT_ADDRESS = "0x3C597eae77aD652a20E3B54B5dE9D89c9c7016E3";
const OP_SEPOLIA_RPC = "https://sepolia.optimism.io";

export default function BrowseJobs() {
    const [jobs, setJobs] = useState([]);
    const [account, setAccount] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const jobsPerPage = 5;
    const [walletAddress, setWalletAddress] = useState("");
    const [loading, setLoading] = useState(true);
    const [web3, setWeb3] = useState(null);
    const [contract, setContract] = useState(null);

    const headers = [
        "Job Title",
        "Posted by",
        "Skills Required",
        "Timeline",
        "Budget",
        "",
    ];

    const titleOptions = [
        {
            title: "Jobs View",
            items: ["view1", "view2"],
        },
        {
            title: "Initiated",
            items: ["initiated1", "initiated2"],
        },
    ];

    const filterOptions = [
        {
            title: "Listings",
            items: ["listing1", "listing2"],
        },
        {
            title: "Table Columns",
            items: ["column1", "column2"],
        },
    ];

    // Initialize Web3 and contract
    useEffect(() => {
        const initWeb3 = async () => {
            try {
                const web3Instance = new Web3(OP_SEPOLIA_RPC);
                const contractInstance = new web3Instance.eth.Contract(
                    contractABI,
                    CONTRACT_ADDRESS,
                );

                setWeb3(web3Instance);
                setContract(contractInstance);
            } catch (error) {
                console.error("Error initializing Web3:", error);
                setLoading(false);
            }
        };

        initWeb3();
    }, []);

    // Fetch job data from contract
    useEffect(() => {
        const fetchJobs = async () => {
            if (!contract) return;

            try {
                setLoading(true);

                // Get all job IDs
                const jobIds = await contract.methods.getAllJobIds().call();
                console.log("Job IDs:", jobIds);

                if (jobIds.length === 0) {
                    setJobs([]);
                    setLoading(false);
                    return;
                }

                // Fetch detailed data for each job
                const jobPromises = jobIds.map(async (jobId) => {
                    try {
                        const jobData = await contract.methods
                            .getJob(jobId)
                            .call();

                        // Fetch job poster profile
                        let posterProfile = null;
                        try {
                            posterProfile = await contract.methods
                                .getProfile(jobData.jobGiver)
                                .call();
                        } catch (profileError) {
                            console.warn(
                                `Profile not found for ${jobData.jobGiver}:`,
                                profileError,
                            );
                        }

                        // Fetch and parse IPFS data for job details
                        let jobDetails = null;
                        try {
                            if (jobData.jobDetailHash) {
                                const ipfsResponse = await fetch(
                                    `https://gateway.pinata.cloud/ipfs/${jobData.jobDetailHash}`,
                                );
                                if (ipfsResponse.ok) {
                                    jobDetails = await ipfsResponse.json();
                                }
                            }
                        } catch (ipfsError) {
                            console.warn(
                                `Failed to fetch IPFS data for job ${jobId}:`,
                                ipfsError,
                            );
                        }

                        // Calculate total budget from milestones
                        const totalBudget = jobData.milestonePayments.reduce(
                            (sum, milestone) => {
                                return sum + parseFloat(milestone.amount);
                            },
                            0,
                        );

                        // Format budget (assuming USDT with 6 decimals)
                        const formattedBudget = (totalBudget / 1000000).toFixed(
                            2,
                        );

                        // Extract poster name (truncate address if no profile)
                        let posterName =
                            jobData.jobGiver.slice(0, 6) +
                            "..." +
                            jobData.jobGiver.slice(-4);
                        if (posterProfile && posterProfile.ipfsHash) {
                            try {
                                const profileResponse = await fetch(
                                    `https://gateway.pinata.cloud/ipfs/${posterProfile.ipfsHash}`,
                                );
                                if (profileResponse.ok) {
                                    const profileData =
                                        await profileResponse.json();
                                    posterName = profileData.name || posterName;
                                }
                            } catch (profileError) {
                                console.warn(
                                    "Failed to fetch profile IPFS data:",
                                    profileError,
                                );
                            }
                        }

                        // Extract skills and timeline from job details
                        const skills = jobDetails?.skills || ["General"];
                        const timeline = jobDetails?.timeline || "TBD";

                        return {
                            id: jobId,
                            title: jobDetails?.title || "Untitled Job",
                            postedBy: posterName,
                            jobGiver: jobData.jobGiver,
                            skills: Array.isArray(skills) ? skills : [skills],
                            timeline: timeline,
                            budget: formattedBudget,
                            status: jobData.status,
                            milestoneCount: jobData.milestonePayments.length,
                            applicantCount: jobData.applicants.length,
                            rawJobData: jobData,
                            jobDetails: jobDetails,
                        };
                    } catch (jobError) {
                        console.error(`Error fetching job ${jobId}:`, jobError);
                        return null;
                    }
                });

                const resolvedJobs = await Promise.all(jobPromises);
                const validJobs = resolvedJobs.filter((job) => job !== null);

                // Sort by newest first (assuming job IDs are sequential)
                validJobs.sort((a, b) => b.id.localeCompare(a.id));

                setJobs(validJobs);
            } catch (error) {
                console.error("Error fetching jobs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [contract]);

    // Transform job data for table display
    const tableData = useMemo(() => {
        return jobs.map((job) => {
            const primarySkill =
                job.skills && job.skills.length > 0 ? job.skills[0] : "General";
            const additionalSkillsCount =
                job.skills && job.skills.length > 1 ? job.skills.length - 1 : 0;

            return [
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "8px",
                    }}
                >
                    <img
                        src="/doc.svg"
                        alt="Document Icon"
                        className="docIcon"
                        style={{ marginTop: "2px", flexShrink: 0 }}
                    />
                    {job.title && (
                        <span
                            style={{
                                lineHeight: "1.4",
                                wordBreak: "break-word",
                                hyphens: "auto",
                                maxWidth: "200px",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                            title={job.title} // Show full title on hover
                        >
                            {job.title}
                        </span>
                    )}
                </div>,
                <div title={job.jobGiver}>{job.postedBy}</div>,
                <div className="skills-required">
                    <SkillBox title={primarySkill} />
                    {additionalSkillsCount > 0 && (
                        <SkillBox title={`+${additionalSkillsCount}`} />
                    )}
                </div>,
                <div>
                    {typeof job.timeline === "string"
                        ? job.timeline
                        : `${job.timeline} Weeks`}
                </div>,
                <div className="budget">
                    <span>{job.budget}</span>
                    <img src="/xdc.svg" alt="Budget" />
                </div>,
                <div className="view-detail">
                    <DetailButton
                        to={`/job-details/${job.id}`}
                        imgSrc="/view.svg"
                        alt="detail"
                    />
                </div>,
            ];
        });
    }, [jobs]);

    const indexOfLastJob = currentPage * jobsPerPage;
    const indexOfFirstJob = indexOfLastJob - jobsPerPage;
    const currentJobs = tableData.slice(indexOfFirstJob, indexOfLastJob);

    const totalPages = Math.ceil(jobs.length / jobsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    if (loading) {
        return (
            <div className="loading-containerT">
                <div className="loading-icon">
                    <img src="/OWIcon.svg" alt="Loading..." />
                </div>
                <div className="loading-message">
                    <h1 id="txText">Loading Jobs...</h1>
                    <p id="txSubtext">
                        Fetching job data from the blockchain. Please wait...
                    </p>
                </div>
            </div>
        );
    }

    if (!loading && jobs.length === 0) {
        return (
            <div className="body-container">
                <div className="view-jobs-container">
                    <JobsTable
                        title={"OpenWork Ledger"}
                        tableData={[]}
                        currentPage={1}
                        totalPages={1}
                        onPageChange={() => {}}
                        headers={headers}
                        titleOptions={titleOptions}
                        filterOptions={filterOptions}
                    />
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            height: "200px",
                            fontSize: "16px",
                            color: "#666",
                            marginTop: "20px",
                        }}
                    >
                        <p>No jobs found on the blockchain.</p>
                        <Link
                            to="/post-job"
                            style={{
                                marginTop: "15px",
                                color: "#007bff",
                                textDecoration: "none",
                                fontWeight: "500",
                            }}
                        >
                            Be the first to post a job!
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

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
