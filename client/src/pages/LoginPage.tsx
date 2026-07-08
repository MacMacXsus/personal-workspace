import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import heroImage from "../assets/hero.png";
import { fetchCurrentUser, startGoogleAuth } from "../lib/auth";

const trustPoints = [
  "Encrypted sessions and secure device checks",
  "Single sign-on ready for teams later on",
  "Fast access to tasks, notes, and focus stats",
];

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let isActive = true;

    fetchCurrentUser()
      .then(() => {
        if (isActive) {
          navigate("/dashboard", { replace: true });
        }
      })
      .catch(() => {
        // Not signed in yet.
      });

    return () => {
      isActive = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(139,124,248,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(94,207,176,0.12),_transparent_24%),linear-gradient(180deg,_#0c0c11_0%,_#09090d_100%)] text-foreground">
      <div className="mx-0 flex min-h-screen w-full flex-col lg:grid lg:grid-cols-[minmax(0,30%)_minmax(0,70%)] xl:grid-cols-[minmax(0,32%)_minmax(0,68%)]">
        <section className="relative flex items-center justify-center px-6 pb-10 pt-4 sm:px-10 lg:px-16 xl:px-20 lg:py-10">
          <div className="relative z-10 w-full max-w-md rounded-[1.5rem] border border-white/10 bg-card/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:max-w-lg lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none xl:max-w-xl">
            <div className="mb-8">
              <Link
                to="/"
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Sparkles className="h-4 w-4 text-primary" />
                </span>
                Workspace
              </Link>
              <p className="text-xs font-mono uppercase tracking-[0.25em] text-primary">
                Welcome back
              </p>
              <h2
                className="mt-3 text-3xl font-semibold tracking-tight text-foreground"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Log in to continue.
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Google OAuth is the live sign-in path. We can wire email and
                password later if we need it.
              </p>
            </div>

            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault();
                startGoogleAuth();
              }}
            >
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-11 w-full rounded-xl border border-border bg-background/80 pl-10 pr-12 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                  <button
                    type="button"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setShowPassword((value) => !value)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary/20"
                  />
                  Remember me
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_18px_40px_rgba(139,124,248,0.25)]"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[conic-gradient(from_180deg,#4285F4_0deg,#4285F4_90deg,#34A853_90deg,#34A853_180deg,#FBBC05_180deg,#FBBC05_270deg,#EA4335_270deg,#EA4335_360deg)] p-[2px] text-[10px] font-semibold text-foreground">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-background">
                    G
                  </span>
                </span>
                Continue with Google
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-xs text-muted-foreground">
                By continuing, you agree to the workspace terms and privacy
                policy.
              </p>
            </form>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/4 p-4">
              <p className="text-sm font-medium text-foreground">
                No account yet?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                <Link
                  to="/signup"
                  className="font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Create your workspace account
                </Link>{" "}
                and get set up in a few steps.
              </p>
            </div>
          </div>
        </section>

        <section className="relative flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_18%,rgba(139,124,248,0.16),transparent_30%),radial-gradient(circle_at_80%_82%,rgba(94,207,176,0.12),transparent_28%),linear-gradient(180deg,#0c0c11_0%,#09090d_100%)] px-6 py-10 sm:px-10 lg:justify-self-stretch lg:px-16 xl:px-24">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(139,124,248,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(139,124,248,0.045)_1px,transparent_1px)] bg-[size:56px_56px] opacity-25 [mask-image:radial-gradient(circle_at_center,black_28%,transparent_80%)]" />
          <div className="absolute -left-28 top-12 h-72 w-72 rounded-full bg-primary/22 blur-3xl animate-[login-drift_18s_ease-in-out_infinite]" />
          <div className="absolute -right-20 bottom-4 h-96 w-96 rounded-full bg-accent/14 blur-3xl animate-[login-drift-reverse_22s_ease-in-out_infinite]" />
          <div className="absolute left-[18%] top-[18%] h-36 w-36 rounded-full border border-primary/20 bg-card/70 shadow-[0_0_60px_rgba(139,124,248,0.18)] animate-[login-drift_14s_ease-in-out_infinite]" />
          <div className="absolute right-[16%] top-[30%] h-20 w-20 rounded-full bg-secondary/80 shadow-[0_0_40px_rgba(94,207,176,0.14)] animate-[login-drift-reverse_16s_ease-in-out_infinite]" />

          <div className="relative z-10 flex w-full flex-col items-center text-center lg:items-start lg:text-left lg:max-w-none">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure access to your workspace
            </div>

            <h1
              className="mt-6 max-w-lg text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Sign in and keep the momentum going.
            </h1>

            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              Jump back into your tasks, notes, and calendar from one clean
              place. The Google OAuth flow is wired to the backend now.
            </p>

            <div className="mt-10 grid gap-4 justify-items-center sm:grid-cols-3 lg:justify-items-stretch">
              {trustPoints.map((point) => (
                <div
                  key={point}
                  className="w-full max-w-sm rounded-2xl border border-white/8 bg-white/4 p-4 text-center backdrop-blur-sm lg:max-w-none lg:text-left"
                >
                  <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary lg:mx-0">
                    <Lock className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {point}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-card/70 p-5 shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur-xl">
              <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
                <img
                  src={heroImage}
                  alt="Abstract workspace illustration"
                  className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 bg-black/40 object-cover p-2"
                />
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.24em] text-muted-foreground">
                    Built for focus
                  </p>
                  <p
                    className="mt-1 text-lg font-semibold text-foreground"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    One place for the work that matters.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
