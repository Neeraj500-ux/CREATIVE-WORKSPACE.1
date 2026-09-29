import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckSquare2,
  CircleDollarSign,
  FilePlus2,
  Goal,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { hasPermission } from "../lib/permissions";
import { useAuth } from "../services/auth";
import { useWorkspace } from "../services/workspace";
import type { QuickAddType, Role } from "../types";
import { Button, Modal, useToast } from "./ui";

/* The supplied dashboard and workspace service use "team_leader". */
const TEAM_LEAD_ROLE = "team_leader";
const normalizeRole = (role: string) => {
  if (["team_lead", "team_leader", "leader"].includes(role))
    return "team_leader";
  if (role === "super_admin") return "director";
  if (role === "admin") return "manager";
  return role;
};
type Category = "All" | "People" | "Work" | "Business";
type Action = {
  id: string;
  type: QuickAddType;
  title: string;
  copy: string;
  category: Category;
  icon: LucideIcon;
  role?: string;
};
const ACTIONS: Action[] = [
  {
    id: "client",
    type: "client",
    title: "Add client",
    copy: "Client details, ownership and billing",
    category: "Business",
    icon: BriefcaseBusiness,
  },
  {
    id: "employee",
    type: "user",
    role: "employee",
    title: "Add employee",
    copy: "Department, team and reporting lead",
    category: "People",
    icon: UserRound,
  },
  {
    id: "team_leader",
    type: "user",
    role: TEAM_LEAD_ROLE,
    title: "Add team lead",
    copy: "Team ownership and reporting manager",
    category: "People",
    icon: Users,
  },
  {
    id: "manager",
    type: "user",
    role: "manager",
    title: "Add manager",
    copy: "Management profile and department",
    category: "People",
    icon: ShieldCheck,
  },
  {
    id: "project",
    type: "project",
    title: "Create project",
    copy: "Ownership, deadlines and budget",
    category: "Work",
    icon: FilePlus2,
  },
  {
    id: "task",
    type: "task",
    title: "Create task",
    copy: "Assignee, priority and next action",
    category: "Work",
    icon: CheckSquare2,
  },
  {
    id: "approval",
    type: "approval",
    title: "Request approval",
    copy: "Deliverable, leave, finance or change",
    category: "Work",
    icon: CheckSquare2,
  },
  {
    id: "finance",
    type: "finance",
    title: "Add finance record",
    copy: "Budget, expense, invoice or payment",
    category: "Business",
    icon: CircleDollarSign,
  },
  {
    id: "goal",
    type: "goal",
    title: "Create goal",
    copy: "Ownership, progress and target date",
    category: "Work",
    icon: Goal,
  },
];
const LABELS: Record<QuickAddType, string> = {
  client: "Add client",
  user: "Add team member",
  project: "Create project",
  task: "Create task",
  approval: "Request approval",
  finance: "Add finance record",
  goal: "Create goal",
};
const ROLES = [
  {
    value: "employee",
    title: "Employee",
    copy: "Contribute to assigned work",
    icon: UserRound,
  },
  {
    value: TEAM_LEAD_ROLE,
    title: "Team Lead",
    copy: "Coordinate team delivery",
    icon: Users,
  },
  {
    value: "manager",
    title: "Manager",
    copy: "Manage teams and projects",
    icon: ShieldCheck,
  },
];
const dateIn = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const initialForm = (
  type: QuickAddType | null,
  ownerId: string,
  role = "employee",
): Record<string, string> => {
  switch (type) {
    case "client":
      return {
        status: "Onboarding",
        paymentStatus: "Not set",
        portalAccess: "false",
        country: "India",
      };
    case "user":
      return { role };
    case "project":
      return { ownerId, priority: "Medium", dueDate: dateIn(14) };
    case "task":
      return { priority: "Medium", dueDate: dateIn(7) };
    case "approval":
      return { approvalType: "Deliverable" };
    case "finance":
      return { financeType: "Expense", financeStatus: "Draft" };
    case "goal":
      return {
        ownerId,
        scope: "Organization",
        progress: "0",
        goalStatus: "On track",
        dueDate: dateIn(30),
      };
    default:
      return {};
  }
};

type Option = { value: string; label: string };
type Field = {
  key: string;
  label: string;
  section: string;
  kind?: string;
  required?: boolean;
  placeholder?: string;
  options?: Option[];
  min?: number;
  max?: number;
  full?: boolean;
};
const options = (...values: string[]): Option[] =>
  values.map((value) => ({ value, label: value }));
