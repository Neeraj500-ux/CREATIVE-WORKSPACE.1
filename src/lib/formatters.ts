import type { Priority, Role, Task, TaskStatus } from "../types";

export const roleLabels: Record<Role, string> = {
  director: "Director",
  manager: "Manager",
  team_leader: "Team Lead",
  employee: "Employee",
  client: "Client",
};

export const formatCurrency = (value: number) => {
  if (!Number.isFinite(value) || value === 0) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
};

export const formatDate = (value?: string, options?: Intl.DateTimeFormatOptions) => {
  if (!value) return "No date";
  const date = new Date(value.includes("T") ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "No date";
  return new Intl.DateTimeFormat("en-IN", options ?? { day: "numeric", month: "short", year: "numeric" }).format(date);
};

export const formatCompactDate = (value?: string) => formatDate(value, { day: "numeric", month: "short" });

export const formatRelativeTime = (value?: string) => {
  if (!value) return "Unknown time";
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return "Unknown time";
  const diff = Date.now() - time;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatCompactDate(value);
};

export const getInitials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "CC";

export const isOverdue = (task: Task) => task.status !== "Completed" && new Date(`${task.dueDate}T23:59:59`).getTime() < Date.now();

export const isDueToday = (task: Task) => task.dueDate === new Date().toISOString().slice(0, 10);

export const isThisWeek = (value: string) => {
  const date = new Date(`${value}T12:00:00`);
  const now = new Date();
  const day = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return date >= start && date < end;
};

export const priorityTone = (priority: Priority) => priority.toLowerCase().replace(" ", "-");

export const statusTone = (status: string) => status.toLowerCase().replace(/\s+/g, "-");

export const taskStatusTone = (status: TaskStatus) => statusTone(status);

export const titleCase = (value: string) => value.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
