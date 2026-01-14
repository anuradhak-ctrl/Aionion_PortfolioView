import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type Tab = "Holdings" | "Transactions" | "Ledger" | "Dividends" | "Tax P&L" | "Capital Gains" | "XIRR";

// --- Sample Data ---
const rmClientsData = [
    { clientName: "Rajesh Kumar", clientId: "CL001", portfolioValue: "₹45.5 L", xirr: "15.2%" },
    { clientName: "Priya Sharma", clientId: "CL002", portfolioValue: "₹32.8 L", xirr: "11.8%" },
    { clientName: "Amit Patel", clientId: "CL003", portfolioValue: "₹67.2 L", xirr: "19.4%" },
    { clientName: "Sneha Gupta", clientId: "CL004", portfolioValue: "₹22.1 L", xirr: "10.5%" },
    { clientName: "Vikram Mehta", clientId: "CL005", portfolioValue: "₹89.4 L", xirr: "21.2%" },
];

// Holdings data for each client
const clientHoldingsData: Record<string, any[]> = {
    "CL001": [
        { symbol: "RELIANCE", name: "Reliance Industries", isin: "INE002A01018", sector: "Energy", qtyAvailable: 150, qtyDiscrepant: 0, qtyLongTerm: 120, qtyPledgedMargin: 30, qtyPledgedLoan: 0, avgPrice: "2,380.00", prevClosing: "2,680.00", unrealizedPL: "45,000.00", unrealizedPLPercent: "12.61", type: "Equity" },
        { symbol: "HDFCBANK", name: "HDFC Bank", isin: "INE040A01034", sector: "Banking", qtyAvailable: 200, qtyDiscrepant: 0, qtyLongTerm: 180, qtyPledgedMargin: 20, qtyPledgedLoan: 0, avgPrice: "1,520.00", prevClosing: "1,720.00", unrealizedPL: "40,000.00", unrealizedPLPercent: "13.16", type: "Equity" },
    ],
    "CL002": [
        { symbol: "INFY", name: "Infosys", isin: "INE009A01021", sector: "IT", qtyAvailable: 180, qtyDiscrepant: 0, qtyLongTerm: 150, qtyPledgedMargin: 30, qtyPledgedLoan: 0, avgPrice: "1,380.00", prevClosing: "1,580.00", unrealizedPL: "36,000.00", unrealizedPLPercent: "14.49", type: "Equity" },
    ],
    "CL003": [
        { symbol: "BAJFINANCE", name: "Bajaj Finance", isin: "INE296A01024", sector: "Finance", qtyAvailable: 80, qtyDiscrepant: 0, qtyLongTerm: 80, qtyPledgedMargin: 0, qtyPledgedLoan: 0, avgPrice: "6,200.00", prevClosing: "7,450.00", unrealizedPL: "1,00,000.00", unrealizedPLPercent: "20.16", type: "Equity" },
    ],
    "CL004": [
        { symbol: "ICICIBANK", name: "ICICI Bank", isin: "INE090A01021", sector: "Banking", qtyAvailable: 300, qtyDiscrepant: 0, qtyLongTerm: 250, qtyPledgedMargin: 50, qtyPledgedLoan: 0, avgPrice: "850.00", prevClosing: "1,050.00", unrealizedPL: "60,000.00", unrealizedPLPercent: "23.53", type: "Equity" },
    ],
    "CL005": [
        { symbol: "HINDUNILVR", name: "Hindustan Unilever", isin: "INE030A01027", sector: "FMCG", qtyAvailable: 120, qtyDiscrepant: 0, qtyLongTerm: 100, qtyPledgedMargin: 20, qtyPledgedLoan: 0, avgPrice: "2,400.00", prevClosing: "2,650.00", unrealizedPL: "30,000.00", unrealizedPLPercent: "10.42", type: "Equity" },
    ],
};

