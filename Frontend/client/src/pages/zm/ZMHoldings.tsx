import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type HoldingsTab = "Equity" | "Mutual Funds" | "Bonds";

// --- Sample Data ---
const zmBranchesData = [
    { branchName: "Mumbai Central", branchId: "BR001", bmName: "Vikram Mehta", bmId: "BM001", rmCount: 4, clientCount: 18, totalAUM: "₹9.12 Cr", todayChange: "+₹73,400" },
    { branchName: "Mumbai South", branchId: "BR002", bmName: "Sanjay Gupta", bmId: "BM002", rmCount: 3, clientCount: 15, totalAUM: "₹7.85 Cr", todayChange: "-₹25,600" },
    { branchName: "Pune", branchId: "BR003", bmName: "Anita Deshmukh", bmId: "BM003", rmCount: 5, clientCount: 22, totalAUM: "₹12.45 Cr", todayChange: "+₹1,12,500" },
];

const branchBMsMap: Record<string, any[]> = {
    "BR001": [{ bmName: "Vikram Mehta", bmId: "BM001", rmCount: 4, clientCount: 18, totalAUM: "₹9.12 Cr", avgXirr: "15.2%" }],
    "BR002": [{ bmName: "Sanjay Gupta", bmId: "BM002", rmCount: 3, clientCount: 15, totalAUM: "₹7.85 Cr", avgXirr: "13.8%" }],
    "BR003": [{ bmName: "Anita Deshmukh", bmId: "BM003", rmCount: 5, clientCount: 22, totalAUM: "₹12.45 Cr", avgXirr: "17.5%" }],
};

const bmRMsMap: Record<string, any[]> = {
    "BM001": [
        { rmName: "Amit Singh", rmId: "RM001", clientCount: 5, totalAUM: "₹2.57 Cr", avgXirr: "15.6%" },
        { rmName: "Neha Patel", rmId: "RM002", clientCount: 4, totalAUM: "₹1.85 Cr", avgXirr: "12.3%" },
        { rmName: "Rahul Verma", rmId: "RM003", clientCount: 6, totalAUM: "₹3.42 Cr", avgXirr: "18.2%" },
        { rmName: "Pooja Sharma", rmId: "RM004", clientCount: 3, totalAUM: "₹1.28 Cr", avgXirr: "14.8%" },
    ],
    "BM002": [
        { rmName: "Kiran Desai", rmId: "RM005", clientCount: 5, totalAUM: "₹2.85 Cr", avgXirr: "14.2%" },
        { rmName: "Ravi Kumar", rmId: "RM006", clientCount: 6, totalAUM: "₹3.12 Cr", avgXirr: "13.5%" },
        { rmName: "Priya Nair", rmId: "RM007", clientCount: 4, totalAUM: "₹1.88 Cr", avgXirr: "13.8%" },
    ],
    "BM003": [
        { rmName: "Suresh Patil", rmId: "RM008", clientCount: 4, totalAUM: "₹2.45 Cr", avgXirr: "16.8%" },
        { rmName: "Meena Kulkarni", rmId: "RM009", clientCount: 5, totalAUM: "₹2.92 Cr", avgXirr: "18.2%" },
        { rmName: "Anil Joshi", rmId: "RM010", clientCount: 4, totalAUM: "₹2.18 Cr", avgXirr: "17.5%" },
        { rmName: "Sunita More", rmId: "RM011", clientCount: 5, totalAUM: "₹2.65 Cr", avgXirr: "16.2%" },
        { rmName: "Prakash Sawant", rmId: "RM012", clientCount: 4, totalAUM: "₹2.25 Cr", avgXirr: "18.8%" },
    ],
};

