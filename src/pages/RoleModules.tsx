import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AlarmClock, ArrowLeft, Check, CheckCircle2, ClipboardList, FolderKanban, KeyRound, ListTodo, MessageSquareText, Plus, Search, Send, Settings2, TrendingUp, Upload, UserCircle, UserCog, UsersRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { QuickAddModal } from "../components/QuickAddModal";
import { Avatar, Badge, Button, Card, EmptyState, ProgressBar, SectionHeading, SelectInput, useToast } from "../components/ui";
import { formatCompactDate, formatRelativeTime, isOverdue, roleLabels, statusTone } from "../lib/formatters";
import { getDashboardPath, getModulePath, hasPermission, rolePermissions } from "../lib/permissions";
import { firebaseStorage } from "../lib/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "../services/auth";
import { useWorkspace } from "../services/workspace";
import type { Priority, Project, Task, TaskStatus, UserProfile } from "../types";

/* Loose extensions so this file compiles whether or not these optional fields exist on your types. */
type TaskX = Task & { description?: string };
type ProjectX = Project & { managerId?: string; teamLeadId?: string };
type PersonX = UserProfile & { teamLeadId?: string };
type Data = ReturnType<typeof useWorkspace>["data"];
/* Patches are validated by the workspace service / backend rules; this keeps the call sites type-agnostic. */
const asPatch = (value: Record<string, unknown>) => value as never;

const META: Record<string, { title: string; description: string; eyebrow: string; icon: LucideIcon }> = {
  "team-leads": { title: "Team Leads", description: "See each lead's team, load and delivery at a glance.", eyebrow: "My team", icon: UserCog },
  employees: { title: "My Employees", description: "Know who is loaded, who is free and who needs a next task.", eyebrow: "My team", icon: UsersRound },
  "assign-tasks": { title: "Assign tasks", description: "Give your people clear next actions, and rebalance when plans change.", eyebrow: "Delivery", icon: ClipboardList },
  "team-progress": { title: "Team Progress", description: "Completion, overdue work and hours across your team.", eyebrow: "Insights", icon: TrendingUp },
  performance: { title: "Team Performance", description: "Delivery signals for the employees you lead.", eyebrow: "Insights", icon: TrendingUp },
  deadlines: { title: "Deadlines", description: "Overdue, due today and coming up, so nothing slips quietly.", eyebrow: "Planning", icon: AlarmClock },
  "review-submissions": { title: "Review Submissions", description: "Approve finished work or send it back with a clear note.", eyebrow: "Review", icon: CheckCircle2 },
  "my-tasks": { title: "My Tasks", description: "Everything assigned to you, in one focused list.", eyebrow: "My work", icon: ListTodo },
  "my-projects": { title: "My Projects", description: "The projects you contribute to and your part in them.", eyebrow: "My work", icon: FolderKanban },
  "work-updates": { title: "Work Updates", description: "Share short progress notes so your lead is never guessing.", eyebrow: "My work", icon: MessageSquareText },
  submissions: { title: "Submissions", description: "Submit finished work for review, with an optional file.", eyebrow: "My work", icon: Send },
  profile: { title: "My Profile", description: "Your details, reporting line and access.", eyebrow: "Account", icon: UserCircle },
  preferences: { title: "Settings", description: "Choose which updates reach you.", eyebrow: "Account", icon: Settings2 },
  access: { title: "Roles & Access", description: "See what each role can do and manage who has access.", eyebrow: "Control center", icon: KeyRound },
};
export const ROLE_MODULES = Object.keys(META);

