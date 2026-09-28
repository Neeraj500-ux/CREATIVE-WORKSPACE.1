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
      aria-hidden="true"
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
  { value: "24/7", label: "Workspace access", icon: CalendarClock },
  { value: "100%", label: "Team visibility", icon: UsersRound },
  { value: "1", label: "Shared rhythm", icon: BarChart3 },
];
const motionStyles = `
  .login-page, .login-page * { box-sizing: border-box; }
  .login-page .login-layout {
    width: 100%; max-width: 1480px; margin-inline: auto;
    display: grid; grid-template-columns: minmax(0, 1fr);
  }
  .login-page .login-layout > * { min-width: 0; }
  .login-page {
    background:
      radial-gradient(circle at 5% 8%, rgba(151,196,255,.38), transparent 34%),
      radial-gradient(circle at 93% 15%, rgba(114,221,255,.23), transparent 27%),
      linear-gradient(145deg, #f7fbff 0%, #ebf5ff 56%, #e8f3ff 100%);
    scrollbar-color: #b9d8ff transparent;
  }
  .login-page::before,
  .login-page::after {
    content: ''; position: fixed; z-index: -1; pointer-events: none; border-radius: 999px;
    filter: blur(1px); opacity: .9;
  }
  .login-page::before {
    width: min(62vw, 58rem); height: min(62vw, 58rem); left: -24rem; top: -23rem;
    background: radial-gradient(circle, rgba(68, 141, 255, .3), rgba(124, 214, 255, .08) 43%, transparent 70%);
  }
  .login-page::after {
    width: min(54vw, 50rem); height: min(54vw, 50rem); right: -20rem; bottom: -24rem;
    background: radial-gradient(circle, rgba(49, 189, 235, .26), rgba(123, 164, 255, .1) 48%, transparent 70%);
  }
  .login-page .login-liquid-ribbon {
    position: fixed; z-index: -1; pointer-events: none; width: 44rem; height: 17rem;
    border: 1px solid rgba(255,255,255,.46); border-radius: 48% 52% 44% 56% / 55% 42% 58% 45%;
    background: linear-gradient(110deg, rgba(79,139,255,.09), rgba(88,219,255,.2), rgba(255,255,255,.13));
    box-shadow: inset 0 1px 0 rgba(255,255,255,.46), 0 20px 70px rgba(48,128,221,.08);
    backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    transform: rotate(-18deg); animation: login-ribbon-drift 16s ease-in-out infinite;
  }
  .login-page .login-ribbon-one { left: -14rem; bottom: 8%; }
  .login-page .login-ribbon-two { right: -17rem; top: 20%; opacity: .72; animation-delay: -7s; animation-direction: reverse; }
  .login-page .login-layout { isolation: isolate; }
  .login-page .login-brand {
    background:
      radial-gradient(circle at 10% 10%, rgba(255,255,255,.82), transparent 20%),
      radial-gradient(circle at 92% 70%, rgba(104,219,255,.44), transparent 38%),
      linear-gradient(132deg, rgba(255,255,255,.88), rgba(224,241,255,.67) 54%, rgba(197,231,255,.72));
    border: 1px solid rgba(255,255,255,.9);
    box-shadow: 0 30px 80px rgba(25,77,153,.16), inset 0 1px 0 rgba(255,255,255,1), inset 0 -1px 0 rgba(255,255,255,.42);
    backdrop-filter: blur(30px) saturate(1.22);
    -webkit-backdrop-filter: blur(30px) saturate(1.22);
  }
  .login-page .login-brand::before {
    content: ''; position: absolute; pointer-events: none;
    inset: 1px; border-radius: inherit;
    background: linear-gradient(128deg, rgba(255,255,255,.55), transparent 32%, rgba(255,255,255,.19) 70%, transparent);
    mask: linear-gradient(#000, transparent 65%);
  }
  .login-page .login-brand::after {
    content: ''; position: absolute; pointer-events: none;
    width: 52%; height: 45%; right: -15%; bottom: -25%; border-radius: 50%;
    border: 1px solid rgba(255,255,255,.63);
    box-shadow: 0 0 0 32px rgba(255,255,255,.12), 0 0 0 74px rgba(117,181,255,.08);
  }
  .login-page .login-hero-title { text-wrap: balance; }
  .login-page .login-feature,
  .login-page .login-stat,
  .login-page .login-info {
    border: 1px solid rgba(255,255,255,.86);
    background: linear-gradient(145deg, rgba(255,255,255,.75), rgba(235,248,255,.5));
    box-shadow: 0 14px 30px rgba(32,83,152,.09), inset 0 1px 0 rgba(255,255,255,.9), inset 0 -1px 0 rgba(110,181,255,.08);
    backdrop-filter: blur(22px) saturate(1.1); -webkit-backdrop-filter: blur(22px) saturate(1.1);
  }
  .login-page .login-feature { position: relative; overflow: hidden; }
  .login-page .login-feature::before {
    content: ''; position: absolute; height: 1px; left: 16px; right: 16px; top: 0;
    background: linear-gradient(90deg, transparent, white, transparent);
  }
  .login-page .login-feature:hover,
  .login-page .login-stat:hover,
  .login-page .login-info:hover {
    background: rgba(255,255,255,.91);
    box-shadow: 0 18px 38px rgba(30,90,170,.13), inset 0 1px 0 white;
  }
  .login-page .login-form-card {
    border: 1px solid rgba(255,255,255,.96);
    background:
      radial-gradient(circle at 100% 0%, rgba(147,221,255,.26), transparent 29%),
      radial-gradient(circle at 0% 100%, rgba(183,213,255,.2), transparent 27%),
      linear-gradient(150deg, rgba(255,255,255,.92), rgba(255,255,255,.83) 58%, rgba(226,243,255,.82));
    box-shadow: 0 34px 92px rgba(28,72,151,.2), 0 3px 11px rgba(24,74,139,.07), inset 0 1px 0 white, inset 0 -1px 0 rgba(255,255,255,.45);
    backdrop-filter: blur(32px) saturate(1.24); -webkit-backdrop-filter: blur(32px) saturate(1.24);
  }
  .login-page .login-form-card::before {
    content: ''; position: absolute; pointer-events: none;
    inset-inline: 10%; top: 0; height: 1px;
    background: linear-gradient(90deg, transparent, #93d4ff, transparent);
  }
  .login-page .login-google,
  .login-page .login-submit,
  .login-page .login-mobile-cta {
    position: relative; isolation: isolate; overflow: hidden;
    -webkit-tap-highlight-color: transparent;
  }
  .login-page :is(.login-google, .login-submit, .login-mobile-cta) > * {
    position: relative; z-index: 1;
  }
  .login-page .login-google {
    color: white;
    border: 1px solid rgba(255,255,255,.45);
    background: linear-gradient(120deg, rgba(21,87,213,.96), rgba(31,129,229,.96) 56%, rgba(16,166,207,.94));
    box-shadow: 0 15px 31px rgba(37,99,235,.22), inset 0 1px 0 rgba(255,255,255,.36), inset 0 -1px 0 rgba(3,73,159,.24);
  }
  .login-page .login-google:hover {
    color: white; border-color: rgba(255,255,255,.7); transform: translateY(-2px);
    box-shadow: 0 21px 38px rgba(36,102,188,.25), inset 0 1px 0 rgba(255,255,255,.42);
  }
  .login-page .login-input {
    background: linear-gradient(135deg, rgba(241,247,255,.88), rgba(255,255,255,.66));
    border: 1px solid rgba(168,206,255,.63);
    box-shadow: inset 0 1px 2px rgba(255,255,255,.9), inset 0 -1px 1px rgba(58,116,185,.035), 0 8px 19px rgba(29,78,150,.045);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  }
  .login-page .login-input:hover { border-color: #bbd8ff; }
  .login-page .login-input:focus {
    border-color: #3b82f6; background: white;
    box-shadow: 0 0 0 4px rgba(59,130,246,.13), 0 10px 25px rgba(37,99,235,.065);
  }
  .login-page .login-submit,
  .login-page .login-mobile-cta {
    color: white;
    background: linear-gradient(110deg, #1744c6 0%, #2563eb 48%, #08a8d6 100%);
    box-shadow: 0 18px 35px rgba(37,99,235,.29), inset 0 1px 0 rgba(255,255,255,.39), inset 0 -2px 0 rgba(8,75,173,.25);
  }
  .login-page .login-submit:hover:not(:disabled),
  .login-page .login-mobile-cta:hover {
    transform: translateY(-2px); filter: saturate(1.12);
    box-shadow: 0 24px 48px rgba(37,99,235,.36), inset 0 1px 0 rgba(255,255,255,.43), inset 0 -2px 0 rgba(8,75,173,.25);
  }
  .login-page .login-submit:active:not(:disabled),
  .login-page .login-mobile-cta:active,
  .login-page .login-google:active:not(:disabled) { transform: translateY(0); }
  .login-page .login-google::before,
  .login-page .login-submit::before,
  .login-page .login-mobile-cta::before {
    content: ''; position: absolute; pointer-events: none; inset: 1px; border-radius: inherit;
    background: linear-gradient(105deg, rgba(255,255,255,.28), transparent 25%, transparent 70%, rgba(255,255,255,.12));
  }
  .login-page .login-google-icon {
    display: grid; height: 31px; width: 31px; place-items: center; border-radius: 10px;
    background: rgba(255,255,255,.98); box-shadow: 0 4px 12px rgba(6,59,152,.2), inset 0 1px 0 white;
  }
  .login-page .login-google::after {
    content: ''; position: absolute; inset: -40% auto -40% -35%; width: 32%; pointer-events: none;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.3), transparent);
    transform: skewX(-18deg); animation: login-button-glide 6.5s ease-in-out infinite 1.5s;
  }
  .login-page .login-security-line {
    border-top: 1px solid rgba(147,197,253,.42);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.34), transparent);
  }
  .login-page button:disabled { transform: none !important; }
  .login-page :is(a, button, input):focus-visible {
    outline: 3px solid rgba(37,99,235,.46);
    outline-offset: 3px;
  }
  @media (max-width: 1199px) {
    .login-page .login-layout { max-width: 760px; }
  }
  @media (max-width: 639px) {
    .login-page .login-layout { gap: 16px; padding: 12px; }
    .login-page .login-brand { border-radius: 24px; }
    .login-page .login-hero-title { overflow-wrap: anywhere; }
    .login-page .login-form-card { border-radius: 24px; }
    .login-page .login-feature { min-height: 110px; }
  }
  @media (max-width: 390px) {
    .login-page .login-brand { padding-inline: 17px; }
    .login-page .login-hero-title { font-size: 2.4rem; }
    .login-page .login-form-card { padding-inline: 18px; }
    .login-page .login-stat { padding-inline: 8px; }
  }
  @media (min-width: 1200px) {
    .login-page .login-layout {
      grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr);
    }
  }
  @keyframes login-rise {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes login-float {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(0, -12px, 0); }
  }
  @keyframes login-sheen {
    from { transform: translateX(-150%) skewX(-18deg); }
    to { transform: translateX(340%) skewX(-18deg); }
  }
  @keyframes login-ribbon-drift {
    0%, 100% { transform: translate3d(0, 0, 0) rotate(-18deg) scale(1); border-radius: 48% 52% 44% 56% / 55% 42% 58% 45%; }
    50% { transform: translate3d(3rem, -1.25rem, 0) rotate(-12deg) scale(1.06); border-radius: 58% 42% 54% 46% / 43% 58% 42% 57%; }
  }
  @keyframes login-button-glide {
    0%, 15% { transform: translateX(-180%) skewX(-18deg); }
    42%, 100% { transform: translateX(620%) skewX(-18deg); }
  }
  .login-rise { animation: login-rise .7s cubic-bezier(.2,.8,.2,1) both; }
  .login-float { animation: login-float 9s ease-in-out infinite; }
  .login-sheen::after {
    content: ''; position: absolute; inset-block: 0; left: -40%; width: 35%;
    pointer-events: none; transform: skewX(-18deg);
    background: linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent);
    animation: login-button-glide 6.5s ease-in-out infinite 2.2s;
  }
  .login-sheen:hover::after { animation: login-sheen .9s ease-out; }
  @media (prefers-reduced-motion: reduce) {
    .login-rise, .login-float, .login-liquid-ribbon, .login-sheen::after, .login-google::after { animation: none !important; }
    .login-rise { opacity: 1 !important; transform: none !important; }
    .login-page *, .login-page *::before, .login-page *::after {
      scroll-behavior: auto !important; animation-duration: .01ms !important;
      animation-iteration-count: 1 !important; transition-duration: .01ms !important;
    }
    .login-page .login-google:hover,
    .login-page .login-submit:hover,
    .login-page .login-mobile-cta:hover { transform: none !important; }
  }
`;
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
  const isBusy = loading || submitting || googleSubmitting;
  const clearFeedback = () => setError("");
  const redirectAfterLogin = () => {
    const state = location.state as LocationState | null;
    // Only allow in-app paths; reject protocol-relative URLs like "//evil.com".
    const destination =
      state?.from && state.from.startsWith("/") && !state.from.startsWith("//")
        ? state.from
        : "/";
    navigate(destination, { replace: true });
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isBusy) return;
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
    if (isBusy) return;
    clearFeedback();
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle();
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
  const inputClass =
    "login-input h-14 w-full rounded-2xl pl-12 text-base text-slate-800 outline-none transition duration-300 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-70";
  return (
    <main
      className="login-page isolate bg-[#edf6ff] text-[#102957] selection:bg-blue-200 selection:text-blue-950"
      style={{ position: "fixed", inset: 0, zIndex: 50, width: "100vw", height: "100dvh", maxWidth: "none", margin: 0, overflowX: "hidden", overflowY: "auto" }}
    >
      <style>{motionStyles}</style>
      <div aria-hidden="true" className="login-liquid-ribbon login-ribbon-one" />
      <div aria-hidden="true" className="login-liquid-ribbon login-ribbon-two" />
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
      <div className="login-layout relative min-h-screen items-stretch gap-5 p-3 sm:gap-6 sm:p-5 xl:gap-6 xl:p-6">
        {/* Brand / intro panel */}
        <section className="login-brand relative isolate flex min-w-0 flex-col overflow-hidden rounded-[1.65rem] border border-white/90 bg-[linear-gradient(130deg,rgba(255,255,255,.90)_0%,rgba(224,240,255,.81)_48%,rgba(202,231,255,.78)_100%)] px-5 py-7 text-[#173b82] shadow-[0_24px_65px_rgba(48,99,175,.16),inset_0_1px_0_rgba(255,255,255,.95)] backdrop-blur-2xl sm:rounded-[2rem] sm:px-8 sm:py-8 xl:min-h-[calc(100vh-3rem)] xl:px-9 xl:py-9 2xl:px-12">
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 rounded-full bg-cyan-200/45 blur-3xl" />
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
              className="group flex min-h-11 min-w-0 items-center gap-3 rounded-2xl text-[#173b82] no-underline focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-blue-200/80 bg-white/90 text-blue-600 shadow-[0_10px_24px_rgba(37,99,235,0.1)] transition duration-300 group-hover:-rotate-3 group-hover:scale-105 group-hover:bg-white">
                <Layers3 className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-[17px] leading-none tracking-[-0.03em]">
                  creative-crew
                </strong>
                <small className="mt-1 block text-[11px] font-bold tracking-[0.16em] text-blue-600/70">
                  CREATIVE WORKSPACE
                </small>
              </span>
            </Link>
            <span className="hidden shrink-0 items-center gap-2 rounded-full border border-blue-200/80 bg-white/85 px-3 py-2 text-[11px] font-bold tracking-[0.1em] text-blue-700 shadow-lg shadow-blue-500/10 backdrop-blur-md sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              PLAN. CREATE. GROW.
            </span>
          </div>
          <div className="relative z-10 my-9 min-w-0 max-w-3xl sm:my-12 xl:my-auto xl:py-8">
            <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-blue-600">
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-blue-500" />
              One shared space for your best work
            </span>
            <h1 className="login-hero-title mt-5 max-w-3xl text-[clamp(2.55rem,7vw,4.6rem)] font-semibold leading-[1.04] tracking-[-0.055em] sm:text-[clamp(3.1rem,5vw,4.6rem)]">
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
            <a
              href="#signin"
              className="login-mobile-cta mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 text-sm font-extrabold text-white shadow-[0_14px_30px_rgba(37,99,235,0.28)] transition hover:-translate-y-0.5 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 xl:hidden"
            >
              Sign in below
              <ArrowRight aria-hidden="true" className="h-4 w-4 rotate-90" />
            </a>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-3">
              {highlights.map((item) => (
                <span
                  key={item}
                  className="flex items-center gap-2 text-sm text-slate-700"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600 shadow-inner shadow-white/80">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </span>
              ))}
            </div>
            <div className="mt-7 grid grid-cols-1 gap-3 min-[390px]:grid-cols-2 min-[580px]:grid-cols-3">
              {quickCards.map(
                (
                  { title, body, icon: Icon, iconClass, iconBackground },
                  index,
                ) => (
                  <div
                    key={title}
                    className="login-feature login-rise min-w-0 rounded-2xl border border-white/90 bg-white/75 p-3.5 shadow-[0_12px_30px_rgba(37,99,235,0.08)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/95 hover:shadow-[0_18px_34px_rgba(37,99,235,0.12)]"
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
                    <strong className="mt-3 block truncate text-sm font-extrabold text-[#173b82]">
                      {title}
                    </strong>
                    <span className="mt-1 block truncate text-xs text-slate-500">
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
                  className="login-stat min-w-0 rounded-2xl border border-white/85 bg-white/55 px-2.5 py-3 backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white/80 sm:px-3.5"
                >
                  <Icon className="h-3.5 w-3.5 text-blue-600" />
                  <strong className="mt-2 block text-sm font-extrabold text-[#173b82]">
                    {value}
                  </strong>
                  <span className="mt-0.5 block break-words text-[11px] font-semibold leading-4 text-slate-500 sm:text-xs">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-10 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:items-center">
            <div className="login-info group flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/95 bg-white/80 p-3.5 text-[#173b82] shadow-[0_18px_42px_rgba(37,99,235,0.1)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:bg-white/95">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-100">
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block text-sm">Workspace clarity</strong>
                <span className="mt-1 block text-xs text-slate-500">
                  Everything moving in one rhythm.
                </span>
              </span>
              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-blue-500 transition group-hover:translate-x-1"
              />
            </div>
            <div className="login-info hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/50 px-4 py-3 text-xs text-slate-600 backdrop-blur-md sm:flex">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-100 text-cyan-600">
                <Zap className="h-4 w-4" />
              </span>
              <span>
                <strong className="block text-xs text-[#173b82]">
                  Ready when you are
                </strong>
                <span className="text-xs">Your next idea starts here.</span>
              </span>
            </div>
          </div>
          <div className="relative z-10 mt-5 flex items-center justify-between gap-5 text-xs text-slate-500 sm:mt-6">
            <span>Built for the work between the big ideas.</span>
            <Sparkles
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-blue-500"
            />
          </div>
        </section>
        {/* Sign-in panel */}
        <section id="signin" className="relative flex min-w-0 scroll-mt-4 items-center justify-center py-1 sm:px-4 sm:py-4 xl:min-h-[calc(100vh-3rem)] xl:px-2 2xl:px-7">
          <div
            aria-hidden="true"
            className="login-float pointer-events-none absolute right-[-3rem] top-[-2rem] h-60 w-60 rounded-full bg-sky-200/55 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="login-float pointer-events-none absolute bottom-[-3rem] left-[-3rem] h-56 w-56 rounded-full bg-blue-200/40 blur-3xl"
            style={{ animationDelay: "1.8s" }}
          />
          <div className="login-rise relative min-w-0 w-full max-w-[34rem]">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-1 rounded-[2rem] bg-gradient-to-br from-blue-300/85 via-white/90 to-cyan-300/85 opacity-80 blur-xl transition duration-700"
            />
            <div className="login-form-card relative overflow-hidden rounded-[1.8rem] border border-blue-100/90 bg-gradient-to-br from-white via-white/95 to-blue-50/90 p-5 shadow-[0_30px_90px_rgba(30,64,175,0.18)] backdrop-blur-2xl transition duration-500 hover:shadow-[0_34px_100px_rgba(30,64,175,0.22)] sm:rounded-[2rem] sm:p-8 xl:p-8 2xl:p-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full border border-blue-100/80 bg-blue-100/20"
              />
              <header className="relative z-10">
                <span className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/90 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.1em] text-blue-600">
                  <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
                  Secure workspace
                </span>
                <h2 className="mt-5 bg-gradient-to-br from-[#0b2554] via-[#173b82] to-blue-600 bg-clip-text pb-1 text-[clamp(2.25rem,7.5vw,3.8rem)] font-semibold leading-[1.06] tracking-[-0.055em] text-transparent sm:mt-6">
                  Welcome back.
                </h2>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-14 rounded-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 shadow-[0_0_16px_rgba(37,99,235,0.32)]"
                  />
                  <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-blue-600">
                    Your creative space is ready
                  </span>
                </div>
                <p className="mt-4 max-w-md text-sm leading-6 text-slate-600 sm:mt-5 sm:text-base sm:leading-7">
                  Sign in to pick up exactly where your team left off.
                </p>
              </header>
              <button
                type="button"
                onClick={continueWithGoogle}
                disabled={isBusy}
                aria-busy={googleSubmitting}
                className="login-google group/google relative mt-7 flex min-h-14 w-full items-center justify-center overflow-hidden rounded-2xl px-10 text-sm font-semibold text-white transition duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-8 sm:min-h-[3.75rem] sm:text-base"
              >
                <span className="flex min-w-0 items-center justify-center gap-3 text-center">
                  {googleSubmitting ? (
                    <Spinner light />
                  ) : (
                    <span className="login-google-icon">
                      <GoogleIcon />
                    </span>
                  )}
                  <span className="truncate">
                    {googleSubmitting
                      ? "Connecting to Google..."
                      : "Continue with Google"}
                  </span>
                </span>
                {!googleSubmitting && (
                  <ArrowRight
                    aria-hidden="true"
                    className="absolute right-4 h-4 w-4 text-white/75 transition duration-300 group-hover/google:translate-x-1 group-hover/google:text-white"
                  />
                )}
              </button>
              <div className="my-6 flex items-center gap-3 text-xs text-slate-500 sm:my-7">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-slate-200" />
                <span className="shrink-0">or continue with email</span>
                <span className="h-px flex-1 bg-gradient-to-l from-transparent via-slate-200 to-transparent" />
              </div>
              <form
                onSubmit={submit}
                noValidate
                className="relative z-10 space-y-4 sm:space-y-5"
              >
                <div>
                  <label
                    htmlFor="work-email"
                    className="mb-2 block text-sm font-extrabold text-slate-700"
                  >
                    Work email
                  </label>
                  <div className="group/input relative">
                    <Mail
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within/input:text-blue-600"
                    />
                    <input
                      id="work-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      placeholder="you@company.com"
                      value={email}
                      disabled={isBusy}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        clearFeedback();
                      }}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "login-feedback" : undefined}
                      className={inputClass + " pr-4"}
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="workspace-password"
                    className="mb-2 block text-sm font-extrabold text-slate-700"
                  >
                    Password
                  </label>
                  <div className="group/input relative">
                    <LockKeyhole
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition group-focus-within/input:text-blue-600"
                    />
                    <input
                      id="workspace-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      disabled={isBusy}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        clearFeedback();
                      }}
                      aria-invalid={Boolean(error)}
                      aria-describedby={error ? "login-feedback" : undefined}
                      className={inputClass + " pr-14"}
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-slate-500 transition hover:bg-blue-100 hover:text-blue-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {error ? (
                  <div
                    id="login-feedback"
                    role="alert"
                    className="flex items-start gap-3 rounded-2xl border border-red-200/90 bg-red-50/85 px-4 py-3 text-sm leading-5 text-red-700 shadow-sm"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-red-100 text-[11px] font-black"
                    >
                      !
                    </span>
                    <span className="min-w-0 break-words">{error}</span>
                  </div>
                ) : null}
                <div className="flex flex-col gap-1 pt-0.5 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="inline-flex items-center gap-1.5 text-slate-500">
                    <ShieldCheck
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-emerald-500"
                    />
                    Secure Firebase session
                  </span>
                  <Link
                    to="/reset-password"
                    className="inline-flex min-h-11 w-fit items-center rounded-md font-extrabold text-blue-600 transition hover:text-blue-800 hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
                  >
                    Forgot password?
                  </Link>
                </div>
                <button
                  type="submit"
                  disabled={isBusy}
                  aria-busy={submitting || loading}
                  className="login-submit login-sheen group/submit relative flex min-h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-5 text-base font-extrabold text-white shadow-[0_18px_38px_rgba(37,99,235,0.3)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(37,99,235,0.36)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting || loading ? (
                    <>
                      <Spinner light />
                      <span role="status">Signing in...</span>
                    </>
                  ) : (
                    <>
                      Sign in to workspace
                      <ArrowRight
                        aria-hidden="true"
                        className="h-4 w-4 transition duration-300 group-hover/submit:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>
              <div className="login-security-line relative z-10 mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 pt-5 text-center text-xs leading-5 text-slate-500 sm:mt-7">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-emerald-500"
                  />
                  Encrypted Firebase session
                </span>
                <span className="hidden h-1 w-1 rounded-full bg-blue-300 sm:block" />
                <span className="hidden items-center gap-1.5 sm:inline-flex">
                  <CheckCircle2
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-blue-500"
                  />
                  Role-aware access
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
