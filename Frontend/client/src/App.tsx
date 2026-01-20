import { Switch, Route, useLocation } from "wouter";
import BuildErrorPanel from "./components/BuildErrorPanel";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClientDataProvider } from "@/contexts/ClientDataContext";
import Login from "@/pages/Login";
import ChangePassword from "@/pages/ChangePassword";
import ProtectedRoute from "@/components/ProtectedRoute";
import ClientDashboard from "@/pages/ClientDashboard";
import RMDashboard from "@/pages/rm/RMDashboard";
import BMDashboard from "@/pages/bm/BMDashboard";
import ZMDashboard from "@/pages/zm/ZMDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import { useEffect } from "react";
import NotFound from "@/pages/not-found";

// Client pages
import ClientHoldings from "@/pages/client/ClientHoldings";
import ClientReports from "@/pages/client/ClientReports";
import ClientInsights from "@/pages/client/ClientInsights";
import ClientProfile from "@/pages/client/ClientProfile";

// RM pages
import RMHoldings from "@/pages/rm/RMHoldings";
import RMReports from "@/pages/rm/RMReports";
import RMInsights from "@/pages/rm/RMInsights";
import RMClients from "@/pages/rm/RMClients";
import RMProfile from "@/pages/rm/RMProfile";

// BM pages
import BMHoldings from "@/pages/bm/BMHoldings";
import BMReports from "@/pages/bm/BMReports";
import BMInsights from "@/pages/bm/BMInsights";
import BMClients from "@/pages/bm/BMClients";
import BMBranches from "@/pages/bm/BMBranches";
import BMProfile from "@/pages/bm/BMProfile";

// ZM pages
import ZMHoldings from "@/pages/zm/ZMHoldings";
import ZMReports from "@/pages/zm/ZMReports";
import ZMInsights from "@/pages/zm/ZMInsights";
import ZMClients from "@/pages/zm/ZMClients";
import ZMBranches from "@/pages/zm/ZMBranches";
import ZMZones from "@/pages/zm/ZMZones";
import ZMProfile from "@/pages/zm/ZMProfile";

// Admin pages
import AdminHoldings from "@/pages/admin/AdminHoldings";
import AdminReports from "@/pages/admin/AdminReports";
import AdminInsights from "@/pages/admin/AdminInsights";
import AdminClients from "@/pages/admin/AdminClients";
import AdminBranches from "@/pages/admin/AdminBranches";
import AdminZones from "@/pages/admin/AdminZones";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminAdministration from "@/pages/admin/AdminAdministration";
import AdminProfile from "@/pages/admin/AdminProfile";
import UnderDevelopment from "@/components/UnderDevelopment";

import RoleHierarchy from "@/pages/admin/RoleHierarchy";

