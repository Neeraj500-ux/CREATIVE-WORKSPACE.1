import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Activity, ArrowUpRight, Bell, ChevronDown, Command, HelpCircle, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Plus, Search, Sparkles, Sun, X } from "lucide-react";
import { getDashboardPath, getVisibleNavigation, hasPermission } from "../lib/permissions";
import { formatRelativeTime, roleLabels } from "../lib/formatters";
import { useAuth } from "../services/auth";
import { useWorkspace } from "../services/workspace";
import { QuickAddModal } from "../components/QuickAddModal";
import { Avatar, Badge, Button, IconButton, Modal, useToast } from "../components/ui";
import type { QuickAddType } from "../types";

const grouped = (path: string) => {
  if (["people", "clients", "departments-teams", "spaces"].includes(path)) return "Manage";
  if (["projects", "tasks", "board", "calendar", "timeline", "workload", "goals"].includes(path)) return "Plan & deliver";
  return "Operate";
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const { data, mode } = useWorkspace();
  const { notify } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<QuickAddType | undefined>(undefined);
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [dark, setDark] = useState(() => window.localStorage.getItem("creative-crew:theme") === "dark");
  const commandInput = useRef<HTMLInputElement>(null);
  const basePath = user ? getDashboardPath(user.role) : "/login";
  const navItems = useMemo(() => getVisibleNavigation(user), [user]);
  const unreadCount = data.notifications.filter((item) => !item.read && item.userId === user?.id).length;

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    window.localStorage.setItem("creative-crew:theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setCommandOpen(true); }
      if (event.key === "Escape") { setCommandOpen(false); setProfileOpen(false); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (commandOpen) window.setTimeout(() => commandInput.current?.focus(), 40);
  }, [commandOpen]);

  if (!user) return null;

  const openQuickAdd = (type?: QuickAddType) => { setQuickAddType(type); setQuickAddOpen(true); };
  const go = (path: string) => { navigate(path); setMobileOpen(false); setCommandOpen(false); };

  const searchResults = [
    ...navItems.map((item) => ({ id: `nav-${item.path}`, kind: "Module", label: item.label, meta: item.description, path: `${basePath}${item.path ? `/${item.path}` : ""}` })),
    ...data.clients.map((item) => ({ id: item.id, kind: "Client", label: item.company, meta: `${item.name} · ${item.status}`, path: `${basePath}/clients` })),
    ...data.projects.map((item) => ({ id: item.id, kind: "Project", label: item.name, meta: `${item.progress}% complete · ${item.health}`, path: `${basePath}/projects` })),
    ...data.tasks.map((item) => ({ id: item.id, kind: "Task", label: item.title, meta: `${item.status} · ${item.priority}`, path: `${basePath}/tasks` })),
    ...data.users.map((item) => ({ id: item.id, kind: "Person", label: item.name, meta: `${roleLabels[item.role]} · ${item.title}`, path: `${basePath}/people` })),
  ].filter((item) => !query.trim() || `${item.label} ${item.meta} ${item.kind}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12);

  const groupedItems = navItems.reduce<Record<string, typeof navItems>>((result, item) => { const key = grouped(item.path); result[key] = [...(result[key] ?? []), item]; return result; }, {});

  return <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><Link to={basePath} onClick={() => setMobileOpen(false)}><span className="brand-mark"><Sparkles size={17} /></span><span className="brand-name">creative-crew</span></Link><button className="mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)} type="button"><X size={19} /></button></div>
      <div className="workspace-switcher"><span className="workspace-logo">cc</span><span className="workspace-copy"><strong>creative-crew</strong><small>Studio workspace</small></span><ChevronDown size={15} /></div>
      <nav className="sidebar-nav" aria-label="Workspace navigation">
        {Object.entries(groupedItems).map(([group, items]) => <div className="nav-group" key={group}><span className="nav-group-label">{group}</span>{items.map((item) => { const Icon = item.icon; const path = `${basePath}${item.path ? `/${item.path}` : ""}`; const active = item.path ? location.pathname.startsWith(path) : location.pathname === basePath; return <Link className={`nav-item ${active ? "nav-active" : ""}`} to={path} key={item.path || "overview"} onClick={() => setMobileOpen(false)}><Icon size={17} /><span>{item.label}</span>{item.path === "notifications" && unreadCount > 0 ? <em>{unreadCount}</em> : null}</Link>; })}</div>)}
      </nav>
      <div className="sidebar-bottom"><div className="sidebar-tip"><span className="tip-icon"><Sparkles size={15} /></span><strong>Make space for the next good idea.</strong><small>Capture work as soon as it becomes clear.</small><button type="button" onClick={() => openQuickAdd("task")}>Quick add <ArrowUpRight size={14} /></button></div><div className="sidebar-collapse"><button type="button" onClick={() => setCollapsed((value) => !value)}>{collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}<span>{collapsed ? "Expand" : "Collapse sidebar"}</span></button></div></div>
    </aside>
    {mobileOpen ? <button className="drawer-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} type="button" /> : null}
    <div className="app-main">
      <header className="topbar"><div className="topbar-left"><IconButton className="mobile-menu" label="Open navigation" icon={Menu} onClick={() => setMobileOpen(true)} /><div className="mobile-brand"><span className="brand-mark"><Sparkles size={15} /></span><span>creative-crew</span></div><button className="search-trigger" type="button" onClick={() => setCommandOpen(true)}><Search size={17} /><span>Search workspace...</span><kbd><Command size={12} /> K</kbd></button></div><div className="topbar-actions"><Badge tone={mode === "firebase" ? "success" : "blue"} dot>{mode === "firebase" ? "Connected" : "Demo mode"}</Badge><IconButton label={dark ? "Use light theme" : "Use dark theme"} icon={dark ? Sun : Moon} onClick={() => setDark((value) => !value)} /><IconButton label="Help and activity" icon={HelpCircle} onClick={() => notify("Try Ctrl/Cmd + K to jump anywhere, or use Quick add to create work.", "info")} /><button className="notification-button" type="button" aria-label={`${unreadCount} unread notifications`} onClick={() => go(`${basePath}/notifications`)}><Bell size={18} />{unreadCount > 0 ? <span>{unreadCount}</span> : null}</button><div className="profile-wrap"><button className="profile-trigger" type="button" aria-expanded={profileOpen} onClick={() => setProfileOpen((value) => !value)}><Avatar name={user.name} size="sm" tone="cyan" /><span className="profile-trigger-copy"><strong>{user.name}</strong><small>{roleLabels[user.role]}</small></span><ChevronDown size={15} /></button>{profileOpen ? <><div style={{ position: "fixed", inset: 0, zIndex: 45 }} onClick={() => setProfileOpen(false)} aria-hidden="true" /><div className="profile-menu"><div className="profile-menu-head"><Avatar name={user.name} size="md" tone="cyan" /><span><strong>{user.name}</strong><small>{user.email}</small></span></div><button type="button" onClick={() => { setProfileOpen(false); go(`${basePath}/settings`); }}>Profile & settings</button><button type="button" onClick={() => { setProfileOpen(false); void logout(); navigate("/login"); }}><LogOut size={16} />Log out</button></div></> : null}</div></div></header>
      <main className="page-content"><Outlet /></main>
    </div>
    <button className="floating-add" type="button" aria-label="Quick add" onClick={() => openQuickAdd()}><Plus size={20} /><span>Quick add</span></button>
    <QuickAddModal open={quickAddOpen} initialType={quickAddType} onClose={() => { setQuickAddOpen(false); setQuickAddType(undefined); }} />
    <Modal open={commandOpen} onClose={() => setCommandOpen(false)} title="Command center" subtitle="Search permitted modules, clients, projects, tasks and people." wide><div className="command-search"><Search size={18} /><input ref={commandInput} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search everything you can access..." /></div><div className="command-hint"><span>Navigate</span><kbd>↑</kbd><kbd>↓</kbd><span>Open</span><kbd>↵</kbd><span>Close</span><kbd>Esc</kbd></div><div className="command-results">{searchResults.length ? searchResults.map((result) => <button type="button" className="command-result" key={`${result.kind}-${result.id}`} onClick={() => go(result.path)}><span className="command-result-icon">{result.kind === "Module" ? <Activity size={16} /> : result.kind === "Task" ? <CheckSquareIcon /> : <Search size={16} />}</span><span><strong>{result.label}</strong><small>{result.kind} · {result.meta}</small></span><ArrowUpRight size={16} /></button>) : <div className="command-empty"><Search size={22} /><strong>No permitted results</strong><span>Try a client, task, project or module name.</span></div>}</div></Modal>
  </div>;
}

function CheckSquareIcon() {
  return <span className="check-square-icon">✓</span>;
}
