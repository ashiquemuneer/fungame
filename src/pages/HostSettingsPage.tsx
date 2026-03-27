import { useState } from 'react'
import { Settings, KeyRound, User, LogOut, Sun, Moon, Monitor } from 'lucide-react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { useGameStore } from '../state/game-store'
import { useTheme } from '../state/theme'
import { AlertBanner } from '../components/ui'

export function HostSettingsPage() {
  const { hostEmail, signOut } = useGameStore()
  const { theme, setTheme } = useTheme()

  // Change password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwError,         setPwError]         = useState('')
  const [pwSuccess,       setPwSuccess]       = useState('')
  const [pwLoading,       setPwLoading]       = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')

    if (newPassword !== confirmPassword) { setPwError('Passwords do not match.'); return }
    if (newPassword.length < 6) { setPwError('Password must be at least 6 characters.'); return }
    if (newPassword === currentPassword) { setPwError('New password must be different from current password.'); return }

    setPwLoading(true)
    const { error } = await supabase!.auth.updateUser({ password: newPassword })
    setPwLoading(false)

    if (error) { setPwError(error.message); return }
    setPwSuccess('Password updated successfully.')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const email = hostEmail ?? ''
  const initials = email ? email[0].toUpperCase() : '?'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-on-accent">
          <Settings className="size-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-hi">Account settings</h1>
          <p className="text-sm text-dim">Manage your host account</p>
        </div>
      </div>

      {/* Account info */}
      {isSupabaseConfigured && (
      <section className="panel p-6">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-accent text-on-accent text-xl font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <User className="size-4 text-faded" />
              <span className="text-sm text-lo">Signed in as</span>
            </div>
            <p className="mt-0.5 font-medium text-hi truncate">{email}</p>
          </div>
        </div>
      </section>
      )}

      {/* Change password */}
      {isSupabaseConfigured && (
      <section className="panel p-6">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound className="size-4 text-accent-text" />
          <h2 className="font-semibold text-hi">Change password</h2>
        </div>

        <form className="space-y-4" onSubmit={handleChangePassword}>
          <label className="block space-y-1.5 text-sm text-md">
            <span>Current password</span>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              required
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>

          <label className="block space-y-1.5 text-sm text-md">
            <span>New password</span>
            <input
              className="input"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              required
              minLength={6}
              onChange={(e) => setNewPassword(e.target.value)}
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

          {pwError && (
            <AlertBanner variant="error">
              {pwError}
            </AlertBanner>
          )}
          {pwSuccess && (
            <AlertBanner variant="success">
              {pwSuccess}
            </AlertBanner>
          )}

          <button className="button-primary" type="submit" disabled={pwLoading}>
            {pwLoading ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
      )}

      {/* Appearance */}
      <section className="panel p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sun className="size-4 text-accent-text" />
          <h2 className="font-semibold text-hi">Appearance</h2>
        </div>
        <p className="mb-4 text-sm text-dim">Choose your preferred colour scheme.</p>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('dark')}
            className={`flex flex-1 flex-col items-center gap-2.5 rounded-2xl border px-4 py-4 text-sm font-medium transition ${
              theme === 'dark'
                ? 'border-accent-dim bg-accent-dim text-accent-text'
                : 'border-edge bg-fill text-dim hover:border-rim hover:bg-fill-hi'
            }`}
          >
            <Moon className="size-5" />
            Dark
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`flex flex-1 flex-col items-center gap-2.5 rounded-2xl border px-4 py-4 text-sm font-medium transition ${
              theme === 'light'
                ? 'border-accent-dim bg-accent-dim text-accent-text'
                : 'border-edge bg-fill text-dim hover:border-rim hover:bg-fill-hi'
            }`}
          >
            <Sun className="size-5" />
            Light
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`flex flex-1 flex-col items-center gap-2.5 rounded-2xl border px-4 py-4 text-sm font-medium transition ${
              theme === 'system'
                ? 'border-accent-dim bg-accent-dim text-accent-text'
                : 'border-edge bg-fill text-dim hover:border-rim hover:bg-fill-hi'
            }`}
          >
            <Monitor className="size-5" />
            System
          </button>
        </div>
      </section>

      {/* Sign out */}
      {isSupabaseConfigured && (
      <section className="panel p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-hi">Sign out</h2>
            <p className="mt-1 text-sm text-dim">Sign out of your host account on this device.</p>
          </div>
          <button
            className="button-secondary flex items-center gap-2"
            onClick={signOut}
          >
            <LogOut className="size-4" />
            Sign out
          </button>
        </div>
      </section>
      )}
    </div>
  )
}
