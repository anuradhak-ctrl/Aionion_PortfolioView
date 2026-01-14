import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type HoldingsTab = "Equity" | "Mutual Funds" | "Bonds";

// --- Sample Data ---
const rmClientsData = [
    { clientName: "Sanjay Deshmukh", clientId: "CL101", portfolioValue: "₹52.3 L", todayChange: "+₹15,200", todayChangePercent: "+0.29%", returns: "+₹9.8 L", returnsPercent: "+18.7%", xirr: "16.3%" },
    { clientName: "Kavita Nair", clientId: "CL102", portfolioValue: "₹38.9 L", todayChange: "-₹6,800", todayChangePercent: "-0.17%", returns: "+₹5.2 L", returnsPercent: "+13.4%", xirr: "12.5%" },
    { clientName: "Arun Krishnan", clientId: "CL103", portfolioValue: "₹71.5 L", todayChange: "+₹32,100", todayChangePercent: "+0.45%", returns: "+₹18.2 L", returnsPercent: "+25.5%", xirr: "20.8%" },
    { clientName: "Meera Bansal", clientId: "CL104", portfolioValue: "₹26.7 L", todayChange: "+₹4,500", todayChangePercent: "+0.17%", returns: "+₹3.4 L", returnsPercent: "+12.7%", xirr: "11.2%" },
    { clientName: "Rohit Malhotra", clientId: "CL105", portfolioValue: "₹94.8 L", todayChange: "-₹18,900", todayChangePercent: "-0.20%", returns: "+₹25.1 L", returnsPercent: "+26.5%", xirr: "22.4%" },
];

const clientEquityData: Record<string, any[]> = {
    "CL101": [
        { security: "LT", name: "Larsen & Toubro", qty: 120, avgPrice: "₹2950", cmp: "₹3380", value: "₹4.06 L", pl: "+₹51,600", return: "+14.58%" },
        { security: "SBIN", name: "State Bank of India", qty: 280, avgPrice: "₹550", cmp: "₹645", value: "₹1.81 L", pl: "+₹26,600", return: "+17.27%" },
        { security: "KOTAKBANK", name: "Kotak Mahindra Bank", qty: 150, avgPrice: "₹1830", cmp: "₹2050", value: "₹3.08 L", pl: "+₹33,000", return: "+12.02%" },
    ],
    "CL102": [
        { security: "BHARTIARTL", name: "Bharti Airtel", qty: 200, avgPrice: "₹780", cmp: "₹920", value: "₹1.84 L", pl: "+₹28,000", return: "+17.95%" },
        { security: "ADANIPORTS", name: "Adani Ports", qty: 180, avgPrice: "₹680", cmp: "₹795", value: "₹1.43 L", pl: "+₹20,700", return: "+16.91%" },
    ],
    "CL103": [
        { security: "AXISBANK", name: "Axis Bank", qty: 250, avgPrice: "₹920", cmp: "₹1120", value: "₹2.80 L", pl: "+₹50,000", return: "+21.74%" },
        { security: "SUNPHARMA", name: "Sun Pharma", qty: 300, avgPrice: "₹1050", cmp: "₹1280", value: "₹3.84 L", pl: "+₹69,000", return: "+21.90%" },
    ],
    "CL104": [
        { security: "NESTLEIND", name: "Nestle India", qty: 25, avgPrice: "₹19500", cmp: "₹22800", value: "₹5.70 L", pl: "+₹82,500", return: "+16.92%" },
    ],
    "CL105": [
        { security: "M&M", name: "Mahindra & Mahindra", qty: 180, avgPrice: "₹1420", cmp: "₹1720", value: "₹3.10 L", pl: "+₹54,000", return: "+21.13%" },
        { security: "DIVISLAB", name: "Divi's Laboratories", qty: 60, avgPrice: "₹3850", cmp: "₹4520", value: "₹2.71 L", pl: "+₹40,200", return: "+17.40%" },
        { security: "BAJAJ-AUTO", name: "Bajaj Auto", qty: 45, avgPrice: "₹7200", cmp: "₹8650", value: "₹3.89 L", pl: "+₹65,250", return: "+20.14%" },
    ],
};