// Transactions data for each client
const clientTransactionsData: Record<string, any[]> = {
    "CL001": [
        { symbol: "RELIANCE", isin: "INE002A01018", tradeDate: "12-Jan-2026", exchange: "NSE", segment: "Equity", series: "EQ", tradeType: "BUY", auction: "No", quantity: "50", price: "2,450.00", tradeId: "T100123", orderId: "O112233", executionTime: "12-Jan-2026 10:15:20", asset: "Equity" },
        { symbol: "HDFCBANK", isin: "INE040A01034", tradeDate: "05-Jan-2026", exchange: "NSE", segment: "Equity", series: "EQ", tradeType: "BUY", auction: "No", quantity: "100", price: "1,680.00", tradeId: "T100124", orderId: "O223344", executionTime: "05-Jan-2026 14:20:10", asset: "Equity" },
    ],
    "CL002": [
        { symbol: "INFY", isin: "INE009A01021", tradeDate: "08-Jan-2026", exchange: "BSE", segment: "Equity", series: "EQ", tradeType: "SELL", auction: "No", quantity: "30", price: "1,620.00", tradeId: "T100125", orderId: "O334455", executionTime: "08-Jan-2026 09:45:05", asset: "Equity" },
    ],
    "CL003": [
        { symbol: "BAJFINANCE", isin: "INE296A01024", tradeDate: "10-Jan-2026", exchange: "NSE", segment: "Equity", series: "EQ", tradeType: "BUY", auction: "No", quantity: "20", price: "7,200.00", tradeId: "T100126", orderId: "O445566", executionTime: "10-Jan-2026 12:30:15", asset: "Equity" },
    ],
    "CL004": [
        { symbol: "ICICIBANK", isin: "INE090A01021", tradeDate: "03-Jan-2026", exchange: "NSE", segment: "Equity", series: "EQ", tradeType: "BUY", auction: "No", quantity: "150", price: "980.00", tradeId: "T100127", orderId: "O556677", executionTime: "03-Jan-2026 11:05:40", asset: "Equity" },
    ],
    "CL005": [
        { symbol: "HINDUNILVR", isin: "INE030A01027", tradeDate: "07-Jan-2026", exchange: "BSE", segment: "Equity", series: "EQ", tradeType: "SELL", auction: "No", quantity: "20", price: "2,580.00", tradeId: "T100128", orderId: "O667788", executionTime: "07-Jan-2026 13:50:30", asset: "Equity" },
    ],
};

// Ledger data for each client
const clientLedgerData: Record<string, any[]> = {
    "CL001": [
        { particulars: "Opening Balance", postingDate: "", costCenter: "", voucherType: "", debit: "0.00", credit: "0", netBalance: "50,000.00", asset: "Equity" },
        { particulars: "Funds added via NEFT", postingDate: "02-Jan-2026", costCenter: "NSE-EQ", voucherType: "Bank Receipts", debit: "0.00", credit: "1,00,000", netBalance: "1,50,000.00", asset: "Equity" },
        { particulars: "Buy RELIANCE x50", postingDate: "12-Jan-2026", costCenter: "NSE-EQ", voucherType: "Trade Settlement", debit: "1,22,500", credit: "0", netBalance: "27,500.00", asset: "Equity" },
    ],
    "CL002": [
        { particulars: "Opening Balance", postingDate: "", costCenter: "", voucherType: "", debit: "0.00", credit: "0", netBalance: "25,000.00", asset: "Equity" },
        { particulars: "Sell INFY x30", postingDate: "08-Jan-2026", costCenter: "BSE-EQ", voucherType: "Trade Settlement", debit: "0", credit: "48,600", netBalance: "73,600.00", asset: "Equity" },
    ],
    "CL003": [
        { particulars: "Opening Balance", postingDate: "", costCenter: "", voucherType: "", debit: "0.00", credit: "0", netBalance: "2,00,000.00", asset: "Equity" },
    ],
    "CL004": [
        { particulars: "Opening Balance", postingDate: "", costCenter: "", voucherType: "", debit: "0.00", credit: "0", netBalance: "1,50,000.00", asset: "Equity" },
    ],
    "CL005": [
        { particulars: "Opening Balance", postingDate: "", costCenter: "", voucherType: "", debit: "0.00", credit: "0", netBalance: "3,00,000.00", asset: "Equity" },
    ],
};

