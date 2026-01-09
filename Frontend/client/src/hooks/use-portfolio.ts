import {
  mockPortfolioStats,
  mockAllocations,
  mockAlerts,
  mockTopPerformers,
  type PortfolioStat,
  type Allocation,
  type Alert,
  type TopPerformer
} from "@/lib/mockData";

// ============================================
// HOOKS for Portfolio Dashboard (using mock data)
// ============================================

export function usePortfolioStats() {
  return {
    data: mockPortfolioStats,
    isLoading: false,
    error: null,
  };
}

export function useAllocations() {
  return {
    data: mockAllocations,
    isLoading: false,
    error: null,
  };
}

export function useAlerts() {
  return {
    data: mockAlerts,
    isLoading: false,
    error: null,
  };
}

export function useTopPerformers() {
  return {
    data: mockTopPerformers,
    isLoading: false,
    error: null,
  };
}