const rmClientsMap: Record<string, any[]> = {
    "RM001": [
        { clientName: "Rajesh Kumar", clientId: "CL001", portfolioValue: "₹45.5 L", todayChange: "+₹12,500", returnsPercent: "+18.5%", xirr: "15.2%" },
        { clientName: "Priya Sharma", clientId: "CL002", portfolioValue: "₹32.8 L", todayChange: "-₹5,200", returnsPercent: "+12.3%", xirr: "11.8%" },
        { clientName: "Amit Patel", clientId: "CL003", portfolioValue: "₹67.2 L", todayChange: "+₹28,400", returnsPercent: "+23.5%", xirr: "19.4%" },
        { clientName: "Sneha Gupta", clientId: "CL004", portfolioValue: "₹22.1 L", todayChange: "+₹3,800", returnsPercent: "+13.1%", xirr: "10.5%" },
        { clientName: "Vikram Mehta", clientId: "CL005", portfolioValue: "₹89.4 L", todayChange: "-₹15,600", returnsPercent: "+24.9%", xirr: "21.2%" },
    ],
    "RM002": [
        { clientName: "Anita Desai", clientId: "CL006", portfolioValue: "₹38.2 L", todayChange: "+₹8,900", returnsPercent: "+14.2%", xirr: "13.5%" },
        { clientName: "Suresh Rao", clientId: "CL007", portfolioValue: "₹52.4 L", todayChange: "-₹12,300", returnsPercent: "+10.8%", xirr: "9.8%" },
        { clientName: "Meera Joshi", clientId: "CL008", portfolioValue: "₹45.8 L", todayChange: "-₹5,100", returnsPercent: "+16.5%", xirr: "14.2%" },
        { clientName: "Karan Singh", clientId: "CL009", portfolioValue: "₹48.6 L", todayChange: "+₹0", returnsPercent: "+11.2%", xirr: "11.8%" },
    ],
    "RM005": [
        { clientName: "Arun Sharma", clientId: "CL020", portfolioValue: "₹55.2 L", todayChange: "+₹15,800", returnsPercent: "+16.8%", xirr: "14.5%" },
        { clientName: "Kavita Reddy", clientId: "CL021", portfolioValue: "₹48.5 L", todayChange: "-₹8,200", returnsPercent: "+12.5%", xirr: "13.2%" },
    ],
    "RM008": [
        { clientName: "Deepak Pawar", clientId: "CL030", portfolioValue: "₹62.8 L", todayChange: "+₹22,500", returnsPercent: "+19.2%", xirr: "17.5%" },
        { clientName: "Sunita Bhosale", clientId: "CL031", portfolioValue: "₹58.4 L", todayChange: "+₹18,200", returnsPercent: "+18.5%", xirr: "16.8%" },
    ],
};

const clientEquityData: Record<string, any[]> = {
    "CL001": [
        { security: "RELIANCE", name: "Reliance Industries", qty: 150, avgPrice: "₹2380", cmp: "₹2680", value: "₹4.02 L", pl: "+₹45,000", return: "+11.76%" },
        { security: "HDFCBANK", name: "HDFC Bank", qty: 200, avgPrice: "₹1520", cmp: "₹1720", value: "₹3.44 L", pl: "+₹40,000", return: "+13.16%" },
    ],
    "CL030": [
        { security: "BAJFINANCE", name: "Bajaj Finance", qty: 100, avgPrice: "₹5800", cmp: "₹7250", value: "₹7.25 L", pl: "+₹1,45,000", return: "+25.00%" },
    ],
};

const clientMFData: Record<string, any[]> = {
    "CL001": [
        { scheme: "Axis Bluechip Fund", folio: "AX123456", units: 2500, avgNav: "₹42.5", currNav: "₹52.2", value: "₹1.31 L", return: "+22.82%" },
    ],
};

const clientBondData: Record<string, any[]> = {
    "CL001": [
        { bond: "GOI 7.26% 2033", isin: "IN0020180034", qty: 10, price: "₹102.5", yield: "6.95%", value: "₹10.25 L", accrued: "+₹7,250", maturity: "2033-01-14" },
    ],
};

// --- Icons ---
const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>
);

const BuildingIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
);

const UsersIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 3.13a4 4 0 0 1 0 7.75"></path><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
);

const UserIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const EyeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);

