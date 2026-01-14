import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Map, Globe, TrendingUp, Building2, Users, AlertOctagon, ArrowUpRight, ArrowDownRight } from "lucide-react";

// --- Mock Data ---
const zmSummary = {
    totalBranches: 12,
    totalBms: 12,
    totalRMs: 45,
    zoneAUM: 245.8,
    zoneGrowth: 15.2,
    topBranch: "Mumbai Central",
    criticalAlerts: 2,
};

const branchPerformance = [
    { name: "Mumbai Central", aum: 45.2, target: 40, status: "excellent", managers: 4 },
    { name: "Mumbai South", aum: 38.5, target: 35, status: "good", managers: 3 },
    { name: "Pune", aum: 32.8, target: 30, status: "good", managers: 3 },
    { name: "Nashik", aum: 28.5, target: 30, status: "warning", managers: 2 },
    { name: "Nagpur", aum: 25.2, target: 28, status: "critical", managers: 2 },
    { name: "Aurangabad", aum: 22.1, target: 20, status: "good", managers: 2 },
];

const zoneTrends = [
    { month: "Aug", revenue: 180, growth: 12 },
    { month: "Sep", revenue: 195, growth: 14 },
    { month: "Oct", revenue: 210, growth: 13 },
    { month: "Nov", revenue: 225, growth: 15 },
    { month: "Dec", revenue: 238, growth: 16 },
    { month: "Jan", revenue: 245.8, growth: 15.2 },
];

const categoryRadar = [
    { subject: 'Equity', A: 120, fullMark: 150 },
    { subject: 'MF', A: 98, fullMark: 150 },
    { subject: 'Bonds', A: 86, fullMark: 150 },
    { subject: 'Insurance', A: 99, fullMark: 150 },
    { subject: 'PMS', A: 85, fullMark: 150 },
    { subject: 'Loans', A: 65, fullMark: 150 },
];

export default function ZMDashboard() {
    const [selectedMetric, setSelectedMetric] = useState("aum");

    return (
        <DashboardLayout role="zm">
            <div className="max-w-[1920px] mx-auto w-full p-8 bg-muted/10 min-h-screen">
                {/* Zonal Header */}
                <div className="flex items-end justify-between mb-8 pb-6 border-b border-border">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                            <Globe className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-display font-bold text-foreground">West Zone Overview</h1>
                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                <Map className="w-4 h-4" /> Maharashtra & Goa Region
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">

                        <div className="text-right px-6">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">YoY Growth</p>
                            <p className="text-3xl font-bold text-emerald-600">+{zmSummary.zoneGrowth}%</p>
                        </div>
                    </div>
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-12 gap-8">

                    {/* Left Col - Stats & Alerts (3 cols) */}
                    <div className="col-span-12 lg:col-span-3 space-y-6">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600"><Building2 className="w-5 h-5" /></div>
                                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                </div>
                                <p className="text-2xl font-bold">{zmSummary.totalBranches}</p>
                                <p className="text-xs text-muted-foreground">Active Branches</p>
                            </div>
                            <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600"><Users className="w-5 h-5" /></div>
                                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                </div>
                                <p className="text-2xl font-bold">{zmSummary.totalRMs}</p>
                                <p className="text-xs text-muted-foreground">Total RMs</p>
                            </div>
                        </div>

                        {/* Critical Alerts */}
                        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4 text-red-600">
                                <AlertOctagon className="w-5 h-5" />
                                <h3 className="font-bold">Zone Alerts</h3>
                            </div>
                            <div className="space-y-3">
                                <div className="p-3 bg-background rounded-lg border border-red-100 shadow-sm flex items-start gap-3">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-red-500 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Nagpur Branch</p>
                                        <p className="text-xs text-muted-foreground">15% below quarterly target</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-background rounded-lg border border-orange-100 shadow-sm flex items-start gap-3">
                                    <div className="w-2 h-2 mt-2 rounded-full bg-orange-500 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">Compliance Review</p>
                                        <p className="text-xs text-muted-foreground">Nashik branch audit pending</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Mix Radar */}
                        <div className="bg-card rounded-xl border border-border shadow-sm p-4">
                            <h3 className="text-sm font-semibold mb-4 text-center">Product Mix</h3>
                            <div className="h-[200px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={categoryRadar}>
                                        <PolarGrid stroke="hsl(var(--border))" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                                        <Radar name="Mix" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Middle Col - Map/Performance (6 cols) */}
                    <div className="col-span-12 lg:col-span-6 space-y-6">
                        {/* Interactive Zone Map Visualization (Abstract) */}
                        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 min-h-[400px]">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-lg">Branch Performance Map</h3>
                                <div className="flex gap-2">
                                    <span className="flex items-center gap-1 text-xs"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Excellent</span>
                                    <span className="flex items-center gap-1 text-xs"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Warning</span>
                                    <span className="flex items-center gap-1 text-xs"><div className="w-2 h-2 bg-red-500 rounded-full"></div> Critical</span>
                                </div>
                            </div>

                            {/* Branch Cards View */}
                            <div className="grid grid-cols-2 gap-4">
                                {branchPerformance.map((branch, idx) => (
                                    <div key={idx} className="group relative p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-md transition-all bg-background">
                                        <div className={`absolute top-0 right-0 w-16 h-16 rounded-bl-full opacity-10 ${branch.status === 'excellent' ? 'bg-emerald-500' :
                                            branch.status === 'critical' ? 'bg-red-500' :
                                                branch.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`} />

                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-foreground">{branch.name}</h4>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${branch.status === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
                                                branch.status === 'critical' ? 'bg-red-100 text-red-700' :
                                                    branch.status === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {branch.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">AUM</span>
                                                <span className="font-bold">₹{branch.aum} Cr</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Managers</span>
                                                <span className="font-medium">{branch.managers}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mt-2">
                                                <div
                                                    className={`h-full ${branch.status === 'excellent' ? 'bg-emerald-500' :
                                                        branch.status === 'critical' ? 'bg-red-500' :
                                                            branch.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                                                        }`}
                                                    style={{ width: `${(branch.aum / branch.target) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Col - Trends (3 cols) */}
                    <div className="col-span-12 lg:col-span-3 space-y-6">
                        <div className="bg-card rounded-2xl border border-border shadow-sm p-6 h-full">
                            <h3 className="font-bold text-lg mb-4">Growth Analysis</h3>
                            <div className="h-[250px] w-full mb-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={zoneTrends}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                                            itemStyle={{ color: "hsl(var(--foreground))" }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRevenue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-sm">Top Performing Branches</h4>
                                {[1, 2, 3].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                                            {i + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{branchPerformance[i].name}</p>
                                            <p className="text-xs text-muted-foreground">₹{branchPerformance[i].aum} Cr</p>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
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
