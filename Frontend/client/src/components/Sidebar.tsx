import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  PieChart,
  FileText,
  Lightbulb,
  UserCircle,
  LogOut,
  Menu,
  Users,
  Building2,
  Map,
  BarChart3,
  ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SidebarProps {
  activeRole?: string;
}

export function Sidebar({ activeRole = "client" }: SidebarProps) {
  const [location] = useLocation();

  const getNavItems = (role: string) => {
    let dashboardHref = "/";
    let rolePrefix = "";

    switch (role) {
      case "client":
        dashboardHref = "/client";
        rolePrefix = "/client";
        break;
      case "rm":
        dashboardHref = "/relationship-manager";
        rolePrefix = "/rm";
        break;
      case "bm":
        dashboardHref = "/branch-manager";
        rolePrefix = "/bm";
        break;
      case "zm":
        dashboardHref = "/zonal-manager";
        rolePrefix = "/zm";
        break;
      case "admin":
        dashboardHref = "/admin";
        rolePrefix = "/admin";
        break;
      default:
        dashboardHref = "/client";
        rolePrefix = "/client";
    }

    const items = [
      { icon: LayoutDashboard, label: "Dashboard", href: dashboardHref },
      { icon: PieChart, label: "Holdings", href: `${rolePrefix}/holdings` },
    ];

    if (role === "rm") {
      items.push({ icon: Users, label: "Clients", href: "/rm/clients" });
    }

    if (role === "bm") {
      items.push(
        { icon: Users, label: "Clients", href: "/bm/clients" },
        { icon: Building2, label: "Branches", href: "/bm/branches" }
      );
    }

    if (role === "zm") {
      items.push(
        { icon: Users, label: "Clients", href: "/zm/clients" },
        { icon: Building2, label: "Branches", href: "/zm/branches" },
        { icon: Map, label: "Zones", href: "/zm/zones" }
      );
    }

    if (role === "admin") {
      items.push(
        { icon: Users, label: "Clients", href: "/admin/clients" },
        { icon: Building2, label: "Branches", href: "/admin/branches" },
        { icon: Map, label: "Zones", href: "/admin/zones" }
      );
    }

    items.push(
      { icon: FileText, label: "Reports", href: `${rolePrefix}/reports` },
      { icon: Lightbulb, label: "Insights", href: `${rolePrefix}/insights` },
      { icon: UserCircle, label: "Profile", href: `${rolePrefix}/profile` }
    );

    if (role === "admin") {
      items.push(
        { icon: BarChart3, label: "Company Analytics", href: "/admin/analytics" },
        { icon: ShieldCheck, label: "Administration", href: "/admin/administration" }
      );
    }

    return items;
  };

  const navItems = getNavItems(activeRole);

  const getUserInfo = (role: string) => {
    switch (role) {
      case "rm":
        return { name: "Rajesh Patel", role: "Relationship Manager", initials: "RP" };
      case "bm":
        return { name: "Sarah Wilson", role: "Branch Manager", initials: "SW" };
      case "zm":
        return { name: "Michael Chang", role: "Zonal Manager", initials: "MC" };
      case "admin":
        return { name: "Admin User", role: "Super Admin", initials: "AU" };
      default:
        return { name: "Rajesh Kumar", role: "Premium Client", initials: "RK" };
    }
  };

  const userInfo = getUserInfo(activeRole);

  const NavContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-[#1e293b]">
      <div className="h-20 border-b border-border/50 flex items-center justify-center">
        <div className="flex items-center justify-center gap-3">
          <img
            src="/logo.png"
            alt="Company Logo"
            className="h-16 w-auto object-contain block dark:hidden"
          />
          <img
            src="/logo-dark.png"
            alt="Company Logo"
            className="h-16 w-auto object-contain hidden dark:block"
          />
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 group
                  ${isActive
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }
                `}
              >
                <item.icon
                  className={`w-5 h-5 transition-colors ${isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground"}`}
                />
                <span className="font-medium text-sm">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Spacer to push profile section to bottom */}
      <div className="flex-1"></div>

      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer mb-2">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userInfo.name}`} />
            <AvatarFallback>{userInfo.initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-none truncate">{userInfo.name}</p>
            <p className="text-xs text-muted-foreground mt-1 truncate">{userInfo.role}</p>
          </div>
        </div>

        <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200">
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col shrink-0 h-screen sticky top-0 bg-white dark:bg-[#1e293b] border-r border-border/50 z-30 transition-colors duration-300">
        <NavContent />
      </aside>

      {/* Mobile Sidebar Trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <button className="p-2 rounded-lg bg-card border border-border text-foreground shadow-lg">
              <Menu className="w-6 h-6" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-card border-r border-border">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
