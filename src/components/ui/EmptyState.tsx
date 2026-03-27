import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  /** 'page' fills available space; 'inline' is compact for use inside cards */
  size?: 'page' | 'inline'
  className?: string
}

export function EmptyState({ icon, title, description, action, size = 'page', className = '' }: EmptyStateProps) {
  const isPage = size === 'page'

  return (
    <div className={`flex flex-col items-center justify-center text-center ${isPage ? 'py-20 px-6' : 'py-10 px-4'} ${className}`}>
      {icon && (
        <div className={`mb-4 rounded-3xl border border-line bg-fill p-4 text-dim ${isPage ? 'size-16' : 'size-12'} flex items-center justify-center`}>
          <span className={isPage ? '[&>svg]:size-7' : '[&>svg]:size-5'}>{icon}</span>
        </div>
      )}

      <h3 className={`font-semibold text-lo ${isPage ? 'text-base' : 'text-sm'}`}>
        {title}
      </h3>

      {description && (
        <p className={`mt-1.5 max-w-xs text-lo ${isPage ? 'text-sm' : 'text-xs'}`}>
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

// ─── Common empty states used across the app ─────────────────────────────────

import { LayoutDashboard, RadioTower, Users, MessageSquare } from 'lucide-react'

export function NoGamesEmpty({ onCreateGame }: { onCreateGame?: () => void }) {
  return (
    <EmptyState
      icon={<LayoutDashboard />}
      title="No question sets yet"
      description="Create your first game to get started. You can add questions after."
      action={
        onCreateGame ? (
          <button className="button-primary text-sm" onClick={onCreateGame}>
            + Create game
          </button>
        ) : undefined
      }
    />
  )
}

export function NoQuestionsEmpty({ onAddQuestion }: { onAddQuestion?: () => void }) {
  return (
    <EmptyState
      icon={<MessageSquare />}
      title="No questions yet"
      description="Add your first question to start building this game."
      action={
        onAddQuestion ? (
          <button className="button-primary text-sm" onClick={onAddQuestion}>
            + Add first question
          </button>
        ) : undefined
      }
    />
  )
}

export function NoSessionsEmpty() {
  return (
    <EmptyState
      icon={<RadioTower />}
      title="No rooms yet"
      description="Start a room from any game in your question library."
    />
  )
}

export function NoPlayersEmpty() {
  return (
    <EmptyState
      size="inline"
      icon={<Users />}
      title="No players yet"
      description="Share the room code or QR so players can join."
    />
  )
}
