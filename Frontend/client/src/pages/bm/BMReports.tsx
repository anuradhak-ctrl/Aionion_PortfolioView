import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Download, Printer, FileText, ChevronDown, Eye, Loader2 } from "lucide-react";
import userService, { Subordinate } from "@/services/userService";
import { mockSubordinates, mockEquityHoldings, mockRecentTransactions } from "@/utils/mockData";
import { exportHoldingsToXLSX, exportTransactionsToXLSX } from "@/utils/exportUtils";

// --- Types ---
type Tab = "Holdings" | "Transactions" | "Ledger" | "Dividends" | "Tax P&L" | "Capital Gains" | "XIRR";

// --- Components ---
const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        onClick={onClick}
        className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 print:hidden ${active
            ? "bg-primary text-primary-foreground shadow-lg"
            : "bg-background text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
            }`}
    >
        {children}
    </button>
);

// --- Tab Content Components ---
// Using mock data from utils for consistency
const HoldingsTab = ({
    clientId,
    clientName,
    rmName,
    status
}: {
    clientId: string;
    clientName?: string;
    rmName?: string;
    status?: string;
}) => {
    const [filter, setFilter] = useState("All");
    const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
    const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);

    // Use mock equity holdings for all clients for now, or filter if we had specific client data
    const holdings = mockEquityHoldings.map(h => ({
        ...h,
        symbol: h.security,
        type: 'Equity',
        isin: 'INE' + Math.floor(Math.random() * 1000000), // Mock ISIN
        sector: 'Finance', // Mock Sector
        qtyAvailable: h.qty,
        qtyDiscrepant: 0,
        qtyLongTerm: h.qty,
        qtyPledgedMargin: 0,
        qtyPledgedLoan: 0,
        prevClosing: "₹" + (parseFloat(h.cmp.replace('₹', '').replace(',', '')) * 0.95).toFixed(2),
        unrealizedPL: h.pl,
        unrealizedPLPercent: h.return.replace('%', ''),
    }));

    const filteredHoldings = filter === "All"
        ? holdings
        : holdings.filter(h => h.type === filter);

    const handleDownloadExcel = () => {
        exportHoldingsToXLSX(filteredHoldings, {
            clientName: clientName || 'Unknown Client',
            clientId: clientId,
            rmName: rmName,
            status: status
        });
        setIsDownloadDropdownOpen(false);
    };

    const handlePrint = () => {
        window.print();
        setIsDownloadDropdownOpen(false);
    };

    return (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden" style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}>
            {/* Header Section */}
            <div className="p-4 md:p-6 pb-4 bg-background/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-foreground print:text-black">Holdings Report</h2>
                    <div className="flex gap-2 md:gap-4 w-full sm:w-auto print:hidden">
                        {/* Filter Dropdown */}
                        <div className="relative flex-1 sm:flex-none">
                            <button
                                onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                                className="flex items-center justify-between w-full sm:w-[120px] md:w-[140px] px-3 md:px-4 py-2 md:py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-xs md:text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="leading-none truncate">{filter === "All" ? "All Assets" : filter}</span>
                                <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-foreground ml-1 flex-shrink-0" />
                            </button>

                            {isAssetDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsAssetDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-full sm:w-[120px] md:w-[140px] bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                                        {["All", "Equity", "MF", "Bond"].map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => { setFilter(item); setIsAssetDropdownOpen(false); }}
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

                        {/* Download Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDownloadDropdownOpen(!isDownloadDropdownOpen)}
                                className="flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs md:text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap"
                            >
                                <Download className="w-3 h-3 md:w-4 md:h-4" />
                                <span className="leading-none">Download</span>
                                <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 transition-transform ${isDownloadDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDownloadDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDownloadDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                                        <button
                                            onClick={handlePrint}
                                            className="flex items-center w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
                                        >
                                            <Printer className="w-4 h-4 mr-2 text-muted-foreground" />
                                            Print / Save as PDF
                                        </button>
                                        <button
                                            onClick={handleDownloadExcel}
                                            className="flex items-center w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
                                        >
                                            <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                                            Export as Excel
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-t border-b border-border print:border-gray-300">
                            <th className="py-5 px-6 print:py-2 print:px-2 text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50 print:bg-gray-100 print:text-[10px] print:text-black" style={{ minWidth: '100px' }}>Symbol</th>
                            <th className="py-5 px-6 print:py-2 print:px-2 text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50 print:bg-gray-100 print:text-[10px] print:text-black">ISIN</th>
                            <th className="py-5 px-6 print:py-2 print:px-2 text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50 print:bg-gray-100 print:text-[10px] print:text-black">Sector</th>
                            <th className="py-5 px-6 print:py-2 print:px-2 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50 print:bg-gray-100 print:text-[10px] print:text-black">Quantity Available</th>
                            <th className="py-5 px-6 print:py-2 print:px-2 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50 print:bg-gray-100 print:text-[10px] print:text-black">Quantity Discrepant</th>
                            <th className="py-5 px-6 print:py-2 print:px-2 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50 print:bg-gray-100 print:text-[10px] print:text-black">Quantity Long Term</th>
                            <th className="py-5 px-6 print:py-2 print:px-2 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50 print:bg-gray-100 print:text-[10px] print:text-black">Quantity Pledged (Margin)</th>
                            <th className="py-5 px-6 print:py-2 print:px-2 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50 print:bg-gray-100 print:text-[10px] print:text-black">Quantity Pledged (Loan)</th>
                            <th className="py-5 px-6 print:py-2 print:px-2 text-right text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50 print:bg-gray-100 print:text-[10px] print:text-black">Average Price</th>
                            <th className="py-5 px-6 print:py-2 print:px-2 text-right text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50 print:bg-gray-100 print:text-[10px] print:text-black">Previous Closing Price</th>
                            <th className="py-5 px-6 print:py-2 print:px-2 text-right text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50 print:bg-gray-100 print:text-[10px] print:text-black">Unrealized P&L</th>
                            <th className="py-5 px-6 print:py-2 print:px-2 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50 print:bg-gray-100 print:text-[10px] print:text-black">Unrealized P&L %</th>
                            <th className="py-5 px-6 print:py-2 print:px-2 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50 print:bg-gray-100 print:text-[10px] print:text-black">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm print:divide-gray-300">
                        {filteredHoldings.map((h, i) => (
                            <tr key={i} className="hover:bg-muted/30 transition-colors print:hover:bg-transparent">
                                <td className="py-5 px-6 whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-foreground text-base print:text-black">{h.security}</span>
                                        {h.name && <span className="text-xs text-muted-foreground font-medium mt-0.5 print:text-gray-600">{h.name}</span>}
                                    </div>
                                </td>
                                <td className="py-5 px-6 text-xs text-muted-foreground font-medium whitespace-nowrap print:text-gray-600">{h.isin}</td>
                                <td className="py-5 px-6 text-muted-foreground font-medium whitespace-nowrap print:text-gray-600">{h.sector}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap print:text-gray-600">{h.qtyAvailable}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap print:text-gray-600">{h.qtyDiscrepant || 0}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap print:text-gray-600">{h.qtyLongTerm || 0}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap print:text-gray-600">{h.qtyPledgedMargin || 0}</td>
                                <td className="py-5 px-6 text-center text-muted-foreground font-medium whitespace-nowrap print:text-gray-600">{h.qtyPledgedLoan || 0}</td>
                                <td className="py-5 px-6 text-right text-muted-foreground font-medium whitespace-nowrap print:text-gray-600">{h.avgPrice}</td>
                                <td className="py-5 px-6 text-right text-muted-foreground font-medium whitespace-nowrap print:text-gray-600">{h.prevClosing}</td>
                                <td className="py-5 px-6 text-right text-emerald-500 font-bold text-base whitespace-nowrap print:text-black">{h.unrealizedPL}</td>
                                <td className="py-5 px-6 text-center whitespace-nowrap">
                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500 print:bg-transparent print:text-black print:border print:border-gray-300">
                                        {h.unrealizedPLPercent}%
                                    </span>
                                </td>
                                <td className="py-5 px-6 text-center whitespace-nowrap">
                                    <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block print:bg-transparent print:text-gray-800 print:border-gray-300">
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

const TransactionsTab = ({
    clientId,
    clientName,
    rmName,
    status
}: {
    clientId: string;
    clientName?: string;
    rmName?: string;
    status?: string;
}) => {
    const [filter, setFilter] = useState("All");
    const [isAssetDropdownOpen, setIsAssetDropdownOpen] = useState(false);
    const [isDownloadDropdownOpen, setIsDownloadDropdownOpen] = useState(false);

    // Default transactions for now
    const transactions = mockRecentTransactions.map((t, i) => ({
        ...t,
        symbol: t.asset,
        isin: 'INE' + Math.floor(Math.random() * 1000000),
        tradeDate: t.date,
        exchange: 'NSE',
        segment: 'Equity',
        series: 'EQ',
        tradeType: t.type,
        auction: 'No',
        price: "₹" + t.amount,
        tradeId: 'T' + (1000 + i),
        orderId: 'O' + (2000 + i),
        executionTime: t.date + ' 10:30:15',
    }));

    const filteredTransactions = filter === "All"
        ? transactions
        : transactions.filter(t => t.segment === filter);

    const handleDownloadExcel = () => {
        exportTransactionsToXLSX(filteredTransactions, {
            clientName: clientName || 'Unknown Client',
            clientId: clientId,
            rmName: rmName,
            status: status
        });
        setIsDownloadDropdownOpen(false);
    };

    const handlePrint = () => {
        window.print();
        setIsDownloadDropdownOpen(false);
    };


    return (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden print:shadow-none print:border-none">
            {/* Header Section */}
            <div className="p-4 md:p-6 pb-4 bg-background/50 print:bg-transparent print:p-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-foreground print:text-black">Transaction History</h2>
                    <div className="flex gap-2 md:gap-4 w-full sm:w-auto print:hidden">
                        {/* Filter Dropdown */}
                        <div className="relative flex-1 sm:flex-none">
                            <button
                                onClick={() => setIsAssetDropdownOpen(!isAssetDropdownOpen)}
                                className="flex items-center justify-between w-full sm:w-[120px] md:w-[140px] px-3 md:px-4 py-2 md:py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-xs md:text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="leading-none truncate">{filter === "All" ? "All Assets" : filter}</span>
                                <ChevronDown className="w-3 h-3 md:w-4 md:h-4 text-foreground ml-1 flex-shrink-0" />
                            </button>

                            {isAssetDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsAssetDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-full sm:w-[120px] md:w-[140px] bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                                        {["All", "Equity", "MF", "Bond"].map((item) => (
                                            <button
                                                key={item}
                                                onClick={() => { setFilter(item); setIsAssetDropdownOpen(false); }}
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

                        {/* Download Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsDownloadDropdownOpen(!isDownloadDropdownOpen)}
                                className="flex items-center justify-center gap-1.5 md:gap-2 px-4 md:px-6 py-2 md:py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs md:text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all whitespace-nowrap"
                            >
                                <Download className="w-3 h-3 md:w-4 md:h-4" />
                                <span className="leading-none">Download</span>
                                <ChevronDown className={`w-3 h-3 md:w-4 md:h-4 transition-transform ${isDownloadDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isDownloadDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsDownloadDropdownOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-20 py-1">
                                        <button
                                            onClick={handlePrint}
                                            className="flex items-center w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
                                        >
                                            <Printer className="w-4 h-4 mr-2 text-muted-foreground" />
                                            Print / Save as PDF
                                        </button>
                                        <button
                                            onClick={handleDownloadExcel}
                                            className="flex items-center w-full px-4 py-2.5 text-sm text-foreground hover:bg-muted transition-colors text-left"
                                        >
                                            <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                                            Export as Excel
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-t border-b border-border print:border-gray-300">
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">Symbol</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">ISIN</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">Trade Date</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">Exchange</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">Segment</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">Series</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">Trade Type</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">Auction</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">Quantity</th>
                            <th className="py-5 px-6 text-right text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">Price</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">Trade ID</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">Order ID</th>
                            <th className="py-5 px-6 text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">Order Execution Time</th>
                            <th className="py-5 px-6 text-center text-muted-foreground font-semibold text-xs whitespace-nowrap bg-background/50 print:bg-transparent print:text-black">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm print:divide-gray-300">
                        {filteredTransactions.map((txn, i) => (
                            <tr key={i} className="hover:bg-primary/5 transition-colors print:hover:bg-transparent">
                                <td className="py-5 px-6 font-bold text-foreground text-base whitespace-nowrap print:text-black">{txn.symbol}</td>
                                <td className="py-5 px-6 text-xs text-muted-foreground font-medium whitespace-nowrap print:text-gray-600">{txn.isin}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap print:text-black">{txn.tradeDate}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap print:text-black">{txn.exchange}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap print:text-black">{txn.segment || "-"}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap print:text-black">{txn.series || "-"}</td>
                                <td className="py-5 px-6 whitespace-nowrap"><span className={`px-3 py-1.5 rounded-md text-xs font-semibold inline-block min-w-[60px] text-center ${txn.tradeType === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'} print:bg-transparent print:text-black print:border print:border-gray-300`}>{txn.tradeType}</span></td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap print:text-black">{txn.auction || "No"}</td>
                                <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap print:text-black">{txn.quantity}</td>
                                <td className="py-5 px-6 text-right text-foreground font-bold whitespace-nowrap print:text-black">{txn.price}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap print:text-gray-600">{txn.tradeId}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap print:text-gray-600">{txn.orderId || "-"}</td>
                                <td className="py-5 px-6 text-foreground/80 font-medium whitespace-nowrap print:text-gray-600">{txn.executionTime || "-"}</td>
                                <td className="py-5 px-6 text-center whitespace-nowrap">
                                    <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block print:bg-transparent print:text-gray-800 print:border-gray-300">
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

const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH === 'true';

export default function BMReports() {
    const [subordinates, setSubordinates] = useState<Subordinate[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection state - IDs are numbers in mock logic but let's handle string/number carefully
    const [selectedRM, setSelectedRM] = useState<number | null>(null);
    const [selectedClient, setSelectedClient] = useState<number | null>(null);

    const [activeTab, setActiveTab] = useState<Tab>("Holdings");
    const [isRMDropdownOpen, setIsRMDropdownOpen] = useState(false);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    const [location] = useLocation();

    // Fetch subordinates (Same logic as BMClients.tsx)
    const fetchSubordinates = async () => {
        setLoading(true);
        try {
            if (USE_LOCAL_AUTH) {
                // Use mock data for local development
                const mockData: Subordinate[] = [
                    ...mockSubordinates.bm.relationshipManagers.map(rm => ({
                        id: rm.id,
                        name: rm.name,
                        email: rm.email,
                        role: 'rm',
                        status: 'active',
                        parent_id: undefined,
                        clientCount: rm.clientCount,
                        portfolioValue: rm.portfolioValue
                    })),
                    ...mockSubordinates.rm.clients.map(client => ({
                        id: client.id,
                        client_id: client.clientId,
                        name: client.name,
                        email: client.email,
                        role: 'client',
                        status: client.status,
                        parent_id: 201, // Assign to first RM
                        portfolioValue: client.portfolioValue
                    })),
                    ...mockSubordinates.rm.clients.map((client, idx) => ({
                        id: client.id + 100,
                        client_id: `CL01${idx + 1}`, // CL011 onwards, matching BMClients logic roughly (it was CL00...)
                        // Note: BMClients had `CL00${client.id - 200}` which is CL00101...
                        // Let's use simpler logic here: CL01 + idx
                        name: client.name.replace('Aarav', 'Rohan').replace('Aditi', 'Priya'),
                        email: client.email.replace('aarav', 'rohan').replace('aditi', 'priya'),
                        role: 'client',
                        status: 'active',
                        parent_id: 202, // Assign to second RM
                        portfolioValue: client.portfolioValue ? client.portfolioValue * 1.2 : 0
                    })),
                ];
                setSubordinates(mockData);
            } else {
                const data = await userService.getSubordinates();
                setSubordinates(data);
            }
        } catch (error) {
            console.error("Failed to fetch subordinates:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubordinates();
    }, []);

    // Derived lists
    const relationshipManagers = subordinates
        .filter(s => s.role === 'rm')
        .map(s => ({
            id: s.id,
            name: s.name,
            clientCount: s.clientCount || 0,
            portfolioValue: s.portfolioValue || 0,
            formattedAUM: s.portfolioValue ? `₹${(s.portfolioValue / 10000000).toFixed(2)} Cr` : '₹0 Cr'
        }));

    const clients = selectedRM
        ? subordinates
            .filter(s => s.role === 'client' && s.parent_id === selectedRM)
        : [];

    const selectedRMData = relationshipManagers.find(rm => rm.id === selectedRM);
    const selectedClientData = subordinates.find(s => s.id === selectedClient);

    // Parse URL params
    useEffect(() => {
        if (!loading && subordinates.length > 0) {
            const params = new URLSearchParams(window.location.search);
            const clientCode = params.get('clientCode');

            if (clientCode) {
                // Find client
                const client = subordinates.find(s => s.role === 'client' && s.client_id === clientCode);
                if (client) {
                    setSelectedClient(client.id);
                    if (client.parent_id) {
                        setSelectedRM(client.parent_id);
                    }
                }
            }
        }
    }, [loading, subordinates]);

    const resetSelections = (level: 'rm' | 'client') => {
        if (level === 'rm') { setSelectedRM(null); setSelectedClient(null); }
        if (level === 'client') { setSelectedClient(null); }
    };

    // Calculate RMs stats for the overview table
    const rmStats = relationshipManagers.map(rm => {
        // Calculate dynamic stats from clients if available, else usage mockish values
        const rmClients = subordinates.filter(s => s.role === 'client' && s.parent_id === rm.id);
        const actualClientCount = rmClients.length > 0 ? rmClients.length : rm.clientCount;

        return {
            ...rm,
            clientCount: actualClientCount,
            todayChange: "+₹" + (Math.random() * 50000).toFixed(0),
            todayChangePercent: "+" + (Math.random() * 0.5).toFixed(2) + "%",
            avgXirr: (12 + Math.random() * 8).toFixed(1) + "%"
        };
    });

    return (
        <DashboardLayout role="bm">
            <div className="max-w-7xl mx-auto w-full p-8 min-h-screen">
                {/* Print Header (Visible only in print) */}
                <div className="hidden print:block mb-8 border-b pb-4">
                    <img src="/logo.png" alt="Company Logo" className="h-12 w-auto mb-4" />
                    <h1 className="text-2xl font-bold text-black">Aionion Investment Services</h1>
                    <p className="text-sm text-gray-600">Client Report</p>
                </div>

                <div className="flex items-center justify-between mb-8 print:hidden">
                    <h1 className="text-4xl font-display font-bold text-foreground">Reports</h1>
                </div>

                {/* Selector Card - Hidden on Print */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 mb-8 print:hidden">
                    <h3 className="text-lg font-bold text-foreground mb-4">Select View</h3>
                    <div className="flex flex-wrap gap-4">
                        {/* RM Selector */}
                        <div className="relative">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Relationship Manager</label>
                            <button
                                onClick={() => setIsRMDropdownOpen(!isRMDropdownOpen)}
                                className="flex items-center justify-between w-[200px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="truncate">{selectedRM ? selectedRMData?.name : "All RMs"}</span>
                                <ChevronDown className="w-4 h-4 text-foreground ml-2 flex-shrink-0" />
                            </button>
                            {isRMDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsRMDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-[200px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                                        <button
                                            onClick={() => { resetSelections('rm'); setIsRMDropdownOpen(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${!selectedRM ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                                        >
                                            All RMs
                                        </button>
                                        {relationshipManagers.map((rm) => (
                                            <button
                                                key={rm.id}
                                                onClick={() => { setSelectedRM(rm.id); setSelectedClient(null); setIsRMDropdownOpen(false); }}
                                                className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedRM === rm.id ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                                            >
                                                <div className="flex justify-between">
                                                    <span>{rm.name}</span>
                                                    <span className="text-xs text-muted-foreground">{rm.clientCount} clients</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Client Selector */}
                        {selectedRM && (
                            <div className="relative">
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Client</label>
                                <button
                                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                    className="flex items-center justify-between w-[220px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all"
                                >
                                    <span className="truncate">{selectedClient ? selectedClientData?.name : "Select a client..."}</span>
                                    <ChevronDown className="w-4 h-4 text-foreground ml-2 flex-shrink-0" />
                                </button>
                                {isClientDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsClientDropdownOpen(false)} />
                                        <div className="absolute left-0 mt-2 w-[220px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-72 overflow-y-auto">
                                            {clients.map((client) => (
                                                <button
                                                    key={client.id}
                                                    onClick={() => {
                                                        setSelectedClient(client.id);
                                                        setIsClientDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${selectedClient === client.id ? "text-emerald-500 bg-emerald-500/10 font-semibold" : "text-foreground hover:bg-muted"}`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <span>{client.name}</span>
                                                        <span className="text-xs text-muted-foreground">{client.client_id}</span>
                                                    </div>
                                                </button>
                                            ))}
                                            {clients.length === 0 && (
                                                <div className="px-4 py-3 text-sm text-muted-foreground">No clients available</div>
                                            )}
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
                        <div className="flex items-center justify-between mb-6 print:mb-8">
                            <div>
                                <h2 className="text-2xl font-bold text-foreground print:text-black">{selectedClientData?.name}</h2>
                                <p className="text-sm text-muted-foreground print:text-gray-600">
                                    {selectedRM && `RM: ${selectedRMData?.name} • `}
                                    Client ID: {selectedClientData?.client_id} • Status: {selectedClientData?.status}
                                </p>
                                <p className="hidden print:block text-sm text-gray-600 mt-1">Generated on: {new Date().toLocaleDateString()}</p>
                            </div>
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors print:hidden"
                            >
                                ← Change Client
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex overflow-x-auto gap-3 mb-8 pb-2 no-scrollbar print:hidden">
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
                                    {activeTab === "Holdings" && <HoldingsTab
                                        clientId={selectedClientData?.client_id || ""}
                                        clientName={selectedClientData?.name}
                                        rmName={selectedRMData?.name}
                                        status={selectedClientData?.status}
                                    />}
                                    {activeTab === "Transactions" && <TransactionsTab
                                        clientId={selectedClientData?.client_id || ""}
                                        clientName={selectedClientData?.name}
                                        rmName={selectedRMData?.name}
                                        status={selectedClientData?.status}
                                    />}
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
                        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden mb-8 print:hidden">
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
                                        {rmStats.map((rm) => {
                                            const todayIsPositive = !rm.todayChange.startsWith('-');
                                            return (
                                                <tr key={rm.id} className="hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setSelectedRM(rm.id)}>
                                                    <td className="py-4 px-6 font-bold text-foreground">{rm.name}</td>
                                                    <td className="py-4 px-6 text-muted-foreground">RM00{rm.id % 200}</td>
                                                    <td className="py-4 px-6 text-center">
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-500/10 text-blue-500">
                                                            {rm.clientCount}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-right font-bold text-foreground">{rm.formattedAUM}</td>
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
                                                            onClick={(e) => { e.stopPropagation(); setSelectedRM(rm.id); }}
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
                    )}

                    {/* Client Table - Shows when RM is selected but no client is selected */}
                    {selectedRM && !selectedClient && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="flex items-center justify-between mb-4 print:hidden">
                                <h2 className="text-2xl font-bold text-foreground">
                                    {selectedRMData?.name}'s Clients
                                </h2>
                                <button
                                    onClick={() => setSelectedRM(null)}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    ← Back to All RMs
                                </button>
                            </div>

                            <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden print:hidden">
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
                                            {clients.map((client) => {
                                                const todayChange = "+₹" + (Math.random() * 15000).toFixed(0);
                                                const returnsPercent = "+" + (10 + Math.random() * 10).toFixed(1) + "%";
                                                const xirr = (8 + Math.random() * 8).toFixed(1) + "%";

                                                return (
                                                    <tr key={client.id} className="hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setSelectedClient(client.id)}>
                                                        <td className="py-4 px-6 font-bold text-foreground">{client.name}</td>
                                                        <td className="py-4 px-6 text-muted-foreground">{client.client_id}</td>
                                                        <td className="py-4 px-6 text-right font-bold text-foreground">₹{(Math.random() * 50).toFixed(1)} L</td>
                                                        <td className="py-4 px-6 text-right">
                                                            <span className="font-bold text-emerald-500">
                                                                {todayChange}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                                                                {returnsPercent}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-500">
                                                                {xirr}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-center">
                                                            <button
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-xs font-semibold text-primary transition-colors"
                                                                onClick={(e) => { e.stopPropagation(); setSelectedClient(client.id); }}
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
                        </motion.div>
                    )}
                </>)}
            </div>
        </DashboardLayout>
    );
}