function Redirect({ to }: { to?: string }) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (to) {
      setLocation(to);
    } else if (user) {
      // Role-based redirect
      const roleRoutes: Record<string, string> = {
        'client': '/client',
        'rm': '/relationship-manager',
        'relationship_manager': '/relationship-manager',
        'bm': '/branch-manager',
        'branch_manager': '/branch-manager',
        'zh': '/zonal-manager',
        'zonal_head': '/zonal-manager',
        'zm': '/zonal-manager',
        'zonal_manager': '/zonal-manager',
        'director': '/admin',
        'admin': '/admin',
        'super_admin': '/admin',
      };

      const redirectPath = roleRoutes[user.role] || '/admin';
      console.log('🔀 Redirect:', { userRole: user.role, redirectPath, user });
      setLocation(redirectPath);
    }
  }, [to, user, setLocation]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/change-password" component={ChangePassword} />
      <Route path="/">
        <ProtectedRoute>
          <Redirect />
        </ProtectedRoute>
      </Route>

      {/* Dashboard Routes */}
      <Route path="/client">
        <ProtectedRoute>
          <ClientDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/relationship-manager">
        <ProtectedRoute>
          <RMDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/branch-manager">
        <ProtectedRoute>
          <BMDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/zonal-manager">
        <ProtectedRoute>
          <ZMDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <ProtectedRoute>
          <AdminDashboard />
        </ProtectedRoute>
      </Route>

      {/* Client Routes */}
      <Route path="/client/holdings">
        <ProtectedRoute>
          <ClientHoldings />
        </ProtectedRoute>
      </Route>
      <Route path="/client/reports">
        <ProtectedRoute>
          <ClientReports />
        </ProtectedRoute>
      </Route>
      <Route path="/client/insights">
        <ProtectedRoute>
          <ClientInsights />
        </ProtectedRoute>
      </Route>
      <Route path="/client/profile">
        <ProtectedRoute>
          <ClientProfile />
        </ProtectedRoute>
      </Route>

      {/* RM Routes */}
      <Route path="/rm/holdings">
        <ProtectedRoute>
          <RMHoldings />
        </ProtectedRoute>
      </Route>
      <Route path="/rm/reports">
        <ProtectedRoute>
          <RMReports />
        </ProtectedRoute>
      </Route>
      <Route path="/rm/insights">
        <ProtectedRoute>
          <RMInsights />
        </ProtectedRoute>
      </Route>
      <Route path="/rm/clients">
        <ProtectedRoute>
          <RMClients />
        </ProtectedRoute>
      </Route>
      <Route path="/rm/profile">
        <ProtectedRoute>
          <RMProfile />
        </ProtectedRoute>
      </Route>

      {/* BM Routes */}
      <Route path="/bm/holdings">
        <ProtectedRoute>
          <BMHoldings />
        </ProtectedRoute>
      </Route>
      <Route path="/bm/reports">
        <ProtectedRoute>
          <BMReports />
        </ProtectedRoute>
      </Route>
      <Route path="/bm/insights">
        <ProtectedRoute>
          <BMInsights />
        </ProtectedRoute>
      </Route>
      <Route path="/bm/clients">
        <ProtectedRoute>
          <BMClients />
        </ProtectedRoute>
      </Route>
      <Route path="/bm/branches">
        <ProtectedRoute>
          <BMBranches />
        </ProtectedRoute>
      </Route>
      <Route path="/bm/profile">
        <ProtectedRoute>
          <BMProfile />
        </ProtectedRoute>
      </Route>

      {/* ZM Routes */}
      <Route path="/zm/holdings">
        <ProtectedRoute>
          <ZMHoldings />
        </ProtectedRoute>
      </Route>
      <Route path="/zm/reports">
        <ProtectedRoute>
          <ZMReports />
        </ProtectedRoute>
      </Route>
      <Route path="/zm/insights">
        <ProtectedRoute>
          <ZMInsights />
        </ProtectedRoute>
      </Route>
      <Route path="/zm/clients">
        <ProtectedRoute>
          <ZMClients />
        </ProtectedRoute>
      </Route>
      <Route path="/zm/branches">
        <ProtectedRoute>
          <ZMBranches />
        </ProtectedRoute>
      </Route>
      <Route path="/zm/zones">
        <ProtectedRoute>
          <ZMZones />
        </ProtectedRoute>
      </Route>
      <Route path="/zm/profile">
        <ProtectedRoute>
          <ZMProfile />
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/holdings">
        <ProtectedRoute>
          <AdminHoldings />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/reports">
        <ProtectedRoute>
          <AdminReports />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/insights">
        <ProtectedRoute>
          <AdminInsights />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/clients">
        <ProtectedRoute>
          <AdminClients />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/branches">
        <ProtectedRoute>
          <AdminBranches />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/zones">
        <ProtectedRoute>
          <AdminZones />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/analytics">
        <ProtectedRoute>
          <AdminAnalytics />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/administration">
        <ProtectedRoute>
          <AdminAdministration />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/role-permissions">
        <ProtectedRoute>
          <RoleHierarchy />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/profile">
        <ProtectedRoute>
          <AdminProfile />
        </ProtectedRoute>
      </Route>

      {/* Under Development Page */}
      <Route path="/under-development">
        <ProtectedRoute>
          <UnderDevelopment role="client" pageName="Feature" />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <BuildErrorPanel />
        <Toaster />
        <ClientDataProvider>
          <Router />
        </ClientDataProvider>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
