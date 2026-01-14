import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type Tab = "Holdings" | "Transactions" | "Ledger" | "Dividends" | "Tax P&L" | "Capital Gains" | "XIRR";

// --- Sample Data ---
const bmRMsData = [
    { rmName: "Amit Singh", rmId: "RM001", clientCount: 5, totalAUM: "₹2.57 Cr", todayChange: "+₹23,900", todayChangePercent: "+0.09%", avgXirr: "15.6%" },
    { rmName: "Neha Patel", rmId: "RM002", clientCount: 4, totalAUM: "₹1.85 Cr", todayChange: "-₹8,500", todayChangePercent: "-0.05%", avgXirr: "12.3%" },
    { rmName: "Rahul Verma", rmId: "RM003", clientCount: 6, totalAUM: "₹3.42 Cr", todayChange: "+₹45,200", todayChangePercent: "+0.13%", avgXirr: "18.2%" },
    { rmName: "Pooja Sharma", rmId: "RM004", clientCount: 3, totalAUM: "₹1.28 Cr", todayChange: "+₹12,800", todayChangePercent: "+0.10%", avgXirr: "14.8%" },
];

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
    "RM003": [
        { clientName: "Deepak Malhotra", clientId: "CL010", portfolioValue: "₹72.5 L", todayChange: "+₹18,200", returnsPercent: "+21.3%", xirr: "19.5%" },
        { clientName: "Sunita Aggarwal", clientId: "CL011", portfolioValue: "₹58.3 L", todayChange: "+₹15,800", returnsPercent: "+19.8%", xirr: "17.2%" },
        { clientName: "Ravi Khanna", clientId: "CL012", portfolioValue: "₹42.8 L", todayChange: "+₹9,400", returnsPercent: "+15.6%", xirr: "16.8%" },
        { clientName: "Geeta Kapoor", clientId: "CL013", portfolioValue: "₹55.2 L", todayChange: "-₹2,200", returnsPercent: "+18.2%", xirr: "18.5%" },
        { clientName: "Mohan Reddy", clientId: "CL014", portfolioValue: "₹68.4 L", todayChange: "+₹4,000", returnsPercent: "+17.5%", xirr: "19.2%" },
        { clientName: "Lakshmi Iyer", clientId: "CL015", portfolioValue: "₹44.8 L", todayChange: "+₹0", returnsPercent: "+16.8%", xirr: "17.8%" },
    ],
    "RM004": [
        { clientName: "Arun Nair", clientId: "CL016", portfolioValue: "₹38.5 L", todayChange: "+₹6,200", returnsPercent: "+13.5%", xirr: "14.2%" },
        { clientName: "Kavita Menon", clientId: "CL017", portfolioValue: "₹48.2 L", todayChange: "+₹4,600", returnsPercent: "+15.8%", xirr: "15.5%" },
        { clientName: "Vijay Kumar", clientId: "CL018", portfolioValue: "₹41.3 L", todayChange: "+₹2,000", returnsPercent: "+14.2%", xirr: "14.8%" },
    ],
};

// Holdings and Transaction data for sample clients
const clientHoldingsData: Record<string, any[]> = {
    "CL001": [
        { symbol: "RELIANCE", name: "Reliance Industries", isin: "INE002A01018", sector: "Energy", qtyAvailable: 150, qtyDiscrepant: 0, qtyLongTerm: 80, qtyPledgedMargin: 20, qtyPledgedLoan: 0, avgPrice: "2,380.00", prevClosing: "2,680.00", unrealizedPL: "45,000.00", unrealizedPLPercent: "12.61", type: "Equity" },
        { symbol: "HDFCBANK", name: "HDFC Bank", isin: "INE040A01034", sector: "Banking", qtyAvailable: 200, qtyDiscrepant: 10, qtyLongTerm: 150, qtyPledgedMargin: 40, qtyPledgedLoan: 0, avgPrice: "1,520.00", prevClosing: "1,720.00", unrealizedPL: "40,000.00", unrealizedPLPercent: "13.16", type: "Equity" },
    ],
    "CL010": [
        { symbol: "BAJFINANCE", name: "Bajaj Finance", isin: "INE296A01024", sector: "Finance", qtyAvailable: 100, qtyDiscrepant: 0, qtyLongTerm: 100, qtyPledgedMargin: 0, qtyPledgedLoan: 0, avgPrice: "5,800.00", prevClosing: "7,250.00", unrealizedPL: "1,45,000.00", unrealizedPLPercent: "25.00", type: "Equity" },
    ],
};

