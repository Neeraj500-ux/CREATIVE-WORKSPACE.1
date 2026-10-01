import {
  Activity,
  AlarmClock,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CheckSquare2,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FolderKanban,
  Gauge,
  Goal,
  Grid2X2,
  KeyRound,
  Layers3,
  ListTodo,
  MessageSquareText,
  NotebookPen,
  Send,
  Settings2,
  TrendingUp,
  UserCircle,
  UserCog,
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
  /** Sidebar section heading */
  group: string;
  /** Reachable by route / search / profile menu, but not listed in the sidebar */
  hidden?: boolean;
}

const D: Role[] = ["director"];
const M: Role[] = ["manager"];
const TL: Role[] = ["team_leader"];
const E: Role[] = ["employee"];
const C: Role[] = ["client"];
const DMT: Role[] = ["director", "manager", "team_leader"];
const DM: Role[] = ["director", "manager"];
const MT: Role[] = ["manager", "team_leader"];
const ALL: Role[] = ["director", "manager", "team_leader", "employee", "client"];

const nav = (
  group: string,
  label: string,
  path: string,
  icon: LucideIcon,
  roles: Role[],
  description: string,
  permission?: Permission,
  hidden?: boolean,
): NavItem => ({ group, label, path, icon, roles, description, permission, hidden });

