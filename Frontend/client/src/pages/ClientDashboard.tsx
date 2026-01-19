import { DashboardStats } from "@/components/DashboardStats";
import { AllocationChart } from "@/components/AllocationChart";
import { AlertsPanel } from "@/components/AlertsPanel";
import { TopPerformers } from "@/components/TopPerformers";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

import { usePortfolioStats } from "@/hooks/use-portfolio";
import { AlertTriangle } from "lucide-react";

export default function ClientDashboard() {
    const { user } = useAuth();
    const { error, isLoading } = usePortfolioStats();

    // Show loading spinner during initial data fetch
    if (isLoading) {
        return (
            <DashboardLayout role="client">
                <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="text-muted-foreground">Loading your portfolio...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout role="client">
            <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
                {/* Error Banner - Only show if there's an error after loading */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <div>
                            <p className="font-semibold">Live Data Unavailable</p>
                            <p className="text-sm opacity-90">Failed to fetch latest portfolio data. Showing zero values or cached data.</p>
                        </div>
                    </div>
                )}

                {/* Greeting */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                            Hello, <span className="text-gradient-primary">{user?.username || user?.name || "Client"}</span>
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Client view.
                        </p>
                    </motion.div>
                </div>

                {/* Key Stats Row */}
                <DashboardStats />

                {/* Middle Section: Charts & Alerts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[400px]">
                        <AllocationChart />
                    </div>
                    <div className="lg:col-span-1 h-[400px]">
                        <AlertsPanel />
                    </div>
                </div>

                {/* Bottom Section: Table */}
                <TopPerformers />

                {/* Footer */}
                <footer className="pt-8 pb-4 text-center text-sm text-muted-foreground border-t border-border/30 mt-8">
                    <p>© 2025 Portfolio View. All rights reserved.</p>
                </footer>
            </div>
        </DashboardLayout>
    );
}
