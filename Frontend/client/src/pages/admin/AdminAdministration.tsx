import { DashboardLayout } from "@/components/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
    Shield,
    Users,
    Activity,
    Bell,
    ChevronRight,
    Search,
    UserPlus,
    MoreVertical,
    Check,
    XCircle,
    Pencil,
    Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect, useCallback } from "react";
import adminService, { AdminUser, UserRole } from "@/services/adminService";
import { useToast } from "@/hooks/use-toast";

export default function AdminAdministration() {
    const { toast } = useToast();
    const [isManageUsersOpen, setIsManageUsersOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [selectedRole, setSelectedRole] = useState<UserRole>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
    const [editForm, setEditForm] = useState({
        email: "",
        name: "",
        role: "" as UserRole,
        is_active: true
    });
    const [userStats, setUserStats] = useState({
        clients: 0,
        rms: 0,
        branchMgrs: 0,
        zonalMgrs: 0,
        superAdmins: 0,
        total: 0
    });

    const stats = [
        {
            title: "System Uptime",
            value: "99.9%",
            icon: Shield,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            title: "Active Users",
            value: String(userStats.total || 892),
            icon: Users,
            color: "text-blue-500",
            bg: "bg-blue-500/10"
        },
        {
            title: "ETL Status",
            value: "Healthy",
            icon: Activity,
            color: "text-emerald-500",
            bg: "bg-emerald-500/10"
        },
        {
            title: "Pending Alerts",
            value: "3",
            icon: Bell,
            color: "text-orange-500",
            bg: "bg-orange-500/10"
        }
    ];

    const etlJobs = [
        {
            name: "TechExcel Sync",
            time: "6:00 PM",
            status: "Completed",
            variant: "success"
        },
        {
            name: "Accord NAV Update",
            time: "9:15 PM",
            status: "Completed",
            variant: "success"
        },
        {
            name: "Genesis Pricing",
            time: "In Progress",
            status: "Running",
            variant: "warning"
        },
        {
            name: "Reconciliation",
            time: "10:00 AM",
            status: "Scheduled",
            variant: "secondary"
        }
    ];

    const quickActions = [
        { label: "Manage Users", action: () => setIsManageUsersOpen(true) },
        { label: "Role Permissions", action: () => toast({ title: "Coming Soon", description: "Role Permissions feature is under development" }) },
        { label: "Audit Logs", action: () => toast({ title: "Coming Soon", description: "Audit Logs feature is under development" }) },
        { label: "System Settings", action: () => toast({ title: "Coming Soon", description: "System Settings feature is under development" }) },
        { label: "Data Reconciliation", action: () => toast({ title: "Coming Soon", description: "Data Reconciliation feature is under development" }) }
    ];

    // Fetch user stats on mount
    const fetchUserStats = useCallback(async () => {
        try {
            const response = await adminService.getUserStats();
            if (response.success) {
                const byRole = response.data.byRole;
                setUserStats({
                    clients: byRole.client || 0,
                    rms: byRole.rm || 0,
                    branchMgrs: byRole.branch_manager || 0,
                    zonalMgrs: byRole.zonal_head || 0,
                    superAdmins: (byRole.super_admin || 0) + (byRole.director || 0),
                    total: response.data.total
                });
            }
        } catch (error) {
            console.error("Failed to fetch user stats:", error);
        }
    }, []);

    useEffect(() => {
        fetchUserStats();
    }, [fetchUserStats]);

    // Fetch users when modal opens or filters change
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await adminService.getUsersByRole(selectedRole, 1, 50, searchTerm);
            if (response.success) {
                setUsers(response.data.users);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast({
                title: "Error",
                description: "Failed to fetch users. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [selectedRole, searchTerm, toast]);

    useEffect(() => {
        if (isManageUsersOpen) {
            fetchUsers();
        }
    }, [isManageUsersOpen, fetchUsers]);

    // Open edit dialog
    const openEditDialog = (user: AdminUser) => {
        setEditingUser(user);
        setEditForm({
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            is_active: user.is_active
        });
        setIsEditUserOpen(true);
    };

    // Save user changes
    const saveUserChanges = async () => {
        if (!editingUser) return;

        setIsSaving(true);
        try {
            const response = await adminService.updateUser(editingUser.id, {
                email: editForm.email,
                name: editForm.name,
                role: editForm.role as Exclude<UserRole, 'all'>,
                is_active: editForm.is_active
            });

            if (response.success) {
                toast({
                    title: "Success",
                    description: "User updated successfully"
                });
                setIsEditUserOpen(false);
                fetchUsers();
                fetchUserStats();
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to update user",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Toggle user status
    const toggleUserStatus = async (user: AdminUser) => {
        try {
            await adminService.updateUserStatus(user.id, !user.is_active);
            toast({
                title: "Success",
                description: `User ${user.is_active ? "deactivated" : "activated"} successfully`
            });
            fetchUsers();
            fetchUserStats();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update user status",
                variant: "destructive"
            });
        }
    };

    // Delete user
    const deleteUser = async (user: AdminUser) => {
        if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await adminService.deleteUser(user.id);
            toast({
                title: "Success",
                description: "User deleted successfully"
            });
            fetchUsers();
            fetchUserStats();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete user",
                variant: "destructive"
            });
        }
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
            rm: "RM",
            branch_manager: "Branch Manager",
            zonal_head: "Zonal Manager",
            super_admin: "Super Admin",
            director: "Director"
        };
        return labels[role] || role;
    };

    const userStatsDisplay = [
        { label: "Clients", value: String(userStats.clients) },
        { label: "RMs", value: String(userStats.rms) },
        { label: "Branch Mgrs", value: String(userStats.branchMgrs) },
        { label: "Zonal Mgrs", value: String(userStats.zonalMgrs) },
        { label: "Super Admins", value: String(userStats.superAdmins) }
    ];

    return (
        <DashboardLayout role="admin">
            <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
                        Administration
                    </h1>
                </motion.div>

                {/* Top Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                                <CardContent className="p-6 flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                                        <h3 className="text-2xl font-bold">{stat.value}</h3>
                                    </div>
                                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                                        <stat.icon className={`h-5 w-5 ${stat.color}`} />
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                {/* Middle Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* ETL Jobs */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <Card className="h-full border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>ETL Jobs</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {etlJobs.map((job, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-background/50 border border-border/50">
                                        <div>
                                            <h4 className="font-semibold">{job.name}</h4>
                                            <p className="text-sm text-muted-foreground">{job.time}</p>
                                        </div>
                                        <Badge
                                            variant={job.variant === 'success' ? 'default' : job.variant === 'warning' ? 'destructive' : 'secondary'}
                                            className={
                                                job.variant === 'success' ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25' :
                                                    job.variant === 'warning' ? 'bg-blue-500/15 text-blue-500 hover:bg-blue-500/25' :
                                                        'bg-slate-500/15 text-slate-500 hover:bg-slate-500/25'
                                            }
                                        >
                                            {job.status}
                                        </Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Quick Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <Card className="h-full border-none shadow-lg bg-card/50 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {quickActions.map((action, index) => (
                                    <Button
                                        key={index}
                                        variant="ghost"
                                        onClick={action.action}
                                        className="w-full justify-between h-14 px-4 text-base font-medium bg-background/50 border border-border/50 hover:bg-primary/5 hover:text-primary transition-all"
                                    >
                                        {action.label}
                                        <ChevronRight className="h-4 w-4 opacity-50" />
                                    </Button>
                                ))}
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Bottom Section: User Management */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <Card className="border-none shadow-lg bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {userStatsDisplay.map((stat, index) => (
                                    <div key={index} className="p-4 rounded-lg bg-background/50 border border-border/50 text-center">
                                        <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Manage Users Modal */}
            <Dialog open={isManageUsersOpen} onOpenChange={setIsManageUsersOpen}>
                <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Users className="h-5 w-5" />
                            Manage Users
                        </DialogTitle>
                    </DialogHeader>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 py-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as UserRole)}>
                            <SelectTrigger className="w-full sm:w-[200px]">
                                <SelectValue placeholder="Filter by role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="client">Clients</SelectItem>
                                <SelectItem value="rm">RMs</SelectItem>
                                <SelectItem value="branch_manager">Branch Managers</SelectItem>
                                <SelectItem value="zonal_head">Zonal Managers</SelectItem>
                                <SelectItem value="super_admin">Super Admins</SelectItem>
                                <SelectItem value="director">Directors</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Add User
                        </Button>
                    </div>

                    {/* Users Table */}
                    <div className="flex-1 overflow-auto border rounded-lg">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Login</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence mode="popLayout">
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8">
                                                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                    Loading users...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No users found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <motion.tr
                                                key={user.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="border-b transition-colors hover:bg-muted/50"
                                            >
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge className={getRoleBadgeColor(user.role)}>
                                                        {formatRoleLabel(user.role)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={user.is_active ? "bg-emerald-500/15 text-emerald-500" : "bg-red-500/15 text-red-500"}>
                                                        {user.is_active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {user.last_login_at
                                                        ? new Date(user.last_login_at).toLocaleDateString()
                                                        : "Never"}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                                <Pencil className="h-4 w-4 mr-2" />
                                                                Edit User
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => toggleUserStatus(user)}>
                                                                {user.is_active ? (
                                                                    <>
                                                                        <XCircle className="h-4 w-4 mr-2" />
                                                                        Deactivate
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Check className="h-4 w-4 mr-2" />
                                                                        Activate
                                                                    </>
                                                                )}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => deleteUser(user)}
                                                                className="text-red-500 focus:text-red-500"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete User
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    )}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Pencil className="h-5 w-5" />
                            Edit User
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="Enter name"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                placeholder="Enter email"
                            />
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Role</Label>
                            <Select
                                value={editForm.role}
                                onValueChange={(val) => setEditForm({ ...editForm, role: val as UserRole })}
                            >
                                <SelectTrigger id="edit-role">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="client">Client</SelectItem>
                                    <SelectItem value="rm">RM</SelectItem>
                                    <SelectItem value="branch_manager">Branch Manager</SelectItem>
                                    <SelectItem value="zonal_head">Zonal Manager</SelectItem>
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                    <SelectItem value="director">Director</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="edit-status">Active Status</Label>
                                <p className="text-sm text-muted-foreground">
                                    {editForm.is_active ? "User can access the system" : "User is blocked from accessing"}
                                </p>
                            </div>
                            <Switch
                                id="edit-status"
                                checked={editForm.is_active}
                                onCheckedChange={(checked) => setEditForm({ ...editForm, is_active: checked })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={saveUserChanges} disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}
