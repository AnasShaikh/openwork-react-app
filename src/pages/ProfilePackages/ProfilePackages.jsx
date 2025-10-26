import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import JobsTable from "../../components/JobsTable/JobsTable";
import Button from "../../components/Button/Button";
import "./ProfilePackages.css";

export default function ProfilePackages() {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const packagesPerPage = 4; // Number of packages per page
    
    const handleCopyToClipboard = (address) => {
        navigator.clipboard
            .writeText(address)
            .then(() => {
                alert("Address copied to clipboard");
            })
            .catch((err) => {
                console.error("Failed to copy: ", err);
            });
    };

    function formatWalletAddress(address) {
        if (!address) return "";
        const start = address.substring(0, 6);
        const end = address.substring(address.length - 4);
        return `${start}....${end}`;
    }

    const headers = ["Title", "Posted by", "Rating", "Category", "Cost", ""];

    const packages = [
        {
            id: 0,
            title: 'Branding Package',
            postedBy: 'molliehall2504',
            rating: 4.9,
            categories: ['UX Design', '+5'],
            cost: '7624.14',
            icon: '/browseJobs.svg'
        },
        {
            id: 1,
            title: 'React WebApp Deve...',
            postedBy: 'molliehall2504',
            rating: 3.2,
            categories: ['Webflow', '+2'],
            cost: '24.14',
            icon: '/doc.svg'
        },
        {
            id: 2,
            title: 'UI Design Package',
            postedBy: 'molliehall2504',
            rating: 4.9,
            categories: ['UX Design', '+6'],
            cost: '762',
            icon: '/browseJobs.svg'
        },
        {
            id: 3,
            title: 'UI for OpenWork',
            postedBy: 'molliehall2504',
            rating: 4.9,
            categories: ['UX Design', '+5'],
            cost: '7624.14',
            icon: '/doc.svg'
        },
    ];

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
            title: 'Packages',
            items: [
                'People',
                'Packages'
            ]
        }
    ];

    const filterOptions = [
        {
            title: 'Table Columns',
            items: [
                'Title',
                'Posted by',
                'Rating',
                'Category',
                'Cost'
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
    ];

    const tableData = useMemo(() => {
        return packages.map((pkg) => {
            return [
                <div className="package-title-cell">
                    <img src={pkg.icon} alt="Package Icon" className="packageIcon" />
                    <span>{pkg.title}</span>
                </div>,
                <div className="posted-by-cell">
                    <span>{pkg.postedBy}</span>
                </div>,
                <div className="rating-cell">
                    <span className="rating-value">{pkg.rating}</span>
                    <img src="/star.svg" alt="Star" className="star-icon" />
                </div>,
                <div className="category-cell">
                    {pkg.categories.map((category, index) => (
                        <div key={index} className="category-badge">
                            {category}
                        </div>
                    ))}
                </div>,
                <div className="cost-cell">
                    <span>{pkg.cost}</span>
                    <img src="/xdc.svg" alt="XDC" className="xdc-icon" />
                </div>,
                <div className="details-cell">
                    <Button 
                        label="Details" 
                        icon="/assets/eye-icon.svg" 
                        buttonCss="package-details-button"
                        onClick={() => navigate(`/view-package/${pkg.id}`)}
                    />
                </div>
            ];
        });
    }, [packages, navigate]);

    const indexOfLastPackage = currentPage * packagesPerPage;
    const indexOfFirstPackage = indexOfLastPackage - packagesPerPage;
    const currentPackages = tableData.slice(indexOfFirstPackage, indexOfLastPackage);

    const totalPages = Math.ceil(packages.length / packagesPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    React.useEffect(() => {
        document.body.classList.add('profile-packages-page');
        return () => {
            document.body.classList.remove('profile-packages-page');
        };
    }, []);

    return (
        <div className="body-container">
            <div className="newTitle">
                <div className="titleTop">
                    <Link className="goBack" to={`/profile`}>
                        <img className="goBackImage" src="/back.svg" alt="Back Button" />
                    </Link>
                    <div className="titleText">molliehall2504</div>
                </div>
                <div className="titleBottom">
                    <p>Contract ID: {formatWalletAddress("0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d")}</p>
                    <img
                        src="/copy.svg"
                        className="copyImage"
                        alt="Copy"
                        onClick={() =>
                            handleCopyToClipboard("0xdEF4B440acB1B11FDb23AF24e099F6cAf3209a8d")
                        }
                    />
                </div>
            </div>
            
            <div className="view-jobs-container">
                <JobsTable
                    title={"OpenWork Ledger"}
                    tableData={currentPackages}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={paginate}
                    headers={headers}
                    titleOptions={titleOptions}
                    filterOptions={filterOptions}
                    applyNow={false}
                    backUrl="/profile"
                    hideBackButton={true}
                    hidePostJob={true}
                />
            </div>
        </div>
    );
}
