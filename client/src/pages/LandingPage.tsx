import { Link } from 'react-router-dom'

function LandingPage() {
  const features = [
    {
      title: 'Clear auth flow',
      description: 'Separate login and signup pages with shared structure.',
    },
    {
      title: 'Tailwind-first UI',
      description: 'Fast utility-based styling with a polished visual direction.',
    },
    {
      title: 'Ready to expand',
      description: 'Easy to connect to backend auth or a real product flow.',
    },
  ]

  return (
    <main className="min-h-screen px-6 py-8 sm:px-8 lg:px-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-full border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
        <Link to="/" className="text-sm font-semibold tracking-[0.28em] text-white uppercase">
          Nova
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/login"
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Sign up
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:py-24">
        <div className="space-y-8">
          <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs font-semibold tracking-[0.28em] text-cyan-200 uppercase">
            Welcome home
          </span>
          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Build your product with a clean landing, login, and signup flow.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              This starter gives us three essential entry points for the app:
              a landing page to explain the product, plus login and signup
              screens to handle access.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 hover:bg-cyan-300"
            >
              Get started
            </Link>
            <Link
              to="/login"
              className="rounded-full border border-white/15 px-6 py-3 font-semibold text-white/90 transition hover:border-cyan-300/60 hover:bg-white/5"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur">
            <p className="text-sm font-medium text-cyan-200">Session overview</p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-2xl bg-slate-950/50 px-4 py-3">
                <span className="text-sm text-slate-300">Landing page</span>
                <span className="text-sm font-semibold text-white">Ready</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-950/50 px-4 py-3">
                <span className="text-sm text-slate-300">Login page</span>
                <span className="text-sm font-semibold text-white">Ready</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-950/50 px-4 py-3">
                <span className="text-sm text-slate-300">Signup page</span>
                <span className="text-sm font-semibold text-white">Ready</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-[1.5rem] border border-white/10 bg-slate-950/40 p-5"
              >
                <h2 className="text-lg font-semibold text-white">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default LandingPage
