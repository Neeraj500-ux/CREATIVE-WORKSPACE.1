import { useState, type FormEvent } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Layers3,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button, useToast } from "../components/ui";
import { useAuth } from "../services/auth";

function GoogleIcon() {
  return (
    <svg
      className="google-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M21.35 12.27c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42Z"
      />
      <path
        fill="#34A853"
        d="M12 21.75c2.59 0 4.77-.86 6.36-2.32l-3.14-2.45c-.87.58-1.98.93-3.22.93-2.48 0-4.58-1.67-5.33-3.92H3.42v2.53A9.6 9.6 0 0 0 12 21.75Z"
      />
      <path
        fill="#FBBC05"
        d="M6.67 13.99a5.78 5.78 0 0 1 0-3.68V7.78H3.42a9.72 9.72 0 0 0 0 8.74l3.25-2.53Z"
      />
      <path
        fill="#EA4335"
        d="M12 6.39c1.41 0 2.68.49 3.68 1.45l2.76-2.76C16.76 3.43 14.59 2.25 12 2.25a9.6 9.6 0 0 0-8.58 5.53l3.25 2.53C7.42 8.06 9.52 6.39 12 6.39Z"
      />
    </svg>
  );
}

type LocationState = {
  from?: string;
};

export function Login() {
  const {
    login,
    loginWithGoogle,
    loading,
  } = useAuth();

  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState("");

  const redirectAfterLogin = () => {
    const from = (
      location.state as LocationState | null
    )?.from;

    navigate(from || "/", {
      replace: true,
    });
  };

  const submit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      redirectAfterLogin();
    } catch (loginError) {
      const message =
        loginError instanceof Error
          ? loginError.message
          : "Unable to sign in.";

      setError(message);
      notify(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const continueWithGoogle = async () => {
    setError("");
    setGoogleSubmitting(true);

    try {
      await loginWithGoogle();
      redirectAfterLogin();
    } catch (loginError) {
      const message =
        loginError instanceof Error
          ? loginError.message
          : "Google sign-in failed.";

      setError(message);
      notify(message, "error");
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const isBusy =
    loading || submitting || googleSubmitting;

  return (
    <main className="auth-page auth-page-premium">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />

      <section className="auth-showcase">
        <div className="auth-showcase-grid" />

        <div className="auth-showcase-top">
          <Link className="auth-brand" to="/">
            <span className="brand-mark">
              <Layers3 size={21} />
            </span>

            <span className="auth-brand-copy">
              <strong>creative-crew</strong>
              <small>CREATIVE WORKSPACE</small>
            </span>
          </Link>

          <span className="auth-plan-badge">
            <Sparkles size={14} />
            PLAN. CREATE. GROW.
          </span>
        </div>

        <div className="auth-showcase-content">
          <span className="eyebrow eyebrow-light">
            One shared space for your best work
          </span>

          <h1>
            Big ideas.
            <br />
            Creative minds.
            <br />
            <em>One shared space.</em>
          </h1>

          <p>
            Welcome to creative-crew — your space to
            organize projects, collaborate with your team
            and turn creative ideas into meaningful work.
          </p>

          <div className="auth-points">
            <span>
              <Check size={15} />
              Clear priorities
            </span>

            <span>
              <Check size={15} />
              Better teamwork
            </span>

            <span>
              <Check size={15} />
              Meaningful progress
            </span>
          </div>
        </div>

        <div className="auth-floating-card">
          <div className="auth-floating-icon">
            <CheckCircle2 size={18} />
          </div>

          <div>
            <strong>Workspace clarity</strong>
            <span>Everything moving in one rhythm.</span>
          </div>

          <ChevronRight size={17} />
        </div>

        <div className="auth-showcase-footer">
          <span>Built for the work between the big ideas.</span>
          <Sparkles size={17} />
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="mobile-auth-brand">
            <span className="brand-mark">
              <Layers3 size={18} />
            </span>

            <span>
              <strong>creative-crew</strong>
              <small>CREATIVE WORKSPACE</small>
            </span>
          </div>

          <div className="auth-header">
            <span className="auth-kicker">
              <LockKeyhole size={14} />
              Secure workspace
            </span>

            <h2>Welcome back.</h2>

            <p>
              Sign in to pick up exactly where your
              team left off.
            </p>
          </div>

          <button
            className="google-button"
            type="button"
            onClick={continueWithGoogle}
            disabled={isBusy}
          >
            <GoogleIcon />

            <span>
              {googleSubmitting
                ? "Connecting to Google..."
                : "Continue with Google"}
            </span>

            <ArrowRight size={17} />
          </button>

          <div className="auth-divider">
            <span>or continue with email</span>
          </div>

          <form className="auth-form" onSubmit={submit}>
            <label className="auth-field">
              <span className="field-label">
                Work email
              </span>

              <span className="auth-input-wrap">
                <Mail size={17} />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                  required
                />
              </span>
            </label>

            <label className="auth-field">
              <span className="field-label">
                Password
              </span>

              <span className="auth-input-wrap password-field">
                <LockKeyhole size={17} />

                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                  required
                />

                <button
                  type="button"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </span>
            </label>

            {error ? (
              <div
                className="form-alert form-alert-error"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <div className="auth-form-row">
              <span className="secure-caption">
                <ShieldCheck size={15} />
                Secure Firebase session
              </span>

              <Link to="/reset-password">
                Forgot password?
              </Link>
            </div>

            <Button
              className="auth-submit"
              type="submit"
              loading={isBusy}
              icon={ArrowRight}
            >
              Sign in to workspace
            </Button>
          </form>

          <div className="auth-bottom-note">
            <ShieldCheck size={16} />
            <span>
              Your workspace access is protected and
              role-aware.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}