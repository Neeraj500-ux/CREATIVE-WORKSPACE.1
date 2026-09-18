import { createContext, useContext, useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, LoaderCircle, X } from "lucide-react";
import { formatCompactDate, statusTone } from "../lib/formatters";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "soft";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", icon: Icon, loading, children, className = "", disabled, ...props }: ButtonProps) {
  return (
    <button className={`button button-${variant} button-${size} ${className}`} disabled={disabled || loading} {...props}>
      {loading ? <LoaderCircle className="spin" size={16} /> : Icon ? <Icon size={16} strokeWidth={2.2} /> : null}
      <span>{children}</span>
    </button>
  );
}

export function IconButton({ label, icon: Icon, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; icon: LucideIcon }) {
  return <button aria-label={label} title={label} className={`icon-button ${className}`} {...props}><Icon size={18} strokeWidth={2} /></button>;
}

export function TextInput({ label, error, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string }) {
  return (
    <label className={`field ${className}`}>
      {label ? <span className="field-label">{label}</span> : null}
      <input {...props} />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

export function SelectInput({ label, error, children, className = "", ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <label className={`field ${className}`}>
      {label ? <span className="field-label">{label}</span> : null}
      <select {...props}>{children}</select>
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

export function TextArea({ label, error, className = "", ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string; error?: string }) {
  return (
    <label className={`field ${className}`}>
      {label ? <span className="field-label">{label}</span> : null}
      <textarea {...props} />
      {error ? <span className="field-error">{error}</span> : null}
    </label>
  );
}

export function Avatar({ name, size = "md", tone = "blue" }: { name: string; size?: "sm" | "md" | "lg"; tone?: string }) {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "CC";
  return <span className={`avatar avatar-${size} avatar-${tone}`} aria-label={name}>{initials}</span>;
}

export function Badge({ children, tone = "neutral", dot = false }: { children: ReactNode; tone?: string; dot?: boolean }) {
  return <span className={`badge badge-${statusTone(tone)}`}>{dot ? <span className="badge-dot" /> : null}{children}</span>;
}

export function ProgressBar({ value, tone = "blue", label }: { value: number; tone?: string; label?: string }) {
  const safeValue = Math.min(100, Math.max(0, value));
  return <div className="progress-wrap" aria-label={label ?? `${safeValue}% complete`}><div className={`progress-track progress-${tone}`}><span style={{ width: `${safeValue}%` }} /></div>{label ? <span className="progress-label">{label}</span> : null}</div>;
}

export function Card({ children, className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`card ${className}`} {...props}>{children}</div>;
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{action ? <div className="section-heading-action">{action}</div> : null}</div>;
}

export function StatCard({ label, value, note, icon: Icon, tone = "blue", onClick }: { label: string; value: string | number; note: string; icon: LucideIcon; tone?: string; onClick?: () => void }) {
  return <button className={`stat-card stat-${tone}`} onClick={onClick} type="button"><span className="stat-icon"><Icon size={18} /></span><span className="stat-copy"><span className="stat-label">{label}</span><strong>{value}</strong><span className="stat-note">{note}</span></span><span className="stat-spark" aria-hidden="true"><i /><i /><i /><i /><i /></span></button>;
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><Icon size={24} /></span><h3>{title}</h3><p>{description}</p>{action ? <div className="empty-action">{action}</div> : null}</div>;
}

export function LoadingState({ label = "Loading workspace" }: { label?: string }) {
  return <div className="loading-state"><LoaderCircle className="spin" size={22} /><span>{label}</span></div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />;
}

export function Modal({ open, onClose, title, subtitle, children, footer, wide = false }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handleKey); document.body.style.overflow = previousOverflow; };
  }, [onClose, open]);
  if (!open) return null;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><div className="eyebrow">creative-crew</div><h2 id="modal-title">{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div><button ref={closeRef} className="modal-close" onClick={onClose} aria-label="Close dialog" type="button"><X size={20} /></button></div><div className="modal-body">{children}</div>{footer ? <div className="modal-footer">{footer}</div> : null}</section></div>;
}

type Toast = { id: string; message: string; type: "success" | "error" | "info" };
interface ToastContextValue { notify: (message: string, type?: Toast["type"]) => void; }
const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = (message: string, type: Toast["type"] = "info") => {
    const toast = { id: `${Date.now()}-${Math.random()}`, message, type };
    setToasts((current) => [...current, toast]);
    window.setTimeout(() => setToasts((current) => current.filter((item) => item.id !== toast.id)), 4200);
  };
  return <ToastContext.Provider value={{ notify }}>{children}<div className="toast-stack" role="status" aria-live="polite">{toasts.map((toast) => <div className={`toast toast-${toast.type}`} key={toast.id}><span className="toast-icon">{toast.type === "success" ? <Check size={15} /> : toast.type === "error" ? <X size={15} /> : <span>i</span>}</span><span>{toast.message}</span><button aria-label="Dismiss notification" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} type="button"><X size={14} /></button></div>)}</div></ToastContext.Provider>;
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
};

export function MiniActivity({ title, date, icon: Icon }: { title: string; date: string; icon: LucideIcon }) {
  return <div className="mini-activity"><span className="mini-activity-icon"><Icon size={15} /></span><span><strong>{title}</strong><small>{date ? formatCompactDate(date) : "Just now"}</small></span></div>;
}
