import { Link } from "react-router-dom";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "../components/ui";
import { useAuth } from "../services/auth";
import { getDashboardPath } from "../lib/permissions";

export function NotFound() {
  const { user } = useAuth();
  return <div className="center-page"><div className="center-card"><span className="center-icon"><Compass size={25} /></span><div className="eyebrow">404 · page not found</div><h1>Let’s get you back on track.</h1><p>That route does not exist or is not available in this workspace.</p><Link to={user ? getDashboardPath(user.role) : "/login"}><Button icon={ArrowLeft}>Return to workspace</Button></Link></div></div>;
}