export const navItems: NavItem[] = [
  nav("Home", "Overview", "", Gauge, ALL, "Your role-aware command center"),

  /* ---------------- Director: manage the whole workspace ---------------- */
  nav("Manage", "Users", "people", UsersRound, D, "Create users, assign roles and manage access", "people:read"),
  nav("Manage", "Teams & Departments", "departments-teams", Users, D, "Organization hierarchy and teams", "people:read"),
  nav("Manage", "Clients", "clients", BriefcaseBusiness, D, "Accounts, health and follow-ups", "clients:read"),
  nav("Manage", "Spaces & Folders", "spaces", Layers3, D, "Organize work by business area", "workspace:read"),
  nav("Manage", "Roles & Access", "access", KeyRound, D, "Role permissions and account access", "settings:read"),

  /* ---------------- Manager: team leads and oversight ---------------- */
  nav("My team", "Team Leads", "team-leads", UserCog, M, "Your team leads, their load and delivery", "people:read"),
  nav("My team", "Team Members", "people", UsersRound, M, "People, reporting lines and access", "people:read"),
  nav("My team", "Teams", "departments-teams", Users, M, "Organization hierarchy and teams", "people:read"),
  nav("My team", "Spaces & Folders", "spaces", Layers3, M, "Organize work by business area", "workspace:read"),
  nav("My team", "Team Progress", "team-progress", TrendingUp, M, "Completion, overdue work and hours by person", "tasks:read"),

  /* ---------------- Team Lead: employees and delivery ---------------- */
  nav("My team", "My Employees", "employees", UsersRound, TL, "Your employees, workload and next tasks", "people:read"),
  nav("My team", "Directory", "people", Users, TL, "People and reporting lines", "people:read"),
  nav("My team", "Attendance", "attendance", CheckSquare2, TL, "Presence, hours and requests", "attendance:read"),
  nav("My team", "Team Performance", "performance", TrendingUp, TL, "Completion and delivery signals", "reports:read"),

  /* ---------------- Plan & deliver ---------------- */
  nav("Plan & deliver", "Projects", "projects", FolderKanban, DMT, "Health, progress and ownership", "projects:read"),
  nav("Plan & deliver", "Tasks", "tasks", ListTodo, DMT, "Work queue, deadlines and status", "tasks:read"),
  nav("Plan & deliver", "Task Assignments", "assign-tasks", ClipboardList, M, "Assign and reassign work to your people", "tasks:write"),
  nav("Plan & deliver", "Assign Tasks", "assign-tasks", ClipboardList, TL, "Give employees clear next actions", "tasks:write"),
  nav("Plan & deliver", "Board", "board", Grid2X2, DMT, "Move work through the team flow", "tasks:read"),
  nav("Plan & deliver", "Deadlines", "deadlines", AlarmClock, TL, "Overdue, due today and coming up", "tasks:read"),
  nav("Plan & deliver", "Calendar", "calendar", CalendarDays, DMT, "Deadlines, milestones and dates", "tasks:read"),
  nav("Plan & deliver", "Timeline", "timeline", Workflow, DMT, "See project sequencing at a glance", "projects:read"),
  nav("Plan & deliver", "Workload", "workload", BarChart3, DMT, "Balance capacity before it becomes risk", "tasks:read"),
  nav("Plan & deliver", "Goals", "goals", Goal, DMT, "Progress that connects to outcomes", "workspace:read"),

  /* ---------------- Review & report ---------------- */
  nav("Review & report", "Review Submissions", "review-submissions", CheckCircle2, MT, "Approve work or request changes", "tasks:write"),
  nav("Review & report", "Approvals", "approvals", ClipboardCheck, DMT, "Reviews, requests and decisions", "approvals:read"),
  nav("Review & report", "Reports", "reports", BarChart3, DMT, "Scoped performance and exports", "reports:read"),
  nav("Review & report", "Clients", "clients", BriefcaseBusiness, MT, "Accounts, health and follow-ups", "clients:read"),
  nav("Review & report", "Finance", "finance", CircleDollarSign, DM, "Budgets, invoices and spend", "finance:read"),
  nav("Review & report", "Attendance", "attendance", CheckSquare2, DM, "Presence, hours and requests", "attendance:read"),
  nav("Review & report", "Files", "files", FileText, DMT, "Shared, permission-aware assets", "files:read"),
  nav("Review & report", "Docs", "docs", NotebookPen, DMT, "A lightweight knowledge base", "workspace:read"),
  nav("Review & report", "Activity & Audit", "activity", Activity, D, "A transparent record of changes", "audit:read"),

  /* ---------------- Employee: my work ---------------- */
  nav("My work", "My Tasks", "my-tasks", ListTodo, E, "Everything assigned to you", "tasks:read"),
  nav("My work", "My Projects", "my-projects", FolderKanban, E, "Projects you contribute to", "projects:read"),
  nav("My work", "Task Board", "board", Grid2X2, E, "Move your work through the flow", "tasks:read"),
  nav("My work", "Work Updates", "work-updates", MessageSquareText, E, "Share progress on your tasks", "tasks:write"),
  nav("My work", "Submissions", "submissions", Send, E, "Submit finished work for review", "tasks:write"),
  nav("My work", "Calendar", "calendar", CalendarDays, E, "Your deadlines and dates", "tasks:read"),
  nav("Me", "Workload", "workload", BarChart3, E, "Your capacity at a glance", "tasks:read"),
  nav("Me", "Attendance", "attendance", CheckSquare2, E, "Check in and see your hours", "attendance:read"),
  nav("Me", "Goals", "goals", Goal, E, "Progress that connects to outcomes", "workspace:read"),
  nav("Me", "Files", "files", FileText, E, "Your shared assets", "files:read"),
  nav("Me", "Docs", "docs", NotebookPen, E, "Team knowledge base", "workspace:read"),

  /* ---------------- Client ---------------- */
  nav("Workspace", "Approvals", "approvals", ClipboardCheck, C, "Reviews, requests and decisions", "approvals:read"),
  nav("Workspace", "Files", "files", FileText, C, "Shared, permission-aware assets", "files:read"),

  /* ---------------- Workspace (everyone) ---------------- */
  nav("Workspace", "Notifications", "notifications", Bell, ALL, "Assignments, mentions and approvals"),
  nav("Workspace", "Settings", "settings", Settings2, D, "Workspace configuration and controls", "settings:read"),
  nav("Workspace", "Settings", "preferences", Settings2, ["manager", "team_leader", "employee"], "Your notification preferences"),
  nav("Workspace", "Profile", "profile", UserCircle, E, "Your details and reporting line"),
  nav("Workspace", "Profile", "profile", UserCircle, DMT, "Your details and reporting line", undefined, true),
];

const permissionsByRole: Record<Role, Permission[]> = {
  director: ["workspace:read", "people:read", "people:write", "clients:read", "clients:write", "projects:read", "projects:write", "tasks:read", "tasks:write", "finance:read", "finance:write", "reports:read", "attendance:read", "attendance:write", "approvals:read", "approvals:write", "files:read", "files:write", "settings:read", "settings:write", "audit:read"],
  manager: ["workspace:read", "people:read", "clients:read", "clients:write", "projects:read", "projects:write", "tasks:read", "tasks:write", "reports:read", "attendance:read", "approvals:read", "approvals:write", "files:read", "files:write"],
  team_leader: ["workspace:read", "people:read", "clients:read", "projects:read", "projects:write", "tasks:read", "tasks:write", "reports:read", "attendance:read", "attendance:write", "approvals:read", "approvals:write", "files:read", "files:write"],
  employee: ["workspace:read", "projects:read", "tasks:read", "tasks:write", "attendance:read", "attendance:write", "files:read", "files:write"],
  client: ["workspace:read", "projects:read", "tasks:read", "files:read", "approvals:read", "approvals:write"],
};

/** Read-only view of the role → permission model (used by Roles & Access). */
export const rolePermissions: Record<Role, Permission[]> = permissionsByRole;

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