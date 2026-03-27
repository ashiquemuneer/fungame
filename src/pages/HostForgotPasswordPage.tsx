import { useState } from 'react'
import { Link } from 'react-router-dom'
import { KeyRound, ArrowLeft } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { AlertBanner } from '../components/ui'

export function HostForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-md">
        <div className="panel p-8 text-center text-lo text-sm">
          Password reset requires Supabase to be configured.
        </div>
      </div>
    )
  }

  const redirectTo = `${window.location.origin}${window.location.pathname}#/host/reset-password`

  return (
    <div className="mx-auto max-w-md">
      <section className="panel p-8">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent text-on-accent">
            <KeyRound className="size-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.12em] text-dim">Host portal</p>
            <h2 className="mt-1 text-2xl font-semibold text-hi">Reset your password</h2>
          </div>
        </div>

        {sent ? (
          <div className="mt-6 space-y-4">
            <AlertBanner variant="success">
              <p className="font-medium">Check your email</p>
              <p className="mt-1 opacity-80">
                We sent a password reset link to <strong>{email}</strong>. Click the link to set a new password.
              </p>
            </AlertBanner>
            <Link to="/host/login" className="button-secondary w-full justify-center">
              <ArrowLeft className="size-4" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <form
            className="mt-6 space-y-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setError('')
              setLoading(true)
              const { error: err } = await supabase!.auth.resetPasswordForEmail(email, { redirectTo })
              setLoading(false)
              if (err) { setError(err.message); return }
              setSent(true)
            }}
          >
            <p className="text-sm text-lo">
              Enter the email address you signed up with and we'll send you a reset link.
            </p>

            <label className="block space-y-1.5 text-sm text-md">
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

            {error && (
              <AlertBanner variant="error">
                {error}
              </AlertBanner>
            )}

            <button className="button-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>

            <div className="text-center">
              <Link to="/host/login" className="text-xs text-faded hover:text-lo transition">
                <ArrowLeft className="inline size-3 mr-1" />
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}
