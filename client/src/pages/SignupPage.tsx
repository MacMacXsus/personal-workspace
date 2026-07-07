import AuthCard from '../components/AuthCard'

function SignupPage() {
  return (
    <AuthCard
      eyebrow="Create your account"
      title="Start your journey."
      subtitle="Create a new account in a layout that can scale from a simple prototype into a real onboarding flow."
      footerText="Already have an account?"
      footerLinkText="Log in"
      footerLinkTo="/login"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="signup-first-name" className="text-sm font-medium text-slate-200">
              First name
            </label>
            <input
              id="signup-first-name"
              type="text"
              placeholder="Jane"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/7"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="signup-last-name" className="text-sm font-medium text-slate-200">
              Last name
            </label>
            <input
              id="signup-last-name"
              type="text"
              placeholder="Doe"
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/7"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-email" className="text-sm font-medium text-slate-200">
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/7"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="signup-password" className="text-sm font-medium text-slate-200">
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            placeholder="Create a password"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/7"
          />
        </div>

        <label className="flex items-start gap-3 text-sm leading-6 text-slate-300">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-300"
          />
          <span>
            I agree to the terms of service and the privacy policy.
          </span>
        </label>

        <button
          type="submit"
          className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Create account
        </button>
      </form>
    </AuthCard>
  )
}

export default SignupPage
