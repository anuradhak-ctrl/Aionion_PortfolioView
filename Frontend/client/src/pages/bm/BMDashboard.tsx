import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Users, Activity, Award, ArrowUpRight, ArrowDownRight, MoreHorizontal, Filter } from "lucide-react";

// --- Mock Data ---
const bmSummary = {
    totalRMs: 8,
    totalClients: 42,
    branchAUM: 18.65,
    branchGrowth: 12.4,
    targetAchievement: 93,
    topPerformerName: "Amit Singh",
};

const rmLeaderboard = [
    { id: "RM001", name: "Amit Singh", clients: 8, aum: 4.25, xirr: 18.2, target: 112, trend: "up", recentAction: "High Value Acquisition" },
    { id: "RM003", name: "Rahul Verma", clients: 7, aum: 3.85, xirr: 16.5, target: 98, trend: "up", recentAction: "Portfolio Rebalancing" },
    { id: "RM002", name: "Neha Patel", clients: 6, aum: 3.42, xirr: 15.8, target: 95, trend: "up", recentAction: "New Client Onboarding" },
    { id: "RM005", name: "Kiran Desai", clients: 6, aum: 2.95, xirr: 14.2, target: 88, trend: "stable", recentAction: "SIP Renewal" },
    { id: "RM004", name: "Pooja Sharma", clients: 5, aum: 2.18, xirr: 13.5, target: 82, trend: "up", recentAction: "Client Meeting" },
    { id: "RM007", name: "Priya Nair", clients: 4, aum: 1.52, xirr: 12.8, target: 76, trend: "down", recentAction: "Churn Prevention" },
    { id: "RM006", name: "Ravi Kumar", clients: 4, aum: 1.28, xirr: 11.2, target: 68, trend: "stable", recentAction: "Pending Follow-up" },
    { id: "RM008", name: "Suresh Patil", clients: 2, aum: 0.85, xirr: 10.5, target: 58, trend: "down", recentAction: "Low Activity" },
];

const performanceComparison = [
    { month: "Sep", top3: 10.5, others: 7.2 },
    { month: "Oct", top3: 10.8, others: 7.5 },
    { month: "Nov", top3: 11.05, others: 7.8 },
    { month: "Dec", top3: 11.35, others: 8.1 },
    { month: "Jan", top3: 11.52, others: 8.45 },
];

const branchTargets = [
    { metric: "AUM", achieved: 18.65, target: 20, color: "#10b981" },
    { metric: "Clients", achieved: 42, target: 50, color: "#3b82f6" },
    { metric: "Revenue", achieved: 2.12, target: 2.5, color: "#8b5cf6" },
    { metric: "Retention", achieved: 98, target: 95, color: "#f59e0b" },
];

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { User, MessageSquare, ArrowRightLeft } from "lucide-react";

