import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, ArrowRight, Eye, Activity } from "lucide-react";

// --- Mock Data ---
const rmSummary = {
    totalClients: 18,
    totalAUM: 6.42,
    todayChange: 0.073,
    avgXIRR: 15.8,
    activeClients: 16,
    pendingActions: 3,
};

const topClients = [
    { id: "CL005", name: "Vikram Mehta", portfolio: 89.4, todayChange: -1.56, returns: 24.9, xirr: 21.2, status: "down", riskLevel: "Medium" },
    { id: "CL003", name: "Amit Patel", portfolio: 67.2, todayChange: 2.84, returns: 23.5, xirr: 19.4, status: "up", riskLevel: "High" },
    { id: "CL007", name: "Suresh Rao", portfolio: 52.4, todayChange: -1.23, returns: 10.8, xirr: 9.8, status: "down", riskLevel: "Low" },
    { id: "CL009", name: "Karan Singh", portfolio: 48.6, todayChange: 0.82, returns: 11.2, xirr: 11.8, status: "up", riskLevel: "Medium" },
    { id: "CL002", name: "Priya Sharma", portfolio: 45.5, todayChange: 1.25, returns: 18.5, xirr: 15.2, status: "up", riskLevel: "Low" },
    { id: "CL008", name: "Meera Joshi", portfolio: 45.8, todayChange: -0.51, returns: 16.5, xirr: 14.2, status: "down", riskLevel: "Medium" },
    { id: "CL006", name: "Anita Desai", portfolio: 38.2, todayChange: 0.89, returns: 14.2, xirr: 13.5, status: "up", riskLevel: "Low" },
    { id: "CL001", name: "Rajesh Kumar", portfolio: 32.8, todayChange: -0.52, returns: 12.3, xirr: 11.8, status: "down", riskLevel: "High" },
];

const performanceData = [
    { date: "Week 1", value: 5.9 },
    { date: "Week 2", value: 6.0 },
    { date: "Week 3", value: 6.1 },
    { date: "Week 4", value: 6.42 },
];

const quickStats = [
    { label: "Equity", value: "60%", amount: "₹3.85 Cr", color: "bg-emerald-500" },
    { label: "Mutual Funds", value: "30%", amount: "₹1.92 Cr", color: "bg-blue-500" },
    { label: "Bonds", value: "10%", amount: "₹0.65 Cr", color: "bg-purple-500" },
];

const pendingActions = [
    { client: "Suresh Rao", action: "Portfolio Review Needed", priority: "high", icon: AlertTriangle },
    { client: "Meera Joshi", action: "SIP Due Tomorrow", priority: "medium", icon: Clock },
    { client: "Vikram Mehta", action: "Rebalancing Suggested", priority: "low", icon: CheckCircle },
];

const recentActivity = [
    { client: "Rajesh Kumar", action: "Buy RELIANCE x50", time: "2h ago", amount: "+₹1.22 L" },
    { client: "Amit Patel", action: "Sell INFY x30", time: "5h ago", amount: "-₹48.6 K" },
    { client: "Priya Sharma", action: "SIP Axis Bluechip", time: "1d ago", amount: "+₹50 K" },
    { client: "Karan Singh", action: "Buy HDFCBANK x100", time: "2d ago", amount: "+₹1.68 L" },
];

