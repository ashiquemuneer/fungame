import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AlertBanner } from '../components/ui'

export function HostResetPasswordPage() {
  const navigate = useNavigate()
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error,           setError]           = useState('')
  const [loading,         setLoading]         = useState(false)
  const [sessionReady,    setSessionReady]    = useState(false)

  // Supabase embeds the recovery tokens in the URL hash.
  // Calling getSession() after page load picks them up automatically.
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSessionReady(true)
      else setError('Invalid or expired reset link. Please request a new one.')
    })
  }, [])

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-md">
        <div className="panel p-8 text-center text-lo text-sm">
          Password reset requires Supabase to be configured.
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <section className="panel p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-on-accent">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.12em] text-dim">Host portal</p>
            <h2 className="mt-1 text-2xl font-semibold text-hi">Set new password</h2>
          </div>
        </div>

        {!sessionReady && error ? (
          <div className="mt-6 space-y-4">
            <AlertBanner variant="error">
              {error}
            </AlertBanner>
            <button className="button-secondary w-full justify-center" onClick={() => navigate('/host/forgot-password')}>
              Request new reset link
            </button>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setError('')
              if (password !== confirmPassword) { setError('Passwords do not match.'); return }
              if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
              setLoading(true)
              const { error: err } = await supabase!.auth.updateUser({ password })
              setLoading(false)
              if (err) { setError(err.message); return }
              navigate('/host/dashboard')
            }}
          >
            <p className="text-sm text-lo">Enter a new password for your account.</p>

            <label className="block space-y-1.5 text-sm text-md">
              <span>New password</span>
              <input
                autoFocus
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                required
                minLength={6}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label className="block space-y-1.5 text-sm text-md">
              <span>Confirm new password</span>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                required
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>

            {error && (
              <AlertBanner variant="error">
                {error}
              </AlertBanner>
            )}

            <button className="button-primary w-full" type="submit" disabled={loading || !sessionReady}>
              {loading ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