// --- Components ---
const getCellValue = (row: any, col: string) => {
    const keyMap: Record<string, string> = { "Avg Price": "avgPrice", "Avg NAV": "avgNav", "Current NAV": "currNav", "P&L": "pl", "Return": "return" };
    if (keyMap[col]) return row[keyMap[col]];
    return row[col.toLowerCase().replace(/\s/g, '')] || row[col.toLowerCase()];
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
                                if (col === "Security" || col === "Symbol") return (<td key={col} className="py-5 px-6"><div className="flex flex-col"><span className="font-bold text-foreground text-base">{row.security}</span>{row.name && <span className="text-xs text-muted-foreground font-medium mt-0.5">{row.name}</span>}</div></td>);
                                if (col === "Scheme") return (<td key={col} className="py-5 px-6"><span className="font-bold text-foreground text-base">{val}</span></td>);
                                if (col === "Bond") return (<td key={col} className="py-5 px-6"><div className="flex flex-col"><span className="font-bold text-foreground text-base">{row.bond}</span>{row.isin && <span className="text-xs text-muted-foreground font-medium mt-0.5">{row.isin}</span>}</div></td>);
                                if (col === "P&L" || col === "Yield" || col === "Accrued") { const isPos = typeof val === 'string' ? !val.startsWith('-') : val > 0; return (<td key={col} className={`py-5 px-6 font-medium ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>{val}</td>); }
                                if (col === "Return") { const isPos = typeof val === 'string' ? !val.startsWith('-') : val > 0; return (<td key={col} className="py-5 px-6"><span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${isPos ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{val}</span></td>); }
                                return (<td key={col} className="py-5 px-6 text-sm font-medium text-foreground/80">{val}</td>);
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function ZMHoldings() {
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
    const [selectedBM, setSelectedBM] = useState<string | null>(null);
    const [selectedRM, setSelectedRM] = useState<string | null>(null);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
    const [isBMDropdownOpen, setIsBMDropdownOpen] = useState(false);
    const [isRMDropdownOpen, setIsRMDropdownOpen] = useState(false);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
    const [holdingsTab, setHoldingsTab] = useState<HoldingsTab>("Equity");

    useEffect(() => {
        // Default selection logic: Simulate logged-in ZM view
        if (!selectedBranch && !selectedBM && !selectedRM && !selectedClient) {
            // 1. Select first branch
            const defaultBranch = zmBranchesData[0];
            if (defaultBranch) {
                setSelectedBranch(defaultBranch.branchId);

                // 2. Select first BM in that branch
                const bms = branchBMsMap[defaultBranch.branchId];
                if (bms && bms.length > 0) {
                    const defaultBM = bms[0];
                    setSelectedBM(defaultBM.bmId);

                    // 3. Select first RM under that BM
                    const rms = bmRMsMap[defaultBM.bmId];
                    if (rms && rms.length > 0) {
                        const defaultRM = rms[0];
                        setSelectedRM(defaultRM.rmId);

                        // 4. Select first Client under that RM
                        const clients = rmClientsMap[defaultRM.rmId];
                        if (clients && clients.length > 0) {
                            setSelectedClient(clients[0].clientId);
                        }
                    }
                }
            }
        }
    }, []);

    const selectedBranchData = zmBranchesData.find(b => b.branchId === selectedBranch);
    const bmsUnderBranch = selectedBranch ? branchBMsMap[selectedBranch] || [] : [];
    const allBMs = Object.values(branchBMsMap).flat();
    const displayBMs = selectedBranch ? bmsUnderBranch : allBMs;
    const selectedBMData = displayBMs.find((b: any) => b.bmId === selectedBM);

    const allRMs = Object.values(bmRMsMap).flat();
    const rmsUnderBM = selectedBM ? bmRMsMap[selectedBM] || [] : [];
    // If branch is selected but BM is not, we can show all RMs in that branch? 
    // Complicated. Let's stick to valid hierarchy or all.
    // Actually, if we want to allow selecting Client directly, we need all Clients.

    const allClients = Object.values(rmClientsMap).flat();
    const clientsUnderRM = selectedRM ? rmClientsMap[selectedRM] || [] : [];
    const displayClients = selectedRM ? clientsUnderRM : allClients;

    // Derived selections
    // We need helper maps to lookup parents
    // But for now let's just use flattening
    const selectedRMData = allRMs.find((r: any) => r.rmId === selectedRM);
    const selectedClientData = allClients.find((c: any) => c.clientId === selectedClient);

    const equityData = selectedClient ? clientEquityData[selectedClient] || [] : [];
    const mfData = selectedClient ? clientMFData[selectedClient] || [] : [];
    const bondData = selectedClient ? clientBondData[selectedClient] || [] : [];

    // Calculate totals
    const totalRMs = Object.values(bmRMsMap).flat().length;
    const totalBranches = zmBranchesData.length;
    const totalClients = zmBranchesData.reduce((sum, b) => sum + b.clientCount, 0);
    const todayChange = "+₹1,60,300";

    const resetSelections = (level: 'branch' | 'bm' | 'rm' | 'client') => {
        if (level === 'branch') { setSelectedBranch(null); setSelectedBM(null); setSelectedRM(null); setSelectedClient(null); }
        if (level === 'bm') { setSelectedBM(null); setSelectedRM(null); setSelectedClient(null); }
        if (level === 'rm') { setSelectedRM(null); setSelectedClient(null); }
        if (level === 'client') { setSelectedClient(null); }
    };

    return (
        <DashboardLayout role="zm">
            <div className="max-w-7xl mx-auto w-full p-8">
                <h1 className="text-4xl font-display font-bold mb-6 text-foreground">Holdings</h1>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-purple-500/10 rounded-lg"><BuildingIcon className="w-5 h-5 text-purple-500" /></div>
                            <span className="text-muted-foreground text-sm font-medium">Total Branches</span>
                        </div>
                        <span className="text-2xl font-bold text-foreground">{totalBranches}</span>
                    </div>
                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg"><UsersIcon className="w-5 h-5 text-emerald-500" /></div>
                            <span className="text-muted-foreground text-sm font-medium">Total Clients</span>
                        </div>
                        <span className="text-2xl font-bold text-foreground">{totalClients}</span>
                    </div>
                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg"><UserIcon className="w-5 h-5 text-blue-500" /></div>
                            <span className="text-muted-foreground text-sm font-medium">Total RMs</span>
                        </div>
                        <span className="text-2xl font-bold text-foreground">{totalRMs}</span>
                    </div>
                    <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                        <span className="text-muted-foreground text-sm font-medium block mb-2">Today's Change</span>
                        <span className="text-2xl font-bold text-emerald-500">{todayChange}</span>
                    </div>
                </div>

                {/* Hierarchical Selector Card */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 mb-8">
                    <h3 className="text-lg font-bold text-foreground mb-4">Filter Holdings</h3>
                    <div className="flex flex-wrap gap-4">
                        {/* Branch Selector */}
                        <div className="relative">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Branch</label>
                            <button onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)} className="flex items-center justify-between w-[180px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all">
                                <span className="truncate">{selectedBranch ? selectedBranchData?.branchName : "All Branches"}</span>
                                <ChevronDownIcon className="w-4 h-4 ml-2" />
                            </button>
                            {isBranchDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsBranchDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-[180px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                                        <button onClick={() => { resetSelections('branch'); setIsBranchDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${!selectedBranch ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}>All Branches</button>
                                        {zmBranchesData.map((branch) => (
                                            <button
                                                key={branch.branchId}
                                                onClick={() => {
                                                    setSelectedBranch(branch.branchId);

                                                    // Auto-select first BM
                                                    const bms = branchBMsMap[branch.branchId];
                                                    if (bms && bms.length > 0) {
                                                        const firstBM = bms[0];
                                                        setSelectedBM(firstBM.bmId);

                                                        // Auto-select first RM
                                                        const rms = bmRMsMap[firstBM.bmId];
                                                        if (rms && rms.length > 0) {
                                                            const firstRM = rms[0];
                                                            setSelectedRM(firstRM.rmId);

                                                            // Auto-select first Client
                                                            const clients = rmClientsMap[firstRM.rmId];
                                                            if (clients && clients.length > 0) {
                                                                setSelectedClient(clients[0].clientId);
                                                            } else {
                                                                setSelectedClient(null);
                                                            }
                                                        } else {
                                                            setSelectedRM(null);
                                                            setSelectedClient(null);
                                                        }
                                                    } else {
                                                        setSelectedBM(null);
                                                        setSelectedRM(null);
                                                        setSelectedClient(null);
                                                    }

                                                    setIsBranchDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedBranch === branch.branchId ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                                            >
                                                {branch.branchName}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* BM Selector */}
                        <div className="relative">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Branch Manager</label>
                            <button onClick={() => setIsBMDropdownOpen(!isBMDropdownOpen)} className="flex items-center justify-between w-[180px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all">
                                <span className="truncate">{selectedBM ? selectedBMData?.bmName : "All BMs"}</span>
                                <ChevronDownIcon className="w-4 h-4 ml-2" />
                            </button>
                            {isBMDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsBMDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-[180px] bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                                        <button onClick={() => { resetSelections('bm'); setIsBMDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${!selectedBM ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}>All BMs</button>
                                        {displayBMs.map((bm: any) => (
                                            <button
                                                key={bm.bmId}
                                                onClick={() => {
                                                    setSelectedBM(bm.bmId);

                                                    // Auto-select branch if not selected (Upstream)
                                                    if (!selectedBranch) {
                                                        const branchKey = Object.keys(branchBMsMap).find(key =>
                                                            branchBMsMap[key].some(b => b.bmId === bm.bmId)
                                                        );
                                                        if (branchKey) setSelectedBranch(branchKey);
                                                    }

                                                    // Auto-select first RM (Downstream)
                                                    const rms = bmRMsMap[bm.bmId];
                                                    if (rms && rms.length > 0) {
                                                        const firstRM = rms[0];
                                                        setSelectedRM(firstRM.rmId);

                                                        // Auto-select first Client
                                                        const clients = rmClientsMap[firstRM.rmId];
                                                        if (clients && clients.length > 0) {
                                                            setSelectedClient(clients[0].clientId);
                                                        } else {
                                                            setSelectedClient(null);
                                                        }
                                                    } else {
                                                        setSelectedRM(null);
                                                        setSelectedClient(null);
                                                    }

                                                    setIsBMDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedBM === bm.bmId ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                                            >
                                                {bm.bmName}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* RM Selector */}
                        <div className="relative">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Relationship Manager</label>
                            <button onClick={() => setIsRMDropdownOpen(!isRMDropdownOpen)} className="flex items-center justify-between w-[180px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all">
                                <span className="truncate">{selectedRM ? selectedRMData?.rmName : "All RMs"}</span>
                                <ChevronDownIcon className="w-4 h-4 ml-2" />
                            </button>
                            {isRMDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsRMDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-[180px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                                        <button onClick={() => { resetSelections('rm'); setIsRMDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${!selectedRM ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}>All RMs</button>
                                        {(selectedBM ? rmsUnderBM : allRMs).map((rm: any) => (
                                            <button
                                                key={rm.rmId}
                                                onClick={() => {
                                                    setSelectedRM(rm.rmId);

                                                    // Auto-select parent BM (Upstream)
                                                    if (!selectedBM) {
                                                        const bmKey = Object.keys(bmRMsMap).find(key =>
                                                            bmRMsMap[key].some(r => r.rmId === rm.rmId)
                                                        );

                                                        if (bmKey) {
                                                            setSelectedBM(bmKey);
                                                            // Auto-select Branch
                                                            if (!selectedBranch) {
                                                                const branchKey = Object.keys(branchBMsMap).find(key =>
                                                                    branchBMsMap[key].some(b => b.bmId === bmKey)
                                                                );
                                                                if (branchKey) setSelectedBranch(branchKey);
                                                            }
                                                        }
                                                    }

                                                    // Auto-select first Client (Downstream)
                                                    const clients = rmClientsMap[rm.rmId];
                                                    if (clients && clients.length > 0) {
                                                        setSelectedClient(clients[0].clientId);
                                                    } else {
                                                        setSelectedClient(null);
                                                    }

                                                    setIsRMDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedRM === rm.rmId ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                                            >
                                                {rm.rmName}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Client Selector */}
                        <div className="relative">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Client</label>
                            <button onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)} className="flex items-center justify-between w-[180px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all">
                                <span className="truncate">{selectedClient ? selectedClientData?.clientName : "All Clients"}</span>
                                <ChevronDownIcon className="w-4 h-4 ml-2" />
                            </button>
                            {isClientDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsClientDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-[180px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                                        <button onClick={() => { resetSelections('client'); setIsClientDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${!selectedClient ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}>All Clients</button>
                                        {displayClients.map((client: any) => (
                                            <button
                                                key={client.clientId}
                                                onClick={() => {
                                                    setSelectedClient(client.clientId);

                                                    // Auto-select parents
                                                    let rmKey = selectedRM;
                                                    if (!rmKey) {
                                                        rmKey = Object.keys(rmClientsMap).find(key =>
                                                            rmClientsMap[key].some(c => c.clientId === client.clientId)
                                                        ) || null;
                                                        if (rmKey) setSelectedRM(rmKey);
                                                    }

                                                    // Only auto-select BM if RM was found or already selected
                                                    if (rmKey) {
                                                        let bmKey = selectedBM;
                                                        if (!bmKey) {
                                                            bmKey = Object.keys(bmRMsMap).find(key =>
                                                                bmRMsMap[key].some(r => r.rmId === rmKey)
                                                            ) || null;
                                                            if (bmKey) setSelectedBM(bmKey);
                                                        }

                                                        // Only auto-select Branch if BM was found
                                                        if (bmKey) {
                                                            if (!selectedBranch) {
                                                                const branchKey = Object.keys(branchBMsMap).find(key =>
                                                                    branchBMsMap[key].some(b => b.bmId === bmKey)
                                                                );
                                                                if (branchKey) setSelectedBranch(branchKey);
                                                            }
                                                        }
                                                    }

                                                    setIsClientDropdownOpen(false);
                                                }}
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

                {/* Branch Table - Shows when nothing is selected */}
                {!selectedBranch && (
                    <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                        <div className="p-6 bg-background/50 border-b border-border">
                            <h2 className="text-xl font-bold text-foreground">Zone Branches</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="py-4 px-6 text-muted-foreground font-semibold text-xs bg-background/50">Branch Name</th>
                                        <th className="py-4 px-6 text-muted-foreground font-semibold text-xs bg-background/50">Branch Manager</th>
                                        <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">No. of RMs</th>
                                        <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">No. of Clients</th>
                                        <th className="py-4 px-6 text-right text-muted-foreground font-semibold text-xs bg-background/50">Total AUM</th>
                                        <th className="py-4 px-6 text-right text-muted-foreground font-semibold text-xs bg-background/50">Today's Change</th>
                                        <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border text-sm">
                                    {zmBranchesData.map((branch) => {
                                        const todayIsPositive = !branch.todayChange.startsWith('-');
                                        return (
                                            <tr key={branch.branchId} className="hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setSelectedBranch(branch.branchId)}>
                                                <td className="py-4 px-6 font-bold text-foreground">{branch.branchName}</td>
                                                <td className="py-4 px-6 text-muted-foreground">{branch.bmName}</td>
                                                <td className="py-4 px-6 text-center"><span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-500">{branch.rmCount}</span></td>
                                                <td className="py-4 px-6 text-center"><span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500">{branch.clientCount}</span></td>
                                                <td className="py-4 px-6 text-right font-bold text-foreground">{branch.totalAUM}</td>
                                                <td className="py-4 px-6 text-right"><span className={`font-bold ${todayIsPositive ? 'text-emerald-500' : 'text-red-500'}`}>{branch.todayChange}</span></td>
                                                <td className="py-4 px-6 text-center">
                                                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs font-semibold text-primary transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedBranch(branch.branchId); }}>
                                                        <EyeIcon className="w-3.5 h-3.5" />View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* RM Table - Shows when Branch + BM is selected but no RM */}
                {selectedBranch && selectedBM && !selectedRM && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{selectedBMData?.bmName}'s RMs</h2>
                                <p className="text-sm text-muted-foreground">Branch: {selectedBranchData?.branchName}</p>
                            </div>
                            <button onClick={() => resetSelections('bm')} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">← Back to BMs</button>
                        </div>
                        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="py-4 px-6 text-muted-foreground font-semibold text-xs bg-background/50">RM Name</th>
                                            <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">No. of Clients</th>
                                            <th className="py-4 px-6 text-right text-muted-foreground font-semibold text-xs bg-background/50">Total AUM</th>
                                            <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">Avg XIRR</th>
                                            <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-sm">
                                        {rmsUnderBM.map((rm: any) => (
                                            <tr key={rm.rmId} className="hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setSelectedRM(rm.rmId)}>
                                                <td className="py-4 px-6 font-bold text-foreground">{rm.rmName}</td>
                                                <td className="py-4 px-6 text-center"><span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-500">{rm.clientCount}</span></td>
                                                <td className="py-4 px-6 text-right font-bold text-foreground">{rm.totalAUM}</td>
                                                <td className="py-4 px-6 text-center"><span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500">{rm.avgXirr}</span></td>
                                                <td className="py-4 px-6 text-center">
                                                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs font-semibold text-primary transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedRM(rm.rmId); }}>
                                                        <EyeIcon className="w-3.5 h-3.5" />View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* BM Table - Shows when Branch is selected but no BM */}
                {selectedBranch && !selectedBM && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-2xl font-bold text-foreground">{selectedBranchData?.branchName} - Branch Managers</h2>
                            <button onClick={() => resetSelections('branch')} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">← Back to Branches</button>
                        </div>
                        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="py-4 px-6 text-muted-foreground font-semibold text-xs bg-background/50">BM Name</th>
                                            <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">No. of RMs</th>
                                            <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">Total Clients</th>
                                            <th className="py-4 px-6 text-right text-muted-foreground font-semibold text-xs bg-background/50">Total AUM</th>
                                            <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">Avg XIRR</th>
                                            <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-sm">
                                        {bmsUnderBranch.map((bm: any) => (
                                            <tr key={bm.bmId} className="hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setSelectedBM(bm.bmId)}>
                                                <td className="py-4 px-6 font-bold text-foreground">{bm.bmName}</td>
                                                <td className="py-4 px-6 text-center"><span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-500/10 text-purple-500">{bm.rmCount}</span></td>
                                                <td className="py-4 px-6 text-center"><span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-500">{bm.clientCount}</span></td>
                                                <td className="py-4 px-6 text-right font-bold text-foreground">{bm.totalAUM}</td>
                                                <td className="py-4 px-6 text-center"><span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500">{bm.avgXirr}</span></td>
                                                <td className="py-4 px-6 text-center">
                                                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs font-semibold text-primary transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedBM(bm.bmId); }}>
                                                        <EyeIcon className="w-3.5 h-3.5" />View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Client Table - Shows when RM is selected but no client */}
                {selectedRM && !selectedClient && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{selectedRMData?.rmName}'s Clients</h2>
                                <p className="text-sm text-muted-foreground">Branch: {selectedBranchData?.branchName} • BM: {selectedBMData?.bmName}</p>
                            </div>
                            <button onClick={() => resetSelections('rm')} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">← Back to RMs</button>
                        </div>
                        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="py-4 px-6 text-muted-foreground font-semibold text-xs bg-background/50">Client Name</th>
                                            <th className="py-4 px-6 text-right text-muted-foreground font-semibold text-xs bg-background/50">Portfolio Value</th>
                                            <th className="py-4 px-6 text-right text-muted-foreground font-semibold text-xs bg-background/50">Today's Change</th>
                                            <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">Returns</th>
                                            <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">XIRR</th>
                                            <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-sm">
                                        {clientsUnderRM.map((client: any) => {
                                            const todayIsPositive = !client.todayChange.startsWith('-');
                                            const returnsIsPositive = !client.returnsPercent.startsWith('-');
                                            return (
                                                <tr key={client.clientId} className="hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setSelectedClient(client.clientId)}>
                                                    <td className="py-4 px-6 font-bold text-foreground">{client.clientName}</td>
                                                    <td className="py-4 px-6 text-right font-bold text-foreground">{client.portfolioValue}</td>
                                                    <td className="py-4 px-6 text-right"><span className={`font-bold ${todayIsPositive ? 'text-emerald-500' : 'text-red-500'}`}>{client.todayChange}</span></td>
                                                    <td className="py-4 px-6 text-center"><span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${returnsIsPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{client.returnsPercent}</span></td>
                                                    <td className="py-4 px-6 text-center"><span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500">{client.xirr}</span></td>
                                                    <td className="py-4 px-6 text-center">
                                                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs font-semibold text-primary transition-colors" onClick={(e) => { e.stopPropagation(); setSelectedClient(client.clientId); }}>
                                                            <EyeIcon className="w-3.5 h-3.5" />View
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Holdings Detail View - Shows when a client is selected */}
                {selectedClient && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{selectedClientData?.clientName}'s Holdings</h2>
                                <p className="text-sm text-muted-foreground">Branch: {selectedBranchData?.branchName} • BM: {selectedBMData?.bmName} • RM: {selectedRMData?.rmName}</p>
                            </div>
                            <button onClick={() => resetSelections('client')} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">← Back to Clients</button>
                        </div>

                        <div className="flex gap-4 mb-6">
                            {(["Equity", "Mutual Funds", "Bonds"] as HoldingsTab[]).map((tab) => (
                                <button key={tab} className={`px-5 py-2 rounded-full font-medium text-base transition-all duration-200 ${holdingsTab === tab ? 'bg-primary text-white shadow-lg' : 'bg-background text-foreground border border-border hover:bg-primary/10'}`} onClick={() => setHoldingsTab(tab)}>{tab}</button>
                            ))}
                        </div>

                        <AnimatePresence mode="wait">
                            {holdingsTab === "Equity" && (
                                <motion.div key="equity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden">
                                    <div className="p-6 pb-4 bg-background/50"><h3 className="text-xl font-bold">Equity Holdings</h3></div>
                                    {equityData.length > 0 ? <HoldingsTable columns={["Security", "Qty", "Avg Price", "CMP", "Value", "P&L", "Return"]} data={equityData} /> : <p className="p-6 text-center text-muted-foreground">No equity holdings found.</p>}
                                </motion.div>
                            )}
                            {holdingsTab === "Mutual Funds" && (
                                <motion.div key="mf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden">
                                    <div className="p-6 pb-4 bg-background/50"><h3 className="text-xl font-bold">Mutual Fund Holdings</h3></div>
                                    {mfData.length > 0 ? <HoldingsTable columns={["Scheme", "Folio", "Units", "Avg NAV", "Current NAV", "Value", "Return"]} data={mfData} /> : <p className="p-6 text-center text-muted-foreground">No mutual fund holdings found.</p>}
                                </motion.div>
                            )}
                            {holdingsTab === "Bonds" && (
                                <motion.div key="bonds" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden">
                                    <div className="p-6 pb-4 bg-background/50"><h3 className="text-xl font-bold">Bond Holdings</h3></div>
                                    {bondData.length > 0 ? <HoldingsTable columns={["Bond", "Qty", "Price", "Yield", "Value", "Accrued", "Maturity"]} data={bondData} /> : <p className="p-6 text-center text-muted-foreground">No bond holdings found.</p>}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </DashboardLayout>
    );
}
