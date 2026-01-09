import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useAllocations } from "@/hooks/use-portfolio";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

export function AllocationChart() {
  const { data: allocations, isLoading } = useAllocations();

  if (isLoading) {
    return <Skeleton className="h-[350px] w-full rounded-2xl bg-card/50" />;
  }

  if (!allocations) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 rounded-2xl h-full flex flex-col"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-display font-bold">Asset Allocation</h3>
          <p className="text-sm text-muted-foreground">Distribution across classes</p>
        </div>
        <button className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
          View Detail
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row items-center gap-8 min-h-[250px]">
        <div className="w-full md:w-1/2 h-[250px] relative">
           <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocations}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="percentage"
                stroke="none"
              >
                {allocations.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color} 
                    className="stroke-card stroke-2"
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))', 
                  borderRadius: '12px',
                  color: 'hsl(var(--foreground))',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`${value}%`, 'Allocation']}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Total Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold font-display">100%</span>
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
        </div>

        <div className="w-full md:w-1/2 space-y-4">
          {allocations.map((item) => (
            <div key={item.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" 
                  style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }} 
                />
                <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                  {item.label}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono">{item.percentage}%</div>
                <div className="text-xs text-muted-foreground">{item.amount}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
