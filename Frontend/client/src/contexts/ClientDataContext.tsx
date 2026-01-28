import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '@/lib/apiClient';
import { Loader2 } from "lucide-react";
import { mockPortfolioData, mockRecentTransactions } from '@/utils/mockData';

interface ClientData {
    portfolio: any[];
    holdings: any[];
    ledger: any[];
    clientCode: string;
    isDataLoaded: boolean;
}

interface ClientDataContextType {
    data: ClientData;
    isLoading: boolean;
    refreshData: () => Promise<void>;
}

const ClientDataContext = createContext<ClientDataContextType | undefined>(undefined);

const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH === 'true';

export const useClientData = () => {
    const context = useContext(ClientDataContext);
    if (!context) throw new Error('useClientData must be used within ClientDataProvider');
    return context;
};

export const ClientDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [data, setData] = useState<ClientData>({
        portfolio: [],
        holdings: [],
        ledger: [],
        clientCode: "",
        isDataLoaded: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshData = async (retryCount = 0) => {
        if (!user || !isAuthenticated) return;

        // Only fetch if client user
        if (user.role !== 'client') return;

        // If it's a retry, don't reset isLoading logic (it's already true)
        if (retryCount === 0) setIsLoading(true);

        try {
            if (USE_LOCAL_AUTH) {
                // Use mock data for local development
                console.log('🔓 Client Data Context: Using mock portfolio data');

                const mockHoldings = [
                    { symbol: 'RELIANCE', name: 'Reliance Industries', isin: 'INE002A01018', poaQty: 50, nonPoaQty: 0, sector: 'Energy', qty: 50, cmp: 2500, value: 125000, pl: 15000, qtyAvailable: 50, qtyDiscrepant: 0, qtyLongTerm: 50, qtyPledgedMargin: 0, qtyPledgedLoan: 0, avgPrice: '2200.00', prevClosing: '2480.00', unrealizedPL: '15000.00', unrealizedPLPercent: '13.64', type: 'Equity' },
                    { symbol: 'TCS', name: 'Tata Consultancy Services', isin: 'INE467B01029', poaQty: 30, nonPoaQty: 0, sector: 'IT', qty: 30, cmp: 3400, value: 102000, pl: 12000, qtyAvailable: 30, qtyDiscrepant: 0, qtyLongTerm: 30, qtyPledgedMargin: 0, qtyPledgedLoan: 0, avgPrice: '3000.00', prevClosing: '3380.00', unrealizedPL: '12000.00', unrealizedPLPercent: '13.33', type: 'Equity' },
                    { symbol: 'INFY', name: 'Infosys Ltd', isin: 'INE009A01021', poaQty: 40, nonPoaQty: 0, sector: 'IT', qty: 40, cmp: 1450, value: 58000, pl: 8000, qtyAvailable: 40, qtyDiscrepant: 0, qtyLongTerm: 40, qtyPledgedMargin: 0, qtyPledgedLoan: 0, avgPrice: '1250.00', prevClosing: '1440.00', unrealizedPL: '8000.00', unrealizedPLPercent: '16.00', type: 'Equity' },
                ];

                const mockLedgerData = mockRecentTransactions.map((txn, idx) => ({
                    particulars: `${txn.type} - ${txn.asset}`,
                    postingDate: txn.date,
                    costCenter: 'Portfolio',
                    voucherType: txn.type,
                    voucherNo: `VCH-${1000 + idx}`,
                    debit: txn.type === 'BUY' ? txn.amount : 0,
                    credit: txn.type === 'SELL' ? txn.amount : 0,
                    netBalance: 4550000 - (idx * 50000),
                    asset: 'Equity'
                }));

                setData({
                    portfolio: mockHoldings,
                    holdings: mockHoldings,
                    ledger: mockLedgerData,
                    clientCode: user.username || 'CL0001',
                    isDataLoaded: true
                });

                console.log("✅ Client Data Context: Mock data loaded");
                setIsLoading(false);
                return;
            }

            console.log(`🔄 Global Hydration: Fetching Client Data (Attempt ${retryCount + 1})...`);

            // Using apiClient ensures idToken (with user identity) is used
            // fresh='true' triggers cache bypass on backend
            // Promise.allSettled allows us to inspect failures
            const fetchStart = performance.now();
            console.log('⏱️ Starting parallel API fetch...');

            const [portfolioRes, ledgerRes] = await Promise.allSettled([
                apiClient.get('/api/users/portfolio', { params: { fresh: 'false' } }),
                apiClient.get('/api/users/ledger')
            ]);

            console.log(`⏱️ API Responses received in ${(performance.now() - fetchStart).toFixed(0)}ms`);

            // CHECK FAILURE CONDITIONS for Portfolio (Critical Data)
            if (portfolioRes.status === 'rejected') {
                throw new Error(`Portfolio API Request Failed: ${portfolioRes.reason}`);
            }

            // CHECK for SYNCING status (Polling + Trigger)
            if (portfolioRes.status === 'fulfilled' && portfolioRes.value.data?.status === 'syncing') {
                console.log(`⏳ Global Hydration: Backend empty. Triggering Refresh...`);
                apiClient.post('/api/users/portfolio/refresh').catch(e => console.warn("Refresh Trigger Failed", e));
                setTimeout(() => refreshData(retryCount), 2000);
                return;
            }
            if (portfolioRes.value.status !== 200 || !portfolioRes.value.data?.success) {
                // If the API returned (fulfilled) but with success: false or empty data structure
                throw new Error(`Portfolio API returned Error: ${portfolioRes.value.data?.message || 'Unknown Error'}`);
            }

            let newHoldings: any[] = [];
            let newLedger: any[] = [];
            let newPortfolio: any[] = [];

            // Process Portfolio/Holdings
            if (portfolioRes.status === 'fulfilled' && portfolioRes.value.data?.success) {
                const rawData = portfolioRes.value.data.data || [];
                // Map holdings (aligned with ClientReports logic)
                console.log("CONTEXT RAW DATA [0]:", rawData[0]);
                newHoldings = rawData.map((item: any) => ({
                    symbol: item.security,
                    name: item.securityName || item.security,
                    isin: item.isin || "-",
                    poaQty: item.poaQty,
                    nonPoaQty: item.nonPoaQty,
                    sector: item.sector || "Equity",
                    qty: item.qty, // PASS THROUGH for dashboard
                    cmp: item.cmp, // PASS THROUGH for dashboard
                    value: item.value, // PASS THROUGH
                    pl: item.pl, // PASS THROUGH
                    qtyAvailable: Math.abs(parseFloat(item.qty || 0)),
                    qtyDiscrepant: 0,
                    qtyLongTerm: Math.abs(parseFloat(item.qty || 0)), // Assume all long-term
                    qtyPledgedMargin: 0,
                    qtyPledgedLoan: 0,
                    avgPrice: parseFloat(item.avgPrice || 0).toFixed(2),
                    prevClosing: parseFloat(item.prevClosing || 0).toFixed(2),
                    unrealizedPL: parseFloat(item.pl || 0).toFixed(2), // Map from backend pl
                    unrealizedPLPercent: parseFloat(item.return || 0).toFixed(2), // Map from backend return
                    type: item.assetType || "Equity"
                }));
                newPortfolio = rawData;
            }

            // Process Ledger
            if (ledgerRes.status === 'fulfilled' && ledgerRes.value.data?.success) {
                const rawData = ledgerRes.value.data.data || [];
                newLedger = rawData.map((item: any) => ({
                    particulars: item.particulars,
                    postingDate: item.date || "",
                    costCenter: item.costCenter || "-",
                    voucherType: item.transType || "",
                    voucherNo: item.voucherNo || "",
                    debit: item.debit,
                    credit: item.credit,
                    netBalance: item.balance,
                    asset: "Equity"
                }));
            }

            setData({
                portfolio: newPortfolio,
                holdings: newHoldings,
                ledger: newLedger,
                clientCode: user.username,
                isDataLoaded: true
            });
            console.log("✅ Global Hydration: Complete");
            // Success! Stop loading.
            setIsLoading(false);

        } catch (error) {
            console.error("Global Hydration Failed:", error);

            // Retry Logic
            if (retryCount < 3) {
                const delay = (retryCount + 1) * 3000; // 3s, 6s, 9s
                console.log(`⚠️ Hydration failed. Retrying in ${delay}ms (Attempt ${retryCount + 2}/4)...`);

                // Wait before retrying
                setTimeout(() => refreshData(retryCount + 1), delay);
            } else {
                console.error("❌ All Hydration Retries Failed.");
                setError("Failed to load your portfolio data. Please check your connection and try again.");
                setIsLoading(false);
            }
        }
    };

    // Hydrate on login
    useEffect(() => {
        if (isAuthenticated && user) {
            if (!data.isDataLoaded) {
                refreshData();
            }
        } else if (!isAuthenticated) {
            // Reset data on logout
            setData({ portfolio: [], holdings: [], ledger: [], clientCode: "", isDataLoaded: false });
        }
    }, [isAuthenticated, user]);



    if (error) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-4 text-center">
                <div className="text-destructive text-4xl mb-4">⚠️</div>
                <h2 className="text-xl font-bold text-foreground mb-2">Portfolio Load Failed</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                    Retry Connection
                </button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground font-medium">Loading your portfolio...</p>
            </div>
        );
    }

    return (
        <ClientDataContext.Provider value={{ data, isLoading, refreshData }}>
            {children}
        </ClientDataContext.Provider>
    );
};
