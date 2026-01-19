import { DashboardLayout } from "@/components/DashboardLayout";
import { useClientData } from "@/contexts/ClientDataContext";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPortfolioData } from "@/services/portfolioService";
import { ExportButton } from "@/components/ExportButton";
import { exportReport, ExportFormat } from "@/utils/reportExporter";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import apiClient from "@/lib/apiClient";

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
    const { data: clientData, isLoading: clientDataLoading } = useClientData();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Financial Year selector
    const getCurrentFY = () => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        // If Jan-Mar, FY started last year. If Apr-Dec, FY started this year
        const fyStart = currentMonth < 3 ? currentYear - 1 : currentYear;
        return `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`;
    };
    const [selectedFY, setSelectedFY] = useState(getCurrentFY());

    // FY-specific ledger data
    const [fyLedgerData, setFyLedgerData] = useState<any[]>([]);
    const [isFetchingFY, setIsFetchingFY] = useState(false);

    // Use FY-specific data if available, otherwise use global context data
    const ledgerEntries = fyLedgerData.length > 0 ? fyLedgerData : clientData.ledger;
    const loading = isFetchingFY || clientDataLoading;

    // Fetch FY-specific ledger data when FY changes
    useEffect(() => {
        const fetchFYLedger = async () => {
            console.log('🔄 FY Changed to:', selectedFY);
            console.log('🔄 Current FY is:', getCurrentFY());

            // If it's current FY, use global context data
            if (selectedFY === getCurrentFY()) {
                console.log('✅ Using current FY data from context');
                setFyLedgerData([]);
                return;
            }

            console.log('📡 Fetching FY-specific data for:', selectedFY);
            setIsFetchingFY(true);
            try {
                const fyParam = selectedFY.replace('FY ', ''); // "2024-25"
                console.log('📡 API call with FY parameter:', fyParam);

                const response = await apiClient.get(`/api/users/ledger?financialYear=${fyParam}`);
                console.log('📡 API Response:', response);

                if (response.data.success) {
                    // Map the data same way as in ClientDataContext
                    const mapped = response.data.data.map((item: any) => ({
                        particulars: item.particulars,
                        postingDate: item.date || "",
                        costCenter: item.costCenter || "-",
                        voucherType: item.transType || "",
                        voucherNo: item.voucherNo || "",
                        debit: item.debit,
                        credit: item.credit,
                        netBalance: item.balance,
                        asset: "Equity"
                    }));
                    console.log('✅ Mapped data:', mapped.length, 'entries');
                    console.log('✅ First entry:', mapped[0]);
                    setFyLedgerData(mapped);
                }
            } catch (error) {
                console.error('❌ Error fetching FY ledger:', error);
            } finally {
                setIsFetchingFY(false);
            }
        };

        fetchFYLedger();
    }, [selectedFY]);

    // Calendar state
    const [fromDate, setFromDate] = useState<Date | null>(null);
    const [toDate, setToDate] = useState<Date | null>(null);
    const [showCalendar, setShowCalendar] = useState(false);
    const [calendarMode, setCalendarMode] = useState<'from' | 'to'>('from');
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Helper to format date as DD-MM-YYYY
    const formatDate = (date: Date | null) => {
        if (!date) return "";
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    };

    // Helper to parse DD-MM-YYYY to Date
    const parseDate = (dateStr: string): Date | null => {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length !== 3) return null;
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    };

    // Quick date presets
    const applyPreset = (preset: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (preset) {
            case 'today':
                setFromDate(today);
                setToDate(today);
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                setFromDate(yesterday);
                setToDate(yesterday);
                break;
            case 'last7':
                const last7 = new Date(today);
                last7.setDate(last7.getDate() - 7);
                setFromDate(last7);
                setToDate(today);
                break;
            case 'last30':
                const last30 = new Date(today);
                last30.setDate(last30.getDate() - 30);
                setFromDate(last30);
                setToDate(today);
                break;
            case 'thisMonth':
                const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
                setFromDate(monthStart);
                setToDate(today);
                break;
            case 'lastMonth':
                const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
                setFromDate(lastMonthStart);
                setToDate(lastMonthEnd);
                break;
            case 'thisFY':
                const fyStart = today.getMonth() >= 3
                    ? new Date(today.getFullYear(), 3, 1)  // April 1st this year
                    : new Date(today.getFullYear() - 1, 3, 1);  // April 1st last year
                setFromDate(fyStart);
                setToDate(today);
                break;
            case 'all':
                setFromDate(null);
                setToDate(null);
                break;
        }
        setShowCalendar(false);
    };



    // Reset page on filter or date change
    useEffect(() => { setCurrentPage(1); }, [filter, fromDate, toDate]);

    const filteredLedgerEntries = ledgerEntries.filter(entry => {
        // Asset filter
        if (filter !== "All" && entry.asset !== filter) return false;

        // Date filter
        if (fromDate || toDate) {
            const entryDate = parseDate(entry.postingDate);
            if (!entryDate) return false;

            entryDate.setHours(0, 0, 0, 0);

            if (fromDate) {
                const from = new Date(fromDate);
                from.setHours(0, 0, 0, 0);
                if (entryDate < from) return false;
            }

            if (toDate) {
                const to = new Date(toDate);
                to.setHours(0, 0, 0, 0);
                if (entryDate > to) return false;
            }
        }

        return true;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEntries = filteredLedgerEntries.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLedgerEntries.length / itemsPerPage);

    const handleDownload = async (format: ExportFormat) => {
        const today = new Date().toLocaleDateString('en-GB');
        const clientId = clientData.clientCode || localStorage.getItem('clientId');

        if (!clientId) {
            console.error("Critical: Client ID missing for report export");
            return;
        }

        let logoBase64 = "";
        try {
            console.log('📸 Attempting to load logo from /logo.png...');
            const response = await fetch('/logo.png');
            console.log('📸 Logo fetch response status:', response.status);

            if (!response.ok) {
                throw new Error(`Failed to fetch logo: ${response.status} ${response.statusText}`);
            }

            const blob = await response.blob();
            console.log('📸 Logo blob size:', blob.size, 'bytes, type:', blob.type);

            logoBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    console.log('📸 Logo converted to base64, length:', (reader.result as string)?.length);
                    resolve(reader.result as string);
                };
                reader.onerror = (error) => {
                    console.error('📸 FileReader error:', error);
                    resolve('');
                };
                reader.readAsDataURL(blob);
            });

            if (logoBase64) {
                console.log('✅ Logo loaded successfully');
            } else {
                console.warn('⚠️ Logo base64 is empty');
            }
        } catch (error) {
            console.error('❌ Logo load error:', error);
            console.error('The Excel export will continue without the logo');
        }

        // Calculate summary
        const openingEntry = ledgerEntries.find(e => e.particulars.toLowerCase().includes('opening balance'));
        const openingBalance = openingEntry ? parseFloat(openingEntry.netBalance) : 0;
        const totalDebit = filteredLedgerEntries.reduce((sum, item) => sum + parseFloat(item.debit || 0), 0);
        const totalCredit = filteredLedgerEntries.reduce((sum, item) => sum + parseFloat(item.credit || 0), 0);
        const closingBalance = filteredLedgerEntries.length > 0 ? parseFloat(filteredLedgerEntries[filteredLedgerEntries.length - 1].netBalance) : 0;

        // Format date range for title
        const dateRangeText = fromDate && toDate
            ? `from ${formatDate(fromDate)} to ${formatDate(toDate)}`
            : today;

        const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <style>
        table {
            border-collapse: collapse;
            width: 100%;
            font-family: Arial, sans-serif;
        }
        .header-row td {
            border: none;
            padding: 5px 0;
            font-family: Arial, sans-serif;
            background: #ffffff;
        }
        .company-name {
            font-size: 16px;
            font-weight: bold;
            color: #2563eb;
        }
        .info-label {
            font-weight: 600;
            color: #333;
            font-size: 13px;
        }
        .info-value {
            color: #666;
            font-size: 13px;
        }
        .report-title {
            font-size: 14px;
            font-weight: 600;
            color: #333;
        }
        .data-header th {
            background-color: #ffffff;
            padding: 10px 8px;
            text-align: left;
            font-size: 11px;
            font-weight: 600;
            color: #555;
            border-top: 1px solid #dee2e6;
            border-bottom: 2px solid #dee2e6;
            border-left: 1px solid #dee2e6;
            border-right: 1px solid #dee2e6;
        }
        td.data-cell {
            padding: 9px 8px;
            border: 1px solid #e9ecef;
            font-size: 12px;
            color: #333;
            background: #ffffff;
        }
        .text-right { text-align: right; }
        .balance-row td {
            font-weight: 600;
        }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
    </style>
