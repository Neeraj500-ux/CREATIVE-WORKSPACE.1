import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, doc, getDocs, query, setDoc, updateDoc, where } from "firebase/firestore";
import { cloneSeed, DEMO_ORGANIZATION_ID } from "../data/seed";
import { isOverdue } from "../lib/formatters";
import { db, firebaseEnabled } from "./firebase";
import { useAuth } from "./auth";
import type {
  ActivityItem,
  Approval,
  ApprovalStatus,
  AttendanceRecord,
  Client,
  Department,
  DocRecord,
  FileRecord,
  FinanceRecord,
  GoalRecord,
  NewApprovalInput,
  NewClientInput,
  NewFinanceInput,
  NewProjectInput,
  NewTaskInput,
  NewUserInput,
  NotificationItem,
  Project,
  Task,
  Team,
  UserProfile,
  WorkspaceData,
} from "../types";

const DATA_KEY = "creative-crew:workspace:v1";

interface WorkspaceContextValue {
  data: WorkspaceData;
  mode: "demo" | "firebase";
  loading: boolean;
  error: string | null;
  addClient: (input: NewClientInput) => Promise<Client>;
  updateClient: (id: string, patch: Partial<Client>) => Promise<void>;
  archiveClient: (id: string) => Promise<void>;
  addUser: (input: NewUserInput) => Promise<UserProfile>;
  updateUser: (id: string, patch: Partial<UserProfile>) => Promise<void>;
  addProject: (input: NewProjectInput) => Promise<Project>;
  updateProject: (id: string, patch: Partial<Project>) => Promise<void>;
  addTask: (input: NewTaskInput) => Promise<Task>;
  updateTask: (id: string, patch: Partial<Task>) => Promise<void>;
  addApproval: (input: NewApprovalInput) => Promise<Approval>;
  updateApproval: (id: string, status: ApprovalStatus) => Promise<void>;
  addFinance: (input: NewFinanceInput) => Promise<FinanceRecord>;
  addGoal: (input: Omit<GoalRecord, "id" | "organizationId">) => Promise<GoalRecord>;
  addFile: (input: Omit<FileRecord, "id" | "organizationId" | "createdAt">) => Promise<FileRecord>;
  markNotificationRead: (id: string) => Promise<void>;
  checkIn: (status?: AttendanceRecord["status"]) => Promise<void>;
  resetDemoData: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

const createId = (prefix: string) => {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 12) : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${random}`;
};

const nowIso = () => new Date().toISOString();

const readStoredData = () => {
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceData;
    if (!parsed.users || !parsed.projects || !parsed.tasks) return null;
    return parsed;
  } catch {
    return null;
  }
};

const persistDemoData = (data: WorkspaceData) => {
  try {
    window.localStorage.setItem(DATA_KEY, JSON.stringify(data));
  } catch {
    // The workspace remains usable if browser storage is unavailable.
  }
};

const readCollection = async <T,>(name: string, organizationId: string): Promise<T[]> => {
  if (!db) return [];
  const snapshot = await getDocs(query(collection(db, name), where("organizationId", "==", organizationId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
};

const loadFirebaseData = async (organizationId: string): Promise<WorkspaceData> => {
  const [users, departments, teams, clients, projects, tasks, activities, approvals, requests, attendance, files, docs, finance, goals, notifications] = await Promise.all([
    readCollection<UserProfile>("users", organizationId),
    readCollection<Department>("departments", organizationId),
    readCollection<Team>("teams", organizationId),
    readCollection<Client>("clients", organizationId),
    readCollection<Project>("projects", organizationId),
    readCollection<Task>("tasks", organizationId),
    readCollection<ActivityItem>("auditLogs", organizationId),
    readCollection<Approval>("approvals", organizationId),
    readCollection<WorkspaceData["requests"][number]>("requests", organizationId),
    readCollection<AttendanceRecord>("attendance", organizationId),
    readCollection<FileRecord>("files", organizationId),
    readCollection<DocRecord>("docs", organizationId),
    readCollection<FinanceRecord>("finance", organizationId),
    readCollection<GoalRecord>("goals", organizationId),
    readCollection<NotificationItem>("notifications", organizationId),
  ]);
  return { users, departments, teams, clients, projects, tasks, activities, approvals, requests, attendance, files, docs, finance, goals, notifications };
};

const scopeData = (data: WorkspaceData, user: UserProfile): WorkspaceData => {
  if (user.role === "director") return data;

  const userProjectIds = Array.isArray(user.projectIds) ? user.projectIds : [];
  const allProjects = data.projects.filter((project) => !project.archived);
  const projectIds = new Set(
    user.role === "client"
      ? allProjects.filter((project) => project.clientId === user.clientId || userProjectIds.includes(project.id)).map((project) => project.id)
      : user.role === "manager"
        ? allProjects.filter((project) => userProjectIds.includes(project.id) || project.managerId === user.id || project.departmentId === user.departmentId).map((project) => project.id)
        : user.role === "team_leader"
          ? allProjects.filter((project) => userProjectIds.includes(project.id) || project.teamId === user.teamId).map((project) => project.id)
          : allProjects.filter((project) => userProjectIds.includes(project.id)).map((project) => project.id),
  );

  const projects = allProjects.filter((project) => projectIds.has(project.id));
  const tasks = data.tasks.filter((task) => {
    if (user.role === "client") return Boolean(task.projectId && projectIds.has(task.projectId) && task.visibility === "client-safe");
    if (user.role === "employee") return task.assigneeId === user.id || Boolean(task.projectId && projectIds.has(task.projectId) && task.visibility === "client-safe");
    return Boolean(task.projectId && projectIds.has(task.projectId)) || task.assigneeId === user.id;
  });
  const taskAssigneeIds = new Set(tasks.map((task) => task.assigneeId).filter((id): id is string => Boolean(id)));
  const allowedUserIds = new Set([user.id, ...Array.from(taskAssigneeIds), ...projects.flatMap((project) => project.memberIds ?? []), ...projects.map((project) => project.managerId).filter((id): id is string => Boolean(id)), ...projects.map((project) => project.teamLeadId).filter((id): id is string => Boolean(id))]);
  const clients = data.clients.filter((client) => user.role === "client" ? client.id === user.clientId : projects.some((project) => project.clientId === client.id) || client.managerId === user.id);
  const approvals = data.approvals.filter((approval) => approval.requesterId === user.id || approval.reviewerId === user.id || (approval.projectId ? projectIds.has(approval.projectId) : false));
  const requests = data.requests.filter((request) => request.requesterId === user.id || request.reviewerId === user.id);
  const files = data.files.filter((file) => (file.visibility === "client-safe" || file.uploaderId === user.id) && (!file.projectId || projectIds.has(file.projectId)));
  const docs = data.docs.filter((docItem) => docItem.visibility === "client-safe" || docItem.authorId === user.id || (docItem.projectId ? projectIds.has(docItem.projectId) : false));
  const finance = user.role === "manager" ? data.finance.filter((item) => !item.projectId || projectIds.has(item.projectId)) : [];
  const departments = data.departments.filter((department) => !user.departmentId || department.id === user.departmentId || projects.some((project) => project.departmentId === department.id));
  const teams = data.teams.filter((team) => !user.teamId || team.id === user.teamId || projects.some((project) => project.teamId === team.id));
  const attendance = data.attendance.filter((record) => record.userId === user.id || allowedUserIds.has(record.userId));
  const activities = data.activities.filter((activity) => activity.actorId === user.id || Boolean(activity.entityId && (projectIds.has(activity.entityId) || tasks.some((task) => task.id === activity.entityId))));
  const goals = data.goals.filter((goal) => {
    const projectId = (goal as GoalRecord & { projectId?: string }).projectId;
    return goal.ownerId === user.id || (goal.scope === "Project" && Boolean(projectId && projects.some((project) => project.id === projectId)));
  });
  const notifications = data.notifications.filter((item) => item.userId === user.id);

  return { ...data, users: data.users.filter((candidate) => allowedUserIds.has(candidate.id)), departments, teams, clients, projects, tasks, approvals, requests, files, docs, finance, goals, attendance, activities, notifications };
};

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [allData, setAllData] = useState<WorkspaceData>(() => readStoredData() ?? cloneSeed());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      setError(null);
      if (!user) {
        setAllData(firebaseEnabled ? cloneSeed() : readStoredData() ?? cloneSeed());
        setLoading(false);
        return;
      }
      if (!firebaseEnabled) {
        setAllData(readStoredData() ?? cloneSeed());
        setLoading(false);
        return;
      }
      setLoading(true);
      const remote = await loadFirebaseData(user.organizationId);
      if (!cancelled) {
        setAllData(remote);
        setLoading(false);
      }
    };
    void hydrate().catch(() => {
      if (!cancelled) {
        setError("Workspace data could not be loaded. Check your Firebase rules and connection.");
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!firebaseEnabled) persistDemoData(allData);
  }, [allData]);

  const appendActivity = useCallback(async (action: string, entityType: string, entityId?: string) => {
    if (!user) return null;
    const activity: ActivityItem = { id: createId("activity"), organizationId: user.organizationId || DEMO_ORGANIZATION_ID, actorId: user.id, actorName: user.name, action, entityType, entityId, createdAt: nowIso() };
    if (firebaseEnabled && db) await setDoc(doc(db, "auditLogs", activity.id), activity);
    setAllData((previous) => ({ ...previous, activities: [activity, ...previous.activities] }));
    return activity;
  }, [user]);

  const saveRecord = useCallback(async (collectionName: string, id: string, record: object) => {
    if (firebaseEnabled && db) await setDoc(doc(db, collectionName, id), record);
  }, []);

  const patchRecord = useCallback(async (collectionName: string, id: string, patch: object) => {
    if (firebaseEnabled && db) await updateDoc(doc(db, collectionName, id), patch);
  }, []);

  const addClient = useCallback(async (input: NewClientInput) => {
    if (!user) throw new Error("You must be signed in to add a client.");
    const timestamp = nowIso();
    const client: Client = { id: createId("client"), organizationId: user.organizationId || DEMO_ORGANIZATION_ID, ...input, initials: input.company.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), projectIds: [], lastActivity: timestamp, attentionRequired: input.status === "At risk" || input.paymentStatus === "Overdue", archived: false, createdAt: timestamp, updatedAt: timestamp };
    await saveRecord("clients", client.id, client);
    setAllData((previous) => ({ ...previous, clients: [client, ...previous.clients] }));
    await appendActivity(`added ${client.company}`, "Client", client.id);
    return client;
  }, [appendActivity, saveRecord, user]);

  const updateClient = useCallback(async (id: string, patch: Partial<Client>) => {
    const update = { ...patch, updatedAt: nowIso() };
    await patchRecord("clients", id, update);
    setAllData((previous) => ({ ...previous, clients: previous.clients.map((client) => client.id === id ? { ...client, ...update } : client) }));
    await appendActivity("updated a client record", "Client", id);
  }, [appendActivity, patchRecord]);

  const archiveClient = useCallback(async (id: string) => updateClient(id, { archived: true, status: "Inactive" }), [updateClient]);

  const addUser = useCallback(async (input: NewUserInput) => {
    if (!user) throw new Error("You must be signed in to add a person.");
    const profile: UserProfile = { id: createId("user"), organizationId: user.organizationId || DEMO_ORGANIZATION_ID, ...input, initials: input.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), active: true, status: "pending", projectIds: [] };
    await saveRecord("users", profile.id, profile);
    setAllData((previous) => ({ ...previous, users: [profile, ...previous.users] }));
    await appendActivity(`created a pending ${input.role.replace("_", " ")} profile`, "People", profile.id);
    return profile;
  }, [appendActivity, saveRecord, user]);

  const updateUser = useCallback(async (id: string, patch: Partial<UserProfile>) => {
    const update = { ...patch };
    await patchRecord("users", id, update);
    setAllData((previous) => ({ ...previous, users: previous.users.map((candidate) => candidate.id === id ? { ...candidate, ...update } : candidate) }));
    await appendActivity("updated a people profile", "People", id);
  }, [appendActivity, patchRecord]);

  const addProject = useCallback(async (input: NewProjectInput) => {
    if (!user) throw new Error("You must be signed in to create a project.");
    const timestamp = nowIso();
    const project: Project = { id: createId("project"), organizationId: user.organizationId || DEMO_ORGANIZATION_ID, ...input, memberIds: Array.from(new Set([input.ownerId, input.managerId, input.teamLeadId].filter(Boolean) as string[])), status: "Planning", health: "On track", startDate: new Date().toISOString().slice(0, 10), spend: 0, progress: 0, milestoneCount: 0, archived: false, createdAt: timestamp, updatedAt: timestamp };
    await saveRecord("projects", project.id, project);
    setAllData((previous) => ({ ...previous, projects: [project, ...previous.projects] }));
    await appendActivity(`created ${project.name}`, "Project", project.id);
    return project;
  }, [appendActivity, saveRecord, user]);

  const updateProject = useCallback(async (id: string, patch: Partial<Project>) => {
    const update = { ...patch, updatedAt: nowIso() };
    await patchRecord("projects", id, update);
    setAllData((previous) => ({ ...previous, projects: previous.projects.map((project) => project.id === id ? { ...project, ...update } : project) }));
    await appendActivity("updated a project", "Project", id);
  }, [appendActivity, patchRecord]);

  const addTask = useCallback(async (input: NewTaskInput) => {
    if (!user) throw new Error("You must be signed in to create a task.");
    const timestamp = nowIso();
    const project = allData.projects.find((candidate) => candidate.id === input.projectId);
    const task: Task = { id: createId("task"), organizationId: user.organizationId || DEMO_ORGANIZATION_ID, ...input, clientId: project?.clientId, status: "Backlog", watcherIds: [], tags: [], estimateHours: 0, trackedHours: 0, checklistTotal: 0, checklistDone: 0, visibility: "internal", createdBy: user.id, updatedBy: user.id, archived: false, createdAt: timestamp, updatedAt: timestamp };
    await saveRecord("tasks", task.id, task);
    setAllData((previous) => ({ ...previous, tasks: [task, ...previous.tasks] }));
    await appendActivity(`created ${task.title}`, "Task", task.id);
    return task;
  }, [allData.projects, appendActivity, saveRecord, user]);

  const updateTask = useCallback(async (id: string, patch: Partial<Task>) => {
    if (!user) throw new Error("You must be signed in to update a task.");
    const update = { ...patch, updatedBy: user.id, updatedAt: nowIso() };
    await patchRecord("tasks", id, update);
    setAllData((previous) => ({ ...previous, tasks: previous.tasks.map((task) => task.id === id ? { ...task, ...update } : task) }));
    const action = patch.status ? `moved a task to ${patch.status}` : "updated a task";
    await appendActivity(action, "Task", id);
  }, [appendActivity, patchRecord, user]);

  const addApproval = useCallback(async (input: NewApprovalInput) => {
    if (!user) throw new Error("You must be signed in to create an approval.");
    const timestamp = nowIso();
    const approval: Approval = { id: createId("approval"), organizationId: user.organizationId || DEMO_ORGANIZATION_ID, ...input, status: "Pending", requesterId: user.id, createdAt: timestamp, updatedAt: timestamp };
    await saveRecord("approvals", approval.id, approval);
    setAllData((previous) => ({ ...previous, approvals: [approval, ...previous.approvals] }));
    await appendActivity(`submitted ${approval.title} for approval`, "Approval", approval.id);
    return approval;
  }, [appendActivity, saveRecord, user]);

  const updateApproval = useCallback(async (id: string, status: ApprovalStatus) => {
    const update = { status, updatedAt: nowIso() };
    await patchRecord("approvals", id, update);
    setAllData((previous) => ({ ...previous, approvals: previous.approvals.map((approval) => approval.id === id ? { ...approval, ...update } : approval) }));
    await appendActivity(`${status.toLowerCase()} an approval`, "Approval", id);
  }, [appendActivity, patchRecord]);

  const addFinance = useCallback(async (input: NewFinanceInput) => {
    if (!user) throw new Error("You must be signed in to add a finance record.");
    const record: FinanceRecord = { id: createId("finance"), organizationId: user.organizationId || DEMO_ORGANIZATION_ID, ...input, createdAt: nowIso() };
    await saveRecord("finance", record.id, record);
    setAllData((previous) => ({ ...previous, finance: [record, ...previous.finance] }));
    await appendActivity(`added ${record.title}`, "Finance", record.id);
    return record;
  }, [appendActivity, saveRecord, user]);

  const addGoal = useCallback(async (input: Omit<GoalRecord, "id" | "organizationId">) => {
    if (!user) throw new Error("You must be signed in to add a goal.");
    const goal: GoalRecord = { id: createId("goal"), organizationId: user.organizationId || DEMO_ORGANIZATION_ID, ...input };
    await saveRecord("goals", goal.id, goal);
    setAllData((previous) => ({ ...previous, goals: [goal, ...previous.goals] }));
    await appendActivity(`created ${goal.title}`, "Goal", goal.id);
    return goal;
  }, [appendActivity, saveRecord, user]);

  const addFile = useCallback(async (input: Omit<FileRecord, "id" | "organizationId" | "createdAt">) => {
    if (!user) throw new Error("You must be signed in to upload a file.");
    const file: FileRecord = { id: createId("file"), organizationId: user.organizationId || DEMO_ORGANIZATION_ID, ...input, createdAt: nowIso() };
    await saveRecord("files", file.id, file);
    setAllData((previous) => ({ ...previous, files: [file, ...previous.files] }));
    await appendActivity(`uploaded ${file.name}`, "File", file.id);
    return file;
  }, [appendActivity, saveRecord, user]);

  const markNotificationRead = useCallback(async (id: string) => {
    await patchRecord("notifications", id, { read: true });
    setAllData((previous) => ({ ...previous, notifications: previous.notifications.map((item) => item.id === id ? { ...item, read: true } : item) }));
  }, [patchRecord]);

  const checkIn = useCallback(async (status: AttendanceRecord["status"] = "Present") => {
    if (!user) throw new Error("You must be signed in to record attendance.");
    const date = new Date().toISOString().slice(0, 10);
    const current = allData.attendance.find((item) => item.userId === user.id && item.date === date);
    const record: AttendanceRecord = current ? { ...current, status } : { id: createId("attendance"), organizationId: user.organizationId || DEMO_ORGANIZATION_ID, userId: user.id, date, status, checkIn: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), hours: 0 };
    if (current) await patchRecord("attendance", current.id, { status });
    else await saveRecord("attendance", record.id, record);
    setAllData((previous) => ({ ...previous, attendance: current ? previous.attendance.map((item) => item.id === current.id ? record : item) : [record, ...previous.attendance] }));
    await appendActivity(`marked attendance as ${status}`, "Attendance", record.id);
  }, [allData.attendance, appendActivity, patchRecord, saveRecord, user]);

  const resetDemoData = useCallback(() => {
    const next = cloneSeed();
    setAllData(next);
    persistDemoData(next);
  }, []);

  const value = useMemo<WorkspaceContextValue>(() => ({
    data: user ? scopeData(allData, user) : allData,
    mode: firebaseEnabled ? "firebase" : "demo",
    loading,
    error,
    addClient,
    updateClient,
    archiveClient,
    addUser,
    updateUser,
    addProject,
    updateProject,
    addTask,
    updateTask,
    addApproval,
    updateApproval,
    addFinance,
    addGoal,
    addFile,
    markNotificationRead,
    checkIn,
    resetDemoData,
  }), [addApproval, addClient, addFile, addFinance, addGoal, addProject, addTask, addUser, allData, archiveClient, checkIn, error, loading, markNotificationRead, resetDemoData, updateApproval, updateClient, updateProject, updateTask, updateUser, user]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return context;
};

export const taskMetrics = (tasks: Task[]) => ({
  total: tasks.length,
  completed: tasks.filter((task) => task.status === "Completed").length,
  active: tasks.filter((task) => task.status === "In Progress").length,
  review: tasks.filter((task) => task.status === "In Review").length,
  overdue: tasks.filter(isOverdue).length,
});
