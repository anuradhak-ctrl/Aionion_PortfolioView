import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type Tab = "Holdings" | "Transactions" | "Ledger" | "Dividends" | "Tax P&L" | "Capital Gains" | "XIRR";

// --- Sample Data ---
const zmBranchesData = [
    { branchName: "Mumbai Central", branchId: "BR001", bmName: "Vikram Mehta", bmId: "BM001" },
    { branchName: "Mumbai South", branchId: "BR002", bmName: "Sanjay Gupta", bmId: "BM002" },
    { branchName: "Pune", branchId: "BR003", bmName: "Anita Deshmukh", bmId: "BM003" },
];

const branchBMsMap: Record<string, any[]> = {
    "BR001": [{ bmName: "Vikram Mehta", bmId: "BM001" }],
    "BR002": [{ bmName: "Sanjay Gupta", bmId: "BM002" }],
    "BR003": [{ bmName: "Anita Deshmukh", bmId: "BM003" }],
};

const bmRMsMap: Record<string, any[]> = {
    "BM001": [
        { rmName: "Amit Singh", rmId: "RM001", clientCount: 5 },
        { rmName: "Neha Patel", rmId: "RM002", clientCount: 4 },
        { rmName: "Rahul Verma", rmId: "RM003", clientCount: 6 },
        { rmName: "Pooja Sharma", rmId: "RM004", clientCount: 3 },
    ],
    "BM002": [
        { rmName: "Kiran Desai", rmId: "RM005", clientCount: 5 },
        { rmName: "Ravi Kumar", rmId: "RM006", clientCount: 6 },
        { rmName: "Priya Nair", rmId: "RM007", clientCount: 4 },
    ],
    "BM003": [
        { rmName: "Suresh Patil", rmId: "RM008", clientCount: 4 },
        { rmName: "Meena Kulkarni", rmId: "RM009", clientCount: 5 },
        { rmName: "Anil Joshi", rmId: "RM010", clientCount: 4 },
        { rmName: "Sunita More", rmId: "RM011", clientCount: 5 },
        { rmName: "Prakash Sawant", rmId: "RM012", clientCount: 4 },
    ],
};

const rmClientsMap: Record<string, any[]> = {
    "RM001": [
        { clientName: "Rajesh Kumar", clientId: "CL001", portfolioValue: "₹45.5 L", xirr: "15.2%" },
        { clientName: "Priya Sharma", clientId: "CL002", portfolioValue: "₹32.8 L", xirr: "11.8%" },
        { clientName: "Amit Patel", clientId: "CL003", portfolioValue: "₹67.2 L", xirr: "19.4%" },
        { clientName: "Sneha Gupta", clientId: "CL004", portfolioValue: "₹22.1 L", xirr: "10.5%" },
        { clientName: "Vikram Mehta", clientId: "CL005", portfolioValue: "₹89.4 L", xirr: "21.2%" },
    ],
    "RM002": [
        { clientName: "Anita Desai", clientId: "CL006", portfolioValue: "₹38.2 L", xirr: "13.5%" },
        { clientName: "Suresh Rao", clientId: "CL007", portfolioValue: "₹52.4 L", xirr: "9.8%" },
        { clientName: "Meera Joshi", clientId: "CL008", portfolioValue: "₹45.8 L", xirr: "14.2%" },
        { clientName: "Karan Singh", clientId: "CL009", portfolioValue: "₹48.6 L", xirr: "11.8%" },
    ],
    "RM005": [
        { clientName: "Arun Sharma", clientId: "CL020", portfolioValue: "₹55.2 L", xirr: "14.5%" },
        { clientName: "Kavita Reddy", clientId: "CL021", portfolioValue: "₹48.5 L", xirr: "13.2%" },
    ],
    "RM008": [
        { clientName: "Deepak Pawar", clientId: "CL030", portfolioValue: "₹62.8 L", xirr: "17.5%" },
        { clientName: "Sunita Bhosale", clientId: "CL031", portfolioValue: "₹58.4 L", xirr: "16.8%" },
    ],
};