const clientMFData: Record<string, any[]> = {
    "CL001": [
        { scheme: "Axis Bluechip Fund", folio: "AX123456", units: 2500, avgNav: "₹42.5", currNav: "₹52.2", value: "₹1.31 L", return: "+22.82%" },
        { scheme: "HDFC Mid-Cap Opportunities", folio: "HD789012", units: 1800, avgNav: "₹85.2", currNav: "₹98.5", value: "₹1.77 L", return: "+15.61%" },
    ],
    "CL002": [
        { scheme: "SBI Equity Hybrid Fund", folio: "SB345678", units: 3200, avgNav: "₹52.8", currNav: "₹61.2", value: "₹1.96 L", return: "+15.91%" },
    ],
    "CL003": [
        { scheme: "Mirae Asset Large Cap", folio: "MA901234", units: 1500, avgNav: "₹78.5", currNav: "₹92.8", value: "₹1.39 L", return: "+18.22%" },
        { scheme: "PPFAS Flexi Cap", folio: "PP567890", units: 2000, avgNav: "₹58.2", currNav: "₹72.5", value: "₹1.45 L", return: "+24.57%" },
    ],
    "CL004": [
        { scheme: "Kotak Small Cap Fund", folio: "KO123789", units: 2800, avgNav: "₹125.5", currNav: "₹148.2", value: "₹4.15 L", return: "+18.09%" },
    ],
    "CL005": [
        { scheme: "Nippon India Growth Fund", folio: "NI456123", units: 1200, avgNav: "₹1850", currNav: "₹2250", value: "₹2.70 L", return: "+21.62%" },
    ],
};

const clientBondData: Record<string, any[]> = {
    "CL001": [
        { bond: "GOI 7.26% 2033", isin: "IN0020180034", qty: 10, price: "₹102.5", yield: "6.95%", value: "₹10.25 L", accrued: "+₹7,250", maturity: "2033-01-14" },
    ],
    "CL002": [],
    "CL003": [
        { bond: "HDFC Ltd 7.95% 2026", isin: "INE001A07PQ5", qty: 5, price: "₹104.2", yield: "7.25%", value: "₹5.21 L", accrued: "+₹3,975", maturity: "2026-07-22" },
    ],
    "CL004": [],
    "CL005": [
        { bond: "REC 7.54% 2030", isin: "INE020B07HX8", qty: 8, price: "₹101.8", yield: "7.32%", value: "₹8.14 L", accrued: "+₹6,032", maturity: "2030-09-15" },
    ],
};

// --- Icons ---
const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>
);

const UsersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
);

const EyeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

