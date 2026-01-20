import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, ArrowRight, Eye, Activity, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import userService, { Client } from "@/services/userService";
import { getPortfolioData } from "@/services/portfolioService";

export default function RMDashboard() {
    const [, setLocation] = useLocation();
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedView, setSelectedView] = useState<"all" | "active" | "inactive">("all");

    // Fetch clients on mount
    useEffect(() => {
        setLoading(true);
        userService.getClients()
            .then(data => {
                setClients(data);
            })
            .catch(err => console.error("Failed to fetch clients:", err))
            .finally(() => setLoading(false));
    }, []);

    // Calculate summary statistics
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'active').length;

    // Filter clients based on selected view
    const filteredClients = selectedView === "all"
        ? clients
        : clients.filter(c => selectedView === "active" ? c.status === 'active' : c.status !== 'active');

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
                                <p className="text-xl font-bold text-emerald-500">{activeClients}/{totalClients}</p>
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
                            <p className="text-3xl font-bold">{loading ? "..." : totalClients}</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <DollarSign className="w-8 h-8 opacity-80" />
                                <TrendingUp className="w-5 h-5" />
                            </div>
                            <p className="text-sm opacity-90 mb-1">Total Clients</p>
                            <p className="text-3xl font-bold">{loading ? "..." : totalClients}</p>
                            <p className="text-xs opacity-75 mt-1">Active portfolio monitoring</p>
                        </div>
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <Activity className="w-8 h-8 opacity-80" />
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Live</span>
                            </div>
                            <p className="text-sm opacity-90 mb-1">Active Clients</p>
                            <p className="text-3xl font-bold">{loading ? "..." : activeClients}</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-3">
                                <Clock className="w-8 h-8 opacity-80" />
                                <span className="text-xs bg-white/20 px-2 py-0.5 rounded">Status</span>
                            </div>
                            <p className="text-sm opacity-90 mb-1">Pending Reviews</p>
                            <p className="text-3xl font-bold">-</p>
                            <p className="text-xs opacity-75 mt-1">Requires attention</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6">
                    {/* Client Portfolio List */}
                    <div className="bg-card rounded-xl border border-border shadow-sm">
                        <div className="p-5 border-b border-border flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-foreground">Client Portfolios</h2>
                                <p className="text-xs text-muted-foreground mt-0.5">Manage and monitor your clients</p>
                            </div>
                            <div className="flex gap-2">
                                {["all", "active", "inactive"].map((view) => (
                                    <button
                                        key={view}
                                        onClick={() => setSelectedView(view as any)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${selectedView === view
                                            ? "bg-primary text-white"
                                            : "bg-muted text-muted-foreground hover:bg-muted/70"
                                            }`}
                                    >
                                        {view}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center items-center p-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {filteredClients.length === 0 ? (
                                    <div className="p-12 text-center text-muted-foreground">
                                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No clients found</p>
                                    </div>
                                ) : (
                                    filteredClients.map((client) => (
                                        <div key={client.id} className="p-4 hover:bg-muted/30 transition-colors cursor-pointer group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                                                        <span className="text-lg font-bold text-primary">{client.name?.charAt(0) || "?"}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-sm font-bold text-foreground">{client.name || "Unnamed Client"}</h3>
                                                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${client.status === 'active' ? "bg-emerald-500/10 text-emerald-500" : "bg-gray-500/10 text-gray-500"
                                                                }`}>
                                                                {client.status || 'Unknown'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <span>Client ID: {client.client_id || client.id}</span>
                                                            <span>•</span>
                                                            <span>Email: {client.email || "N/A"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => setLocation(`/rm/holdings?clientCode=${client.client_id || client.id}`)}
                                                        className="p-2 rounded-lg bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
