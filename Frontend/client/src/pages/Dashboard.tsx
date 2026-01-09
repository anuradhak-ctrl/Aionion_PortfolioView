import { useState } from "react";
import { DashboardStats } from "@/components/DashboardStats";
import { AllocationChart } from "@/components/AllocationChart";
import { AlertsPanel } from "@/components/AlertsPanel";
import { TopPerformers } from "@/components/TopPerformers";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Search, Bell, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Dashboard() {
  const [activeRole, setActiveRole] = useState("client");

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar Navigation */}
      <Sidebar activeRole={activeRole} />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-screen">

        {/* Header */}
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 h-20 flex items-center">
          <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* Search */}
            <div className="relative w-full md:w-96 pl-12 md:pl-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for stocks, funds, or news..."
                className="w-full bg-secondary/50 border border-border/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Right Actions */}
            <div className="flex items-center justify-end gap-4 md:gap-6">
              <div className="flex items-center gap-2 md:gap-4">

                {/* Role Switcher */}
                <div className="mr-2">
                  <Select value={activeRole} onValueChange={setActiveRole}>
                    <SelectTrigger className="w-[200px] bg-background text-foreground border border-input focus:ring-offset-0 focus:ring-1 focus:ring-ring">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-background text-foreground border-input">
                      <SelectItem value="client" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Client</SelectItem>
                      <SelectItem value="rm" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Relationship Manager</SelectItem>
                      <SelectItem value="bm" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Branch Manager</SelectItem>
                      <SelectItem value="zm" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Zonal Manager</SelectItem>
                      <SelectItem value="admin" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>



                <button className="relative p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-background" />
                </button>
                <ThemeToggle />
                <button className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground hidden sm:block">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {(activeRole === 'client' || activeRole === 'rm' || activeRole === 'bm' || activeRole === 'zm' || activeRole === 'admin') ? (
          <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">

            {/* Greeting */}
            {/* Greeting */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                  Good Morning, <span className="text-gradient-primary">Rajesh</span>
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">
                  Here's your portfolio summary for today. Market is <span className="text-emerald-400 font-medium">Bullish +1.2%</span>
                </p>
              </motion.div>

              {/* Export Button for RM, BM, ZM, and Admin */}
              {(activeRole === 'rm' || activeRole === 'bm' || activeRole === 'zm' || activeRole === 'admin') && (
                <button className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30">
                  <span className="text-lg font-bold">↓</span> Export
                </button>
              )}
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
        ) : (
          <div className="flex-1 p-6 md:p-8 flex items-center justify-center min-h-[500px]">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Settings className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h2 className="text-4xl font-bold">
                {activeRole === 'rm' && "Relationship Manager"}
                {activeRole === 'bm' && "Branch Manager"}
                {activeRole === 'zm' && "Zonal Manager"}
                {activeRole === 'admin' && "Super Admin"}
                <span className="block text-gradient-primary mt-2">Dashboard</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-md mx-auto">
                This personalized dashboard view is currently under development and will be available soon.
              </p>
              <div className="flex justify-center gap-4 pt-4">
                <div className="px-4 py-2 bg-secondary rounded-lg text-sm font-mono text-muted-foreground">
                  Role: {activeRole.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
