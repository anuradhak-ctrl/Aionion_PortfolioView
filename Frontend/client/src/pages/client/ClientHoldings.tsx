
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { getPortfolioData } from "@/services/portfolioService";

const TABS = ["Equity", "Mutual Funds", "Bonds"];

const equityData = [
    { security: "RELIANCE", name: "Reliance Industries", qty: 100, avgPrice: "₹2450", cmp: "₹2680", value: "₹2.68 L", pl: "+₹23,000", return: "+9.39%" },
    { security: "HDFCBANK", name: "HDFC Bank", qty: 150, avgPrice: "₹1580", cmp: "₹1720", value: "₹2.58 L", pl: "+₹21,000", return: "+8.86%" },
    { security: "INFY", name: "Infosys", qty: 200, avgPrice: "₹1450", cmp: "₹1580", value: "₹3.16 L", pl: "+₹26,000", return: "+8.97%" },
    { security: "TCS", name: "TCS", qty: 80, avgPrice: "₹3200", cmp: "₹3450", value: "₹2.76 L", pl: "+₹20,000", return: "+7.81%" },
    { security: "ICICIBANK", name: "ICICI Bank", qty: 250, avgPrice: "₹920", cmp: "₹1050", value: "₹2.63 L", pl: "+₹32,500", return: "+14.13%" },
];

const mfData = [
    { scheme: "Axis Bluechip Fund", folio: "AX123456", units: 1500, avgNav: "₹42.5", currNav: "₹48.2", value: "₹72,300", return: "+13.41%" },
    { scheme: "Mirae Asset Large Cap", folio: "MA789012", units: 2000, avgNav: "₹65.8", currNav: "₹78.5", value: "₹1.57 L", return: "+19.30%" },
    { scheme: "PPFAS Flexi Cap", folio: "PP345678", units: 1200, avgNav: "₹52", currNav: "₹61.8", value: "₹74,160", return: "+18.85%" },
];

const bondData = [
    { bond: "GOI 7.26% 2033", isin: "IN0020180034", qty: 5, price: "₹102.5", yield: "6.95%", value: "₹5.13 L", accrued: "+₹3,625", maturity: "2033-01-14" },
    { bond: "HDFC Ltd 7.95% 2026", isin: "INE001A07PQ5", qty: 3, price: "₹104.2", yield: "7.25%", value: "₹3.13 L", accrued: "+₹2,385", maturity: "2026-07-22" },
];

const getCellValue = (row: any, col: string) => {
    // Normalization map for specific columns
    const keyMap: Record<string, string> = {
        "Avg Price": "avgPrice",
        "Avg NAV": "avgNav",
        "Current NAV": "currNav",
        "P&L": "pl",
        "Return": "return"
    };

    if (keyMap[col]) return row[keyMap[col]];

    // Fallback to standard lowercase/trim
    return row[col.toLowerCase().replace(/\s/g, '')] || row[col.toLowerCase().replace(/\s/g, '_')] || row[col.toLowerCase()] || row[col];
};

