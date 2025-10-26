import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Web3 from "web3";
import GenesisABI from "../../ABIs/genesis_ABI.json";
import JobsTable from "../../components/JobsTable/JobsTable";
import "./SkillOracle.css";
import SkillBox from "../../components/SkillBox/SkillBox";
import DetailButton from "../../components/DetailButton/DetailButton";
import ProgressBar from "../../components/ProgressBar/ProgressBar";

export default function SkillOracle() {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 5;

    const headers = ["Member Name", "Rating", "Skills", "Experience", "Resolution Accuracy", ""];

    // Fetch oracle members from blockchain
    useEffect(() => {
        async function fetchOracleMembers() {
            try {
                setLoading(true);
                setError(null);

                const web3 = new Web3(import.meta.env.VITE_ARBITRUM_SEPOLIA_RPC_URL);
                const contractAddress = import.meta.env.VITE_GENESIS_CONTRACT_ADDRESS;
                const contract = new web3.eth.Contract(GenesisABI, contractAddress);

                console.log("Fetching all oracle names...");

                // Get all oracle names
                const oracleNames = await contract.methods.getAllOracleNames().call();
                console.log(`Found ${oracleNames.length} oracles:`, oracleNames);

                // Fetch members for each oracle
                const allMembers = [];
                
                for (const oracleName of oracleNames) {
                    try {
                        console.log(`Fetching members for oracle: ${oracleName}`);
                        const memberAddresses = await contract.methods.getOracleMembers(oracleName).call();
                        
                        console.log(`  Found ${memberAddresses.length} members in ${oracleName}`);
                        
                        // Add each member with their oracle
                        for (const address of memberAddresses) {
                            allMembers.push({
                                address: address,
                                oracle: oracleName,
                                // Extract skill from oracle name (e.g., "UX/UI Oracle" -> "UX/UI")
                                skill: oracleName.replace(/\s*Oracle\s*$/i, '').trim()
                            });
                        }
                    } catch (oracleError) {
                        console.error(`Error fetching members for ${oracleName}:`, oracleError);
                    }
                }

                console.log(`Total members across all oracles: ${allMembers.length}`);
                setMembers(allMembers);

            } catch (err) {
                console.error("Error fetching oracle members:", err);
                setError("Failed to load oracle members. Please try again later.");
            } finally {
                setLoading(false);
            }
        }

        fetchOracleMembers();
    }, []);

    const users = members.length > 0 ? members : [
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
            id: 2,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: '40'
        },
        {
            id: 3,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: '60'
        },
        {
            id: 4,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: '20'
        },
        {
            id: 5,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: '80'
        },
        {
            id: 6,
            name: 'Mollie Hall',
            rating: '4.9',
            skills: 'UX Design',
            experience: '4',
            prcent: '20'
        },
    ];

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
            title: 'Oracles',
            items: [
                'Oracles',
                'Members',
                'Disputes',
                'Proposals/Applications'
            ]
        }
    ];

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
            items: ['UX/UI Oracle', 'Web Dev Oracle', 'React Oracle', 'UX Design', 'Webflow']
        }
    ];

    const tableData = useMemo(() => {
        return users.map((user) => {
            // Handle both real oracle member data and dummy data
            const displayName = user.address 
                ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}`
                : user.name || 'Unknown';
            const displayRating = user.rating || '0.0';
            const displaySkill = user.skill || user.skills || 'N/A';
            const displayExperience = user.experience || '0';
            const displayPercent = user.prcent || '0';
            const profileLink = user.address ? `/profile/${user.address}` : '/profile';
            
            return [
                <div className="user">
                    <img src="/user.png" alt="User Icon" className="userIcon" />
                    <span title={user.address}>{displayName}</span>
                </div>,
                <div className="rating">
                    <span>{displayRating}</span>
                    <img src="/star.svg" alt="" />
                </div>,
                <div className="skills-required">
                    <SkillBox title={displaySkill} />
                    <SkillBox title="+2" />
                </div>,
                <div className="experience">{displayExperience + " Years"}</div>,
                <div className="hourly-rate experience-percent">
                    <ProgressBar percent={displayPercent} />
                </div>,
                <div className="view-detail">
                    <DetailButton to={profileLink} imgSrc="/view.svg" alt="detail" />
                </div>
            ];
        });
    }, [users]);

    // Calculate indices for pagination
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
                    tableData={currentUsers} // Pass only the current page's data
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
