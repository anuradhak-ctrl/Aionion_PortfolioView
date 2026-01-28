import React, { useState, useEffect } from 'react';
import { Search, Upload, Mail, Download, LogOut, Settings } from 'lucide-react';
import { useLocation } from 'wouter';

interface Client {
    id: number;
    client_id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
}

interface MFData {
    id: number;
    client_id: string;
    amc_name: string;
    scheme_name: string;
    scheme_code: string;
    folio_no: string;
    scheme_category: string;
    units: number;
    avg_cost: number;
    invested_amount: number;
    current_nav: number;
    nav_date: string;
    current_value: number;
    unrealized_pl: number;
    unrealized_pl_percent: number;
    uploaded_at: string;
}

interface BondData {
    id: number;
    client_id: string;
    bond_name: string;
    isin: string;
    issuer_name: string;
    bond_type: string;
    invested_principal_amount: number;
    issue_date: string;
    purchase_date: string;
    coupon_rate: number;
    coupon_frequency: string;
    maturity_date: string;
    call_date: string;
    ytm_percent: number;
    ytc_percent: number;
    uploaded_at: string;
}

const OperationsDashboard: React.FC = () => {
    const [, setLocation] = useLocation();
    const [user, setUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Client[]>([]);
    const [activeTab, setActiveTab] = useState<'mf' | 'bond'>('mf');
    const [loading, setLoading] = useState(false);
    const [uploadingMF, setUploadingMF] = useState(false);
    const [uploadingBond, setUploadingBond] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);

    // Default selected client for testing the design
    const [selectedClient, setSelectedClient] = useState<Client | null>({
        id: 1,
        client_id: 'CLI001',
        name: 'Sample Client - CLI001',
        email: 'client001@example.com',
        phone: '+91 98765 43210',
        role: 'client',
        status: 'active'
    });

    // Sample/Mock data for testing the table design
    const [mfData, setMfData] = useState<MFData[]>([
        {
            id: 1,
            client_id: 'CLI001',
            amc_name: 'HDFC',
            scheme_name: 'HDFC Equity Fund - Growth',
            scheme_code: '12345',
            folio_no: '12345/12',
            scheme_category: 'Equity Cap',
            units: 250.0000,
            avg_cost: 123.5,
            invested_amount: 30875.00,
            current_nav: 165.2,
            nav_date: '2024-01-15',
            current_value: 41300.00,
            unrealized_pl: 10425.00,
            unrealized_pl_percent: 37.90,
            uploaded_at: new Date().toISOString()
        },
        {
            id: 2,
            client_id: 'CLI001',
            amc_name: 'SBI',
            scheme_name: 'SBI Short Duration Fund - Growth',
            scheme_code: '24680',
            folio_no: 'SN/12',
            scheme_category: 'Short Duration',
            units: 500.0000,
            avg_cost: 88.1,
            invested_amount: 44050.00,
            current_nav: 102.35,
            nav_date: '2024-01-15',
            current_value: 51175.00,
            unrealized_pl: 7125.00,
            unrealized_pl_percent: 16.18,
            uploaded_at: new Date().toISOString()
        },
        {
            id: 3,
            client_id: 'CLI001',
            amc_name: 'ICICI',
            scheme_name: 'ICICI Prudential Balanced Advantage',
            scheme_code: '34567',
            folio_no: 'IC/34',
            scheme_category: 'Balanced Advantage',
            units: 100.0000,
            avg_cost: 218.0,
            invested_amount: 21800.00,
            current_nav: 239.4,
            nav_date: '2024-01-15',
            current_value: 23940.00,
            unrealized_pl: 2140.00,
            unrealized_pl_percent: 9.82,
            uploaded_at: new Date().toISOString()
        }
    ]);

    const [bondData, setBondData] = useState<BondData[]>([
        {
            id: 1,
            client_id: 'CLI001',
            bond_name: 'HDFC Bank Bond',
            isin: 'INE040A08041',
            issuer_name: 'HDFC Bank',
            bond_type: 'Corporate',
            invested_principal_amount: 100000,
            issue_date: '2020-01-15',
            purchase_date: '2020-01-20',
            coupon_rate: 8.5,
            coupon_frequency: 'Annual',
            maturity_date: '2025-01-15',
            call_date: '',
            ytm_percent: 7.8,
            ytc_percent: 0,
            uploaded_at: new Date().toISOString()
        },
        {
            id: 2,
            client_id: 'CLI001',
            bond_name: 'ICICI Bank Bond',
            isin: 'INE090A08052',
            issuer_name: 'ICICI Bank',
            bond_type: 'Corporate',
            invested_principal_amount: 150000,
            issue_date: '2021-03-10',
            purchase_date: '2021-03-15',
            coupon_rate: 7.25,
            coupon_frequency: 'Semi-Annual',
            maturity_date: '2026-03-10',
            call_date: '2024-03-10',
            ytm_percent: 6.9,
            ytc_percent: 7.2,
            uploaded_at: new Date().toISOString()
        },
        {
            id: 3,
            client_id: 'CLI001',
            bond_name: 'SBI Bond Series 2023',
            isin: 'INE062A08053',
            issuer_name: 'State Bank of India',
            bond_type: 'Corporate',
            invested_principal_amount: 200000,
            issue_date: '2023-06-01',
            purchase_date: '2023-06-05',
            coupon_rate: 7.75,
            coupon_frequency: 'Quarterly',
            maturity_date: '2028-06-01',
            call_date: '',
            ytm_percent: 7.5,
            ytc_percent: 0,
            uploaded_at: new Date().toISOString()
        }
    ]);

    // Check authentication
    useEffect(() => {
        const token = localStorage.getItem('operations_token');
        const userData = localStorage.getItem('operations_user');

        if (!token || !userData) {
            setLocation('/operations-login');
        } else {
            setUser(JSON.parse(userData));
        }
    }, [setLocation]);

    const handleLogout = () => {
        localStorage.removeItem('operations_token');
        localStorage.removeItem('operations_user');
        setLocation('/operations-login');
    };

    // Upload MF CSV (Bulk - multiple clients in one file)
    const handleBulkUploadMF = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.[0]) return;

        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setUploadingMF(true);
        try {
            const token = localStorage.getItem('operations_token');
            const response = await fetch('http://localhost:5000/api/operations/upload/mf', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                const clientList = result.data.clientIds.join(', ');
                alert(`✅ Successfully uploaded ${result.data.inserted} MF records for ${result.data.clients} client(s):\n${clientList}`);
            } else {
                alert(`❌ Upload failed: ${result.message}`);
            }
        } catch (error) {
            console.error('Upload MF error:', error);
            alert('Failed to upload MF CSV');
        } finally {
            setUploadingMF(false);
            event.target.value = '';
        }
    };

    // Upload Bond CSV (Bulk - multiple clients in one file)
    const handleBulkUploadBond = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.[0]) return;

        const file = event.target.files[0];
        const formData = new FormData();
        formData.append('file', file);

        setUploadingBond(true);
        try {
            const token = localStorage.getItem('operations_token');
            const response = await fetch('http://localhost:5000/api/operations/upload/bonds', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const result = await response.json();
            if (result.success) {
                const clientList = result.data.clientIds.join(', ');
                alert(`✅ Successfully uploaded ${result.data.inserted} Bond records for ${result.data.clients} client(s):\n${clientList}`);
            } else {
                alert(`❌ Upload failed: ${result.message}`);
            }
        } catch (error) {
            console.error('Upload Bond error:', error);
            alert('Failed to upload Bond CSV');
        } finally {
            setUploadingBond(false);
            event.target.value = '';
        }
    };

    // Search client
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('operations_token');
            const response = await fetch(
                `http://localhost:5000/api/operations/clients/search?client_id=${searchQuery}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const data = await response.json();
            if (data.success) {
                setSearchResults(data.data);
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Failed to search client');
        } finally {
            setLoading(false);
        }
    };

    // Select client and load data
    const handleSelectClient = async (client: Client) => {
        setSelectedClient(client);
        setSearchResults([]);
        await loadClientData(client.client_id);
    };

    // Load client MF and Bond data
    const loadClientData = async (clientId: string) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('operations_token');

            const [mfResponse, bondResponse] = await Promise.all([
                fetch(`http://localhost:5000/api/operations/clients/${clientId}/mf`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`http://localhost:5000/api/operations/clients/${clientId}/bonds`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            const mfResult = await mfResponse.json();
            const bondResult = await bondResponse.json();

            if (mfResult.success) setMfData(mfResult.data);
            if (bondResult.success) setBondData(bondResult.data);
        } catch (error) {
            console.error('Load data error:', error);
            alert('Failed to load client data');
        } finally {
            setLoading(false);
        }
    };

    // Send email to client
    const handleSendEmail = async (reportType: 'mf' | 'bond' | 'both') => {
        if (!selectedClient) return;

        if (!confirm(`Send ${reportType.toUpperCase()} report to ${selectedClient.email}?`)) {
            return;
        }

        setSendingEmail(true);
        try {
            const token = localStorage.getItem('operations_token');
            const response = await fetch(
                `http://localhost:5000/api/operations/send-email/${selectedClient.client_id}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ report_type: reportType }),
                }
            );

            const result = await response.json();
            if (result.success) {
                alert('Email sent successfully!');
            } else {
                alert(`Failed to send email: ${result.message}`);
            }
        } catch (error) {
            console.error('Send email error:', error);
            alert('Failed to send email');
        } finally {
            setSendingEmail(false);
        }
    };

    // Export to CSV
    const exportToCSV = (data: any[], filename: string) => {
        if (data.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map((row) =>
                headers.map((header) => JSON.stringify(row[header] || '')).join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (!user) {
        return null; // Will redirect to login
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                            <Settings className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Operations Portal</h1>
                            <p className="text-sm text-gray-600">MF & Bond Report Management</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">{user.name || user.username}</p>
                            <p className="text-xs text-gray-600">Operations Staff</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Bulk Upload Section - NOW AT THE TOP */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <Upload className="w-6 h-6 text-purple-600" />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Bulk Upload Reports</h2>
                            <p className="text-sm text-gray-600">Upload CSV files containing data for multiple clients</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Upload MF */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Upload className="w-6 h-6 text-purple-600" />
                                <h3 className="text-lg font-semibold">Upload MF Report</h3>
                            </div>
                            <label className="block">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer">
                                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                    <p className="text-gray-600 mb-2">
                                        {uploadingMF ? 'Uploading...' : 'Click to upload MF CSV'}
                                    </p>
                                    <p className="text-sm text-gray-500">CSV with client_id column</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleBulkUploadMF}
                                    disabled={uploadingMF}
                                    className="hidden"
                                />
                            </label>
                        </div>

                        {/* Upload Bond */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <Upload className="w-6 h-6 text-pink-600" />
                                <h3 className="text-lg font-semibold">Upload Bond Report</h3>
                            </div>
                            <label className="block">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-pink-500 transition-colors cursor-pointer">
                                    <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                                    <p className="text-gray-600 mb-2">
                                        {uploadingBond ? 'Uploading...' : 'Click to upload Bond CSV'}
                                    </p>
                                    <p className="text-sm text-gray-500">CSV with client_id column</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleBulkUploadBond}
                                    disabled={uploadingBond}
                                    className="hidden"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Info Note */}
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                            <strong>📝 Note:</strong> Your CSV file should include a <code className="bg-blue-100 px-1.5 py-0.5 rounded">client_id</code> column.
                            The system will automatically process all clients in the file.
                        </p>
                    </div>
                </div>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-gray-50 text-gray-500 font-medium">Search & View Client Data</span>
                    </div>
                </div>

                {/* Client Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold mb-4">Search Client</h2>
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Enter Client ID or Name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            onClick={handleSearch}
                            disabled={loading}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                            {searchResults.map((client) => (
                                <div
                                    key={client.id}
                                    onClick={() => handleSelectClient(client)}
                                    className="p-4 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{client.name}</p>
                                            <p className="text-sm text-gray-600">
                                                {client.client_id} • {client.email}
                                            </p>
                                        </div>
                                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                            {client.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Selected Client */}
                    {selectedClient && (
                        <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-lg">{selectedClient.name}</p>
                                    <p className="text-sm text-gray-600">
                                        {selectedClient.client_id} • {selectedClient.email}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSelectedClient(null)}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Data Display */}
                {selectedClient && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                        {/* Tabs */}
                        <div className="border-b border-gray-200">
                            <div className="flex gap-4 px-6">
                                <button
                                    onClick={() => setActiveTab('mf')}
                                    className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'mf'
                                        ? 'border-purple-600 text-purple-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Mutual Funds ({mfData.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('bond')}
                                    className={`py-4 px-2 border-b-2 font-medium transition-colors ${activeTab === 'bond'
                                        ? 'border-pink-600 text-pink-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    Bonds ({bondData.length})
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 border-b border-gray-200 flex gap-3 flex-wrap">
                            <button
                                onClick={() => handleSendEmail(activeTab)}
                                disabled={sendingEmail}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                <Mail className="w-4 h-4" />
                                {sendingEmail ? 'Sending...' : `Send ${activeTab.toUpperCase()} Email`}
                            </button>
                            <button
                                onClick={() => handleSendEmail('both')}
                                disabled={sendingEmail}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                <Mail className="w-4 h-4" />
                                Send Combined Email
                            </button>
                            <button
                                onClick={() =>
                                    exportToCSV(
                                        activeTab === 'mf' ? mfData : bondData,
                                        `${selectedClient.client_id}_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`
                                    )
                                }
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                            >
                                <Download className="w-4 h-4" />
                                Export CSV
                            </button>
                        </div>

                        {/* Table Content */}
                        <div className="p-6 overflow-x-auto">
                            {activeTab === 'mf' ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-2 font-semibold">AMC Name</th>
                                            <th className="text-left py-3 px-2 font-semibold">Scheme Name</th>
                                            <th className="text-left py-3 px-2 font-semibold">Folio No</th>
                                            <th className="text-right py-3 px-2 font-semibold">Units</th>
                                            <th className="text-right py-3 px-2 font-semibold">Current NAV</th>
                                            <th className="text-right py-3 px-2 font-semibold">Current Value</th>
                                            <th className="text-right py-3 px-2 font-semibold">P&L</th>
                                            <th className="text-center py-3 px-2 font-semibold">Uploaded</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mfData.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-8 text-gray-500">
                                                    No MF data available. Upload a CSV to get started.
                                                </td>
                                            </tr>
                                        ) : (
                                            mfData.map((item) => (
                                                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-2">{item.amc_name}</td>
                                                    <td className="py-3 px-2">{item.scheme_name}</td>
                                                    <td className="py-3 px-2">{item.folio_no}</td>
                                                    <td className="py-3 px-2 text-right">{item.units?.toFixed(4)}</td>
                                                    <td className="py-3 px-2 text-right">₹{item.current_nav?.toFixed(2)}</td>
                                                    <td className="py-3 px-2 text-right">
                                                        ₹{item.current_value?.toLocaleString('en-IN')}
                                                    </td>
                                                    <td
                                                        className={`py-3 px-2 text-right font-semibold ${item.unrealized_pl >= 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}
                                                    >
                                                        ₹{item.unrealized_pl?.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-3 px-2 text-center text-xs text-gray-500">
                                                        {new Date(item.uploaded_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-2 font-semibold">Bond Name</th>
                                            <th className="text-left py-3 px-2 font-semibold">ISIN</th>
                                            <th className="text-left py-3 px-2 font-semibold">Issuer</th>
                                            <th className="text-right py-3 px-2 font-semibold">Invested Amount</th>
                                            <th className="text-right py-3 px-2 font-semibold">Coupon Rate</th>
                                            <th className="text-center py-3 px-2 font-semibold">Maturity Date</th>
                                            <th className="text-right py-3 px-2 font-semibold">YTM %</th>
                                            <th className="text-center py-3 px-2 font-semibold">Uploaded</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bondData.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="text-center py-8 text-gray-500">
                                                    No Bond data available. Upload a CSV to get started.
                                                </td>
                                            </tr>
                                        ) : (
                                            bondData.map((item) => (
                                                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                                                    <td className="py-3 px-2">{item.bond_name}</td>
                                                    <td className="py-3 px-2">{item.isin}</td>
                                                    <td className="py-3 px-2">{item.issuer_name}</td>
                                                    <td className="py-3 px-2 text-right">
                                                        ₹{item.invested_principal_amount?.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="py-3 px-2 text-right">{item.coupon_rate?.toFixed(2)}%</td>
                                                    <td className="py-3 px-2 text-center">
                                                        {item.maturity_date
                                                            ? new Date(item.maturity_date).toLocaleDateString()
                                                            : '-'}
                                                    </td>
                                                    <td className="py-3 px-2 text-right">{item.ytm_percent?.toFixed(2)}%</td>
                                                    <td className="py-3 px-2 text-center text-xs text-gray-500">
                                                        {new Date(item.uploaded_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OperationsDashboard;