// Holdings and Transaction data for sample clients
const clientHoldingsData: Record<string, any[]> = {
    "CL001": [
        { symbol: "RELIANCE", name: "Reliance Industries", isin: "INE002A01018", sector: "Energy", qtyAvailable: 150, qtyDiscrepant: 0, qtyLongTerm: 80, qtyPledgedMargin: 20, qtyPledgedLoan: 0, avgPrice: "2,380.00", prevClosing: "2,680.00", unrealizedPL: "45,000.00", unrealizedPLPercent: "12.61", type: "Equity" },
        { symbol: "HDFCBANK", name: "HDFC Bank", isin: "INE040A01034", sector: "Banking", qtyAvailable: 200, qtyDiscrepant: 10, qtyLongTerm: 150, qtyPledgedMargin: 40, qtyPledgedLoan: 0, avgPrice: "1,520.00", prevClosing: "1,720.00", unrealizedPL: "40,000.00", unrealizedPLPercent: "13.16", type: "Equity" },
    ],
    "CL030": [
        { symbol: "BAJFINANCE", name: "Bajaj Finance", isin: "INE296A01024", sector: "Finance", qtyAvailable: 100, qtyDiscrepant: 0, qtyLongTerm: 100, qtyPledgedMargin: 0, qtyPledgedLoan: 0, avgPrice: "5,800.00", prevClosing: "7,250.00", unrealizedPL: "1,45,000.00", unrealizedPLPercent: "25.00", type: "Equity" },
    ],
};

const clientTransactionsData: Record<string, any[]> = {
    "CL001": [
        { symbol: "RELIANCE", isin: "INE002A01018", tradeDate: "12-Jan-2026", exchange: "NSE", segment: "Equity", series: "EQ", tradeType: "BUY", auction: "No", quantity: "50", price: "2,450.00", tradeId: "T100123", orderId: "O223344", executionTime: "12-Jan-2026 10:30:15", asset: "Equity" },
    ],
    "CL030": [
        { symbol: "BAJFINANCE", isin: "INE296A01024", tradeDate: "10-Jan-2026", exchange: "NSE", segment: "Equity", series: "EQ", tradeType: "BUY", auction: "No", quantity: "20", price: "7,200.00", tradeId: "T100126", orderId: "O334455", executionTime: "10-Jan-2026 11:15:20", asset: "Equity" },
    ],
};

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

// --- Icons ---
const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>
);

const DownloadIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);

