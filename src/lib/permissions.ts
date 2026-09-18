import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  CheckSquare2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  FolderKanban,
  Gauge,
  Goal,
  Grid2X2,
  Layers3,
  ListTodo,
  NotebookPen,
  Settings2,
  ShieldCheck,
  Users,
  UsersRound,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Permission, Role, UserProfile } from "../types";

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
  permission?: Permission;
  description: string;
}

const internalRoles: Role[] = ["director", "manager", "team_leader", "employee"];

export const navItems: NavItem[] = [
  { label: "Overview", path: "", icon: Gauge, roles: ["director", "manager", "team_leader", "employee", "client"], description: "Your role-aware command center" },
  { label: "People", path: "people", icon: UsersRound, roles: ["director", "manager", "team_leader"], permission: "people:read", description: "People, reporting lines and access" },
  { label: "Clients", path: "clients", icon: BriefcaseBusiness, roles: ["director", "manager", "team_leader"], permission: "clients:read", description: "Accounts, health and follow-ups" },
  { label: "Departments & Teams", path: "departments-teams", icon: Users, roles: ["director", "manager"], permission: "people:read", description: "Organization hierarchy and teams" },
  { label: "Spaces & Folders", path: "spaces", icon: Layers3, roles: ["director", "manager"], permission: "workspace:read", description: "Organize work by business area" },
  { label: "Projects", path: "projects", icon: FolderKanban, roles: internalRoles, permission: "projects:read", description: "Health, progress and ownership" },
  { label: "Tasks", path: "tasks", icon: ListTodo, roles: internalRoles, permission: "tasks:read", description: "Work queue, deadlines and status" },
  { label: "Board", path: "board", icon: Grid2X2, roles: internalRoles, permission: "tasks:read", description: "Move work through the team flow" },
  { label: "Calendar", path: "calendar", icon: CalendarDays, roles: internalRoles, permission: "tasks:read", description: "Deadlines, milestones and dates" },
  { label: "Timeline", path: "timeline", icon: Workflow, roles: ["director", "manager", "team_leader"], permission: "projects:read", description: "See project sequencing at a glance" },
  { label: "Workload", path: "workload", icon: BarChart3, roles: ["director", "manager", "team_leader", "employee"], permission: "tasks:read", description: "Balance capacity before it becomes risk" },
  { label: "Goals", path: "goals", icon: Goal, roles: ["director", "manager", "team_leader", "employee"], permission: "workspace:read", description: "Progress that connects to outcomes" },
  { label: "Attendance", path: "attendance", icon: CheckSquare2, roles: internalRoles, permission: "attendance:read", description: "Presence, hours and requests" },
  { label: "Approvals", path: "approvals", icon: ClipboardCheck, roles: internalRoles.concat(["client"]), permission: "approvals:read", description: "Reviews, requests and decisions" },
  { label: "Reports", path: "reports", icon: BarChart3, roles: ["director", "manager", "team_leader"], permission: "reports:read", description: "Scoped performance and exports" },
  { label: "Finance", path: "finance", icon: CircleDollarSign, roles: ["director", "manager"], permission: "finance:read", description: "Budgets, invoices and spend" },
  { label: "Files", path: "files", icon: FileText, roles: internalRoles.concat(["client"]), permission: "files:read", description: "Shared, permission-aware assets" },
  { label: "Docs", path: "docs", icon: NotebookPen, roles: internalRoles, permission: "workspace:read", description: "A lightweight knowledge base" },
  { label: "Notifications", path: "notifications", icon: ShieldCheck, roles: internalRoles.concat(["client"]), description: "Assignments, mentions and approvals" },
  { label: "Activity & Audit", path: "activity", icon: Activity, roles: ["director"], permission: "audit:read", description: "A transparent record of changes" },
  { label: "Settings", path: "settings", icon: Settings2, roles: ["director", "manager"], permission: "settings:read", description: "Workspace configuration and controls" },
];

const permissionsByRole: Record<Role, Permission[]> = {
  director: ["workspace:read", "people:read", "people:write", "clients:read", "clients:write", "projects:read", "projects:write", "tasks:read", "tasks:write", "finance:read", "finance:write", "reports:read", "attendance:read", "attendance:write", "approvals:read", "approvals:write", "files:read", "files:write", "settings:read", "settings:write", "audit:read"],
  manager: ["workspace:read", "people:read", "clients:read", "clients:write", "projects:read", "projects:write", "tasks:read", "tasks:write", "reports:read", "attendance:read", "approvals:read", "approvals:write", "files:read", "files:write"],
  team_leader: ["workspace:read", "people:read", "clients:read", "projects:read", "projects:write", "tasks:read", "tasks:write", "reports:read", "attendance:read", "attendance:write", "approvals:read", "approvals:write", "files:read", "files:write"],
  employee: ["workspace:read", "projects:read", "tasks:read", "tasks:write", "attendance:read", "attendance:write", "files:read", "files:write"],
  client: ["workspace:read", "projects:read", "tasks:read", "files:read", "approvals:read", "approvals:write"],
};

export const hasPermission = (user: UserProfile | null | undefined, permission: Permission) => {
  if (!user) return false;
  return user.permissions?.includes(permission) ?? permissionsByRole[user.role].includes(permission);
};

export const canAccess = (user: UserProfile | null | undefined, roles: Role[]) => Boolean(user && user.active && roles.includes(user.role));

export const canManageUser = (actor: UserProfile | null | undefined, target: UserProfile) => {
  if (!actor || !actor.active) return false;
  if (actor.role === "director") return target.id !== actor.id;
  if (actor.role === "manager") return ["team_leader", "employee"].includes(target.role) && (target.managerId === actor.id || target.departmentId === actor.departmentId);
  if (actor.role === "team_leader") return target.role === "employee" && target.teamId === actor.teamId;
  return false;
};

export const getDashboardPath = (role: Role) => `/${role === "team_leader" ? "team-lead" : role}`;

export const getVisibleNavigation = (user: UserProfile | null | undefined) => {
  if (!user) return [];
  return navItems.filter((item) => item.roles.includes(user.role) && (!item.permission || hasPermission(user, item.permission)));
};

export const getModulePath = (user: UserProfile, module: string) => `${getDashboardPath(user.role)}/${module}`;

export const roleHierarchy: Role[] = ["director", "manager", "team_leader", "employee", "client"];

export const roleLabel = (role: Role) => role.replace("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
