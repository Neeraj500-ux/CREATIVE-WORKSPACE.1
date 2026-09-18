export type Role = "director" | "manager" | "team_leader" | "employee" | "client";

export type Permission =
  | "workspace:read"
  | "people:read"
  | "people:write"
  | "clients:read"
  | "clients:write"
  | "projects:read"
  | "projects:write"
  | "tasks:read"
  | "tasks:write"
  | "finance:read"
  | "finance:write"
  | "reports:read"
  | "attendance:read"
  | "attendance:write"
  | "approvals:read"
  | "approvals:write"
  | "files:read"
  | "files:write"
  | "settings:read"
  | "settings:write"
  | "audit:read";

export type EntityStatus = "active" | "inactive" | "pending";
export type ClientStatus = "Active" | "Onboarding" | "At risk" | "Inactive";
export type PaymentStatus = "Paid" | "Due soon" | "Overdue" | "Not set";
export type TaskStatus = "Backlog" | "In Progress" | "In Review" | "Completed";
export type Priority = "Low" | "Medium" | "High" | "Urgent";
export type HealthStatus = "On track" | "At risk" | "Delayed" | "Completed";
export type ApprovalStatus = "Pending" | "Approved" | "Changes requested" | "Declined";

export interface UserProfile {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  initials: string;
  active: boolean;
  status: EntityStatus;
  departmentId?: string;
  teamId?: string;
  managerId?: string;
  teamLeadId?: string;
  clientId?: string;
  projectIds: string[];
  permissions?: Permission[];
  phone?: string;
  joiningDate?: string;
  avatarUrl?: string;
}

export interface Department {
  id: string;
  organizationId: string;
  name: string;
  leadId?: string;
  memberCount: number;
  projectIds: string[];
  color: string;
  archived: boolean;
}

export interface Team {
  id: string;
  organizationId: string;
  name: string;
  departmentId: string;
  leadId?: string;
  memberIds: string[];
  projectIds: string[];
  color: string;
  archived: boolean;
}

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  city: string;
  country: string;
  status: ClientStatus;
  paymentStatus: PaymentStatus;
  managerId?: string;
  teamLeadId?: string;
  projectIds: string[];
  budget: number;
  lastActivity: string;
  attentionRequired: boolean;
  portalAccess: boolean;
  notes?: string;
  initials: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  clientId?: string;
  ownerId: string;
  managerId?: string;
  teamLeadId?: string;
  departmentId?: string;
  teamId?: string;
  spaceId?: string;
  folderId?: string;
  memberIds: string[];
  status: "Planning" | "Active" | "Completed" | "Archived";
  priority: Priority;
  health: HealthStatus;
  startDate: string;
  dueDate: string;
  budget: number;
  spend: number;
  progress: number;
  description: string;
  milestoneCount: number;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId?: string;
  clientId?: string;
  spaceId?: string;
  folderId?: string;
  assigneeId?: string;
  watcherIds: string[];
  tags: string[];
  dueDate: string;
  startDate?: string;
  estimateHours: number;
  trackedHours: number;
  checklistTotal: number;
  checklistDone: number;
  visibility: "internal" | "client-safe";
  createdBy: string;
  updatedBy: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityItem {
  id: string;
  organizationId: string;
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
}

export interface Approval {
  id: string;
  organizationId: string;
  title: string;
  type: "Deliverable" | "Leave" | "Finance" | "Change request";
  status: ApprovalStatus;
  requesterId: string;
  reviewerId?: string;
  projectId?: string;
  amount?: number;
  dueDate?: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RequestItem {
  id: string;
  organizationId: string;
  title: string;
  type: "Leave" | "Equipment" | "Support" | "Change request";
  status: ApprovalStatus;
  requesterId: string;
  reviewerId?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  organizationId: string;
  userId: string;
  date: string;
  status: "Present" | "Remote" | "Leave" | "Absent";
  checkIn?: string;
  checkOut?: string;
  hours: number;
}

export interface FileRecord {
  id: string;
  organizationId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  uploaderId: string;
  projectId?: string;
  clientId?: string;
  storagePath?: string;
  downloadUrl?: string;
  visibility: "internal" | "client-safe";
  archived: boolean;
  createdAt: string;
}

export interface DocRecord {
  id: string;
  organizationId: string;
  title: string;
  excerpt: string;
  authorId: string;
  projectId?: string;
  visibility: "internal" | "client-safe";
  updatedAt: string;
  archived: boolean;
}

export interface FinanceRecord {
  id: string;
  organizationId: string;
  title: string;
  type: "Budget" | "Expense" | "Invoice" | "Payment";
  clientId?: string;
  projectId?: string;
  amount: number;
  status: "Draft" | "Pending" | "Approved" | "Paid" | "Overdue";
  dueDate?: string;
  createdAt: string;
}

export interface GoalRecord {
  id: string;
  organizationId: string;
  title: string;
  scope: "Organization" | "Department" | "Team" | "Project" | "Personal";
  ownerId: string;
  progress: number;
  dueDate: string;
  status: "On track" | "At risk" | "Complete";
}

export interface NotificationItem {
  id: string;
  organizationId: string;
  userId: string;
  title: string;
  body: string;
  type: "assignment" | "mention" | "deadline" | "approval" | "system";
  read: boolean;
  createdAt: string;
  entityType?: string;
  entityId?: string;
}

export interface WorkspaceData {
  users: UserProfile[];
  departments: Department[];
  teams: Team[];
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  activities: ActivityItem[];
  approvals: Approval[];
  requests: RequestItem[];
  attendance: AttendanceRecord[];
  files: FileRecord[];
  docs: DocRecord[];
  finance: FinanceRecord[];
  goals: GoalRecord[];
  notifications: NotificationItem[];
}

export type QuickAddType = "client" | "user" | "project" | "task" | "approval" | "finance" | "goal";

export interface NewClientInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  industry: string;
  city: string;
  country: string;
  status: ClientStatus;
  paymentStatus: PaymentStatus;
  managerId?: string;
  budget: number;
  portalAccess: boolean;
  notes: string;
}

export interface NewUserInput {
  name: string;
  email: string;
  title: string;
  role: Role;
  departmentId?: string;
  teamId?: string;
  managerId?: string;
  teamLeadId?: string;
}

export interface NewProjectInput {
  name: string;
  clientId?: string;
  ownerId: string;
  managerId?: string;
  teamLeadId?: string;
  priority: Priority;
  dueDate: string;
  budget: number;
  description: string;
}

export interface NewTaskInput {
  title: string;
  projectId?: string;
  assigneeId?: string;
  priority: Priority;
  dueDate: string;
  description: string;
}

export interface NewApprovalInput {
  title: string;
  type: Approval["type"];
  projectId?: string;
  reviewerId?: string;
  amount?: number;
  comment?: string;
}

export interface NewFinanceInput {
  title: string;
  type: FinanceRecord["type"];
  clientId?: string;
  projectId?: string;
  amount: number;
  status: FinanceRecord["status"];
  dueDate?: string;
}
