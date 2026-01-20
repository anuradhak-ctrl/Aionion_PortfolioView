import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPortfolioData, getLedgerData, refreshPortfolioData } from "@/services/portfolioService";
import userService, { Client } from "@/services/userService";
import { Loader2, ChevronDown, Download } from "lucide-react";

// --- Types ---
type Tab = "Holdings" | "Ledger";

// --- Components ---
const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${active
            ? "bg-primary text-primary-foreground shadow-lg"
            : "bg-background text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
            }`}
    >
        {children}
    </button>
);

// --- Tab Content Components ---
const HoldingsTab = ({ clientId }: { clientId: string }) => {
    const [portfolioData, setPortfolioData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        const loadPortfolio = async () => {
            try {
                // First attempt: Try to get cached data
                const data = await getPortfolioData(clientId);
                console.log('Portfolio data received:', data);

                // Check if cache is empty (status: 'syncing' or data array is empty)
                if (data.status === 'syncing' || (data.data && data.data.length === 0 && data.timestamp === 0)) {
                    console.log('Cache miss detected, triggering refresh...');
                    // Trigger refresh in background
                    await refreshPortfolioData(clientId);

                    // Wait a moment for refresh to complete
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Fetch again to get fresh data
                    const refreshedData = await getPortfolioData(clientId);
                    console.log('Refreshed portfolio data:', refreshedData);
                    setPortfolioData(refreshedData);
                } else {
                    setPortfolioData(data);
                }
                setError(null);
            } catch (err: any) {
                console.error("Failed to load portfolio:", err);
                const errorMsg = err.response?.data?.message || err.message || "Failed to load portfolio data";
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };

        loadPortfolio();
    }, [clientId]);

    const holdings = portfolioData?.data || [];

    const handleDownload = () => {
        const headers = ["Security", "ISIN", "Quantity", "Average Price", "Current Price", "Value", "P&L", "Return %"];
        const csvContent = [
            headers.join(","),
            ...holdings.map((row: any) => [
                row.security,
                row.isin || "",
                row.qty,
                row.avgPrice,
                row.cmp,
                row.value,
                row.pl,
                row.return
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `holdings_${clientId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-red-500">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Failed to Load Holdings</h3>
                <p className="text-muted-foreground mb-2">{error}</p>
                <p className="text-sm text-muted-foreground">Check console for more details or try refreshing.</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="p-4 md:p-6 pb-4 bg-background/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">Holdings Report</h2>
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs md:text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap"
                    >
                        <Download className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="leading-none">Export</span>
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-t border-b border-border">
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50" style={{ minWidth: '200px' }}>Security</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">ISIN</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Quantity</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Average Price</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Current Price</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Value</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Unrealized P&L</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Return %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {holdings.map((h: any, i: number) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="py-5 px-6 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground text-base">{h.security}</span>
                                        {h.sector && <span className="text-xs text-muted-foreground font-medium mt-0.5">{h.sector}</span>}
                                    </div>
                                </td>
                                <td className="py-5 px-6 text-xs text-muted-foreground font-medium whitespace-nowrap">{h.isin || "-"}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap">{h.qty}</td>
                                <td className="py-5 px-6 text-right text-muted-foreground font-medium whitespace-nowrap">₹{h.avgPrice}</td>
                                <td className="py-5 px-6 text-right text-muted-foreground font-medium whitespace-nowrap">₹{h.cmp}</td>
                                <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">₹{h.value}</td>
                                <td className={`py-5 px-6 text-right font-bold text-base whitespace-nowrap ${parseFloat(h.pl) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    ₹{h.pl}
                                </td>
                                <td className="py-5 px-6 text-center whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${h.return?.startsWith('-') ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                        {h.return}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {holdings.length === 0 && (<tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No holdings found.</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const LedgerTab = ({ clientId }: { clientId: string }) => {
    const [ledgerData, setLedgerData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getLedgerData(clientId)
            .then(data => {
                setLedgerData(data);
                setError(null);
            })
            .catch((err: any) => {
                console.error("Failed to load ledger:", err);
                const errorMsg = err.response?.data?.message || err.message || "Failed to load ledger data";
                setError(errorMsg);
            })
            .finally(() => setLoading(false));
    }, [clientId]);

    const ledgerEntries = ledgerData?.data || [];

    const handleDownload = () => {
        const headers = ["Date", "Particulars", "Voucher No", "Debit", "Credit", "Balance", "Type", "Cost Center"];
        const csvContent = [
            headers.join(","),
            ...ledgerEntries.map((row: any) => [
                row.date || "",
                row.particulars || "",
                row.voucherNo || "",
                row.debit || "0",
                row.credit || "0",
                row.balance || "0",
                row.transType || "",
                row.costCenter || ""
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `ledger_${clientId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-12 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-red-500">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Failed to Load Ledger</h3>
                <p className="text-muted-foreground mb-2">{error}</p>
                <p className="text-sm text-muted-foreground">This client may not exist in the TechExcel system.</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="p-4 md:p-6 pb-4 bg-background/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">Ledger Report</h2>
                    <button
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs md:text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap"
                    >
                        <Download className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="leading-none">Export</span>
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-t border-b border-border">
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50" style={{ minWidth: '250px' }}>Particulars</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Voucher No</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Type</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Debit</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Credit</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Balance</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Cost Center</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {ledgerEntries.map((entry: any, i: number) => {
                            const isOpeningBalance = entry.particulars?.toLowerCase().includes('opening');
                            return (
                                <tr key={i} className={`hover:bg-muted/30 transition-colors ${isOpeningBalance ? 'font-bold bg-muted/20' : ''}`}>
                                    <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">{entry.date || "-"}</td>
                                    <td className="py-5 px-6 text-foreground whitespace-nowrap">{entry.particulars || "-"}</td>
                                    <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">{entry.voucherNo || "-"}</td>
                                    <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">{entry.transType || "-"}</td>
                                    <td className="py-5 px-6 text-right font-bold text-foreground whitespace-nowrap">₹{entry.debit || "0"}</td>
                                    <td className="py-5 px-6 text-right font-bold text-foreground whitespace-nowrap">₹{entry.credit || "0"}</td>
                                    <td className={`py-5 px-6 text-right font-bold whitespace-nowrap ${parseFloat(entry.balance || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        ₹{entry.balance || "0"}
                                    </td>
                                    <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">{entry.costCenter || "-"}</td>
                                </tr>
                            );
                        })}
                        {ledgerEntries.length === 0 && (<tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No ledger entries found.</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function RMReports() {
    const [activeTab, setActiveTab] = useState<Tab>("Holdings");
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        userService.getClients()
            .then(setClients)
            .catch(err => console.error("Failed to fetch clients:", err))
            .finally(() => setLoading(false));
    }, []);

    const selectedClientData = clients.find(c => (c.client_id || c.id) === selectedClient);

    return (
        <DashboardLayout role="rm">
            <div className="max-w-7xl mx-auto w-full p-8 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-display font-bold text-foreground">Reports</h1>
                </div>

                {/* Client Selector Card */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-foreground mb-1">Select Client</h2>
                            <p className="text-sm text-muted-foreground">Choose a client to view their reports</p>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-between w-[220px] px-4 py-3 bg-background hover:bg-muted/50 border border-border rounded-xl text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="truncate">{selectedClient ? selectedClientData?.name : "Select a client..."}</span>
                                <ChevronDown className="w-4 h-4 text-foreground ml-2 flex-shrink-0" />
                            </button>
                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-[220px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                                        {loading ? (
                                            <div className="p-4 text-center">
                                                <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
                                            </div>
                                        ) : (
                                            clients.map((client) => (
                                                <button
                                                    key={client.id}
                                                    onClick={() => { setSelectedClient(client.client_id || client.id); setIsDropdownOpen(false); }}
                                                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${selectedClient === (client.client_id || client.id) ? "text-emerald-500 bg-emerald-500/10 font-semibold" : "text-foreground hover:bg-muted"}`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span>{client.name}</span>
                                                        <span className="text-xs text-muted-foreground">{client.client_id || client.id}</span>
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {selectedClient ? (
                    <>
                        {/* Selected Client Info */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{selectedClientData?.name}</h2>
                                <p className="text-sm text-muted-foreground">Client ID: {selectedClient} • Status: {selectedClientData?.status || 'Unknown'}</p>
                            </div>
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ← Change Client
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex overflow-x-auto gap-3 mb-8 pb-2 no-scrollbar">
                            {(["Holdings", "Ledger"] as Tab[]).map((tab) => (
                                <div key={tab} className="shrink-0">
                                    <TabButton active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                                        {tab}
                                    </TabButton>
                                </div>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="min-h-[400px]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                >
                                    {activeTab === "Holdings" && <HoldingsTab clientId={selectedClient} />}
                                    {activeTab === "Ledger" && <LedgerTab clientId={selectedClient} />}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </>
                ) : (
                    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-muted-foreground">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Select a Client</h3>
                        <p className="text-muted-foreground">Please select a client from the dropdown above to view their reports.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
