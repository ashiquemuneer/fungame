import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { isSupabaseConfigured } from '../lib/supabase'
import { useGameStore } from '../state/game-store'
import { useHostAccess } from '../state/host-access'

export function HostLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') || '/host/dashboard'

  // Supabase email auth
  const { signUp, signIn } = useGameStore()
  const [tab, setTab] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

  // Legacy access-code auth (non-Supabase mode)
  const { login } = useHostAccess()
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')

  if (isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-md">
        <section className="panel p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-300 text-stone-950">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-white/45">Host portal</p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                {tab === 'signin' ? 'Sign in to your account' : 'Create host account'}
              </h2>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-6 flex rounded-2xl border border-white/10 bg-black/20 p-1">
            <button
              type="button"
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${tab === 'signin' ? 'bg-orange-300 text-stone-950' : 'text-white/60 hover:text-white'}`}
              onClick={() => { setTab('signin'); setError(''); setInfo('') }}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${tab === 'signup' ? 'bg-orange-300 text-stone-950' : 'text-white/60 hover:text-white'}`}
              onClick={() => { setTab('signup'); setError(''); setInfo('') }}
            >
              Sign up
            </button>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setError('')
              setInfo('')

              if (tab === 'signup') {
                if (password !== confirmPassword) {
                  setError('Passwords do not match.')
                  return
                }
                if (password.length < 6) {
                  setError('Password must be at least 6 characters.')
                  return
                }
                setLoading(true)
                const err = await signUp(email, password)
                setLoading(false)
                if (err) { setError(err); return }
                setInfo('Account created! Check your email to confirm, then sign in.')
                setTab('signin')
              } else {
                setLoading(true)
                const err = await signIn(email, password)
                setLoading(false)
                if (err) { setError(err); return }
                navigate(next)
              }
            }}
          >
            <label className="block space-y-1.5 text-sm text-white/80">
              <span>Email address</span>
              <input
                autoFocus
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                required
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="block space-y-1.5 text-sm text-white/80">
              <span>Password</span>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            {tab === 'signup' && (
              <label className="block space-y-1.5 text-sm text-white/80">
                <span>Confirm password</span>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  required
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </label>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </div>
            )}
            {info && (
              <div className="rounded-2xl border border-green-300/20 bg-green-300/10 px-4 py-3 text-sm text-green-100">
                {info}
              </div>
            )}

            <button className="button-primary w-full" type="submit" disabled={loading}>
              {loading ? (tab === 'signup' ? 'Creating account…' : 'Signing in…') : (tab === 'signup' ? 'Create account' : 'Sign in')}
            </button>
          </form>
        </section>
      </div>
    )
  }

  // Legacy host-code mode
  return (
    <div className="mx-auto max-w-xl">
      <section className="panel p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-orange-300 text-stone-950">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-white/45">Host access</p>
            <h2 className="mt-1 text-3xl font-semibold text-white">Unlock host controls</h2>
          </div>
        </div>
        <p className="mt-5 text-sm leading-7 text-white/65">
          Participants can use the same app to join the game, but only browsers with the host access
          code can open the dashboard and live controls.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const success = login(code)
            if (!success) { setCodeError('That host access code is incorrect.'); return }
            navigate(next)
          }}
        >
          <label className="space-y-2 text-sm text-white/80">
            <span>Host access code</span>
            <input
              autoFocus
              className="input"
              placeholder="Enter host code"
              type="password"
              value={code}
              onChange={(e) => { setCode(e.target.value); if (codeError) setCodeError('') }}
            />
          </label>
          {codeError && (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              {codeError}
            </div>
          )}
          <button className="button-primary w-full" type="submit">Unlock host area</button>
        </form>
      </section>
    </div>
  )
}