const field = (
  key: string,
  label: string,
  section: string,
  extra: Partial<Field> = {},
): Field => ({ key, label, section, ...extra });

const styles = `
.qa,.qa *,.qa-footer,.qa-footer *{box-sizing:border-box}
.qa{--ink:#17335f;--muted:#617695;--blue:#2563eb;color:var(--ink);color-scheme:light;width:100%;min-width:0;font-size:14px}
.qa button,.qa input,.qa select,.qa textarea{font:inherit}
.qa button{cursor:pointer}
.qa button:disabled{cursor:not-allowed;opacity:.6}
.qa-panel{position:relative;isolation:isolate;min-width:0;border:1px solid #d9e7fa;border-radius:24px;padding:22px;background:radial-gradient(ellipse at 0 0,#dceeffa8,transparent 60%),linear-gradient(140deg,#ffffffed,#f2f8ffdf);box-shadow:0 16px 50px #2e60961a,inset 0 1px 0 #fff;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px);animation:qa-enter .3s ease both}
.qa-hero{display:flex;align-items:center;gap:13px;margin-bottom:20px;min-width:0}
.qa-hero-copy{flex:1;min-width:0}
.qa-eyebrow{display:block;color:#2563eb;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;margin-bottom:5px}
.qa h3{margin:0;font-size:20px;line-height:1.3;letter-spacing:-.035em;color:#17335f;overflow-wrap:anywhere}
.qa p{margin:6px 0 0;color:var(--muted);font-size:12px;line-height:1.6}
.qa-icon{display:grid;place-items:center;flex:0 0 auto;width:45px;height:45px;border:1px solid #d2e5ff;border-radius:15px;color:#2563eb;background:linear-gradient(140deg,#fff,#e1efff);box-shadow:inset 0 1px 0 #fff,0 6px 16px #2563eb0c}
.qa-hero>.qa-icon{width:54px;height:54px;border-radius:18px;background:linear-gradient(145deg,#dff5ff,#e5edff)}
.qa-tools{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-bottom:18px}
.qa-search{position:relative;display:flex;align-items:center;gap:9px;flex:1 1 210px;border:1px solid #d9e5f6;border-radius:13px;padding:0 12px;background:#ffffffdc;color:#6d86a8;min-width:0}
.qa-search input{border:0;background:transparent;min-width:0;width:100%;height:43px;color:#17335f;outline:none}
.qa-search:focus-within{border-color:#629af3;box-shadow:0 0 0 3px #2563eb15}
.qa-search button{border:0;background:none;color:#617695;display:grid;place-items:center;padding:5px}
.qa-filters{display:flex;flex-wrap:wrap;gap:5px;padding:4px;background:#eaf2fc;border:1px solid #dce7f5;border-radius:13px}
.qa-filter{border:0;border-radius:9px;background:transparent;color:#617695;padding:8px 11px;font-size:12px!important;font-weight:700!important}
.qa-filter[aria-pressed=true]{background:#fff;color:#2563eb;box-shadow:0 3px 9px #21467812}
.qa-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.qa-card{position:relative;display:flex;align-items:center;gap:12px;min-width:0;text-align:left;border:1px solid #dbe7f8;border-radius:17px;padding:15px;background:linear-gradient(140deg,#fff,#f5f9ff);color:#17335f;transition:transform .2s,border-color .2s,box-shadow .2s}
.qa-card-copy{display:flex;flex-direction:column;gap:5px;min-width:0;flex:1}
.qa-card strong{font-size:13px;line-height:1.4;overflow-wrap:anywhere}
.qa-card small{font-size:11px;line-height:1.5;color:#6a7f9e;overflow-wrap:anywhere}
.qa-arrow{flex-shrink:0;color:#7299cd}
.qa-count{display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;margin:16px 0 0;color:#6c819f;font-size:11px}
.qa-count span{display:inline-flex;align-items:center;gap:6px}
.qa-empty{text-align:center;padding:32px 16px;border:1px dashed #b9d1ef;border-radius:16px;color:#617695;line-height:1.6}
.qa-back{display:inline-flex;align-items:center;gap:6px;border:1px solid #d5e5fb;border-radius:10px;background:#f7fbff;color:#2563eb;padding:9px 11px;font-size:11px!important;flex-shrink:0}
.qa-action-bar{display:flex;gap:7px;overflow-x:auto;padding:4px 3px 12px;margin-bottom:15px;scrollbar-width:thin;scrollbar-color:#c4d7f2 transparent}
.qa-action-chip{display:inline-flex;align-items:center;gap:7px;flex-shrink:0;padding:9px 12px;border:1px solid #d8e5f6;border-radius:11px;background:#fff;color:#607795;font-size:11px!important;white-space:nowrap}
.qa-action-chip[aria-pressed=true]{background:linear-gradient(115deg,#2563eb,#197ae9);color:#fff;border-color:#2563eb;box-shadow:0 5px 12px #2563eb21}
.qa-fields{border:0;margin:0;padding:0;min-width:0}
.qa-section{border:0;margin:0;padding:0;min-width:0}
.qa-section+.qa-section{margin-top:22px;padding-top:19px;border-top:1px solid #dce8f7}
.qa-section-title{display:flex;align-items:center;gap:9px;margin:0 0 13px;font-size:12px;font-weight:800;color:#365986}
.qa-section-title span{width:24px;height:24px;display:grid;place-items:center;border-radius:8px;background:#e5efff;color:#2563eb;font-size:10px}
.qa-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}
.qa-field{display:flex;flex-direction:column;gap:7px;min-width:0;color:#455e81;font-size:12px;font-weight:600}
.qa-required{color:#2563eb}
.qa-field input,.qa-field select,.qa-field textarea{width:100%;max-width:100%;min-width:0;min-height:46px;border:1px solid #d5e1f2;border-radius:12px;padding:11px 12px;background:#ffffffeb;color:#17335f;box-shadow:0 3px 10px #3864a005;outline:none;font-size:13px;transition:border-color .2s,box-shadow .2s}
.qa-field input::placeholder,.qa-field textarea::placeholder{color:#899bb6;font-weight:400}
.qa-field textarea{min-height:110px;resize:vertical;line-height:1.6}
.qa-field input:focus,.qa-field select:focus,.qa-field textarea:focus{border-color:#75a4f2;box-shadow:0 0 0 4px #2563eb0e;background:#fff}
.qa-full{grid-column:1/-1}
.qa-role-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;margin-bottom:20px}
.qa-role{position:relative;display:flex;align-items:flex-start;gap:9px;text-align:left;padding:13px;border:1px solid #d5e3f6;border-radius:14px;background:#fff;color:#5b7396}
.qa-role>svg{flex-shrink:0;margin-top:2px}
.qa-role strong{display:block;font-size:12px;line-height:1.5}
.qa-role small{display:block;margin-top:4px;font-size:10px;line-height:1.5;color:#7286a3}
.qa-role[aria-pressed=true]{border-color:#80aef5;background:linear-gradient(135deg,#edf6ff,#fff);color:#2563eb;box-shadow:0 0 0 2px #2563eb09}
.qa-role-label{margin:0 0 10px;font-size:12px;font-weight:700;color:#365986}
.qa-error{border:1px solid #f2c5c5;background:#fff3f3;color:#a62e2e;border-radius:12px;padding:12px 14px;margin:0 0 16px;font-size:12px;line-height:1.6;outline:none}
.qa-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;width:100%;color:#617695;font-size:11px}
.qa-footer-actions{display:flex;align-items:center;gap:9px}
.qa-footer-actions>button{min-height:43px;border-radius:12px}
.qa button:focus-visible{outline:3px solid #93bafd;outline-offset:3px}
@media(hover:hover){.qa-card:hover{transform:translateY(-3px);border-color:#91b9f6;box-shadow:0 12px 26px #3769a415}.qa-back:hover,.qa-role:hover{background:#edf5ff}}
@keyframes qa-enter{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:720px){.qa-panel{padding:16px;border-radius:19px}.qa-grid{grid-template-columns:1fr}.qa-form-grid{grid-template-columns:1fr}.qa-hero{flex-wrap:wrap}.qa-hero-copy{flex-basis:calc(100% - 70px)}.qa-back{margin-left:auto}.qa h3{font-size:18px}.qa-footer{flex-direction:column;align-items:stretch}.qa-footer-actions{width:100%}.qa-footer-actions>*{flex:1;min-width:0}.qa-field input,.qa-field select,.qa-field textarea,.qa-search input{font-size:16px}.qa-tools{align-items:stretch}.qa-filters{width:100%;justify-content:space-between}.qa-filter{flex:1;padding:8px}.qa-role-grid{grid-template-columns:1fr}.qa-role small{margin-top:2px}.qa-role{align-items:center}}
@media(max-width:380px){.qa-panel{padding:12px}.qa-card{padding:12px;gap:9px}.qa-card .qa-icon{width:37px;height:37px;border-radius:12px}.qa-arrow{display:none}}
@media(prefers-reduced-motion:reduce){.qa *{animation:none!important;transition:none!important;scroll-behavior:auto!important}.qa-card:hover{transform:none}}
`;

