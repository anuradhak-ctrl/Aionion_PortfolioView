import { useTopPerformers } from "@/hooks/use-portfolio";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function TopPerformers() {
  const { data: performers, isLoading } = useTopPerformers();

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full rounded-2xl bg-card/50" />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-2xl overflow-hidden"
    >
      <div className="p-6 border-b border-border/50 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-display font-bold">Top Performers</h3>
          <p className="text-sm text-muted-foreground">Best performing assets this month</p>
        </div>
        <button className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors">
          View All <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/30 text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-6 py-4 font-semibold">Security</th>
              <th className="px-6 py-4 font-semibold text-right">Value</th>
              <th className="px-6 py-4 font-semibold text-right">Gain</th>
              <th className="px-6 py-4 font-semibold text-right">Return</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {performers?.map((item) => (
              <tr 
                key={item.id} 
                className="group hover:bg-white/5 transition-colors duration-150"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground border border-white/5 group-hover:border-primary/30 group-hover:text-primary transition-all">
                      {item.security.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.security}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.company}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="font-medium font-mono text-foreground/90">{item.value}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className={`font-medium ${item.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.gain}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className={`
                    inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border
                    ${item.isPositive 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}
                  `}>
                    {item.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {item.returnPercent}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
