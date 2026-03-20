import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGameStore } from '../state/game-store'
import { isSupabaseConfigured } from '../lib/supabase'

export function JoinPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { joinSession } = useGameStore()
  const roomCodeFromQuery = searchParams.get('roomCode')?.toUpperCase() || ''
  const [roomCode, setRoomCode] = useState(roomCodeFromQuery || (isSupabaseConfigured ? '' : 'PLAY42'))
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')

  return (
    <div className="mx-auto grid max-w-5xl gap-6 xl:grid-cols-[1fr_0.9fr]">
      <section className="panel p-8">
        <p className="text-sm uppercase tracking-[0.25em] text-white/45">Join the game</p>
        <h2 className="mt-3 text-4xl font-semibold text-white">Your phone is the buzzer.</h2>
        <p className="mt-4 max-w-lg text-sm leading-7 text-white/65">
          Enter the room code from the host screen, or scan the host QR code, choose your display
          name, and wait for the first question.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault()
            const joined = await joinSession(roomCode, displayName)

            if (!joined) {
              setError('That room code is invalid or the host has already closed the room.')
              return
            }

            setError('')
            navigate(`/play/${joined.sessionId}?playerId=${joined.playerId}`)
          }}
        >
          <input
            className="input"
            placeholder="Room code"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            required
          />
          <input
            className="input"
            placeholder="Display name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
          />
          {error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
          <button className="button-primary w-full" type="submit">
            Join room
          </button>
        </form>
      </section>

      <section className="panel p-8">
        <p className="text-sm uppercase tracking-[0.25em] text-white/45">How to join</p>
        <div className="mt-5 space-y-4 rounded-[2rem] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-white/70">
          {isSupabaseConfigured ? (
            <>
              <p>Ask the host for the room code displayed on their screen.</p>
              <p>
                Enter the room code and your display name, then tap <strong className="text-white">Join room</strong> to
                connect. You will be placed in the lobby until the host starts the game.
              </p>
            </>
          ) : (
            <>
              <p>Use the seeded room code <span className="font-mono text-white">PLAY42</span> to test immediately.</p>
              <p>
                Open the host session page in one tab and this join screen in another to simulate a
                real event.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
