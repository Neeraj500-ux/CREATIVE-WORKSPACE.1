import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Layers3,
  Link2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Zap,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useToast } from "../components/ui";
import { useAuth } from "../services/auth";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5 shrink-0"
      viewBox="0 0 24 24"
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

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <span
      aria-label="Loading"
      role="status"
      className={[
        "h-4 w-4 animate-spin rounded-full border-2",
        light
          ? "border-white/35 border-t-white"
          : "border-blue-200 border-t-blue-600",
      ].join(" ")}
    />
  );
}

type LocationState = {
  from?: string;
};

const highlights = [
  "Clear priorities",
  "Better teamwork",
  "Meaningful progress",
];

const workspaceStats = [
  { value: "24/7", label: "workspace access", icon: CalendarClock },
  { value: "100%", label: "team visibility", icon: UsersRound },
  { value: "1", label: "shared rhythm", icon: BarChart3 },
];

const getAuthErrorMessage = (error: unknown, fallback: string) => {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";

  const messages: Record<string, string> = {
    "auth/invalid-credential":
      "The email or password is incorrect. Please check your details and try again.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/user-disabled":
      "This account has been disabled. Please contact your workspace administrator.",
    "auth/too-many-requests":
      "Too many attempts. Please wait a moment and try again.",
    "auth/popup-closed-by-user":
      "The Google sign-in window was closed before completion.",
    "auth/popup-blocked":
      "Your browser blocked the Google sign-in window. Allow pop-ups and try again.",
    "auth/unauthorized-domain":
      "This domain is not authorised for Firebase sign-in yet.",
    "auth/network-request-failed":
      "A network problem interrupted sign-in. Check your connection and try again.",
  };

  if (code && messages[code]) {
    return messages[code];
  }

  return error instanceof Error && error.message ? error.message : fallback;
};

