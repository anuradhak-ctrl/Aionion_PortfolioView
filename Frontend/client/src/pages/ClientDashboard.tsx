import { DashboardStats } from "@/components/DashboardStats";
import { AllocationChart } from "@/components/AllocationChart";
import { AlertsPanel } from "@/components/AlertsPanel";
import { TopPerformers } from "@/components/TopPerformers";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/DashboardLayout";

export default function ClientDashboard() {
    return (
        <DashboardLayout role="client">
            <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
                {/* Greeting */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                            Hello, <span className="text-gradient-primary">Rajesh</span>
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
