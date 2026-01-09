// Mock data types (simplified from schema)
export interface PortfolioStat {
  id: number;
  label: string;
  value: string;
  subValue?: string | null;
  change?: string | null;
  icon: string;
}

export interface Allocation {
  id: number;
  label: string;
  percentage: number;
  amount: string;
  color: string;
}

export interface Alert {
  id: number;
  title: string;
  description: string;
  type: string;
  date?: string | null;
}

export interface TopPerformer {
  id: number;
  security: string;
  company: string;
  value: string;
  gain: string;
  returnPercent: string;
  isPositive?: boolean | null;
}

// Mock data
export const mockPortfolioStats: PortfolioStat[] = [
  { id: 1, label: "Total Portfolio Value", value: "₹42.85 L", subValue: "Invested: ₹36.50 L", icon: "wallet" },
  { id: 2, label: "Total Returns", value: "₹6.35 L", change: "+17.40%", icon: "trending-up" },
  { id: 3, label: "Today's Change", value: "₹12,500", change: "+0.29%", icon: "bar-chart" },
  { id: 4, label: "XIRR", value: "18.5%", subValue: "Annualized Return", icon: "percent" },
];

export const mockAllocations: Allocation[] = [
  { id: 1, label: "Equity", percentage: 50, amount: "₹21.43 L", color: "#14b8a6" },
  { id: 2, label: "Mutual Funds", percentage: 30, amount: "₹12.86 L", color: "#f97316" },
  { id: 3, label: "Bonds", percentage: 20, amount: "₹8.57 L", color: "#8b5cf6" },
];

export const mockAlerts: Alert[] = [
  { id: 1, title: "Bond Maturity Alert", description: "HDFC Ltd bond matures in 180 days", type: "warning" },
  { id: 2, title: "Rebalancing Suggested", description: "Equity allocation exceeds target by 5%", type: "info" },
  { id: 3, title: "Upcoming Dividend", description: "TCS dividend of Rs.28/share on Jan 15", type: "success" },
];

export const mockTopPerformers: TopPerformer[] = [
  { id: 1, security: "RELIANCE", company: "Reliance Industries", value: "₹2.68 L", gain: "₹23,000", returnPercent: "9.39%", isPositive: true },
  { id: 2, security: "HDFCBANK", company: "HDFC Bank", value: "₹2.58 L", gain: "₹21,000", returnPercent: "8.86%", isPositive: true },
  { id: 3, security: "INFY", company: "Infosys", value: "₹3.16 L", gain: "₹26,000", returnPercent: "8.97%", isPositive: true },
  { id: 4, security: "TCS", company: "TCS", value: "₹2.76 L", gain: "₹20,000", returnPercent: "7.81%", isPositive: true },
  { id: 5, security: "ICICIBANK", company: "ICICI Bank", value: "₹2.63 L", gain: "₹32,500", returnPercent: "14.13%", isPositive: true },
];