</head>
<body>
    <table cellspacing="0" cellpadding="0">
        <!-- Logo Row (if available) -->
        ${logoBase64 ? `<tr class="header-row"><td colspan="7"><img src="${logoBase64}" height="60" alt="Logo" /></td></tr>` : ''}

        <!-- Company Name Row -->
        <tr class="header-row">
            <td colspan="7" class="company-name">AIONION CAPITAL MARKETS</td>
        </tr>

        <!-- Empty Row for spacing -->
        <tr class="header-row"><td colspan="7">&nbsp;</td></tr>

        <!-- Client ID Row -->
        <tr class="header-row">
            <td colspan="7"><span class="info-label">Client ID</span>&nbsp;&nbsp;&nbsp;&nbsp;<span class="info-value">${clientId}</span></td>
        </tr>

        <!-- Empty Row for spacing -->
        <tr class="header-row"><td colspan="7">&nbsp;</td></tr>

        <!-- Report Title Row -->
        <tr class="header-row">
            <td colspan="7" class="report-title">Ledger for ${filter === "All" ? "All Assets" : filter} ${dateRangeText}</td>
        </tr>

        <!-- Empty Row before table -->
        <tr class="header-row"><td colspan="7">&nbsp;</td></tr>

        <!-- Data Table Headers -->
        <tr class="data-header">
            <th>Particulars</th>
            <th>Posting Date</th>
            <th>Cost Center</th>
            <th>Voucher Type</th>
            <th class="text-right">Debit</th>
            <th class="text-right">Credit</th>
            <th class="text-right">Net Balance</th>
        </tr>

        <!-- Data Rows -->
        ${filteredLedgerEntries.map(row => {
            const isBalanceRow = row.particulars.includes('Opening Balance') || row.particulars.includes('Closing Balance');
            const balanceValue = parseFloat(row.netBalance);
            const balanceClass = balanceValue < 0 ? 'negative' : 'positive';
            return `
        <tr${isBalanceRow ? ' class="balance-row"' : ''}>
            <td class="data-cell">${row.particulars || "-"}</td>
            <td class="data-cell">${row.postingDate || "-"}</td>
            <td class="data-cell">${row.costCenter || "-"}</td>
            <td class="data-cell">${row.voucherType || "-"}</td>
            <td class="data-cell text-right">${row.debit || "-"}</td>
            <td class="data-cell text-right">${row.credit || "-"}</td>
            <td class="data-cell text-right ${balanceClass}">${row.netBalance || "-"}</td>
        </tr>`;
        }).join('')}
    </table>