/* ---------- helpers ---------- */
const ymd = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const addDays = (iso: string, days: number) => { const d = new Date(`${iso}T12:00:00`); d.setDate(d.getDate() + days); return ymd(d); };
const dayDiff = (iso: string) => Math.round((new Date(`${iso}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
const errMsg = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

export function downline(user: UserProfile, data: Data): PersonX[] {
  const others = (data.users as PersonX[]).filter((person) => person.id !== user.id && person.active && person.role !== "client");
  if (user.role === "director") return others.filter((person) => person.role !== "director");
  if (user.role === "manager") return others.filter((person) => ["team_leader", "employee"].includes(person.role) && (person.managerId === user.id || (!!user.departmentId && person.departmentId === user.departmentId)));
  if (user.role === "team_leader") return others.filter((person) => person.role === "employee" && (person.teamLeadId === user.id || (!!user.teamId && person.teamId === user.teamId)));
  return [];
}

const tasksOf = (data: Data, personId: string) => (data.tasks as TaskX[]).filter((task) => task.assigneeId === personId && !task.archived);
const statsFor = (tasks: Task[]) => {
  const done = tasks.filter((task) => task.status === "Completed").length;
  return {
    total: tasks.length, done, open: tasks.length - done,
    overdue: tasks.filter((task) => task.status !== "Completed" && isOverdue(task)).length,
    review: tasks.filter((task) => task.status === "In Review").length,
    pct: tasks.length ? Math.round((done / tasks.length) * 100) : 0,
    est: tasks.reduce((sum, task) => sum + (task.estimateHours || 0), 0),
    tracked: tasks.reduce((sum, task) => sum + (task.trackedHours || 0), 0),
  };
};

const stamp = (user: UserProfile, kind: string, text: string) => `[${kind} · ${ymd(new Date())} · ${user.name}] ${text.trim()}`;
const appendNote = (task: TaskX, line: string) => `${task.description ? `${task.description}\n\n` : ""}${line}`;
const NOTE = /^\[([A-Za-z ]+) · (\d{4}-\d{2}-\d{2}) · ([^\]]+)\] (.*)$/;
const notesOf = (task: TaskX, kind: string) => (task.description ?? "").split("\n").map((line) => NOTE.exec(line.trim())).filter((m): m is RegExpExecArray => !!m && m[1] === kind).map((m) => ({ date: m[2], by: m[3], text: m[4] }));
const lastNote = (task: TaskX, kind: string) => notesOf(task, kind).slice(-1)[0];

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return <label className={`rm-field${full ? " rm-full" : ""}`}><span>{label}</span>{children}</label>;
}
function Kpis({ items }: { items: { label: string; value: string | number; tone?: string }[] }) {
  return <div className="rm-kpis">{items.map((item) => <div className={`rm-kpi rm-${item.tone ?? "blue"}`} key={item.label}><small>{item.label}</small><strong>{item.value}</strong></div>)}</div>;
}
function Toolbar({ search, setSearch, children }: { search: string; setSearch: (value: string) => void; children?: ReactNode }) {
  return <div className="module-toolbar"><label className="inline-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search this view..." aria-label="Search this view" /></label>{children}</div>;
}

const rmStyles = `
.rm-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,160px),1fr));gap:12px;margin-bottom:16px}
.rm-kpi{padding:14px 16px;border:1px solid var(--line,#d9e7fa);border-radius:16px;background:var(--panel-strong,#fff);transition:transform .2s,box-shadow .2s}
.rm-kpi small{display:block;font-size:11px;color:var(--muted,#617695);font-weight:600}
.rm-kpi strong{display:block;margin-top:4px;font-size:24px;letter-spacing:-.03em;color:var(--text,#17335f)}
.rm-rose strong{color:#e11d48}.rm-green strong{color:#16a34a}.rm-blue strong{color:#2563eb}.rm-amber strong{color:#d97706}
.rm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,270px),1fr));gap:14px;margin-top:14px}
.rm-card{display:flex;flex-direction:column;gap:10px;min-width:0;padding:16px;border:1px solid var(--line,#d9e7fa);border-radius:18px;background:var(--panel-strong,#fff);transition:transform .2s,box-shadow .2s,border-color .2s}
.rm-card h3{margin:2px 0 0;font-size:15px}.rm-card p{margin:0;font-size:12px;color:var(--muted,#617695)}
.rm-card-top{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.rm-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.rm-stats span{display:flex;flex-direction:column;gap:2px;padding:8px;border-radius:12px;background:rgba(37,99,235,.06)}
.rm-stats small{font-size:10px;color:var(--muted,#617695)}.rm-stats strong{font-size:15px}
.rm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto}
.rm-two{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:16px;align-items:start}
.rm-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.rm-field{display:flex;flex-direction:column;gap:6px;min-width:0;font-size:12px;font-weight:600;color:var(--muted,#455e81)}
.rm-full{grid-column:1/-1}
.rm-field input,.rm-field select,.rm-field textarea{width:100%;min-height:44px;padding:10px 12px;border:1px solid var(--line-strong,#d5e1f2);border-radius:12px;background:var(--panel-strong,#fff);color:var(--text,#17335f);font:inherit;font-size:13px;outline:none;transition:border-color .2s,box-shadow .2s}
.rm-field textarea{min-height:96px;resize:vertical;line-height:1.6}
.rm-field input:focus,.rm-field select:focus,.rm-field textarea:focus{border-color:#629af3;box-shadow:0 0 0 3px rgba(37,99,235,.14)}
.rm-list{display:flex;flex-direction:column;gap:10px;margin-top:12px}
.rm-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;border:1px solid var(--line,#d9e7fa);border-radius:14px;background:var(--panel-strong,#fff);transition:border-color .2s,box-shadow .2s}
.rm-row-main{flex:1 1 220px;min-width:0}.rm-row-main strong{display:block;font-size:13px;overflow-wrap:anywhere}
.rm-row-main span,.rm-row-main small{display:block;font-size:11.5px;color:var(--muted,#617695);margin-top:2px;overflow-wrap:anywhere}
.rm-note{margin-top:6px;padding:7px 10px;border-left:3px solid #38bdf8;border-radius:8px;background:rgba(56,189,248,.09);font-size:12px;color:var(--text,#17335f)}
.rm-group-title{display:flex;align-items:center;gap:8px;margin:18px 0 0;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#617695)}
.rm-tabs{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 4px}
.rm-tabs button{border:1px solid var(--line,#d9e7fa);border-radius:10px;background:transparent;color:var(--muted,#617695);padding:8px 12px;font:inherit;font-size:12px;font-weight:700;cursor:pointer}
.rm-tabs button[aria-pressed=true]{background:#2563eb;border-color:#2563eb;color:#fff}
.rm-matrix{width:100%;border-collapse:collapse;font-size:12px}
.rm-matrix th,.rm-matrix td{padding:9px 10px;border-bottom:1px solid var(--line,#e3ecf8);text-align:center;white-space:nowrap}
.rm-matrix th:first-child,.rm-matrix td:first-child{text-align:left;position:sticky;left:0;background:var(--panel-strong,#fff)}
.rm-yes{color:#16a34a}.rm-no{color:#b6c3d8}
.rm-chart{height:280px}
.rm-switch{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--line,#e3ecf8);font-size:13px}
.rm-switch input{width:20px;height:20px;accent-color:#2563eb}
@media(hover:hover){.rm-card:hover{transform:translateY(-3px);border-color:#91b9f6;box-shadow:0 12px 26px rgba(55,105,164,.12)}.rm-row:hover{border-color:#91b9f6;box-shadow:0 6px 16px rgba(55,105,164,.08)}.rm-kpi:hover{transform:translateY(-2px)}}
@media(max-width:900px){.rm-two{grid-template-columns:1fr}}
@media(max-width:640px){.rm-form{grid-template-columns:1fr}.rm-stats{grid-template-columns:repeat(2,1fr)}.rm-field input,.rm-field select,.rm-field textarea{font-size:16px}.rm-actions>*{flex:1}}
@media(prefers-reduced-motion:reduce){.rm-card,.rm-kpi,.rm-row{transition:none}.rm-card:hover,.rm-kpi:hover{transform:none}}
`;

/* ---------- page shell ---------- */
export function RoleModulePage({ module }: { module: string }) {
  const { user } = useAuth();
  const { loading, mode } = useWorkspace();
  const navigate = useNavigate();
  const meta = META[module];
  if (!user || !meta) return null;
  const Icon = meta.icon;
  const body = (() => {
    switch (module) {
      case "team-leads": return <PeopleCards role="team_leader" />;
      case "employees": return <PeopleCards role="employee" />;
      case "assign-tasks": return <AssignTasks />;
      case "team-progress":
      case "performance": return <ProgressView />;
      case "deadlines": return <Deadlines />;
      case "review-submissions": return <ReviewSubmissions />;
      case "my-tasks": return <MyTasks />;
      case "my-projects": return <MyProjects />;
      case "work-updates": return <WorkUpdates />;
      case "submissions": return <Submissions />;
      case "profile": return <Profile />;
      case "preferences": return <Preferences />;
      case "access": return <Access />;
      default: return null;
    }
  })();
  return <div className="module-page"><style>{rmStyles}</style>
    <div className="module-heading"><div><button className="back-crumb" type="button" onClick={() => navigate(getDashboardPath(user.role))}><ArrowLeft size={14} /> Back to dashboard</button><div className="module-title-row"><span className="module-title-icon"><Icon size={22} /></span><div><div className="eyebrow">{meta.eyebrow}</div><h1>{module === "assign-tasks" && user.role === "manager" ? "Task Assignments" : meta.title}</h1><p>{meta.description}</p></div></div></div><div className="module-heading-actions"><Badge tone={mode === "firebase" ? "success" : "blue"} dot>{mode === "firebase" ? "Live data" : "Demo data"}</Badge></div></div>
    {loading ? <div className="module-loading"><div /><div /><div /></div> : body}
  </div>;
}

/* ---------- Team Leads (manager) / My Employees (team lead) ---------- */
function PeopleCards({ role }: { role: "team_leader" | "employee" }) {
  const { user } = useAuth(); const { data } = useWorkspace(); const navigate = useNavigate();
  const [search, setSearch] = useState(""); const [adding, setAdding] = useState(false);
  if (!user) return null;
  const list = downline(user, data).filter((person) => person.role === role && `${person.name} ${person.title} ${person.email}`.toLowerCase().includes(search.toLowerCase()));
  const all = downline(user, data).filter((person) => person.role === role);
  const totals = statsFor(all.flatMap((person) => tasksOf(data, person.id)));
  const canAdd = hasPermission(user, "people:write") && (role === "employee" || user.role === "director" || user.role === "manager");
  return <><Kpis items={[{ label: role === "employee" ? "Employees" : "Team leads", value: all.length }, { label: "Open tasks", value: totals.open }, { label: "Overdue", value: totals.overdue, tone: totals.overdue ? "rose" : "green" }, { label: "Completion", value: `${totals.pct}%`, tone: "green" }]} />
    <Card className="module-card"><Toolbar search={search} setSearch={setSearch}>{canAdd ? <Button icon={Plus} onClick={() => setAdding(true)}>Add {role === "employee" ? "employee" : "team lead"}</Button> : null}</Toolbar>
      {list.length ? <div className="rm-grid">{list.map((person) => {
        const s = statsFor(tasksOf(data, person.id));
        const reports = role === "team_leader" ? (data.users as PersonX[]).filter((candidate) => candidate.role === "employee" && candidate.teamLeadId === person.id).length : null;
        return <article className="rm-card" key={person.id}>
          <div className="rm-card-top"><Avatar name={person.name} size="lg" tone={role === "team_leader" ? "blue" : "cyan"} /><Badge tone={s.overdue ? "rose" : "success"} dot>{s.overdue ? `${s.overdue} overdue` : "On track"}</Badge></div>
          <div><h3>{person.name}</h3><p>{person.title}{reports !== null ? ` · ${reports} employees` : ""}</p></div>
          <div className="rm-stats"><span><small>Open</small><strong>{s.open}</strong></span><span><small>Review</small><strong>{s.review}</strong></span><span><small>Done</small><strong>{s.done}</strong></span><span><small>Hours</small><strong>{s.tracked}/{s.est}</strong></span></div>
          <ProgressBar value={s.pct} label={`${s.pct}% complete`} tone={s.overdue ? "amber" : "blue"} />
          <div className="rm-actions"><Button size="sm" variant="soft" icon={ClipboardList} onClick={() => navigate(`${getModulePath(user, "assign-tasks")}?assignee=${person.id}`)}>Assign task</Button><Button size="sm" variant="ghost" onClick={() => navigate(getModulePath(user, user.role === "manager" ? "team-progress" : "performance"))}>Progress</Button></div>
        </article>;
      })}</div> : <EmptyState icon={role === "employee" ? UsersRound : UserCog} title={`No ${role === "employee" ? "employees" : "team leads"} in your scope`} description="People assigned to you through reporting lines or your team will appear here." />}
    </Card>
    {adding ? <QuickAddModal open onClose={() => setAdding(false)} initialType="user" initialRole={role === "employee" ? "employee" : "team_leader"} /> : null}</>;
}

/* ---------- Assign tasks (manager + team lead) ---------- */
function AssignTasks() {
  const { user } = useAuth(); const { data, addTask, updateTask } = useWorkspace(); const { notify } = useToast(); const [params] = useSearchParams();
  const people = useMemo(() => (user ? downline(user, data) : []), [user, data]);
  const [form, setForm] = useState({ title: "", projectId: "", assigneeId: params.get("assignee") ?? "", priority: "Medium", dueDate: addDays(ymd(new Date()), 7), description: "" });
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const ids = new Set(people.map((person) => person.id));
  const recent = data.tasks.filter((task) => !task.archived && task.assigneeId && ids.has(task.assigneeId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) { notify("Please add a task title.", "error"); return; }
    if (!form.assigneeId || !ids.has(form.assigneeId)) { notify("Choose someone from your team.", "error"); return; }
    setBusy(true);
    try {
      await addTask({ title: form.title.trim(), projectId: form.projectId || undefined, assigneeId: form.assigneeId, priority: form.priority as Priority, dueDate: form.dueDate, description: form.description.trim() });
      notify("Task assigned.", "success");
      setForm((current) => ({ ...current, title: "", description: "" }));
    } catch (error) { notify(errMsg(error, "The task could not be assigned."), "error"); } finally { setBusy(false); }
  };
  const reassign = async (task: Task, assigneeId: string) => {
    try { await updateTask(task.id, asPatch({ assigneeId })); notify("Task reassigned.", "success"); } catch (error) { notify(errMsg(error, "Reassign failed."), "error"); }
  };
  if (!people.length) return <Card className="module-card"><EmptyState icon={UsersRound} title="No one to assign to yet" description="People who report to you will appear here once they are assigned to your team." /></Card>;
  return <div className="rm-two">
    <Card className="module-card"><SectionHeading eyebrow="New assignment" title="Create and assign" description="The assignee gets it in My Tasks straight away." />
      <form className="rm-form" onSubmit={submit} style={{ marginTop: 14 }}>
        <Field label="Task title *" full><input value={form.title} onChange={(event) => set("title", event.target.value)} placeholder="What needs to happen?" /></Field>
        <Field label="Assign to *"><select value={form.assigneeId} onChange={(event) => set("assigneeId", event.target.value)}><option value="">Choose person</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name} · {roleLabels[person.role]}</option>)}</select></Field>
        <Field label="Project"><select value={form.projectId} onChange={(event) => set("projectId", event.target.value)}><option value="">No project</option>{data.projects.filter((project) => !project.archived).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field>
        <Field label="Priority"><select value={form.priority} onChange={(event) => set("priority", event.target.value)}>{["Low", "Medium", "High", "Urgent"].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Due date"><input type="date" value={form.dueDate} onChange={(event) => set("dueDate", event.target.value)} /></Field>
        <Field label="Details" full><textarea value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="Context, links and what 'done' looks like…" /></Field>
        <div className="rm-full"><Button type="submit" icon={Plus} loading={busy} disabled={busy}>Assign task</Button></div>
      </form></Card>
    <Card className="module-card"><SectionHeading eyebrow="Recently assigned" title="Rebalance when needed" description="Change the assignee without leaving this page." />
      {recent.length ? <div className="rm-list">{recent.map((task) => <div className="rm-row" key={task.id}><div className="rm-row-main"><strong>{task.title}</strong><span>{task.priority} · Due {formatCompactDate(task.dueDate)} · {task.status}</span></div><SelectInput aria-label={`Assignee for ${task.title}`} value={task.assigneeId ?? ""} onChange={(event) => void reassign(task, event.target.value)}>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</SelectInput></div>)}</div> : <EmptyState icon={ClipboardList} title="Nothing assigned yet" description="Tasks you assign will show up here." />}</Card>
  </div>;
}

/* ---------- Team Progress / Team Performance ---------- */
function ProgressView() {
  const { user } = useAuth(); const { data } = useWorkspace();
  if (!user) return null;
  const people = downline(user, data);
  const rows = people.map((person) => ({ person, ...statsFor(tasksOf(data, person.id)) })).sort((a, b) => b.overdue - a.overdue || a.pct - b.pct);
  const total = statsFor(people.flatMap((person) => tasksOf(data, person.id)));
  const ids = new Set([user.id, ...people.map((person) => person.id)]);
  const projects = (data.projects as ProjectX[]).filter((project) => !project.archived && (project.ownerId === user.id || project.managerId === user.id || project.teamLeadId === user.id || project.memberIds.some((id) => ids.has(id))));
  const chart = rows.map((row) => ({ name: row.person.name.split(" ")[0], Completed: row.done, Open: row.open - row.overdue, Overdue: row.overdue }));
  if (!people.length) return <Card className="module-card"><EmptyState icon={TrendingUp} title="No team data yet" description="Progress appears once people report to you and have tasks." /></Card>;
  return <>
    <Kpis items={[{ label: "People", value: people.length }, { label: "Completion", value: `${total.pct}%`, tone: "green" }, { label: "Overdue", value: total.overdue, tone: total.overdue ? "rose" : "green" }, { label: "In review", value: total.review, tone: "amber" }, { label: "Hours tracked", value: `${total.tracked}/${total.est}` }]} />
    <Card className="module-card"><SectionHeading eyebrow="Delivery" title="Completed, open and overdue by person" />
      <div className="rm-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--line)" /><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 11 }} /><Tooltip contentStyle={{ background: "var(--panel-strong)", border: "1px solid var(--line-strong)", borderRadius: 12, color: "var(--text)", fontSize: 12 }} /><Bar dataKey="Completed" stackId="a" fill="#2563eb" /><Bar dataKey="Open" stackId="a" fill="#bae6fd" /><Bar dataKey="Overdue" stackId="a" fill="#f43f5e" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
    <Card className="module-card" style={{ marginTop: 16 }}><SectionHeading eyebrow="People" title="Who needs attention" />
      <div className="rm-list">{rows.map((row) => <div className="rm-row" key={row.person.id}><Avatar name={row.person.name} size="sm" /><div className="rm-row-main"><strong>{row.person.name}</strong><span>{roleLabels[row.person.role]} · {row.open} open · {row.review} in review · {row.tracked}/{row.est}h</span></div><div style={{ flex: "1 1 160px", minWidth: 120 }}><ProgressBar value={row.pct} label={`${row.pct}%`} tone={row.overdue ? "amber" : "blue"} /></div><Badge tone={row.overdue ? "rose" : "success"} dot>{row.overdue ? `${row.overdue} overdue` : "On track"}</Badge></div>)}</div></Card>
    <Card className="module-card" style={{ marginTop: 16 }}><SectionHeading eyebrow="Projects" title="Projects in your scope" />
      {projects.length ? <div className="rm-list">{projects.map((project) => <div className="rm-row" key={project.id}><span className="module-title-icon"><FolderKanban size={16} /></span><div className="rm-row-main"><strong>{project.name}</strong><span>Due {formatCompactDate(project.dueDate)} · {project.priority} priority</span></div><div style={{ flex: "1 1 160px", minWidth: 120 }}><ProgressBar value={project.progress} label={`${project.progress}%`} tone={project.health === "At risk" ? "amber" : project.health === "Delayed" ? "rose" : "blue"} /></div><Badge tone={statusTone(project.health)} dot>{project.health}</Badge></div>)}</div> : <EmptyState icon={FolderKanban} title="No projects in scope" description="Projects you own or your people contribute to will appear here." />}</Card>
  </>;
}

/* ---------- Deadlines (team lead) ---------- */
function Deadlines() {
  const { user } = useAuth(); const { data, updateTask } = useWorkspace(); const { notify } = useToast();
  if (!user) return null;
  const people = downline(user, data); const ids = new Set(people.map((person) => person.id));
  const rows = data.tasks.filter((task) => !task.archived && task.status !== "Completed" && task.assigneeId && ids.has(task.assigneeId)).map((task) => ({ task, d: dayDiff(task.dueDate) })).sort((a, b) => a.d - b.d);
  const groups: [string, typeof rows][] = [["Overdue", rows.filter((row) => row.d < 0)], ["Due today", rows.filter((row) => row.d === 0)], ["Next 7 days", rows.filter((row) => row.d > 0 && row.d <= 7)], ["Later", rows.filter((row) => row.d > 7)]];
  const patch = async (task: Task, change: Record<string, unknown>, message: string) => {
    try { await updateTask(task.id, asPatch(change)); notify(message, "success"); } catch (error) { notify(errMsg(error, "Update failed."), "error"); }
  };
  return <><Kpis items={groups.map(([label, items], index) => ({ label, value: items.length, tone: index === 0 && items.length ? "rose" : index === 1 ? "amber" : "blue" }))} />
    {rows.length ? groups.filter(([, items]) => items.length).map(([label, items]) => <div key={label}><div className="rm-group-title">{label} · {items.length}</div><div className="rm-list">{items.map(({ task, d }) => { const person = people.find((candidate) => candidate.id === task.assigneeId); return <div className="rm-row" key={task.id}><Avatar name={person?.name ?? "?"} size="sm" /><div className="rm-row-main"><strong>{task.title}</strong><span>{person?.name} · {data.projects.find((project) => project.id === task.projectId)?.name ?? "No project"} · {d < 0 ? `${-d}d late` : d === 0 ? "Today" : `in ${d}d`}</span></div><Badge tone={statusTone(task.priority)}>{task.priority}</Badge><Button size="sm" variant="ghost" onClick={() => void patch(task, { dueDate: addDays(task.dueDate < ymd(new Date()) ? ymd(new Date()) : task.dueDate, 2) }, "Deadline moved by 2 days.")}>+2 days</Button><SelectInput aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => void patch(task, { status: event.target.value as TaskStatus }, `Moved to ${event.target.value}.`)}>{(["Backlog", "In Progress", "In Review", "Completed"] as TaskStatus[]).map((status) => <option key={status}>{status}</option>)}</SelectInput></div>; })}</div></div>) : <Card className="module-card"><EmptyState icon={AlarmClock} title="No open deadlines" description="Open tasks assigned to your team will be grouped by urgency here." /></Card>}</>;
}

/* ---------- Review Submissions (manager + team lead) ---------- */
function ReviewSubmissions() {
  const { user } = useAuth(); const { data, updateTask } = useWorkspace(); const { notify } = useToast();
  if (!user) return null;
  const people = downline(user, data); const ids = new Set(people.map((person) => person.id));
  const queue = (data.tasks as TaskX[]).filter((task) => !task.archived && task.status === "In Review" && task.assigneeId && ids.has(task.assigneeId));
  const decide = async (task: TaskX, approve: boolean) => {
    let note = approve ? "Approved." : (window.prompt("What should change? (shown to the employee)") ?? "").trim();
    if (!approve && !note) { notify("Add a short note so the employee knows what to fix.", "error"); return; }
    if (approve) note = "Approved. Nice work.";
    try { await updateTask(task.id, asPatch({ status: approve ? "Completed" : "In Progress", description: appendNote(task, stamp(user, "Review", note)) })); notify(approve ? "Submission approved." : "Sent back with your note.", "success"); } catch (error) { notify(errMsg(error, "Review failed."), "error"); }
  };
  return <Card className="module-card"><SectionHeading eyebrow="Waiting on you" title={`${queue.length} submission${queue.length === 1 ? "" : "s"} to review`} description="Approve to complete the task, or request changes with a note." />
    {queue.length ? <div className="rm-list">{queue.map((task) => { const person = people.find((candidate) => candidate.id === task.assigneeId); const sub = lastNote(task, "Submission") ?? lastNote(task, "Update"); return <div className="rm-row" key={task.id}><Avatar name={person?.name ?? "?"} size="sm" /><div className="rm-row-main"><strong>{task.title}</strong><span>{person?.name} · {data.projects.find((project) => project.id === task.projectId)?.name ?? "No project"} · Due {formatCompactDate(task.dueDate)}</span>{sub ? <div className="rm-note">{sub.text}</div> : null}</div><div className="rm-actions"><Button size="sm" variant="soft" icon={Check} onClick={() => void decide(task, true)}>Approve</Button><Button size="sm" variant="ghost" icon={X} onClick={() => void decide(task, false)}>Request changes</Button></div></div>; })}</div> : <EmptyState icon={CheckCircle2} title="Nothing to review" description="When your people submit work, it will land here." />}</Card>;
}

/* ---------- Employee: My Tasks ---------- */
function MyTasks() {
  const { user } = useAuth(); const { data, updateTask } = useWorkspace(); const { notify } = useToast(); const navigate = useNavigate();
  const [tab, setTab] = useState("Open"); const [search, setSearch] = useState("");
  if (!user) return null;
  const mine = (data.tasks as TaskX[]).filter((task) => task.assigneeId === user.id && !task.archived);
  const tabs: Record<string, (task: Task) => boolean> = { Open: (t) => t.status !== "Completed", "Due today": (t) => t.status !== "Completed" && dayDiff(t.dueDate) === 0, Overdue: (t) => t.status !== "Completed" && isOverdue(t), "In review": (t) => t.status === "In Review", Completed: (t) => t.status === "Completed", All: () => true };
  const list = mine.filter((task) => tabs[tab](task) && `${task.title} ${task.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const s = statsFor(mine);
  const change = async (task: Task, status: TaskStatus) => { try { await updateTask(task.id, asPatch({ status })); notify(`Moved to ${status}.`, "success"); } catch (error) { notify(errMsg(error, "Update failed."), "error"); } };
  return <><Kpis items={[{ label: "Open", value: s.open }, { label: "Overdue", value: s.overdue, tone: s.overdue ? "rose" : "green" }, { label: "In review", value: s.review, tone: "amber" }, { label: "Completed", value: s.done, tone: "green" }]} />
    <Card className="module-card"><Toolbar search={search} setSearch={setSearch} /><div className="rm-tabs" role="group" aria-label="Task filter">{Object.keys(tabs).map((name) => <button type="button" key={name} aria-pressed={tab === name} onClick={() => setTab(name)}>{name}</button>)}</div>
      {list.length ? <div className="rm-list">{list.map((task) => { const review = lastNote(task, "Review"); return <div className="rm-row" key={task.id}><div className="rm-row-main"><strong>{task.title}</strong><span>{data.projects.find((project) => project.id === task.projectId)?.name ?? "No project"} · <span className={isOverdue(task) && task.status !== "Completed" ? "text-danger" : ""} style={{ display: "inline" }}>{task.status === "Completed" ? "Done" : isOverdue(task) ? "Overdue" : `Due ${formatCompactDate(task.dueDate)}`}</span></span>{review ? <div className="rm-note">Lead feedback: {review.text}</div> : null}</div><Badge tone={statusTone(task.priority)}>{task.priority}</Badge><Button size="sm" variant="ghost" icon={MessageSquareText} onClick={() => navigate(`${getModulePath(user, "work-updates")}?task=${task.id}`)}>Update</Button>{task.status !== "Completed" && task.status !== "In Review" ? <Button size="sm" variant="soft" icon={Send} onClick={() => navigate(`${getModulePath(user, "submissions")}?task=${task.id}`)}>Submit</Button> : null}<SelectInput aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => void change(task, event.target.value as TaskStatus)}>{(["Backlog", "In Progress", "In Review", "Completed"] as TaskStatus[]).map((status) => <option key={status}>{status}</option>)}</SelectInput></div>; })}</div> : <EmptyState icon={ListTodo} title="No tasks in this view" description="Try another filter. New assignments will appear here automatically." />}</Card></>;
}

/* ---------- Employee: My Projects ---------- */
function MyProjects() {
  const { user } = useAuth(); const { data } = useWorkspace(); const navigate = useNavigate();
  if (!user) return null;
  const myTasks = (data.tasks as TaskX[]).filter((task) => task.assigneeId === user.id && !task.archived);
  const projects = data.projects.filter((project) => !project.archived && (project.memberIds.includes(user.id) || myTasks.some((task) => task.projectId === project.id)));
  return <Card className="module-card">{projects.length ? <div className="rm-grid">{projects.map((project) => { const mine = statsFor(myTasks.filter((task) => task.projectId === project.id)); const owner = data.users.find((person) => person.id === project.ownerId); return <article className="rm-card" key={project.id}>
    <div className="rm-card-top"><span className="module-title-icon"><FolderKanban size={18} /></span><Badge tone={statusTone(project.health)} dot>{project.health}</Badge></div>
    <div><h3>{project.name}</h3><p>{data.clients.find((client) => client.id === project.clientId)?.company ?? "Internal"} · Owner {owner?.name ?? "—"}</p></div>
    <ProgressBar value={project.progress} label={`${project.progress}% project complete`} tone={project.health === "At risk" ? "amber" : project.health === "Delayed" ? "rose" : "blue"} />
    <div className="rm-stats"><span><small>My open</small><strong>{mine.open}</strong></span><span><small>Done</small><strong>{mine.done}</strong></span><span><small>Overdue</small><strong>{mine.overdue}</strong></span><span><small>Due</small><strong style={{ fontSize: 12 }}>{formatCompactDate(project.dueDate)}</strong></span></div>
    <div className="rm-actions"><Button size="sm" variant="soft" onClick={() => navigate(getModulePath(user, "my-tasks"))}>My tasks</Button></div></article>; })}</div> : <EmptyState icon={FolderKanban} title="No projects yet" description="Projects you are added to, or have tasks in, will show here." />}</Card>;
}

/* ---------- Employee: Work Updates ---------- */
function WorkUpdates() {
  const { user } = useAuth(); const { data, updateTask } = useWorkspace(); const { notify } = useToast(); const [params] = useSearchParams();
  const mine = (data.tasks as TaskX[]).filter((task) => user && task.assigneeId === user.id && !task.archived);
  const open = mine.filter((task) => task.status !== "Completed");
  const [taskId, setTaskId] = useState(params.get("task") ?? ""); const [text, setText] = useState(""); const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  if (!user) return null;
  const task = open.find((item) => item.id === taskId);
  const feed = mine.flatMap((item) => notesOf(item, "Update").map((note) => ({ ...note, task: item }))).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!task) { notify("Choose the task this update is about.", "error"); return; }
    if (!text.trim()) { notify("Write a short update first.", "error"); return; }
    setBusy(true);
    try { await updateTask(task.id, asPatch({ description: appendNote(task, stamp(user, "Update", text.replace(/\n+/g, " "))), ...(status && status !== task.status ? { status } : {}) })); notify("Update shared with your lead.", "success"); setText(""); setStatus(""); } catch (error) { notify(errMsg(error, "Update failed."), "error"); } finally { setBusy(false); }
  };
  return <div className="rm-two">
    <Card className="module-card"><SectionHeading eyebrow="Post an update" title="What moved forward?" description="One or two lines is enough." />
      <form className="rm-form" onSubmit={submit} style={{ marginTop: 14 }}>
        <Field label="Task *" full><select value={taskId} onChange={(event) => setTaskId(event.target.value)}><option value="">Choose task</option>{open.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
        <Field label="Update *" full><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Finished wireframes, waiting on client copy…" /></Field>
        <Field label="Change status (optional)"><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Keep current</option>{["Backlog", "In Progress", "In Review", "Completed"].map((item) => <option key={item}>{item}</option>)}</select></Field>
        <div className="rm-full"><Button type="submit" icon={Send} loading={busy} disabled={busy}>Share update</Button></div>
      </form></Card>
    <Card className="module-card"><SectionHeading eyebrow="History" title="Your recent updates" />
      {feed.length ? <div className="rm-list">{feed.map((item, index) => <div className="rm-row" key={`${item.task.id}-${index}`}><div className="rm-row-main"><strong>{item.task.title}</strong><span>{formatCompactDate(item.date)}</span><div className="rm-note">{item.text}</div></div></div>)}</div> : <EmptyState icon={MessageSquareText} title="No updates yet" description="Your posted updates will be listed here." />}</Card>
  </div>;
}

/* ---------- Employee: Submissions ---------- */
function Submissions() {
  const { user } = useAuth(); const { data, updateTask, addFile, mode } = useWorkspace(); const { notify } = useToast(); const [params] = useSearchParams();
  const mine = (data.tasks as TaskX[]).filter((task) => user && task.assigneeId === user.id && !task.archived);
  const [taskId, setTaskId] = useState(params.get("task") ?? ""); const [note, setNote] = useState(""); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false);
  if (!user) return null;
  const ready = mine.filter((task) => task.status === "In Progress" || task.status === "Backlog");
  const history = mine.filter((task) => task.status === "In Review" || notesOf(task, "Submission").length).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 10);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const task = ready.find((item) => item.id === taskId);
    if (!task) { notify("Choose the task you are submitting.", "error"); return; }
    if (!note.trim()) { notify("Add a short note for your reviewer.", "error"); return; }
    setBusy(true);
    try {
      let fileName = "";
      if (file) {
        let storagePath: string | undefined; let downloadUrl: string | undefined;
        if (mode === "firebase" && firebaseStorage) { storagePath = `organizations/${user.organizationId}/files/${Date.now()}-${file.name}`; const snapshot = await uploadBytes(ref(firebaseStorage, storagePath), file); downloadUrl = await getDownloadURL(snapshot.ref); }
        await addFile({ name: file.name, mimeType: file.type || "application/octet-stream", sizeBytes: file.size, uploaderId: user.id, visibility: "internal", archived: false, storagePath, downloadUrl });
        fileName = file.name;
      }
      await updateTask(task.id, asPatch({ status: "In Review", description: appendNote(task, stamp(user, "Submission", `${note.replace(/\n+/g, " ")}${fileName ? ` (file: ${fileName})` : ""}`)) }));
      notify("Submitted for review.", "success"); setNote(""); setFile(null); setTaskId("");
    } catch (error) { notify(errMsg(error, "Submission failed."), "error"); } finally { setBusy(false); }
  };
  return <div className="rm-two">
    <Card className="module-card"><SectionHeading eyebrow="Submit work" title="Ready for review?" description="Your lead gets it in Review Submissions." />
      <form className="rm-form" onSubmit={submit} style={{ marginTop: 14 }}>
        <Field label="Task *" full><select value={taskId} onChange={(event) => setTaskId(event.target.value)}><option value="">Choose task</option>{ready.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></Field>
        <Field label="Note for reviewer *" full><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="What is included, and anything to check first…" /></Field>
        <Field label="Attach a file (optional)" full><input type="file" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} /></Field>
        <div className="rm-full"><Button type="submit" icon={file ? Upload : Send} loading={busy} disabled={busy}>Submit for review</Button></div>
      </form></Card>
    <Card className="module-card"><SectionHeading eyebrow="Status" title="Your submissions" />
      {history.length ? <div className="rm-list">{history.map((task) => { const sub = lastNote(task, "Submission"); const review = lastNote(task, "Review"); return <div className="rm-row" key={task.id}><div className="rm-row-main"><strong>{task.title}</strong><span>{sub ? `Submitted ${formatCompactDate(sub.date)}` : `Updated ${formatRelativeTime(task.updatedAt)}`}</span>{review ? <div className="rm-note">Lead: {review.text}</div> : null}</div><Badge tone={task.status === "Completed" ? "success" : task.status === "In Review" ? "violet" : "blue"} dot>{task.status === "In Review" ? "Awaiting review" : task.status === "Completed" ? "Approved" : "Changes requested"}</Badge></div>; })}</div> : <EmptyState icon={Send} title="No submissions yet" description="Work you submit will be tracked here." />}</Card>
  </div>;
}

/* ---------- Profile ---------- */
function Profile() {
  const { user } = useAuth(); const { data, updateUser } = useWorkspace(); const { notify } = useToast();
  const [name, setName] = useState(user?.name ?? ""); const [title, setTitle] = useState(user?.title ?? ""); const [busy, setBusy] = useState(false);
  if (!user) return null;
  const me = user as PersonX;
  const find = (id?: string) => data.users.find((person) => person.id === id)?.name ?? "—";
  const s = statsFor(tasksOf(data, user.id));
  const perms = user.permissions ?? rolePermissions[user.role];
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !title.trim()) { notify("Name and job title are required.", "error"); return; }
    setBusy(true);
    try { await updateUser(user.id, asPatch({ name: name.trim(), title: title.trim() })); notify("Profile updated.", "success"); } catch (error) { notify(errMsg(error, "Profile update failed."), "error"); } finally { setBusy(false); }
  };
  return <div className="rm-two">
    <Card className="module-card"><div className="rm-card-top"><Avatar name={user.name} size="lg" tone="cyan" /><Badge tone="blue">{roleLabels[user.role]}</Badge></div>
      <form className="rm-form" onSubmit={save} style={{ marginTop: 16 }}>
        <Field label="Full name *"><input value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label="Job title *"><input value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
        <Field label="Email" full><input value={user.email ?? ""} readOnly /></Field>
        <div className="rm-full"><Button type="submit" loading={busy} disabled={busy}>Save profile</Button></div>
      </form></Card>
    <div><Card className="module-card"><SectionHeading eyebrow="Reporting line" title="Who you work with" />
      <div className="rm-list"><div className="rm-row"><div className="rm-row-main"><span>Manager</span><strong>{find(me.managerId)}</strong></div></div><div className="rm-row"><div className="rm-row-main"><span>Team lead</span><strong>{find(me.teamLeadId)}</strong></div></div><div className="rm-row"><div className="rm-row-main"><span>Team</span><strong>{data.teams.find((team) => team.id === me.teamId)?.name ?? "—"}</strong></div></div></div></Card>
      <Card className="module-card" style={{ marginTop: 16 }}><SectionHeading eyebrow="My work" title="At a glance" /><Kpis items={[{ label: "Open", value: s.open }, { label: "Done", value: s.done, tone: "green" }, { label: "Overdue", value: s.overdue, tone: s.overdue ? "rose" : "green" }]} /><div className="rm-tabs" aria-label="Your access">{perms.map((permission) => <Badge key={permission} tone="neutral">{permission}</Badge>)}</div></Card></div>
  </div>;
}

/* ---------- Settings (non-director roles): notification preferences ---------- */
const PREF_DEFAULTS = { assignments: true, deadlines: true, approvals: true, digest: false };
function Preferences() {
  const { user, logout } = useAuth(); const { notify } = useToast(); const navigate = useNavigate();
  const key = `cc:prefs:${user?.id ?? "anon"}`;
  const [prefs, setPrefs] = useState(() => { try { return { ...PREF_DEFAULTS, ...JSON.parse(localStorage.getItem(key) ?? "{}") } as typeof PREF_DEFAULTS; } catch { return PREF_DEFAULTS; } });
  if (!user) return null;
  const toggle = (name: keyof typeof PREF_DEFAULTS) => { const next = { ...prefs, [name]: !prefs[name] }; setPrefs(next); try { localStorage.setItem(key, JSON.stringify(next)); notify("Preference saved on this device.", "success"); } catch { notify("Could not save preferences in this browser.", "error"); } };
  const rows: [keyof typeof PREF_DEFAULTS, string][] = [["assignments", "New assignments"], ["deadlines", "Deadline reminders"], ["approvals", "Review and approval updates"], ["digest", "Weekly summary"]];
  return <div className="rm-two"><Card className="module-card"><SectionHeading eyebrow="Notifications" title="Choose what reaches you" description="Saved on this device." />{rows.map(([name, label]) => <label className="rm-switch" key={name}><span>{label}</span><input type="checkbox" checked={prefs[name]} onChange={() => toggle(name)} /></label>)}</Card>
    <Card className="module-card"><SectionHeading eyebrow="Account" title="Session" description={`Signed in as ${user.email}.`} /><div className="rm-actions" style={{ marginTop: 14 }}><Button variant="secondary" onClick={() => navigate(getDashboardPath(user.role) + "/profile")}>Open profile</Button><Button variant="danger" onClick={() => { void logout(); navigate("/login"); }}>Log out</Button></div></Card></div>;
}

/* ---------- Roles & Access (director) ---------- */
function Access() {
  const { user } = useAuth(); const { data, updateUser } = useWorkspace(); const { notify } = useToast();
  const [adding, setAdding] = useState<"employee" | "team_leader" | "manager" | null>(null);
  if (!user) return null;
  const roles = ["director", "manager", "team_leader", "employee", "client"] as const;
  const perms = Array.from(new Set(Object.values(rolePermissions).flat()));
  const people = data.users.filter((person) => person.id !== user.id);
  const toggle = async (person: UserProfile) => { try { await updateUser(person.id, asPatch({ active: !person.active, status: person.active ? "inactive" : "active" })); notify(`${person.name} is now ${person.active ? "inactive" : "active"}.`, "success"); } catch (error) { notify(errMsg(error, "Update failed."), "error"); } };
  return <>
    <Card className="module-card"><SectionHeading eyebrow="Permission model" title="What each role can do" description="Generated from the central permission model." action={hasPermission(user, "people:write") ? <div className="rm-actions"><Button size="sm" variant="soft" icon={Plus} onClick={() => setAdding("manager")}>Manager</Button><Button size="sm" variant="soft" icon={Plus} onClick={() => setAdding("team_leader")}>Team lead</Button><Button size="sm" variant="soft" icon={Plus} onClick={() => setAdding("employee")}>Employee</Button></div> : undefined} />
      <div className="table-scroll"><table className="rm-matrix"><thead><tr><th>Permission</th>{roles.map((role) => <th key={role}>{roleLabels[role]}</th>)}</tr></thead><tbody>{perms.map((permission) => <tr key={permission}><td>{permission}</td>{roles.map((role) => <td key={role}>{rolePermissions[role].includes(permission) ? <Check className="rm-yes" size={15} aria-label="Allowed" /> : <X className="rm-no" size={14} aria-label="Not allowed" />}</td>)}</tr>)}</tbody></table></div></Card>
    <Card className="module-card" style={{ marginTop: 16 }}><SectionHeading eyebrow="Accounts" title={`${people.length} workspace accounts`} description="Deactivate or reactivate access." />
      <div className="rm-list">{people.map((person) => <div className="rm-row" key={person.id}><Avatar name={person.name} size="sm" /><div className="rm-row-main"><strong>{person.name}</strong><span>{person.title} · {person.email}</span></div><Badge tone="blue">{roleLabels[person.role]}</Badge><Badge tone={person.active ? "success" : "neutral"} dot>{person.active ? "Active" : "Inactive"}</Badge><Button size="sm" variant="ghost" onClick={() => void toggle(person)}>{person.active ? "Deactivate" : "Activate"}</Button></div>)}</div></Card>
    {adding ? <QuickAddModal open onClose={() => setAdding(null)} initialType="user" initialRole={adding} /> : null}</>;
}