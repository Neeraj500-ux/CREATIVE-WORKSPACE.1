import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "../components/ui";
import { useAuth } from "../services/auth";
import { getDashboardPath } from "../lib/permissions";

export function AccessDenied({ title = "This space is outside your role", description = "creative-crew keeps every workspace view scoped to the signed-in profile. Open your dashboard to continue.", action }: { title?: string; description?: string; action?: ReactNode }) {
  const { user } = useAuth();
  return <div className="center-page"><div className="center-card"><span className="center-icon"><LockKeyhole size={25} /></span><div className="eyebrow">Permission aware</div><h1>{title}</h1><p>{description}</p><div className="center-actions">{action ?? (user ? <Link to={getDashboardPath(user.role)}><Button icon={ArrowLeft}>Back to my dashboard</Button></Link> : <Link to="/login"><Button icon={Sparkles}>Go to login</Button></Link>)}</div></div></div>;
}
