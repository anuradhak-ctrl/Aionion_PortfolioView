// Mock data for local development (USE_LOCAL_AUTH=true)
// This provides realistic data for all dashboards without backend dependencies

export const mockPortfolioData = {
    totalValue: 4550000, // ₹45.5L
    todayChange: 12500,
    todayChangePercent: 0.28,
    totalReturns: 840000, // ₹8.4L
    totalReturnsPercent: 22.65,
    xirr: 15.2,
    investedAmount: 3710000,
};

export const mockHoldingsData = {
    totalHoldings: 24,
    equityHoldings: 12,
    mfHoldings: 8,
    bondHoldings: 4,
};

export const mockAssetAllocation = [
    { name: 'Equity', value: 2275000, percentage: 50 },
    { name: 'Mutual Funds', value: 1365000, percentage: 30 },
    { name: 'Bonds', value: 910000, percentage: 20 },
];

export const mockTopPerformers = [
    { symbol: 'RELIANCE', name: 'Reliance Industries', returns: 28.5, value: 350000 },
    { symbol: 'TCS', name: 'Tata Consultancy Services', returns: 24.2, value: 280000 },
    { symbol: 'INFY', name: 'Infosys Ltd', returns: 21.8, value: 245000 },
    { symbol: 'HDFC', name: 'HDFC Bank', returns: 19.5, value: 220000 },
    { symbol: 'ICICI', name: 'ICICI Bank', returns: 18.3, value: 195000 },
];

export const mockRecentTransactions = [
    { date: '2026-01-15', type: 'BUY', asset: 'RELIANCE', quantity: 50, amount: 125000 },
    { date: '2026-01-10', type: 'SELL', asset: 'TCS', quantity: 20, amount: 85000 },
    { date: '2026-01-05', type: 'BUY', asset: 'AXIS MF', quantity: 100, amount: 50000 },
    { date: '2025-12-28', type: 'BUY', asset: 'HDFC Bank', quantity: 30, amount: 45000 },
];

// Hierarchy mock data
export const mockSubordinates = {
    // For ZM
    zm: {
        branchManagers: [
            { id: 101, name: 'Arun Sharma', email: 'arun.sharma@example.com', clientCount: 18, portfolioValue: 82500000 },
            { id: 102, name: 'Deepika Menon', email: 'deepika.menon@example.com', clientCount: 22, portfolioValue: 95000000 },
        ],
        relationshipManagers: [
            { id: 201, name: 'Vikram Singh', email: 'vikram.singh@example.com', parentId: 101, clientCount: 9, portfolioValue: 41000000 },
            { id: 202, name: 'Anita Desai', email: 'anita.desai@example.com', parentId: 101, clientCount: 9, portfolioValue: 41500000 },
            { id: 203, name: 'Suresh Rao', email: 'suresh.rao@example.com', parentId: 102, clientCount: 11, portfolioValue: 47000000 },
            { id: 204, name: 'Meera Joshi', email: 'meera.joshi@example.com', parentId: 102, clientCount: 11, portfolioValue: 48000000 },
        ],
        totalClients: 40,
        totalPortfolioValue: 177500000,
    },

    // For BM
    bm: {
        relationshipManagers: [
            { id: 201, name: 'Vikram Singh', email: 'vikram.singh@example.com', clientCount: 9, portfolioValue: 41000000 },
            { id: 202, name: 'Anita Desai', email: 'anita.desai@example.com', clientCount: 9, portfolioValue: 41500000 },
        ],
        totalClients: 18,
        totalPortfolioValue: 82500000,
    },

    // For RM
    rm: {
        clients: [
            { id: 301, clientId: 'CL0001', name: 'Aarav Sharma', email: 'aarav.sharma@client.com', portfolioValue: 4550000, status: 'active' },
            { id: 302, clientId: 'CL0002', name: 'Aditi Patel', email: 'aditi.patel@client.com', portfolioValue: 3800000, status: 'active' },
            { id: 303, clientId: 'CL0003', name: 'Arjun Kumar', email: 'arjun.kumar@client.com', portfolioValue: 5200000, status: 'active' },
            { id: 304, clientId: 'CL0004', name: 'Diya Reddy', email: 'diya.reddy@client.com', portfolioValue: 2900000, status: 'active' },
            { id: 305, clientId: 'CL0005', name: 'Ishaan Verma', email: 'ishaan.verma@client.com', portfolioValue: 6100000, status: 'active' },
            { id: 306, clientId: 'CL0006', name: 'Kiara Nair', email: 'kiara.nair@client.com', portfolioValue: 4200000, status: 'active' },
        ],
        totalPortfolioValue: 26750000,
    },
};

// Stats for different roles
export const mockDashboardStats = {
    client: {
        totalValue: mockPortfolioData.totalValue,
        todayChange: mockPortfolioData.todayChange,
        totalReturns: mockPortfolioData.totalReturns,
        xirr: mockPortfolioData.xirr,
    },

    rm: {
        totalClients: 6,
        totalPortfolioValue: 26750000,
        avgPortfolioValue: 4458333,
        topClient: 'Ishaan Verma',
    },

    bm: {
        totalRMs: 2,
        totalClients: 18,
        totalPortfolioValue: 82500000,
        avgPortfolioValue: 4583333,
    },

    zm: {
        totalBMs: 2,
        totalRMs: 4,
        totalClients: 40,
        totalPortfolioValue: 177500000,
    },

    admin: {
        totalUsers: 156,
        totalClients: 120,
        totalRMs: 25,
        totalBMs: 8,
        totalZMs: 3,
        totalPortfolioValue: 542000000,
        systemHealth: 'Excellent',
    },
};

// Equity holdings mock data
export const mockEquityHoldings = [
    { security: "RELIANCE", name: "Reliance Industries", qty: 100, avgPrice: "₹2450", cmp: "₹2680", value: "₹2.68 L", pl: "+₹23,000", return: "+9.39%" },
    { security: "HDFCBANK", name: "HDFC Bank", qty: 150, avgPrice: "₹1580", cmp: "₹1720", value: "₹2.58 L", pl: "+₹21,000", return: "+8.86%" },
    { security: "INFY", name: "Infosys", qty: 200, avgPrice: "₹1450", cmp: "₹1580", value: "₹3.16 L", pl: "+₹26,000", return: "+8.97%" },
    { security: "TCS", name: "TCS", qty: 80, avgPrice: "₹3200", cmp: "₹3450", value: "₹2.76 L", pl: "+₹20,000", return: "+7.81%" },
    { security: "ICICIBANK", name: "ICICI Bank", qty: 250, avgPrice: "₹920", cmp: "₹1050", value: "₹2.63 L", pl: "+₹32,500", return: "+14.13%" },
];

export default {
    mockPortfolioData,
    mockHoldingsData,
    mockAssetAllocation,
    mockTopPerformers,
    mockRecentTransactions,
    mockSubordinates,
    mockDashboardStats,
    mockEquityHoldings,
};
