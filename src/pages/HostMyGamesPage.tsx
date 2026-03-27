import { useMemo, useState } from 'react'
import {
  BookOpen, Copy, Edit3, Lightbulb, MoreHorizontal,
  Play, Plus, SortAsc, Tag, Trash2,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { coverGradient, formatDate } from '../lib/utils'
import { useGameStore } from '../state/game-store'
import {
  ConfirmDialog, DropdownItem, DropdownMenu, DropdownSeparator,
  Modal, NoGamesEmpty, Tooltip, useToast,
} from '../components/ui'

type SortKey = 'newest' | 'oldest' | 'name_asc' | 'name_desc'

const SORT_LABELS: Record<SortKey, string> = {
  newest:    'Newest first',
  oldest:    'Oldest first',
  name_asc:  'Name A → Z',
  name_desc: 'Name Z → A',
}

function applySortKey<T extends { title: string; createdAt?: string; updatedAt?: string }>(
  items: T[], key: SortKey,
): T[] {
  const arr = [...items]
  if (key === 'newest')    return arr.sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime())
  if (key === 'oldest')    return arr.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime())
  if (key === 'name_asc')  return arr.sort((a, b) => a.title.localeCompare(b.title))
  if (key === 'name_desc') return arr.sort((a, b) => b.title.localeCompare(a.title))
  return arr
}