</body>
</html>`;

        if (format === 'pdf') {
            // Open in new window and trigger print dialog for PDF
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            if (newWindow) {
                newWindow.onload = () => {
                    setTimeout(() => newWindow.print(), 250);
                };
            }
        } else {
            // Download as Excel file
            const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `ledger_report_${filter.toLowerCase()}.xls`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {/* Header Section - No Scroll */}
            <div className="p-4 md:p-6 pb-4 bg-background/50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-lg md:text-xl font-bold text-foreground">Transaction Ledger</h2>

                    <div className="flex flex-wrap gap-2 md:gap-4 w-full sm:w-auto items-center">
                        {/* Date Range Selector */}
                        <div className="relative">
                            <button
                                onClick={() => setShowCalendar(!showCalendar)}
                                className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-xs md:text-sm font-semibold transition-all"
                            >
                                <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                                <span className="truncate max-w-[200px]">
                                    {fromDate && toDate
                                        ? `${formatDate(fromDate)} ~ ${formatDate(toDate)}`
                                        : "Select date range"}
                                </span>
                            </button>
                            {(fromDate || toDate) && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFromDate(null); setToDate(null); }}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs hover:bg-destructive/80 transition-colors"
                                    title="Clear dates"
                                >
                                    ×
                                </button>
                            )}
                        </div>

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

                        {/* Export Button with PDF/Excel dropdown */}
                        <ExportButton onExport={handleDownload} />
                    </div>
                </div>
            </div>


            {/* Calendar Popup - Dual Calendar View */}
            {showCalendar && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
                    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-4 w-auto">
                        {/* Quick Preset Buttons */}
                        <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => applyPreset('last7')}
                                className="px-3 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 transition-all duration-200"
                            >
                                last 7 days
                            </button>
                            <button
                                onClick={() => applyPreset('last30')}
                                className="px-3 py-1.5 text-xs font-semibold border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400 transition-all duration-200"
                            >
                                last 30 days
                            </button>

                            {/* FY Selector Buttons */}
                            <button
                                onClick={() => {
                                    setSelectedFY(getCurrentFY());
                                    setFromDate(null);
                                    setToDate(null);
                                    setShowCalendar(false);
                                }}
                                className={`px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all duration-200 ${selectedFY === getCurrentFY()
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400'
                                    }`}
                            >
                                {getCurrentFY()}
                            </button>
                            <button
                                onClick={() => {
                                    const today = new Date();
                                    const currentMonth = today.getMonth();
                                    const currentYear = today.getFullYear();
                                    const fyStart = (currentMonth < 3 ? currentYear - 1 : currentYear) - 1;
                                    const prevFY = `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`;

                                    setSelectedFY(prevFY);
                                    setFromDate(null);
                                    setToDate(null);
                                    setShowCalendar(false);
                                }}
                                className={`px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all duration-200 ${selectedFY === (() => {
                                    const today = new Date();
                                    const currentMonth = today.getMonth();
                                    const currentYear = today.getFullYear();
                                    const fyStart = (currentMonth < 3 ? currentYear - 1 : currentYear) - 1;
                                    return `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`;
                                })()
                                    ? 'bg-blue-500 text-white border-blue-500'
                                    : 'border-gray-300 dark:border-gray-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:border-blue-400'
                                    }`}
                            >
                                {(() => {
                                    const today = new Date();
                                    const currentMonth = today.getMonth();
                                    const currentYear = today.getFullYear();
                                    const fyStart = (currentMonth < 3 ? currentYear - 1 : currentYear) - 1;
                                    return `FY ${fyStart}-${String(fyStart + 1).slice(-2)}`;
                                })()}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* From Calendar */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 shadow-sm">
                                <div className="text-center mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">From</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <button
                                        onClick={() => {
                                            const prev = new Date(currentMonth);
                                            prev.setMonth(prev.getMonth() - 1);
                                            setCurrentMonth(prev);
                                        }}
                                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-bold">
                                        {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const next = new Date(currentMonth);
                                            next.setMonth(next.getMonth() + 1);
                                            setCurrentMonth(next);
                                        }}
                                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
                                    >
                                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </button>
                                </div>

                                {/* Day Headers */}
                                <div className="grid grid-cols-7 gap-0.5 mb-1">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground py-0.5">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Days */}
                                <div className="grid grid-cols-7 gap-1">
                                    {(() => {
                                        const year = currentMonth.getFullYear();
                                        const month = currentMonth.getMonth();
                                        const firstDay = new Date(year, month, 1).getDay();
                                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                                        const days = [];

                                        for (let i = 0; i < firstDay; i++) {
                                            days.push(<div key={`empty-${i}`} className="p-2"></div>);
                                        }

                                        for (let day = 1; day <= daysInMonth; day++) {
                                            const date = new Date(year, month, day);
                                            date.setHours(0, 0, 0, 0);
                                            const isSelected = fromDate && date.getTime() === fromDate.getTime();
                                            const isInRange = fromDate && toDate && date >= fromDate && date <= toDate;
                                            const isToday = date.toDateString() === new Date().toDateString();

                                            days.push(
                                                <button
                                                    key={day}
                                                    onClick={() => setFromDate(date)}
                                                    className={`
                                                        aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-all duration-200
                                                        ${isSelected ? 'bg-blue-600 text-white shadow-lg scale-105 font-bold' : ''}
                                                        ${isInRange && !isSelected ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}
                                                        ${isToday && !isSelected ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}
                                                        ${!isSelected && !isInRange ? 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105' : ''}
                                                    `}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        }

                                        return days;
                                    })()}
                                </div>
                            </div>

                            {/* To Calendar */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 shadow-sm">
                                <div className="text-center mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">To</span>
                                </div>
                                <div className="flex items-center justify-between mb-2">
                                    <button
                                        onClick={() => {
                                            const prev = new Date(currentMonth);
                                            prev.setMonth(prev.getMonth() - 1);
                                            setCurrentMonth(prev);
                                        }}
                                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
                                    >
                                        <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </button>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                        {(() => {
                                            const nextMonth = new Date(currentMonth);
                                            nextMonth.setMonth(nextMonth.getMonth() + 1);
                                            return nextMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                                        })()}
                                    </span>
                                    <button
                                        onClick={() => {
                                            const next = new Date(currentMonth);
                                            next.setMonth(next.getMonth() + 1);
                                            setCurrentMonth(next);
                                        }}
                                        className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
                                    >
                                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </button>
                                </div>

                                {/* Day Headers */}
                                <div className="grid grid-cols-7 gap-0.5 mb-1">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground py-0.5">
                                            {day}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Days */}
                                <div className="grid grid-cols-7 gap-1">
                                    {(() => {
                                        const nextMonthDate = new Date(currentMonth);
                                        nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
                                        const year = nextMonthDate.getFullYear();
                                        const month = nextMonthDate.getMonth();
                                        const firstDay = new Date(year, month, 1).getDay();
                                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                                        const days = [];

                                        for (let i = 0; i < firstDay; i++) {
                                            days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
                                        }

                                        for (let day = 1; day <= daysInMonth; day++) {
                                            const date = new Date(year, month, day);
                                            date.setHours(0, 0, 0, 0);
                                            const isSelected = toDate && date.getTime() === toDate.getTime();
                                            const isInRange = fromDate && toDate && date >= fromDate && date <= toDate;
                                            const isToday = date.toDateString() === new Date().toDateString();

                                            days.push(
                                                <button
                                                    key={day}
                                                    onClick={() => setToDate(date)}
                                                    className={`
                                                        aspect-square flex items-center justify-center text-xs font-medium rounded-lg transition-all duration-200
                                                        ${isSelected ? 'bg-blue-600 text-white shadow-lg scale-105 font-bold' : ''}
                                                        ${isInRange && !isSelected ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}
                                                        ${isToday && !isSelected ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}
                                                        ${!isSelected && !isInRange ? 'hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105' : ''}
                                                    `}
                                                >
                                                    {day}
                                                </button>
                                            );
                                        }

                                        return days;
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setShowCalendar(false)}
                            className="mt-4 w-full px-4 py-1.5 bg-muted hover:bg-muted/80 rounded-lg text-sm font-semibold transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </>
            )}




            {/* Ledger Summary Cards */}
            {!loading && filteredLedgerEntries.length > 0 && (
                <div className="grid grid-cols-2 gap-2 md:gap-3 p-2 md:p-3 pt-0">
                    {(() => {
                        // Calculate opening balance for the filtered period
                        // Opening = First entry's net balance - first entry's debit + first entry's credit
                        let openingVal = 0;
                        if (filteredLedgerEntries.length > 0) {
                            const firstEntry = filteredLedgerEntries[0];
                            // If it's an actual "Opening Balance" entry, use its net balance directly
                            if (firstEntry.particulars.toLowerCase().includes('opening balance')) {
                                openingVal = parseFloat(firstEntry.netBalance);
                            } else {
                                // Calculate opening from first transaction: 
                                // Opening Balance = Current Balance - Debit + Credit
                                openingVal = parseFloat(firstEntry.netBalance) - parseFloat(firstEntry.debit || 0) + parseFloat(firstEntry.credit || 0);
                            }
                        }

                        // Calculate Totals
                        //  const totalDebit = filteredLedgerEntries.reduce((sum, item) => sum + parseFloat(item.debit || 0), 0);
                        //  const totalCredit = filteredLedgerEntries.reduce((sum, item) => sum + parseFloat(item.credit || 0), 0);

                        // Closing Balance is the last entry's balance
                        const closingVal = filteredLedgerEntries.length > 0 ? parseFloat(filteredLedgerEntries[filteredLedgerEntries.length - 1].netBalance) : 0;

                        return (
                            <>
                                <div className="bg-muted/30 p-2 md:p-3 rounded-lg border border-border/50">
                                    <div className="text-[10px] md:text-xs text-muted-foreground font-medium mb-0.5">Opening Balance</div>
                                    <div className={`text-sm md:text-base font-bold ${openingVal < 0 ? 'text-red-500' : 'text-foreground'}`}>
                                        ₹{openingVal.toFixed(2)}
                                    </div>
                                </div>
                                {/* <div className="bg-muted/30 p-3 md:p-4 rounded-xl border border-border/50">
                                    <div className="text-xs text-muted-foreground font-medium mb-1">Total Debits</div>
                                    <div className="text-base md:text-lg font-bold text-foreground">
                                        ₹{totalDebit.toFixed(2)}
                                    </div>
                                </div>
                                <div className="bg-muted/30 p-3 md:p-4 rounded-xl border border-border/50">
                                    <div className="text-xs text-muted-foreground font-medium mb-1">Total Credits</div>
                                    <div className="text-base md:text-lg font-bold text-foreground">
                                        ₹{totalCredit.toFixed(2)}
                                    </div>
                                </div> */}
                                <div className="bg-muted/30 p-2 md:p-3 rounded-lg border border-border/50">
                                    <div className="text-[10px] md:text-xs text-muted-foreground font-medium mb-0.5">Closing Balance</div>
                                    <div className={`text-sm md:text-base font-bold ${closingVal < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        ₹{closingVal.toFixed(2)}
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}


            {/* Table Section - Responsive without scroll */}
            <div className="border-t border-border">
                <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                        <tr className="bg-muted/30">
                            <th className="py-3 px-3 text-muted-foreground font-semibold text-xs bg-background/50 w-[25%]">Particulars</th>
                            <th className="py-3 px-2 text-muted-foreground font-semibold text-xs bg-background/50 w-[9%]">Date</th>
                            <th className="py-3 px-2 text-muted-foreground font-semibold text-xs bg-background/50 w-[7%]">Cost Ctr</th>
                            <th className="py-3 px-2 text-muted-foreground font-semibold text-xs bg-background/50 w-[11%]">Voucher</th>
                            <th className="py-3 px-2 text-right text-muted-foreground font-semibold text-xs bg-background/50 w-[11%]">Debit</th>
                            <th className="py-3 px-2 text-right text-muted-foreground font-semibold text-xs bg-background/50 w-[11%]">Credit</th>
                            <th className="py-3 px-2 text-right text-muted-foreground font-semibold text-xs bg-background/50 w-[14%]">Balance</th>
                            <th className="py-3 px-2 text-center text-muted-foreground font-semibold text-xs bg-background/50 w-[8%]">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        Loading ledger...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredLedgerEntries.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                    No ledger entries found for {filter === "All" ? "all assets" : filter}.
                                </td>
                            </tr>
                        ) : (
                            currentEntries.map((entry, i) => {
                                const isOpeningOrClosing = entry.particulars?.includes("Opening Balance") || entry.particulars?.includes("Closing Balance");
                                const netBalanceValue = parseFloat(entry.netBalance);
                                const isNegative = netBalanceValue < 0;

                                return (
                                    <tr key={i} className={`hover:bg-primary/5 transition-colors ${isOpeningOrClosing ? 'font-bold bg-muted/20' : ''}`}>
                                        <td className={`py-4 px-3 font-medium ${isOpeningOrClosing ? 'text-foreground font-bold' : 'text-foreground/80'}`}>
                                            <div className="line-clamp-2 text-xs" title={entry.particulars}>
                                                {entry.particulars || "-"}
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 text-foreground/80 font-medium text-xs">{entry.postingDate || "-"}</td>
                                        <td className="py-4 px-2 text-foreground/80 font-medium text-xs">{entry.costCenter || "-"}</td>
                                        <td className="py-4 px-2 text-foreground/80 font-medium text-xs truncate" title={entry.voucherType}>{entry.voucherType || "-"}</td>
                                        <td className="py-4 px-2 text-right text-foreground font-bold text-xs">{entry.debit || "-"}</td>
                                        <td className="py-4 px-2 text-right text-foreground font-bold text-xs">{entry.credit || "-"}</td>
                                        <td className={`py-4 px-2 text-right font-bold text-sm ${isNegative ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {entry.netBalance || "-"}
                                        </td>
                                        <td className="py-4 px-2 text-center text-xs text-muted-foreground font-medium">
                                            {entry.asset || "-"}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {
                filteredLedgerEntries.length > itemsPerPage && (
                    <div className="flex items-center justify-center gap-1 p-4 border-t border-border bg-muted/20">
                        {/* Previous Button */}
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                        >
                            ‹
                        </button>

                        {/* Page Numbers */}
                        {(() => {
                            const pages = [];
                            const showEllipsisStart = currentPage > 3;
                            const showEllipsisEnd = currentPage < totalPages - 2;

                            // Always show first page
                            pages.push(
                                <button
                                    key={1}
                                    onClick={() => setCurrentPage(1)}
                                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === 1
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    1
                                </button>
                            );

                            // Show ellipsis if needed
                            if (showEllipsisStart) {
                                pages.push(
                                    <span key="ellipsis-start" className="px-2 text-muted-foreground">
                                        ...
                                    </span>
                                );
                            }

                            // Show pages around current page
                            const startPage = Math.max(2, currentPage - 1);
                            const endPage = Math.min(totalPages - 1, currentPage + 1);

                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === i
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {i}
                                    </button>
                                );
                            }

                            // Show ellipsis if needed
                            if (showEllipsisEnd) {
                                pages.push(
                                    <span key="ellipsis-end" className="px-2 text-muted-foreground">
                                        ...
                                    </span>
                                );
                            }

                            // Always show last page if more than 1 page
                            if (totalPages > 1) {
                                pages.push(
                                    <button
                                        key={totalPages}
                                        onClick={() => setCurrentPage(totalPages)}
                                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === totalPages
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {totalPages}
                                    </button>
                                );
                            }

                            return pages;
                        })()}

                        {/* Next Button */}
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                        >
                            ›
                        </button>
                    </div>
                )
            }
        </div >
    );
};


const HoldingsTab = () => {
    const [filter, setFilter] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { data: clientData, isLoading: clientDataLoading } = useClientData();
    const holdings = clientData.holdings;
    const loading = clientDataLoading;



    const filteredHoldings = filter === "All"
        ? holdings
        : holdings.filter(h => h.type === filter);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [filter]);

    const totalPages = Math.ceil(filteredHoldings.length / itemsPerPage);
    const paginatedHoldings = filteredHoldings.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleDownload = async (format: ExportFormat) => {
        const today = new Date().toLocaleDateString('en-GB');
        const clientId = clientData.clientCode || localStorage.getItem('clientId');

        if (!clientId) {
            console.error("Critical: Client ID missing for report export");
            return;
        }

        let logoBase64 = "";
        try {
            const response = await fetch('/logo.png');
            const blob = await response.blob();
            logoBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (error) { console.error("Logo load error", error); }

        const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <!--[if gte mso 9]>
    <xml>
    <x:ExcelWorkbook>
    <x:ExcelWorksheets>
    <x:ExcelWorksheet>
    <x:Name>Report</x:Name>
    <x:WorksheetOptions>
    <x:DisplayGridlines/>
    </x:WorksheetOptions>
    </x:ExcelWorksheet>
    </x:ExcelWorksheets>
    </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <title>Holdings Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0; gap: 5px; }
        .logo-img { height: 80px; width: auto; object-fit: contain; }
        .logo-text { font-size: 24px; font-weight: bold; color: #1e40af; }
        .client-info { margin-bottom: 30px; }
        .client-info p { margin: 5px 0; color: #666; }
        .client-id { font-weight: bold; color: #000; }
        .report-title { font-size: 18px; font-weight: 600; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        thead { background: #f3f4f6; }
        th { padding: 12px 8px; text-align: left; font-size: 10px; font-weight: 600; color: #666; text-transform: uppercase; border-bottom: 2px solid #e0e0e0; white-space: nowrap; }
        td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        tr:hover { background: #f9fafb; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        .font-bold { font-weight: bold; }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <img src="${window.location.origin}/logo.png" alt="Aionion Capital" class="logo-img" onerror="this.style.display='none'" />
        <div class="logo-text">Aionion Capital Markets</div>
    </div>
    <div class="client-info">
        <p><span class="client-id">Client ID:</span> ${clientId}</p>
    </div>
    <h2 class="report-title">Holdings Report - ${filter === "All" ? "All Assets" : filter} (${today})</h2>
    <table>
        <thead>
            <tr>
                <th>Symbol</th>
                <th>ISIN</th>
                <th class="text-center">POA Qty</th>
                <th class="text-center">Non-POA Qty</th>
                <th class="text-center">Qty Long Term</th>
                <th class="text-right">Avg Price</th>
                <th class="text-right">Prev Closing</th>
                <th class="text-right">Unrealized P&L</th>
                <th class="text-center">P&L %</th>
                <th class="text-center">Asset</th>
            </tr>
        </thead>
        <tbody>
            ${filteredHoldings.map(row => `
                <tr>
                    <td class="font-bold">${row.symbol}</td>
                    <td style="font-size: 10px; color: #666;">${row.isin}</td>
                    <td class="text-center">${row.poaQty}</td>
                    <td class="text-center">${row.nonPoaQty}</td>
                    <td class="text-center">${row.qtyLongTerm}</td>
                    <td class="text-right">${row.avgPrice}</td>
                    <td class="text-right">${row.prevClosing}</td>
                    <td class="text-right font-bold positive">${row.unrealizedPL}</td>
                    <td class="text-center positive">${row.unrealizedPLPercent}%</td>
                    <td class="text-center">${row.type}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

        if (format === 'pdf') {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            if (newWindow) {
                newWindow.onload = () => setTimeout(() => newWindow.print(), 250);
            }
        } else {
            const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `holdings_report_${filter.toLowerCase()}.xls`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
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

                        {/* Export Button with PDF/Excel dropdown */}
                        <ExportButton onExport={handleDownload} />
                    </div>
                </div>
            </div>

            {/* Table Section - With Horizontal Scroll */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-t border-b border-border">
                            <th className="py-3 px-2 text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50" style={{ minWidth: '150px' }}>Symbol</th>
                            <th className="py-3 px-2 text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">ISIN</th>
                            <th className="py-3 px-2 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">POA Qty</th>
                            <th className="py-3 px-2 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Non-POA</th>
                            <th className="py-3 px-2 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Long Term Qty</th>
                            <th className="py-3 px-2 text-right text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Avg Price</th>
                            <th className="py-3 px-2 text-right text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Prev Close</th>
                            <th className="py-3 px-2 text-right text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Unreal. P&L</th>
                            <th className="py-3 px-2 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">P&L %</th>
                            <th className="py-3 px-2 text-center text-muted-foreground font-medium text-xs whitespace-nowrap bg-background/50">Asset</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        Loading holdings...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredHoldings.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="py-12 text-center text-muted-foreground">
                                    No holdings found for {filter === "All" ? "all assets" : filter}.
                                </td>
                            </tr>
                        ) : (
                            paginatedHoldings.map((h, i) => (
                                <tr key={i} className="hover:bg-muted/30 transition-colors">
                                    <td className="py-3 px-2 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-foreground text-sm">{h.symbol}</span>
                                            {h.name && <span className="text-[10px] text-muted-foreground font-medium mt-0.5 max-w-[150px] truncate" title={h.name}>{h.name}</span>}
                                        </div>
                                    </td>
                                    <td className="py-3 px-2 text-[10px] text-muted-foreground font-medium whitespace-nowrap">{h.isin}</td>
                                    <td className="py-3 px-2 text-center text-muted-foreground font-medium whitespace-nowrap text-xs">{h.poaQty}</td>
                                    <td className="py-3 px-2 text-center text-muted-foreground font-medium whitespace-nowrap text-xs">{h.nonPoaQty}</td>
                                    <td className="py-3 px-2 text-center text-muted-foreground font-medium whitespace-nowrap text-xs">{h.qtyLongTerm}</td>
                                    <td className="py-3 px-2 text-right text-muted-foreground font-medium whitespace-nowrap text-xs">{h.avgPrice}</td>
                                    <td className="py-3 px-2 text-right text-muted-foreground font-medium whitespace-nowrap text-xs">{h.prevClosing}</td>
                                    <td className={`py-3 px-2 text-right font-bold text-sm whitespace-nowrap ${parseFloat(h.unrealizedPL.replace(/,/g, '')) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{h.unrealizedPL}</td>
                                    <td className={`py-3 px-2 text-center font-medium text-xs whitespace-nowrap ${parseFloat(h.unrealizedPLPercent) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{h.unrealizedPLPercent}%</td>
                                    <td className="py-3 px-2 text-center text-muted-foreground font-medium whitespace-nowrap text-xs">
                                        <span className="px-3 py-1.5 rounded bg-muted/50 border border-border/50 text-xs font-semibold text-muted-foreground inline-block">
                                            {h.type}
                                        </span>
                                    </td>
                                </tr>
                            )))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {filteredHoldings.length > itemsPerPage && (
                <div className="flex items-center justify-center gap-1 p-4 border-t border-border bg-muted/20">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                        ‹
                    </button>

                    {(() => {
                        const pages = [];
                        const showEllipsisStart = currentPage > 3;
                        const showEllipsisEnd = currentPage < totalPages - 2;

                        pages.push(
                            <button
                                key={1}
                                onClick={() => setCurrentPage(1)}
                                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === 1
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                1
                            </button>
                        );

                        if (showEllipsisStart) {
                            pages.push(<span key="ellipsis-start" className="px-2 text-muted-foreground">...</span>);
                        }

                        const startPage = Math.max(2, currentPage - 1);
                        const endPage = Math.min(totalPages - 1, currentPage + 1);

                        for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === i
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {i}
                                </button>
                            );
                        }

                        if (showEllipsisEnd) {
                            pages.push(<span key="ellipsis-end" className="px-2 text-muted-foreground">...</span>);
                        }

                        if (totalPages > 1) {
                            pages.push(
                                <button
                                    key={totalPages}
                                    onClick={() => setCurrentPage(totalPages)}
                                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === totalPages
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {totalPages}
                                </button>
                            );
                        }

                        return pages;
                    })()}

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    );
};



const TransactionsTab = () => {
    const [filter, setFilter] = useState("All");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await getPortfolioData();

                // Check if fetch failed
                if (response.success === false || !response.data || response.data.length === 0) {
                    console.warn("No transaction data available");
                    setTransactions([]);
                    setLoading(false);
                    return;
                }

                // Map API response to transaction format
                const mappedTransactions = (response.data || []).map((item: any) => ({
                    symbol: item.security,  // Stock symbol
                    isin: item.isin || "-",  // ISIN code
                    tradeDate: item.tradeDate ? new Date(item.tradeDate).toLocaleDateString('en-GB') : "-",  // Format: DD/MM/YYYY
                    exchange: item.exchange || "-",  // Exchange (NSE/BSE/CASH)
                    segment: "Equity",  // Segment type
                    series: "EQ",  // Series
                    tradeType: parseFloat(item.qty) > 0 ? "BUY" : "SELL",  // BUY if qty > 0, else SELL
                    auction: "No",  // Auction flag
                    quantity: Math.abs(parseFloat(item.qty || 0)).toFixed(2),  // Absolute quantity
                    price: parseFloat(item.avgPrice || 0).toFixed(2),  // Price per share = RATE from API
                    tradeId: "-",  // Will be fetched from another API
                    orderId: "-",  // Will be fetched from another API
                    executionTime: "-",  // Will be fetched from another API
                    asset: "Equity"
                }));

                setTransactions(mappedTransactions);
            } catch (error) {
                console.error('Failed to fetch transactions:', error);
                setTransactions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const filteredTransactions = filter === "All"
        ? transactions
        : transactions.filter(t => t.asset === filter);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [filter]);

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleDownload = async (format: ExportFormat) => {
        const today = new Date().toLocaleDateString('en-GB');
        const clientId = localStorage.getItem('clientId') || 'CLIENT001';

        let logoBase64 = "";
        try {
            const response = await fetch('/logo.png');
            const blob = await response.blob();
            logoBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (error) { console.error("Logo load error", error); }

        const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <!--[if gte mso 9]>
    <xml>
    <x:ExcelWorkbook>
    <x:ExcelWorksheets>
    <x:ExcelWorksheet>
    <x:Name>Report</x:Name>
    <x:WorksheetOptions>
    <x:DisplayGridlines/>
    </x:WorksheetOptions>
    </x:ExcelWorksheet>
    </x:ExcelWorksheets>
    </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <title>Transaction Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0; gap: 5px; }
        .logo-img { height: 80px; width: auto; object-fit: contain; }
        .logo-text { font-size: 24px; font-weight: bold; color: #1e40af; }
        .client-info { margin-bottom: 30px; }
        .client-info p { margin: 5px 0; color: #666; }
        .client-id { font-weight: bold; color: #000; }
        .report-title { font-size: 18px; font-weight: 600; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        thead { background: #f3f4f6; }
        th { padding: 12px; text-align: left; font-size: 11px; font-weight: 600; color: #666; text-transform: uppercase; border-bottom: 2px solid #e0e0e0; white-space: nowrap; }
        td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
        tr:hover { background: #f9fafb; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        .font-bold { font-weight: bold; }
        .buy-badge { background: #d1fae5; color: #059669; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 11px; display: inline-block; }
        .sell-badge { background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 6px; font-weight: 600; font-size: 11px; display: inline-block; }
        @media print {
            body { padding: 20px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="${window.location.origin}/logo.png" alt="Aionion Capital" class="logo-img" onerror="this.style.display='none'" />
        <div class="logo-text">Aionion Capital Markets</div>
    </div>
    
    <div class="client-info">
        <p><span class="client-id">Client ID:</span> ${clientId}</p>
    </div>
    
    <h2 class="report-title">Transaction History - ${filter === "All" ? "All Assets" : filter} (${today})</h2>
    
    <table>
        <thead>
            <tr>
                <th>Symbol</th>
                <th>ISIN</th>
                <th>Trade Date</th>
                <th>Exchange</th>
                <th>Segment</th>
                <th>Series</th>
                <th>Trade Type</th>
                <th>Auction</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Price</th>
                <th>Trade ID</th>
                <th>Order ID</th>
                <th>Execution Time</th>
            </tr>
        </thead>
        <tbody>
            ${filteredTransactions.map(row => `
                <tr>
                    <td class="font-bold">${row.symbol}</td>
                    <td style="font-size: 11px; color: #666;">${row.isin}</td>
                    <td>${row.tradeDate}</td>
                    <td>${row.exchange}</td>
                    <td>${row.segment}</td>
                    <td>${row.series}</td>
                    <td><span class="${row.tradeType === 'BUY' ? 'buy-badge' : 'sell-badge'}">${row.tradeType}</span></td>
                    <td>${row.auction}</td>
                    <td class="text-right font-bold">${row.quantity}</td>
                    <td class="text-right font-bold">${row.price}</td>
                    <td>${row.tradeId}</td>
                    <td>${row.orderId}</td>
                    <td>${row.executionTime}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

        if (format === 'pdf') {
            // Open in new window and trigger print dialog for PDF
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            if (newWindow) {
                newWindow.onload = () => {
                    setTimeout(() => newWindow.print(), 250);
                };
            }
        } else {
            // Download as Excel file
            const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `transaction_report_${filter.toLowerCase()}.xls`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
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

                        {/* Export Button with PDF/Excel dropdown */}
                        <ExportButton onExport={handleDownload} />
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
                        {loading ? (
                            <tr>
                                <td colSpan={14} className="py-12 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        Loading transactions...
                                    </div>
                                </td>
                            </tr>
                        ) : filteredTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={14} className="py-12 text-center text-muted-foreground">
                                    No transactions found for {filter === "All" ? "all assets" : filter}.
                                </td>
                            </tr>
                        ) : (
                            paginatedTransactions.map((txn, i) => (
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {
                filteredTransactions.length > itemsPerPage && (
                    <div className="flex items-center justify-center gap-1 p-4 border-t border-border bg-muted/20">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                        >
                            ‹
                        </button>

                        {(() => {
                            const pages = [];
                            const showEllipsisStart = currentPage > 3;
                            const showEllipsisEnd = currentPage < totalPages - 2;

                            pages.push(
                                <button
                                    key={1}
                                    onClick={() => setCurrentPage(1)}
                                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === 1
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    1
                                </button>
                            );

                            if (showEllipsisStart) {
                                pages.push(<span key="ellipsis-start" className="px-2 text-muted-foreground">...</span>);
                            }

                            const startPage = Math.max(2, currentPage - 1);
                            const endPage = Math.min(totalPages - 1, currentPage + 1);

                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === i
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {i}
                                    </button>
                                );
                            }

                            if (showEllipsisEnd) {
                                pages.push(<span key="ellipsis-end" className="px-2 text-muted-foreground">...</span>);
                            }

                            if (totalPages > 1) {
                                pages.push(
                                    <button
                                        key={totalPages}
                                        onClick={() => setCurrentPage(totalPages)}
                                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === totalPages
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {totalPages}
                                    </button>
                                );
                            }

                            return pages;
                        })()}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                        >
                            ›
                        </button>
                    </div>
                )
            }
        </div >
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [filter]);

    const totalPages = Math.ceil(filteredXirrData.length / itemsPerPage);
    const paginatedXirrData = filteredXirrData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleDownload = async (format: ExportFormat) => {
        const today = new Date().toLocaleDateString('en-GB');
        const clientId = localStorage.getItem('clientId') || 'CLIENT001';

        let logoBase64 = "";
        try {
            const response = await fetch('/logo.png');
            const blob = await response.blob();
            logoBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (error) { console.error("Logo load error", error); }

        const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <!--[if gte mso 9]>
    <xml>
    <x:ExcelWorkbook>
    <x:ExcelWorksheets>
    <x:ExcelWorksheet>
    <x:Name>Report</x:Name>
    <x:WorksheetOptions>
    <x:DisplayGridlines/>
    </x:WorksheetOptions>
    </x:ExcelWorksheet>
    </x:ExcelWorksheets>
    </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <title>XIRR Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0; gap: 5px; }
        .logo-img { height: 80px; width: auto; object-fit: contain; }
        .logo-text { font-size: 24px; font-weight: bold; color: #1e40af; }
        .client-info { margin-bottom: 30px; }
        .client-info p { margin: 5px 0; color: #666; }
        .client-id { font-weight: bold; color: #000; }
        .report-title { font-size: 18px; font-weight: 600; margin: 20px 0; }
        .summary { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
        .summary-card { padding: 15px 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f9fafb; min-width: 150px; }
        .summary-label { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
        .summary-value { font-size: 18px; font-weight: bold; }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        thead { background: #f3f4f6; }
        th { padding: 12px 8px; text-align: left; font-size: 10px; font-weight: 600; color: #666; text-transform: uppercase; border-bottom: 2px solid #e0e0e0; }
        td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        .text-right { text-align: right !important; }
        .font-bold { font-weight: bold; }
        .total-row { background: #f3f4f6; font-weight: bold; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <img src="${window.location.origin}/logo.png" alt="Aionion Capital" class="logo-img" onerror="this.style.display='none'" />
        <div class="logo-text">Aionion Capital Markets</div>
    </div>
    <div class="client-info"><p><span class="client-id">Client ID:</span> ${clientId}</p></div>
    <h2 class="report-title">XIRR Report - ${filter === "All" ? "All Assets" : filter} (${today})</h2>
    <div class="summary">
        <div class="summary-card"><div class="summary-label">Total Invested</div><div class="summary-value">₹${totals.totalBuyAmount}</div></div>
        <div class="summary-card"><div class="summary-label">Current Value</div><div class="summary-value">₹${totals.currentValue}</div></div>
        <div class="summary-card"><div class="summary-label">Net Gain/Loss</div><div class="summary-value positive">₹${totals.netGainLoss}</div></div>
        <div class="summary-card"><div class="summary-label">Portfolio XIRR</div><div class="summary-value positive">${totals.xirrPercent}%</div></div>
    </div>
    <table>
        <thead><tr><th>Symbol</th><th>ISIN</th><th>First Buy</th><th>Last Txn</th><th class="text-right">Buy Amount</th><th class="text-right">Sell Amount</th><th class="text-right">Current Value</th><th class="text-right">Gain/Loss</th><th class="text-right">Days</th><th class="text-right">XIRR %</th></tr></thead>
        <tbody>
            ${filteredXirrData.map(row => `<tr><td class="font-bold">${row.symbol}</td><td style="font-size:10px;color:#666">${row.isin}</td><td>${row.firstBuyDate}</td><td>${row.lastTransactionDate}</td><td class="text-right">${row.totalBuyAmount}</td><td class="text-right">${row.totalSellAmount}</td><td class="text-right">${row.currentValue}</td><td class="text-right positive">${row.netGainLoss}</td><td class="text-right">${row.holdingPeriod}</td><td class="text-right font-bold positive">${row.xirrPercent}%</td></tr>`).join('')}
            <tr class="total-row"><td colspan="4">Total / Portfolio XIRR</td><td class="text-right">${totals.totalBuyAmount}</td><td class="text-right">${totals.totalSellAmount}</td><td class="text-right">${totals.currentValue}</td><td class="text-right positive">${totals.netGainLoss}</td><td></td><td class="text-right positive">${totals.xirrPercent}%</td></tr>
        </tbody>
    </table>
</body>
</html>`;

        if (format === 'pdf') {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            if (newWindow) { newWindow.onload = () => setTimeout(() => newWindow.print(), 250); }
        } else {
            const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `xirr_report_${filter.toLowerCase()}.xls`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
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

                        {/* Export Button with PDF/Excel dropdown */}
                        <ExportButton onExport={handleDownload} />
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
                        {paginatedXirrData.map((xirr, i) => {
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

            {/* Pagination Controls */}
            {filteredXirrData.length > itemsPerPage && (
                <div className="flex items-center justify-center gap-1 p-4 border-t border-border bg-muted/20">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                        ‹
                    </button>

                    {(() => {
                        const pages = [];
                        const showEllipsisStart = currentPage > 3;
                        const showEllipsisEnd = currentPage < totalPages - 2;

                        pages.push(
                            <button
                                key={1}
                                onClick={() => setCurrentPage(1)}
                                className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === 1
                                    ? 'bg-emerald-500 text-white shadow-md'
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                1
                            </button>
                        );

                        if (showEllipsisStart) {
                            pages.push(<span key="ellipsis-start" className="px-2 text-muted-foreground">...</span>);
                        }

                        const startPage = Math.max(2, currentPage - 1);
                        const endPage = Math.min(totalPages - 1, currentPage + 1);

                        for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i)}
                                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === i
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {i}
                                </button>
                            );
                        }

                        if (showEllipsisEnd) {
                            pages.push(<span key="ellipsis-end" className="px-2 text-muted-foreground">...</span>);
                        }

                        if (totalPages > 1) {
                            pages.push(
                                <button
                                    key={totalPages}
                                    onClick={() => setCurrentPage(totalPages)}
                                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === totalPages
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {totalPages}
                                </button>
                            );
                        }

                        return pages;
                    })()}

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                    >
                        ›
                    </button>
                </div>
            )}
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [filter]);

    const totalPages = Math.ceil(filteredCapitalGains.length / itemsPerPage);
    const paginatedCapitalGains = filteredCapitalGains.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleDownload = async (format: ExportFormat) => {
        const today = new Date().toLocaleDateString('en-GB');
        const clientId = localStorage.getItem('clientId') || 'CLIENT001';

        let logoBase64 = "";
        try {
            const response = await fetch('/logo.png');
            const blob = await response.blob();
            logoBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (error) { console.error("Logo load error", error); }

        const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <!--[if gte mso 9]>
    <xml>
    <x:ExcelWorkbook>
    <x:ExcelWorksheets>
    <x:ExcelWorksheet>
    <x:Name>Report</x:Name>
    <x:WorksheetOptions>
    <x:DisplayGridlines/>
    </x:WorksheetOptions>
    </x:ExcelWorksheet>
    </x:ExcelWorksheets>
    </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <title>Capital Gains Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0; gap: 5px; }
        .logo-img { height: 80px; width: auto; object-fit: contain; }
        .logo-text { font-size: 24px; font-weight: bold; color: #1e40af; }
        .client-info { margin-bottom: 30px; }
        .client-info p { margin: 5px 0; color: #666; }
        .client-id { font-weight: bold; color: #000; }
        .report-title { font-size: 18px; font-weight: 600; margin: 20px 0; }
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        thead { background: #f3f4f6; }
        th { padding: 10px 6px; text-align: left; font-size: 9px; font-weight: 600; color: #666; text-transform: uppercase; border-bottom: 2px solid #e0e0e0; }
        td { padding: 8px 6px; border-bottom: 1px solid #e5e7eb; font-size: 11px; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        .font-bold { font-weight: bold; }
        .stcg { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
        .ltcg { background: #d1fae5; color: #059669; padding: 2px 8px; border-radius: 4px; font-size: 10px; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <img src="${window.location.origin}/logo.png" alt="Aionion Capital" class="logo-img" onerror="this.style.display='none'" />
        <div class="logo-text">Aionion Capital Markets</div>
    </div>
    <div class="client-info"><p><span class="client-id">Client ID:</span> ${clientId}</p></div>
    <h2 class="report-title">Capital Gains Report - ${filter === "All" ? "All Assets" : filter} (${today})</h2>
    <table>
        <thead><tr><th>Symbol</th><th>Exchange</th><th>Buy Date</th><th>Sell Date</th><th class="text-right">Qty</th><th class="text-right">Buy Price</th><th class="text-right">Sell Price</th><th class="text-right">Gain/Loss</th><th class="text-center">Type</th><th class="text-right">Taxable</th><th class="text-right">Tax Rate</th><th class="text-right">Tax</th></tr></thead>
        <tbody>
            ${filteredCapitalGains.map(row => `<tr><td class="font-bold">${row.symbol}</td><td>${row.exchange}</td><td>${row.buyDate}</td><td>${row.sellDate}</td><td class="text-right">${row.quantity}</td><td class="text-right">${row.buyPrice}</td><td class="text-right">${row.sellPrice}</td><td class="text-right font-bold positive">${row.gainLoss}</td><td class="text-center"><span class="${row.gainType === 'STCG' ? 'stcg' : 'ltcg'}">${row.gainType}</span></td><td class="text-right">${row.taxableGain}</td><td class="text-right">${row.taxRate}</td><td class="text-right font-bold">${row.taxAmount}</td></tr>`).join('')}
        </tbody>
    </table>
</body>
</html>`;

        if (format === 'pdf') {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            if (newWindow) { newWindow.onload = () => setTimeout(() => newWindow.print(), 250); }
        } else {
            const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `capital_gains_report_${filter.toLowerCase()}.xls`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
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

                        {/* Export Button with PDF/Excel dropdown */}
                        <ExportButton onExport={handleDownload} />
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
                        {paginatedCapitalGains.map((cg, i) => {
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

            {/* Pagination Controls */}
            {
                filteredCapitalGains.length > itemsPerPage && (
                    <div className="flex items-center justify-center gap-1 p-4 border-t border-border bg-muted/20">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                        >
                            ‹
                        </button>

                        {(() => {
                            const pages = [];
                            const showEllipsisStart = currentPage > 3;
                            const showEllipsisEnd = currentPage < totalPages - 2;

                            pages.push(
                                <button
                                    key={1}
                                    onClick={() => setCurrentPage(1)}
                                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === 1
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    1
                                </button>
                            );

                            if (showEllipsisStart) {
                                pages.push(<span key="ellipsis-start" className="px-2 text-muted-foreground">...</span>);
                            }

                            const startPage = Math.max(2, currentPage - 1);
                            const endPage = Math.min(totalPages - 1, currentPage + 1);

                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === i
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {i}
                                    </button>
                                );
                            }

                            if (showEllipsisEnd) {
                                pages.push(<span key="ellipsis-end" className="px-2 text-muted-foreground">...</span>);
                            }

                            if (totalPages > 1) {
                                pages.push(
                                    <button
                                        key={totalPages}
                                        onClick={() => setCurrentPage(totalPages)}
                                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === totalPages
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {totalPages}
                                    </button>
                                );
                            }

                            return pages;
                        })()}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                        >
                            ›
                        </button>
                    </div>
                )
            }
        </div >
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [filter]);

    const totalPages = Math.ceil(filteredTaxItems.length / itemsPerPage);
    const paginatedTaxItems = filteredTaxItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleDownload = async (format: ExportFormat) => {
        const today = new Date().toLocaleDateString('en-GB');
        const clientId = localStorage.getItem('clientId') || 'CLIENT001';

        let logoBase64 = "";
        try {
            const response = await fetch('/logo.png');
            const blob = await response.blob();
            logoBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (error) { console.error("Logo load error", error); }

        const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <!--[if gte mso 9]>
    <xml>
    <x:ExcelWorkbook>
    <x:ExcelWorksheets>
    <x:ExcelWorksheet>
    <x:Name>Report</x:Name>
    <x:WorksheetOptions>
    <x:DisplayGridlines/>
    </x:WorksheetOptions>
    </x:ExcelWorksheet>
    </x:ExcelWorksheets>
    </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <title>Tax P&L Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0; gap: 5px; }
        .logo-img { height: 80px; width: auto; object-fit: contain; }
        .logo-text { font-size: 24px; font-weight: bold; color: #1e40af; }
        .client-info { margin-bottom: 30px; }
        .client-info p { margin: 5px 0; color: #666; }
        .client-id { font-weight: bold; color: #000; }
        .report-title { font-size: 18px; font-weight: 600; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        thead { background: #f3f4f6; }
        th { padding: 12px 8px; text-align: left; font-size: 10px; font-weight: 600; color: #666; text-transform: uppercase; border-bottom: 2px solid #e0e0e0; }
        td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        .text-right { text-align: right !important; }
        .font-bold { font-weight: bold; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <img src="${window.location.origin}/logo.png" alt="Aionion Capital" class="logo-img" onerror="this.style.display='none'" />
        <div class="logo-text">Aionion Capital Markets</div>
    </div>
    <div class="client-info"><p><span class="client-id">Client ID:</span> ${clientId}</p></div>
    <h2 class="report-title">Tax P&L Report - ${filter === "All" ? "All Types" : filter} (${today})</h2>
    <table>
        <thead><tr><th>Date</th><th>Security</th><th>Type</th><th class="text-right">Income/Gain</th><th class="text-right">Tax Liability</th><th>Section</th></tr></thead>
        <tbody>
            ${filteredTaxItems.length === 0 ? '<tr><td colspan="6" style="text-align:center;padding:40px;color:#666;">No tax data available</td></tr>' : filteredTaxItems.map(row => `<tr><td>${row.date}</td><td class="font-bold">${row.security}</td><td>${row.type}</td><td class="text-right">${row.income}</td><td class="text-right font-bold">${row.taxLiability}</td><td>${row.section}</td></tr>`).join('')}
        </tbody>
    </table>
</body>
</html>`;

        if (format === 'pdf') {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            if (newWindow) { newWindow.onload = () => setTimeout(() => newWindow.print(), 250); }
        } else {
            const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tax_pnl_report_${filter.toLowerCase()}.xls`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
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

                        {/* Export Button with PDF/Excel dropdown */}
                        <ExportButton onExport={handleDownload} />
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
                        {paginatedTaxItems.map((item, i) => (
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

            {/* Pagination Controls */}
            {
                filteredTaxItems.length > itemsPerPage && (
                    <div className="flex items-center justify-center gap-1 p-4 border-t border-border bg-muted/20">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                        >
                            ‹
                        </button>

                        {(() => {
                            const pages = [];
                            const showEllipsisStart = currentPage > 3;
                            const showEllipsisEnd = currentPage < totalPages - 2;

                            pages.push(
                                <button
                                    key={1}
                                    onClick={() => setCurrentPage(1)}
                                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === 1
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    1
                                </button>
                            );

                            if (showEllipsisStart) {
                                pages.push(<span key="ellipsis-start" className="px-2 text-muted-foreground">...</span>);
                            }

                            const startPage = Math.max(2, currentPage - 1);
                            const endPage = Math.min(totalPages - 1, currentPage + 1);

                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === i
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {i}
                                    </button>
                                );
                            }

                            if (showEllipsisEnd) {
                                pages.push(<span key="ellipsis-end" className="px-2 text-muted-foreground">...</span>);
                            }

                            if (totalPages > 1) {
                                pages.push(
                                    <button
                                        key={totalPages}
                                        onClick={() => setCurrentPage(totalPages)}
                                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === totalPages
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {totalPages}
                                    </button>
                                );
                            }

                            return pages;
                        })()}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                        >
                            ›
                        </button>
                    </div>
                )
            }
        </div >
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

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset page on filter change
    useEffect(() => { setCurrentPage(1); }, [filter]);

    const totalPages = Math.ceil(filteredDividends.length / itemsPerPage);
    const paginatedDividends = filteredDividends.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleDownload = async (format: ExportFormat) => {
        const today = new Date().toLocaleDateString('en-GB');
        const clientId = localStorage.getItem('clientId') || 'CLIENT001';

        let logoBase64 = "";
        try {
            const response = await fetch('/logo.png');
            const blob = await response.blob();
            logoBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (error) { console.error("Logo load error", error); }

        // Calculate totals
        const totalGross = filteredDividends.reduce((sum, d) => sum + parseFloat(d.grossAmount), 0);
        const totalTds = filteredDividends.reduce((sum, d) => sum + parseFloat(d.tdsAmount), 0);
        const totalNet = filteredDividends.reduce((sum, d) => sum + parseFloat(d.netAmount), 0);

        const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <!--[if gte mso 9]>
    <xml>
    <x:ExcelWorkbook>
    <x:ExcelWorksheets>
    <x:ExcelWorksheet>
    <x:Name>Report</x:Name>
    <x:WorksheetOptions>
    <x:DisplayGridlines/>
    </x:WorksheetOptions>
    </x:ExcelWorksheet>
    </x:ExcelWorksheets>
    </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <title>Dividends Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; }
        .header { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e0e0e0; gap: 5px; }
        .logo-img { height: 80px; width: auto; object-fit: contain; }
        .logo-text { font-size: 24px; font-weight: bold; color: #1e40af; }
        .client-info { margin-bottom: 30px; }
        .client-info p { margin: 5px 0; color: #666; }
        .client-id { font-weight: bold; color: #000; }
        .report-title { font-size: 18px; font-weight: 600; margin: 20px 0; }
        .summary { display: flex; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
        .summary-card { padding: 15px 20px; border: 1px solid #e0e0e0; border-radius: 8px; background: #f9fafb; min-width: 140px; }
        .summary-label { font-size: 11px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
        .summary-value { font-size: 18px; font-weight: bold; }
        .positive { color: #059669; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        thead { background: #f3f4f6; }
        th { padding: 12px 8px; text-align: left; font-size: 10px; font-weight: 600; color: #666; text-transform: uppercase; border-bottom: 2px solid #e0e0e0; }
        td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        .text-right { text-align: right !important; }
        .font-bold { font-weight: bold; }
        @media print { body { padding: 20px; } }
    </style>
</head>
<body>
    <div class="header"><div class="logo">Aionion Capital Markets</div></div>
    <div class="client-info"><p><span class="client-id">Client ID:</span> ${clientId}</p></div>
    <h2 class="report-title">Dividends & Interest Report - ${filter === "All" ? "All Assets" : filter} (${today})</h2>
    <div class="summary">
        <div class="summary-card"><div class="summary-label">Gross Amount</div><div class="summary-value">₹${totalGross.toFixed(2)}</div></div>
        <div class="summary-card"><div class="summary-label">TDS Deducted</div><div class="summary-value">₹${totalTds.toFixed(2)}</div></div>
        <div class="summary-card"><div class="summary-label">Net Amount</div><div class="summary-value positive">₹${totalNet.toFixed(2)}</div></div>
    </div>
    <table>
        <thead><tr><th>Period</th><th>Date</th><th>Category</th><th>Asset Name</th><th>Type</th><th class="text-right">Gross</th><th class="text-right">TDS</th><th class="text-right">Net</th></tr></thead>
        <tbody>
            ${filteredDividends.map(row => `<tr><td>${row.periodType}</td><td>${row.incomeDate}</td><td>${row.assetCategory}</td><td class="font-bold">${row.assetName}</td><td>${row.incomeType}</td><td class="text-right">${row.grossAmount}</td><td class="text-right">${row.tdsAmount}</td><td class="text-right font-bold positive">${row.netAmount}</td></tr>`).join('')}
        </tbody>
    </table>
</body>
</html>`;

        if (format === 'pdf') {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            if (newWindow) { newWindow.onload = () => setTimeout(() => newWindow.print(), 250); }
        } else {
            const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `dividends_report_${filter.toLowerCase()}.xls`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
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

                        {/* Export Button with PDF/Excel dropdown */}
                        <ExportButton onExport={handleDownload} />
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
                        {paginatedDividends.map((div, i) => (
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

            {/* Pagination Controls */}
            {
                filteredDividends.length > itemsPerPage && (
                    <div className="flex items-center justify-center gap-1 p-4 border-t border-border bg-muted/20">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                        >
                            ‹
                        </button>

                        {(() => {
                            const pages = [];
                            const showEllipsisStart = currentPage > 3;
                            const showEllipsisEnd = currentPage < totalPages - 2;

                            pages.push(
                                <button
                                    key={1}
                                    onClick={() => setCurrentPage(1)}
                                    className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === 1
                                        ? 'bg-emerald-500 text-white shadow-md'
                                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    1
                                </button>
                            );

                            if (showEllipsisStart) {
                                pages.push(<span key="ellipsis-start" className="px-2 text-muted-foreground">...</span>);
                            }

                            const startPage = Math.max(2, currentPage - 1);
                            const endPage = Math.min(totalPages - 1, currentPage + 1);

                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i)}
                                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === i
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {i}
                                    </button>
                                );
                            }

                            if (showEllipsisEnd) {
                                pages.push(<span key="ellipsis-end" className="px-2 text-muted-foreground">...</span>);
                            }

                            if (totalPages > 1) {
                                pages.push(
                                    <button
                                        key={totalPages}
                                        onClick={() => setCurrentPage(totalPages)}
                                        className={`w-8 h-8 rounded-full text-xs font-medium transition-colors flex items-center justify-center ${currentPage === totalPages
                                            ? 'bg-emerald-500 text-white shadow-md'
                                            : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {totalPages}
                                    </button>
                                );
                            }

                            return pages;
                        })()}

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center"
                        >
                            ›
                        </button>
                    </div>
                )
            }
        </div >
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
