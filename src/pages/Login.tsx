import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Eye, EyeOff, Layers3, LockKeyhole, Sparkles, UsersRound, Zap } from "lucide-react";
import { Button, TextInput, useToast } from "../components/ui";
import { demoCredentials } from "../data/seed";
import { useAuth } from "../services/auth";

export function Login() {
  const { login, loading, firebaseMode } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from || "/", { replace: true });
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Unable to sign in.";
      setError(message);
      notify(message, "error");
    } finally { setSubmitting(false); }
  };

  return <div className="auth-page"><div className="auth-orb auth-orb-one" /><div className="auth-orb auth-orb-two" /><section className="auth-showcase"><Link className="auth-brand" to="/"><span className="brand-mark"><Sparkles size={17} /></span><span>creative-crew</span></Link><div className="auth-showcase-content"><span className="eyebrow eyebrow-light">One calm place for great work</span><h1>Make every moving part feel <em>lighter.</em></h1><p>creative-crew brings people, projects and momentum into one clear operating rhythm for modern creative teams.</p><div className="auth-points"><span><Check size={15} /> Role-aware by design</span><span><Check size={15} /> Live project clarity</span><span><Check size={15} /> A workspace your team will enjoy</span></div></div><div className="auth-showcase-footer"><span>Built for the work between the big ideas.</span><Sparkles size={16} /></div></section><section className="auth-panel"><div className="auth-form-wrap"><div className="mobile-auth-brand"><span className="brand-mark"><Sparkles size={16} /></span><span>creative-crew</span></div><div className="auth-header"><span className="auth-kicker"><LockKeyhole size={14} /> Secure workspace</span><h2>Welcome back.</h2><p>Sign in to pick up exactly where the team left off.</p></div><form className="auth-form" onSubmit={submit}><TextInput label="Work email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required /><label className="field"><span className="field-label">Password</span><span className="password-field"><input type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>{error ? <div className="form-alert form-alert-error">{error}</div> : null}<div className="auth-form-row"><label className="checkbox-label"><input type="checkbox" /> <span>Keep me signed in</span></label><Link to="/reset-password">Forgot password?</Link></div><Button className="auth-submit" type="submit" loading={submitting || loading} icon={ArrowRight}>Sign in to workspace</Button></form><div className="auth-mode-note"><span className="mode-dot" />{firebaseMode ? "Firebase authentication is connected." : "Local demo mode is active — use a demo account below."}</div>{!firebaseMode ? <div className="demo-accounts"><div className="demo-accounts-head"><span><Zap size={14} /> Demo access</span><small>Password: demo123</small></div><div className="demo-account-list">{demoCredentials.map((credential) => <button type="button" key={credential.email} onClick={() => { setEmail(credential.email); setPassword("demo123"); }}><span className="demo-account-icon">{credential.role === "Director" ? <Sparkles size={14} /> : credential.role === "Client" ? <Layers3 size={14} /> : credential.role === "Employee" ? <UsersRound size={14} /> : <Zap size={14} />}</span><span>{credential.role}</span><small>{credential.email.split("@")[0]}</small></button>)}</div></div> : null}<p className="auth-legal">By continuing, you agree to keep workspace information private and use your assigned access responsibly.</p></div></section></div>;
}