// XIRR data for each client
const clientXirrData: Record<string, any[]> = {
    "CL001": [
        { symbol: "RELIANCE", isin: "INE002A01018", firstBuyDate: "15-Mar-2024", lastTransactionDate: "12-Jan-2026", totalBuyAmount: "3,57,000.00", totalSellAmount: "0", currentValue: "4,02,000.00", netGainLoss: "45,000.00", holdingPeriod: "668", xirrPercent: "15.2" },
        { symbol: "HDFCBANK", isin: "INE040A01034", firstBuyDate: "20-Jun-2023", lastTransactionDate: "05-Jan-2026", totalBuyAmount: "3,04,000.00", totalSellAmount: "0", currentValue: "3,44,000.00", netGainLoss: "40,000.00", holdingPeriod: "930", xirrPercent: "14.8" },
    ],
    "CL002": [
        { symbol: "INFY", isin: "INE009A01021", firstBuyDate: "10-Feb-2024", lastTransactionDate: "08-Jan-2026", totalBuyAmount: "2,48,400.00", totalSellAmount: "48,600.00", currentValue: "2,36,400.00", netGainLoss: "36,600.00", holdingPeriod: "698", xirrPercent: "11.8" },
    ],
    "CL003": [
        { symbol: "BAJFINANCE", isin: "INE296A01024", firstBuyDate: "05-Jan-2024", lastTransactionDate: "10-Jan-2026", totalBuyAmount: "4,96,000.00", totalSellAmount: "0", currentValue: "5,96,000.00", netGainLoss: "1,00,000.00", holdingPeriod: "735", xirrPercent: "19.4" },
    ],
    "CL004": [
        { symbol: "ICICIBANK", isin: "INE090A01021", firstBuyDate: "12-Apr-2024", lastTransactionDate: "03-Jan-2026", totalBuyAmount: "2,55,000.00", totalSellAmount: "0", currentValue: "3,15,000.00", netGainLoss: "60,000.00", holdingPeriod: "631", xirrPercent: "10.5" },
    ],
    "CL005": [
        { symbol: "HINDUNILVR", isin: "INE030A01027", firstBuyDate: "18-May-2023", lastTransactionDate: "07-Jan-2026", totalBuyAmount: "2,88,000.00", totalSellAmount: "51,600.00", currentValue: "2,65,000.00", netGainLoss: "28,600.00", holdingPeriod: "965", xirrPercent: "21.2" },
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

const LedgerTab = ({ clientId }: { clientId: string }) => {
    const [filter, setFilter] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const ledger = clientLedgerData[clientId] || [];

    const filteredLedger = filter === "All"
        ? ledger
        : ledger.filter(entry => entry.asset === filter);

    const handleDownload = () => {
        const headers = ["Particulars", "Posting Date", "Cost Center", "Voucher Type", "Debit", "Credit", "Net Balance", "Asset"];
        const csvContent = [headers.join(","), ...filteredLedger.map(row => [row.particulars, row.postingDate, row.costCenter, row.voucherType, row.debit, row.credit, row.netBalance, row.asset].join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `ledger_${clientId}_${filter.toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="p-4 md:p-6 pb-4 bg-background/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">Transaction Ledger</h2>
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
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50" style={{ minWidth: '280px' }}>Particulars</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Posting Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Cost Center</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Voucher Type</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Debit</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Credit</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Net Balance</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {filteredLedger.map((entry, i) => {
                            const isOpeningClosing = entry.particulars.includes("Opening") || entry.particulars.includes("Closing");
                            return (
                                <tr key={i} className={`hover:bg-muted/30 transition-colors ${isOpeningClosing ? 'font-bold bg-muted/20' : ''}`}>
                                    <td className="py-5 px-6 text-foreground whitespace-nowrap" style={{ minWidth: '280px' }}>{entry.particulars || "-"}</td>
                                    <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">{entry.postingDate || "-"}</td>
                                    <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">{entry.costCenter || "-"}</td>
                                    <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">{entry.voucherType || "-"}</td>
                                    <td className="py-5 px-6 text-right font-bold text-foreground whitespace-nowrap">{entry.debit || "-"}</td>
                                    <td className="py-5 px-6 text-right font-bold text-foreground whitespace-nowrap">{entry.credit || "-"}</td>
                                    <td className="py-5 px-6 text-right font-bold text-emerald-500 whitespace-nowrap">{entry.netBalance || "-"}</td>
                                    <td className="py-5 px-6 text-center whitespace-nowrap">
                                        <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                            {entry.asset || "-"}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredLedger.length === 0 && (
                            <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No ledger entries found for {filter}.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const XIRRTab = ({ clientId }: { clientId: string }) => {
    const xirrData = clientXirrData[clientId] || [];

    const handleDownload = () => {
        const headers = ["Symbol", "ISIN", "First Buy Date", "Last Transaction", "Total Buy", "Total Sell", "Current Value", "Net Gain/Loss", "Holding Days", "XIRR %"];
        const csvContent = [
            headers.join(","),
            ...xirrData.map(row => [row.symbol, row.isin, row.firstBuyDate, row.lastTransactionDate, row.totalBuyAmount, row.totalSellAmount, row.currentValue, row.netGainLoss, row.holdingPeriod, row.xirrPercent].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `xirr_${clientId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header Section */}
            <div className="p-4 md:p-6 pb-4 bg-background/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">XIRR Report</h2>
                    <div className="flex gap-2 md:gap-4 w-full sm:w-auto">
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
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">First Buy Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Last Transaction</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Total Buy</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Total Sell</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Current Value</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Net Gain/Loss</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Holding Days</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">XIRR %</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {xirrData.map((row, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="py-5 px-6 font-bold text-foreground whitespace-nowrap">{row.symbol}</td>
                                <td className="py-5 px-6 text-xs text-muted-foreground font-medium whitespace-nowrap">{row.isin}</td>
                                <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">{row.firstBuyDate}</td>
                                <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">{row.lastTransactionDate}</td>
                                <td className="py-5 px-6 text-right text-muted-foreground font-medium whitespace-nowrap">{row.totalBuyAmount}</td>
                                <td className="py-5 px-6 text-right text-muted-foreground font-medium whitespace-nowrap">{row.totalSellAmount}</td>
                                <td className="py-5 px-6 text-right font-bold text-foreground whitespace-nowrap">{row.currentValue}</td>
                                <td className="py-5 px-6 text-right font-bold text-emerald-500 whitespace-nowrap">{row.netGainLoss}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap">{row.holdingPeriod}</td>
                                <td className="py-5 px-6 text-center whitespace-nowrap">
                                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500">{row.xirrPercent}%</span>
                                </td>
                            </tr>
                        ))}
                        {xirrData.length === 0 && (
                            <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">No XIRR data found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const PlaceholderTab = ({ title }: { title: string }) => (
    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-12 text-center">
        <h2 className="text-xl font-bold text-foreground mb-4">{title}</h2>
        <p className="text-muted-foreground">Data will be displayed here based on the selected client.</p>
    </div>
);

export default function RMReports() {
    const [activeTab, setActiveTab] = useState<Tab>("Holdings");
    const [selectedClient, setSelectedClient] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const selectedClientData = rmClientsData.find(c => c.clientId === selectedClient);

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
                                <span className="truncate">{selectedClient ? selectedClientData?.clientName : "Select a client..."}</span>
                                <ChevronDownIcon className="w-4 h-4 text-foreground ml-2 flex-shrink-0" />
                            </button>
                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-[220px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                                        {rmClientsData.map((client) => (
                                            <button
                                                key={client.clientId}
                                                onClick={() => { setSelectedClient(client.clientId); setIsDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-3 text-sm transition-colors ${selectedClient === client.clientId ? "text-emerald-500 bg-emerald-500/10 font-semibold" : "text-foreground hover:bg-muted"}`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span>{client.clientName}</span>
                                                    <span className="text-xs text-muted-foreground">{client.portfolioValue}</span>
                                                </div>
                                            </button>
                                        ))}
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
                                <p className="text-sm text-muted-foreground">Portfolio: {selectedClientData?.portfolioValue} • XIRR: {selectedClientData?.xirr}</p>
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
                                    {activeTab === "Ledger" && <LedgerTab clientId={selectedClient} />}
                                    {activeTab === "XIRR" && <XIRRTab clientId={selectedClient} />}
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
