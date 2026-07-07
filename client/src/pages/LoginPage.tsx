import AuthCard from '../components/AuthCard'

function LoginPage() {
  return (
    <AuthCard
      eyebrow="Access your account"
      title="Welcome back."
      subtitle="Log in to continue where you left off. This layout is ready to connect to a real auth provider or backend session later."
      footerText="Need an account?"
      footerLinkText="Create one"
      footerLinkTo="/signup"
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium text-slate-200">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/7"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="login-password" className="text-sm font-medium text-slate-200">
            Password
          </label>
          <input
            id="login-password"
            type="password"
            placeholder="Enter your password"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300/60 focus:bg-white/7"
          />
        </div>

        <div className="flex items-center justify-between gap-4 text-sm">
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-300"
            />
            Remember me
          </label>
          <button
            type="button"
            className="font-medium text-cyan-300 transition hover:text-cyan-200"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Sign in
        </button>
      </form>
    </AuthCard>
  )
}

export default LoginPage
