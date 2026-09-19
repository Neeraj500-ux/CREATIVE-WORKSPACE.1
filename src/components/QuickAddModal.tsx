import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckSquare2,
  CircleDollarSign,
  FilePlus2,
  Goal,
  Sparkles,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { hasPermission } from "../lib/permissions";
import { useAuth } from "../services/auth";
import { useWorkspace } from "../services/workspace";
import type { QuickAddType, Role } from "../types";
import { Button, Modal, SelectInput, TextArea, TextInput, useToast } from "./ui";

const labels: Record<QuickAddType, string> = {
  client: "Add client",
  user: "Add team member",
  project: "Create project",
  task: "Create task",
  approval: "Request approval",
  finance: "Add finance record",
  goal: "Create goal",
};

const icons: Record<QuickAddType, LucideIcon> = {
  client: BriefcaseBusiness,
  user: UserPlus,
  project: FilePlus2,
  task: CheckSquare2,
  approval: CheckSquare2,
  finance: CircleDollarSign,
  goal: Goal,
};

const descriptions: Record<QuickAddType, string> = {
  client: "Start a new account with a clear owner.",
  user: "Add a scoped profile to your workspace.",
  project: "Turn an idea into a trackable outcome.",
  task: "Capture the next action before it gets lost.",
  approval: "Keep a review, deliverable, or request moving.",
  finance: "Log a budget, invoice, payment, or expense.",
  goal: "Give the team a measurable direction.",
};

const dateIn = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const createInitialForm = (
  type: QuickAddType | null,
  ownerId = "",
): Record<string, string> => {
  switch (type) {
    case "client":
      return { status: "Onboarding", paymentStatus: "Not set", portalAccess: "false" };
    case "user":
      return { role: "employee" };
    case "project":
      return { ownerId, priority: "Medium", dueDate: dateIn(14) };
    case "task":
      return { priority: "Medium", dueDate: dateIn(7) };
    case "approval":
      return { approvalType: "Deliverable" };
    case "finance":
      return { financeType: "Expense", financeStatus: "Draft" };
    case "goal":
      return { ownerId, scope: "Organization", progress: "0", goalStatus: "On track", dueDate: dateIn(30) };
    default:
      return {};
  }
};

