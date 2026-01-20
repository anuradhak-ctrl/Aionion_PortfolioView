import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { getPortfolioData } from "@/services/portfolioService";
import userService, { Client } from "@/services/userService";
import { ChevronDown, Users, Eye, Loader2, TrendingUp, TrendingDown } from "lucide-react";

// --- Types ---
type HoldingsTab = "Equity" | "Mutual Funds" | "Bonds";

interface HoldingItem {
    security: string;
    isin?: string;
    qty: number;
    avgPrice: string | number;
    cmp: string | number;
    value: string | number;
    pl: string | number;
    return: string;
    prevClosing?: string | number;
    sector?: string;
}

// --- Helper Components ---
const getCellValue = (row: any, col: string) => {
    const keyMap: Record<string, string> = {
        "Avg Price": "avgPrice",
        "P&L": "pl",
        "Return": "return",
        "CMP": "cmp"
    };
    if (keyMap[col]) return row[keyMap[col]];
    return row[col.toLowerCase().replace(/\s/g, '')] || row[col.toLowerCase().replace(/\s/g, '_')] || row[col.toLowerCase()] || row[col];
};

function HoldingsTable({ columns, data }: { columns: string[]; data: any[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left rounded-xl overflow-hidden">
                <thead>
                    <tr className="border-t border-b border-border">
                        {columns.map((col) => (
                            <th key={col} className="py-5 px-6 font-semibold text-muted-foreground text-xs bg-background/50 whitespace-nowrap" style={(col === "Symbol" || col === "Security") ? { minWidth: '200px' } : {}}>
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                    {data.map((row, i) => (
                        <tr key={i} className="hover:bg-primary/5 transition-colors duration-150">
                            {columns.map((col) => {
                                const val = getCellValue(row, col);
                                if (col === "Security" || col === "Symbol") {
                                    return (
                                        <td key={col} className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground text-base">{row.security}</span>
                                                {row.isin && <span className="text-xs text-muted-foreground font-medium mt-0.5">{row.isin}</span>}
                                            </div>
                                        </td>
                                    );
                                }
                                if (col === "P&L") {
                                    const isPos = typeof val === 'string' ? !val.startsWith('-') : val > 0;
                                    return (
                                        <td key={col} className={`py-5 px-6 font-medium ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {val}
                                        </td>
                                    );
                                }
                                if (col === "Return") {
                                    const isPos = typeof val === 'string' ? !val.startsWith('-') : val > 0;
                                    return (
                                        <td key={col} className="py-5 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${isPos ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {val}
                                            </span>
                                        </td>
                                    );
                                }
                                return (
                                    <td key={col} className="py-5 px-6 text-sm font-medium text-foreground/80">
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

export default function RMHoldings() {
    const [, setLocation] = useLocation();
    const [clients, setClients] = useState<Client[]>([]);
    const [portfolioData, setPortfolioData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [holdingsTab, setHoldingsTab] = useState<HoldingsTab>("Equity");

    // Parse query parameter for selected client
    const searchParams = new URLSearchParams(window.location.search);
    const selectedClientCode = searchParams.get("clientCode");

    // Fetch clients list on mount
    useEffect(() => {
        userService.getClients()
            .then(setClients)
            .catch(err => console.error("Failed to fetch clients:", err));
    }, []);

    // Fetch portfolio when selectedClientCode changes
    useEffect(() => {
        if (selectedClientCode) {
            setLoading(true);
            getPortfolioData(selectedClientCode)
                .then(data => {
                    setPortfolioData(data);
                })
                .catch(err => {
                    console.error("Failed to fetch portfolio:", err);
                    setPortfolioData(null);
                })
                .finally(() => setLoading(false));
        } else {
            setPortfolioData(null);
        }
    }, [selectedClientCode]);

    // Handle client selection
    const handleClientSelect = (code: string | null) => {
        if (code) {
            setLocation(`/rm/holdings?clientCode=${code}`);
        } else {
            setLocation(`/rm/holdings`);
        }
        setIsDropdownOpen(false);
    };

    // Find selected client data
    const selectedClient = clients.find(c => (c.client_id || c.id) === selectedClientCode);

    // Calculate summary stats from portfolio data
    const holdings: HoldingItem[] = portfolioData?.data || [];
    const totalPortfolioValue = holdings.reduce((sum, h) => sum + parseFloat(String(h.value || 0)), 0);
    const totalPL = holdings.reduce((sum, h) => sum + parseFloat(String(h.pl || 0)), 0);
    const totalTodayChange = holdings.reduce((sum, h) => {
        const cmp = parseFloat(String(h.cmp || 0));
        const prevClose = parseFloat(String(h.prevClosing || 0));
        const qty = h.qty || 0;
        return sum + ((cmp - prevClose) * qty);
    }, 0);

    const formatCurrency = (val: number) => {
        if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
        return `₹${val.toFixed(2)}`;
    };

    return (
        <DashboardLayout role="rm">
            <div className="max-w-7xl mx-auto w-full p-8">
                <h1 className="text-4xl font-display font-bold mb-6 text-foreground">Holdings</h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <Users className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="text-muted-foreground text-sm font-medium">Total Clients</span>
                        </div>
                        <span className="text-2xl font-bold text-foreground">{clients.length}</span>
                    </div>

                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                        <span className="text-muted-foreground text-sm font-medium block mb-2">Today's Change</span>
                        <span className={`text-2xl font-bold ${totalTodayChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {selectedClient ? formatCurrency(totalTodayChange) : '-'}
                        </span>
                    </div>

                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                        <span className="text-muted-foreground text-sm font-medium block mb-2">Total P&L</span>
                        <span className={`text-2xl font-bold ${totalPL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {selectedClient ? formatCurrency(totalPL) : '-'}
                        </span>
                    </div>
                </div>

                {/* Client Selector */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden mb-8">
                    <div className="p-6 bg-background/50 border-b border-border">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <h2 className="text-xl font-bold text-foreground">My Clients</h2>
                            <div className="relative">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center justify-between w-[200px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all"
                                >
                                    <span className="truncate">{selectedClient ? selectedClient.name : "Select Client"}</span>
                                    <ChevronDown className="w-4 h-4 text-foreground ml-2 flex-shrink-0" />
                                </button>
                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                        <div className="absolute right-0 mt-2 w-[200px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                                            <button
                                                onClick={() => handleClientSelect(null)}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${!selectedClientCode ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                                            >
                                                All Clients
                                            </button>
                                            {clients.map((client) => (
                                                <button
                                                    key={client.id}
                                                    onClick={() => handleClientSelect(client.client_id || client.id)}
                                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedClientCode === (client.client_id || client.id) ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                                                >
                                                    {client.name}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Clients Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="py-4 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Client Name</th>
                                    <th className="py-4 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Client ID</th>
                                    <th className="py-4 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Status</th>
                                    <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-sm">
                                {clients.map((client) => {
                                    const isSelected = selectedClientCode === (client.client_id || client.id);

                                    return (
                                        <tr
                                            key={client.id}
                                            className={`hover:bg-primary/5 transition-colors cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
                                            onClick={() => handleClientSelect(client.client_id || client.id)}
                                        >
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-foreground">{client.name}</span>
                                            </td>
                                            <td className="py-4 px-6 text-muted-foreground font-medium">{client.client_id || client.id}</td>
                                            <td className="py-4 px-6 text-right">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${client.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-500'}`}>
                                                    {client.status || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs font-semibold text-primary transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); handleClientSelect(client.client_id || client.id); }}
                                                >
                                                    <Eye className="w-3.5 h-3.5" />
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Holdings Detail View - Shows when a client is selected */}
                {loading ? (
                    <div className="flex justify-center items-center p-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : selectedClientCode && selectedClient ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-foreground">
                                {selectedClient.name}'s Holdings
                            </h2>
                            <button
                                onClick={() => handleClientSelect(null)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ← Back to All Clients
                            </button>
                        </div>

                        {/* Holdings Tabs */}
                        <div className="flex gap-4 mb-6">
                            {(["Equity", "Mutual Funds", "Bonds"] as HoldingsTab[]).map((tab) => (
                                <button
                                    key={tab}
                                    className={`px-5 py-2 rounded-full font-medium text-base transition-all duration-200 ${holdingsTab === tab ? 'bg-primary text-white shadow-lg' : 'bg-background text-foreground border border-border hover:bg-primary/10'}`}
                                    onClick={() => setHoldingsTab(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {holdingsTab === "Equity" && (
                                <motion.div
                                    key="equity"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden"
                                >
                                    <div className="p-6 pb-4 bg-background/50">
                                        <h3 className="text-xl font-bold">Equity Holdings</h3>
                                    </div>
                                    {holdings.length > 0 ? (
                                        <HoldingsTable columns={["Security", "Qty", "Avg Price", "CMP", "Value", "P&L", "Return"]} data={holdings} />
                                    ) : (
                                        <p className="p-6 text-center text-muted-foreground">No equity holdings found for this client.</p>
                                    )}
                                </motion.div>
                            )}
                            {holdingsTab === "Mutual Funds" && (
                                <motion.div
                                    key="mf"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden"
                                >
                                    <div className="p-6 pb-4 bg-background/50">
                                        <h3 className="text-xl font-bold">Mutual Fund Holdings</h3>
                                    </div>
                                    <p className="p-6 text-center text-muted-foreground">Mutual fund data not available.</p>
                                </motion.div>
                            )}
                            {holdingsTab === "Bonds" && (
                                <motion.div
                                    key="bonds"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden"
                                >
                                    <div className="p-6 pb-4 bg-background/50">
                                        <h3 className="text-xl font-bold">Bond Holdings</h3>
                                    </div>
                                    <p className="p-6 text-center text-muted-foreground">Bond data not available.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <div className="text-center p-12 text-muted-foreground">
                        <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Select a client to view their holdings</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