// --- Tab Content Components ---
const HoldingsTab = ({ clientId }: { clientId: string }) => {
    const [filter, setFilter] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const holdings = clientHoldingsData[clientId] || [];

    const filteredHoldings = filter === "All"
        ? holdings
        : holdings.filter(h => h.type === filter);

    const handleDownload = () => {
        const headers = ["Symbol", "ISIN", "Sector", "Quantity Available", "Quantity Discrepant", "Quantity Long Term", "Quantity Pledged (Margin)", "Quantity Pledged (Loan)", "Average Price", "Previous Closing Price", "Unrealized P&L", "Unrealized P&L %", "Asset"];
        const csvContent = [headers.join(","), ...filteredHoldings.map(row => [row.symbol, row.isin, row.sector, row.qtyAvailable, row.qtyDiscrepant, row.qtyLongTerm, row.qtyPledgedMargin, row.qtyPledgedLoan, row.avgPrice, row.prevClosing, row.unrealizedPL, row.unrealizedPLPercent, row.type].join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `holdings_${clientId}_${filter.toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="p-4 md:p-6 pb-4 bg-background/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">Holdings Report</h2>
                    <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
                        {/* Filter Dropdown */}
                        <div className="relative flex-1 sm:flex-none">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-between w-full sm:w-[120px] md:w-[140px] px-3 md:px-4 py-2 md:py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-xs md:text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="leading-none truncate">{filter === "All" ? "All Assets" : filter}</span>
                                <ChevronDownIcon className="w-3 h-3 md:w-4 md:h-4 text-foreground ml-1 flex-shrink-0" />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-full sm:w-[120px] md:w-[140px] bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                                        {["All", "Equity", "MF", "Bond"].map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => { setFilter(item); setIsDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-xs md:text-sm font-medium transition-colors ${filter === item
                                                    ? "text-emerald-500 bg-emerald-500/10"
                                                    : "text-muted-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                {item === "All" ? "All Assets" : item}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs md:text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap"
                        >
                            <DownloadIcon className="w-3 h-3 md:w-4 md:h-4 mb-[2px]" />
                            <span className="leading-none">Export</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-t border-b border-border">
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50" style={{ minWidth: '200px' }}>Symbol</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">ISIN</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Sector</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Quantity Available</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Quantity Discrepant</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Quantity Long Term</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Quantity Pledged (Margin)</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Quantity Pledged (Loan)</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Average Price</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Previous Closing Price</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Unrealized P&L</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Unrealized P&L %</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {filteredHoldings.map((h, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="py-5 px-6 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground text-base">{h.symbol}</span>
                                        {h.name && <span className="text-xs text-muted-foreground font-medium mt-0.5">{h.name}</span>}
                                    </div>
                                </td>
                                <td className="py-5 px-6 text-xs text-muted-foreground font-medium whitespace-nowrap">{h.isin}</td>
                                <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">{h.sector}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap">{h.qtyAvailable}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap">{h.qtyDiscrepant || 0}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap">{h.qtyLongTerm || 0}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap">{h.qtyPledgedMargin || 0}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap">{h.qtyPledgedLoan || 0}</td>
                                <td className="py-5 px-6 text-right text-muted-foreground font-medium whitespace-nowrap">{h.avgPrice}</td>
                                <td className="py-5 px-6 text-right text-muted-foreground font-medium whitespace-nowrap">{h.prevClosing}</td>
                                <td className="py-5 px-6 text-right text-emerald-500 font-bold text-base whitespace-nowrap">{h.unrealizedPL}</td>
                                <td className="py-5 px-6 text-center whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                                        {h.unrealizedPLPercent}%
                                    </span>
                                </td>
                                <td className="py-5 px-6 text-center whitespace-nowrap">
                                    <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                        {h.type}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredHoldings.length === 0 && (<tr><td colSpan={13} className="py-12 text-center text-muted-foreground">No holdings found for {filter}.</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TransactionsTab = ({ clientId }: { clientId: string }) => {
    const [filter, setFilter] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const transactions = clientTransactionsData[clientId] || [];

    const filteredTransactions = filter === "All"
        ? transactions
        : transactions.filter(t => t.segment === filter);

    const handleDownload = () => {
        const headers = ["Symbol", "ISIN", "Trade Date", "Exchange", "Segment", "Series", "Trade Type", "Auction", "Quantity", "Price", "Trade ID", "Order ID", "Order Execution Time", "Asset"];
        const csvContent = [headers.join(","), ...filteredTransactions.map(row => [row.symbol, row.isin, row.tradeDate, row.exchange, row.segment, row.series, row.tradeType, row.auction, row.quantity, row.price, row.tradeId, row.orderId, row.executionTime, row.asset].join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `transactions_${clientId}_${filter.toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="p-4 md:p-6 pb-4 bg-background/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">Transaction History</h2>
                    <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
                        {/* Filter Dropdown */}
                        <div className="relative flex-1 sm:flex-none">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-between w-full sm:w-[120px] md:w-[140px] px-3 md:px-4 py-2 md:py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-xs md:text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="leading-none truncate">{filter === "All" ? "All Assets" : filter}</span>
                                <ChevronDownIcon className="w-3 h-3 md:w-4 md:h-4 text-foreground ml-1 flex-shrink-0" />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-full sm:w-[120px] md:w-[140px] bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                                        {["All", "Equity", "MF", "Bond"].map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => { setFilter(item); setIsDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-xs md:text-sm font-medium transition-colors ${filter === item
                                                    ? "text-emerald-500 bg-emerald-500/10"
                                                    : "text-muted-foreground hover:bg-muted"
                                                    }`}
                                            >
                                                {item === "All" ? "All Assets" : item}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs md:text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap"
                        >
                            <DownloadIcon className="w-3 h-3 md:w-4 md:h-4 mb-[2px]" />
                            <span className="leading-none">Export</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-t border-b border-border">
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Symbol</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">ISIN</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Trade Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Exchange</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Segment</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Series</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Trade Type</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Auction</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Quantity</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Price</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Trade ID</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Order ID</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Order Execution Time</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {filteredTransactions.map((txn, i) => (
                            <tr key={i} className="hover:bg-primary/5 transition-colors">
                                <td className="py-5 px-6 font-bold text-foreground text-base whitespace-nowrap">{txn.symbol}</td>
                                <td className="py-5 px-6 text-xs text-muted-foreground font-medium whitespace-nowrap">{txn.isin}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.tradeDate}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.exchange}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.segment || "-"}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.series || "-"}</td>
                                <td className="py-5 px-6 whitespace-nowrap"><span className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-block min-w-[60px] text-center ${txn.tradeType === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>{txn.tradeType}</span></td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.auction || "No"}</td>
                                <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{txn.quantity}</td>
                                <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{txn.price}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.tradeId}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.orderId || "-"}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.executionTime || "-"}</td>
                                <td className="py-5 px-6 text-center whitespace-nowrap">
                                    <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                        {txn.asset || txn.segment}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredTransactions.length === 0 && (<tr><td colSpan={14} className="py-12 text-center text-muted-foreground">No transactions found for {filter}.</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PlaceholderTab = ({ title }: { title: string }) => (
    <div>
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        </div>
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-12 text-center">
            <p className="text-muted-foreground">Data will be displayed here based on the selected client.</p>
        </div>
    </div>
);

export default function ZMReports() {
    const [activeTab, setActiveTab] = useState<Tab>("Holdings");
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
    const [selectedBM, setSelectedBM] = useState<string | null>(null);
    const [selectedRM, setSelectedRM] = useState<string | null>(null);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);
    const [isBMDropdownOpen, setIsBMDropdownOpen] = useState(false);
    const [isRMDropdownOpen, setIsRMDropdownOpen] = useState(false);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

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
    const selectedBMData = bmsUnderBranch.find((b: any) => b.bmId === selectedBM);
    const rmsUnderBM = selectedBM ? bmRMsMap[selectedBM] || [] : [];
    const selectedRMData = rmsUnderBM.find((r: any) => r.rmId === selectedRM);
    const clientsUnderRM = selectedRM ? rmClientsMap[selectedRM] || [] : [];
    const selectedClientData = clientsUnderRM.find((c: any) => c.clientId === selectedClient);

    const resetSelections = (level: 'branch' | 'bm' | 'rm' | 'client') => {
        if (level === 'branch') { setSelectedBranch(null); setSelectedBM(null); setSelectedRM(null); setSelectedClient(null); }
        if (level === 'bm') { setSelectedBM(null); setSelectedRM(null); setSelectedClient(null); }
        if (level === 'rm') { setSelectedRM(null); setSelectedClient(null); }
        if (level === 'client') { setSelectedClient(null); }
    };

    return (
        <DashboardLayout role="zm">
            <div className="max-w-7xl mx-auto w-full p-8 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-display font-bold text-foreground">Reports</h1>
                </div>

                {/* Hierarchical Selector Card */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 mb-8">
                    <h3 className="text-lg font-bold text-foreground mb-4">Select Client</h3>
                    <div className="flex flex-wrap gap-4">
                        {/* Branch Selector */}
                        <div className="relative">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Branch</label>
                            <button onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)} className="flex items-center justify-between w-[170px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all">
                                <span className="truncate">{selectedBranch ? selectedBranchData?.branchName : "Select..."}</span>
                                <ChevronDownIcon className="w-4 h-4 ml-2" />
                            </button>
                            {isBranchDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsBranchDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-[170px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
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
                        {selectedBranch && (
                            <div className="relative">
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Branch Manager</label>
                                <button onClick={() => setIsBMDropdownOpen(!isBMDropdownOpen)} className="flex items-center justify-between w-[170px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all">
                                    <span className="truncate">{selectedBM ? selectedBMData?.bmName : "Select..."}</span>
                                    <ChevronDownIcon className="w-4 h-4 ml-2" />
                                </button>
                                {isBMDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsBMDropdownOpen(false)} />
                                        <div className="absolute left-0 mt-2 w-[170px] bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                                            {bmsUnderBranch.map((bm: any) => (
                                                <button
                                                    key={bm.bmId}
                                                    onClick={() => {
                                                        setSelectedBM(bm.bmId);

                                                        // Auto-select first RM
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
                        )}

                        {/* RM Selector */}
                        {selectedBM && (
                            <div className="relative">
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">RM</label>
                                <button onClick={() => setIsRMDropdownOpen(!isRMDropdownOpen)} className="flex items-center justify-between w-[170px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all">
                                    <span className="truncate">{selectedRM ? selectedRMData?.rmName : "Select..."}</span>
                                    <ChevronDownIcon className="w-4 h-4 ml-2" />
                                </button>
                                {isRMDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsRMDropdownOpen(false)} />
                                        <div className="absolute left-0 mt-2 w-[170px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                                            {rmsUnderBM.map((rm: any) => (
                                                <button
                                                    key={rm.rmId}
                                                    onClick={() => {
                                                        setSelectedRM(rm.rmId);

                                                        // Auto-select first Client
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
                        )}

                        {/* Client Selector */}
                        {selectedRM && (
                            <div className="relative">
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Client</label>
                                <button onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)} className="flex items-center justify-between w-[170px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all">
                                    <span className="truncate">{selectedClient ? selectedClientData?.clientName : "Select..."}</span>
                                    <ChevronDownIcon className="w-4 h-4 ml-2" />
                                </button>
                                {isClientDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsClientDropdownOpen(false)} />
                                        <div className="absolute left-0 mt-2 w-[170px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                                            {clientsUnderRM.map((client: any) => (
                                                <button key={client.clientId} onClick={() => { setSelectedClient(client.clientId); setIsClientDropdownOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedClient === client.clientId ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}>{client.clientName}</button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {selectedClient ? (
                    <>
                        {/* Selected Client Info */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{selectedClientData?.clientName}</h2>
                                <p className="text-sm text-muted-foreground">
                                    Branch: {selectedBranchData?.branchName} • BM: {selectedBMData?.bmName} • RM: {selectedRMData?.rmName}
                                    <br />Portfolio: {selectedClientData?.portfolioValue} • XIRR: {selectedClientData?.xirr}
                                </p>
                            </div>
                            <button
                                onClick={() => resetSelections('client')}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                                ← Change Client
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex overflow-x-auto gap-3 mb-8 pb-2 no-scrollbar">
                            {(["Holdings", "Transactions", "Ledger", "Dividends", "Tax P&L", "Capital Gains", "XIRR"] as Tab[]).map((tab) => (
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
                                    {activeTab === "Transactions" && <TransactionsTab clientId={selectedClient} />}
                                    {activeTab === "Ledger" && <PlaceholderTab title="Transaction Ledger" />}
                                    {activeTab === "XIRR" && <PlaceholderTab title="XIRR Report" />}
                                    {activeTab === "Dividends" && <PlaceholderTab title="Dividends Report" />}
                                    {activeTab === "Tax P&L" && <PlaceholderTab title="Tax P&L Report" />}
                                    {activeTab === "Capital Gains" && <PlaceholderTab title="Capital Gains Report" />}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </>
                ) : (
                    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-muted-foreground">
                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Select a Client</h3>
                        <p className="text-muted-foreground">Please select a Branch, BM, RM, and Client from the dropdowns above to view reports.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
