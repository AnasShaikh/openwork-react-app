import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import JobsTable from "../../components/JobsTable/JobsTable";
import "./SkillOracle.css";
import SkillBox from "../../components/SkillBox/SkillBox";
import DetailButton from "../../components/DetailButton/DetailButton";
import { fetchAllOracleData } from "../../services/oracleService";

export default function SkillOracle() {
    const [oracleData, setOracleData] = useState({ oracles: [], members: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const oraclesPerPage = 5;

    // Column configuration — oracle-centric view
    const allColumns = [
        { id: "oracleName", label: "Oracle Name", required: true },
        { id: "description", label: "Description", required: false },
        { id: "totalMembers", label: "Members", required: false },
        { id: "activeMembers", label: "Active Members", required: false },
        { id: "status", label: "Status", required: false },
        { id: "actions", label: "", required: true },
    ];

    const [selectedColumns, setSelectedColumns] = useState([
        "oracleName",
        "description",
        "totalMembers",
        "activeMembers",
        "status",
        "actions",
    ]);

    const headers = selectedColumns.map(colId => {
        const column = allColumns.find(col => col.id === colId);
        return column ? column.label : "";
    });

    const handleColumnToggle = (columnId) => {
        setSelectedColumns(prev => {
            const isCurrentlySelected = prev.includes(columnId);
            const column = allColumns.find(col => col.id === columnId);
            if (column?.required) return prev;
            if (isCurrentlySelected) {
                if (prev.length <= 3) return prev;
                return prev.filter(id => id !== columnId);
            } else {
                if (prev.length >= 6) return prev;
                const allColumnIds = allColumns.map(col => col.id);
                return allColumnIds.filter(id => prev.includes(id) || id === columnId);
            }
        });
    };

    useEffect(() => {
        async function loadOracleData() {
            try {
                setLoading(true);
                setError(null);
                const data = await fetchAllOracleData();
                setOracleData(data);
            } catch (err) {
                console.error("Error loading oracle data:", err);
                setError(err.message || "Failed to load oracle data. Please check your RPC connection.");
            } finally {
                setLoading(false);
            }
        }
        loadOracleData();
    }, []);

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
                'Applications',
                'Ask Athena',
            ]
        }
    ];

    const filterOptions = useMemo(() => {
        return [
            {
                title: 'Table Columns',
                items: allColumns
                    .filter(col => !col.required && col.label)
                    .map(col => col.label)
            },
            {
                title: 'Filter',
                items: ['All', 'Active', 'Inactive']
            }
        ];
    }, []);

    // Oracle-centric table rows
    const tableData = useMemo(() => {
        const oracles = oracleData.oracles || [];

        if (oracles.length === 0) {
            return [[
                <div colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#868686' }}>
                    {loading ? 'Loading Oracles...' : 'No oracles found'}
                </div>
            ]];
        }

        return oracles.map((oracle) => {
            const allColumnData = {
                oracleName: (
                    <div className="user">
                        <span title={oracle.name}>{oracle.name}</span>
                    </div>
                ),
                description: (
                    <div className="experience" title={oracle.shortDescription}>
                        {oracle.shortDescription
                            ? oracle.shortDescription.length > 60
                                ? oracle.shortDescription.slice(0, 60) + '…'
                                : oracle.shortDescription
                            : '—'}
                    </div>
                ),
                totalMembers: (
                    <div className="voting-power">
                        <span>{oracle.totalMembers ?? 0}</span>
                    </div>
                ),
                activeMembers: (
                    <div className="voting-power">
                        <span>{oracle.activeMemberCount ?? 0}</span>
                    </div>
                ),
                status: (
                    <div className={`status-badge ${oracle.isActive ? 'active' : 'inactive'}`}>
                        <span>{oracle.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                ),
                actions: (
                    <div className="view-detail">
                        <DetailButton to={`/skill-oracles/${oracle.name}`} imgSrc="/view.svg" alt="detail" />
                    </div>
                ),
            };

            return selectedColumns.map(columnId => allColumnData[columnId]);
        });
    }, [oracleData.oracles, selectedColumns, loading]);

    const indexOfLastOracle = currentPage * oraclesPerPage;
    const indexOfFirstOracle = indexOfLastOracle - oraclesPerPage;
    const currentOracles = tableData.slice(indexOfFirstOracle, indexOfLastOracle);

    const totalPages = Math.ceil((oracleData.oracles?.length || 0) / oraclesPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="body-container">
            <div className="view-jobs-container skill-oracle-page">
                <JobsTable
                    title={`OpenWork Ledger`}
                    backUrl="/governance"
                    tableData={currentOracles}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={paginate}
                    headers={headers}
                    titleOptions={titleOptions}
                    filterOptions={filterOptions}
                    applyNow={true}
                    selectedColumns={selectedColumns}
                    onColumnToggle={handleColumnToggle}
                    allColumns={allColumns}
                />
            </div>
        </div>
    );
}