function Table({ columns, data }: { columns: string[]; data: any[] }) {
    // Defensive check: ensure data is always an array
    const safeData = Array.isArray(data) ? data : [];

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left rounded-xl overflow-hidden">
                <thead>
                    <tr className="border-t border-b border-border">
                        {columns.map((col) => (
                            <th
                                key={col}
                                className="py-3 px-2 font-semibold text-muted-foreground text-xs bg-background/50 whitespace-nowrap"
                                style={(col === "Symbol" || col === "Security") ? { minWidth: '150px' } : {}}
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                    {safeData.map((row, i) => (
                        <tr key={i} className="hover:bg-primary/5 transition-colors duration-150 group">
                            {columns.map((col) => {
                                const val = getCellValue(row, col);

                                // Special Rendering Logic
                                if (col === "Symbol") {
                                    return (
                                        <td key={col} className="py-3 px-2">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground text-sm">{row.security || row.symbol}</span>
                                                {row.name && <span className="text-[10px] text-muted-foreground font-medium mt-0.5 max-w-[150px] truncate" title={row.name}>{row.name}</span>}
                                            </div>
                                        </td>
                                    );
                                }
                                if (col === "Scheme") {
                                    return (
                                        <td key={col} className="py-3 px-2">
                                            <span className="font-bold text-foreground text-sm">{val}</span>
                                        </td>
                                    );
                                }
                                if (col === "P&L" || col === "Yield" || col === "Accrued") {
                                    const isPos = typeof val === 'string' ? !val.startsWith('-') : val > 0;
                                    return (
                                        <td key={col} className={`py-3 px-2 text-sm font-medium ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {val}
                                        </td>
                                    );
                                }
                                if (col === "Bond") {
                                    return (
                                        <td key={col} className="py-3 px-2">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground text-sm">{row.bond}</span>
                                                {row.isin && <span className="text-[10px] text-muted-foreground font-medium mt-0.5">{row.isin}</span>}
                                            </div>
                                        </td>
                                    );
                                }
                                if (col === "Return") {
                                    const isPos = typeof val === 'string' ? !val.startsWith('-') : val > 0;
                                    return (
                                        <td key={col} className="py-3 px-2">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${isPos ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {val}
                                            </span>
                                        </td>
                                    );
                                }

                                // Default Render
                                return (
                                    <td key={col} className="py-3 px-2 text-xs font-medium text-foreground/80">
                                        {val}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function ClientHoldings() {
    const [tab, setTab] = useState(0);
    const [portfolioData, setPortfolioData] = useState<any[]>(() => {
        // Initialize with cached data if available
        const cached = localStorage.getItem('portfolioData');
        return cached ? JSON.parse(cached) : [];
    });
    // Loading is true only if we have NO data
    const [loading, setLoading] = useState(portfolioData.length === 0);
    const [isRefetching, setIsRefetching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset pagination when tab changes
    useEffect(() => {
        setCurrentPage(1);
    }, [tab]);

    // Get current tab data
    const getCurrentData = () => {
        if (tab === 0) return portfolioData;
        if (tab === 1) return mfData;
        if (tab === 2) return bondData;
        return [];
    };

    const currentData = getCurrentData();
    const totalPages = Math.ceil(currentData.length / itemsPerPage);
    const paginatedData = currentData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Pagination Controls Component (reused across tabs)
    const PaginationControls = () => {
        if (currentData.length <= itemsPerPage) return null;

        return (
            <div className="flex items-center justify-center gap-1 p-4 border-t border-border bg-muted/20">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                    ‹
                </button>

                {(() => {
                    const pages = [];
                    const showEllipsisStart = currentPage > 3;
                    const showEllipsisEnd = currentPage < totalPages - 2;

                    pages.push(
                        <button
                            key={1}
                            onClick={() => setCurrentPage(1)}
                            className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === 1
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            1
                        </button>
                    );

                    if (showEllipsisStart) {
                        pages.push(<span key="ellipsis-start" className="px-2 text-muted-foreground">...</span>);
                    }

                    const startPage = Math.max(2, currentPage - 1);
                    const endPage = Math.min(totalPages - 1, currentPage + 1);

                    for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i)}
                                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === i
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {i}
                            </button>
                        );
                    }

                    if (showEllipsisEnd) {
                        pages.push(<span key="ellipsis-end" className="px-2 text-muted-foreground">...</span>);
                    }

                    if (totalPages > 1) {
                        pages.push(
                            <button
                                key={totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === totalPages
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                {totalPages}
                            </button>
                        );
                    }

                    return pages;
                })()}

                <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                    ›
                </button>
            </div>
        );
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                if (portfolioData.length === 0) setLoading(true);
                else setIsRefetching(true);

                const response = await getPortfolioData();
                console.log("📦 Portfolio Response:", response);

                // Handle Syncing State (Keep Loading)
                if (response.status === 'syncing') {
                    console.log("⏳ Portfolio is syncing, retrying in 2s...");
                    setTimeout(fetchData, 2000);
                    return;
                }

                console.log("📦 Response.data type:", typeof response.data);
                console.log("📦 Response.data is Array:", Array.isArray(response.data));
                console.log("📦 Response.success:", response.success);

                // Check if fetch failed or data is not an array
                if (response.success === false || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
                    console.warn("⚠️ No portfolio data available:", response.message);
                    console.warn("⚠️ Response object:", JSON.stringify(response, null, 2));
                    setPortfolioData([]);
                    localStorage.removeItem('portfolioData'); // Clear invalid cache
                    setError(response.message || "No portfolio data available.");
                } else {
                    const newData = response.data || [];
                    console.log("✅ Setting portfolio data, length:", newData.length);
                    setPortfolioData(newData);
                    localStorage.setItem('portfolioData', JSON.stringify(newData));
                    setError(null); // Clear any previous errors
                }
            } catch (err: any) {
                console.error("❌ Failed to fetch portfolio:", err);
                console.error("❌ Error message:", err.message);
                console.error("❌ Error response:", err.response?.data);
                setPortfolioData([]);
                localStorage.removeItem('portfolioData'); // Clear cache on error
                setError("Unable to connect to server. Please check your connection.");
            } finally {
                setLoading(false);
                setIsRefetching(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <DashboardLayout role="client">
                <div className="flex items-center justify-center h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="client">
            <div className="max-w-7xl mx-auto w-full p-8">
                <div className="flex items-center gap-3 mb-6">
                    <h1 className="text-4xl font-display font-bold text-foreground">Holdings</h1>
                    {isRefetching && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mt-1"></div>}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{error}</span>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 mb-8">{TABS.map((t, i) => (
                    <button
                        key={t}
                        className={`px-5 py-2 rounded-full font-medium text-base transition-all duration-200 ${tab === i ? 'bg-primary text-white shadow-lg' : 'bg-background text-foreground border border-border hover:bg-primary/10'}`}
                        onClick={() => setTab(i)}
                    >
                        {t}
                    </button>
                ))}
                </div>
                <AnimatePresence mode="wait">
                    {tab === 0 && (
                        <motion.div
                            key="equity"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden"
                        >
                            {/* Header Section */}
                            <div className="p-6 pb-4 bg-background/50">
                                <h2 className="text-xl font-bold">Equity Holdings</h2>
                            </div>
                            {/* Table Section */}
                            <Table columns={["Symbol", "Qty", "Avg Price", "CMP", "Value", "P&L", "Return"]} data={paginatedData} />
                            <PaginationControls />
                            {portfolioData.length === 0 && <p className="p-6 text-center text-muted-foreground">No equity holdings found.</p>}
                        </motion.div>
                    )}
                    {tab === 1 && (
                        <motion.div
                            key="mf"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden"
                        >
                            {/* Header Section */}
                            <div className="p-6 pb-4 bg-background/50">
                                <h2 className="text-xl font-bold">Mutual Fund Holdings</h2>
                            </div>
                            {/* Table Section */}
                            <Table columns={["Scheme", "Folio", "Units", "Avg NAV", "Current NAV", "Value", "Return"]} data={paginatedData} />
                            <PaginationControls />
                        </motion.div>
                    )}
                    {tab === 2 && (
                        <motion.div
                            key="bonds"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden"
                        >
                            {/* Header Section */}
                            <div className="p-6 pb-4 bg-background/50">
                                <h2 className="text-xl font-bold">Bond Holdings</h2>
                            </div>
                            {/* Table Section */}
                            <Table columns={["Bond", "Qty", "Price", "Yield", "Value", "Accrued", "Maturity"]} data={paginatedData} />
                            <PaginationControls />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}
