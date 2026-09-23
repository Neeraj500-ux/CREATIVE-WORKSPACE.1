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
    <svg aria-hidden="true" className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
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
      className={
        "h-4 w-4 shrink-0 animate-spin rounded-full border-2 " +
        (light
          ? "border-white/35 border-t-white"
          : "border-blue-200 border-t-blue-600")
      }
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

const quickCards = [
  {
    title: "Focus",
    body: "Less noise",
    icon: Sparkles,
    iconClass: "text-blue-600",
    iconBackground: "bg-blue-100/90",
  },
  {
    title: "Connect",
    body: "One rhythm",
    icon: Link2,
    iconClass: "text-cyan-600",
    iconBackground: "bg-cyan-100/90",
  },
  {
    title: "Deliver",
    body: "Move forward",
    icon: ShieldCheck,
    iconClass: "text-emerald-600",
    iconBackground: "bg-emerald-100/90",
  },
];

const workspaceStats = [
  { value: "24/7", label: "workspace access", icon: CalendarClock },
  { value: "100%", label: "team visibility", icon: UsersRound },
  { value: "1", label: "shared rhythm", icon: BarChart3 },
];

const motionStyles =
  "@keyframes login-rise{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}" +
  "@keyframes login-float{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-14px,0)}}" +
  "@keyframes login-sheen{0%{transform:translateX(-150%) skewX(-18deg)}100%{transform:translateX(340%) skewX(-18deg)}}" +
  ".login-rise{animation:login-rise .7s cubic-bezier(.2,.8,.2,1) both}" +
  ".login-float{animation:login-float 8s ease-in-out infinite}" +
  ".login-sheen:after{content:'';position:absolute;inset-block:0;left:-40%;width:35%;pointer-events:none;transform:skewX(-18deg);background:linear-gradient(90deg,transparent,rgba(255,255,255,.36),transparent)}" +
  ".login-sheen:hover:after{animation:login-sheen .9s ease-out}" +
  "@media(prefers-reduced-motion:reduce){.login-rise,.login-float,.login-sheen:after{animation:none!important}.login-sheen:hover:after{animation:none!important}}";

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

  if (code && messages[code]) return messages[code];
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
    <main className="relative isolate min-h-screen overflow-hidden bg-[#edf6ff] text-[#102957] selection:bg-blue-200 selection:text-blue-950">
      <style>{motionStyles}</style>

      <div
        aria-hidden="true"
        className="login-float pointer-events-none fixed -right-36 -top-40 h-[26rem] w-[26rem] rounded-full bg-blue-300/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="login-float pointer-events-none fixed -bottom-48 left-1/4 h-[29rem] w-[29rem] rounded-full bg-cyan-200/30 blur-3xl"
        style={{ animationDelay: "1.2s" }}
      />
      <div
        aria-hidden="true"
        className="login-float pointer-events-none fixed left-[-12rem] top-1/3 h-[22rem] w-[22rem] rounded-full bg-indigo-200/20 blur-3xl"
        style={{ animationDelay: "2.4s" }}
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-[1560px] grid-cols-1 gap-4 p-3 sm:gap-6 sm:p-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(27rem,0.98fr)] lg:gap-7 lg:p-6">
        <section className="order-2 relative isolate flex min-h-0 flex-col overflow-hidden rounded-[1.65rem] border border-white/95 bg-[linear-gradient(135deg,#ffffff_0%,#f2f8ff_47%,#dff3ff_100%)] px-5 py-6 text-[#173b82] shadow-[0_28px_80px_rgba(56,105,180,0.16)] sm:rounded-[2rem] sm:px-8 sm:py-8 lg:order-1 lg:min-h-[calc(100vh-3rem)] lg:px-10 lg:py-9 xl:px-12 xl:py-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-52 -right-36 h-[34rem] w-[34rem] rounded-full border border-blue-300/25 shadow-[0_0_0_38px_rgba(37,99,235,0.05),0_0_0_78px_rgba(14,165,233,0.04)]"
          />
          <div
            aria-hidden="true"
            className="login-float pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-blue-300/30 blur-2xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(37,99,235,.12)_1px,transparent_1px),linear-gradient(90deg,rgba(37,99,235,.12)_1px,transparent_1px)] [background-size:52px_52px]"
          />

          <div className="relative z-10 flex items-center justify-between gap-4">
            <Link
              to="/"
              className="group flex min-w-0 items-center gap-3 text-[#173b82] no-underline"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blue-200/80 bg-white/90 text-blue-600 shadow-[0_10px_24px_rgba(37,99,235,0.1)] transition duration-300 group-hover:-rotate-3 group-hover:scale-105 group-hover:bg-white">
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

            <span className="hidden shrink-0 items-center gap-2 rounded-full border border-blue-200/80 bg-white/85 px-3 py-2 text-[9px] font-bold tracking-[0.14em] text-blue-700 shadow-lg shadow-blue-500/10 backdrop-blur-md sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              PLAN. CREATE. GROW.
            </span>
          </div>

          <div className="relative z-10 my-9 max-w-3xl sm:my-12 lg:my-auto lg:py-8">
            <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600/80">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-500" />
              One shared space for your best work
            </span>

            <h1 className="mt-5 max-w-3xl text-[clamp(2.4rem,9vw,5.2rem)] font-semibold leading-[0.96] tracking-[-0.07em] sm:text-[clamp(3rem,6vw,5.4rem)]">
              Big ideas.
              <br />
              Creative minds.
              <br />
              <em className="not-italic text-blue-600">One shared space.</em>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:mt-6 sm:text-base">
              Welcome to creative-crew — your space to organize projects,
              collaborate with your team and turn creative ideas into
              meaningful work.
            </p>

            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
              {highlights.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-2 text-xs text-slate-700"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600 shadow-inner shadow-white/80">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 min-[440px]:grid-cols-3">
              {quickCards.map(
                ({ title, body, icon: Icon, iconClass, iconBackground }, index) => (
                  <div
                    key={title}
                    className="login-rise min-w-0 rounded-2xl border border-white/90 bg-white/75 p-3.5 shadow-[0_12px_30px_rgba(37,99,235,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/95 hover:shadow-[0_18px_34px_rgba(37,99,235,0.12)]"
                    style={{ animationDelay: index * 80 + "ms" }}
                  >
                    <span
                      className={
                        "grid h-8 w-8 shrink-0 place-items-center rounded-xl " +
                        iconBackground
                      }
                    >
                      <Icon className={"h-4 w-4 " + iconClass} />
                    </span>
                    <strong className="mt-3 block truncate text-xs font-extrabold text-[#173b82]">
                      {title}
                    </strong>
                    <span className="mt-1 block truncate text-[11px] text-slate-500">
                      {body}
                    </span>
                  </div>
                ),
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              {workspaceStats.map(({ value, label, icon: Icon }) => (
                <div
                  key={label}
                  className="min-w-0 rounded-2xl border border-white/85 bg-white/55 px-2.5 py-3 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/80 sm:px-3.5"
                >
                  <Icon className="h-3.5 w-3.5 text-blue-600" />
                  <strong className="mt-2 block text-sm font-extrabold text-[#173b82]">
                    {value}
                  </strong>
                  <span className="mt-0.5 block text-[8px] font-semibold uppercase leading-4 tracking-[0.05em] text-slate-500 sm:text-[9px] sm:tracking-[0.08em]">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
            <div className="group flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/95 bg-white/80 p-3.5 text-[#173b82] shadow-[0_18px_42px_rgba(37,99,235,0.1)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:bg-white/95">
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

            <div className="hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/50 px-4 py-3 text-xs text-slate-600 backdrop-blur-md sm:flex">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-100 text-cyan-600">
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

          <div className="relative z-10 mt-5 flex items-center justify-between gap-5 text-[11px] text-slate-500 sm:mt-6 sm:text-xs">
            <span>Built for the work between the big ideas.</span>
            <Sparkles className="h-4 w-4 shrink-0 text-blue-500" />
          </div>
        </section>

        <section className="order-1 relative flex min-h-0 items-center justify-center px-0 py-1 sm:px-2 sm:py-3 lg:order-2 lg:min-h-[calc(100vh-3rem)] lg:px-4 lg:py-6 xl:px-8">
          <div
            aria-hidden="true"
            className="login-float pointer-events-none absolute right-[-3rem] top-[-2rem] h-60 w-60 rounded-full bg-sky-200/55 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="login-float pointer-events-none absolute bottom-[-3rem] left-[-3rem] h-56 w-56 rounded-full bg-blue-200/40 blur-3xl"
            style={{ animationDelay: "1.8s" }}
          />

          <div className="login-rise relative w-full max-w-[34rem]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-blue-300/85 via-white/90 to-cyan-300/85 opacity-80 blur-xl transition duration-700"
            />

            <div className="relative overflow-hidden rounded-[1.8rem] border border-blue-100/90 bg-gradient-to-br from-white via-white/95 to-blue-50/90 p-5 shadow-[0_30px_90px_rgba(30,64,175,0.18)] backdrop-blur-2xl transition duration-500 hover:shadow-[0_34px_100px_rgba(30,64,175,0.22)] sm:rounded-[2rem] sm:p-8 lg:p-9 xl:p-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full border border-blue-100/80 bg-blue-100/20"
              />

              <div className="relative z-10 mb-6 flex items-center gap-3 lg:hidden">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/20">
                  <Layers3 className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <strong className="block truncate text-base leading-none text-[#173b82]">
                    creative-crew
                  </strong>
                  <small className="mt-1 block text-[8px] font-bold tracking-[0.22em] text-slate-400">
                    CREATIVE WORKSPACE
                  </small>
                </span>
              </div>

              <header className="relative z-10">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-blue-600">
                  <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
                  Secure workspace
                </span>

                <h2 className="mt-5 bg-gradient-to-br from-[#0b2554] via-[#173b82] to-blue-600 bg-clip-text text-[clamp(2.45rem,10.5vw,4.2rem)] font-semibold leading-[0.96] tracking-[-0.075em] text-transparent sm:mt-6 sm:text-[clamp(3rem,5vw,4.4rem)]">
                  Welcome back.
                </h2>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span className="h-1.5 w-14 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 shadow-[0_0_16px_rgba(37,99,235,0.32)]" />
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-blue-600/75 sm:text-[10px]">
                    Your creative space is ready
                  </span>
                </div>

                <p className="mt-4 max-w-md text-sm leading-6 text-slate-500 sm:mt-5 sm:text-base sm:leading-7">
                  Sign in to pick up exactly where your team left off.
                </p>
              </header>

              <button
                type="button"
                onClick={continueWithGoogle}
                disabled={isBusy}
                aria-busy={googleSubmitting}
                className="group/google relative mt-7 flex min-h-14 w-full items-center justify-center overflow-hidden rounded-2xl border border-blue-100/90 bg-white/95 px-4 text-sm font-semibold text-slate-700 shadow-[0_12px_28px_rgba(15,52,110,0.07)] backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-[0_18px_36px_rgba(37,99,235,0.14)] focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-8 sm:min-h-[3.75rem] sm:text-base"
              >
                <span className="flex min-w-0 items-center justify-center gap-3 text-center">
                  {googleSubmitting ? <Spinner /> : <GoogleIcon />}
                  <span className="truncate">
                    {googleSubmitting
                      ? "Connecting to Google..."
                      : "Continue with Google"}
                  </span>
                </span>
                {!googleSubmitting && (
                  <ArrowRight className="absolute right-4 h-4 w-4 text-slate-400 transition duration-300 group-hover/google:translate-x-1 group-hover/google:text-blue-600" />
                )}
              </button>

              <div className="my-6 flex items-center gap-3 text-[10px] text-slate-400 sm:my-7 sm:text-[11px]">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
                <span className="shrink-0">or continue with email</span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 to-transparent" />
              </div>

              <form
                onSubmit={submit}
                noValidate
                className="relative z-10 space-y-4 sm:space-y-5"
              >
                <label className="block" htmlFor="work-email">
                  <span className="mb-2 block text-[13px] font-extrabold text-slate-700 sm:text-sm">
                    Work email
                  </span>
                  <span className="group/input relative block">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within/input:text-blue-600" />
                    <input
                      id="work-email"
                      name="email"
                      type="email"
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
                      className="h-14 w-full rounded-2xl border border-blue-100/90 bg-blue-50/75 pl-12 pr-4 text-sm text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_20px_rgba(37,99,235,0.04)] outline-none transition duration-300 placeholder:text-slate-400 hover:border-blue-200 hover:bg-blue-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </span>
                </label>

                <label className="block" htmlFor="workspace-password">
                  <span className="mb-2 block text-[13px] font-extrabold text-slate-700 sm:text-sm">
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
                      className="h-14 w-full rounded-2xl border border-blue-100/90 bg-blue-50/75 pl-12 pr-14 text-sm text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_20px_rgba(37,99,235,0.04)] outline-none transition duration-300 placeholder:text-slate-400 hover:border-blue-200 hover:bg-blue-50 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-slate-400 transition hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100"
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

                <div className="flex flex-col gap-3 pt-0.5 text-xs sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center gap-1.5 text-slate-400">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                    Secure Firebase session
                  </span>
                  <Link
                    to="/reset-password"
                    className="w-fit rounded-md font-extrabold text-blue-600 transition hover:text-blue-800 hover:underline focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="demo-accounts">
                  <div className="demo-accounts-head">
                    <span><Zap className="h-3.5 w-3.5" /> Quick Demo Accounts</span>
                    <small>Password: demo123</small>
                  </div>
                  <div className="demo-account-list">
                    <button type="button" onClick={() => { setEmail("director@creative-crew.local"); setPassword("demo123"); clearFeedback(); }}>
                      <span className="demo-account-icon"><Sparkles className="h-3 w-3" /></span>
                      <span><strong>Director</strong><small>director@creative-crew.local</small></span>
                    </button>
                    <button type="button" onClick={() => { setEmail("manager@creative-crew.local"); setPassword("demo123"); clearFeedback(); }}>
                      <span className="demo-account-icon"><UsersRound className="h-3 w-3" /></span>
                      <span><strong>Manager</strong><small>manager@creative-crew.local</small></span>
                    </button>
                    <button type="button" onClick={() => { setEmail("lead@creative-crew.local"); setPassword("demo123"); clearFeedback(); }}>
                      <span className="demo-account-icon"><Layers3 className="h-3 w-3" /></span>
                      <span><strong>Team Lead</strong><small>lead@creative-crew.local</small></span>
                    </button>
                    <button type="button" onClick={() => { setEmail("employee@creative-crew.local"); setPassword("demo123"); clearFeedback(); }}>
                      <span className="demo-account-icon"><CheckCircle2 className="h-3 w-3" /></span>
                      <span><strong>Employee</strong><small>employee@creative-crew.local</small></span>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  aria-busy={submitting || loading}
                  className="login-sheen group/submit relative flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-5 text-sm font-extrabold text-white shadow-[0_18px_38px_rgba(37,99,235,0.3)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(37,99,235,0.36)] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                >
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

              <div className="relative z-10 mt-6 flex items-start justify-center gap-2 text-center text-[10px] leading-5 text-slate-400 sm:mt-7 sm:text-[11px]">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>Your workspace access is protected and role-aware.</span>
              </div>

              <div className="relative z-10 mt-3 flex items-center justify-center gap-2 text-[9px] text-slate-400 sm:text-[10px]">
                <Link2 className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                Firebase-secured workspace access
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}