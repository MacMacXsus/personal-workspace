import { useState } from "react"
import { Link } from "react-router-dom"
import {
  ArrowRight,
  Mail,
  ShieldCheck,
  Sparkles,
  Lock,
  Clock3,
} from "lucide-react"
import heroImage from "../assets/hero.png"

const recoveryPoints = [
  "Reset links expire automatically for safety",
  "Secure recovery keeps your workspace protected",
  "Get back in without losing your flow",
]

function ForgotPasswordPage() {
  const [email, setEmail] = useState("")

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(139,124,248,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(94,207,176,0.12),_transparent_24%),linear-gradient(180deg,_#0c0c11_0%,_#09090d_100%)] text-foreground">
      <div className="mx-0 flex min-h-screen w-full flex-col lg:grid lg:grid-cols-[minmax(0,30%)_minmax(0,70%)] xl:grid-cols-[minmax(0,32%)_minmax(0,68%)]">
        <section className="relative flex items-center justify-center px-6 pb-10 pt-4 sm:px-10 lg:px-16 lg:py-10 xl:px-20">
          <div className="relative z-10 w-full max-w-md rounded-[1.5rem] border border-white/10 bg-card/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8 lg:max-w-lg lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none xl:max-w-xl">
            <div className="mb-8">
              <Link
                to="/login"
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                  <Sparkles className="h-4 w-4 text-primary" />
                </span>
                Workspace
              </Link>
              <p className="text-xs font-mono uppercase tracking-[0.25em] text-primary">
                Recovery
              </p>
              <h2
                className="mt-3 text-3xl font-semibold tracking-tight text-foreground"
                style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
              >
                Reset your password.
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Enter your email and we&apos;ll send a secure link to create a new password.
              </p>
            </div>

            <form
              className="space-y-5"
              onSubmit={(event) => {
                event.preventDefault()
              }}
            >
              <div className="space-y-2">
                <label htmlFor="recovery-email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="recovery-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-11 w-full rounded-xl border border-border bg-background/80 pl-10 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-[0_18px_40px_rgba(139,124,248,0.25)]"
              >
                Send reset link
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="text-center text-xs text-muted-foreground">
                Check your inbox after submitting. If you don&apos;t see it, check spam or try again.
              </p>
            </form>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/4 p-4">
              <p className="text-sm font-medium text-foreground">Need to go back?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <Link
                  to="/login"
                  className="font-medium text-primary transition-colors hover:text-primary/80"
                >
                  Return to sign in
                </Link>
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
              Recovery without the friction
            </div>

            <h1
              className="mt-6 max-w-lg text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
              style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
            >
              Recover access and keep moving.
            </h1>

            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">
              A simple reset flow that stays consistent with the login and signup pages, so the whole auth experience feels unified.
            </p>

            <div className="mt-10 grid gap-4 justify-items-center sm:grid-cols-3 lg:justify-items-stretch">
              {recoveryPoints.map((point) => (
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
                <Clock3 className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-black/40 p-2 text-primary" />
                <div>
                  <p className="text-xs font-mono uppercase tracking-[0.24em] text-muted-foreground">
                    Fast recovery
                  </p>
                  <p
                    className="mt-1 text-lg font-semibold text-foreground"
                    style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}
                  >
                    Back in your workspace in minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
