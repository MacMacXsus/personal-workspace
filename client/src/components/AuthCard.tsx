import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type AuthCardProps = {
  title: string
  subtitle: string
  eyebrow: string
  children: ReactNode
  footerText: string
  footerLinkText: string
  footerLinkTo: string
}

function AuthCard({
  title,
  subtitle,
  eyebrow,
  children,
  footerText,
  footerLinkText,
  footerLinkTo,
}: AuthCardProps) {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-slate-950/50 backdrop-blur md:grid-cols-2">
        <div className="flex flex-col justify-between border-b border-white/10 bg-slate-950/50 p-8 md:border-b-0 md:border-r">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-xs font-semibold tracking-[0.28em] text-cyan-200 uppercase">
              {eyebrow}
            </span>
            <div className="space-y-4">
              <h1 className="max-w-md text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {title}
              </h1>
              <p className="max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-semibold text-white">01</p>
              <p className="mt-1 text-sm text-slate-300">Fast onboarding</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-semibold text-white">02</p>
              <p className="mt-1 text-sm text-slate-300">Simple auth flow</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-2xl font-semibold text-white">03</p>
              <p className="mt-1 text-sm text-slate-300">Ready for backend</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-8 sm:p-10">
          <div className="w-full max-w-md rounded-[1.5rem] border border-white/10 bg-slate-950/60 p-6 shadow-xl shadow-slate-950/40 sm:p-8">
            {children}
            <p className="mt-8 text-center text-sm text-slate-400">
              {footerText}{' '}
              <Link
                to={footerLinkTo}
                className="font-medium text-cyan-300 transition hover:text-cyan-200"
              >
                {footerLinkText}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AuthCard