export default function RMDashboard() {
    const [selectedView, setSelectedView] = useState<"all" | "high" | "medium" | "low">("all");

    const filteredClients = selectedView === "all"
        ? topClients
        : topClients.filter(c => c.riskLevel.toLowerCase() === selectedView);

    return (
        <DashboardLayout role="rm">
            <div className="max-w-[1600px] mx-auto w-full p-6">
                {/* Header with Quick Stats */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-1">Client Portfolio Manager</h1>
                            <p className="text-muted-foreground text-sm">Monitor and manage your client portfolios</p>
                        </div>
                        <div className="flex gap-3">
                            <div className="px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <p className="text-xs text-muted-foreground mb-1">Active Clients</p>
                                <p className="text-xl font-bold text-emerald-500">{rmSummary.activeClients}/{rmSummary.totalClients}</p>
                            </div>

                        </div>
                    </div>

                    {/* Horizontal Stats Bar */}
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <Users className="w-8 h-8 opacity-80" />
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <p className="text-sm opacity-90 mb-1">Total Clients</p>
                            <p className="text-3xl font-bold">{rmSummary.totalClients}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <DollarSign className="w-8 h-8 opacity-80" />
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <p className="text-sm opacity-90 mb-1">Total AUM</p>
                            <p className="text-3xl font-bold">₹{rmSummary.totalAUM} Cr</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <TrendingUp className="w-8 h-8 opacity-80" />
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Today</span>
                            </div>
                            <p className="text-sm opacity-90 mb-1">Portfolio Change</p>
                            <p className="text-3xl font-bold">+₹{rmSummary.todayChange} L</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <Activity className="w-8 h-8 opacity-80" />
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Avg</span>
                            </div>
                            <p className="text-sm opacity-90 mb-1">Portfolio XIRR</p>
                            <p className="text-3xl font-bold">{rmSummary.avgXIRR}%</p>
                        </div>
                    </div>
                </div>

                {/* Main Content - 2 Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Client List (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Client Portfolio List */}
                        <div className="bg-card rounded-xl border border-border shadow-sm">
                            <div className="p-5 border-b border-border flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">Client Portfolios</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">Manage and monitor your clients</p>
                                </div>
                                <div className="flex gap-2">
                                    {["all", "high", "medium", "low"].map((view) => (
                                        <button
                                            key={view}
                                            onClick={() => setSelectedView(view as any)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${selectedView === view
                                                ? "bg-primary text-white"
                                                : "bg-muted text-muted-foreground hover:bg-muted/70"
                                                }`}
                                        >
                                            {view} Risk
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="divide-y divide-border">
                                {filteredClients.map((client, idx) => (
                                    <div key={idx} className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                                    <span className="text-lg font-bold text-primary">{client.name.charAt(0)}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-sm font-bold text-foreground">{client.name}</h3>
                                                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${client.riskLevel === "High" ? "bg-red-500/10 text-red-500" :
                                                            client.riskLevel === "Medium" ? "bg-yellow-500/10 text-yellow-500" :
                                                                "bg-emerald-500/10 text-emerald-500"
                                                            }`}>
                                                            {client.riskLevel} Risk
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span>Portfolio: ₹{client.portfolio} L</span>
                                                        <span>•</span>
                                                        <span>XIRR: {client.xirr}%</span>
                                                        <span>•</span>
                                                        <span>Returns: +{client.returns}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right">
                                                    <p className="text-xs text-muted-foreground mb-1">Today's Change</p>
                                                    <p className={`text-sm font-bold ${client.todayChange >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                                        {client.todayChange >= 0 ? "+" : ""}₹{client.todayChange} L
                                                    </p>
                                                </div>
                                                <button className="p-2 rounded-lg bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Performance Chart */}
                        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
                            <h3 className="text-sm font-bold text-foreground mb-4">AUM Growth Trend</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                    <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-card border border-border rounded-lg p-2 shadow-xl">
                                                        <p className="text-xs font-semibold">{payload[0].payload.date}</p>
                                                        <p className="text-xs text-emerald-500 font-bold">₹{payload[0].value} Cr</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right Column - Activity & Actions (1/3 width) */}
                    <div className="space-y-6">
                        {/* Asset Distribution */}
                        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
                            <h3 className="text-sm font-bold text-foreground mb-4">Asset Distribution</h3>
                            <div className="space-y-3">
                                {quickStats.map((stat, idx) => (
                                    <div key={idx}>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-foreground">{stat.label}</span>
                                            <span className="text-xs font-bold text-foreground">{stat.value}</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className={`h-full ${stat.color}`} style={{ width: stat.value }}></div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{stat.amount}</p>
                                    </div>
                                ))}
                            </div>
                        </div>



                        {/* Recent Activity */}
                        <div className="bg-card rounded-xl border border-border shadow-sm p-5">
                            <h3 className="text-sm font-bold text-foreground mb-4">Recent Activity</h3>
                            <div className="space-y-3">
                                {recentActivity.map((activity, idx) => (
                                    <div key={idx} className="flex items-start justify-between pb-3 border-b border-border last:border-0 last:pb-0">
                                        <div className="flex-1">
                                            <p className="text-xs font-semibold text-foreground">{activity.client}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">{activity.action}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                                        </div>
                                        <p className={`text-xs font-bold ${activity.amount.startsWith("+") ? "text-emerald-500" : "text-red-500"}`}>
                                            {activity.amount}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