const clientTransactionsData: Record<string, any[]> = {
    "CL001": [
        { symbol: "RELIANCE", isin: "INE002A01018", tradeDate: "12-Jan-2026", exchange: "NSE", segment: "Equity", series: "EQ", tradeType: "BUY", auction: "No", quantity: "50", price: "2,450.00", tradeId: "T100123", orderId: "O223344", executionTime: "12-Jan-2026 10:30:15", asset: "Equity" },
    ],
    "CL010": [
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

const EyeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
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
                            <th className="py-5 px-6 text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50" style={{ minWidth: '200px' }}>Symbol</th>
                            <th className="py-5 px-6 text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">ISIN</th>
                            <th className="py-5 px-6 text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Sector</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Quantity Available</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Quantity Discrepant</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Quantity Long Term</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Quantity Pledged (Margin)</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Quantity Pledged (Loan)</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Average Price</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Previous Closing Price</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Unrealized P&L</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Unrealized P&L %</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Asset</th>
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

export default function BMReports() {
    const [activeTab, setActiveTab] = useState<Tab>("Holdings");
    const [selectedRM, setSelectedRM] = useState<string | null>(null);
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [isRMDropdownOpen, setIsRMDropdownOpen] = useState(false);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    const selectedRMData = bmRMsData.find(r => r.rmId === selectedRM);
    const clientsUnderRM = selectedRM ? rmClientsMap[selectedRM] || [] : [];
    const allClients = Object.values(rmClientsMap).flat();
    const displayClients = selectedRM ? clientsUnderRM : allClients;
    const selectedClientData = displayClients.find((c: any) => c.clientId === selectedClient);

    return (
        <DashboardLayout role="bm">
            <div className="max-w-7xl mx-auto w-full p-8 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-display font-bold text-foreground">Reports</h1>
                </div>

                {/* Selector Card */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 mb-8">
                    <h3 className="text-lg font-bold text-foreground mb-4">Select View</h3>
                    <div className="flex flex-wrap gap-4">
                        {/* RM Selector */}
                        <div className="relative">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Relationship Manager</label>
                            <button
                                onClick={() => setIsRMDropdownOpen(!isRMDropdownOpen)}
                                className="flex items-center justify-between w-[200px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="truncate">{selectedRM ? selectedRMData?.rmName : "All RMs"}</span>
                                <ChevronDownIcon className="w-4 h-4 text-foreground ml-2 flex-shrink-0" />
                            </button>
                            {isRMDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsRMDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-[200px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                                        <button
                                            onClick={() => { setSelectedRM(null); setSelectedClient(null); setIsRMDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${!selectedRM ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                                        >
                                            All RMs
                                        </button>
                                        {bmRMsData.map((rm) => (
                                            <button
                                                key={rm.rmId}
                                                onClick={() => { setSelectedRM(rm.rmId); setSelectedClient(null); setIsRMDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedRM === rm.rmId ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                                            >
                                                <div className="flex justify-between">
                                                    <span>{rm.rmName}</span>
                                                    <span className="text-xs text-muted-foreground">{rm.clientCount} clients</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Client Selector */}
                        <div className="relative">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Client</label>
                            <button
                                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                className="flex items-center justify-between w-[220px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="truncate">{selectedClient ? selectedClientData?.clientName : "Select a client..."}</span>
                                <ChevronDownIcon className="w-4 h-4 text-foreground ml-2 flex-shrink-0" />
                            </button>
                            {isClientDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsClientDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-[220px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-72 overflow-y-auto">
                                        {displayClients.map((client: any) => (
                                            <button
                                                key={client.clientId}
                                                onClick={() => {
                                                    setSelectedClient(client.clientId);
                                                    if (!selectedRM) {
                                                        const rmKey = Object.keys(rmClientsMap).find(key =>
                                                            rmClientsMap[key].some(c => c.clientId === client.clientId)
                                                        );
                                                        if (rmKey) setSelectedRM(rmKey);
                                                    }
                                                    setIsClientDropdownOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedClient === client.clientId ? "text-emerald-500 bg-emerald-500/10 font-semibold" : "text-foreground hover:bg-muted"}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span>{client.clientName}</span>
                                                    <span className="text-xs text-muted-foreground">{client.portfolioValue}</span>
                                                </div>
                                            </button>
                                        ))}
                                        {displayClients.length === 0 && (
                                            <div className="px-4 py-3 text-sm text-muted-foreground">No clients available</div>
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
                                <h2 className="text-2xl font-bold text-foreground">{selectedClientData?.clientName}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {selectedRM && `RM: ${selectedRMData?.rmName} • `}
                                    Portfolio: {selectedClientData?.portfolioValue} • XIRR: {selectedClientData?.xirr}
                                </p>
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
                ) : (<>
                    {!selectedRM && (
                        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden mb-8">
                            <div className="p-6 bg-background/50 border-b border-border">
                                <h2 className="text-xl font-bold text-foreground">Relationship Managers</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="py-4 px-6 text-muted-foreground font-semibold text-xs bg-background/50">RM Name</th>
                                            <th className="py-4 px-6 text-muted-foreground font-semibold text-xs bg-background/50">RM ID</th>
                                            <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">No. of Clients</th>
                                            <th className="py-4 px-6 text-right text-muted-foreground font-semibold text-xs bg-background/50">Total AUM</th>
                                            <th className="py-4 px-6 text-right text-muted-foreground font-semibold text-xs bg-background/50">Today's Change</th>
                                            <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">Avg XIRR</th>
                                            <th className="py-4 px-6 text-center text-muted-foreground font-semibold text-xs bg-background/50">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-sm">
                                        {bmRMsData.map((rm) => {
                                            const todayIsPositive = !rm.todayChange.startsWith('-');
                                            return (
                                                <tr key={rm.rmId} className="hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setSelectedRM(rm.rmId)}>
                                                    <td className="py-4 px-6 font-bold text-foreground">{rm.rmName}</td>
                                                    <td className="py-4 px-6 text-muted-foreground">{rm.rmId}</td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-500">
                                                            {rm.clientCount}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-bold text-foreground">{rm.totalAUM}</td>
                                                    <td className="py-4 px-6 text-right">
                                                        <span className={`font-bold ${todayIsPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            {rm.todayChange}
                                                        </span>
                                                        <span className={`text-xs block ${todayIsPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                                            {rm.todayChangePercent}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                                                            {rm.avgXirr}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-center">
                                                        <button
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs font-semibold text-primary transition-colors"
                                                            onClick={(e) => { e.stopPropagation(); setSelectedRM(rm.rmId); }}
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
                    )}

                    {/* Client Table - Shows when RM is selected but no client is selected */}
                    {selectedRM && !selectedClient && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-foreground">
                                    {selectedRMData?.rmName}'s Clients
                                </h2>
                                <button
                                    onClick={() => setSelectedRM(null)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    ← Back to All RMs
                                </button>
                            </div>

                            <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="py-4 px-6 text-muted-foreground font-semibold text-xs bg-background/50">Client Name</th>
                                                <th className="py-4 px-6 text-muted-foreground font-semibold text-xs bg-background/50">Client ID</th>
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
                                                        <td className="py-4 px-6 text-muted-foreground">{client.clientId}</td>
                                                        <td className="py-4 px-6 text-right font-bold text-foreground">{client.portfolioValue}</td>
                                                        <td className="py-4 px-6 text-right">
                                                            <span className={`font-bold ${todayIsPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                                                {client.todayChange}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${returnsIsPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                                                {client.returnsPercent}
                                                            </span>
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
                        </motion.div>
                    )}
                </>)}
            </div>
        </DashboardLayout>
    );
}