// --- Components ---
const getCellValue = (row: any, col: string) => {
    const keyMap: Record<string, string> = {
        "Avg Price": "avgPrice",
        "Avg NAV": "avgNav",
        "Current NAV": "currNav",
        "P&L": "pl",
        "Return": "return"
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
                                                {row.name && <span className="text-xs text-muted-foreground font-medium mt-0.5">{row.name}</span>}
                                            </div>
                                        </td>
                                    );
                                }
                                if (col === "Scheme") {
                                    return (
                                        <td key={col} className="py-5 px-6">
                                            <span className="font-bold text-foreground text-base">{val}</span>
                                        </td>
                                    );
                                }
                                if (col === "Bond") {
                                    return (
                                        <td key={col} className="py-5 px-6">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground text-base">{row.bond}</span>
                                                {row.isin && <span className="text-xs text-muted-foreground font-medium mt-0.5">{row.isin}</span>}
                                            </div>
                                        </td>
                                    );
                                }
                                if (col === "P&L" || col === "Yield" || col === "Accrued") {
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
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [holdingsTab, setHoldingsTab] = useState<HoldingsTab>("Equity");

    const selectedClientData = rmClientsData.find(c => c.clientId === selectedClient);
    const equityData = selectedClient ? clientEquityData[selectedClient] || [] : [];
    const mfData = selectedClient ? clientMFData[selectedClient] || [] : [];
    const bondData = selectedClient ? clientBondData[selectedClient] || [] : [];

    // Calculate totals
    const totalAUM = "₹2.57 Cr";
    const totalClients = rmClientsData.length;
    const todayChange = "+₹23,900";
    const avgXirr = "15.6%";

    return (
        <DashboardLayout role="rm">
            <div className="max-w-7xl mx-auto w-full p-8">
                <h1 className="text-4xl font-display font-bold mb-6 text-foreground">Holdings</h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <UsersIcon className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="text-muted-foreground text-sm font-medium">Total Clients</span>
                        </div>
                        <span className="text-2xl font-bold text-foreground">{totalClients}</span>
                    </div>

                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                        <span className="text-muted-foreground text-sm font-medium block mb-2">Today's Change</span>
                        <span className="text-2xl font-bold text-emerald-500">{todayChange}</span>
                    </div>
                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                        <span className="text-muted-foreground text-sm font-medium block mb-2">Avg XIRR</span>
                        <span className="text-2xl font-bold text-foreground">{avgXirr}</span>
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
                                    <span className="truncate">{selectedClient ? selectedClientData?.clientName : "Select Client"}</span>
                                    <ChevronDownIcon className="w-4 h-4 text-foreground ml-2 flex-shrink-0" />
                                </button>
                                {isDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                        <div className="absolute right-0 mt-2 w-[200px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                                            <button
                                                onClick={() => { setSelectedClient(null); setIsDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${!selectedClient ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                                            >
                                                All Clients
                                            </button>
                                            {rmClientsData.map((client) => (
                                                <button
                                                    key={client.clientId}
                                                    onClick={() => { setSelectedClient(client.clientId); setIsDropdownOpen(false); }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedClient === client.clientId ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                                                >
                                                    {client.clientName}
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
                                    <th className="py-4 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Portfolio Value</th>
                                    <th className="py-4 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Today's Change</th>
                                    <th className="py-4 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Total Returns</th>
                                    <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">XIRR</th>
                                    <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border text-sm">
                                {rmClientsData.map((client) => {
                                    const isSelected = selectedClient === client.clientId;
                                    const todayIsPositive = !client.todayChange.startsWith('-');
                                    const returnsIsPositive = !client.returns.startsWith('-');

                                    return (
                                        <tr
                                            key={client.clientId}
                                            className={`hover:bg-primary/5 transition-colors cursor-pointer ${isSelected ? 'bg-primary/10' : ''}`}
                                            onClick={() => setSelectedClient(client.clientId)}
                                        >
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-foreground">{client.clientName}</span>
                                            </td>
                                            <td className="py-4 px-6 text-muted-foreground font-medium">{client.clientId}</td>
                                            <td className="py-4 px-6 text-right font-bold text-foreground">{client.portfolioValue}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`font-bold ${todayIsPositive ? 'text-emerald-500' : 'text-red-500'}`}>{client.todayChange}</span>
                                                    <span className={`text-xs ${todayIsPositive ? 'text-emerald-500' : 'text-red-500'}`}>{client.todayChangePercent}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className={`font-bold ${returnsIsPositive ? 'text-emerald-500' : 'text-red-500'}`}>{client.returns}</span>
                                                    <span className={`text-xs ${returnsIsPositive ? 'text-emerald-500' : 'text-red-500'}`}>{client.returnsPercent}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                                                    {client.xirr}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <button
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs font-semibold text-primary transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); setSelectedClient(client.clientId); }}
                                                >
                                                    <EyeIcon className="w-3.5 h-3.5" />
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
                {selectedClient && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-foreground">
                                {selectedClientData?.clientName}'s Holdings
                            </h2>
                            <button
                                onClick={() => setSelectedClient(null)}
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
                                    {equityData.length > 0 ? (
                                        <HoldingsTable columns={["Security", "Qty", "Avg Price", "CMP", "Value", "P&L", "Return"]} data={equityData} />
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
                                    {mfData.length > 0 ? (
                                        <HoldingsTable columns={["Scheme", "Folio", "Units", "Avg NAV", "Current NAV", "Value", "Return"]} data={mfData} />
                                    ) : (
                                        <p className="p-6 text-center text-muted-foreground">No mutual fund holdings found for this client.</p>
                                    )}
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
                                    {bondData.length > 0 ? (
                                        <HoldingsTable columns={["Bond", "Qty", "Price", "Yield", "Value", "Accrued", "Maturity"]} data={bondData} />
                                    ) : (
                                        <p className="p-6 text-center text-muted-foreground">No bond holdings found for this client.</p>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    );
}
