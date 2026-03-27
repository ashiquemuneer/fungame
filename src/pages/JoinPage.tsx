import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGameStore } from '../state/game-store'
import { isSupabaseConfigured } from '../lib/supabase'
import { AlertBanner } from '../components/ui'

export function JoinPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { joinSession } = useGameStore()
  const roomCodeFromQuery = searchParams.get('roomCode')?.toUpperCase() || ''
  const [roomCode, setRoomCode] = useState(roomCodeFromQuery || (isSupabaseConfigured ? '' : 'PLAY42'))
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(false)

  return (
    <div className="mx-auto grid max-w-5xl gap-6 xl:grid-cols-[1fr_0.9fr]">
      <section className="panel p-8">
        <p className="text-sm uppercase tracking-[0.12em] text-dim">Join the game</p>
        <h2 className="mt-3 text-4xl font-semibold text-hi">Your phone is the buzzer.</h2>
        <p className="mt-4 max-w-lg text-sm leading-7 text-lo">
          Enter the room code from the host screen, or scan the host QR code, choose your display
          name, and wait for the first question.
        </p>

        <form
          className="mt-8 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault()
            setJoining(true)
            setError('')
            const joined = await joinSession(roomCode, displayName)
            setJoining(false)

            if (!joined) {
              setError('Room not found. Make sure the code is correct and the host has not closed the room. If this is your first try, wait a moment and try again.')
              return
            }

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
            <AlertBanner variant="error">
              {error}
            </AlertBanner>
          ) : null}
          <button className="button-primary w-full" type="submit" disabled={joining}>
            {joining ? 'Connecting…' : 'Join room'}
          </button>
        </form>
      </section>

      <section className="panel p-8">
        <p className="text-sm uppercase tracking-[0.12em] text-dim">How to join</p>
        <div className="mt-5 space-y-4 rounded-[2rem] border border-edge bg-input-bg p-5 text-sm leading-7 text-lo">
          {isSupabaseConfigured ? (
            <>
              <p>Ask the host for the room code displayed on their screen.</p>
              <p>
                Enter the room code and your display name, then tap <strong className="text-hi">Join room</strong> to
                connect. You will be placed in the lobby until the host starts the game.
              </p>
            </>
          ) : (
            <>
              <p>Use the seeded room code <span className="font-mono text-hi">PLAY42</span> to test immediately.</p>
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
