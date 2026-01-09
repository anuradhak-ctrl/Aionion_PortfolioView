import { ArrowUpRight, ArrowDownRight, TrendingUp, Wallet, BarChart3, Percent } from "lucide-react";
import { usePortfolioStats } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const iconMap: Record<string, any> = {
  "wallet": Wallet,
  "trending-up": TrendingUp,
  "bar-chart-3": BarChart3,
  "percent": Percent,
};

export function DashboardStats() {
  const { data: stats, isLoading } = usePortfolioStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 rounded-2xl bg-card/50" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats?.map((stat, index) => {
        const Icon = iconMap[stat.icon] || Wallet;
        const isPositive = stat.change?.startsWith("+");
        
        return (
          <motion.div 
            key={stat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-colors duration-300"
          >
            {/* Subtle background glow effect */}
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="p-3 bg-secondary rounded-xl border border-white/5">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              {stat.change && (
                <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                  {stat.change}
                </div>
              )}
            </div>

            <h3 className="text-muted-foreground text-sm font-medium mb-1">{stat.label}</h3>
            <div className="text-2xl font-display font-bold text-foreground mb-2 tracking-tight">{stat.value}</div>
            
            {stat.subValue && (
              <p className="text-xs text-muted-foreground border-t border-border pt-3 mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                {stat.subValue}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
