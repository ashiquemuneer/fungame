import clsx, { type ClassValue } from 'clsx'

export function cn(...values: ClassValue[]) {
  return clsx(values)
}

export function formatDate(value?: string) {
  if (!value) {
    return 'Not started'
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

const COVER_GRADIENTS = [
  'from-violet-500/30 to-purple-700/20',
  'from-sky-500/30 to-blue-700/20',
  'from-emerald-500/30 to-teal-700/20',
  'from-orange-500/30 to-amber-700/20',
  'from-rose-500/30 to-pink-700/20',
  'from-cyan-500/30 to-blue-600/20',
  'from-fuchsia-500/30 to-violet-700/20',
  'from-lime-500/30 to-green-700/20',
]

export function coverGradient(id: string): string {
  const hash = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return COVER_GRADIENTS[hash % COVER_GRADIENTS.length]
}

export function slugifyRoomCode(seed: string) {
  return seed
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 6)
}
