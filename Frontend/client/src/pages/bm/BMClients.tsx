import { DashboardLayout } from "@/components/DashboardLayout";
import { useState, useEffect } from "react";
import userService, { Subordinate } from "@/services/userService";
import { Loader2, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { mockSubordinates } from "@/utils/mockData";

interface RMData {
    id: number;
    name: string;
}

interface ClientData {
    id: number;
    client_id: string;
    name: string;
    email: string;
    status: string;
}

const ChevronDownIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <ChevronDown className={className} />
);

const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH === 'true';

export default function BMClients() {
    const { toast } = useToast();
    const [, setLocation] = useLocation();
    const [subordinates, setSubordinates] = useState<Subordinate[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedRM, setSelectedRM] = useState<number | null>(null);
    const [selectedClient, setSelectedClient] = useState<number | null>(null);
    const [isRMDropdownOpen, setIsRMDropdownOpen] = useState(false);
    const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);

    const fetchSubordinates = async () => {
        setLoading(true);
        try {
            if (USE_LOCAL_AUTH) {
                // Use mock data for local development
                console.log('🔓 BM - Using mock subordinates data');
                const mockData: Subordinate[] = [
                    ...mockSubordinates.bm.relationshipManagers.map(rm => ({
                        id: rm.id,
                        name: rm.name,
                        email: rm.email,
                        role: 'rm',
                        status: 'active',
                        parent_id: undefined,
                    })),
                    ...mockSubordinates.rm.clients.map(client => ({
                        id: client.id,
                        client_id: client.clientId,
                        name: client.name,
                        email: client.email,
                        role: 'client',
                        status: client.status,
                        parent_id: 201, // Assign to first RM
                    })),
                    ...mockSubordinates.rm.clients.map((client, idx) => ({
                        id: client.id + 100,
                        client_id: `CL00${client.id - 200}`,
                        name: client.name.replace('Aarav', 'Rohan').replace('Aditi', 'Priya'),
                        email: client.email.replace('aarav', 'rohan').replace('aditi', 'priya'),
                        role: 'client',
                        status: 'active',
                        parent_id: 202, // Assign to second RM
                    })),
                ];
                setSubordinates(mockData);
            } else {
                const data = await userService.getSubordinates();
                console.log('📊 BM - Fetched subordinates:', data);
                setSubordinates(data);
            }
        } catch (error) {
            console.error("Failed to fetch subordinates:", error);
            toast({
                title: "Error",
                description: "Failed to load team data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubordinates();
    }, []);

    // Get RMs under this BM
    const relationshipManagers: RMData[] = subordinates
        .filter(s => s.role === "rm")
        .map(s => ({ id: s.id, name: s.name }));

    // Get clients under selected RM
    const clients: ClientData[] = selectedRM
        ? subordinates
            .filter(s => s.role === "client" && s.parent_id === selectedRM)
            .map(s => ({
                id: s.id,
                client_id: s.client_id || s.id.toString(),
                name: s.name,
                email: s.email,
                status: s.status
            }))
        : [];

    // Get selected data
    const selectedRMData = relationshipManagers.find(rm => rm.id === selectedRM);
    const selectedClientData = clients.find(c => c.id === selectedClient);

    // Auto-select first RM on load
    useEffect(() => {
        if (!loading && !selectedRM && relationshipManagers.length > 0) {
            setSelectedRM(relationshipManagers[0].id);
        }
    }, [loading, relationshipManagers]);

    // Auto-select first client when RM changes
    useEffect(() => {
        if (selectedRM && clients.length > 0 && !selectedClient) {
            setSelectedClient(clients[0].id);
        }
    }, [selectedRM, clients]);

    return (
        <DashboardLayout role="bm">
            <div className="max-w-7xl mx-auto w-full p-8 min-h-screen">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-display font-bold text-foreground">Clients</h1>
                </div>

                {/* Hierarchical Selector Card */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 mb-8">
                    <h3 className="text-lg font-bold text-foreground mb-4">Select Client</h3>
                    <div className="flex flex-wrap gap-4">
                        {/* RM Selector */}
                        <div className="relative">
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">RM</label>
                            <button
                                onClick={() => {
                                    console.log('🖱️ RM Dropdown clicked');
                                    setIsRMDropdownOpen(!isRMDropdownOpen);
                                }}
                                className="flex items-center justify-between w-[170px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all"
                            >
                                <span className="truncate">{selectedRM ? selectedRMData?.name : "Select..."}</span>
                                <ChevronDownIcon className="w-4 h-4 ml-2" />
                            </button>
                            {isRMDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsRMDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-[170px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                                        {relationshipManagers.length > 0 ? (
                                            relationshipManagers.map((rm) => (
                                                <button
                                                    key={rm.id}
                                                    onClick={() => {
                                                        setSelectedRM(rm.id);
                                                        setSelectedClient(null);
                                                        setIsRMDropdownOpen(false);
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedRM === rm.id ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                                                >
                                                    {rm.name}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2.5 text-sm text-muted-foreground">
                                                No RMs found
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Client Selector */}
                        {selectedRM && (
                            <div className="relative">
                                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Client</label>
                                <button
                                    onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
                                    className="flex items-center justify-between w-[170px] px-4 py-2.5 bg-background hover:bg-muted/50 border border-border rounded-lg text-sm font-semibold text-foreground transition-all"
                                >
                                    <span className="truncate">{selectedClient ? selectedClientData?.name : "Select..."}</span>
                                    <ChevronDownIcon className="w-4 h-4 ml-2" />
                                </button>
                                {isClientDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsClientDropdownOpen(false)} />
                                        <div className="absolute left-0 mt-2 w-[170px] bg-card border border-border rounded-xl shadow-xl z-20 py-1 max-h-60 overflow-y-auto">
                                            {clients.length > 0 ? (
                                                clients.map((client) => (
                                                    <button
                                                        key={client.id}
                                                        onClick={() => {
                                                            setSelectedClient(client.id);
                                                            setIsClientDropdownOpen(false);
                                                        }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${selectedClient === client.id ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:bg-muted"}`}
                                                    >
                                                        {client.name}
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-2.5 text-sm text-muted-foreground">
                                                    No clients found
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Selected Client Info */}
                {selectedClient ? (
                    <div className="space-y-6">
                        {/* Client Header */}
                        <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-bold text-foreground">{selectedClientData?.name}</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Client ID: {selectedClientData?.client_id} • {selectedClientData?.email}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        RM: {selectedRMData?.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setLocation(`/bm/reports?clientCode=${selectedClientData?.client_id}`)}
                                    className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all"
                                >
                                    View Reports
                                </button>
                            </div>
                        </div>

                        {/* Portfolio Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                                <span className="text-muted-foreground text-sm font-medium block mb-2">Total Portfolio Value</span>
                                <span className="text-2xl font-bold text-foreground">₹45.5 L</span>
                            </div>
                            <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                                <span className="text-muted-foreground text-sm font-medium block mb-2">Today's Change</span>
                                <span className="text-2xl font-bold text-emerald-500">+₹12,500</span>
                            </div>
                            <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                                <span className="text-muted-foreground text-sm font-medium block mb-2">Total Returns</span>
                                <span className="text-2xl font-bold text-emerald-500">+₹8.4 L</span>
                            </div>
                            <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-sm">
                                <span className="text-muted-foreground text-sm font-medium block mb-2">XIRR</span>
                                <span className="text-2xl font-bold text-emerald-500">15.2%</span>
                            </div>
                        </div>

                        {/* Client Details & Quick Stats */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Client Details */}
                            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-foreground mb-4">Client Information</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                                        <span className="text-sm font-medium text-muted-foreground">Client ID</span>
                                        <span className="text-sm font-semibold text-foreground">{selectedClientData?.client_id}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                                        <span className="text-sm font-medium text-muted-foreground">Name</span>
                                        <span className="text-sm font-semibold text-foreground">{selectedClientData?.name}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                                        <span className="text-sm font-medium text-muted-foreground">Email</span>
                                        <span className="text-sm font-semibold text-foreground">{selectedClientData?.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                                        <span className="text-sm font-medium text-muted-foreground">Status</span>
                                        <span className={`px-3 py-1.5 rounded-md text-xs font-semibold ${selectedClientData?.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                                            {selectedClientData?.status || 'Unknown'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                                        <span className="text-sm font-medium text-muted-foreground">Zonal Manager</span>
                                        <span className="text-sm font-semibold text-foreground">Rohan Mehta</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                                        <span className="text-sm font-medium text-muted-foreground">Branch Manager</span>
                                        <span className="text-sm font-semibold text-foreground">Arun Sharma</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm font-medium text-muted-foreground">Relationship Manager</span>
                                        <span className="text-sm font-semibold text-foreground">{selectedRMData?.name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-foreground mb-4">Quick Stats</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                                        <span className="text-sm font-medium text-muted-foreground">Total Holdings</span>
                                        <span className="text-sm font-semibold text-foreground">24</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                                        <span className="text-sm font-medium text-muted-foreground">Equity Holdings</span>
                                        <span className="text-sm font-semibold text-foreground">12</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                                        <span className="text-sm font-medium text-muted-foreground">Mutual Fund Holdings</span>
                                        <span className="text-sm font-semibold text-foreground">8</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                                        <span className="text-sm font-medium text-muted-foreground">Bond Holdings</span>
                                        <span className="text-sm font-semibold text-foreground">4</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-border/30">
                                        <span className="text-sm font-medium text-muted-foreground">Last Transaction</span>
                                        <span className="text-sm font-semibold text-foreground">15 Jan 2026</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2">
                                        <span className="text-sm font-medium text-muted-foreground">Account Opening Date</span>
                                        <span className="text-sm font-semibold text-foreground">12 Mar 2022</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-12 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-muted-foreground">Loading team data...</p>
                    </div>
                ) : (
                    <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8 text-muted-foreground">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">Select a Client</h3>
                        <p className="text-muted-foreground">Please select an RM and Client from the dropdowns above to view client details.</p>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