export default function BMDashboard() {
    const [timePeriod, setTimePeriod] = useState("5M");
    const { toast } = useToast();

    const handleAction = (action: string, rmName: string) => {
        toast({
            title: `${action} Initiated`,
            description: `You have selected to ${action.toLowerCase()} for ${rmName}.`,
        });
    };

    return (
        <DashboardLayout role="bm">
            <div className="max-w-[1600px] mx-auto w-full p-6">

                {/* Header Summary */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-card p-6 rounded-xl border border-border flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total RMs</p>
                                <h3 className="text-3xl font-bold text-foreground mt-1">{bmSummary.totalRMs}</h3>
                            </div>
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                <ArrowUpRight className="w-3 h-3 mr-1" /> {bmSummary.branchGrowth}%
                            </span>
                            <span className="text-xs text-muted-foreground">vs last month</span>
                        </div>
                    </div>

                    <div className="bg-card p-6 rounded-xl border border-border flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Clients</p>
                                <h3 className="text-3xl font-bold text-foreground mt-1">{bmSummary.totalClients}</h3>
                            </div>
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600">
                                <Users className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                                <ArrowUpRight className="w-3 h-3 mr-1" /> +5
                            </span>
                            <span className="text-xs text-muted-foreground">new this month</span>
                        </div>
                    </div>

                    <div className="bg-card p-6 rounded-xl border border-border flex flex-col justify-between shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Avg Achievement</p>
                                <h3 className="text-3xl font-bold text-foreground mt-1">{bmSummary.targetAchievement}%</h3>
                            </div>
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600">
                                <Activity className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500" style={{ width: `${bmSummary.targetAchievement}%` }} />
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-xl text-white shadow-lg flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <p className="text-indigo-100 text-sm font-medium">Top Performer</p>
                                <h3 className="text-2xl font-bold mt-1">{bmSummary.topPerformerName}</h3>
                            </div>
                            <Award className="w-6 h-6 text-yellow-300" />
                        </div>
                        <div>
                            <p className="text-indigo-100 text-xs text-right mt-4">112% Target Achieved</p>
                        </div>
                    </div>
                </div>

                {/* Main Content: Table & Charts */}
                <div className="space-y-8">

                    {/* Full Width: Professional Detail Table */}
                    <div>
                        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-border flex flex-wrap gap-4 justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">RM Performance Report</h2>
                                    <p className="text-sm text-muted-foreground">Comprehensive team metrics and rankings</p>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors">
                                        <Filter className="w-3.5 h-3.5" /> Filter
                                    </button>
                                    <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors">
                                        Export CSV
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-muted/40 border-b border-border text-left">
                                            <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[50px]">Rank</th>
                                            <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">RM Name</th>
                                            <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">AUM (Cr)</th>
                                            <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Target %</th>
                                            <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">Trend</th>
                                            <th className="py-4 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</th>
                                            <th className="py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {rmLeaderboard.map((rm, idx) => (
                                            <tr key={rm.id} className="hover:bg-muted/30 transition-colors group">
                                                <td className="py-4 px-6 text-sm font-medium text-muted-foreground">
                                                    #{idx + 1}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3 ? "bg-indigo-100 text-indigo-700" : "bg-muted text-muted-foreground"
                                                            }`}>
                                                            {rm.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold text-foreground">{rm.name}</p>
                                                            <p className="text-xs text-muted-foreground">{rm.clients} Clients</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <p className="text-sm font-bold text-foreground">₹{rm.aum}</p>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex flex-col items-end gap-1">
                                                        <span className={`text-xs font-bold ${rm.target >= 100 ? "text-emerald-600" :
                                                            rm.target >= 80 ? "text-amber-600" : "text-red-600"
                                                            }`}>{rm.target}%</span>
                                                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${rm.target >= 100 ? "bg-emerald-500" :
                                                                    rm.target >= 80 ? "bg-amber-500" : "bg-red-500"
                                                                    }`}
                                                                style={{ width: `${Math.min(rm.target, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    {rm.trend === 'up' && <ArrowUpRight className="w-4 h-4 text-emerald-500 mx-auto" />}
                                                    {rm.trend === 'down' && <ArrowDownRight className="w-4 h-4 text-red-500 mx-auto" />}
                                                    {rm.trend === 'stable' && <Activity className="w-4 h-4 text-muted-foreground mx-auto" />}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                                                        {rm.recentAction}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground outline-none focus:ring-2 focus:ring-primary/20">
                                                                <MoreHorizontal className="w-4 h-4" />
                                                            </button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => handleAction('View Profile', rm.name)}>
                                                                <User className="w-4 h-4 mr-2" /> View Profile
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleAction('Send Message', rm.name)}>
                                                                <MessageSquare className="w-4 h-4 mr-2" /> Send Message
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleAction('Reassign Clients', rm.name)}>
                                                                <ArrowRightLeft className="w-4 h-4 mr-2" /> Reassign Clients
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Analytics Charts (2 cols) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Branch Targets Chart */}
                        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-6">Key Performance Indicators</h3>
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={branchTargets} layout="vertical" margin={{ left: -20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="metric" type="category" tick={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 500 }} width={80} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: "transparent" }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-popover border border-border rounded-lg p-2 shadow-xl">
                                                        <p className="text-xs font-semibold mb-1">{data.metric}</p>
                                                        <p className="text-sm font-bold">Achieved: {data.achieved}</p>
                                                        <p className="text-xs text-muted-foreground">Target: {data.target}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="achieved" barSize={20} radius={[0, 4, 4, 0]}>
                                        {branchTargets.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Top 3 vs Others Trend */}
                        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Growth Trend</h3>
                                <select
                                    className="text-xs bg-muted border-none rounded-md px-2 py-1 focus:ring-1 focus:ring-primary"
                                    value={timePeriod}
                                    onChange={(e) => setTimePeriod(e.target.value)}
                                >
                                    <option value="5M">Last 5 Months</option>
                                    <option value="1Y">Last Year</option>
                                </select>
                            </div>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={performanceComparison}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                            itemStyle={{ fontSize: "12px" }}
                                        />
                                        <Line type="monotone" dataKey="top3" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
                                        <Line type="monotone" dataKey="others" stroke="#94a3b8" strokeWidth={2.5} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex gap-4 justify-center mt-4">
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                                    <span className="text-muted-foreground">Top Performers</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                                    <span className="text-muted-foreground">Others</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </DashboardLayout>
    );
}