const quickAddStyles = `
  .quick-add-modal {
    --qa-ink: #17335f;
    --qa-muted: #60759a;
    --qa-border: rgba(65, 121, 209, 0.2);
    --qa-blue: #2563eb;
    --qa-cyan: #0891b2;
    width: 100%;
    max-width: 100%;
    overflow: visible;
    color-scheme: light;
    color: var(--qa-ink);
  }

  .quick-add-modal,
  .quick-add-modal * {
    box-sizing: border-box;
  }

  .quick-add-modal button,
  .quick-add-modal input,
  .quick-add-modal select,
  .quick-add-modal textarea {
    font: inherit;
  }

  .quick-add-picker,
  .quick-add-form-shell {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    border: 1px solid var(--qa-border);
    border-radius: 24px;
    background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(239, 247, 255, 0.84)),
      rgba(247, 251, 255, 0.88);
    box-shadow:
      0 24px 70px rgba(56, 92, 150, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(24px) saturate(135%);
    -webkit-backdrop-filter: blur(24px) saturate(135%);
    animation: quickAddEnter 420ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  .quick-add-picker::before,
  .quick-add-form-shell::before {
    position: absolute;
    z-index: -1;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(78, 158, 255, 0.2), transparent 68%);
    content: "";
    pointer-events: none;
    animation: quickAddFloat 9s ease-in-out infinite alternate;
  }

  .quick-add-picker::before {
    top: -145px;
    right: -80px;
  }

  .quick-add-form-shell::before {
    bottom: -165px;
    left: -90px;
    animation-delay: -3s;
  }

  .quick-add-picker::after,
  .quick-add-form-shell::after {
    position: absolute;
    z-index: -1;
    inset: 0;
    background: linear-gradient(115deg, transparent 22%, rgba(255, 255, 255, 0.7) 50%, transparent 74%);
    content: "";
    pointer-events: none;
    transform: translateX(-110%);
    animation: quickAddSheen 11s ease-in-out infinite;
  }

  .quick-add-picker {
    padding: 22px;
  }

  .quick-add-picker-intro,
  .quick-add-form-banner {
    position: relative;
    z-index: 1;
  }

  .quick-add-picker-intro {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
  }

  .quick-add-orb,
  .quick-add-form-icon {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    border: 1px solid rgba(37, 99, 235, 0.2);
    background: linear-gradient(145deg, #e0f2fe, #dbeafe);
    color: var(--qa-blue);
    box-shadow: 0 0 26px rgba(56, 145, 245, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.95);
    animation: quickAddIconPulse 5.5s ease-in-out infinite;
  }

  .quick-add-orb {
    width: 52px;
    height: 52px;
    border-radius: 17px;
  }

  .quick-add-picker-kicker,
  .quick-add-form-kicker {
    display: block;
    margin-bottom: 4px;
    color: var(--qa-blue);
    font-size: 0.65rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .quick-add-picker-title,
  .quick-add-form-title {
    display: block;
    color: #17335f;
    font-size: 1.08rem;
    font-weight: 750;
    letter-spacing: -0.02em;
  }

  .quick-add-picker-copy {
    margin: 4px 0 0;
    color: #60759a;
    font-size: 0.82rem;
    line-height: 1.5;
  }

  .quick-actions-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .quick-action-card {
    position: relative;
    display: flex;
    min-width: 0;
    min-height: 84px;
    align-items: center;
    gap: 12px;
    overflow: hidden;
    padding: 14px;
    border: 1px solid rgba(75, 125, 205, 0.16);
    border-radius: 18px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(239, 247, 255, 0.72));
    color: var(--qa-ink);
    text-align: left;
    cursor: pointer;
    transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease, transform 180ms ease;
  }

  .quick-action-card::before {
    position: absolute;
    inset: 0;
    background: linear-gradient(110deg, transparent 28%, rgba(255, 255, 255, 0.09) 50%, transparent 72%);
    content: "";
    transform: translateX(-120%);
    transition: transform 650ms ease;
  }

  .quick-action-card:hover {
    border-color: rgba(37, 99, 235, 0.38);
    background: linear-gradient(135deg, rgba(224, 242, 254, 0.96), rgba(255, 255, 255, 0.88));
    box-shadow: 0 14px 32px rgba(42, 94, 166, 0.16), 0 0 0 1px rgba(87, 169, 255, 0.12) inset;
    transform: translateY(-3px);
  }

  .quick-action-card:hover::before {
    transform: translateX(120%);
  }

  .quick-action-card:focus-visible,
  .quick-add-change:focus-visible {
    outline: 3px solid rgba(37, 99, 235, 0.28);
    outline-offset: 3px;
  }

  .quick-action-icon {
    position: relative;
    z-index: 1;
    display: grid;
    flex: 0 0 auto;
    width: 42px;
    height: 42px;
    place-items: center;
    border: 1px solid rgba(37, 99, 235, 0.16);
    border-radius: 14px;
    background: linear-gradient(145deg, #eff6ff, #dbeafe);
    color: var(--qa-blue);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.96);
    transition: transform 220ms ease, box-shadow 220ms ease, background 220ms ease;
  }

  .quick-action-card:hover .quick-action-icon {
    background: linear-gradient(145deg, #dbeafe, #cffafe);
    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.98);
    transform: rotate(-4deg) scale(1.06);
  }

  .quick-action-copy {
    position: relative;
    z-index: 1;
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 3px;
  }

  .quick-action-copy strong {
    overflow: hidden;
    color: #17335f;
    font-size: 0.88rem;
    font-weight: 750;
    letter-spacing: -0.01em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .quick-action-copy small {
    overflow: hidden;
    color: #6b7f9f;
    font-size: 0.72rem;
    line-height: 1.35;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .quick-action-arrow {
    position: relative;
    z-index: 1;
    display: grid;
    flex: 0 0 auto;
    width: 30px;
    height: 30px;
    place-items: center;
    border: 1px solid rgba(37, 99, 235, 0.16);
    border-radius: 10px;
    background: rgba(239, 246, 255, 0.92);
    color: var(--qa-blue);
    transition: background 180ms ease, color 180ms ease, transform 180ms ease;
  }

  .quick-action-card:hover .quick-action-arrow {
    background: #dbeafe;
    color: #1d4ed8;
    transform: translate(2px, -2px);
  }

  .quick-add-empty {
    padding: 24px;
    border: 1px dashed rgba(65, 121, 209, 0.3);
    border-radius: 16px;
    color: #60759a;
    font-size: 0.85rem;
    text-align: center;
  }

  .quick-add-form-shell {
    padding: 18px;
  }

  .quick-add-form-banner {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .quick-add-form-icon {
    width: 43px;
    height: 43px;
    border-radius: 14px;
  }

  .quick-add-form-title {
    font-size: 0.98rem;
  }

  .quick-add-change {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
    padding: 7px 10px;
    border: 1px solid rgba(37, 99, 235, 0.16);
    border-radius: 10px;
    background: rgba(239, 246, 255, 0.9);
    color: #2563eb;
    font-size: 0.73rem;
    cursor: pointer;
    transition: background 180ms ease, color 180ms ease, border-color 180ms ease;
  }

  .quick-add-change:hover {
    border-color: rgba(37, 99, 235, 0.38);
    background: #dbeafe;
    color: #1d4ed8;
  }

  .quick-add-change:disabled,
  .quick-action-card:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    transform: none;
  }

  .quick-add-form-grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 15px;
  }

  .quick-add-form-grid > * {
    min-width: 0;
  }

  .quick-add-form-grid .field-span-2 {
    grid-column: span 2;
  }

  .quick-add-form-grid input,
  .quick-add-form-grid select,
  .quick-add-form-grid textarea {
    min-height: 44px;
    border: 1px solid rgba(100, 135, 190, 0.25) !important;
    border-radius: 12px !important;
    background: rgba(255, 255, 255, 0.86) !important;
    color: #17335f !important;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92), 0 4px 14px rgba(65, 121, 209, 0.04);
    transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease;
  }

  .quick-add-form-grid input:focus,
  .quick-add-form-grid select:focus,
  .quick-add-form-grid textarea:focus {
    border-color: rgba(37, 99, 235, 0.58) !important;
    background: #ffffff !important;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1), 0 0 22px rgba(71, 166, 255, 0.12);
    outline: none;
  }

  .quick-add-form-grid input::placeholder,
  .quick-add-form-grid textarea::placeholder {
    color: #8aa0c3;
    opacity: 1;
  }

  .quick-add-form-grid textarea {
    min-height: 104px;
    resize: vertical;
  }

  .quick-add-form-grid option {
    background: #ffffff;
    color: #17335f;
  }

  .quick-add-form-grid label {
    color: #456187;
    font-size: 0.75rem;
    font-weight: 650;
  }

  .quick-add-form-error {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    gap: 9px;
    margin: 0 0 15px;
    padding: 11px 13px;
    border: 1px solid rgba(220, 38, 38, 0.18);
    border-radius: 14px;
    background: rgba(254, 242, 242, 0.9);
    color: #b91c1c;
    font-size: 0.76rem;
    line-height: 1.45;
    box-shadow: 0 8px 20px rgba(185, 28, 28, 0.06);
    animation: quickAddEnter 260ms ease both;
  }

  .quick-add-form-error-mark {
    display: grid;
    flex: 0 0 auto;
    width: 17px;
    height: 17px;
    place-items: center;
    border-radius: 50%;
    background: #fee2e2;
    color: #b91c1c;
    font-size: 0.68rem;
    font-weight: 900;
  }

  .quick-add-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    width: 100%;
  }

  .quick-add-footer-hint {
    color: #60759a;
    font-size: 0.72rem;
  }

  .quick-add-footer-hint b {
    color: #2563eb;
  }

  .quick-add-footer-actions {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  @keyframes quickAddFloat {
    from { transform: translate3d(-16px, 10px, 0) scale(0.92); }
    to { transform: translate3d(20px, -18px, 0) scale(1.08); }
  }

  @keyframes quickAddEnter {
    from { opacity: 0; transform: translateY(8px) scale(0.985); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes quickAddIconPulse {
    0%, 100% { box-shadow: 0 0 22px rgba(56, 145, 245, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.95); }
    50% { box-shadow: 0 0 34px rgba(56, 145, 245, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.98); }
  }

  @keyframes quickAddSheen {
    0%, 58% { transform: translateX(-110%); }
    78%, 100% { transform: translateX(110%); }
  }

  @media (max-width: 720px) {
    .quick-add-picker,
    .quick-add-form-shell {
      border-radius: 20px;
      padding: 15px;
    }

    .quick-actions-grid {
      grid-template-columns: 1fr;
    }

    .quick-add-form-banner {
      align-items: flex-start;
      flex-wrap: wrap;
    }

    .quick-add-change {
      margin-left: auto;
    }

    .quick-add-form-grid {
      grid-template-columns: 1fr !important;
    }

    .quick-add-form-grid .field-span-2 {
      grid-column: span 1 !important;
    }

    .quick-add-footer {
      align-items: stretch;
      flex-direction: column;
    }

    .quick-add-footer-actions {
      width: 100%;
    }

    .quick-add-footer-actions > * {
      flex: 1;
    }

    .quick-add-picker-intro {
      align-items: flex-start;
    }

    .quick-add-picker-copy {
      max-width: 28rem;
    }
  }

  @media (max-width: 420px) {
    .quick-add-picker,
    .quick-add-form-shell {
      padding: 13px;
    }

    .quick-add-picker-intro {
      gap: 10px;
    }

    .quick-add-orb {
      width: 45px;
      height: 45px;
      border-radius: 14px;
    }

    .quick-action-card {
      padding: 12px;
    }

    .quick-action-arrow {
      width: 28px;
      height: 28px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .quick-add-modal *,
    .quick-add-modal *::before,
    .quick-add-modal *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export function QuickAddModal({
  open,
  onClose,
  initialType,
}: {
  open: boolean;
  onClose: () => void;
  initialType?: QuickAddType;
}) {
  const { user } = useAuth();
  const { data, addClient, addUser, addProject, addTask, addApproval, addFinance, addGoal } = useWorkspace();
  const { notify } = useToast();
  const [type, setType] = useState<QuickAddType | null>(initialType ?? null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");

  const available = useMemo<QuickAddType[]>(() => {
    if (!user) return [];

    return [
      ...(hasPermission(user, "clients:write") ? ["client" as const] : []),
      ...(hasPermission(user, "people:write") ? ["user" as const] : []),
      ...(hasPermission(user, "projects:write") ? ["project" as const] : []),
      ...(hasPermission(user, "tasks:write") ? ["task" as const] : []),
      ...(hasPermission(user, "approvals:write") ? ["approval" as const] : []),
      ...(hasPermission(user, "finance:write") ? ["finance" as const] : []),
      ...(user.role === "director" || user.role === "manager" ? ["goal" as const] : []),
    ];
  }, [user]);

  useEffect(() => {
    if (open) {
      const requestedType = initialType ?? null;
      const nextType = requestedType && available.includes(requestedType) ? requestedType : null;
      setType(nextType);
      setForm(createInitialForm(nextType, user?.id ?? ""));
      setFormError("");
    }
  }, [available, initialType, open, user?.id]);

  if (!user) return null;

  const set = (key: string, value: string) => {
    setFormError("");
    setForm((current) => ({ ...current, [key]: value }));
  };

  const chooseType = (nextType: QuickAddType) => {
    setType(nextType);
    setForm(createInitialForm(nextType, user.id));
    setFormError("");
  };

  const required = (keys: string[]) => keys.every((key) => Boolean(form[key]?.trim()));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!type || submitting) return;

    setFormError("");

    let valid = true;
    if (type === "client") valid = required(["name", "company", "email"]);
    if (type === "user") valid = required(["name", "email", "title", "role"]);
    if (type === "project") valid = required(["name", "ownerId", "dueDate"]);
    if (type === "task") valid = required(["title", "dueDate"]);
    if (type === "approval") valid = required(["title", "approvalType"]);
    if (type === "finance") valid = required(["title", "amount", "financeType"]);
    if (type === "goal") valid = required(["title", "scope", "dueDate"]);

    if (!valid) {
      const message = "Please complete all required fields before saving.";
      setFormError(message);
      notify(message, "error");
      return;
    }

    if (["client", "user"].includes(type) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      const message = "Please enter a valid email address.";
      setFormError(message);
      notify(message, "error");
      return;
    }

    setSubmitting(true);

    try {
      if (type === "client") {
        await addClient({
          name: form.name,
          company: form.company,
          email: form.email,
          phone: form.phone ?? "",
          industry: form.industry ?? "Creative services",
          city: form.city ?? "",
          country: form.country ?? "India",
          status: (form.status as "Active" | "Onboarding" | "At risk" | "Inactive") || "Onboarding",
          paymentStatus: (form.paymentStatus as "Paid" | "Due soon" | "Overdue" | "Not set") || "Not set",
          managerId: form.managerId || undefined,
          budget: Number(form.budget) || 0,
          portalAccess: form.portalAccess === "true",
          notes: form.notes ?? "",
        });
      }

      if (type === "user") {
        await addUser({
          name: form.name,
          email: form.email,
          title: form.title,
          role: form.role as Role,
          departmentId: form.departmentId || undefined,
          teamId: form.teamId || undefined,
          managerId: form.managerId || undefined,
          teamLeadId: form.teamLeadId || undefined,
        });
      }

      if (type === "project") {
        await addProject({
          name: form.name,
          clientId: form.clientId || undefined,
          ownerId: form.ownerId || user.id,
          managerId: form.managerId || undefined,
          teamLeadId: form.teamLeadId || undefined,
          priority: (form.priority as "Low" | "Medium" | "High" | "Urgent") || "Medium",
          dueDate: form.dueDate,
          budget: Number(form.budget) || 0,
          description: form.description ?? "",
        });
      }

      if (type === "task") {
        await addTask({
          title: form.title,
          projectId: form.projectId || undefined,
          assigneeId: form.assigneeId || undefined,
          priority: (form.priority as "Low" | "Medium" | "High" | "Urgent") || "Medium",
          dueDate: form.dueDate || dateIn(7),
          description: form.description ?? "",
        });
      }

      if (type === "approval") {
        await addApproval({
          title: form.title,
          type: (form.approvalType as "Deliverable" | "Leave" | "Finance" | "Change request") || "Deliverable",
          projectId: form.projectId || undefined,
          reviewerId: form.reviewerId || undefined,
          amount: form.amount ? Number(form.amount) : undefined,
          comment: form.comment ?? "",
        });
      }

      if (type === "finance") {
        await addFinance({
          title: form.title,
          type: (form.financeType as "Budget" | "Expense" | "Invoice" | "Payment") || "Expense",
          clientId: form.clientId || undefined,
          projectId: form.projectId || undefined,
          amount: Number(form.amount) || 0,
          status: (form.financeStatus as "Draft" | "Pending" | "Approved" | "Paid" | "Overdue") || "Draft",
          dueDate: form.dueDate || undefined,
        });
      }

      if (type === "goal") {
        await addGoal({
          title: form.title,
          scope: (form.scope as "Organization" | "Department" | "Team" | "Project" | "Personal") || "Organization",
          ownerId: form.ownerId || user.id,
          progress: Number(form.progress) || 0,
          dueDate: form.dueDate || dateIn(30),
          status: (form.goalStatus as "On track" | "At risk" | "Complete") || "On track",
        });
      }

      notify(`${labels[type]} saved successfully.`, "success");
      onClose();
    } catch (error) {
      notify(error instanceof Error ? error.message : "The record could not be saved.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const renderForm = () => {
    const gridClass = "form-grid quick-add-form-grid";

    if (type === "client") {
      return (
        <div className={gridClass}>
          <TextInput label="Client name *" placeholder="Sana Kapoor" value={form.name ?? ""} onChange={(event) => set("name", event.target.value)} />
          <TextInput label="Company *" placeholder="Aster Labs" value={form.company ?? ""} onChange={(event) => set("company", event.target.value)} />
          <TextInput label="Email *" type="email" placeholder="hello@company.com" value={form.email ?? ""} onChange={(event) => set("email", event.target.value)} />
          <TextInput label="Phone" placeholder="+91 98765 00000" value={form.phone ?? ""} onChange={(event) => set("phone", event.target.value)} />
          <TextInput label="Industry" placeholder="SaaS" value={form.industry ?? ""} onChange={(event) => set("industry", event.target.value)} />
          <TextInput label="City" placeholder="Bengaluru" value={form.city ?? ""} onChange={(event) => set("city", event.target.value)} />
          <SelectInput label="Status" value={form.status ?? "Onboarding"} onChange={(event) => set("status", event.target.value)}>
            <option>Onboarding</option><option>Active</option><option>At risk</option><option>Inactive</option>
          </SelectInput>
          <SelectInput label="Payment status" value={form.paymentStatus ?? "Not set"} onChange={(event) => set("paymentStatus", event.target.value)}>
            <option>Not set</option><option>Paid</option><option>Due soon</option><option>Overdue</option>
          </SelectInput>
          <TextInput label="Budget (₹)" type="number" min="0" placeholder="100000" value={form.budget ?? ""} onChange={(event) => set("budget", event.target.value)} />
          <SelectInput label="Portal access" value={form.portalAccess ?? "false"} onChange={(event) => set("portalAccess", event.target.value)}>
            <option value="false">Not enabled</option><option value="true">Enabled</option>
          </SelectInput>
          <SelectInput label="Assigned manager" value={form.managerId ?? ""} onChange={(event) => set("managerId", event.target.value)}>
            <option value="">Unassigned</option>
            {data.users.filter((candidate) => candidate.role === "manager").map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
          </SelectInput>
          <TextArea label="Notes" className="field-span-2" placeholder="Context the team should know" value={form.notes ?? ""} onChange={(event) => set("notes", event.target.value)} />
        </div>
      );
    }

    if (type === "user") {
      return (
        <div className={gridClass}>
          <TextInput label="Full name *" placeholder="A new teammate" value={form.name ?? ""} onChange={(event) => set("name", event.target.value)} />
          <TextInput label="Email *" type="email" placeholder="name@company.com" value={form.email ?? ""} onChange={(event) => set("email", event.target.value)} />
          <TextInput label="Title *" placeholder="Product Designer" value={form.title ?? ""} onChange={(event) => set("title", event.target.value)} />
          <SelectInput label="Role *" value={form.role ?? "employee"} onChange={(event) => set("role", event.target.value)}>
            <option value="employee">Employee</option><option value="team_leader">Team Lead</option>{user.role === "director" ? <option value="manager">Manager</option> : null}
          </SelectInput>
          <SelectInput label="Department" value={form.departmentId ?? ""} onChange={(event) => set("departmentId", event.target.value)}>
            <option value="">Unassigned</option>
            {data.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
          </SelectInput>
          <SelectInput label="Team" value={form.teamId ?? ""} onChange={(event) => set("teamId", event.target.value)}>
            <option value="">Unassigned</option>
            {data.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </SelectInput>
          <SelectInput label="Reporting manager" value={form.managerId ?? ""} onChange={(event) => set("managerId", event.target.value)}>
            <option value="">Unassigned</option>
            {data.users.filter((candidate) => candidate.role === "manager").map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
          </SelectInput>
        </div>
      );
    }

    if (type === "project") {
      return (
        <div className={gridClass}>
          <TextInput label="Project name *" placeholder="New client project" value={form.name ?? ""} onChange={(event) => set("name", event.target.value)} />
          <SelectInput label="Client" value={form.clientId ?? ""} onChange={(event) => set("clientId", event.target.value)}>
            <option value="">Internal project</option>
            {data.clients.map((client) => <option key={client.id} value={client.id}>{client.company}</option>)}
          </SelectInput>
          <SelectInput label="Owner *" value={form.ownerId ?? user.id} onChange={(event) => set("ownerId", event.target.value)}>
            {data.users.filter((candidate) => candidate.role !== "client").map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
          </SelectInput>
          <SelectInput label="Manager" value={form.managerId ?? ""} onChange={(event) => set("managerId", event.target.value)}>
            <option value="">Unassigned</option>
            {data.users.filter((candidate) => candidate.role === "manager").map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
          </SelectInput>
          <SelectInput label="Priority" value={form.priority ?? "Medium"} onChange={(event) => set("priority", event.target.value)}>
            <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
          </SelectInput>
          <TextInput label="Due date *" type="date" value={form.dueDate ?? dateIn(14)} onChange={(event) => set("dueDate", event.target.value)} />
          <TextInput label="Budget (₹)" type="number" min="0" value={form.budget ?? ""} onChange={(event) => set("budget", event.target.value)} />
          <TextArea label="Description" className="field-span-2" placeholder="What outcome should this project create?" value={form.description ?? ""} onChange={(event) => set("description", event.target.value)} />
        </div>
      );
    }

    if (type === "task") {
      return (
        <div className={gridClass}>
          <TextInput label="Task title *" placeholder="What needs to happen?" value={form.title ?? ""} onChange={(event) => set("title", event.target.value)} />
          <SelectInput label="Project" value={form.projectId ?? ""} onChange={(event) => set("projectId", event.target.value)}>
            <option value="">No project</option>
            {data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </SelectInput>
          <SelectInput label="Assignee" value={form.assigneeId ?? ""} onChange={(event) => set("assigneeId", event.target.value)}>
            <option value="">Unassigned</option>
            {data.users.filter((candidate) => candidate.role !== "client").map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
          </SelectInput>
          <SelectInput label="Priority" value={form.priority ?? "Medium"} onChange={(event) => set("priority", event.target.value)}>
            <option>Low</option><option>Medium</option><option>High</option><option>Urgent</option>
          </SelectInput>
          <TextInput label="Due date *" type="date" value={form.dueDate ?? dateIn(7)} onChange={(event) => set("dueDate", event.target.value)} />
          <TextArea label="Description" className="field-span-2" placeholder="Add useful context for the person doing the work" value={form.description ?? ""} onChange={(event) => set("description", event.target.value)} />
        </div>
      );
    }

    if (type === "approval") {
      return (
        <div className={gridClass}>
          <TextInput label="Approval title *" placeholder="Aster launch hero direction" value={form.title ?? ""} onChange={(event) => set("title", event.target.value)} />
          <SelectInput label="Type *" value={form.approvalType ?? "Deliverable"} onChange={(event) => set("approvalType", event.target.value)}>
            <option>Deliverable</option><option>Leave</option><option>Finance</option><option>Change request</option>
          </SelectInput>
          <SelectInput label="Project" value={form.projectId ?? ""} onChange={(event) => set("projectId", event.target.value)}>
            <option value="">No project</option>
            {data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </SelectInput>
          <SelectInput label="Reviewer" value={form.reviewerId ?? ""} onChange={(event) => set("reviewerId", event.target.value)}>
            <option value="">Choose reviewer</option>
            {data.users.filter((candidate) => candidate.id !== user.id && candidate.role !== "employee").map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
          </SelectInput>
          <TextInput label="Amount (₹)" type="number" min="0" value={form.amount ?? ""} onChange={(event) => set("amount", event.target.value)} />
          <TextArea label="Comment" className="field-span-2" placeholder="Give the reviewer enough context" value={form.comment ?? ""} onChange={(event) => set("comment", event.target.value)} />
        </div>
      );
    }

    if (type === "finance") {
      return (
        <div className={gridClass}>
          <TextInput label="Record title *" placeholder="Invoice or expense name" value={form.title ?? ""} onChange={(event) => set("title", event.target.value)} />
          <SelectInput label="Type *" value={form.financeType ?? "Expense"} onChange={(event) => set("financeType", event.target.value)}>
            <option>Budget</option><option>Expense</option><option>Invoice</option><option>Payment</option>
          </SelectInput>
          <TextInput label="Amount *" type="number" min="0" value={form.amount ?? ""} onChange={(event) => set("amount", event.target.value)} />
          <SelectInput label="Status" value={form.financeStatus ?? "Draft"} onChange={(event) => set("financeStatus", event.target.value)}>
            <option>Draft</option><option>Pending</option><option>Approved</option><option>Paid</option><option>Overdue</option>
          </SelectInput>
          <SelectInput label="Client" value={form.clientId ?? ""} onChange={(event) => set("clientId", event.target.value)}>
            <option value="">No client</option>
            {data.clients.map((client) => <option key={client.id} value={client.id}>{client.company}</option>)}
          </SelectInput>
          <SelectInput label="Project" value={form.projectId ?? ""} onChange={(event) => set("projectId", event.target.value)}>
            <option value="">No project</option>
            {data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </SelectInput>
          <TextInput label="Due date" type="date" value={form.dueDate ?? ""} onChange={(event) => set("dueDate", event.target.value)} />
        </div>
      );
    }

    return (
      <div className={gridClass}>
        <TextInput label="Goal title *" placeholder="Improve on-time delivery" value={form.title ?? ""} onChange={(event) => set("title", event.target.value)} />
        <SelectInput label="Scope *" value={form.scope ?? "Organization"} onChange={(event) => set("scope", event.target.value)}>
          <option>Organization</option><option>Department</option><option>Team</option><option>Project</option><option>Personal</option>
        </SelectInput>
        <SelectInput label="Owner" value={form.ownerId ?? user.id} onChange={(event) => set("ownerId", event.target.value)}>
          {data.users.filter((candidate) => candidate.role !== "client").map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
        </SelectInput>
        <TextInput label="Due date *" type="date" value={form.dueDate ?? dateIn(30)} onChange={(event) => set("dueDate", event.target.value)} />
        <TextInput label="Starting progress (%)" type="number" min="0" max="100" value={form.progress ?? "0"} onChange={(event) => set("progress", event.target.value)} />
        <SelectInput label="Health" value={form.goalStatus ?? "On track"} onChange={(event) => set("goalStatus", event.target.value)}>
          <option>On track</option><option>At risk</option><option>Complete</option>
        </SelectInput>
      </div>
    );
  };

  const ActiveIcon = type ? icons[type] : Sparkles;

  return (
    <>
      <style>{quickAddStyles}</style>
      <Modal
        open={open}
        onClose={onClose}
        title={type ? labels[type] : "Quick add"}
        subtitle={type ? "A real workspace record with validation and activity history." : "Choose an action to get useful work moving."}
        wide={Boolean(type)}
        footer={
          type ? (
            <div className="quick-add-footer">
              <span className="quick-add-footer-hint"><b>*</b> Required fields are marked for you.</span>
              <div className="quick-add-footer-actions">
                <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button type="submit" form="quick-add-form" loading={submitting} disabled={submitting}>Save {labels[type].replace(/^(Add|Create|Request) /, "")}</Button>
              </div>
            </div>
          ) : null
        }
      >
        <div className="quick-add-modal">
          {type ? (
            <div className="quick-add-form-shell">
              <div className="quick-add-form-banner">
                <span className="quick-add-form-icon"><ActiveIcon size={19} /></span>
                <div>
                  <span className="quick-add-form-kicker">Creating in workspace</span>
                  <strong className="quick-add-form-title">{labels[type]}</strong>
                </div>
                <button
                  className="quick-add-change"
                  type="button"
                  disabled={submitting}
                  onClick={() => {
                    setType(null);
                    setForm({});
                    setFormError("");
                  }}
                >
                  <ArrowLeft size={14} /> Change action
                </button>
              </div>
              {formError ? (
                <div className="quick-add-form-error" role="alert" aria-live="polite">
                  <span className="quick-add-form-error-mark" aria-hidden="true">!</span>
                  <span>{formError}</span>
                </div>
              ) : null}
              <form id="quick-add-form" onSubmit={submit} aria-busy={submitting}>
                {renderForm()}
              </form>
            </div>
          ) : (
            <div className="quick-add-picker">
              <div className="quick-add-picker-intro">
                <span className="quick-add-orb"><Sparkles size={22} /></span>
                <div>
                  <span className="quick-add-picker-kicker">Workspace shortcuts</span>
                  <strong className="quick-add-picker-title">What would you like to create?</strong>
                  <p className="quick-add-picker-copy">Pick an action and keep your next important move in one place.</p>
                </div>
              </div>
              {available.length ? (
                <div className="quick-actions-grid">
                  {available.map((item) => {
                    const Icon = icons[item];
                    return (
                      <button className="quick-action-card" type="button" key={item} onClick={() => chooseType(item)} aria-label={labels[item]}>
                        <span className="quick-action-icon"><Icon size={19} /></span>
                        <span className="quick-action-copy">
                          <strong>{labels[item]}</strong>
                          <small>{descriptions[item]}</small>
                        </span>
                        <span className="quick-action-arrow" aria-hidden="true"><ArrowUpRight size={17} /></span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="quick-add-empty">You do not have permission to create a workspace record yet.</div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
