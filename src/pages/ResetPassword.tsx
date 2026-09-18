import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Send, Sparkles } from "lucide-react";
import { Button, TextInput, useToast } from "../components/ui";
import { useAuth } from "../services/auth";

export function ResetPassword() {
  const { resetPassword, firebaseMode } = useAuth();
  const { notify } = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setSubmitting(true);
    try { await resetPassword(email); setSent(true); notify(firebaseMode ? "Reset instructions sent if the account exists." : "Demo mode is active; no email was sent.", "success"); }
    catch (resetError) { const message = resetError instanceof Error ? resetError.message : "Unable to request a reset."; setError(message); notify(message, "error"); }
    finally { setSubmitting(false); }
  };
  return <div className="simple-auth-page"><div className="simple-auth-card"><Link className="auth-brand auth-brand-dark" to="/login"><span className="brand-mark"><Sparkles size={17} /></span><span>creative-crew</span></Link><span className="simple-auth-icon"><Mail size={22} /></span><div className="auth-header"><span className="auth-kicker"><Send size={14} /> Account recovery</span><h1>Reset your password.</h1><p>Enter your work email and we’ll send the next step.</p></div>{sent ? <div className="form-alert form-alert-success">{firebaseMode ? "If an account exists for that email, reset instructions are on the way." : "Demo mode is active, so no message was sent. Configure Firebase to enable email delivery."}</div> : <form className="auth-form" onSubmit={submit}><TextInput label="Work email" type="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} required />{error ? <div className="form-alert form-alert-error">{error}</div> : null}<Button type="submit" loading={submitting} icon={Send}>Send reset instructions</Button></form>}<Link className="back-link" to="/login"><ArrowLeft size={15} /> Back to sign in</Link></div></div>;
}
