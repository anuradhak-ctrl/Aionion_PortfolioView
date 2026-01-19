import { useClientData } from "@/contexts/ClientDataContext";
import {
  mockAlerts,
  type PortfolioStat,
  type Allocation,
  type TopPerformer
} from "@/lib/mockData";
import { useMemo } from "react";

// --- Helpers ---
const parseValue = (val: string | number | undefined): number => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseFloat(val.toString().replace(/[₹,]/g, ''));
};

const formatCurrency = (val: number): string => {
  if (Math.abs(val) >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (Math.abs(val) >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const COLORS = ["#14b8a6", "#f97316", "#8b5cf6", "#3b82f6", "#ec4899"];

// Default/Zero stats state
const ZERO_STATS: PortfolioStat[] = [
  { id: 1, label: "Total Portfolio Value", value: "₹0", subValue: "Invested: ₹0", icon: "wallet" },
  { id: 2, label: "Total Returns", value: "₹0", change: "0.00%", icon: "trending-up" },
  { id: 3, label: "Today's Change", value: "₹0", change: "0.00%", icon: "bar-chart-3" },
  { id: 4, label: "Overall Return", value: "0.00%", subValue: "Simple Annualized", icon: "percent" }
];

export function usePortfolioStats() {
  const { data, isLoading } = useClientData();
  const holdings = data.holdings || [];

  const stats = useMemo(() => {
    if (holdings.length === 0) return ZERO_STATS;

    let totalCurrentValue = 0;
    let totalInvestedValue = 0;
    let totalDaysChange = 0;

    holdings.forEach((item: any) => {
      const qty = parseValue(item.qty || item.quantity);
      const cmp = parseValue(item.cmp || item.lastPrice);
      const avgPrice = parseValue(item.avgPrice || item.averagePrice);
      const prevClose = parseValue(item.prevClosing || item.previousClose || cmp);

      const currentValue = qty * cmp;
      const investedValue = qty * avgPrice;
      const daysChange = (cmp - prevClose) * qty;

      totalCurrentValue += currentValue;
      totalInvestedValue += investedValue;
      totalDaysChange += daysChange;
    });

    const totalReturns = totalCurrentValue - totalInvestedValue;
    const totalReturnsPercent = totalInvestedValue > 0
      ? (totalReturns / totalInvestedValue) * 100
      : 0;
    const daysChangePercent = (totalInvestedValue + totalReturns - totalDaysChange) > 0
      ? (totalDaysChange / (totalCurrentValue - totalDaysChange)) * 100
      : 0;

    return [
      {
        id: 1,
        label: "Total Portfolio Value",
        value: formatCurrency(totalCurrentValue),
        subValue: `Invested: ${formatCurrency(totalInvestedValue)}`,
        icon: "wallet"
      },
      {
        id: 2,
        label: "Total Returns",
        value: formatCurrency(totalReturns),
        change: `${totalReturns >= 0 ? '+' : ''}${totalReturnsPercent.toFixed(2)}%`,
        icon: "trending-up"
      },
      {
        id: 3,
        label: "Today's Change",
        value: formatCurrency(totalDaysChange),
        change: `${totalDaysChange >= 0 ? '+' : ''}${daysChangePercent.toFixed(2)}%`,
        icon: "bar-chart-3"
      },
      {
        id: 4,
        label: "Overall Return",
        value: `${totalReturnsPercent.toFixed(2)}%`,
        subValue: "Simple Annualized",
        icon: "percent"
      }
    ];
  }, [holdings]);

  return { data: stats, isLoading, error: null };
}

export function useAllocations() {
  const { data, isLoading } = useClientData();
  const holdings = data.holdings || [];

  const allocations = useMemo(() => {
    if (holdings.length === 0) return [];

    const groups: Record<string, number> = {};
    let totalVal = 0;

    holdings.forEach((item: any) => {
      const qty = parseValue(item.qty || item.quantity);
      const cmp = parseValue(item.cmp || item.lastPrice);
      const val = qty * cmp;
      const type = item.type || item.asset || item.sector || "Other"; // Use sector if type missing

      groups[type] = (groups[type] || 0) + val;
      totalVal += val;
    });

    return Object.keys(groups).map((type, index) => ({
      id: index,
      label: type,
      percentage: totalVal > 0 ? (groups[type] / totalVal) * 100 : 0,
      amount: formatCurrency(groups[type]),
      color: COLORS[index % COLORS.length]
    }));
  }, [holdings]);

  return { data: allocations, isLoading, error: null };
}

export function useTopPerformers() {
  const { data, isLoading } = useClientData();
  const holdings = data.holdings || [];

  const performers = useMemo(() => {
    if (holdings.length === 0) return [];

    const processed = holdings.map((item: any, index: number) => {
      const qty = parseValue(item.qty || item.quantity);
      const cmp = parseValue(item.cmp || item.lastPrice);
      const avgPrice = parseValue(item.avgPrice || item.averagePrice);

      const value = qty * cmp;
      const gain = value - (qty * avgPrice);
      const returnPercent = qty * avgPrice > 0 ? (gain / (qty * avgPrice)) * 100 : 0;

      return {
        id: index,
        security: item.symbol || item.name || "Unknown",
        company: item.name || item.symbol || "",
        value: formatCurrency(value),
        gain: formatCurrency(gain),
        returnPercent: `${returnPercent.toFixed(2)}%`,
        isPositive: gain >= 0,
        rawGain: gain // for sorting
      };
    });

    // Sort by absolute gain (highest profit first)
    processed.sort((a: any, b: any) => b.rawGain - a.rawGain);

    return processed.slice(0, 5); // Top 5
  }, [holdings]);

  return { data: performers, isLoading, error: null };
}

export function useAlerts() {
  return {
    data: mockAlerts,
    isLoading: false,
    error: null,
  };
}