export function Login() {
  const { login, loginWithGoogle, loading } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isBusy = loading || submitting || googleSubmitting;

  const clearFeedback = () => {
    setError("");
    setSuccess("");
  };

  const redirectAfterLogin = () => {
    const state = location.state as LocationState | null;
    const destination =
      state?.from && state.from.startsWith("/") ? state.from : "/";

    navigate(destination, { replace: true });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanEmail = email.trim();
    clearFeedback();

    if (!cleanEmail || !password) {
      const message = "Enter your email and password.";
      setError(message);
      notify(message, "error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      const message = "Enter a valid work email address.";
      setError(message);
      notify(message, "error");
      return;
    }

    setSubmitting(true);

    try {
      await login(cleanEmail, password);
      setSuccess("Signed in successfully.");
      notify("Welcome back to your workspace.", "success");
      redirectAfterLogin();
    } catch (loginError) {
      const message = getAuthErrorMessage(loginError, "Unable to sign in.");
      setError(message);
      notify(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const continueWithGoogle = async () => {
    clearFeedback();
    setGoogleSubmitting(true);

    try {
      await loginWithGoogle();
      setSuccess("Signed in successfully.");
      notify("Welcome back to your workspace.", "success");
      redirectAfterLogin();
    } catch (googleError) {
      const message = getAuthErrorMessage(
        googleError,
        "Google sign-in failed.",
      );
      setError(message);
      notify(message, "error");
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#f6faff] text-[#102957] selection:bg-blue-200 selection:text-blue-950">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -right-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-blue-300/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-48 left-1/4 h-[30rem] w-[30rem] animate-[bounce_12s_ease-in-out_infinite] rounded-full bg-cyan-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-[-12rem] top-1/3 h-[24rem] w-[24rem] rounded-full bg-indigo-200/20 blur-3xl"
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1680px] lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:gap-5 lg:p-5">
        <section className="relative isolate flex min-h-[690px] flex-col overflow-hidden rounded-b-[2rem] border border-white/95 bg-gradient-to-br from-white via-[#f1f8ff] to-[#dff3ff] px-5 py-6 text-[#173b82] shadow-[0_28px_80px_rgba(56,105,180,0.18)] sm:min-h-[760px] sm:px-9 sm:py-9 lg:min-h-[calc(100vh-2.5rem)] lg:rounded-[2rem] lg:px-14 lg:py-12 xl:px-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-48 -right-36 h-[520px] w-[520px] rounded-full border border-blue-300/25 shadow-[0_0_0_36px_rgba(37,99,235,0.05),0_0_0_74px_rgba(14,165,233,0.04)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 animate-pulse rounded-full bg-blue-300/30 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-10 top-28 h-36 w-36 rounded-full border border-white/80 bg-white/20 blur-[1px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(37,99,235,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,.12)_1px,transparent_1px)] [background-size:52px_52px]"
          />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <Link
              to="/"
              className="group flex min-w-0 items-center gap-3 text-[#173b82] no-underline"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blue-200/80 bg-white/80 text-blue-600 shadow-[0_10px_24px_rgba(37,99,235,0.1)] transition duration-300 group-hover:rotate-6 group-hover:bg-white">
                <Layers3 className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-[17px] leading-none tracking-[-0.03em]">
                  creative-crew
                </strong>
                <small className="mt-1 block text-[9px] font-bold tracking-[0.23em] text-blue-600/60">
                  CREATIVE WORKSPACE
                </small>
              </span>
            </Link>

            <span className="hidden shrink-0 items-center gap-2 rounded-full border border-blue-200/80 bg-white/80 px-3 py-2 text-[9px] font-bold tracking-[0.17em] text-blue-700 shadow-lg shadow-blue-500/10 backdrop-blur-md sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              PLAN. CREATE. GROW.
            </span>
          </div>

          <div className="relative z-10 my-auto max-w-3xl py-14 sm:py-20 lg:py-24">
            <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600/80">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              One shared space for your best work
            </span>

            <h1 className="mt-5 max-w-3xl text-[clamp(2.35rem,10vw,5.8rem)] font-semibold leading-[0.96] tracking-[-0.07em] sm:text-[clamp(3.2rem,6.5vw,5.8rem)]">
              Big ideas.
              <br />
              Creative minds.
              <br />
              <em className="not-italic text-blue-600">One shared space.</em>
            </h1>

            <p className="mt-6 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
              Welcome to creative-crew — your space to organize projects,
              collaborate with your team and turn creative ideas into
              meaningful work.
            </p>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
              {highlights.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-2 text-xs text-slate-700"
                >
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-blue-100 text-blue-600 shadow-inner shadow-white/80">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
              <div className="min-w-0 rounded-2xl border border-white/90 bg-white/70 p-3 shadow-[0_12px_30px_rgba(37,99,235,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/95">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <strong className="mt-3 block truncate text-[11px] font-extrabold text-[#173b82] sm:text-xs">
                  Focus
                </strong>
                <span className="mt-1 block truncate text-[10px] text-slate-500 sm:text-[11px]">
                  Less noise
                </span>
              </div>

              <div className="min-w-0 rounded-2xl border border-white/90 bg-white/70 p-3 shadow-[0_12px_30px_rgba(37,99,235,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/95">
                <Link2 className="h-4 w-4 text-cyan-600" />
                <strong className="mt-3 block truncate text-[11px] font-extrabold text-[#173b82] sm:text-xs">
                  Connect
                </strong>
                <span className="mt-1 block truncate text-[10px] text-slate-500 sm:text-[11px]">
                  One rhythm
                </span>
              </div>

              <div className="min-w-0 rounded-2xl border border-white/90 bg-white/70 p-3 shadow-[0_12px_30px_rgba(37,99,235,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/95">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <strong className="mt-3 block truncate text-[11px] font-extrabold text-[#173b82] sm:text-xs">
                  Deliver
                </strong>
                <span className="mt-1 block truncate text-[10px] text-slate-500 sm:text-[11px]">
                  Move forward
                </span>
              </div>
            </div>

            <div className="mt-4 grid max-w-xl grid-cols-3 gap-2 sm:gap-3">
              {workspaceStats.map(({ value, label, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/85 bg-white/45 px-3 py-3 backdrop-blur-md"
                >
                  <Icon className="h-3.5 w-3.5 text-blue-600" />
                  <strong className="mt-2 block text-sm font-extrabold text-[#173b82]">
                    {value}
                  </strong>
                  <span className="mt-0.5 block truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex w-full max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
            <div className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/95 bg-white/75 p-3.5 text-[#173b82] shadow-[0_18px_42px_rgba(37,99,235,0.12)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:bg-white/95">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-100">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-xs">Workspace clarity</strong>
                <span className="mt-1 block truncate text-[11px] text-slate-500">
                  Everything moving in one rhythm.
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-blue-500 transition group-hover:translate-x-1" />
            </div>

            <div className="hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/45 px-4 py-3 text-xs text-slate-600 backdrop-blur-md sm:flex">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-100 text-cyan-600">
                <Zap className="h-4 w-4" />
              </span>
              <span>
                <strong className="block text-[11px] text-[#173b82]">
                  Ready when you are
                </strong>
                <span className="text-[10px]">Your next idea starts here.</span>
              </span>
            </div>
          </div>

          <div className="relative z-10 mt-6 flex items-center justify-between gap-5 text-xs text-slate-500">
            <span>Built for the work between the big ideas.</span>
            <Sparkles className="h-4 w-4 shrink-0 text-blue-500" />
          </div>
        </section>

        <section className="relative flex min-h-[700px] items-center justify-center overflow-hidden bg-white/45 px-3 py-8 sm:px-8 sm:py-12 lg:min-h-0 lg:bg-transparent lg:px-10 lg:py-10 xl:px-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-5rem] top-[-5rem] h-64 w-64 animate-pulse rounded-full bg-sky-200/55 blur-3xl"
          />

          <div className="group relative w-full max-w-[31rem]">
            <div
              aria-hidden="true"
              className="absolute -inset-1 rounded-[2.15rem] bg-gradient-to-br from-blue-300/80 via-white/80 to-cyan-300/80 opacity-75 blur-xl transition duration-700 group-hover:opacity-100"
            />

            <div className="relative rounded-[2rem] border border-white/95 bg-white/95 p-5 shadow-[0_28px_90px_rgba(30,64,175,0.14)] backdrop-blur-2xl transition duration-500 group-hover:shadow-[0_32px_105px_rgba(30,64,175,0.2)] sm:p-9 lg:p-10">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                  <Layers3 className="h-5 w-5" />
                </span>
                <span>
                  <strong className="block text-base leading-none text-[#173b82]">
                    creative-crew
                  </strong>
                  <small className="mt-1 block text-[8px] font-bold tracking-[0.22em] text-slate-400">
                    CREATIVE WORKSPACE
                  </small>
                </span>
              </div>

              <header>
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-600">
                  <LockKeyhole className="h-3.5 w-3.5" />
                  Secure workspace
                </span>

                <h2 className="mt-5 bg-gradient-to-br from-[#0b2554] via-[#173b82] to-blue-600 bg-clip-text text-[clamp(2.25rem,8vw,3.5rem)] font-semibold leading-[0.98] tracking-[-0.065em] text-transparent">
                  Welcome back.
                </h2>

                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <span className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400" />
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-blue-600/75">
                    Your creative space is ready
                  </span>
                </div>

                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                  Sign in to pick up exactly where your team left off.
                </p>
              </header>

              <button
                type="button"
                onClick={continueWithGoogle}
                disabled={isBusy}
                aria-busy={googleSubmitting}
                className="group/google mt-8 flex min-h-14 w-full items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/90 px-4 text-sm font-bold text-slate-700 shadow-[0_8px_22px_rgba(15,52,110,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:border-blue-200 hover:bg-white hover:shadow-[0_15px_32px_rgba(37,99,235,0.13)] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {googleSubmitting ? <Spinner /> : <GoogleIcon />}
                <span className="flex-1 text-left">
                  {googleSubmitting
                    ? "Connecting to Google..."
                    : "Continue with Google"}
                </span>
                {!googleSubmitting && (
                  <ArrowRight className="h-4 w-4 text-slate-400 transition duration-300 group-hover/google:translate-x-1 group-hover/google:text-blue-600" />
                )}
              </button>

              <div className="my-7 flex items-center gap-3 text-[11px] text-slate-400">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
                <span className="shrink-0">or continue with email</span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 to-slate-200" />
              </div>

              <form onSubmit={submit} noValidate className="space-y-5">
                <label className="block" htmlFor="work-email">
                  <span className="mb-2 flex items-center gap-2 text-xs font-extrabold text-slate-700">
                    <Mail className="h-3.5 w-3.5 text-blue-500" />
                    Work email
                  </span>
                  <span className="group/input relative block">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within/input:text-blue-600" />
                    <input
                      id="work-email"
                      name="email"
                      type="email"
                      autoFocus
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="you@company.com"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        clearFeedback();
                      }}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "login-feedback" : undefined}
                      className="h-14 w-full rounded-2xl border border-slate-200/90 bg-blue-50/80 pl-11 pr-4 text-sm text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition duration-300 placeholder:text-slate-400 hover:border-blue-200 hover:bg-blue-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </span>
                </label>

                <label className="block" htmlFor="workspace-password">
                  <span className="mb-2 flex items-center gap-2 text-xs font-extrabold text-slate-700">
                    <LockKeyhole className="h-3.5 w-3.5 text-blue-500" />
                    Password
                  </span>
                  <span className="group/input relative block">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within/input:text-blue-600" />
                    <input
                      id="workspace-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        clearFeedback();
                      }}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "login-feedback" : undefined}
                      className="h-14 w-full rounded-2xl border border-slate-200/90 bg-blue-50/80 pl-11 pr-12 text-sm text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] outline-none transition duration-300 placeholder:text-slate-400 hover:border-blue-200 hover:bg-blue-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </span>
                </label>

                {error ? (
                  <div
                    id="login-feedback"
                    role="alert"
                    aria-live="polite"
                    className="flex items-start gap-3 rounded-2xl border border-red-200/90 bg-red-50/85 px-4 py-3 text-xs leading-5 text-red-700 shadow-sm"
                  >
                    <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-red-100 text-[10px] font-black">
                      !
                    </span>
                    <span>{error}</span>
                  </div>
                ) : success ? (
                  <div
                    id="login-feedback"
                    role="status"
                    aria-live="polite"
                    className="flex items-start gap-3 rounded-2xl border border-emerald-200/90 bg-emerald-50/85 px-4 py-3 text-xs leading-5 text-emerald-700 shadow-sm"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{success}</span>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    Secure Firebase session
                  </span>
                  <Link
                    to="/reset-password"
                    className="font-extrabold text-blue-600 transition hover:text-blue-800 hover:underline focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  aria-busy={submitting || loading}
                  className="group/submit relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-5 text-sm font-extrabold text-white shadow-[0_15px_32px_rgba(37,99,235,0.28)] transition duration-300 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_20px_42px_rgba(37,99,235,0.36)] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/25 blur-md transition duration-700 group-hover/submit:left-[120%]" />
                  {submitting || loading ? (
                    <>
                      <Spinner light />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in to workspace
                      <ArrowRight className="h-4 w-4 transition duration-300 group-hover/submit:translate-x-1" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-7 flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-slate-400">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>Your workspace access is protected and role-aware.</span>
              </div>
              <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-slate-400">
                <Link2 className="h-3.5 w-3.5 text-blue-400" />
                Firebase-secured workspace access
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
