import { DashboardLayout } from "@/components/DashboardLayout";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Search, Pencil, RefreshCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import adminService, { AdminUser } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";

export default function RoleHierarchy() {
    const { toast } = useToast();
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [potentialParents, setPotentialParents] = useState<AdminUser[]>([]);
    const [selectedParentId, setSelectedParentId] = useState<string>("none");
    const [isAssigning, setIsAssigning] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("all");

    // Fetch all users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            // Fetch all users (limit 500 to get a good chunk of hierarchy)
            const response = await adminService.getUsersByRole('all', 1, 500);
            if (response.success) {
                setUsers(response.data.users);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast({
                title: "Error",
                description: "Failed to load hierarchy data",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await adminService.syncUsers();
            toast({
                title: "Sync Complete",
                description: "Users have been synced from Cognito.",
            });
            fetchUsers(); // Refresh list
        } catch (error: any) {
            console.error("Sync failed:", error);
            const errorMessage = error.response?.data?.message || error.message || "Could not sync users.";
            toast({
                title: "Sync Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAssignParent = async () => {
        if (!selectedUser) return;

        setIsAssigning(true);
        try {
            const parentId = selectedParentId === "none" ? null : Number(selectedParentId);

            await adminService.assignParent(selectedUser.id, parentId);

            toast({
                title: "Success",
                description: `Hierarchy updated for ${selectedUser.name}`,
            });

            setAssignModalOpen(false);
            fetchUsers(); // Refresh data
            setSelectedUser(null);
            setPotentialParents([]); // Clear potential parents
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update hierarchy",
                variant: "destructive"
            });
        } finally {
            setIsAssigning(false);
        }
    };

    // Helper to find parent client_id
    const getParentCode = (parentId: number | null | undefined) => {
        if (!parentId) return null;
        const parent = users.find(u => u.id === parentId);
        return parent?.client_id || parent?.name || "Unknown";
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            client: "bg-blue-500/15 text-blue-500",
            rm: "bg-purple-500/15 text-purple-500",
            branch_manager: "bg-amber-500/15 text-amber-500",
            zonal_head: "bg-teal-500/15 text-teal-500",
            super_admin: "bg-red-500/15 text-red-500",
            director: "bg-pink-500/15 text-pink-500"
        };
        return colors[role] || "bg-gray-500/15 text-gray-500";
    };

    const formatRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            client: "Client",
            rm: "Relationship Manager",
            branch_manager: "Branch Manager",
            zonal_head: "Zonal Manager",
            super_admin: "Super Admin"
        };
        return labels[role] || role;
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleRank = (role: string) => {
        const ranks: Record<string, number> = {
            director: 0,
            super_admin: 0,
            zonal_head: 1,
            branch_manager: 2,
            rm: 3,
            client: 4
        };
        return ranks[role] ?? 99; // Unknown roles are lowest rank
    };

    const openAssignModalForUser = (user: AdminUser) => {
        setSelectedUser(user);

        const userRank = getRoleRank(user.role);

        // Filter: Parent must have a HIGHER rank (smaller number) than the user
        // e.g. If user is Branch Manager (2), Parent must be Zonal Head (1) or Admin (0)
        // Parent cannot be same rank or lower.
        const parents = users.filter(u => {
            const parentRank = getRoleRank(u.role);
            return parentRank < userRank && u.id !== user.id;
        });

        setPotentialParents(parents);
        setSelectedParentId(user.parent_id ? String(user.parent_id) : "none");
        setAssignModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen w-full">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground animate-pulse">Loading hierarchy...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout role="admin">
            <div className="flex-1 p-6 h-screen flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-3xl font-display font-bold text-foreground">Role Permissions</h1>
                        <p className="text-muted-foreground">Manage user reporting structures and hierarchy</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-card/50"
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-full md:w-[200px] bg-card/50">
                            <SelectValue placeholder="Filter by role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Roles</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="rm">Relationship Manager</SelectItem>
                            <SelectItem value="branch_manager">Branch Manager</SelectItem>
                            <SelectItem value="zonal_head">Zonal Manager</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="gap-2 min-w-[120px]"
                    >
                        <RefreshCcw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Syncing..." : "Sync Users"}
                    </Button>
                </div>

                <div className="rounded-md border bg-card/50 overflow-hidden flex-1 p-4 overflow-y-auto space-y-8">
                    {Object.entries(
                        filteredUsers.reduce((acc, user) => {
                            const role = user.role;
                            if (!acc[role]) acc[role] = [];
                            acc[role].push(user);
                            return acc;
                        }, {} as Record<string, AdminUser[]>)
                    ).map(([role, roleUsers]) => (
                        <div key={role} className="space-y-3">
                            <h3 className="text-lg font-semibold capitalize text-primary flex items-center gap-2">
                                {formatRoleLabel(role)}
                                <span className="text-sm font-normal text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                                    {roleUsers.length}
                                </span>
                            </h3>
                            <div className="rounded-md border bg-card">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[300px]">Client Code</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Reporting Manager</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {roleUsers.map((user) => (
                                            <TableRow key={user.id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">{user.client_id || user.name}</TableCell>
                                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                                <TableCell>
                                                    {user.is_active ? (
                                                        <span className="text-emerald-600 font-medium text-sm">Active</span>
                                                    ) : (
                                                        <span className="text-red-600 font-medium text-sm">Inactive</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {user.parent_id ? (
                                                        <span className="font-medium text-sm">{getParentCode(user.parent_id)}</span>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm italic">Unassigned</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openAssignModalForUser(user)}
                                                        className="h-8 gap-1.5 hover:bg-primary/10 hover:text-primary"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    ))}

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                            No users found matching your filters.
                        </div>
                    )}
                </div>

                {/* Assignment Dialog */}
                <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Assign Manager</DialogTitle>
                            <DialogDescription>
                                Set the reporting manager for <strong>{selectedUser?.name}</strong>.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-4">
                            <label className="text-sm font-medium mb-2 block">Select Manager</label>
                            <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a manager" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Manager (Unassigned)</SelectItem>
                                    {potentialParents.map(parent => (
                                        <SelectItem key={parent.id} value={String(parent.id)}>
                                            {parent.client_id ? `${parent.client_id} - ` : ''}{parent.name} ({parent.role})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
                            <Button onClick={handleAssignParent} disabled={isAssigning}>
                                {isAssigning ? "Saving..." : "Save Assignment"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout>
    );
}
