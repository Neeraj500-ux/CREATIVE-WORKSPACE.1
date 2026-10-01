import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  CheckSquare2,
  CircleDollarSign,
  Clock3,
  FileText,
  FolderKanban,
  Goal,
  ListTodo,
  Plus,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UsersRound,
  WalletCards,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Button,
  Card,
  Avatar,
  Badge,
  EmptyState,
  ProgressBar,
  SectionHeading,
  SelectInput,
  StatCard,
  useToast,
} from "../components/ui";
import {
  formatCompactDate,
  formatRelativeTime,
  isDueToday,
  isOverdue,
  isThisWeek,
  roleLabels,
  statusTone,
} from "../lib/formatters";
import { getModulePath, hasPermission } from "../lib/permissions";
import { QuickAddModal } from "../components/QuickAddModal";
import { useAuth } from "../services/auth";
import { taskMetrics, useWorkspace } from "../services/workspace";
import type { LucideIcon } from "lucide-react";
import type { QuickAddType, Role, Task, TaskStatus } from "../types";
const dashboardStyles = `
.premium-dashboard {
  --text: #17335f;
  --muted: #667e9f;
  --line: #e1eaf6;
  --line-strong: #d5e5fa;
  --panel-strong: #ffffff;
  --dash-blue: #2563eb;
  --dash-shadow: 0 8px 30px #315c9309, 0 2px 6px #315c9304;
  position: relative;
  isolation: isolate;
  width: 100%;
  min-width: 0;
  color: var(--text);
  display: flex;
  flex-direction: column;
  gap: 26px;
  padding: 4px 0 28px;
}
.premium-dashboard *, .premium-dashboard *::before, .premium-dashboard *::after { box-sizing: border-box; }
.premium-dashboard > * { min-width: 0; margin: 0; }
.premium-dashboard::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse at 95% 2%, #38bdf810, transparent 35%), radial-gradient(ellipse at 5% 40%, #2563eb07, transparent 32%);
}
.premium-dashboard h1, .premium-dashboard h2, .premium-dashboard h3, .premium-dashboard p { margin-top: 0; }
.premium-dashboard button, .premium-dashboard select { font: inherit; }
.premium-dashboard button { touch-action: manipulation; }
.premium-dashboard button:focus-visible, .premium-dashboard select:focus-visible, .premium-dashboard a:focus-visible {
  outline: 3px solid #9abffc;
  outline-offset: 4px;
}
.premium-dashboard .page-intro {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 24px;
  padding: clamp(22px, 3vw, 38px);
  border: 1px solid #d5e5fa;
  border-radius: 28px;
  background: radial-gradient(ellipse at top right, #e1f2ffe6, transparent 60%), linear-gradient(120deg, #fffffff5, #f1f7ffeb);
  box-shadow: 0 16px 44px #315c930c, inset 0 1px 0 #ffffff;
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
}
.premium-dashboard .page-intro::after {
  content: "";
  position: absolute;
  width: 240px;
  height: 240px;
  border: 1px solid #ffffffd9;
  border-radius: 50%;
  top: -135px;
  right: 45px;
  box-shadow: 0 0 0 30px #ffffff33, 0 0 0 60px #ffffff26;
  pointer-events: none;
}
.premium-dashboard .intro-main, .premium-dashboard .intro-bottom { position: relative; z-index: 1; }
.premium-dashboard .breadcrumb { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; color: var(--muted); font-size: 11px; margin-bottom: 22px; }
.premium-dashboard .breadcrumb strong { font-weight: 600; color: #27496f; }
.premium-dashboard .intro-title-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; }
.premium-dashboard .intro-title-row > div { min-width: 0; }
.premium-dashboard .eyebrow { display: block; color: #2563eb; font-size: 10px; font-weight: 750; letter-spacing: .1em; text-transform: uppercase; line-height: 1.6; margin-bottom: 8px; }
.premium-dashboard .page-intro .eyebrow { font-size: 12px; letter-spacing: .025em; text-transform: none; }
.premium-dashboard .page-intro h1 { margin: 0 0 12px; color: #17335f; font-size: clamp(27px, 3.3vw, 40px); font-weight: 760; letter-spacing: -.045em; line-height: 1.15; overflow-wrap: anywhere; }
.premium-dashboard .page-intro p { max-width: 610px; margin: 0; color: var(--muted); font-size: 13px; line-height: 1.8; }
.premium-dashboard .intro-status { flex: 0 0 auto; }
.premium-dashboard .intro-bottom { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; padding-top: 22px; border-top: 1px solid #d5e5fa; }
.premium-dashboard .intro-date { display: flex; align-items: center; gap: 10px; color: #27496f; font-size: 12px; font-weight: 600; }
.premium-dashboard .intro-date > span:first-child { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid #dbe7f7; border-radius: 12px; background: #ffffffb3; color: #2563eb; }
.premium-dashboard .intro-actions { display: flex; flex-wrap: wrap; gap: 10px; margin: 0; }
.premium-dashboard .intro-actions button { min-height: 44px; border-radius: 13px; }
.premium-dashboard .dashboard-quick { margin: 0; padding: 22px; border: 1px solid #d5e5fa; border-radius: 22px; background: linear-gradient(135deg, #ffffffed, #f1f7ffbf); box-shadow: var(--dash-shadow), inset 0 1px 0 #ffffff; backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px); }
.premium-dashboard .dashboard-quick-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 18px; }
.premium-dashboard .dashboard-quick-head h2 { margin: 0; font-size: 16px; font-weight: 750; letter-spacing: -.025em; }
.premium-dashboard .dashboard-quick-head p { margin: 5px 0 0; font-size: 12px; line-height: 1.6; color: var(--muted); }
.premium-dashboard .dashboard-quick-badge { display: inline-flex; align-items: center; gap: 6px; padding: 8px 11px; border: 1px solid #d9e9ff; border-radius: 30px; background: #ffffff; color: #2563eb; font-size: 11px; white-space: nowrap; }
.premium-dashboard .dashboard-quick-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 11px; }
.premium-dashboard .dashboard-quick-button { display: flex; align-items: center; gap: 11px; min-width: 0; min-height: 76px; padding: 14px; border: 1px solid #dbe7f7; border-radius: 16px; background: #ffffffd9; color: #27496f; text-align: left; cursor: pointer; box-shadow: inset 0 1px 0 #ffffff; transition: transform .2s, box-shadow .2s, border-color .2s; }
.premium-dashboard .dashboard-quick-button > span:first-child { display: grid; place-items: center; flex-shrink: 0; width: 39px; height: 39px; border: 1px solid #dce9fc; border-radius: 13px; background: linear-gradient(140deg, #eff8ff, #e7efff); color: #2563eb; }
.premium-dashboard .dashboard-quick-button > span:last-child { min-width: 0; }
.premium-dashboard .dashboard-quick-button strong { display: block; font-size: 12px; line-height: 1.4; overflow-wrap: anywhere; }
.premium-dashboard .dashboard-quick-button small { display: block; font-size: 10px; color: var(--muted); margin-top: 4px; line-height: 1.5; }
.premium-dashboard .kpi-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.premium-dashboard .kpi-item { min-width: 0; height: 100%; }
.premium-dashboard .kpi-item > * { width: 100%; height: 100%; min-width: 0; min-height: 150px; padding: 22px; border: 1px solid #e1eaf6; border-radius: 22px; background: linear-gradient(130deg, #ffffff, #f8fbff); box-shadow: var(--dash-shadow); transition: transform .22s, box-shadow .22s, border-color .22s; }
.premium-dashboard .kpi-item strong { letter-spacing: -.035em; font-variant-numeric: tabular-nums; }
.premium-dashboard .dashboard-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 20px; align-items: start; }
.premium-dashboard .premium-panel { position: relative; min-width: 0; padding: 24px; border: 1px solid #e1eaf6; border-radius: 24px; background: #ffffffed; box-shadow: var(--dash-shadow); }
.premium-dashboard .premium-panel h2, .premium-dashboard .client-summary-section h2, .premium-dashboard .analytics-section h2 { color: #17335f; font-size: 19px; letter-spacing: -.035em; line-height: 1.35; margin-bottom: 7px; }
.premium-dashboard .premium-panel h3 { font-size: 15px; letter-spacing: -.025em; color: #17335f; }
.premium-dashboard .premium-panel p, .premium-dashboard .client-summary-section p, .premium-dashboard .analytics-section p { color: var(--muted); font-size: 12px; line-height: 1.7; }
.premium-dashboard .premium-panel > :first-child { margin-top: 0; }
.premium-dashboard .focus-list, .premium-dashboard .project-mini-list, .premium-dashboard .activity-list { display: flex; flex-direction: column; gap: 10px; margin-top: 22px; }
.premium-dashboard .focus-row { position: relative; display: grid; grid-template-columns: 4px minmax(0, 1fr) 138px; align-items: center; gap: 12px; padding: 14px; border: 1px solid #e9eff8; border-radius: 15px; background: #fafcff; transition: border-color .2s, background .2s; }
.premium-dashboard .priority-line { width: 4px; height: 34px; border-radius: 5px; background: #2563eb; }
.premium-dashboard .priority-rose, .premium-dashboard .priority-danger { background: #f43f5e; }
.premium-dashboard .priority-amber, .premium-dashboard .priority-warning { background: #f59e0b; }
.premium-dashboard .priority-green, .premium-dashboard .priority-success { background: #0ea5a4; }
.premium-dashboard .focus-row-main { min-width: 0; }
.premium-dashboard .focus-row-main > strong { display: block; font-size: 12px; line-height: 1.6; overflow-wrap: anywhere; }
.premium-dashboard .focus-row-main > span { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 5px; color: var(--muted); font-size: 10px; line-height: 1.6; overflow-wrap: anywhere; }
.premium-dashboard .focus-row select { width: 100%; min-width: 0; min-height: 40px; border: 1px solid #dbe7f7; border-radius: 10px; color: #27496f; background: #ffffff; font-size: 11px; padding: 8px; }
.premium-dashboard .focus-row > div:has(select) { min-width: 0; }
.premium-dashboard select:disabled { opacity: .6; cursor: wait; }
.premium-dashboard .task-saving { color: #2563eb; font-weight: 600; }
.premium-dashboard .text-danger { color: #e11d48; }
.premium-dashboard .project-mini { padding: 16px; border: 1px solid #e9eff8; border-radius: 16px; background: linear-gradient(140deg, #fafcff, #ffffff); }
.premium-dashboard .project-mini-top { display: flex; gap: 11px; align-items: center; flex-wrap: wrap; }
.premium-dashboard .project-mini-top > div { flex: 1; min-width: 100px; }
.premium-dashboard .project-avatar, .premium-dashboard .activity-icon, .premium-dashboard .next-icon { display: grid; place-items: center; flex: 0 0 auto; width: 38px; height: 38px; border-radius: 12px; color: #2563eb; background: linear-gradient(140deg, #eff8ff, #e7efff); border: 1px solid #dce9fc; }
.premium-dashboard .project-mini-top strong { display: block; font-size: 12px; line-height: 1.5; overflow-wrap: anywhere; }
.premium-dashboard .project-mini-top div > span { display: block; margin-top: 4px; color: var(--muted); font-size: 10px; overflow-wrap: anywhere; }
.premium-dashboard .project-mini-meta { display: flex; flex-direction: column; gap: 8px; margin-top: 15px; }
.premium-dashboard .project-mini-meta > span { color: var(--muted); font-size: 10px; text-align: right; }
.premium-dashboard .client-summary-section, .premium-dashboard .analytics-section { min-width: 0; }
.premium-dashboard .client-pulse-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-top: 20px; }
.premium-dashboard .client-pulse-top { display: flex; align-items: center; gap: 11px; }
.premium-dashboard .client-pulse-top > div:nth-child(2) { flex: 1; min-width: 0; }
.premium-dashboard .client-pulse-top strong { display: block; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
.premium-dashboard .client-pulse-top div > span { display: block; font-size: 11px; color: var(--muted); margin-top: 4px; line-height: 1.6; overflow-wrap: anywhere; }
.premium-dashboard .client-pulse-top button { display: grid; place-items: center; flex: 0 0 auto; width: 34px; height: 34px; border: 1px solid #dbe7f7; border-radius: 11px; background: #fafcff; color: #2563eb; cursor: pointer; }
.premium-dashboard .client-pulse-stats { display: grid; grid-template-columns: 1fr 1fr minmax(0, 1.3fr); gap: 10px; margin-top: 21px; padding-top: 18px; border-top: 1px solid #e9eff8; }
.premium-dashboard .client-pulse-stats > span { display: flex; min-width: 0; flex-direction: column; align-items: flex-start; gap: 8px; }
.premium-dashboard .client-pulse-stats small { font-size: 10px; color: var(--muted); }
.premium-dashboard .client-pulse-stats strong { font-size: 23px; letter-spacing: -.04em; font-variant-numeric: tabular-nums; }
.premium-dashboard .attention-note { display: flex; align-items: center; gap: 7px; margin-top: 18px; padding: 10px 12px; border-radius: 11px; background: #fff8eb; color: #a16207; font-size: 10px; line-height: 1.6; }
.premium-dashboard .attention-good { background: #effaf7; color: #0f766e; }
.premium-dashboard .analytics-section { scroll-margin-top: 90px; }
.premium-dashboard .analytics-grid { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 20px; margin-top: 20px; }
.premium-dashboard .analytics-grid > * { grid-column: auto; }
.premium-dashboard .analytics-grid > :last-child { grid-column: 1 / -1; }
.premium-dashboard .chart-card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; }
.premium-dashboard .chart-card-head h3 { margin: 0 0 5px; font-size: 14px; line-height: 1.5; }
.premium-dashboard .chart-card-head p { margin: 0; font-size: 11px; }
.premium-dashboard .chart-legend { display: inline-flex; flex-wrap: wrap; align-items: center; gap: 7px; font-size: 10px; color: var(--muted); }
.premium-dashboard .chart-legend i, .premium-dashboard .donut-legend i { display: inline-block; flex: 0 0 auto; width: 8px; height: 8px; border-radius: 50%; }
.premium-dashboard .legend-blue { background: #2563eb; }
.premium-dashboard .legend-cyan { background: #38bdf8; }
.premium-dashboard .chart-wrap { width: 100%; height: 260px; min-width: 0; }
.premium-dashboard .bar-chart-wrap { width: 100%; height: 290px; min-width: 0; }
.premium-dashboard .chart-total { display: flex; align-items: baseline; gap: 5px; color: #2563eb; font-size: 24px; font-weight: 750; letter-spacing: -.035em; }
.premium-dashboard .chart-total small { color: var(--muted); font-size: 10px; font-weight: 500; letter-spacing: 0; }
.premium-dashboard .donut-wrap { display: flex; align-items: center; gap: 4px; min-width: 0; min-height: 260px; }
.premium-dashboard .donut-chart { flex: 1; min-width: 0; height: 240px; }
.premium-dashboard .donut-legend { display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 16px; padding-right: 2px; }
.premium-dashboard .donut-legend > span { display: flex; align-items: center; gap: 7px; font-size: 10px; line-height: 1.5; color: var(--muted); }
.premium-dashboard .donut-legend strong { margin-left: auto; color: #17335f; font-size: 12px; }
.premium-dashboard .recharts-wrapper { max-width: 100%; }
.premium-dashboard .recharts-tooltip-wrapper { z-index: 5; }
.premium-dashboard .activity-row { display: flex; align-items: flex-start; gap: 12px; padding: 12px 0; }
.premium-dashboard .activity-row + .activity-row { border-top: 1px solid #edf2fa; }
.premium-dashboard .activity-row > div { min-width: 0; }
.premium-dashboard .activity-row p { margin: 0 0 5px; color: #27496f; font-size: 12px; overflow-wrap: anywhere; }
.premium-dashboard .activity-row small { color: var(--muted); font-size: 10px; }
.premium-dashboard .dashboard-grid-bottom { align-items: stretch; }
.premium-dashboard .next-card { overflow: hidden; display: flex; flex-direction: column; align-items: flex-start; justify-content: center; background: linear-gradient(145deg, #f1f7ff, #ffffff); padding: 32px; }
.premium-dashboard .next-card > :not(.next-card-glow) { position: relative; z-index: 1; }
.premium-dashboard .next-card-glow { position: absolute; top: -60px; right: -40px; width: 210px; height: 210px; border-radius: 50%; background: #38bdf815; filter: blur(35px); pointer-events: none; }
.premium-dashboard .next-icon { margin-bottom: 22px; width: 46px; height: 46px; border-radius: 15px; }
.premium-dashboard .next-card h3 { max-width: 330px; margin: 0 0 12px; font-size: 26px; line-height: 1.25; letter-spacing: -.04em; }
.premium-dashboard .next-card p { max-width: 370px; font-size: 12px; line-height: 1.9; margin-bottom: 22px; }
.premium-dashboard .next-card button { min-height: 44px; border-radius: 12px; }
.premium-dashboard .dashboard-alert { padding: 16px 18px; border-radius: 14px; }
.premium-dashboard .dashboard-loading { display: grid; gap: 20px; }
.premium-dashboard .loading-bar { height: 140px; border-radius: 24px; background: linear-gradient(100deg, #eaf2fc 25%, #f8fbff 45%, #eaf2fc 65%); background-size: 200% 100%; animation: dashboard-shimmer 1.8s linear infinite; }
.premium-dashboard .loading-bar-short { height: 100px; width: 70%; }
.premium-dashboard .loading-copy { color: var(--muted); font-size: 13px; }
@keyframes dashboard-shimmer { to { background-position: -200% 0; } }
@keyframes dashboard-enter { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@media (prefers-reduced-motion: no-preference) {
  .premium-dashboard > .page-intro, .premium-dashboard > .dashboard-quick, .premium-dashboard > .kpi-grid { animation: dashboard-enter .45s ease-out both; }
  .premium-dashboard > .dashboard-quick { animation-delay: .06s; }
  .premium-dashboard > .kpi-grid { animation-delay: .12s; }
}
@media (hover: hover) {
  .premium-dashboard .dashboard-quick-button:hover { transform: translateY(-3px); border-color: #9ebff0; box-shadow: 0 10px 22px #2563eb0c; }
  .premium-dashboard .kpi-item > :hover { transform: translateY(-3px); border-color: #bfd7f9; box-shadow: 0 14px 30px #315c9310; }
  .premium-dashboard .focus-row:hover { border-color: #cddff9; background: #f4f8ff; }
  .premium-dashboard .client-pulse-top button:hover { background: #eff6ff; border-color: #9ebff0; }
}
@media (min-width: 1600px) {
  .premium-dashboard .kpi-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
  .premium-dashboard .client-pulse-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
@media (max-width: 1100px) {
  .premium-dashboard .dashboard-grid, .premium-dashboard .analytics-grid { grid-template-columns: 1fr; }
  .premium-dashboard .analytics-grid > :last-child { grid-column: auto; }
  .premium-dashboard .donut-wrap { justify-content: center; }
  .premium-dashboard .donut-chart, .premium-dashboard .donut-legend { max-width: 300px; }
}
@media (max-width: 760px) {
  .premium-dashboard { gap: 20px; }
  .premium-dashboard .kpi-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .premium-dashboard .kpi-item > * { padding: 18px; min-height: 138px; border-radius: 18px; }
  .premium-dashboard .client-pulse-grid { grid-template-columns: 1fr; }
  .premium-dashboard .intro-title-row { flex-direction: column; gap: 14px; }
  .premium-dashboard .intro-status { order: -1; }
  .premium-dashboard .breadcrumb { margin-bottom: 16px; }
  .premium-dashboard .premium-panel { padding: 20px; border-radius: 20px; }
}
@media (max-width: 520px) {
  .premium-dashboard .page-intro { padding: 22px 18px; border-radius: 22px; gap: 20px; }
  .premium-dashboard .page-intro h1 { font-size: 28px; }
  .premium-dashboard .intro-bottom { gap: 16px; padding-top: 18px; }
  .premium-dashboard .intro-actions { width: 100%; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .premium-dashboard .intro-actions button:only-child { grid-column: 1 / -1; }
  .premium-dashboard .intro-actions button { width: 100%; padding: 10px 8px; font-size: 11px; }
  .premium-dashboard .dashboard-quick { padding: 17px; border-radius: 20px; }
  .premium-dashboard .dashboard-quick-head { flex-wrap: wrap; }
  .premium-dashboard .dashboard-quick-head h2 { font-size: 15px; }
  .premium-dashboard .dashboard-quick-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 9px; }
  .premium-dashboard .dashboard-quick-button { flex-direction: column; align-items: flex-start; min-height: 109px; padding: 12px; gap: 10px; border-radius: 14px; }
  .premium-dashboard .dashboard-quick-button strong { font-size: 11px; }
  .premium-dashboard .dashboard-quick-button small { font-size: 9px; }
  .premium-dashboard .kpi-item > * { padding: 15px; }
  .premium-dashboard .premium-panel { padding: 17px; }
  .premium-dashboard .focus-row { grid-template-columns: 4px minmax(0, 1fr); gap: 10px; padding: 12px; }
  .premium-dashboard .focus-row > select, .premium-dashboard .focus-row > div:has(select) { grid-column: 2; width: 100%; }
  .premium-dashboard .focus-row select { min-height: 44px; font-size: 12px; }
  .premium-dashboard .project-mini { padding: 13px; }
  .premium-dashboard .chart-wrap { height: 230px; }
  .premium-dashboard .bar-chart-wrap { height: 260px; }
  .premium-dashboard .donut-wrap { flex-direction: column; gap: 0; }
  .premium-dashboard .donut-chart { flex: none; width: 100%; height: 200px; }
  .premium-dashboard .donut-legend { width: 100%; max-width: none; padding: 0 5px 10px; }
  .premium-dashboard .donut-legend > span { font-size: 11px; }
  .premium-dashboard .next-card { padding: 24px; }
  .premium-dashboard .next-card h3 { font-size: 24px; }
}
@media (max-width: 340px) {
  .premium-dashboard .kpi-grid, .premium-dashboard .intro-actions { grid-template-columns: 1fr; }
  .premium-dashboard .dashboard-quick-grid { grid-template-columns: 1fr; }
  .premium-dashboard .dashboard-quick-button { flex-direction: row; align-items: center; min-height: 70px; }
  .premium-dashboard .client-pulse-stats { grid-template-columns: 1fr 1fr; }
}
@media (prefers-reduced-motion: reduce) {
  .premium-dashboard *, .premium-dashboard *::before, .premium-dashboard *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
  .premium-dashboard .dashboard-quick-button:hover, .premium-dashboard .kpi-item > :hover { transform: none; }
}

`;
const chartColors = ["#2563eb", "#38bdf8", "#8b5cf6", "#0ea5a4"];
const taskStatuses: TaskStatus[] = [
  "Backlog",
  "In Progress",
  "In Review",
  "Completed",
];
const shortGreeting = () => {
  const hour = new Date().getHours();
  return hour < 12
    ? "Good morning"
    : hour < 18
      ? "Good afternoon"
      : "Good evening";
};
function getStats(
  role: Role,
  data: ReturnType<typeof useWorkspace>["data"],
  userId: string,
) {
  const tasks = data.tasks;
  const projects = data.projects.filter(
    (project) => project.status !== "Archived",
  );
  const myTasks =
    role === "employee"
      ? tasks.filter((task) => task.assigneeId === userId)
      : tasks;
  const completed = myTasks.filter((task) => task.status === "Completed");
  const completion = myTasks.length
    ? Math.round((completed.length / myTasks.length) * 100)
    : 0;
  const members = data.users.filter(
    (person) => person.role !== "client" && person.active,
  );
  const pendingApprovals = data.approvals.filter(
    (approval) => approval.status === "Pending",
  ).length;
  const pendingRequests = data.requests.filter(
    (request) => request.status === "Pending",
  ).length;
  const attendanceToday = data.attendance.filter(
    (record) => record.date === new Date().toISOString().slice(0, 10),
  );
  const attendancePercent = members.length
    ? Math.round(
        (attendanceToday.filter(
          (record) => record.status === "Present" || record.status === "Remote",
        ).length /
          members.length) *
          100,
      )
    : 0;
  const activeProjects = projects.filter(
    (project) => project.status === "Active",
  ).length;
  const base = [
    {
      label: "Total Clients",
      value: data.clients.length,
      note: `${data.clients.filter((client) => client.status === "Active").length} active accounts`,
      icon: BriefcaseBusiness,
      tone: "blue",
      module: "clients",
    },
    {
      label: "Active Projects",
      value: activeProjects,
      note: `${projects.filter((project) => project.health === "At risk").length} need attention`,
      icon: FolderKanban,
      tone: "cyan",
      module: "projects",
    },
    {
      label: "Total Team Members",
      value: members.length,
      note: `${data.departments.length} departments`,
      icon: UsersRound,
      tone: "violet",
      module: "people",
    },
    {
      label: "Pending Approvals",
      value: pendingApprovals,
      note: `${pendingRequests} requests in review`,
      icon: ShieldAlert,
      tone: "amber",
      module: "approvals",
    },
    {
      label: "Overdue Tasks",
      value: tasks.filter(isOverdue).length,
      note: "Across permitted scope",
      icon: Clock3,
      tone: "rose",
      module: "tasks",
    },
    {
      label: "Overall Completion Rate",
      value: `${completion}%`,
      note: `${completed.length} completed tasks`,
      icon: TrendingUp,
      tone: "green",
      module: "reports",
    },
  ];
  if (role === "manager")
    return [
      {
        label: "Active Projects",
        value: activeProjects,
        note: `${projects.length} in assigned scope`,
        icon: FolderKanban,
        tone: "cyan",
        module: "projects",
      },
      {
        label: "Assigned Team Members",
        value: members.length,
        note: `${data.teams.length} visible teams`,
        icon: UsersRound,
        tone: "violet",
        module: "people",
      },
      {
        label: "Open Tasks",
        value: tasks.filter((task) => task.status !== "Completed").length,
        note: `${tasks.filter((task) => task.status === "In Progress").length} in progress`,
        icon: ListTodo,
        tone: "blue",
        module: "tasks",
      },
      {
        label: "Overdue Tasks",
        value: tasks.filter(isOverdue).length,
        note: "Needs a clear next owner",
        icon: Clock3,
        tone: "rose",
        module: "tasks",
      },
      {
        label: "Pending Requests / Approvals",
        value: pendingApprovals + pendingRequests,
        note: `${pendingApprovals} approvals · ${pendingRequests} requests`,
        icon: ShieldAlert,
        tone: "amber",
        module: "approvals",
      },
      {
        label: "Assigned-Scope Completion",
        value: `${completion}%`,
        note: `${completed.length} completed tasks`,
        icon: TrendingUp,
        tone: "green",
        module: "reports",
      },
    ];
  if (role === "team_leader")
    return [
      {
        label: "Tasks Due Today",
        value: tasks.filter(isDueToday).length,
        note: "Protect today’s focus",
        icon: CalendarClock,
        tone: "blue",
        module: "calendar",
      },
      {
        label: "In-Progress Tasks",
        value: tasks.filter((task) => task.status === "In Progress").length,
        note: `${tasks.filter((task) => task.status === "In Review").length} awaiting review`,
        icon: ListTodo,
        tone: "cyan",
        module: "board",
      },
      {
        label: "Overdue Tasks",
        value: tasks.filter(isOverdue).length,
        note: "Resolve or re-plan",
        icon: Clock3,
        tone: "rose",
        module: "tasks",
      },
      {
        label: "Completed This Week",
        value: completed.filter((task) =>
          isThisWeek(task.updatedAt.slice(0, 10)),
        ).length,
        note: `${completion}% of visible work`,
        icon: CheckCircle2,
        tone: "green",
        module: "reports",
      },
      {
        label: "Team Attendance",
        value: `${attendancePercent}%`,
        note: `${attendanceToday.length} check-ins today`,
        icon: CheckSquare2,
        tone: "violet",
        module: "attendance",
      },
      {
        label: "Active Team Projects",
        value: activeProjects,
        note: `${projects.length} assigned projects`,
        icon: FolderKanban,
        tone: "amber",
        module: "projects",
      },
    ];
  if (role === "employee")
    return [
      {
        label: "My Open Tasks",
        value: myTasks.filter((task) => task.status !== "Completed").length,
        note: `${myTasks.filter((task) => task.status === "In Progress").length} in progress`,
        icon: ListTodo,
        tone: "blue",
        module: "tasks",
      },
      {
        label: "Due Today",
        value: myTasks.filter(isDueToday).length,
        note: "Your next few hours",
        icon: CalendarClock,
        tone: "cyan",
        module: "calendar",
      },
      {
        label: "Overdue Tasks",
        value: myTasks.filter(isOverdue).length,
        note: "Make the next step visible",
        icon: Clock3,
        tone: "rose",
        module: "tasks",
      },
      {
        label: "Completed This Week",
        value: completed.filter((task) =>
          isThisWeek(task.updatedAt.slice(0, 10)),
        ).length,
        note: `${completion}% of assigned work`,
        icon: CheckCircle2,
        tone: "green",
        module: "reports",
      },
      {
        label: "Active Projects",
        value: activeProjects,
        note: `${projects.length} assigned projects`,
        icon: FolderKanban,
        tone: "violet",
        module: "projects",
      },
      {
        label: "Personal Progress",
        value: `${completion}%`,
        note: `${attendanceToday.some((record) => record.userId === userId) ? "Checked in today" : "Not checked in yet"}`,
        icon: Sparkles,
        tone: "amber",
        module: "attendance",
      },
    ];
  if (role === "client")
    return [
      {
        label: "Open Work Items",
        value: tasks.filter((task) => task.status !== "Completed").length,
        note: `${tasks.filter((task) => task.status === "In Review").length} in review`,
        icon: ListTodo,
        tone: "blue",
        module: "tasks",
      },
      {
        label: "Due Soon",
        value: tasks.filter((task) => isDueToday(task) || isOverdue(task))
          .length,
        note: "Visible delivery dates",
        icon: CalendarClock,
        tone: "cyan",
        module: "calendar",
      },
      {
        label: "Items Needing Attention",
        value: data.approvals.filter(
          (approval) => approval.status === "Changes requested",
        ).length,
        note: "Feedback keeps work moving",
        icon: ShieldAlert,
        tone: "amber",
        module: "approvals",
      },
      {
        label: "Completed Work",
        value: completed.length,
        note: `${completion}% of visible items`,
        icon: CheckCircle2,
        tone: "green",
        module: "projects",
      },
      {
        label: "Active Projects",
        value: activeProjects,
        note: "Your active engagements",
        icon: FolderKanban,
        tone: "violet",
        module: "projects",
      },
      {
        label: "Delivery Progress",
        value: `${projects.length ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length) : 0}%`,
        note: "Across shared projects",
        icon: TrendingUp,
        tone: "rose",
        module: "projects",
      },
    ];
  return base;
}
function PageIntro({
  role,
  userName,
  mode,
  onQuickAdd,
  canQuickAdd,
}: {
  role: Role;
  userName: string;
  mode: string;
  onQuickAdd: () => void;
  canQuickAdd: boolean;
}) {
  const copy: Record<Role, { title: string; description: string }> = {
    director: {
      title: "Director Dashboard",
      description:
        "See the health of the whole studio, then move the right work forward.",
    },
    manager: {
      title: "Manager Dashboard",
      description:
        "Keep your people, projects and client commitments in a clear operating rhythm.",
    },
    team_leader: {
      title: "Team Lead Dashboard",
      description:
        "Turn today’s priorities into steady, visible progress for your team.",
    },
    employee: {
      title: "My Workspace",
      description:
        "A focused view of what needs your attention today and what comes next.",
    },
    client: {
      title: "Client Portal",
      description:
        "Follow shared project progress, reviews and the next milestone in one place.",
    },
  };
  const current = copy[role];
  return (
    <div className="page-intro">
      <div className="intro-main">
        <div className="breadcrumb">
          <span>Workspace</span>
          <span>/</span>
          <strong>{roleLabels[role]}</strong>
        </div>
        <div className="intro-title-row">
          <div>
            <span className="eyebrow">
              {shortGreeting()}, {userName.split(" ")[0]}
            </span>
            <h1>{current.title}</h1>
            <p>{current.description}</p>
          </div>
          <div className="intro-status">
            <Badge tone={mode === "firebase" ? "success" : "blue"} dot>
              {mode === "firebase" ? "Live Firebase data" : "Local demo data"}
            </Badge>
          </div>
        </div>
      </div>
      <div className="intro-bottom">
        <div className="intro-date">
          <span><CalendarClock size={17} aria-hidden="true" /></span>
          <span>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</span>
        </div>
      <div className="intro-actions">
        <Button
          variant="secondary"
          icon={BarChart3}
          onClick={() =>
            document
              .getElementById("dashboard-analytics")
              ?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
                block: "start",
              })
          }
        >
          View insights
        </Button>
        {canQuickAdd && (
          <Button icon={Plus} onClick={onQuickAdd}>
            Quick add
          </Button>
        )}
      </div>
      </div>
    </div>
  );
}
export function RoleDashboard() {
  const { user } = useAuth();
  const { data, mode, loading, error, updateTask } = useWorkspace();
  const navigate = useNavigate();
  const { notify } = useToast();
  const [quickAdd, setQuickAdd] = useState<{
    type?: QuickAddType;
    role?: "employee" | "team_leader" | "manager";
  } | null>(null);
  const [savingTaskIds, setSavingTaskIds] = useState<string[]>([]);
  const chartData = useMemo(
    () =>
      Array.from({ length: 6 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (5 - index));
        const key = date.toISOString().slice(0, 10);
        return {
          day: date.toLocaleDateString("en-IN", { weekday: "short" }),
          completed: data.tasks.filter(
            (task) =>
              task.status === "Completed" &&
              task.updatedAt.slice(0, 10) === key,
          ).length,
          created: data.tasks.filter(
            (task) => task.createdAt.slice(0, 10) === key,
          ).length,
        };
      }),
    [data.tasks],
  );
  if (!user) return null;
  if (loading)
    return (
      <div className="dashboard-page premium-dashboard" role="status" aria-live="polite" aria-busy="true">
        <style>{dashboardStyles}</style>
        <div className="dashboard-loading">
          <div className="loading-bar" aria-hidden="true" />
          <div className="loading-bar loading-bar-short" aria-hidden="true" />
          <span className="loading-copy">Loading your workspace…</span>
        </div>
      </div>
    );
  const stats = getStats(user.role, data, user.id);
  const metrics = taskMetrics(data.tasks);
  const visibleProjects = data.projects
    .filter((project) => project.status !== "Archived")
    .slice(0, 5);
  const focusTasks = [...data.tasks]
    .filter((task) => task.status !== "Completed")
    .sort(
      (a, b) =>
        Number(isOverdue(b)) - Number(isOverdue(a)) ||
        new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    )
    .slice(0, 6);
  const teamPerformance = data.users
    .filter((candidate) => candidate.role !== "client")
    .map((candidate) => {
      const tasks = data.tasks.filter(
        (task) => task.assigneeId === candidate.id,
      );
      return {
        name: candidate.name.split(" ")[0],
        completed: tasks.filter((task) => task.status === "Completed").length,
        open: tasks.filter((task) => task.status !== "Completed").length,
      };
    })
    .filter((person) => person.completed || person.open);
  const taskDistribution = taskStatuses
    .map((status) => ({
      name: status,
      value: data.tasks.filter((task) => task.status === status).length,
    }))
    .filter((item) => item.value);
  const activity = data.activities.slice(0, 6);
  const activityIcons: Record<string, LucideIcon> = {
    Project: FolderKanban,
    Task: CheckSquare2,
    Client: BriefcaseBusiness,
    File: FileText,
    Approval: ShieldAlert,
    People: UsersRound,
    Finance: WalletCards,
    Attendance: CheckSquare2,
    Goal,
  };
  const clientHealth = data.clients.slice(0, 4);
  const quickActions: {
    key: string;
    title: string;
    hint: string;
    type: QuickAddType;
    role?: "employee" | "team_leader" | "manager";
    icon: LucideIcon;
    visible: boolean;
  }[] = [
    {
      key: "employee",
      title: "Add employee",
      hint: "Team & reporting lead",
      type: "user",
      role: "employee",
      icon: UsersRound,
      visible:
        hasPermission(user, "people:write") &&
        ["director", "manager", "team_leader"].includes(user.role),
    },
    {
      key: "team_leader",
      title: "Add team lead",
      hint: "Team & manager",
      type: "user",
      role: "team_leader",
      icon: UsersRound,
      visible:
        hasPermission(user, "people:write") &&
        ["director", "manager"].includes(user.role),
    },
    {
      key: "manager",
      title: "Add manager",
      hint: "Department & ownership",
      type: "user",
      role: "manager",
      icon: BriefcaseBusiness,
      visible: hasPermission(user, "people:write") && user.role === "director",
    },
    {
      key: "client",
      title: "Add client",
      hint: "Account & billing",
      type: "client",
      icon: BriefcaseBusiness,
      visible: hasPermission(user, "clients:write"),
    },
    {
      key: "project",
      title: "Create project",
      hint: "Plan the next delivery",
      type: "project",
      icon: FolderKanban,
      visible: hasPermission(user, "projects:write"),
    },
    {
      key: "task",
      title: "Create task",
      hint: "Assign the next action",
      type: "task",
      icon: CheckSquare2,
      visible: hasPermission(user, "tasks:write"),
    },
    {
      key: "approval",
      title: "Request approval",
      hint: "Keep reviews moving",
      type: "approval",
      icon: ShieldAlert,
      visible: hasPermission(user, "approvals:write"),
    },
    {
      key: "finance",
      title: "Finance record",
      hint: "Budget, invoice & payment",
      type: "finance",
      icon: CircleDollarSign,
      visible: hasPermission(user, "finance:write"),
    },
    {
      key: "goal",
      title: "Create goal",
      hint: "Set a measurable target",
      type: "goal",
      icon: Goal,
      visible: ["director", "manager"].includes(user.role),
    },
  ];
  const visibleQuickActions = quickActions.filter((action) => action.visible);
  const quickActionBar = visibleQuickActions.length ? (
    <section className="dashboard-quick" aria-label="Create workspace records">
      <div className="dashboard-quick-head">
        <div>
          <h2>Your workspace, one action away</h2>
          <p>Create people, plan work and keep progress moving.</p>
        </div>
        <span className="dashboard-quick-badge">
          <Sparkles size={13} aria-hidden="true" />
          {visibleQuickActions.length} quick actions
        </span>
      </div>
      <div className="dashboard-quick-grid">
        {visibleQuickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              type="button"
              className="dashboard-quick-button"
              key={action.key}
              onClick={() =>
                setQuickAdd({ type: action.type, role: action.role })
              }
            >
              <span>
                <Icon size={17} aria-hidden="true" />
              </span>
              <span>
                <strong>{action.title}</strong>
                <small>{action.hint}</small>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  ) : null;
  const changeTask = async (task: Task, status: TaskStatus) => {
    if (task.status === status || savingTaskIds.includes(task.id)) return;
    setSavingTaskIds((ids) => [...ids, task.id]);
    try {
      await updateTask(task.id, { status });
      notify(`Task moved to ${status}.`, "success");
    } catch (taskError) {
      notify(
        taskError instanceof Error ? taskError.message : "Task update failed.",
        "error",
      );
    } finally {
      setSavingTaskIds((ids) => ids.filter((id) => id !== task.id));
    }
  };
  return (
    <div className="dashboard-page premium-dashboard">
      <style>{dashboardStyles}</style>
      <PageIntro
        role={user.role}
        userName={user.name}
        mode={mode}
        onQuickAdd={() => setQuickAdd({})}
        canQuickAdd={visibleQuickActions.length > 0}
      />
      {quickActionBar}
      {error ? (
        <div className="form-alert form-alert-error dashboard-alert">
          {error}
        </div>
      ) : null}
      <section className="kpi-grid" aria-label="Live workspace metrics">
        {stats.map((stat) => (
          <div className="kpi-item" key={stat.label}>
          <StatCard
            label={stat.label}
            value={stat.value}
            note={stat.note}
            icon={stat.icon}
            tone={stat.tone}
            onClick={() => navigate(getModulePath(user, stat.module))}
          />
          </div>
        ))}
      </section>
      <div className="dashboard-grid dashboard-grid-top">
        <Card className="premium-panel focus-card">
          <SectionHeading
            eyebrow={
              user.role === "employee" ? "Your focus" : "Execution pulse"
            }
            title={
              user.role === "employee"
                ? "Today’s priorities"
                : "Work that needs a decision"
            }
            description={
              user.role === "employee"
                ? "Keep the next action small and visible."
                : "A quick view of the most time-sensitive work in your scope."
            }
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(getModulePath(user, "tasks"))}
              >
                All tasks <ArrowRight size={14} />
              </Button>
            }
          />
          {focusTasks.length ? (
            <div className="focus-list">
              {focusTasks.map((task) => (
                <div className="focus-row" key={task.id} aria-busy={savingTaskIds.includes(task.id)}>
                  <span
                    className={`priority-line priority-${statusTone(task.priority)}`}
                  />
                  <div className="focus-row-main">
                    <strong>{task.title}</strong>
                    <span>
                      <span>
                        {data.projects.find(
                          (project) => project.id === task.projectId,
                        )?.name ?? "No project"}
                      </span>
                      <span>·</span>
                      <span className={isOverdue(task) ? "text-danger" : ""}>
                        {isOverdue(task)
                          ? "Overdue"
                          : `Due ${formatCompactDate(task.dueDate)}`}
                      </span>
                      {savingTaskIds.includes(task.id) && <span className="task-saving" role="status">Saving…</span>}
                    </span>
                  </div>
                  <SelectInput
                    aria-label={`Change status for ${task.title}`}
                    value={task.status}
                    disabled={savingTaskIds.includes(task.id)}
                    onChange={(event) =>
                      void changeTask(task, event.target.value as TaskStatus)
                    }
                  >
                    <>
                      {taskStatuses.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </>
                  </SelectInput>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CheckCircle2}
              title="All clear for now"
              description="No open tasks are waiting in this scope."
            />
          )}
        </Card>
        <Card className="premium-panel project-pulse-card">
          <SectionHeading
            eyebrow="Portfolio"
            title="Project health"
            description="The projects that shape this week."
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(getModulePath(user, "projects"))}
              >
                View all <ArrowRight size={14} />
              </Button>
            }
          />
          {visibleProjects.length ? (
            <div className="project-mini-list">
              {visibleProjects.map((project) => (
                <div className="project-mini" key={project.id}>
                  <div className="project-mini-top">
                    <span className="project-avatar">
                      <FolderKanban size={16} />
                    </span>
                    <div>
                      <strong>{project.name}</strong>
                      <span>
                        {data.clients.find(
                          (client) => client.id === project.clientId,
                        )?.company ?? "Internal"}
                      </span>
                    </div>
                    <Badge tone={statusTone(project.health)} dot>
                      {project.health}
                    </Badge>
                  </div>
                  <div className="project-mini-meta">
                    <ProgressBar
                      value={project.progress}
                      label={`${project.progress}%`}
                      tone={
                        project.health === "At risk"
                          ? "amber"
                          : project.health === "Delayed"
                            ? "rose"
                            : "blue"
                      }
                    />
                    <span>Due {formatCompactDate(project.dueDate)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderKanban}
              title="No projects yet"
              description="Projects assigned to this role will appear here."
            />
          )}
        </Card>
      </div>
      <section className="client-summary-section">
        <SectionHeading
          eyebrow="Client pulse"
          title={
            user.role === "client"
              ? "Your engagement"
              : "Accounts that deserve context"
          }
          description="A concise signal across current client relationships."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                navigate(
                  getModulePath(
                    user,
                    user.role === "client" ? "projects" : "clients",
                  ),
                )
              }
            >
              Open workspace <ArrowRight size={14} />
            </Button>
          }
        />
        <div className="client-pulse-grid">
          {clientHealth.length ? (
            clientHealth.map((client) => (
              <Card className="premium-panel client-pulse-card" key={client.id}>
                <div className="client-pulse-top">
                  <Avatar
                    name={client.company}
                    size="md"
                    tone={client.status === "At risk" ? "rose" : "blue"}
                  />
                  <div>
                    <strong>{client.company}</strong>
                    <span>
                      {client.name} · {client.industry}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Open workspace for ${client.company}`}
                    onClick={() => navigate(getModulePath(user, user.role === "client" ? "projects" : "clients"))}
                  >
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
                <div className="client-pulse-stats">
                  <span>
                    <small>Projects</small>
                    <strong>{client.projectIds.length}</strong>
                  </span>
                  <span>
                    <small>Open work</small>
                    <strong>
                      {
                        data.tasks.filter(
                          (task) =>
                            task.clientId === client.id &&
                            task.status !== "Completed",
                        ).length
                      }
                    </strong>
                  </span>
                  <span>
                    <small>Health</small>
                    <Badge tone={statusTone(client.status)}>
                      {client.status}
                    </Badge>
                  </span>
                </div>
                {client.attentionRequired ? (
                  <div className="attention-note">
                    <ShieldAlert size={14} /> Needs a follow-up
                  </div>
                ) : (
                  <div className="attention-note attention-good">
                    <CheckCircle2 size={14} /> Relationship is steady
                  </div>
                )}
              </Card>
            ))
          ) : (
            <Card className="premium-panel">
              <EmptyState
                icon={BriefcaseBusiness}
                title="No client signal yet"
                description="Client-linked records will appear here when available."
              />
            </Card>
          )}
        </div>
      </section>
      <section id="dashboard-analytics" className="analytics-section">
        <SectionHeading
          eyebrow="Insights"
          title="See the shape of the work"
          description="Calculated from the permitted workspace records, not placeholder numbers."
        />
        <div className="analytics-grid">
          <Card className="premium-panel chart-card chart-wide">
            <div className="chart-card-head">
              <div>
                <h3>Momentum over the last six days</h3>
                <p>Created vs completed tasks</p>
              </div>
              <span className="chart-legend">
                <i className="legend-blue" /> Completed{" "}
                <i className="legend-cyan" /> Created
              </span>
            </div>
            <div className="chart-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 6, left: -24, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="completedGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="createdGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#38bdf8"
                        stopOpacity={0.22}
                      />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 4"
                    vertical={false}
                    stroke="var(--line)"
                  />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--muted)", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--panel-strong)",
                      border: "1px solid var(--line-strong)",
                      borderRadius: 12,
                      color: "var(--text)",
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fill="url(#completedGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    fill="url(#createdGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="premium-panel chart-card">
            <div className="chart-card-head">
              <div>
                <h3>Task status</h3>
                <p>{metrics.total} visible tasks</p>
              </div>
              <span className="chart-total">
                {metrics.completed}
                <small>done</small>
              </span>
            </div>
            <div className="donut-wrap">
              {taskDistribution.length ? (
                <>
                  <div className="donut-chart">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={taskDistribution}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={48}
                        outerRadius={70}
                        paddingAngle={4}
                        stroke="none"
                      >
                        {taskDistribution.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={chartColors[taskStatuses.indexOf(entry.name as TaskStatus)]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: "var(--panel-strong)",
                          border: "1px solid var(--line-strong)",
                          borderRadius: 12,
                          color: "var(--text)",
                          fontSize: 12,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  </div>
                  <div className="donut-legend">
                    {taskDistribution.map((entry) => (
                      <span key={entry.name}>
                        <i
                          style={{
                            background: chartColors[taskStatuses.indexOf(entry.name as TaskStatus)],
                          }}
                        />
                        {entry.name}
                        <strong>{entry.value}</strong>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  icon={ListTodo}
                  title="No task data"
                  description="Create a task to see distribution."
                />
              )}
            </div>
          </Card>
          <Card className="premium-panel chart-card chart-wide">
            <div className="chart-card-head">
              <div>
                <h3>Team performance</h3>
                <p>Open and completed work by teammate</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(getModulePath(user, "workload"))}
              >
                View workload <ArrowRight size={14} />
              </Button>
            </div>
            <div className="bar-chart-wrap">
              {teamPerformance.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={teamPerformance}
                    barGap={5}
                    margin={{ top: 8, right: 6, left: -24, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="var(--line)"
                    />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted)", fontSize: 11 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted)", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--panel-strong)",
                        border: "1px solid var(--line-strong)",
                        borderRadius: 12,
                        color: "var(--text)",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      fill="#2563eb"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="open"
                      name="Open"
                      fill="#bae6fd"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  icon={UsersRound}
                  title="No team activity"
                  description="Assigned work will create a performance view."
                />
              )}
            </div>
          </Card>
        </div>
      </section>
      <div className="dashboard-grid dashboard-grid-bottom">
        <Card className="premium-panel">
          <SectionHeading
            eyebrow="Activity"
            title="What changed recently"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(getModulePath(user, "activity"))}
              >
                Full activity <ArrowRight size={14} />
              </Button>
            }
          />
          {activity.length ? (
            <div className="activity-list">
              {activity.map((item) => {
                const Icon = activityIcons[item.entityType] ?? Activity;
                return (
                  <div className="activity-row" key={item.id}>
                    <span className="activity-icon">
                      <Icon size={15} />
                    </span>
                    <div>
                      <p>
                        <strong>{item.actorName}</strong> {item.action}
                      </p>
                      <small>
                        {item.entityType} · {formatRelativeTime(item.createdAt)}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Activity}
              title="No activity yet"
              description="Workspace changes will appear here."
            />
          )}
        </Card>
        <Card className="premium-panel next-card">
          <div className="next-card-glow" />
          <span className="next-icon">
            <Goal size={18} />
          </span>
          <div className="eyebrow">A small ritual</div>
          <h3>End the day with a clean handoff.</h3>
          <p>
            Move unfinished work to a clear status, add one sentence of context
            and give tomorrow a softer start.
          </p>
          <Button
            variant="secondary"
            onClick={() => navigate(getModulePath(user, "tasks"))}
          >
            Review my tasks <ArrowRight size={15} />
          </Button>
        </Card>
      </div>
      {quickAdd && (
        <QuickAddModal
          open
          onClose={() => setQuickAdd(null)}
          initialType={quickAdd.type}
          initialRole={quickAdd.role}
        />
      )}
    </div>
  );
}
