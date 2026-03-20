import { ArrowRight, CirclePlay, Cloud, LayoutTemplate, Radio, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGameStore } from '../state/game-store'

export function HomePage() {
  const { state } = useGameStore()

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel overflow-hidden p-8">
          <div className="max-w-2xl space-y-6">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-orange-200/80">
              Live quiz for colleagues
            </p>
            <h2 className="font-['Sora','Avenir_Next',sans-serif] text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Run the whole office game from one clean dashboard.
            </h2>
            <p className="max-w-xl text-base leading-8 text-white/70">
              This starter is focused on the real event flow: create questions, open a room,
              collect answers, track scores, and reveal the winner without paying for a backend.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link className="button-primary" to="/host/dashboard">
                Open host dashboard
                <ArrowRight className="size-4" />
              </Link>
              <Link className="button-secondary" to="/join">
                Join as player
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-1">
          <div className="panel p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-white/45">Seeded demo</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-white/50">Published games</p>
                <p className="text-3xl font-semibold text-white">{state.games.length}</p>
              </div>
              <div>
                <p className="text-sm text-white/50">Try room code</p>
                <p className="rounded-2xl bg-black/20 px-4 py-3 font-mono text-2xl tracking-[0.35em] text-orange-100">
                  PLAY42
                </p>
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-white/45">Why this stack</p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-white/70">
              <li>Free-first architecture for small internal events</li>
              <li>Mock mode lets you design before wiring realtime</li>
              <li>Supabase migration included for the backend phase</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: LayoutTemplate,
            title: 'Question builder',
            body: 'MCQ, true/false, and short-text rounds with timers and point values.',
          },
          {
            icon: Radio,
            title: 'Live session flow',
            body: 'Lobby, current question, answer count, reveal, leaderboard, and winner state.',
          },
          {
            icon: ShieldCheck,
            title: 'Free backend ready',
            body: 'Supabase schema, RLS starter, and join RPC are ready in the migration folder.',
          },
          {
            icon: Cloud,
            title: 'Cloudflare deployable',
            body: 'SPA routing and static output setup are already aligned for Pages hosting.',
          },
        ].map((feature) => (
          <div key={feature.title} className="panel p-5">
            <feature.icon className="size-10 rounded-2xl bg-orange-300/15 p-2 text-orange-100" />
            <h3 className="mt-4 text-xl font-semibold text-white">{feature.title}</h3>
            <p className="mt-3 text-sm leading-7 text-white/65">{feature.body}</p>
          </div>
        ))}
      </section>

      <section className="panel grid gap-6 p-6 xl:grid-cols-[1fr_0.95fr]">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-white/45">Event flow</p>
          <ol className="mt-4 space-y-4 text-sm text-white/70">
            <li>1. Host creates or edits a question set.</li>
            <li>2. Host launches a live room and shares the code.</li>
            <li>3. Players join from their phones or laptops.</li>
            <li>4. Host starts the round and moves through each question.</li>
            <li>5. Leaderboard updates after each reveal and the winner closes the session.</li>
          </ol>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/45">Fast test</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Start using the prototype</h3>
            </div>
            <CirclePlay className="size-10 text-orange-200" />
          </div>

          <div className="mt-6 grid gap-3">
            <Link className="button-primary" to="/host/dashboard">
              Host the demo session
            </Link>
            <Link className="button-secondary" to="/join">
              Join with room code
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
