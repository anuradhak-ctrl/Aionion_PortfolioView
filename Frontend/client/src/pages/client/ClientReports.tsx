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

    const ledgerEntries = [
        {
            particulars: "Opening Balance",
            postingDate: "",
            costCenter: "",
            voucherType: "",
            debit: "0.00",
            credit: "0",
            netBalance: "0.00",
            asset: "Equity"
        },
        {
            particulars: "Funds added using UPI from ROH673 with reference number 512192062960",
            postingDate: "1-May-2025",
            costCenter: "NSE-EQ - Z",
            voucherType: "Bank Receipts",
            debit: "0.00",
            credit: "100",
            netBalance: "100.00",
            asset: "Equity"
        },
        {
            particulars: "Funds auto-settled from the primary account with reference number 264a94",
            postingDate: "",
            costCenter: "NSE-EQ - Z",
            voucherType: "Bank Payments",
            debit: "0.00",
            credit: "0",
            netBalance: "0.00",
            asset: "Equity"
        },
        {
            particulars: "Funds added using UPI from ROH673 with reference number 519561470870",
            postingDate: "14-Jul-2025",
            costCenter: "NSE-EQ - Z",
            voucherType: "Bank Receipts",
            debit: "0",
            credit: "200.00",
            netBalance: "200.00",
            asset: "Equity"
        },
        {
            particulars: "Net settlement for Equity with settlement number: 2025133",
            postingDate: "14-Jul-2025",
            costCenter: "NSE-EQ - Z",
            voucherType: "Book Voucher",
            debit: "81.9149",
            credit: "0",
            netBalance: "118.09",
            asset: "Equity"
        },
        {
            particulars: "AMC for Demat Account for 18-06-2025 to 17-06-2025",
            postingDate: "22-Jul-2025",
            costCenter: "NSE-EQ - Z",
            voucherType: "Journal Entry",
            debit: "88.5",
            credit: "0.00",
            netBalance: "29.59",
            asset: "Equity"
        },
        {
            particulars: "Net settlement for Equity with settlement number: 2025167",
            postingDate: "2-Sep-2025",
            costCenter: "NSE-EQ - Z",
            voucherType: "Book Voucher",
            debit: "6.6202",
            credit: "0",
            netBalance: "22.96",
            asset: "Equity"
        },
        {
            particulars: "Funds transferred for Equity as part of quarterly settlement number 6",
            postingDate: "20-Oct-2025",
            costCenter: "NSE-EQ - Z",
            voucherType: "Bank Receipts",
            debit: "22.96",
            credit: "0",
            netBalance: "0.0049",
            asset: "Equity"
        },
        {
            particulars: "AMC for Demat Account for 18-06-2025 to 16-09-2025",
            postingDate: "2025-10-24",
            costCenter: "NSE-EQ - Z",
            voucherType: "Journal Entry",
            debit: "88.5",
            credit: "0",
            netBalance: "-88.4951",
            asset: "Equity"
        },
        {
            particulars: "Funds added using UPI from ROH673 with reference number [Q] 2025-11-28",
            postingDate: "2025-11-28",
            costCenter: "NSE-EQ - Z",
            voucherType: "Bank Receipts",
            debit: "0",
            credit: "100",
            netBalance: "11.5049",
            asset: "Equity"
        },
        {
            particulars: "Being payment gateway charges debited for ROH673",
            postingDate: "2025-11-28",
            costCenter: "NSE-EQ - Z",
            voucherType: "Journal Entry",
            debit: "10.62",
            credit: "0",
            netBalance: "0.8849",
            asset: "Equity"
        },
        {
            particulars: "Delayed payment charges for November - 2025",
            postingDate: "2025-12-05",
            costCenter: "NSE-EQ - Z",
            voucherType: "Journal Entry",
            debit: "1.19",
            credit: "0",
            netBalance: "-0.3051",
            asset: "Equity"
        },
        {
            particulars: "Closing Balance",
            postingDate: "",
            costCenter: "",
            voucherType: "",
            debit: "",
            credit: "",
            netBalance: "-0.3051",
            asset: "Equity"
        },
    ];

    const filteredLedgerEntries = filter === "All"
        ? ledgerEntries
        : ledgerEntries.filter(t => t.asset === filter);

    const handleDownload = () => {
        const headers = ["Particulars", "Posting Date", "Cost Center", "Voucher Type", "Debit", "Credit", "Net Balance"];
        const csvContent = [
            headers.join(","),
            ...filteredLedgerEntries.map(row =>
                [
                    `"${row.particulars}"`,
                    row.postingDate,
                    row.costCenter,
                    row.voucherType,
                    row.debit,
                    row.credit,
                    row.netBalance
                ].join(",")
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
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header Section - No Scroll */}
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
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs bg-background/50" style={{ minWidth: '320px' }}>Particulars</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Posting Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Cost Center</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Voucher Type</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Debit</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Credit</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Net Balance</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {filteredLedgerEntries.map((entry, i) => {
                            const isOpeningOrClosing = entry.particulars.includes("Opening Balance") || entry.particulars.includes("Closing Balance");
                            const netBalanceValue = parseFloat(entry.netBalance);
                            const isNegative = netBalanceValue < 0;

                            return (
                                <tr key={i} className={`hover:bg-primary/5 transition-colors ${isOpeningOrClosing ? 'font-bold bg-muted/20' : ''}`}>
                                    <td className={`py-5 px-6 font-medium ${isOpeningOrClosing ? 'text-foreground font-bold' : 'text-foreground/80'}`} style={{ minWidth: '320px', maxWidth: '400px' }}>
                                        <div className="line-clamp-2" title={entry.particulars}>
                                            {entry.particulars || "-"}
                                        </div>
                                    </td>
                                    <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{entry.postingDate || "-"}</td>
                                    <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{entry.costCenter || "-"}</td>
                                    <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{entry.voucherType || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{entry.debit || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{entry.credit || "-"}</td>
                                    <td className={`py-5 px-6 text-right font-bold text-base whitespace-nowrap ${isNegative ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {entry.netBalance || "-"}
                                    </td>
                                    <td className="py-5 px-6 text-center whitespace-nowrap">
                                        <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                            {entry.asset || "-"}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredLedgerEntries.length === 0 && (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                    No ledger entries found for {filter === "All" ? "all assets" : filter}.
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
            name: "Infosys",
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
            name: "Tata Consultancy Services",
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
            name: "HDFC Bank",
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
            name: "Axis Bluechip Fund",
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
            name: "Government of India",
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
        { symbol: "INFY", isin: "INE009A01021", tradeDate: "12-Jul-2025", exchange: "NSE", segment: "Equity", series: "EQ", tradeType: "BUY", auction: "No", quantity: "100.00", price: "1,540.00", tradeId: "T123456", orderId: "O987654", executionTime: "12-Jul-2025 10:15:32", asset: "Equity" },
        { symbol: "TCS", isin: "INE467B01029", tradeDate: "18-Sep-2025", exchange: "BSE", segment: "Equity", series: "EQ", tradeType: "SELL", auction: "No", quantity: "50", price: "3,580.00", tradeId: "T223344", orderId: "O776655", executionTime: "18-Sep-2025 14:42:10", asset: "Equity" },
        { symbol: "HDFCBANK", isin: "INE040A01034", tradeDate: "15-Dec-2025", exchange: "NSE", segment: "Equity", series: "EQ", tradeType: "BUY", auction: "No", quantity: "150", price: "1,580.00", tradeId: "T345678", orderId: "O112233", executionTime: "15-Dec-2025 11:22:45", asset: "Equity" },
        { symbol: "RELIANCE", isin: "INE002A01018", tradeDate: "20-Nov-2025", exchange: "NSE", segment: "Equity", series: "EQ", tradeType: "BUY", auction: "No", quantity: "75", price: "2,450.00", tradeId: "T456789", orderId: "O223344", executionTime: "20-Nov-2025 09:30:15", asset: "Equity" },
        { symbol: "ICICIBANK", isin: "INE090A01021", tradeDate: "05-Oct-2025", exchange: "BSE", segment: "Equity", series: "EQ", tradeType: "SELL", auction: "No", quantity: "200", price: "920.00", tradeId: "T567890", orderId: "O334455", executionTime: "05-Oct-2025 14:55:30", asset: "Equity" },
    ];

    const filteredTransactions = filter === "All"
        ? transactions
        : transactions.filter(t => t.asset === filter);

    const handleDownload = () => {
        const headers = ["Symbol", "ISIN", "Trade Date", "Exchange", "Segment", "Series", "Trade Type", "Auction", "Quantity", "Price", "Trade ID", "Order ID", "Order Execution Time"];
        const csvContent = [
            headers.join(","),
            ...filteredTransactions.map(row =>
                [row.symbol, row.isin, row.tradeDate, row.exchange, row.segment, row.series, row.tradeType, row.auction, row.quantity, row.price, row.tradeId, row.orderId, row.executionTime].join(",")
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
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header Section - No Scroll */}
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
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.segment}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.series}</td>
                                <td className="py-5 px-6 whitespace-nowrap">
                                    <span className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-block min-w-[60px] text-center ${txn.tradeType === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {txn.tradeType}
                                    </span>
                                </td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.auction}</td>
                                <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{txn.quantity}</td>
                                <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{txn.price}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.tradeId}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.orderId}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{txn.executionTime}</td>
                                <td className="py-5 px-6 text-center whitespace-nowrap">
                                    <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                        {txn.asset}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredTransactions.length === 0 && (
                            <tr>
                                <td colSpan={14} className="py-12 text-center text-muted-foreground">
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
    const [filter, setFilter] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const xirrData = [
        {
            symbol: "INFY",
            isin: "INE009A01021",
            firstBuyDate: "10-Jan-2023",
            lastTransactionDate: "12-Jul-2025",
            totalBuyAmount: "150,000.00",
            totalSellAmount: "0",
            currentValue: "184,800.00",
            netGainLoss: "34,800.00",
            holdingPeriod: "920",
            xirrPercent: "18.45",
            asset: "Equity"
        },
        {
            symbol: "TCS",
            isin: "INE467B01029",
            firstBuyDate: "05-Mar-2022",
            lastTransactionDate: "18-Sep-2025",
            totalBuyAmount: "160,000.00",
            totalSellAmount: "179,000.00",
            currentValue: "0",
            netGainLoss: "19,000.00",
            holdingPeriod: "1,300",
            xirrPercent: "14.2",
            asset: "Equity"
        },
        {
            symbol: "HDFCBANK",
            isin: "INE040A01034",
            firstBuyDate: "20-Jun-2021",
            lastTransactionDate: "02-Sep-2025",
            totalBuyAmount: "355,000.00",
            totalSellAmount: "0",
            currentValue: "402,500.00",
            netGainLoss: "47,500.00",
            holdingPeriod: "1,535",
            xirrPercent: "16.8",
            asset: "Equity"
        },
    ];

    // Calculate totals
    const totals = {
        totalBuyAmount: "665,000.00",
        totalSellAmount: "179,000.00",
        currentValue: "587,300.00",
        netGainLoss: "101,300.00",
        xirrPercent: "15.72"
    };

    const filteredXirrData = filter === "All"
        ? xirrData
        : xirrData.filter(x => x.asset === filter);

    const handleDownload = () => {
        const headers = ["Symbol", "ISIN", "First Buy Date", "Last Transaction Date", "Total Buy Amount", "Total Sell Amount", "Current Value", "Net Gain/Loss", "Holding Period (Days)", "XIRR %"];
        const csvContent = [
            headers.join(","),
            ...filteredXirrData.map(row =>
                [row.symbol, row.isin, row.firstBuyDate, row.lastTransactionDate, row.totalBuyAmount, row.totalSellAmount, row.currentValue, row.netGainLoss, row.holdingPeriod, row.xirrPercent].join(",")
            ),
            ["Total / Portfolio XIRR", "", "", "", totals.totalBuyAmount, totals.totalSellAmount, totals.currentValue, totals.netGainLoss, "", totals.xirrPercent].join(",")
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `xirr_report_${filter.toLowerCase()}.csv`);
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
                    <h2 className="text-lg md:text-xl font-bold text-foreground">XIRR Report</h2>

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
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Symbol</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">ISIN</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">First Buy Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Last Transaction Date</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Total Buy Amount</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Total Sell Amount</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Current Value</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Net Gain / Loss</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Holding Period (Days)</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">XIRR %</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {filteredXirrData.map((xirr, i) => {
                            const isLoss = xirr.netGainLoss.startsWith("-");
                            return (
                                <tr key={i} className="hover:bg-primary/5 transition-colors">
                                    <td className="py-5 px-6 text-foreground font-bold whitespace-nowrap">{xirr.symbol || "-"}</td>
                                    <td className="py-5 px-6 text-xs text-muted-foreground font-medium whitespace-nowrap">{xirr.isin || "-"}</td>
                                    <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{xirr.firstBuyDate || "-"}</td>
                                    <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{xirr.lastTransactionDate || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{xirr.totalBuyAmount || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{xirr.totalSellAmount || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{xirr.currentValue || "-"}</td>
                                    <td className={`py-5 px-6 text-right font-bold text-base whitespace-nowrap ${isLoss ? 'text-red-500' : 'text-emerald-500'}`}>{xirr.netGainLoss || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground/80 font-medium whitespace-nowrap">{xirr.holdingPeriod || "-"}</td>
                                    <td className="py-5 px-6 text-right whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${parseFloat(xirr.xirrPercent) >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {xirr.xirrPercent}%
                                        </span>
                                    </td>
                                    <td className="py-5 px-6 text-center whitespace-nowrap">
                                        <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                            {xirr.asset || "-"}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {/* Total / Portfolio XIRR Row */}
                        <tr className="bg-muted/20 border-t-2 border-border font-bold">
                            <td className="py-5 px-6 text-foreground font-bold whitespace-nowrap">Total / Portfolio XIRR</td>
                            <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">-</td>
                            <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">-</td>
                            <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap">-</td>
                            <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{totals.totalBuyAmount}</td>
                            <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{totals.totalSellAmount}</td>
                            <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{totals.currentValue}</td>
                            <td className="py-5 px-6 text-right text-emerald-500 font-bold text-base whitespace-nowrap">{totals.netGainLoss}</td>
                            <td className="py-5 px-6 text-right text-muted-foreground font-medium whitespace-nowrap">-</td>
                            <td className="py-5 px-6 text-right whitespace-nowrap">
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-500">
                                    {totals.xirrPercent}%
                                </span>
                            </td>
                            <td className="py-5 px-6 text-center whitespace-nowrap">-</td>
                        </tr>
                        {filteredXirrData.length === 0 && (
                            <tr>
                                <td colSpan={11} className="py-12 text-center text-muted-foreground">
                                    No XIRR data found for {filter === "All" ? "all assets" : filter}.
                                </td>
                            </tr>
                        )}
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
        {
            symbol: "INFY",
            isin: "INE009A01021",
            exchange: "NSE",
            buyDate: "10-Jan-2023",
            sellDate: "15-Feb-2025",
            quantity: "100",
            buyPrice: "1,250.00",
            sellPrice: "1,540.00",
            buyValue: "125,000.00",
            sellValue: "154,000.00",
            holdingPeriod: "767",
            gainLoss: "29,000.00",
            gainType: "LTCG",
            taxableGain: "29,000.00",
            exemptGain: "0",
            taxRate: "10%",
            taxAmount: "2,900.00",
            asset: "Equity"
        },
        {
            symbol: "TCS",
            isin: "INE467B01029",
            exchange: "BSE",
            buyDate: "05-Jul-2024",
            sellDate: "20-Dec-2024",
            quantity: "50",
            buyPrice: "3,200.00",
            sellPrice: "3,580.00",
            buyValue: "160,000.00",
            sellValue: "179,000.00",
            holdingPeriod: "168",
            gainLoss: "19,000.00",
            gainType: "STCG",
            taxableGain: "19,000.00",
            exemptGain: "0",
            taxRate: "15%",
            taxAmount: "2,850.00",
            asset: "Equity"
        },
        {
            symbol: "HDFCBANK",
            isin: "INE040A01034",
            exchange: "NSE",
            buyDate: "12-Mar-2022",
            sellDate: "01-Apr-2025",
            quantity: "200",
            buyPrice: "1,420.00",
            sellPrice: "1,610.00",
            buyValue: "284,000.00",
            sellValue: "322,000.00",
            holdingPeriod: "1,116",
            gainLoss: "38,000.00",
            gainType: "LTCG",
            taxableGain: "38,000.00",
            exemptGain: "0",
            taxRate: "10%",
            taxAmount: "3,800.00",
            asset: "Equity"
        },
        {
            symbol: "RELIANCE",
            isin: "INE002A01018",
            exchange: "NSE",
            buyDate: "18-Nov-2024",
            sellDate: "10-Jan-2025",
            quantity: "30",
            buyPrice: "2,450.00",
            sellPrice: "2,380.00",
            buyValue: "73,500.00",
            sellValue: "71,400.00",
            holdingPeriod: "53",
            gainLoss: "-2,100.00",
            gainType: "STCL",
            taxableGain: "-2,100.00",
            exemptGain: "0",
            taxRate: "15%",
            taxAmount: "0",
            asset: "Equity"
        },
    ];

    const filteredCapitalGains = filter === "All"
        ? capitalGains
        : capitalGains.filter(c => c.asset === filter);

    const handleDownload = () => {
        const headers = ["Symbol", "ISIN", "Exchange", "Buy Date", "Sell Date", "Quantity", "Buy Price", "Sell Price", "Buy Value", "Sell Value", "Holding Period (Days)", "Gain/Loss", "Gain Type", "Taxable Gain", "Exempt Gain", "Tax Rate", "Tax Amount"];
        const csvContent = [
            headers.join(","),
            ...filteredCapitalGains.map(row =>
                [row.symbol, row.isin, row.exchange, row.buyDate, row.sellDate, row.quantity, row.buyPrice, row.sellPrice, row.buyValue, row.sellValue, row.holdingPeriod, row.gainLoss, row.gainType, row.taxableGain, row.exemptGain, row.taxRate, row.taxAmount].join(",")
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
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header Section - No Scroll */}
            <div className="p-4 md:p-6 pb-4 bg-background/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">Capital Gains</h2>

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
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Symbol</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">ISIN</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Exchange</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Buy Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Sell Date</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Quantity</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Buy Price</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Sell Price</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Buy Value</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Sell Value</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Holding Period (Days)</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Gain / Loss</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Gain Type (STCG / LTCG)</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Taxable Gain</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Exempt Gain</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Tax Rate</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Tax Amount</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {filteredCapitalGains.map((cg, i) => {
                            const isLoss = cg.gainLoss.startsWith("-");
                            return (
                                <tr key={i} className="hover:bg-primary/5 transition-colors">
                                    <td className="py-5 px-6 text-foreground font-bold whitespace-nowrap">{cg.symbol || "-"}</td>
                                    <td className="py-5 px-6 text-xs text-muted-foreground font-medium whitespace-nowrap">{cg.isin || "-"}</td>
                                    <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{cg.exchange || "-"}</td>
                                    <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{cg.buyDate || "-"}</td>
                                    <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{cg.sellDate || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{cg.quantity || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{cg.buyPrice || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{cg.sellPrice || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{cg.buyValue || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{cg.sellValue || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground/80 font-medium whitespace-nowrap">{cg.holdingPeriod || "-"}</td>
                                    <td className={`py-5 px-6 text-right font-bold text-base whitespace-nowrap ${isLoss ? 'text-red-500' : 'text-emerald-500'}`}>{cg.gainLoss || "-"}</td>
                                    <td className="py-5 px-6 text-center whitespace-nowrap">
                                        <span className={`px-3 py-1.5 rounded text-xs font-semibold inline-block ${cg.gainType === "STCG" ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" :
                                            cg.gainType === "LTCG" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                                                cg.gainType === "STCL" ? "bg-red-500/10 text-red-500 border border-red-500/20" :
                                                    "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                                            }`}>
                                            {cg.gainType || "-"}
                                        </span>
                                    </td>
                                    <td className={`py-5 px-6 text-right font-bold whitespace-nowrap ${isLoss ? 'text-red-500' : 'text-foreground'}`}>{cg.taxableGain || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground/80 font-medium whitespace-nowrap">{cg.exemptGain || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground/80 font-medium whitespace-nowrap">{cg.taxRate || "-"}</td>
                                    <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{cg.taxAmount || "-"}</td>
                                    <td className="py-5 px-6 text-center whitespace-nowrap">
                                        <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                            {cg.asset || "-"}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredCapitalGains.length === 0 && (
                            <tr>
                                <td colSpan={18} className="py-12 text-center text-muted-foreground">
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

    // Empty data array - no table values
    const taxItems: { date: string; security: string; type: string; income: string; taxLiability: string; section: string }[] = [];

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
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header Section - No Scroll */}
            <div className="p-4 md:p-6 pb-4 bg-background/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">Tax P&L Report</h2>

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
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Security</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Type</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Income/Gain</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Tax Liability</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Section</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {filteredTaxItems.map((item, i) => (
                            <tr key={i} className="hover:bg-primary/5 transition-colors">
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{item.date}</td>
                                <td className="py-5 px-6 text-foreground font-bold whitespace-nowrap">{item.security}</td>
                                <td className="py-5 px-6 whitespace-nowrap">
                                    <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                        {item.type}
                                    </span>
                                </td>
                                <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{item.income}</td>
                                <td className="py-5 px-6 text-right text-orange-500 font-bold whitespace-nowrap">{item.taxLiability}</td>
                                <td className="py-5 px-6 text-center whitespace-nowrap">
                                    <span className="px-3 py-1.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-semibold inline-block">
                                        {item.section}
                                    </span>
                                </td>
                                <td className="py-5 px-6 text-center whitespace-nowrap">
                                    <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                        {item.type}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {/* Always show empty state since no data */}
                        <tr>
                            <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                No tax data available. Tax P&L information will be displayed here once transactions are processed.
                            </td>
                        </tr>
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
        {
            periodType: "FY",
            incomeDate: "25-Mar-2021",
            assetCategory: "Stocks",
            assetName: "Infosys",
            incomeType: "Dividend Payout",
            grossAmount: "1000",
            tdsAmount: "10",
            netAmount: "990",
            asset: "Equity"
        },
        {
            periodType: "FY",
            incomeDate: "26-Mar-2021",
            assetCategory: "Stocks",
            assetName: "Reliance Industries",
            incomeType: "Dividend Payout",
            grossAmount: "2000",
            tdsAmount: "20",
            netAmount: "1980",
            asset: "Equity"
        },
        {
            periodType: "FY",
            incomeDate: "15-Jun-2021",
            assetCategory: "Stocks",
            assetName: "TCS",
            incomeType: "Dividend Payout",
            grossAmount: "1500",
            tdsAmount: "15",
            netAmount: "1485",
            asset: "Equity"
        },
        {
            periodType: "FY",
            incomeDate: "10-Sep-2021",
            assetCategory: "Stocks",
            assetName: "HDFC Bank",
            incomeType: "Dividend Payout",
            grossAmount: "800",
            tdsAmount: "8",
            netAmount: "792",
            asset: "Equity"
        },
        {
            periodType: "FY",
            incomeDate: "20-Dec-2021",
            assetCategory: "Mutual Funds",
            assetName: "Axis Bluechip Fund",
            incomeType: "Dividend Payout",
            grossAmount: "500",
            tdsAmount: "5",
            netAmount: "495",
            asset: "MF"
        },
        {
            periodType: "FY",
            incomeDate: "05-Jan-2022",
            assetCategory: "Bonds",
            assetName: "GOI 7.26% 2033",
            incomeType: "Interest Payout",
            grossAmount: "3625",
            tdsAmount: "362",
            netAmount: "3263",
            asset: "Bond"
        },
    ];

    const filteredDividends = filter === "All"
        ? dividends
        : dividends.filter(d => d.asset === filter);

    const handleDownload = () => {
        const headers = ["Period Type", "Income Date", "Asset Category", "Asset Name", "Income Type", "Gross Amount", "TDS Amount", "Net Amount"];
        const csvContent = [
            headers.join(","),
            ...filteredDividends.map(row =>
                [row.periodType, row.incomeDate, row.assetCategory, row.assetName, row.incomeType, row.grossAmount, row.tdsAmount, row.netAmount].join(",")
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
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header Section - No Scroll */}
            <div className="p-4 md:p-6 pb-4 bg-background/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">Dividends & Interest</h2>

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
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Period Type</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Income Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Asset Category</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Asset Name</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Income Type</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Gross Amount</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">TDS Amount</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Net Amount</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {filteredDividends.map((div, i) => (
                            <tr key={i} className="hover:bg-primary/5 transition-colors">
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{div.periodType || "-"}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{div.incomeDate || "-"}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{div.assetCategory || "-"}</td>
                                <td className="py-5 px-6 text-foreground font-bold whitespace-nowrap">{div.assetName || "-"}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap">{div.incomeType || "-"}</td>
                                <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{div.grossAmount || "-"}</td>
                                <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap">{div.tdsAmount || "-"}</td>
                                <td className="py-5 px-6 text-right text-emerald-500 font-bold text-base whitespace-nowrap">{div.netAmount || "-"}</td>
                                <td className="py-5 px-6 text-center whitespace-nowrap">
                                    <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                        {div.asset || "-"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {filteredDividends.length === 0 && (
                            <tr>
                                <td colSpan={9} className="py-12 text-center text-muted-foreground">
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
