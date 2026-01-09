import { ReactNode } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Search, Bell, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

interface DashboardLayoutProps {
    children: ReactNode;
    role?: string;
}

// Always allow switching to any role
const getAllowedRoles = (): string[] => {
    return ["admin", "zm", "bm", "rm", "client"];
};

export function DashboardLayout({ children, role = "client" }: DashboardLayoutProps) {
    const [, setLocation] = useLocation();

    const handleRoleChange = (newRole: string) => {
        switch (newRole) {
            case "client":
                setLocation("/client");
                break;
            case "rm":
                setLocation("/relationship-manager");
                break;
            case "bm":
                setLocation("/branch-manager");
                break;
            case "zm":
                setLocation("/zonal-manager");
                break;
            case "admin":
                setLocation("/admin");
                break;
            default:
                setLocation("/client");
        }
    };

    const allowedRoles = getAllowedRoles();

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            {/* Sidebar Navigation */}
            <Sidebar activeRole={role} />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Header */}
                <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50 px-6 h-20 flex items-center">
                    <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Search */}
                        <div className="relative w-full md:w-96 pl-12 md:pl-0">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search for stocks, funds, or news..."
                                className="w-full bg-secondary/50 border border-border/50 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all placeholder:text-muted-foreground/60"
                            />
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center justify-end gap-4 md:gap-6">
                            <div className="flex items-center gap-2 md:gap-4">
                                {/* Role Display/Switcher */}
                                {role === 'client' ? (
                                    <div className="mr-2 px-4 py-2 bg-background text-foreground border border-input rounded-md">
                                        <span className="text-sm font-medium">Client View</span>
                                    </div>
                                ) : (
                                    <div className="mr-2">
                                        <Select value={role} onValueChange={handleRoleChange}>
                                            <SelectTrigger className="w-[200px] bg-background text-foreground border border-input focus:ring-offset-0 focus:ring-1 focus:ring-ring">
                                                <SelectValue placeholder="Select Role" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-background text-foreground border-input">
                                                {allowedRoles.includes("client") && (
                                                    <SelectItem value="client" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Client</SelectItem>
                                                )}
                                                {allowedRoles.includes("rm") && (
                                                    <SelectItem value="rm" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Relationship Manager</SelectItem>
                                                )}
                                                {allowedRoles.includes("bm") && (
                                                    <SelectItem value="bm" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Branch Manager</SelectItem>
                                                )}
                                                {allowedRoles.includes("zm") && (
                                                    <SelectItem value="zm" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Zonal Manager</SelectItem>
                                                )}
                                                {allowedRoles.includes("admin") && (
                                                    <SelectItem value="admin" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">Super Admin</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <button className="relative p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-background" />
                                </button>
                                <ThemeToggle />
                                <button className="p-2 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground hidden sm:block">
                                    <Settings className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content */}
                {children}
            </main>
        </div>
    );
}