export function HostMyGamesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q')?.toLowerCase() ?? ''

  const { state, createGame, deleteGame, duplicateGame, createSession } = useGameStore()
  const toast = useToast()

  const [sortKey,      setSortKey]     = useState<SortKey>('newest')
  const [activeTag,    setActiveTag]   = useState<string | null>(null)
  const [showCreate,   setShowCreate]  = useState(false)
  const [createTitle,  setCreateTitle] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [startingRoom,  setStartingRoom]  = useState<string | null>(null)

  const allTags = useMemo(
    () => [...new Set(state.games.flatMap((g) => g.tags ?? []))].sort(),
    [state.games],
  )

  const filteredGames = useMemo(() => {
    let list = searchQuery
      ? state.games.filter((g) =>
          g.title.toLowerCase().includes(searchQuery) ||
          g.description?.toLowerCase().includes(searchQuery),
        )
      : state.games
    if (activeTag) list = list.filter((g) => (g.tags ?? []).includes(activeTag))
    return applySortKey(list, sortKey)
  }, [state.games, searchQuery, sortKey, activeTag])

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!createTitle.trim()) return
    const id = createGame(createTitle.trim(), '')
    setCreateTitle('')
    setShowCreate(false)
    navigate(`/host/games/${id}`)
  }

  const handleDuplicate = (gameId: string, gameTitle: string) => {
    const newId = duplicateGame(gameId)
    if (newId) toast.success('Duplicated', `"${gameTitle} (copy)" is ready to edit.`)
  }

  const handleStartRoom = async (gameId: string) => {
    setStartingRoom(gameId)
    try {
      const sessionId = await createSession(gameId)
      if (!sessionId) { toast.error('Failed to start room', 'Try again.'); return }
      navigate(`/host/sessions/${sessionId}`)
    } finally {
      setStartingRoom(null)
    }
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-hi">My Games</h1>
          <p className="mt-0.5 text-sm text-dim">
            {state.games.length} question set{state.games.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu
            trigger={
              <button className="button-ghost flex items-center gap-2 rounded-xl border border-edge px-3 py-2 text-xs text-lo hover:text-md">
                <SortAsc className="size-3.5" />
                {SORT_LABELS[sortKey]}
              </button>
            }
            align="right"
          >
            {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([key, label]) => (
              <DropdownItem key={key} onClick={() => setSortKey(key)}>
                {label}
                {sortKey === key && <span className="ml-auto text-accent-text">✓</span>}
              </DropdownItem>
            ))}
          </DropdownMenu>
          <button onClick={() => setShowCreate(true)} className="button-primary">
            <Plus className="size-4" />
            New game
          </button>
        </div>
      </div>

      {/* ── Tag filter ── */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Tag className="size-3.5 text-faded" />
          <button
            className={`rounded-full px-3 py-1 text-xs transition ${!activeTag ? 'bg-accent-dim text-accent-text' : 'bg-fill-hi text-dim hover:text-md'}`}
            onClick={() => setActiveTag(null)}
          >All</button>
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`rounded-full px-3 py-1 text-xs transition ${activeTag === tag ? 'bg-accent-dim text-accent-text' : 'bg-fill-hi text-dim hover:text-md'}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >{tag}</button>
          ))}
        </div>
      )}

      {/* ── Game grid ── */}
      {filteredGames.length === 0 ? (
        searchQuery ? (
          <div className="panel flex items-center justify-center py-14 text-dim">
            <div className="text-center">
              <Lightbulb className="mx-auto mb-3 size-8 opacity-30" />
              <p className="text-sm">No games match "{searchQuery}"</p>
            </div>
          </div>
        ) : (
          <NoGamesEmpty onCreateGame={() => setShowCreate(true)} />
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredGames.map((game) => {
            const hasQuestions = game.questions.length > 0
            const isStarting   = startingRoom === game.id
            const grad = coverGradient(game.id)

            return (
              <div
                key={game.id}
                className="group panel flex flex-col overflow-hidden p-0 transition hover:border-rim"
              >
                {/* Cover thumbnail */}
                <button
                  onClick={() => navigate(`/host/games/${game.id}`)}
                  className={`relative flex h-28 w-full items-center justify-center bg-gradient-to-br ${grad} transition group-hover:brightness-110`}
                >
                  <BookOpen className="size-8 text-md" />
                  <span className="absolute bottom-2 right-2.5 rounded-lg bg-[var(--overlay-sm)] px-2 py-0.5 text-[10px] text-md backdrop-blur-sm">
                    {game.questions.length}q
                  </span>
                </button>

                {/* Info */}
                <div className="flex flex-1 flex-col gap-1 p-3">
                  <button
                    onClick={() => navigate(`/host/games/${game.id}`)}
                    className="line-clamp-2 text-left text-sm font-semibold leading-snug text-md hover:text-hi transition"
                  >
                    {game.title}
                  </button>
                  <p className="text-[11px] text-faded">
                    {formatDate(game.updatedAt ?? game.createdAt ?? '')}
                  </p>

                  {/* Card actions */}
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <Tooltip content={hasQuestions ? 'Start a live room' : 'Add questions first'} side="top">
                      <button
                        className="button-primary h-7 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={!hasQuestions || isStarting}
                        onClick={() => handleStartRoom(game.id)}
                      >
                        <Play className="size-3" />
                        {isStarting ? 'Starting…' : 'Start'}
                      </button>
                    </Tooltip>

                    <DropdownMenu
                      trigger={
                        <button aria-label="More options" className="flex size-7 items-center justify-center rounded-lg bg-fill-lo text-lo transition hover:bg-fill-hi hover:text-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:outline-offset-1">
                          <MoreHorizontal className="size-4" />
                        </button>
                      }
                      align="right"
                    >
                      <DropdownItem icon={<Edit3 />} onClick={() => navigate(`/host/games/${game.id}`)}>Edit</DropdownItem>
                      <DropdownItem icon={<Copy />} onClick={() => handleDuplicate(game.id, game.title)}>Duplicate</DropdownItem>
                      <DropdownItem icon={<Play />} onClick={() => handleStartRoom(game.id)} disabled={!hasQuestions}>Start room</DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem icon={<Trash2 />} variant="danger" onClick={() => setDeleteTarget({ id: game.id, title: game.title })}>Delete</DropdownItem>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Create modal ── */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); setCreateTitle('') }}
        title="New question set"
        size="sm"
      >
        <form onSubmit={handleCreate} className="mt-4 space-y-4">
          <input
            className="input w-full"
            placeholder="e.g. Office Trivia, Team Quiz…"
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            autoFocus
            required
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="button-ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button type="submit" className="button-primary" disabled={!createTitle.trim()}>
              Create & Edit
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete confirm ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => { if (!deleteLoading) setDeleteTarget(null) }}
        onConfirm={async () => {
          if (!deleteTarget) return
          setDeleteLoading(true)
          deleteGame(deleteTarget.id)
          toast.success('Deleted', `"${deleteTarget.title}" removed.`)
          setDeleteLoading(false)
          setDeleteTarget(null)
        }}
        title="Delete this game?"
        description={`"${deleteTarget?.title}" and all its questions will be permanently deleted.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  )
}
