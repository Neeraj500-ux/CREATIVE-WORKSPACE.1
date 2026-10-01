import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { RoleDashboard } from "./RoleDashboard";
import { downline } from "./RoleModules";
import { getDashboardPath, getVisibleNavigation } from "../lib/permissions";
import { isOverdue } from "../lib/formatters";
import { useAuth } from "../services/auth";
import { useWorkspace } from "../services/workspace";
import type { Role } from "../types";

const STRIP: Record<Role, string[]> = {
  director: ["people", "departments-teams", "clients", "projects", "approvals", "reports", "settings"],
  manager: ["team-leads", "assign-tasks", "team-progress", "projects", "approvals", "reports"],
  team_leader: ["employees", "assign-tasks", "deadlines", "review-submissions", "performance", "reports"],
  employee: ["my-tasks", "my-projects", "work-updates", "submissions", "calendar", "preferences"],
  client: [],
};

const styles = `
.rh-strip{margin:0 0 18px;padding:14px;border:1px solid var(--line,#d5e5fa);border-radius:20px;background:radial-gradient(ellipse at top left,rgba(56,189,248,.12),transparent 60%),var(--panel-strong,#fff);box-shadow:0 12px 30px rgba(49,92,147,.07)}
.rh-strip-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin:0 2px 10px}
.rh-strip-head strong{font-size:13px;letter-spacing:-.02em;color:var(--text,#17335f)}
.rh-strip-head span{font-size:11px;color:var(--muted,#617695)}
.rh-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,150px),1fr));gap:10px}
.rh-tile{display:flex;align-items:center;gap:10px;min-width:0;padding:11px 12px;border:1px solid var(--line,#dbe7f8);border-radius:14px;background:transparent;color:var(--text,#27496f);text-align:left;font:inherit;cursor:pointer;transition:transform .2s,box-shadow .2s,border-color .2s,background .2s}
.rh-tile>span:first-child{display:grid;place-items:center;flex-shrink:0;width:34px;height:34px;border-radius:11px;background:linear-gradient(140deg,rgba(56,189,248,.18),rgba(37,99,235,.16));color:#2563eb}
.rh-tile>span:nth-child(2){display:flex;flex-direction:column;min-width:0;flex:1}
.rh-tile strong{font-size:12px;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rh-tile small{font-size:10.5px;color:var(--muted,#7890ae);margin-top:2px}
.rh-tile svg:last-child{flex-shrink:0;opacity:.45;transition:opacity .2s,transform .2s}
.rh-tile:focus-visible{outline:3px solid rgba(37,99,235,.45);outline-offset:2px}
@media(hover:hover){.rh-tile:hover{transform:translateY(-2px);border-color:#91b9f6;background:rgba(37,99,235,.05);box-shadow:0 8px 18px rgba(37,99,235,.10)}.rh-tile:hover svg:last-child{opacity:1;transform:translate(1px,-1px)}}
@media(max-width:640px){.rh-strip{padding:12px;border-radius:16px}.rh-tiles{grid-template-columns:repeat(2,minmax(0,1fr))}.rh-strip-head span{display:none}}
@media(max-width:360px){.rh-tiles{grid-template-columns:1fr}}

/* polish for the existing dashboard layout */
.dashboard-page .page-intro{flex-wrap:wrap;gap:16px}
.dashboard-page .kpi-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:14px}
.dashboard-page .dashboard-grid{gap:16px}
.dashboard-page .client-pulse-grid{grid-template-columns:repeat(auto-fit,minmax(min(100%,250px),1fr))}
.dashboard-page .focus-row{flex-wrap:wrap}
.dashboard-page .focus-row select{max-width:100%}
.dashboard-page .project-mini,.dashboard-page .client-pulse-card{transition:transform .2s,box-shadow .2s}
@media(hover:hover){.dashboard-page .project-mini:hover,.dashboard-page .client-pulse-card:hover{transform:translateY(-2px)}}
@media(max-width:1100px){.dashboard-page .dashboard-grid,.dashboard-page .analytics-grid{grid-template-columns:1fr}}
@media(max-width:640px){.dashboard-page .intro-actions{width:100%}.dashboard-page .intro-actions>*{flex:1}.dashboard-page .intro-title-row{flex-wrap:wrap}}
@media(prefers-reduced-motion:reduce){.rh-tile,.dashboard-page .project-mini,.dashboard-page .client-pulse-card{transition:none}.rh-tile:hover{transform:none}}
`;

export function RoleHome() {
  const { user } = useAuth();
  const { data, loading } = useWorkspace();
  const navigate = useNavigate();
  if (!user) return null;

  const nav = getVisibleNavigation(user);
  const base = getDashboardPath(user.role);
  const people = loading ? [] : downline(user, data);
  const ids = new Set(people.map((person) => person.id));
  const open = (list: typeof data.tasks) => list.filter((task) => !task.archived && task.status !== "Completed");
  const mine = open(data.tasks.filter((task) => task.assigneeId === user.id));
  const team = open(data.tasks.filter((task) => task.assigneeId && ids.has(task.assigneeId)));

  const countFor = (path: string): string | null => {
    switch (path) {
      case "people": return `${data.users.filter((person) => person.role !== "client" && person.active).length} active`;
      case "departments-teams": return `${data.teams.length} teams`;
      case "clients": return `${data.clients.length} accounts`;
      case "projects": return `${data.projects.filter((project) => project.status === "Active").length} active`;
      case "approvals": return `${data.approvals.filter((approval) => approval.status === "Pending").length} pending`;
      case "team-leads": return `${people.filter((person) => person.role === "team_leader").length} leads`;
      case "employees": return `${people.filter((person) => person.role === "employee").length} people`;
      case "team-progress": return `${team.filter(isOverdue).length} overdue`;
      case "deadlines": return `${team.filter((task) => isOverdue(task)).length} overdue`;
      case "review-submissions": return `${data.tasks.filter((task) => task.status === "In Review" && task.assigneeId && ids.has(task.assigneeId)).length} waiting`;
      case "my-tasks": return `${mine.length} open`;
      case "my-projects": return `${data.projects.filter((project) => project.memberIds.includes(user.id)).length} projects`;
      case "submissions": return `${data.tasks.filter((task) => task.assigneeId === user.id && task.status === "In Review").length} in review`;
      case "calendar": return `${mine.filter(isOverdue).length} overdue`;
      default: return null;
    }
  };

  const tiles = STRIP[user.role].flatMap((path) => nav.find((item) => item.path === path) ?? []);

  return <>
    <style>{styles}</style>
    {!loading && tiles.length ? <section className="rh-strip" aria-label="Quick navigation">
      <div className="rh-strip-head"><strong>Jump to</strong><span>Shortcuts for your role</span></div>
      <div className="rh-tiles">{tiles.map((item) => { const Icon = item.icon; const count = countFor(item.path); return <button type="button" className="rh-tile" key={item.path} title={item.description} onClick={() => navigate(`${base}/${item.path}`)}><span><Icon size={17} aria-hidden="true" /></span><span><strong>{item.label}</strong>{count ? <small>{count}</small> : null}</span><ArrowUpRight size={15} aria-hidden="true" /></button>; })}</div>
    </section> : null}
    <RoleDashboard />
  </>;
}