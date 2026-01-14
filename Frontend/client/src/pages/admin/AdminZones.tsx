import { DashboardLayout } from "@/components/DashboardLayout";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { Globe, Building2, Users, TrendingUp, ArrowUpRight, ArrowDownRight, MapPin, Filter, Download as DownloadIcon } from "lucide-react";

// Mock Data
const zonesData = [
    {
        id: 1,
        name: "West Zone",
        region: "Maharashtra & Goa",
        branches: 12,
        managers: 45,
        clients: 350,
        aum: 445.2,
        target: 112,
        trend: 'up',
        growth: 15.2,
        topBranch: "Mumbai Central"
    },
    {
        id: 2,
        name: "North Zone",
        region: "Delhi NCR & Punjab",
        branches: 15,
        managers: 52,
        clients: 420,
        aum: 338.5,
        target: 98,
        trend: 'up',
        growth: 12.8,
        topBranch: "Delhi Central"
    },
    {
        id: 3,
        name: "South Zone",
        region: "Karnataka & Tamil Nadu",
        branches: 10,
        managers: 38,
        clients: 290,
        aum: 312.8,
        target: 95,
        trend: 'up',
        growth: 14.5,
        topBranch: "Bangalore MG Road"
    },
    {
        id: 4,
        name: "East Zone",
        region: "West Bengal & Odisha",
        branches: 11,
        managers: 35,
        clients: 190,
        aum: 149.3,
        target: 82,
        trend: 'stable',
        growth: 8.2,
        topBranch: "Kolkata Park Street"
    },
];

const zoneDistribution = [
    { name: "West", value: 445.2, color: "#4f46e5" },
    { name: "North", value: 338.5, color: "#10b981" },
    { name: "South", value: 312.8, color: "#f59e0b" },
    { name: "East", value: 149.3, color: "#ef4444" },
];

const performanceMetrics = [
    { metric: "Total Zones", value: 4, color: "#4f46e5" },
    { metric: "Total Branches", value: 48, color: "#10b981" },
    { metric: "Total Managers", value: 170, color: "#f59e0b" },
    { metric: "Total Clients", value: 1250, color: "#ef4444" },
];

export default function AdminZones() {
    const [selectedZone, setSelectedZone] = useState<number | null>(null);

    const selectedZoneData = zonesData.find(z => z.id === selectedZone);
    const totalAUM = zonesData.reduce((sum, z) => sum + z.aum, 0);
    const totalBranches = zonesData.reduce((sum, z) => sum + z.branches, 0);
    const totalManagers = zonesData.reduce((sum, z) => sum + z.managers, 0);
    const totalClients = zonesData.reduce((sum, z) => sum + z.clients, 0);

    return (
        <DashboardLayout role="admin">
            <div className="max-w-[1920px] mx-auto w-full p-8 bg-muted/10 min-h-screen">
                {/* Header */}
                <div className="flex items-end justify-between mb-8 pb-6 border-b border-border">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/20">
                            <Globe className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-display font-bold text-foreground">Zone Management</h1>
                            <p className="text-muted-foreground flex items-center gap-2 mt-1">
                                <MapPin className="w-4 h-4" /> National Operations Overview
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-muted hover:bg-muted/80 rounded-lg border border-border transition-colors">
                            <Filter className="w-4 h-4" /> Filter
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-500/20 transition-colors">
                            <DownloadIcon className="w-4 h-4" /> Export Report
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600"><Globe className="w-5 h-5" /></div>
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-bold">{zonesData.length}</p>
                        <p className="text-xs text-muted-foreground">Active Zones</p>
                    </div>

                    <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600"><Building2 className="w-5 h-5" /></div>
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-bold">{totalBranches}</p>
                        <p className="text-xs text-muted-foreground">Total Branches</p>
                    </div>

                    <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600"><Users className="w-5 h-5" /></div>
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-bold">{totalManagers}</p>
                        <p className="text-xs text-muted-foreground">Total Managers</p>
                    </div>

                    <div className="bg-card p-5 rounded-xl border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-600"><TrendingUp className="w-5 h-5" /></div>
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-bold">₹{totalAUM.toFixed(1)} Cr</p>
                        <p className="text-xs text-muted-foreground">Total AUM</p>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Zone Cards */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold text-foreground mb-4">All Zones</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {zonesData.map((zone) => (
                                <div
                                    key={zone.id}
                                    onClick={() => setSelectedZone(zone.id === selectedZone ? null : zone.id)}
                                    className={`bg-card p-6 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${selectedZone === zone.id ? 'border-primary shadow-lg' : 'border-border'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-foreground">{zone.name}</h3>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3" /> {zone.region}
                                            </p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${zone.target >= 100 ? 'bg-emerald-100 text-emerald-700' :
                                                zone.target >= 90 ? 'bg-blue-100 text-blue-700' :
                                                    'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {zone.target}% Target
                                        </span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">AUM</span>
                                            <span className="font-bold text-foreground">₹{zone.aum} Cr</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Branches</span>
                                            <span className="font-medium">{zone.branches}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Managers</span>
                                            <span className="font-medium">{zone.managers}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Clients</span>
                                            <span className="font-medium">{zone.clients}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">YoY Growth</span>
                                            <span className="font-bold text-emerald-600 flex items-center gap-1">
                                                <ArrowUpRight className="w-3 h-3" /> {zone.growth}%
                                            </span>
                                        </div>
                                    </div>

                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-4">
                                        <div
                                            className={`h-full ${zone.target >= 100 ? 'bg-emerald-500' :
                                                    zone.target >= 90 ? 'bg-blue-500' :
                                                        'bg-yellow-500'
                                                }`}
                                            style={{ width: `${Math.min(zone.target, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Analytics */}
                    <div className="space-y-6">
                        {/* AUM Distribution */}
                        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-6">AUM Distribution</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <PieChart>
                                    <Pie
                                        data={zoneDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {zoneDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-popover border border-border rounded-lg p-2 shadow-xl">
                                                        <p className="text-xs font-semibold">{payload[0].name}</p>
                                                        <p className="text-sm font-bold">₹{payload[0].value} Cr</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {zoneDistribution.map((zone) => (
                                    <div key={zone.name} className="flex items-center gap-2 text-xs">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: zone.color }} />
                                        <span className="text-muted-foreground">{zone.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-6">Key Metrics</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={performanceMetrics} layout="horizontal">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="hsl(var(--border))" />
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="metric" type="category" tick={{ fill: "hsl(var(--foreground))", fontSize: 10 }} width={80} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        cursor={{ fill: "transparent" }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="bg-popover border border-border rounded-lg p-2 shadow-xl">
                                                        <p className="text-xs font-semibold">{payload[0].payload.metric}</p>
                                                        <p className="text-sm font-bold">{payload[0].value}</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]}>
                                        {performanceMetrics.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Selected Zone Details */}
                        {selectedZoneData && (
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 rounded-xl border border-indigo-200 dark:border-indigo-800 shadow-sm p-6">
                                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Selected Zone</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-2xl font-bold text-foreground">{selectedZoneData.name}</p>
                                        <p className="text-xs text-muted-foreground">{selectedZoneData.region}</p>
                                    </div>
                                    <div className="pt-3 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground mb-1">Top Performing Branch</p>
                                        <p className="text-sm font-semibold text-foreground">{selectedZoneData.topBranch}</p>
                                    </div>
                                    <div className="pt-3 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground mb-1">Growth Rate</p>
                                        <p className="text-lg font-bold text-emerald-600">+{selectedZoneData.growth}%</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