export function QuickAddModal({
  open,
  onClose,
  initialType,
  initialRole,
}: {
  open: boolean;
  onClose: () => void;
  initialType?: QuickAddType;
  initialRole?: "employee" | "team_leader" | "manager";
}) {
  const { user } = useAuth();
  const {
    data,
    addClient,
    addUser,
    addProject,
    addTask,
    addApproval,
    addFinance,
    addGoal,
  } = useWorkspace();
  const { notify } = useToast();
  const formId = useId();
  const [type, setType] = useState<QuickAddType | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [category, setCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const busy = useRef(false);
  const session = useRef(0);
  const errorRef = useRef<HTMLDivElement>(null);
  const actorRole = normalizeRole(user?.role ?? "");
  // Only subordinate role options are exposed. Backend rules remain authoritative.
  const allowedRoles =
    actorRole === "director"
      ? ["employee", TEAM_LEAD_ROLE, "manager"]
      : actorRole === "manager"
        ? ["employee", TEAM_LEAD_ROLE]
        : actorRole === "team_leader"
          ? ["employee"]
          : [];
  const canCreate = (value: QuickAddType) => {
    if (!user) return false;
    switch (value) {
      case "client":
        return hasPermission(user, "clients:write");
      case "user":
        return hasPermission(user, "people:write") && allowedRoles.length > 0;
      case "project":
        return hasPermission(user, "projects:write");
      case "task":
        return hasPermission(user, "tasks:write");
      case "approval":
        return hasPermission(user, "approvals:write");
      case "finance":
        return hasPermission(user, "finance:write");
      case "goal":
        return actorRole === "director" || actorRole === "manager";
    }
  };
  const available = ACTIONS.filter(
    (action) =>
      canCreate(action.type) &&
      (!action.role || allowedRoles.includes(action.role)),
  );
  const availableKey = available.map((action) => action.id).join("|");
  useEffect(() => {
    session.current += 1;
    if (!open) return;
    const next =
      initialType &&
      availableKey
        .split("|")
        .some(
          (id) =>
            ACTIONS.find((action) => action.id === id)?.type === initialType,
        )
        ? initialType
        : null;
    setType(next);
    setForm({
      ...initialForm(
        next,
        user?.id ?? "",
        initialRole && availableKey.split("|").includes(initialRole)
          ? initialRole
          : "employee",
      ),
      ...(next === "user"
        ? {
            managerId: actorRole === "manager" ? (user?.id ?? "") : "",
            teamLeadId: actorRole === "team_leader" ? (user?.id ?? "") : "",
          }
        : {}),
    });
    setFormError("");
    setQuery("");
    setCategory("All");
  }, [open, initialType, initialRole, user?.id, actorRole, availableKey]);
  useEffect(() => {
    if (formError) errorRef.current?.focus();
  }, [formError]);
  useEffect(
    () => () => {
      session.current += 1;
    },
    [],
  );
  if (!user || !open) return null;

  const close = () => {
    if (!busy.current) onClose();
  };
  const set = (key: string, value: string) => {
    setFormError("");
    setForm((current) => ({ ...current, [key]: value }));
  };
  const changeRole = (role: string) => {
    if (busy.current || !allowedRoles.includes(role)) return;
    setForm((current) => ({
      ...current,
      role,
      managerId: actorRole === "manager" ? user.id : "",
      teamLeadId: actorRole === "team_leader" ? user.id : "",
    }));
    setFormError("");
  };
  const choose = (action: Action) => {
    if (busy.current || !available.some((item) => item.id === action.id))
      return;
    if (type === "user" && action.type === "user") {
      changeRole(action.role ?? "employee");
      return;
    }
    setType(action.type);
    setForm({
      ...initialForm(action.type, user.id, action.role),
      ...(action.type === "user"
        ? {
            managerId: actorRole === "manager" ? user.id : "",
            teamLeadId: actorRole === "team_leader" ? user.id : "",
          }
        : {}),
    });
    setFormError("");
  };
  const internalUsers = data.users.filter(
    (person) => normalizeRole(person.role) !== "client",
  );
  const managers = internalUsers.filter(
    (person) => normalizeRole(person.role) === "manager",
  );
  const leads = internalUsers.filter(
    (person) => normalizeRole(person.role) === "team_leader",
  );
  const peopleOptions = (
    people: typeof data.users,
    empty = "Unassigned",
  ): Option[] => [
    { value: "", label: empty },
    ...people.map((person) => ({ value: person.id, label: person.name })),
  ];
  const ownerOptions = peopleOptions(internalUsers, "Choose owner");
  if (!ownerOptions.some((option) => option.value === user.id))
    ownerOptions.push({ value: user.id, label: "Me" });
  const clientOptions = [
    { value: "", label: "No client / internal" },
    ...data.clients.map((client) => ({
      value: client.id,
      label: client.company,
    })),
  ];
  const projectOptions = [
    { value: "", label: "No project" },
    ...data.projects.map((project) => ({
      value: project.id,
      label: project.name,
    })),
  ];
  const basic = "Basic details",
    assignment = "Ownership & assignment",
    planning = "Planning",
    details = "Additional details";
  const name = (label: string, placeholder: string) =>
    field("name", label, basic, { required: true, placeholder });
  const title = (label: string, placeholder: string) =>
    field("title", label, basic, { required: true, placeholder });
  const email = field("email", "Email", basic, {
    kind: "email",
    required: true,
    placeholder: "name@company.com",
  });
  const manager = field("managerId", "Reporting manager", assignment, {
    options: peopleOptions(managers),
  });
  const lead = field("teamLeadId", "Team lead", assignment, {
    options: peopleOptions(leads),
  });
  const owner = field("ownerId", "Owner", assignment, {
    options: ownerOptions,
    required: true,
  });
  const project = field("projectId", "Project", assignment, {
    options: projectOptions,
  });
  const client = field("clientId", "Client", assignment, {
    options: clientOptions,
  });
  const due = field("dueDate", "Due date", planning, {
    kind: "date",
    required: true,
  });
  const budget = field("budget", "Budget (₹)", planning, {
    kind: "number",
    min: 0,
    placeholder: "0.00",
  });
  const amount = field("amount", "Amount (₹)", planning, {
    kind: "number",
    min: 0,
    required: true,
    placeholder: "0.00",
  });
  const priority = field("priority", "Priority", planning, {
    options: options("Low", "Medium", "High", "Urgent"),
  });
  const description = field("description", "Description", details, {
    kind: "textarea",
    full: true,
    placeholder: "Add useful context for your team…",
  });
  const schemas: Record<QuickAddType, Field[]> = {
    client: [
      name("Client name", "Sana Kapoor"),
      field("company", "Company", basic, {
        required: true,
        placeholder: "Aster Labs",
      }),
      email,
      field("phone", "Phone", basic, {
        kind: "tel",
        placeholder: "+91 98765 00000",
      }),
      field("industry", "Industry", basic, {
        placeholder: "Creative services",
      }),
      field("city", "City", basic, { placeholder: "Bengaluru" }),
      field("country", "Country", basic),
      { ...manager, label: "Assigned manager" },
      field("status", "Client status", planning, {
        options: options("Onboarding", "Active", "At risk", "Inactive"),
      }),
      field("paymentStatus", "Payment status", planning, {
        options: options("Not set", "Paid", "Due soon", "Overdue"),
      }),
      budget,
      field("portalAccess", "Portal access", planning, {
        options: [
          { value: "false", label: "Not enabled" },
          { value: "true", label: "Enabled" },
        ],
      }),
      field("notes", "Notes", details, {
        kind: "textarea",
        full: true,
        placeholder: "Context the team should know…",
      }),
    ],
    user: [
      name("Full name", "New teammate's name"),
      email,
      field("title", "Job title", basic, {
        required: true,
        placeholder: "Product Designer",
      }),
      field("departmentId", "Department", assignment, {
        options: [
          { value: "", label: "Unassigned" },
          ...data.departments.map((item) => ({
            value: item.id,
            label: item.name,
          })),
        ],
      }),
      field("teamId", "Team", assignment, {
        options: [
          { value: "", label: "Unassigned" },
          ...data.teams.map((item) => ({ value: item.id, label: item.name })),
        ],
      }),
      ...(form.role !== "manager" ? [manager] : []),
      ...(form.role === "employee" ? [lead] : []),
    ],
    project: [
      name("Project name", "New client project"),
      client,
      owner,
      manager,
      lead,
      priority,
      due,
      budget,
      description,
    ],
    task: [
      title("Task title", "What needs to happen?"),
      project,
      field("assigneeId", "Assignee", assignment, {
        options: peopleOptions(internalUsers),
      }),
      priority,
      due,
      description,
    ],
    approval: [
      title("Approval title", "Launch hero direction"),
      field("approvalType", "Approval type", basic, {
        required: true,
        options: options("Deliverable", "Leave", "Finance", "Change request"),
      }),
      project,
      field("reviewerId", "Reviewer", assignment, {
        options: peopleOptions(
          internalUsers.filter(
            (person) =>
              person.id !== user.id &&
              ["director", "manager", "team_leader"].includes(
                normalizeRole(person.role),
              ),
          ),
          "Choose reviewer",
        ),
      }),
      { ...amount, required: false },
      field("comment", "Comment", details, {
        kind: "textarea",
        full: true,
        placeholder: "Give the reviewer enough context…",
      }),
    ],
    finance: [
      title("Record title", "Invoice or expense name"),
      field("financeType", "Record type", basic, {
        required: true,
        options: options("Budget", "Expense", "Invoice", "Payment"),
      }),
      client,
      project,
      amount,
      field("financeStatus", "Status", planning, {
        options: options("Draft", "Pending", "Approved", "Paid", "Overdue"),
      }),
      { ...due, required: false },
    ],
    goal: [
      title("Goal title", "Improve on-time delivery"),
      field("scope", "Scope", basic, {
        required: true,
        options: options(
          "Organization",
          "Department",
          "Team",
          "Project",
          "Personal",
        ),
      }),
      owner,
      due,
      field("progress", "Starting progress (%)", planning, {
        kind: "number",
        min: 0,
        max: 100,
      }),
      field("goalStatus", "Health", planning, {
        options: options("On track", "At risk", "Complete"),
      }),
    ],
  };
  const fields = type ? schemas[type] : [];
  const sections = [...new Set(fields.map((item) => item.section))];
  const activeAction = available.find(
    (action) =>
      action.type === type && (type !== "user" || action.role === form.role),
  );
  const ActiveIcon = activeAction?.icon ?? UserPlus;
  const heading =
    activeAction?.title ??
    (type ? LABELS[type] : "What would you like to create?");
  const filtered = available.filter(
    (action) =>
      (category === "All" || category === action.category) &&
      `${action.title} ${action.copy}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const fail = (message: string) => {
    setFormError(message);
    notify(message, "error");
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!type || busy.current) return;
    if (!canCreate(type)) {
      fail("You no longer have permission to create this record.");
      return;
    }
    const clean = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value.trim()]),
    );
    for (const item of fields) {
      const value = clean[item.key] ?? "";
      if (item.required && !value) {
        fail(`Please complete ${item.label.toLowerCase()}.`);
        return;
      }
      if (
        item.kind === "email" &&
        value &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ) {
        fail("Please enter a valid email address.");
        return;
      }
      if (
        item.kind === "number" &&
        value &&
        (!Number.isFinite(Number(value)) ||
          (item.min !== undefined && Number(value) < item.min) ||
          (item.max !== undefined && Number(value) > item.max))
      ) {
        fail(`Please enter a valid ${item.label.toLowerCase()}.`);
        return;
      }
      if (
        item.options &&
        value &&
        !item.options.some((option) => option.value === value)
      ) {
        fail(`Please select a valid ${item.label.toLowerCase()}.`);
        return;
      }
    }
    if (type === "user" && !allowedRoles.includes(clean.role)) {
      fail("This role is not available for your account.");
      return;
    }
    if (
      type === "user" &&
      data.users.some(
        (person) =>
          person.email?.trim().toLowerCase() === clean.email.toLowerCase(),
      )
    ) {
      fail("A workspace member already uses this email address.");
      return;
    }
    busy.current = true;
    setSubmitting(true);
    setFormError("");
    const requestSession = session.current;
    try {
      switch (type) {
        case "client":
          await addClient({
            name: clean.name,
            company: clean.company,
            email: clean.email,
            phone: clean.phone ?? "",
            industry: clean.industry || "Creative services",
            city: clean.city ?? "",
            country: clean.country || "India",
            status: clean.status as
              "Active" | "Onboarding" | "At risk" | "Inactive",
            paymentStatus: clean.paymentStatus as
              "Paid" | "Due soon" | "Overdue" | "Not set",
            managerId: clean.managerId || undefined,
            budget: Number(clean.budget) || 0,
            portalAccess: clean.portalAccess === "true",
            notes: clean.notes ?? "",
          });
          break;
        case "user":
          await addUser({
            name: clean.name,
            email: clean.email,
            title: clean.title,
            role: clean.role as Role,
            departmentId: clean.departmentId || undefined,
            teamId: clean.teamId || undefined,
            managerId:
              clean.role !== "manager"
                ? clean.managerId || undefined
                : undefined,
            teamLeadId:
              clean.role === "employee"
                ? clean.teamLeadId || undefined
                : undefined,
          });
          break;
        case "project":
          await addProject({
            name: clean.name,
            clientId: clean.clientId || undefined,
            ownerId: clean.ownerId,
            managerId: clean.managerId || undefined,
            teamLeadId: clean.teamLeadId || undefined,
            priority: clean.priority as "Low" | "Medium" | "High" | "Urgent",
            dueDate: clean.dueDate,
            budget: Number(clean.budget) || 0,
            description: clean.description ?? "",
          });
          break;
        case "task":
          await addTask({
            title: clean.title,
            projectId: clean.projectId || undefined,
            assigneeId: clean.assigneeId || undefined,
            priority: clean.priority as "Low" | "Medium" | "High" | "Urgent",
            dueDate: clean.dueDate,
            description: clean.description ?? "",
          });
          break;
        case "approval":
          await addApproval({
            title: clean.title,
            type: clean.approvalType as
              "Deliverable" | "Leave" | "Finance" | "Change request",
            projectId: clean.projectId || undefined,
            reviewerId: clean.reviewerId || undefined,
            amount: clean.amount ? Number(clean.amount) : undefined,
            comment: clean.comment ?? "",
          });
          break;
        case "finance":
          await addFinance({
            title: clean.title,
            type: clean.financeType as
              "Budget" | "Expense" | "Invoice" | "Payment",
            clientId: clean.clientId || undefined,
            projectId: clean.projectId || undefined,
            amount: Number(clean.amount),
            status: clean.financeStatus as
              "Draft" | "Pending" | "Approved" | "Paid" | "Overdue",
            dueDate: clean.dueDate || undefined,
          });
          break;
        case "goal":
          await addGoal({
            title: clean.title,
            scope: clean.scope as
              "Organization" | "Department" | "Team" | "Project" | "Personal",
            ownerId: clean.ownerId,
            progress: Number(clean.progress) || 0,
            dueDate: clean.dueDate,
            status: clean.goalStatus as "On track" | "At risk" | "Complete",
          });
          break;
      }
      notify("Record saved successfully.", "success");
      if (session.current === requestSession) onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The record could not be saved. Please try again.";
      if (session.current === requestSession) setFormError(message);
      notify(message, "error");
    } finally {
      busy.current = false;
      setSubmitting(false);
    }
  };
  return (
    <>
      <style>{styles}</style>
      <Modal
        open={open}
        onClose={close}
        title={type ? heading : "Quick add"}
        subtitle={
          type
            ? "Add the details below to create your workspace record."
            : "People, projects and next steps — all in one place."
        }
        wide={Boolean(type)}
        footer={
          type ? (
            <div className="qa-footer">
              <span>
                <b>*</b> Required fields ·{" "}
                {submitting ? "Saving your record…" : "Ready when you are"}
              </span>
              <div className="qa-footer-actions">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={close}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form={formId}
                  loading={submitting}
                  disabled={submitting}
                >
                  {submitting ? "Saving…" : "Save record"}
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        <div className="qa">
          <div className="qa-panel">
            <div className="qa-hero">
              <span className="qa-icon">
                {type ? (
                  <ActiveIcon size={23} aria-hidden="true" />
                ) : (
                  <Sparkles size={24} aria-hidden="true" />
                )}
              </span>
              <div className="qa-hero-copy">
                <span className="qa-eyebrow">
                  {type ? "Create in workspace" : "Workspace shortcuts"}
                </span>
                <h3>{heading}</h3>
                <p>
                  {type
                    ? activeAction?.copy
                    : "Choose an action to keep your team moving."}
                </p>
              </div>
              {type && (
                <button
                  type="button"
                  className="qa-back"
                  disabled={submitting}
                  onClick={() => {
                    setType(null);
                    setForm({});
                    setFormError("");
                  }}
                >
                  <ArrowLeft size={14} aria-hidden="true" />
                  All actions
                </button>
              )}
            </div>
            {type ? (
              <>
                <nav className="qa-action-bar" aria-label="Quick add actions">
                  {available.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        type="button"
                        key={action.id}
                        className="qa-action-chip"
                        aria-pressed={activeAction?.id === action.id}
                        disabled={submitting}
                        onClick={() => choose(action)}
                      >
                        <Icon size={14} aria-hidden="true" />
                        {action.title}
                      </button>
                    );
                  })}
                </nav>
                {formError && (
                  <div
                    className="qa-error"
                    role="alert"
                    tabIndex={-1}
                    ref={errorRef}
                  >
                    {formError}
                  </div>
                )}
                <form id={formId} onSubmit={submit} aria-busy={submitting}>
                  <fieldset className="qa-fields" disabled={submitting}>
                    {type === "user" && (
                      <>
                        <div className="qa-role-label" id={`${formId}-roles`}>
                          Workspace role <span className="qa-required">*</span>
                        </div>
                        <div
                          className="qa-role-grid"
                          role="group"
                          aria-labelledby={`${formId}-roles`}
                        >
                          {ROLES.filter((role) =>
                            allowedRoles.includes(role.value),
                          ).map((role) => {
                            const Icon = role.icon;
                            return (
                              <button
                                className="qa-role"
                                type="button"
                                key={role.value}
                                aria-pressed={form.role === role.value}
                                onClick={() => changeRole(role.value)}
                              >
                                <Icon size={20} aria-hidden="true" />
                                <span>
                                  <strong>{role.title}</strong>
                                  <small>{role.copy}</small>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                    {sections.map((section, index) => (
                      <section
                        className="qa-section"
                        key={section}
                        aria-labelledby={`${formId}-section-${index}`}
                      >
                        <h4
                          className="qa-section-title"
                          id={`${formId}-section-${index}`}
                        >
                          <span aria-hidden="true">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          {section}
                        </h4>
                        <div className="qa-form-grid">
                          {fields
                            .filter((item) => item.section === section)
                            .map((item) => {
                              const inputId = `${formId}-${item.key}`;
                              const common = {
                                id: inputId,
                                name: item.key,
                                value: form[item.key] ?? "",
                                required: item.required,
                                onChange: (event: {
                                  target: { value: string };
                                }) => set(item.key, event.target.value),
                              };
                              return (
                                <label
                                  className={`qa-field${item.full ? " qa-full" : ""}`}
                                  htmlFor={inputId}
                                  key={item.key}
                                >
                                  <span>
                                    {item.label}
                                    {item.required && (
                                      <span className="qa-required"> *</span>
                                    )}
                                  </span>
                                  {item.options ? (
                                    <select {...common}>
                                      {item.options.map((option) => (
                                        <option
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  ) : item.kind === "textarea" ? (
                                    <textarea
                                      {...common}
                                      placeholder={item.placeholder}
                                      rows={4}
                                    />
                                  ) : (
                                    <input
                                      {...common}
                                      type={item.kind ?? "text"}
                                      placeholder={item.placeholder}
                                      min={item.min}
                                      max={item.max}
                                      step={
                                        item.kind === "number"
                                          ? "any"
                                          : undefined
                                      }
                                    />
                                  )}
                                </label>
                              );
                            })}
                        </div>
                      </section>
                    ))}
                  </fieldset>
                </form>
              </>
            ) : (
              <>
                <div className="qa-tools">
                  <div className="qa-search">
                    <Search size={17} aria-hidden="true" />
                    <input
                      type="search"
                      aria-label="Search quick actions"
                      placeholder="Search actions…"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                    />
                    {query && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        aria-label="Clear search"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                  <div
                    className="qa-filters"
                    role="group"
                    aria-label="Action category"
                  >
                    {(["All", "People", "Work", "Business"] as Category[]).map(
                      (value) => (
                        <button
                          type="button"
                          className="qa-filter"
                          key={value}
                          aria-pressed={category === value}
                          onClick={() => setCategory(value)}
                        >
                          {value}
                        </button>
                      ),
                    )}
                  </div>
                </div>
                {filtered.length ? (
                  <div className="qa-grid">
                    {filtered.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          type="button"
                          className="qa-card"
                          key={action.id}
                          disabled={submitting}
                          onClick={() => choose(action)}
                        >
                          <span className="qa-icon">
                            <Icon size={20} aria-hidden="true" />
                          </span>
                          <span className="qa-card-copy">
                            <strong>{action.title}</strong>
                            <small>{action.copy}</small>
                          </span>
                          <ArrowUpRight
                            size={17}
                            className="qa-arrow"
                            aria-hidden="true"
                          />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="qa-empty">
                    {available.length
                      ? "No actions match your search. Try another category or keyword."
                      : "Your current role does not have permission to create records."}
                  </div>
                )}
                <div className="qa-count">
                  <span>{filtered.length} actions available</span>
                  <span>
                    <ShieldCheck size={13} aria-hidden="true" />
                    Options follow your workspace permissions
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
