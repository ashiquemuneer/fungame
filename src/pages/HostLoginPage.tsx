import { ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useHostAccess } from '../state/host-access'

export function HostLoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useHostAccess()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

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
          onSubmit={(event) => {
            event.preventDefault()
            const success = login(code)

            if (!success) {
              setError('That host access code is incorrect.')
              return
            }

            const next = searchParams.get('next') || '/host/dashboard'
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
              onChange={(event) => {
                setCode(event.target.value)
                if (error) {
                  setError('')
                }
              }}
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <button className="button-primary w-full" type="submit">
            Unlock host area
          </button>
        </form>
      </section>
    </div>
  )
}
