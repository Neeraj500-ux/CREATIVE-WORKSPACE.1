import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useParams } from "react-router-dom";
import { AccessDenied } from "./pages/AccessDenied";
import { Login } from "./pages/Login";
import { ModulePage } from "./pages/ModulePage";
import { NotFound } from "./pages/NotFound";
import { ResetPassword } from "./pages/ResetPassword";
import { RoleDashboard } from "./pages/RoleDashboard";
import { getDashboardPath, getVisibleNavigation } from "./lib/permissions";
import { useAuth } from "./services/auth";
import { LoadingState } from "./components/ui";
import AppShell from "./layouts/AppShell";

function FullPageLoading() {
  return <div className="full-page-state"><span className="brand-mark brand-mark-large">✦</span><LoadingState label="Loading creative-crew" /></div>;
}

function RequireAuth() {
  const { user, loading, authError } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoading />;
  if (!user) return authError ? <AccessDenied title="Workspace profile unavailable" description={authError} action={<Navigate to="/login" replace />} /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

function RoleGuard({ allowed }: { allowed: string[] }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allowed.includes(user.role)) return <AccessDenied />;
  return <Outlet />;
}

function ModuleRoute({ allowedRole }: { allowedRole: string }) {
  const { user } = useAuth();
  const { module } = useParams();
  if (!user || user.role !== allowedRole) return <AccessDenied />;
  const canView = getVisibleNavigation(user).some((item) => item.path === module);
  if (!module || !canView) return <NotFound />;
  return <ModulePage module={module} />;
}

function LandingRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? getDashboardPath(user.role) : "/login"} replace />;
}

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route element={<RequireAuth />}>
      <Route element={<AppShell />}>
        <Route path="/" element={<LandingRedirect />} />
        <Route path="/director" element={<RoleGuard allowed={["director"]} />}>
          <Route index element={<RoleDashboard />} />
          <Route path=":module" element={<ModuleRoute allowedRole="director" />} />
        </Route>
        <Route path="/manager" element={<RoleGuard allowed={["manager"]} />}>
          <Route index element={<RoleDashboard />} />
          <Route path=":module" element={<ModuleRoute allowedRole="manager" />} />
        </Route>
        <Route path="/team-lead" element={<RoleGuard allowed={["team_leader"]} />}>
          <Route index element={<RoleDashboard />} />
          <Route path=":module" element={<ModuleRoute allowedRole="team_leader" />} />
        </Route>
        <Route path="/employee" element={<RoleGuard allowed={["employee"]} />}>
          <Route index element={<RoleDashboard />} />
          <Route path=":module" element={<ModuleRoute allowedRole="employee" />} />
        </Route>
        <Route path="/client" element={<RoleGuard allowed={["client"]} />}>
          <Route index element={<RoleDashboard />} />
          <Route path=":module" element={<ModuleRoute allowedRole="client" />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Route>
  </Routes></BrowserRouter>;
}
