import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// --- Types ---
type Tab = "Holdings" | "Transactions" | "Ledger" | "Dividends" | "Tax P&L" | "Capital Gains" | "XIRR";

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

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-card rounded-2xl p-6 border border-border/50 shadow-sm ${className}`}>
        {children}
    </div>
);

const StatCard = ({ icon, label, value, subtext }: { icon?: React.ReactNode; label: string; value: string; subtext?: string }) => (
    <Card className="flex flex-col h-full hover:bg-accent/5 transition-colors">
        {icon && <div className="mb-4 text-emerald-500 bg-emerald-500/10 p-3 rounded-lg w-fit">{icon}</div>}
        <span className="text-muted-foreground text-sm font-medium mb-1">{label}</span>
        <span className="text-foreground text-3xl font-bold mb-1">{value}</span>
        {subtext && <span className="text-xs text-muted-foreground">{subtext}</span>}
    </Card>
);

const PeriodCard = ({ period, value }: { period: string; value: string }) => (
    <div className="bg-muted/30 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors border border-border/50">
        <span className="text-muted-foreground text-xs font-bold uppercase mb-2">{period}</span>
        <span className="text-foreground text-xl font-bold">{value}</span>
    </div>
);

// --- Icons ---

const ChartIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>
);
const TrendingUpIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m23 6-9.5 9.5-5-5L1 18"></path><path d="M17 6h6v6"></path></svg>
);
const FileTextIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
);
const WalletIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M21 11V7a4 4 0 0 0-8 0"></path></svg>
);
const DownloadIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
);
const ChevronDownIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9"></polyline></svg>
);


// --- Tab Content ---

const LedgerTab = () => {
    const [filter, setFilter] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const transactions = [
        { date: "2025-12-28", type: "Buy", security: "RELIANCE", qty: "10", price: "₹2650", value: "₹26,500", asset: "Equity" },
        { date: "2025-12-27", type: "Dividend", security: "HDFCBANK", qty: "-", price: "-", value: "₹1,500", asset: "Equity" },
        { date: "2025-12-26", type: "Purchase", security: "Axis Bluechip", qty: "100", price: "₹48.1", value: "₹4,810", asset: "MF" },
        { date: "2025-12-24", type: "Interest", security: "GOI 7.26%", qty: "-", price: "-", value: "₹3,625", asset: "Bond" },
    ];

    const filteredTransactions = filter === "All"
        ? transactions
        : transactions.filter(t => t.asset === filter);

    const handleDownload = () => {
        const headers = ["Date", "Type", "Security", "Qty", "Price", "Value", "Asset"];
        const csvContent = [
            headers.join(","),
            ...filteredTransactions.map(row =>
                [row.date, row.type, row.security, row.qty, row.price, row.value.replace(/,/g, ''), row.asset].join(",")
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `ledger_report_${filter.toLowerCase()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div className="bg-card rounded-2xl border border-border/50 p-6 pb-0 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-foreground">Transaction Ledger</h2>

                    <div className="flex gap-4">
                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-between w-[140px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="leading-none">{filter === "All" ? "All Assets" : filter}</span>
                                <ChevronDownIcon className="w-4 h-4 text-foreground" />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-[140px] bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                                        {["All", "Equity", "MF", "Bond"].map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => { setFilter(item); setIsDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${filter === item
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

                        {/* Export Button */}
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all min-w-[120px]"
                        >
                            <DownloadIcon className="w-4 h-4 mb-[2px]" />
                            <span className="leading-none">Export</span>
                        </button>
                    </div>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Type</th>
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Security</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-sm">Qty</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-sm">Price</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-medium text-sm">Value</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-sm">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {filteredTransactions.map((txn, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="py-5 px-6 text-muted-foreground font-medium">{txn.date}</td>
                                <td className="py-5 px-6">
                                    <span className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-block min-w-[80px] text-center ${(txn.type === 'Buy' || txn.type === 'Purchase') ? 'bg-emerald-500/10 text-emerald-500' :
                                        (txn.type === 'Dividend' || txn.type === 'Interest') ? 'bg-blue-500/10 text-blue-500' :
                                            'bg-red-500/10 text-red-500'
                                        }`}>
                                        {txn.type}
                                    </span>
                                </td>
                                <td className="py-5 px-6 text-foreground font-bold">{txn.security}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium">{txn.qty}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium">{txn.price}</td>
                                <td className="py-5 px-6 text-right text-foreground font-bold text-base">{txn.value}</td>
                                <td className="py-5 px-6 text-center">
                                    <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground w-[60px] inline-block">
                                        {txn.asset}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                    No transactions found for {filter === "All" ? "all assets" : filter}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const HoldingsTab = () => {
    const [filter, setFilter] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const holdings = [
        {
            symbol: "INFY",
            isin: "INE009A01021",
            sector: "IT",
            qtyAvailable: 100,
            qtyDiscrepant: 0,
            qtyLongTerm: 80,
            qtyPledgedMargin: 20,
            qtyPledgedLoan: 0,
            avgPrice: "1,250.00",
            prevClosing: "1,540.00",
            unrealizedPL: "34,800.00",
            unrealizedPLPercent: "23.2",
            type: "Equity"
        },
        {
            symbol: "TCS",
            isin: "INE467B01029",
            sector: "IT",
            qtyAvailable: 50,
            qtyDiscrepant: 0,
            qtyLongTerm: 50,
            qtyPledgedMargin: 0,
            qtyPledgedLoan: 0,
            avgPrice: "3,200.00",
            prevClosing: "3,580.00",
            unrealizedPL: "19,000.00",
            unrealizedPLPercent: "11.88",
            type: "Equity"
        },
        {
            symbol: "HDFCBANK",
            isin: "INE040A01034",
            sector: "Banking",
            qtyAvailable: 200,
            qtyDiscrepant: 10,
            qtyLongTerm: 150,
            qtyPledgedMargin: 40,
            qtyPledgedLoan: 0,
            avgPrice: "1,420.00",
            prevClosing: "1,610.00",
            unrealizedPL: "47,500.00",
            unrealizedPLPercent: "13.38",
            type: "Equity"
        },
        {
            symbol: "AX123456",
            isin: "INF846K01EW2",
            sector: "Large Cap",
            qtyAvailable: 1500,
            qtyDiscrepant: 0,
            qtyLongTerm: 1500,
            qtyPledgedMargin: 0,
            qtyPledgedLoan: 0,
            avgPrice: "42.50",
            prevClosing: "48.20",
            unrealizedPL: "8,550.00",
            unrealizedPLPercent: "13.41",
            type: "MF"
        },
        {
            symbol: "GOI 7.26%",
            isin: "IN0020180034",
            sector: "Government",
            qtyAvailable: 5,
            qtyDiscrepant: 0,
            qtyLongTerm: 5,
            qtyPledgedMargin: 0,
            qtyPledgedLoan: 0,
            avgPrice: "102.50",
            prevClosing: "102.75",
            unrealizedPL: "1,250.00",
            unrealizedPLPercent: "0.24",
            type: "Bond"
        },
    ];

    const filteredHoldings = filter === "All"
        ? holdings
        : holdings.filter(h => h.type === filter);

    const handleDownload = () => {
        const headers = ["Symbol", "ISIN", "Sector", "Quantity Available", "Quantity Discrepant", "Quantity Long Term", "Quantity Pledged (Margin)", "Quantity Pledged (Loan)", "Average Price", "Previous Closing Price", "Unrealized P&L", "Unrealized P&L %", "Asset"];
        const csvContent = [
            headers.join(","),
            ...filteredHoldings.map(row =>
                [row.symbol, row.isin, row.sector, row.qtyAvailable, row.qtyDiscrepant, row.qtyLongTerm, row.qtyPledgedMargin, row.qtyPledgedLoan, row.avgPrice, row.prevClosing, row.unrealizedPL, row.unrealizedPLPercent, row.type].join(",")
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `holdings_report_${filter.toLowerCase()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };



    return (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header Section - No Scroll */}
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

                        {/* Export Button */}
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

            {/* Table Section - With Horizontal Scroll */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-t border-b border-border">
                            <th className="py-5 px-6 text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Symbol</th>
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
                                <td className="py-5 px-6 text-foreground font-bold whitespace-nowrap">{h.symbol}</td>
                                <td className="py-5 px-6 text-xs text-muted-foreground font-medium whitespace-nowrap">{h.isin}</td>
                                <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">{h.sector}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap">{h.qtyAvailable}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap">{h.qtyDiscrepant}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap">{h.qtyLongTerm}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap">{h.qtyPledgedMargin}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap">{h.qtyPledgedLoan}</td>
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
                        {filteredHoldings.length === 0 && (
                            <tr>
                                <td colSpan={13} className="py-12 text-center text-muted-foreground">
                                    No holdings found for {filter === "All" ? "all assets" : filter}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};



const TransactionsTab = () => {
    const [filter, setFilter] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const transactions = [
        { id: "TXN001", date: "2025-12-28", type: "Buy", security: "RELIANCE", amount: "₹26,500", status: "Completed", asset: "Equity" },
        { id: "TXN002", date: "2025-12-27", type: "Dividend", security: "HDFCBANK", amount: "₹1,500", status: "Completed", asset: "Equity" },
        { id: "TXN003", date: "2025-12-26", type: "Purchase", security: "Axis Bluechip", amount: "₹4,810", status: "Completed", asset: "MF" },
        { id: "TXN004", date: "2025-12-24", type: "Interest", security: "GOI 7.26%", amount: "₹3,625", status: "Completed", asset: "Bond" },
        { id: "TXN005", date: "2025-12-20", type: "Sell", security: "TCS", amount: "₹45,000", status: "Completed", asset: "Equity" },
    ];

    const filteredTransactions = filter === "All"
        ? transactions
        : transactions.filter(t => t.asset === filter);

    const handleDownload = () => {
        const headers = ["ID", "Date", "Type", "Security", "Amount", "Status", "Asset"];
        const csvContent = [
            headers.join(","),
            ...filteredTransactions.map(row =>
                [row.id, row.date, row.type, row.security, row.amount, row.status, row.asset].join(",")
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `transaction_report_${filter.toLowerCase()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div className="bg-card rounded-2xl border border-border/50 p-6 pb-0 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-foreground">Transaction History</h2>

                    <div className="flex gap-4">
                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-between w-[140px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="leading-none">{filter === "All" ? "All Assets" : filter}</span>
                                <ChevronDownIcon className="w-4 h-4 text-foreground" />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-[140px] bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                                        {["All", "Equity", "MF", "Bond"].map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => { setFilter(item); setIsDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${filter === item
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

                        {/* Export Button */}
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all min-w-[120px]"
                        >
                            <DownloadIcon className="w-4 h-4 mb-[2px]" />
                            <span className="leading-none">Export</span>
                        </button>
                    </div>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">ID</th>
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Type</th>
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Security</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-medium text-sm">Amount</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-sm">Status</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-sm">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {filteredTransactions.map((txn, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="py-5 px-6 text-muted-foreground font-medium">{txn.id}</td>
                                <td className="py-5 px-6 text-muted-foreground font-medium">{txn.date}</td>
                                <td className="py-5 px-6">
                                    <span className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-block min-w-[80px] text-center ${(txn.type === 'Buy' || txn.type === 'Purchase') ? 'bg-emerald-500/10 text-emerald-500' :
                                        (txn.type === 'Dividend' || txn.type === 'Interest') ? 'bg-blue-500/10 text-blue-500' :
                                            'bg-red-500/10 text-red-500'
                                        }`}>
                                        {txn.type}
                                    </span>
                                </td>
                                <td className="py-5 px-6 text-foreground font-bold">{txn.security}</td>
                                <td className="py-5 px-6 text-right text-foreground font-bold text-base">{txn.amount}</td>
                                <td className="py-5 px-6 text-center">
                                    <span className="px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold inline-block">
                                        {txn.status}
                                    </span>
                                </td>
                                <td className="py-5 px-6 text-center">
                                    <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground w-[60px] inline-block">
                                        {txn.asset}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                    No transactions found for {filter === "All" ? "all assets" : filter}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};




const XIRRTab = () => {
    const xirrData = [
        { period: "1 Month", equity: "2.1%", mf: "1.8%", bond: "0.5%", portfolio: "1.9%" },
        { period: "3 Months", equity: "6.5%", mf: "5.2%", bond: "1.5%", portfolio: "5.8%" },
        { period: "6 Months", equity: "10.2%", mf: "8.5%", bond: "3.0%", portfolio: "9.2%" },
        { period: "1 Year", equity: "22.3%", mf: "16.8%", bond: "6.5%", portfolio: "18.5%" },
        { period: "3 Years", equity: "17.5%", mf: "14.2%", bond: "7.2%", portfolio: "15.2%" },
        { period: "5 Years", equity: "16.8%", mf: "13.5%", bond: "7.8%", portfolio: "14.8%" },
    ];

    const handleDownload = () => {
        const headers = ["Period", "Equity", "MF", "Bond", "Portfolio"];
        const csvContent = [
            headers.join(","),
            ...xirrData.map(row =>
                [row.period, row.equity, row.mf, row.bond, row.portfolio].join(",")
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `xirr_report.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            {/* Original Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<ChartIcon />} label="Portfolio XIRR" value="18.5%" subtext="Since Inception" />
                <StatCard icon={<TrendingUpIcon />} label="Equity XIRR" value="22.3%" />
                <StatCard icon={<TrendingUpIcon />} label="MF XIRR" value="16.8%" />
                <StatCard icon={<TrendingUpIcon />} label="Bonds XIRR" value="8.2%" />
            </div>

            <Card>
                <h2 className="text-xl font-bold text-foreground mb-6">XIRR by Period</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <PeriodCard period="1m" value="2.1%" />
                    <PeriodCard period="3m" value="5.8%" />
                    <PeriodCard period="6m" value="9.2%" />
                    <PeriodCard period="1y" value="18.5%" />
                    <PeriodCard period="3y" value="15.2%" />
                    <PeriodCard period="5y" value="14.8%" />
                </div>
            </Card>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 pb-0 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-foreground">XIRR Analysis Breakdown</h2>

                    <div className="flex gap-4">
                        {/* Export Button */}
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all min-w-[120px]"
                        >
                            <DownloadIcon className="w-4 h-4 mb-[2px]" />
                            <span className="leading-none">Export</span>
                        </button>
                    </div>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Period</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-sm">Equity</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-sm">Mutual Funds</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-sm">Bonds</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-sm">Portfolio</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {xirrData.map((xirr, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="py-5 px-6 text-foreground font-bold">{xirr.period}</td>
                                <td className="py-5 px-6 text-center text-emerald-500 font-bold text-base">{xirr.equity}</td>
                                <td className="py-5 px-6 text-center text-blue-500 font-bold text-base">{xirr.mf}</td>
                                <td className="py-5 px-6 text-center text-orange-500 font-bold text-base">{xirr.bond}</td>
                                <td className="py-5 px-6 text-center text-foreground font-bold text-lg">{xirr.portfolio}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const CapitalGainsTab = () => {
    const [filter, setFilter] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const capitalGains = [
        { date: "2025-12-20", security: "TCS", type: "Equity", buyPrice: "₹3,200", sellPrice: "₹3,650", gain: "₹45,000", classification: "STCG" },
        { date: "2025-11-15", security: "Infosys", type: "Equity", buyPrice: "₹1,200", sellPrice: "₹1,550", gain: "₹1,40,000", classification: "LTCG" },
        { date: "2025-10-10", security: "SBI Bluechip", type: "MF", buyPrice: "₹45", sellPrice: "₹52", gain: "₹14,000", classification: "LTCG" },
        { date: "2025-09-05", security: "HDFC Corp Bond", type: "Bond", buyPrice: "₹98", sellPrice: "₹102", gain: "₹4,000", classification: "LTCG" },
    ];

    const filteredCapitalGains = filter === "All"
        ? capitalGains
        : capitalGains.filter(c => c.type === filter);

    const handleDownload = () => {
        const headers = ["Date", "Security", "Type", "Buy Price", "Sell Price", "Gain/Loss", "Classification"];
        const csvContent = [
            headers.join(","),
            ...filteredCapitalGains.map(row =>
                [row.date, row.security, row.type, row.buyPrice, row.sellPrice, row.gain, row.classification].join(",")
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `capital_gains_report_${filter.toLowerCase()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            {/* Original Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<TrendingUpIcon />} label="Total Realized" value="₹1,85,000" />
                <StatCard icon={<FileTextIcon />} label="STCG (111A)" value="₹45,000" subtext="Tax @ 15%" />
                <StatCard icon={<FileTextIcon />} label="LTCG (112A)" value="₹1,40,000" subtext="Tax @ 10%" />
                <StatCard icon={<FileTextIcon />} label="Est. Tax" value="₹10,750" />
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 pb-0 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-foreground">Capital Gains Breakdown – FY 2025-26</h2>

                    <div className="flex gap-4">
                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-between w-[140px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="leading-none">{filter === "All" ? "All Assets" : filter}</span>
                                <ChevronDownIcon className="w-4 h-4 text-foreground" />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-[140px] bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                                        {["All", "Equity", "MF", "Bond"].map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => { setFilter(item); setIsDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${filter === item
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

                        {/* Export Button */}
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all min-w-[120px]"
                        >
                            <DownloadIcon className="w-4 h-4 mb-[2px]" />
                            <span className="leading-none">Export</span>
                        </button>
                    </div>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Security</th>
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Type</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-medium text-sm">Buy Price</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-medium text-sm">Sell Price</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-medium text-sm">Gain/Loss</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-sm">Type</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {filteredCapitalGains.map((cg, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="py-5 px-6 text-muted-foreground font-medium">{cg.date}</td>
                                <td className="py-5 px-6 text-foreground font-bold">{cg.security}</td>
                                <td className="py-5 px-6">
                                    <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                        {cg.type}
                                    </span>
                                </td>
                                <td className="py-5 px-6 text-right text-muted-foreground font-medium">{cg.buyPrice}</td>
                                <td className="py-5 px-6 text-right text-muted-foreground font-medium">{cg.sellPrice}</td>
                                <td className="py-5 px-6 text-right text-emerald-500 font-bold text-base">{cg.gain}</td>
                                <td className="py-5 px-6 text-center">
                                    <span className={`px-3 py-1.5 rounded text-xs font-semibold inline-block ${cg.classification === "STCG"
                                        ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                                        : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                        }`}>
                                        {cg.classification}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredCapitalGains.length === 0 && (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                    No capital gains found for {filter === "All" ? "all assets" : filter}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TaxPnLTab = () => {
    const [filter, setFilter] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const taxItems = [
        { date: "2025-03-31", security: "RELIANCE", type: "Equity", income: "₹45,000", taxLiability: "₹6,750", section: "STCG" },
        { date: "2025-03-31", security: "HDFCBANK", type: "Equity", income: "₹1,40,000", taxLiability: "₹14,000", section: "LTCG" },
        { date: "2025-03-31", security: "Axis Bluechip", type: "MF", income: "₹2,200", taxLiability: "₹220", section: "Dividend" },
        { date: "2025-03-31", security: "GOI Bond", type: "Bond", income: "₹42,350", taxLiability: "₹4,235", section: "Interest" },
    ];

    const filteredTaxItems = filter === "All"
        ? taxItems
        : taxItems.filter(t => t.type === filter);

    const handleDownload = () => {
        const headers = ["Date", "Security", "Type", "Income/Gain", "Tax Liability", "Section"];
        const csvContent = [
            headers.join(","),
            ...filteredTaxItems.map(row =>
                [row.date, row.security, row.type, row.income, row.taxLiability, row.section].join(",")
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `tax_pnl_report_${filter.toLowerCase()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Original Cards */}
            <h2 className="text-xl font-bold text-foreground">Income Tax P&L – FY 2025–26</h2>

            <Card className="bg-muted/10">
                <h3 className="text-emerald-500 font-semibold mb-4">Capital Gains (Section 45)</h3>
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <p className="text-muted-foreground text-sm font-medium mb-1">STCG (111A)</p>
                        <p className="text-foreground text-xl font-bold">₹45,000</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-sm font-medium mb-1">LTCG (112A)</p>
                        <p className="text-foreground text-xl font-bold">₹1,40,000</p>
                    </div>
                </div>
            </Card>

            <Card className="bg-muted/10">
                <h3 className="text-orange-500 font-semibold mb-4">Other Sources</h3>
                <div className="grid grid-cols-3 gap-8">
                    <div>
                        <p className="text-muted-foreground text-sm font-medium mb-1">Dividends</p>
                        <p className="text-foreground text-xl font-bold">₹28,500</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-sm font-medium mb-1">Interest</p>
                        <p className="text-foreground text-xl font-bold">₹42,350</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground text-sm font-medium mb-1">TDS</p>
                        <p className="text-foreground text-xl font-bold">₹7,085</p>
                    </div>
                </div>
            </Card>

            {/* Tax Liability Block */}
            <div className="bg-card rounded-2xl p-6 border border-border/50 relative overflow-hidden flex justify-between items-center group shadow-sm">
                <div className="absolute inset-0 bg-teal-500/10 transition-all group-hover:bg-teal-500/15" />
                <span className="relative z-10 text-foreground font-bold text-lg">Est. Tax Liability</span>
                <span className="relative z-10 text-emerald-500 text-3xl font-bold">₹17,835</span>
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 pb-0 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-foreground">Detailed Tax P&L Breakdown</h2>

                    <div className="flex gap-4">
                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-between w-[140px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="leading-none">{filter === "All" ? "All Assets" : filter}</span>
                                <ChevronDownIcon className="w-4 h-4 text-foreground" />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-[140px] bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                                        {["All", "Equity", "MF", "Bond"].map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => { setFilter(item); setIsDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${filter === item
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

                        {/* Export Button */}
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all min-w-[120px]"
                        >
                            <DownloadIcon className="w-4 h-4 mb-[2px]" />
                            <span className="leading-none">Export</span>
                        </button>
                    </div>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Security</th>
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Type</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-medium text-sm">Income/Gain</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-medium text-sm">Tax Liability</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-sm">Section</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {filteredTaxItems.map((item, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="py-5 px-6 text-muted-foreground font-medium">{item.date}</td>
                                <td className="py-5 px-6 text-foreground font-bold">{item.security}</td>
                                <td className="py-5 px-6">
                                    <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                        {item.type}
                                    </span>
                                </td>
                                <td className="py-5 px-6 text-right text-foreground font-bold text-base">{item.income}</td>
                                <td className="py-5 px-6 text-right text-orange-500 font-bold text-base">{item.taxLiability}</td>
                                <td className="py-5 px-6 text-center">
                                    <span className="px-3 py-1.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-semibold inline-block">
                                        {item.section}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredTaxItems.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                    No tax items found for {filter === "All" ? "all assets" : filter}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DividendsTab = () => {
    const [filter, setFilter] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const dividends = [
        { date: "2025-12-15", security: "HDFCBANK", type: "Equity", amount: "₹1,500", tds: "₹150", status: "Credited" },
        { date: "2025-11-20", security: "Reliance", type: "Equity", amount: "₹2,200", tds: "₹220", status: "Credited" },
        { date: "2025-10-10", security: "Axis Bluechip", type: "MF", amount: "₹850", tds: "₹85", status: "Credited" },
        { date: "2025-09-05", security: "GOI Bond", type: "Bond", amount: "₹3,625", tds: "₹362", status: "Credited" },
    ];

    const filteredDividends = filter === "All"
        ? dividends
        : dividends.filter(d => d.type === filter);

    const handleDownload = () => {
        const headers = ["Date", "Security", "Type", "Amount", "TDS", "Status"];
        const csvContent = [
            headers.join(","),
            ...filteredDividends.map(row =>
                [row.date, row.security, row.type, row.amount, row.tds, row.status].join(",")
            )
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `dividends_report_${filter.toLowerCase()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            {/* Original Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<WalletIcon />} label="Total Dividends" value="₹28,500" />
                <StatCard icon={<WalletIcon />} label="Total Interest" value="₹42,350" />
                <StatCard icon={<FileTextIcon />} label="TDS Deducted" value="₹7,085" />
            </div>

            {/* Table */}
            <div className="bg-card rounded-2xl border border-border/50 p-6 pb-0 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <h2 className="text-xl font-bold text-foreground">Dividends & Interest History</h2>

                    <div className="flex gap-4">
                        {/* Filter Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center justify-between w-[140px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="leading-none">{filter === "All" ? "All Assets" : filter}</span>
                                <ChevronDownIcon className="w-4 h-4 text-foreground" />
                            </button>

                            {isDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-[140px] bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                                        {["All", "Equity", "MF", "Bond"].map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => { setFilter(item); setIsDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${filter === item
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

                        {/* Export Button */}
                        <button
                            onClick={handleDownload}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all min-w-[120px]"
                        >
                            <DownloadIcon className="w-4 h-4 mb-[2px]" />
                            <span className="leading-none">Export</span>
                        </button>
                    </div>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Security</th>
                            <th className="py-5 px-6 text-muted-foreground font-medium text-sm">Type</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-medium text-sm">Amount</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-medium text-sm">TDS</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-medium text-sm">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {filteredDividends.map((div, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="py-5 px-6 text-muted-foreground font-medium">{div.date}</td>
                                <td className="py-5 px-6 text-foreground font-bold">{div.security}</td>
                                <td className="py-5 px-6">
                                    <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                        {div.type}
                                    </span>
                                </td>
                                <td className="py-5 px-6 text-right text-foreground font-bold text-base">{div.amount}</td>
                                <td className="py-5 px-6 text-right text-muted-foreground font-medium">{div.tds}</td>
                                <td className="py-5 px-6 text-center">
                                    <span className="px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-xs font-semibold inline-block">
                                        {div.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredDividends.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                    No dividends found for {filter === "All" ? "all assets" : filter}.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export default function ClientReports() {
    const [activeTab, setActiveTab] = useState<Tab>("Holdings");

    return (
        <DashboardLayout role="client">
            <div className="max-w-7xl mx-auto w-full p-8 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-display font-bold text-foreground">Reports</h1>
                    <div className="flex gap-4">
                        {/* Actions could go here */}
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex overflow-x-auto gap-4 mb-8 pb-2 no-scrollbar">
                    {(["Holdings", "Transactions", "Ledger", "Dividends", "Tax P&L", "Capital Gains", "XIRR"] as Tab[]).map((tab) => (
                        <div key={tab} className="shrink-0">
                            <TabButton active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                                {tab}
                            </TabButton>
                        </div>
                    ))}
                </div>

                {/* Tab Content Area */}
                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                        >
                            {activeTab === "Ledger" && <LedgerTab />}
                            {activeTab === "Holdings" && <HoldingsTab />}
                            {activeTab === "Transactions" && <TransactionsTab />}
                            {activeTab === "XIRR" && <XIRRTab />}
                            {activeTab === "Capital Gains" && <CapitalGainsTab />}
                            {activeTab === "Tax P&L" && <TaxPnLTab />}
                            {activeTab === "Dividends" && <DividendsTab />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </DashboardLayout>
    );
}
