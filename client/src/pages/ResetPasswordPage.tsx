import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  BadgeCheck,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { fetchCurrentUser, resetPassword } from "../lib/auth";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const emailLabel = useMemo(() => email ?? "your email address", [email]);

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(139,124,248,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(94,207,176,0.12),_transparent_24%),linear-gradient(180deg,_#0c0c11_0%,_#09090d_100%)] text-foreground">
      <div className="mx-0 flex min-h-screen w-full flex-col lg:grid lg:grid-cols-[minmax(0,38%)_minmax(0,62%)] xl:grid-cols-[minmax(0,36%)_minmax(0,64%)]">
        <section className="relative flex items-center justify-center px-6 pb-10 pt-4 sm:px-10 lg:px-16 lg:py-10 xl:px-20">
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
                Password recovery
              </p>
              <h2
                className="mt-3 text-3xl font-semibold tracking-tight text-foreground"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Set a new password.
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Your reset code was confirmed for {emailLabel}. Choose a new
                password to finish recovery.
              </p>
            </div>

            {infoMessage && (
              <p className="mb-5 rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                {infoMessage}
              </p>
            )}

            <form
              className="space-y-5"
              onSubmit={async (event) => {
                event.preventDefault();

                if (password.length < 8) {
                  setSubmitError("Password must be at least 8 characters long.");
                  return;
                }

                if (password !== confirmPassword) {
                  setSubmitError("Passwords do not match.");
                  return;
                }

                setSubmitError(null);
                setIsSubmitting(true);

                try {
                  await resetPassword(password);
                  navigate("/dashboard", { replace: true });
                } catch (error) {
                  const message =
                    error instanceof Error
                      ? error.message
                      : "Unable to reset your password.";
                  setSubmitError(message);
                  if (message.toLowerCase().includes("confirm")) {
                    setInfoMessage("Confirm your reset code first from the forgot password page.");
                  }
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  New password
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="new-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Create a new password"
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (submitError) {
                        setSubmitError(null);
                      }
                    }}
                    className="h-11 w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-new-password"
                  className="text-sm font-medium text-foreground"
                >
                  Confirm new password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="confirm-new-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      if (submitError) {
                        setSubmitError(null);
                      }
                    }}
                    className="h-11 w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {submitError && (
                <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_18px_40px_rgba(139,124,248,0.25)] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Resetting..." : "Reset password now"}
                <BadgeCheck className="h-4 w-4" />
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Didn&apos;t ask for this? You can safely ignore the message and
                close this tab.
              </p>
            </form>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/4 p-4">
              <p className="text-sm font-medium text-foreground">
                Need to switch accounts?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                You can return to the login screen and start over with a
                different email at any time.
              </p>
              <div className="mt-3 flex gap-3">
                <Link
                  to="/login"
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
                >
                  Back to login
                </Link>
                <Link
                  to="/forgot-password"
                  className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Start again
                </Link>
              </div>
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
              Recovery without the friction
            </div>

            <h1
              className="mt-6 max-w-lg text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Recover access and keep moving.
            </h1>

            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              A single recovery flow for forgotten passwords. The code verifies
              your identity, then the new password replaces the old one and
              your session opens.
            </p>

            <div className="mt-10 grid gap-4 justify-items-center sm:grid-cols-3 lg:justify-items-stretch">
              {[
                "OTP by email",
                "Password gets replaced after verification",
                "Resend is built in",
              ].map((point) => (
                <div
                  key={point}
                  className="w-full max-w-sm rounded-2xl border border-white/8 bg-white/4 p-4 text-center backdrop-blur-sm lg:max-w-none lg:text-left"
                >
                  <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/12 text-primary lg:mx-0">
                    <BadgeCheck className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
