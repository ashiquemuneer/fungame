import { useEffect } from 'react'
import {
  ArrowRight, BarChart2, QrCode, Smartphone, Users, Zap,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useGameStore } from '../state/game-store'

const FEATURES = [
  {
    icon: Zap,
    title: 'Live in seconds',
    body: 'Create a question set, start a room, and share the code. Players join instantly — no app download needed.',
  },
  {
    icon: Smartphone,
    title: 'Any device',
    body: 'Players join from their phone or laptop via a QR code or 6-character room code.',
  },
  {
    icon: BarChart2,
    title: 'Real-time scoring',
    body: 'Answers come in live. Leaderboard updates after every question. The winner is always clear.',
  },
  {
    icon: Users,
    title: 'Built for teams',
    body: 'Perfect for office all-hands, team onboarding, training sessions, and Friday fun.',
  },
]

const HOW_IT_WORKS = [
  { step: '01', icon: QrCode,   title: 'Create a game',     body: 'Build your question set with multiple choice, true/false, ratings, and more.' },
  { step: '02', icon: Zap,      title: 'Open a room',       body: 'Start a live session. Share the QR code or room code on your screen.' },
  { step: '03', icon: BarChart2, title: 'Play & celebrate', body: 'Watch answers roll in, reveal results, and crown the winner.' },
]

export function HomePage() {
  const navigate = useNavigate()
  const { isHostAuthenticated } = useGameStore()

  // Redirect logged-in hosts to dashboard
  useEffect(() => {
    if (isHostAuthenticated) {
      navigate('/host/dashboard', { replace: true })
    }
  }, [isHostAuthenticated, navigate])

  if (isHostAuthenticated) return null

  return (
    <div className="space-y-24 pb-24">

      {/* ── Hero ── */}
      <section className="pt-16 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-dim bg-accent-dim px-4 py-1.5 text-xs font-medium text-accent-text">
            <span className="size-1.5 animate-pulse rounded-full bg-accent" />
            Live quiz for your whole team
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-5xl font-semibold leading-[1.15] tracking-tight text-hi sm:text-6xl xl:text-7xl">
            Quizzes your team<br />
            <span className="text-accent-text">actually enjoys</span>
          </h1>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-lo">
            Build question sets, run live rooms, collect answers, and reveal winners — all from one clean dashboard. No extra software required.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/host/login"
              className="button-primary px-6 py-3 text-base"
            >
              Get started free
              <ArrowRight className="size-5" />
            </Link>
            <Link
              to="/join"
              className="button-secondary px-6 py-3 text-base"
            >
              Join as player
            </Link>
          </div>
        </div>

        {/* Mock dashboard preview */}
        <div className="mx-auto mt-16 max-w-4xl">
          <div className="panel overflow-hidden border-edge p-1">
            <div className="flex h-10 items-center gap-2 border-b border-line px-4">
              <div className="flex gap-1.5">
                <div className="size-2.5 rounded-full bg-fill-hi" />
                <div className="size-2.5 rounded-full bg-fill-hi" />
                <div className="size-2.5 rounded-full bg-fill-hi" />
              </div>
              <div className="mx-auto h-5 w-40 rounded-md bg-fill-lo" />
            </div>
            <div className="grid grid-cols-[180px_1fr] divide-x divide-line">
              {/* Sidebar mockup */}
              <div className="space-y-1 p-3">
                {['Dashboard', 'My Games', 'Sessions'].map((item, i) => (
                  <div
                    key={item}
                    className={`h-8 rounded-lg ${i === 0 ? 'bg-accent-dim' : 'bg-fill'}`}
                  />
                ))}
              </div>
              {/* Content mockup */}
              <div className="p-4 space-y-3">
                <div className="h-6 w-48 rounded-lg bg-fill-lo" />
                <div className="grid grid-cols-3 gap-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-24 rounded-2xl bg-fill" />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['from-violet-500/20 to-purple-700/15', 'from-sky-500/20 to-blue-700/15', 'from-emerald-500/20 to-teal-700/15'].map((g, i) => (
                    <div key={i} className={`h-32 rounded-2xl bg-gradient-to-br ${g}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-accent-text">Everything you need</p>
          <h2 className="mt-2 text-3xl font-semibold text-hi">Quiz night, without the headache</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="panel p-5">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-accent-dim text-accent-text">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-hi">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-dim">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-accent-text">Simple by design</p>
          <h2 className="mt-2 text-3xl font-semibold text-hi">Up and running in 3 steps</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {HOW_IT_WORKS.map(({ step, icon: Icon, title, body }) => (
            <div key={step} className="relative panel p-6">
              <p className="font-mono text-5xl font-bold text-subtle absolute -top-2 right-4">{step}</p>
              <div className="flex size-11 items-center justify-center rounded-2xl bg-accent-dim text-accent-text">
                <Icon className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-hi">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-dim">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-2xl text-center">
        <div className="panel p-10">
          <h2 className="text-3xl font-semibold text-hi">Ready to run your first game?</h2>
          <p className="mt-3 text-dim">Free to start. No credit card. Just great quizzes.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/host/login"
              className="button-primary px-6 py-3 text-base"
            >
              Create your first game
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
