
import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";

const TABS = ["Equity", "Mutual Funds", "Bonds"];

const equityData = [
    { security: "RELIANCE", name: "Reliance Industries", qty: 100, avgPrice: "₹2450", cmp: "₹2680", value: "₹2.68 L", pl: "+₹23,000", return: "+9.39%" },
    { security: "HDFCBANK", name: "HDFC Bank", qty: 150, avgPrice: "₹1580", cmp: "₹1720", value: "₹2.58 L", pl: "+₹21,000", return: "+8.86%" },
    { security: "INFY", name: "Infosys", qty: 200, avgPrice: "₹1450", cmp: "₹1580", value: "₹3.16 L", pl: "+₹26,000", return: "+8.97%" },
    { security: "TCS", name: "TCS", qty: 80, avgPrice: "₹3200", cmp: "₹3450", value: "₹2.76 L", pl: "+₹20,000", return: "+7.81%" },
    { security: "ICICIBANK", name: "ICICI Bank", qty: 250, avgPrice: "₹920", cmp: "₹1050", value: "₹2.63 L", pl: "+₹32,500", return: "+14.13%" },
];

const mfData = [
    { scheme: "Axis Bluechip Fund", folio: "AX123456", units: 1500, avgNav: "₹42.5", currNav: "₹48.2", value: "₹72,300", return: "+13.41%" },
    { scheme: "Mirae Asset Large Cap", folio: "MA789012", units: 2000, avgNav: "₹65.8", currNav: "₹78.5", value: "₹1.57 L", return: "+19.30%" },
    { scheme: "PPFAS Flexi Cap", folio: "PP345678", units: 1200, avgNav: "₹52", currNav: "₹61.8", value: "₹74,160", return: "+18.85%" },
];

const bondData = [
    { bond: "GOI 7.26% 2033", isin: "IN0020180034", qty: 5, price: "₹102.5", yield: "6.95%", value: "₹5.13 L", accrued: "+₹3,625", maturity: "2033-01-14" },
    { bond: "HDFC Ltd 7.95% 2026", isin: "INE001A07PQ5", qty: 3, price: "₹104.2", yield: "7.25%", value: "₹3.13 L", accrued: "+₹2,385", maturity: "2026-07-22" },
];

const getCellValue = (row: any, col: string) => {
    // Normalization map for specific columns
    const keyMap: Record<string, string> = {
        "Avg Price": "avgPrice",
        "Avg NAV": "avgNav",
        "Current NAV": "currNav",
        "P&L": "pl",
        "Return": "return"
    };

    if (keyMap[col]) return row[keyMap[col]];

    // Fallback to standard lowercase/trim
    return row[col.toLowerCase().replace(/\s/g, '')] || row[col.toLowerCase().replace(/\s/g, '_')] || row[col.toLowerCase()] || row[col];
};

function Table({ columns, data }: { columns: string[]; data: any[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left rounded-xl overflow-hidden">
                <thead>
                    <tr className="border-t border-b border-border">
                        {columns.map((col) => (
                            <th
                                key={col}
                                className="py-5 px-6 font-semibold text-muted-foreground text-xs bg-background/50 whitespace-nowrap"
                            >
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                    {data.map((row, i) => (
                        <tr key={i} className="hover:bg-primary/5 transition-colors duration-150 group">
                            {columns.map((col) => {
                                const val = getCellValue(row, col);

                                // Special Rendering Logic
                                if (col === "Security") {
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
                                if (col === "P&L" || col === "Yield" || col === "Accrued") {
                                    const isPos = typeof val === 'string' ? !val.startsWith('-') : val > 0;
                                    return (
                                        <td key={col} className={`py-5 px-6 font-medium ${isPos ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {val}
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
                                if (col === "Return") {
                                    const isPos = typeof val === 'string' ? !val.startsWith('-') : val > 0;
                                    return (
                                        <td key={col} className="py-5 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${isPos ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                                }`}>
                                                {val}
                                            </span>
                                        </td>
                                    );
                                }

                                // Default Render
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

export default function ClientHoldings() {
    const [tab, setTab] = useState(0);
    return (
        <DashboardLayout role="client">
            <div className="max-w-7xl mx-auto w-full p-8">
                <h1 className="text-4xl font-display font-bold mb-6 text-foreground">Holdings</h1>
                <div className="flex gap-4 mb-8">
                    {TABS.map((t, i) => (
                        <button
                            key={t}
                            className={`px-5 py-2 rounded-full font-medium text-base transition-all duration-200 ${tab === i ? 'bg-primary text-white shadow-lg' : 'bg-background text-foreground border border-border hover:bg-primary/10'}`}
                            onClick={() => setTab(i)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
                <AnimatePresence mode="wait">
                    {tab === 0 && (
                        <motion.div
                            key="equity"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden"
                        >
                            {/* Header Section */}
                            <div className="p-6 pb-4 bg-background/50">
                                <h2 className="text-xl font-bold">Equity Holdings</h2>
                            </div>
                            {/* Table Section */}
                            <Table columns={["Security", "Qty", "Avg Price", "CMP", "Value", "P&L", "Return"]} data={equityData} />
                        </motion.div>
                    )}
                    {tab === 1 && (
                        <motion.div
                            key="mf"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden"
                        >
                            {/* Header Section */}
                            <div className="p-6 pb-4 bg-background/50">
                                <h2 className="text-xl font-bold">Mutual Fund Holdings</h2>
                            </div>
                            {/* Table Section */}
                            <Table columns={["Scheme", "Folio", "Units", "Avg NAV", "Current NAV", "Value", "Return"]} data={mfData} />
                        </motion.div>
                    )}
                    {tab === 2 && (
                        <motion.div
                            key="bonds"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="rounded-2xl bg-card border border-border/50 shadow-xl overflow-hidden"
                        >
                            {/* Header Section */}
                            <div className="p-6 pb-4 bg-background/50">
                                <h2 className="text-xl font-bold">Bond Holdings</h2>
                            </div>
                            {/* Table Section */}
                            <Table columns={["Bond", "Qty", "Price", "Yield", "Value", "Accrued", "Maturity"]} data={bondData} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </DashboardLayout>
    );
}
