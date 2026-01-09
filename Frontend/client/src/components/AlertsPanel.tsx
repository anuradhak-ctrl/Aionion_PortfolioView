import { useAlerts } from "@/hooks/use-portfolio";
import { AlertCircle, Calendar, Info, Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function AlertsPanel() {
  const { data: alerts, isLoading } = useAlerts();

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full rounded-2xl bg-card/50" />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1 }}
      className="glass-card p-6 rounded-2xl h-full flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-accent/10 rounded-lg">
             <Bell className="w-4 h-4 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold">Recent Alerts</h3>
            <p className="text-sm text-muted-foreground">Portfolio notifications</p>
          </div>
        </div>
        <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-md border border-primary/20">
          {alerts?.length || 0} New
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {alerts?.map((alert) => (
          <div 
            key={alert.id}
            className={`
              p-4 rounded-xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg
              ${alert.type === 'warning' 
                ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30' 
                : 'bg-secondary/50 border-white/5 hover:border-white/10'
              }
            `}
          >
            <div className="flex gap-3 items-start">
              <div className={`mt-0.5 ${alert.type === 'warning' ? 'text-amber-500' : 'text-blue-400'}`}>
                {alert.type === 'warning' ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
              </div>
              <div className="flex-1 space-y-1">
                <h4 className="text-sm font-semibold text-foreground leading-tight">
                  {alert.title}
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {alert.description}
                </p>
                {alert.date && (
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground/70 uppercase tracking-wider font-medium">
                    <Calendar className="w-3 h-3" />
                    {alert.date}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {(!alerts || alerts.length === 0) && (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm">
            <Bell className="w-8 h-8 mb-2 opacity-20" />
            No new alerts
          </div>
        )}
      </div>
    </motion.div>
  );
}
