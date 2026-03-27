import { useState, useRef, useEffect } from 'react'
import { Button }        from '../components/ui/Button'
import { Badge }         from '../components/ui/Badge'
import { Input, Textarea, SearchInput } from '../components/ui/Input'
import { Panel }         from '../components/ui/Panel'
import { Spinner }       from '../components/ui/Spinner'
import { AlertBanner }   from '../components/ui/AlertBanner'
import { Modal }         from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Tooltip }       from '../components/ui/Tooltip'
import { DropdownMenu, DropdownItem, DropdownSeparator } from '../components/ui/DropdownMenu'
import { useToast }      from '../components/ui/Toast'
import { useTheme }      from '../state/theme'
import {
  Check, X, Zap, Mail, Lock, Sun, Moon,
  Trash2, Edit2, Copy, MoreHorizontal,
  ChevronRight, Gamepad2,
} from 'lucide-react'

/* ─── Nav ────────────────────────────────────────────────────── */

const NAV = [
  { id: 'color',       label: 'Color'           },
  { id: 'typography',  label: 'Typography'      },
  { id: 'foundations', label: 'Foundations'     },
  { id: 'components',  label: 'Components'      },
  { id: 'tokens',      label: 'Token Reference' },
]

/* ─── Helpers ────────────────────────────────────────────────── */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="border-b border-line pb-14 pt-12 first:pt-0" style={{ scrollMarginTop: 'var(--ds-header-h, 80px)' }}>
      <h2 className="mb-8 text-[10px] font-bold uppercase tracking-[0.22em] text-accent-text">{title}</h2>
      {children}
    </section>
  )
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="mb-4 text-sm font-semibold text-hi">{title}</h3>
      {children}
    </div>
  )
}

function Cap({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-[11px] text-faded">{children}</p>
}

function Swatch({ variable, label }: { variable: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-10 w-full rounded-xl border border-line" style={{ background: `var(${variable})` }} />
      <p className="text-[11px] font-medium text-md leading-tight">{label}</p>
      <p className="font-mono text-[10px] text-faded">{variable}</p>
    </div>
  )
}

function Table({ headers, rows }: {
  headers: string[]
  rows: (string | React.ReactNode)[][]
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-line bg-raised">
            {headers.map(h => (
              <th key={h} className="px-4 py-2.5 text-left font-semibold text-subtle">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={`border-b border-line last:border-0 ${i % 2 === 0 ? 'bg-page' : 'bg-raised'}`}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2.5 text-lo">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── Page ───────────────────────────────────────────────────── */

export function DesignSystemPage() {
  const [inputVal,    setInputVal]    = useState('')
  const [searchVal,   setSearchVal]   = useState('')
  const [tokenQ,      setTokenQ]      = useState('')
  const [showInfo,    setShowInfo]    = useState(true)
  const [modalOpen,   setModalOpen]   = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [typoTab,     setTypoTab]     = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const { theme, setTheme } = useTheme()
  const toast = useToast()
  const isLight = theme === 'light'

  // Measure the sticky header height so the tab bar sticks just below it
  const headerRef = useRef<HTMLDivElement>(null)
  const [headerH, setHeaderH] = useState(73)
  useEffect(() => {
    const el = headerRef.current
    if (!el) return
    setHeaderH(el.offsetHeight)
    const ro = new ResizeObserver(() => setHeaderH(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="flex min-h-screen bg-page">

      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen w-44 shrink-0 overflow-y-auto border-r border-line bg-surface py-6 lg:block">
        <div className="px-5 pb-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-text">FunGame</p>
          <p className="mt-0.5 text-sm font-semibold text-hi">Design System</p>
        </div>
        <div className="px-3">
          {NAV.map(l => (
            <button
              key={l.id}
              onClick={() => {
                const el = document.getElementById(l.id)
                if (!el) return
                const y = el.getBoundingClientRect().top + window.scrollY - headerH - 24
                window.scrollTo({ top: y, behavior: 'smooth' })
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-lo transition hover:bg-raised hover:text-hi"
            >
              <ChevronRight className="size-3 shrink-0 text-faded" />
              {l.label}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Header */}
        <div ref={headerRef} className="sticky top-0 z-20 border-b border-line bg-surface/80 backdrop-blur-md">
          <div className="flex items-center justify-between px-8 py-4">
            <div>
              <h1 className="text-lg font-semibold text-hi">Design System</h1>
              <p className="text-xs text-subtle">FunGame · Tokens, Components &amp; Patterns</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTheme(isLight ? 'dark' : 'light')}
                className="flex items-center gap-2 rounded-full border border-line bg-raised px-3 py-1.5 text-xs font-medium text-lo transition hover:text-hi"
              >
                {isLight ? <Moon className="size-3.5" /> : <Sun className="size-3.5" />}
                {isLight ? 'Dark' : 'Light'}
              </button>
              <Badge variant="brand" size="sm">v1.0</Badge>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-8 py-12" style={{ '--ds-header-h': `${headerH + 8}px` } as React.CSSProperties}>

          {/* ══ 1 · COLOR ══════════════════════════════════════ */}
          <Section id="color" title="Color">

            <Sub title="Backgrounds & Surfaces">
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
                <Swatch variable="--background"          label="page" />
                <Swatch variable="--background-variant"  label="variant" />
                <Swatch variable="--background-elevated" label="elevated" />
                <Swatch variable="--surface"             label="surface" />
                <Swatch variable="--surface-raised"      label="raised" />
                <Swatch variable="--surface-overlay"     label="overlay" />
              </div>
            </Sub>

            <Sub title="Brand / Accent">
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                <Swatch variable="--accent"           label="accent" />
                <Swatch variable="--accent-hover"     label="hover" />
                <Swatch variable="--accent-active"    label="active" />
                <Swatch variable="--accent-container" label="container" />
                <Swatch variable="--accent-muted"     label="muted" />
              </div>
            </Sub>

            <Sub title="Status">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Swatch variable="--success" label="success" />
                <Swatch variable="--danger"  label="danger" />
                <Swatch variable="--warning" label="warning" />
                <Swatch variable="--info"    label="info" />
              </div>
            </Sub>

            <Sub title="Text Hierarchy">
              <div className="flex flex-col gap-2">
                {([
                  ['--text-primary',    'Primary — main content'],
                  ['--text-secondary',  'Secondary — supporting'],
                  ['--text-tertiary',   'Tertiary — labels, captions'],
                  ['--text-quaternary', 'Quaternary — hints, placeholders'],
                  ['--text-disabled',   'Disabled — inactive'],
                ] as const).map(([v, label], i) => (
                  <div key={v} className={`flex items-center gap-4 rounded-xl border border-line px-4 py-3 ${i % 2 === 0 ? 'bg-page' : 'bg-raised'}`}>
                    <div className="size-3 shrink-0 rounded-full border border-line" style={{ background: `var(${v})` }} />
                    <span className="w-40 shrink-0 font-mono text-[10px] text-faded">{v}</span>
                    <span className="text-xs" style={{ color: `var(${v})` }}>{label}</span>
                  </div>
                ))}
              </div>
            </Sub>
          </Section>

          {/* ══ 2 · TYPOGRAPHY ═════════════════════════════════ */}
          <Section id="typography" title="Typography">

            <Sub title="Font Families">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { token: '--font-body',    name: 'IBM Plex Sans', cls: '',                                         use: 'UI text, labels, buttons' },
                  { token: '--font-heading', name: 'Sora',          cls: 'font-[family-name:var(--font-heading)]',   use: 'Hero headings, slide questions' },
                  { token: '--font-code',    name: 'IBM Plex Mono', cls: 'font-mono',                                use: 'Room codes, token values' },
                ].map(f => (
                  <Panel key={f.token} className="p-4">
                    <p className="mb-1 font-mono text-[10px] text-faded">{f.token}</p>
                    <p className={`text-xl font-semibold text-hi leading-tight ${f.cls}`}>{f.name}</p>
                    <p className="mt-2 text-[11px] text-lo">{f.use}</p>
                  </Panel>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-faded">
                No <code className="font-mono">font-heading</code> Tailwind class — use <code className="font-mono">font-[family-name:var(--font-heading)]</code> or inline style.
              </p>
            </Sub>

            <Sub title="Type Scale">
              <div className="overflow-hidden rounded-xl border border-line">
                {[
                  { cls: 'text-xs',   size: '12px',  sample: 'The quick brown fox jumps over the lazy dog' },
                  { cls: 'text-sm',   size: '13.5px', sample: 'The quick brown fox jumps over the lazy dog' },
                  { cls: 'text-base', size: '16px',  sample: 'The quick brown fox jumps over the lazy dog' },
                  { cls: 'text-lg',   size: '18px',  sample: 'The quick brown fox jumps' },
                  { cls: 'text-xl',   size: '20px',  sample: 'The quick brown fox jumps' },
                  { cls: 'text-2xl',  size: '24px',  sample: 'Select the correct answer' },
                  { cls: 'text-3xl',  size: '30px',  sample: 'FUNGAME' },
                  { cls: 'text-4xl',  size: '36px',  sample: '92%' },
                  { cls: 'text-5xl',  size: '48px',  sample: '42' },
                  { cls: 'text-6xl',  size: '60px',  sample: '9' },
                  { cls: 'text-7xl',  size: '72px',  sample: '7' },
                ].map((row, i) => (
                  <div key={row.cls} className={`flex items-baseline gap-4 border-b border-line px-4 py-3 last:border-0 ${i % 2 === 0 ? 'bg-page' : 'bg-raised'}`}>
                    <div className="w-28 shrink-0">
                      <p className="font-mono text-[10px] font-bold text-accent-text">{row.cls}</p>
                      <p className="font-mono text-[9px] text-faded">{row.size}</p>
                    </div>
                    <p className={`${row.cls} text-hi leading-none`}>{row.sample}</p>
                  </div>
                ))}
              </div>
            </Sub>

            <Sub title="Responsive Scale">
              {(() => {
                type TypoBreakpoint = { cls: string; inlineSize?: string; label: string }
                type TypoItem = {
                  context: string
                  sample: string
                  fontCls: string
                  fontName: string
                  colorCls: string
                  colorToken: string
                  weight: string
                  wt: string       // human-readable weight e.g. "600"
                  lh: string       // line-height e.g. "1.25"
                  ls: string       // letter-spacing e.g. "0.35em"
                  extra?: string
                  mobile: TypoBreakpoint
                  tablet: TypoBreakpoint
                  desktop: TypoBreakpoint
                }

                const ITEMS: TypoItem[] = [
                  // ── 6rem · 96px ─────────────────────────────────
                  {
                    context: 'Emoji prompt (all screens)',
                    sample: '🌍',
                    fontCls: '',
                    fontName: 'system emoji',
                    colorCls: '',
                    colorToken: '—',
                    weight: '', wt: '400', lh: '1.1', ls: '—',
                    mobile:  { cls: '', inlineSize: '4rem', label: '4rem · 64px' },
                    tablet:  { cls: '', inlineSize: '5rem', label: '5rem · 80px' },
                    desktop: { cls: '', inlineSize: '6rem', label: '6rem · 96px' },
                  },
                  // ── text-6xl · 60px ─────────────────────────────
                  {
                    context: 'Landing hero h1',
                    sample: 'Create quizzes your team will love',
                    fontCls: 'font-[family-name:var(--font-heading)]',
                    fontName: 'Sora',
                    colorCls: 'text-hi',
                    colorToken: 'text-hi',
                    weight: 'font-semibold',
                    extra: 'leading-[1.15] tracking-tight',
                    wt: '600', lh: '1.15', ls: '−0.025em',
                    mobile:  { cls: 'text-5xl', label: 'text-5xl · 48px' },
                    tablet:  { cls: 'text-6xl', label: 'text-6xl · 60px' },
                    desktop: { cls: 'text-7xl', label: 'text-7xl · 72px' },
                  },
                  {
                    context: 'Slide heading — Open / Info (big text)',
                    sample: 'Name a country in South America',
                    fontCls: 'font-[family-name:var(--font-heading)]',
                    fontName: 'Sora',
                    colorCls: 'text-hi',
                    colorToken: 'text-hi / text-white',
                    weight: 'font-semibold',
                    extra: 'leading-tight',
                    wt: '600', lh: '1.25', ls: '—',
                    mobile:  { cls: 'text-4xl', label: 'text-4xl · 36px' },
                    tablet:  { cls: 'text-5xl', label: 'text-5xl · 48px' },
                    desktop: { cls: 'text-6xl', label: 'text-6xl · 60px' },
                  },
                  // ── text-5xl · 48px ─────────────────────────────
                  {
                    context: 'Slide heading — MCQ / Poll / True-False',
                    sample: 'Which planet is closest to the Sun?',
                    fontCls: 'font-[family-name:var(--font-heading)]',
                    fontName: 'Sora',
                    colorCls: 'text-hi',
                    colorToken: 'text-hi',
                    weight: 'font-semibold',
                    extra: 'leading-tight',
                    wt: '600', lh: '1.25', ls: '—',
                    mobile:  { cls: 'text-3xl', label: 'text-3xl · 30px' },
                    tablet:  { cls: 'text-4xl', label: 'text-4xl · 36px' },
                    desktop: { cls: 'text-5xl', label: 'text-5xl · 48px' },
                  },
                  // ── text-3xl · 30px ─────────────────────────────
                  {
                    context: 'Editor draft preview heading',
                    sample: 'What is the capital of France?',
                    fontCls: 'font-[family-name:var(--font-heading)]',
                    fontName: 'Sora',
                    colorCls: 'text-hi',
                    colorToken: 'text-hi',
                    weight: 'font-semibold',
                    extra: 'leading-tight',
                    wt: '600', lh: '1.25', ls: '—',
                    mobile:  { cls: 'text-xl',  label: 'text-xl · 20px' },
                    tablet:  { cls: 'text-2xl', label: 'text-2xl · 24px' },
                    desktop: { cls: 'text-3xl', label: 'text-3xl · 30px' },
                  },
                  // ── text-2xl · 24px ─────────────────────────────
                  {
                    context: 'Auth heading h2',
                    sample: 'Sign in to your account',
                    fontCls: '',
                    fontName: 'IBM Plex Sans',
                    colorCls: 'text-hi',
                    colorToken: 'text-hi',
                    weight: 'font-semibold',
                    wt: '600', lh: 'normal', ls: '—',
                    mobile:  { cls: 'text-2xl', label: 'text-2xl · 24px' },
                    tablet:  { cls: 'text-2xl', label: 'text-2xl · 24px' },
                    desktop: { cls: 'text-2xl', label: 'text-2xl · 24px' },
                  },
                  {
                    context: 'Slide description / body copy',
                    sample: 'Pick the answer you think is correct. You have 20 seconds.',
                    fontCls: '',
                    fontName: 'IBM Plex Sans',
                    colorCls: 'text-md',
                    colorToken: 'text-md',
                    weight: '',
                    extra: 'leading-8',
                    wt: '400', lh: '2rem', ls: '—',
                    mobile:  { cls: 'text-lg',  label: 'text-lg · 18px' },
                    tablet:  { cls: 'text-xl',  label: 'text-xl · 20px' },
                    desktop: { cls: 'text-2xl', label: 'text-2xl · 24px' },
                  },
                  // ── text-xl · 20px ──────────────────────────────
                  {
                    context: 'Page section heading h1',
                    sample: 'My Games',
                    fontCls: '',
                    fontName: 'IBM Plex Sans',
                    colorCls: 'text-hi',
                    colorToken: 'text-hi',
                    weight: 'font-semibold',
                    wt: '600', lh: 'normal', ls: '—',
                    mobile:  { cls: 'text-xl', label: 'text-xl · 20px' },
                    tablet:  { cls: 'text-xl', label: 'text-xl · 20px' },
                    desktop: { cls: 'text-xl', label: 'text-xl · 20px' },
                  },
                  // ── text-lg · 18px ──────────────────────────────
                  {
                    context: 'Answer option card text',
                    sample: 'Mercury',
                    fontCls: '',
                    fontName: 'IBM Plex Sans',
                    colorCls: 'text-hi',
                    colorToken: 'text-hi',
                    weight: '',
                    wt: '400', lh: 'normal', ls: '—',
                    mobile:  { cls: 'text-base', label: 'text-base · 16px' },
                    tablet:  { cls: 'text-lg',   label: 'text-lg · 18px' },
                    desktop: { cls: 'text-lg',   label: 'text-lg · 18px' },
                  },
                  // ── text-sm · 13.5px ────────────────────────────
                  {
                    context: 'Body / UI text',
                    sample: 'You have 12 questions across 3 categories ready to play.',
                    fontCls: '',
                    fontName: 'IBM Plex Sans',
                    colorCls: 'text-lo',
                    colorToken: 'text-lo / text-md',
                    weight: '',
                    wt: '400', lh: 'normal', ls: '—',
                    mobile:  { cls: 'text-sm', label: 'text-sm · 13.5px' },
                    tablet:  { cls: 'text-sm', label: 'text-sm · 13.5px' },
                    desktop: { cls: 'text-sm', label: 'text-sm · 13.5px' },
                  },
                  {
                    context: 'Room codes, token values',
                    sample: 'XKQT-4829',
                    fontCls: 'font-mono',
                    fontName: 'IBM Plex Mono',
                    colorCls: 'text-hi',
                    colorToken: 'text-hi',
                    weight: 'font-semibold',
                    wt: '600', lh: 'normal', ls: '—',
                    mobile:  { cls: 'text-sm', label: 'text-sm · 13.5px' },
                    tablet:  { cls: 'text-sm', label: 'text-sm · 13.5px' },
                    desktop: { cls: 'text-sm', label: 'text-sm · 13.5px' },
                  },
                  // ── text-xs · 12px ──────────────────────────────
                  {
                    context: 'Labels, hints, captions',
                    sample: 'Last edited 2 hours ago',
                    fontCls: '',
                    fontName: 'IBM Plex Sans',
                    colorCls: 'text-faded',
                    colorToken: 'text-dim / text-faded',
                    weight: '',
                    wt: '400', lh: 'normal', ls: '—',
                    mobile:  { cls: 'text-xs', label: 'text-xs · 12px' },
                    tablet:  { cls: 'text-xs', label: 'text-xs · 12px' },
                    desktop: { cls: 'text-xs', label: 'text-xs · 12px' },
                  },
                  {
                    context: 'Form field labels',
                    sample: 'EMAIL ADDRESS',
                    fontCls: '',
                    fontName: 'IBM Plex Sans',
                    colorCls: 'text-lo',
                    colorToken: 'text-lo',
                    weight: 'font-medium',
                    extra: 'uppercase tracking-[0.12em]',
                    wt: '500', lh: 'normal', ls: '0.12em',
                    mobile:  { cls: 'text-xs', label: 'text-xs · 12px' },
                    tablet:  { cls: 'text-xs', label: 'text-xs · 12px' },
                    desktop: { cls: 'text-xs', label: 'text-xs · 12px' },
                  },
                  {
                    context: 'Slide label chip (question counter)',
                    sample: 'QUESTION 4 OF 10',
                    fontCls: '',
                    fontName: 'IBM Plex Sans',
                    colorCls: 'text-accent-text',
                    colorToken: 'text-accent-text',
                    weight: 'font-medium',
                    extra: 'uppercase tracking-[0.22em]',
                    wt: '500', lh: 'normal', ls: '0.22em',
                    mobile:  { cls: 'text-xs', label: 'text-xs · 12px' },
                    tablet:  { cls: 'text-xs', label: 'text-xs · 12px' },
                    desktop: { cls: 'text-xs', label: 'text-xs · 12px' },
                  },
                ]

                const tabs = [
                  { key: 'desktop' as const, label: 'Desktop', sub: 'xl ≥ 1280px' },
                  { key: 'tablet'  as const, label: 'Tablet',  sub: 'sm ≥ 640px'  },
                  { key: 'mobile'  as const, label: 'Mobile',  sub: '< 640px'     },
                ]

                return (
                  <div>
                    {/* Tab bar */}
                    <div className="sticky z-10 mb-4 pb-1 pt-1 -mx-1 px-1" style={{ top: headerH, background: 'var(--background)' }}>
                    <div className="flex items-center gap-1 rounded-xl border border-line bg-raised p-1">
                      {tabs.map(t => (
                        <button
                          key={t.key}
                          onClick={() => setTypoTab(t.key)}
                          className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg px-3 py-2 transition ${
                            typoTab === t.key
                              ? 'bg-accent text-on-accent shadow-sm'
                              : 'text-lo hover:bg-fill hover:text-hi'
                          }`}
                        >
                          <span className="text-xs font-semibold">{t.label}</span>
                          <span className={`font-mono text-[9px] ${typoTab === t.key ? 'text-on-accent/70' : 'text-faded'}`}>{t.sub}</span>
                        </button>
                      ))}
                    </div>
                    </div>

                    {/* Column headers */}
                    <div className="mb-1 grid grid-cols-[28px_1fr_140px_100px] items-center gap-4 px-4">
                      <span />
                      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-subtle">Sample</p>
                      <p className="text-right text-[9px] font-semibold uppercase tracking-[0.18em] text-subtle">Size · Font · Color</p>
                      <p className="text-right text-[9px] font-semibold uppercase tracking-[0.18em] text-subtle">Wt · LH · LS</p>
                    </div>

                    {/* Type rows */}
                    <div className="space-y-0.5">
                      {ITEMS.map((item, i) => {
                        const bp = item[typoTab]
                        const textCls = [item.fontCls, item.colorCls, item.weight, item.extra ?? '', bp.cls].filter(Boolean).join(' ')
                        const inlineStyle = bp.inlineSize ? { fontSize: bp.inlineSize, lineHeight: 1.1 } : undefined
                        return (
                          <div
                            key={i}
                            className="group grid grid-cols-[28px_1fr_140px_100px] items-center gap-4 rounded-xl border border-transparent px-4 py-3.5 transition hover:border-line hover:bg-raised"
                          >
                            {/* Index */}
                            <div className="flex size-[22px] shrink-0 items-center justify-center rounded-md bg-fill">
                              <span className="font-mono text-[9px] font-semibold text-faded">{i + 1}</span>
                            </div>

                            {/* Sample text */}
                            <div className="min-w-0">
                              <p className={`${textCls} break-words`} style={inlineStyle}>
                                {item.sample}
                              </p>
                              <p className="mt-1 text-[9px] text-subtle opacity-0 transition group-hover:opacity-100">{item.context}</p>
                            </div>

                            {/* Size · Font · Color */}
                            <div className="shrink-0 text-right">
                              <p className="font-mono text-[10px] font-bold text-accent-text">{bp.label}</p>
                              <p className="mt-0.5 text-[9px] text-faded">{item.fontName}</p>
                              <p className="font-mono text-[9px] text-faded">{item.colorToken}</p>
                            </div>

                            {/* Weight · Line-height · Letter-spacing */}
                            <div className="shrink-0 text-right">
                              <div className="inline-flex flex-col gap-0.5">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="text-[8px] uppercase tracking-[0.12em] text-subtle">wt</span>
                                  <span className="font-mono text-[10px] font-semibold text-hi">{item.wt}</span>
                                </div>
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="text-[8px] uppercase tracking-[0.12em] text-subtle">lh</span>
                                  <span className="font-mono text-[10px] text-md">{item.lh}</span>
                                </div>
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="text-[8px] uppercase tracking-[0.12em] text-subtle">ls</span>
                                  <span className="font-mono text-[10px] text-md">{item.ls}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}
            </Sub>
          </Section>

          {/* ══ 3 · FOUNDATIONS ════════════════════════════════ */}
          <Section id="foundations" title="Foundations">

            <Sub title="Shadows">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {([
                  ['--shadow-sm', 'sm'],
                  ['--shadow-md', 'md'],
                  ['--shadow-lg', 'lg'],
                  ['--shadow-xl', 'xl'],
                ] as const).map(([token, label]) => (
                  <div key={label}
                    className="flex h-16 items-center justify-center rounded-2xl bg-raised"
                    style={{ boxShadow: `var(${token})` }}>
                    <p className="font-mono text-[10px] text-lo">{label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-faded">Apply with <code className="font-mono">shadow-[var(--shadow-xl)]</code> — values shift automatically in light mode.</p>
            </Sub>

            <Sub title="Border Radius">
              <Table
                headers={['Class', 'Value', 'Used for']}
                rows={[
                  [<code>rounded-lg</code>,          '8px',   'Nav items, small elements'],
                  [<code>rounded-xl</code>,           '12px',  'Toasts, small cards'],
                  [<code>rounded-2xl</code>,          '16px',  'Inputs, dropdowns'],
                  [<code>rounded-3xl</code>,          '24px',  'Panels, modals'],
                  [<code>rounded-[2rem]</code>,       '32px',  'Slide surface, preview pane'],
                  [<code>rounded-full</code>,         '9999px','Buttons, badges, chips'],
                ]}
              />
            </Sub>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <Sub title="Z-Index Layers">
                <Table
                  headers={['z-index', 'Used for']}
                  rows={[
                    [<b className="font-mono text-accent-text">0</b>,    'Normal content'],
                    [<b className="font-mono text-accent-text">10</b>,   'Sticky headers'],
                    [<b className="font-mono text-accent-text">50</b>,   'Dropdowns, popovers'],
                    [<b className="font-mono text-accent-text">100</b>,  'Modal backdrops'],
                    [<b className="font-mono text-accent-text">200</b>,  'Modal dialogs'],
                    [<b className="font-mono text-accent-text">9999</b>, 'Toasts'],
                  ]}
                />
              </Sub>

              <Sub title="Motion">
                <Table
                  headers={['Token', 'Value']}
                  rows={[
                    [<code>--transition-fast</code>,    'all 0.12s ease'],
                    [<code>--transition-default</code>, 'all 0.15s ease'],
                    [<code>--transition-slow</code>,    'all 0.2s ease-out'],
                    [<code>--duration-smooth</code>,    '0.3s'],
                  ]}
                />
              </Sub>
            </div>
          </Section>

          {/* ══ 4 · COMPONENTS ═════════════════════════════════ */}
          <Section id="components" title="Components">

            {/* Button */}
            <Sub title="Button">
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="danger">Danger</Button>
                  </div>
                  <Cap>variant — primary · secondary · ghost · danger</Cap>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="primary" icon={<Zap className="size-4" />}>With icon</Button>
                    <Button variant="primary" loading>Loading</Button>
                    <Button variant="primary" disabled>Disabled</Button>
                  </div>
                  <Cap>icon · loading · disabled props</Cap>
                </div>
                <div>
                  <div className="flex flex-wrap items-end gap-3">
                    <Button variant="primary" size="sm">Small</Button>
                    <Button variant="primary" size="md">Medium</Button>
                    <Button variant="primary" size="lg">Large</Button>
                  </div>
                  <Cap>size — sm · md · lg</Cap>
                </div>
              </div>
            </Sub>

            {/* Badge */}
            <Sub title="Badge">
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="brand">Brand</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="danger">Danger</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="info">Info</Badge>
                    <Badge variant="default">Default</Badge>
                  </div>
                  <Cap>variant — brand · success · danger · warning · info · default</Cap>
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="brand"   size="sm" dot>Live</Badge>
                    <Badge variant="success" size="sm" dot>Published</Badge>
                    <Badge variant="warning" size="sm" dot>Paused</Badge>
                    <Badge variant="default" size="sm">Draft</Badge>
                  </div>
                  <Cap>size="sm" + dot prop</Cap>
                </div>
              </div>
            </Sub>

            {/* Inputs */}
            <Sub title="Input / Textarea / SearchInput">
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Input label="Default" placeholder="Enter title…" value={inputVal} onChange={e => setInputVal(e.target.value)} />
                </div>
                <div>
                  <Input label="With icon" placeholder="you@example.com" icon={<Mail className="size-4" />} />
                </div>
                <div>
                  <Input label="Error" placeholder="Search…" icon={<Lock className="size-4" />} error="Invalid value" />
                </div>
                <div>
                  <Input label="Disabled" placeholder="Can't edit" disabled />
                </div>
              </div>
              <div className="mb-4">
                <Textarea label="Textarea" placeholder="Describe your game…" hint="Optional" />
              </div>
              <SearchInput
                placeholder="Search games…"
                value={searchVal}
                onChange={e => setSearchVal(e.target.value)}
                onClear={() => setSearchVal('')}
              />
              <Cap>SearchInput — clear button appears when value is non-empty</Cap>
            </Sub>

            {/* Panel */}
            <Sub title="Panel">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Panel className="p-5">
                  <p className="mb-1 text-sm font-medium text-hi">Default</p>
                  <p className="text-xs text-lo leading-relaxed">Surface-level card — rounded-3xl, border, bg-surface, backdrop-blur.</p>
                </Panel>
                <Panel className="p-5 border-[var(--success-outline)] bg-[var(--success-container)]">
                  <div className="flex items-start gap-3">
                    <Check className="mt-0.5 size-4 shrink-0 text-[var(--success-foreground)]" />
                    <div>
                      <p className="mb-1 text-sm font-medium text-hi">Success variant</p>
                      <p className="text-xs text-lo">Override border + bg with status tokens.</p>
                    </div>
                  </div>
                </Panel>
              </div>
            </Sub>

            {/* AlertBanner */}
            <Sub title="AlertBanner">
              <div className="flex flex-col gap-2">
                {showInfo && (
                  <AlertBanner variant="info">
                    <div className="flex items-center justify-between gap-3">
                      <span>Unsaved changes — saved automatically.</span>
                      <button onClick={() => setShowInfo(false)} className="shrink-0 opacity-60 hover:opacity-100"><X className="size-4" /></button>
                    </div>
                  </AlertBanner>
                )}
                {!showInfo && <Button variant="ghost" size="sm" onClick={() => setShowInfo(true)}>Show info banner</Button>}
                <AlertBanner variant="success">Game saved successfully.</AlertBanner>
                <AlertBanner variant="warning">Approaching the 20-question limit.</AlertBanner>
                <AlertBanner variant="error">Failed to connect. Try again.</AlertBanner>
              </div>
              <Cap>variant — info · success · warning · error</Cap>
            </Sub>

            {/* Spinner */}
            <Sub title="Spinner">
              <div className="flex flex-wrap items-end gap-8">
                {([['sm', '16px'], ['md', '24px'], ['lg', '40px']] as const).map(([s, px]) => (
                  <div key={s} className="flex flex-col items-center gap-2">
                    <Spinner size={s} />
                    <Cap>{s} · {px}</Cap>
                  </div>
                ))}
                <div className="flex flex-col items-center gap-2">
                  <Button variant="primary" loading>Saving…</Button>
                  <Cap>Button loading</Cap>
                </div>
              </div>
            </Sub>

            {/* Modal */}
            <Sub title="Modal">
              <Button variant="secondary" onClick={() => setModalOpen(true)}>Open modal</Button>
              <Cap>Props: open · onClose · title · description · size (sm|md|lg|xl) · closeOnBackdrop. Closes on Escape.</Cap>
              <Modal open={modalOpen} onClose={() => setModalOpen(false)}
                title="Edit game title" description="Changes are saved immediately.">
                <div className="flex flex-col gap-4">
                  <Input label="Title" placeholder="Enter a new title…" />
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
                    <Button variant="primary" onClick={() => setModalOpen(false)}>Save</Button>
                  </div>
                </div>
              </Modal>
            </Sub>

            {/* ConfirmDialog */}
            <Sub title="ConfirmDialog">
              <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={() => setConfirmOpen(true)}>
                Delete game
              </Button>
              <Cap>Props: open · onClose · onConfirm · title · description · confirmLabel · cancelLabel · variant (danger|primary) · loading</Cap>
              <ConfirmDialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={() => setConfirmOpen(false)}
                title="Delete game?"
                description="This will permanently remove the game and all its questions. This cannot be undone."
                confirmLabel="Delete game"
              />
            </Sub>

            {/* Tooltip */}
            <Sub title="Tooltip">
              <div className="flex flex-wrap gap-3">
                {(['top', 'bottom', 'left', 'right'] as const).map(side => (
                  <Tooltip key={side} content={`Tooltip — ${side}`} side={side} delay={150}>
                    <Button variant="secondary" size="sm">{side}</Button>
                  </Tooltip>
                ))}
              </div>
              <Cap>Props: content · side (top|bottom|left|right) · delay (ms, default 500)</Cap>
            </Sub>

            {/* DropdownMenu */}
            <Sub title="DropdownMenu">
              <DropdownMenu
                align="left"
                trigger={
                  <Button variant="secondary" icon={<MoreHorizontal className="size-4" />}>
                    Game options
                  </Button>
                }
              >
                <DropdownItem icon={<Edit2 className="size-4" />}>Edit set</DropdownItem>
                <DropdownItem icon={<Copy className="size-4" />}>Duplicate</DropdownItem>
                <DropdownItem icon={<Gamepad2 className="size-4" />}>Start room</DropdownItem>
                <DropdownSeparator />
                <DropdownItem icon={<Trash2 className="size-4" />} variant="danger">Delete</DropdownItem>
              </DropdownMenu>
              <Cap>Props: trigger · align (left|right). DropdownItem: icon · variant (default|danger) · disabled · onClick</Cap>
            </Sub>

            {/* Toast */}
            <Sub title="Toast">
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => toast.success('Game saved', 'All questions are up to date.')}>Success</Button>
                <Button variant="secondary" size="sm" onClick={() => toast.error('Save failed', 'Check your connection.')}>Error</Button>
                <Button variant="secondary" size="sm" onClick={() => toast.warning('Almost at limit', '18 of 20 questions used.')}>Warning</Button>
                <Button variant="secondary" size="sm" onClick={() => toast.info('Player joined', 'Alex entered the lobby.')}>Info</Button>
              </div>
              <Cap>useToast() hook → success · error · warning · info · toast(). Requires ToastProvider at root.</Cap>
            </Sub>

            {/* Slide Elements */}
            <Sub title="Slide Elements">
              <div className="slide-surface rounded-[2rem] border border-edge p-5">
                {/* Glow overlays — same as QuestionSlide.tsx */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-[radial-gradient(circle_at_top,var(--slide-glow-warm),transparent_60%)]" />
                <div className="pointer-events-none absolute -right-16 top-24 h-56 w-56 rounded-full bg-note-tint blur-3xl" />
                <div className="pointer-events-none absolute -left-20 bottom-10 h-52 w-52 rounded-full bg-accent-dim blur-3xl" />

                <div className="relative">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <span className="slide-chip bg-fill-hi text-lo">Science Quiz</span>
                      <span className="slide-chip bg-accent-dim text-accent-text">Q4</span>
                    </div>
                    <span className="slide-chip bg-raised text-on-accent">Multiple choice</span>
                  </div>
                  <p className="mb-1 text-xs uppercase tracking-[0.22em] text-accent-text">Question 4 of 10</p>
                  <h2 className="mb-5 font-[family-name:var(--font-heading)] text-3xl font-semibold leading-tight text-hi">
                    Which planet is closest to the Sun?
                  </h2>
                  <div className="grid grid-cols-2 gap-2.5">
                    {['A · Venus', 'B · Mercury', 'C · Mars', 'D · Earth'].map(opt => (
                      <div key={opt} className="slide-option slide-option-interactive">{opt}</div>
                    ))}
                  </div>
                </div>
              </div>
              <Cap>.slide-surface · .slide-chip · .slide-option · .slide-option-interactive · text-hi (not text-white) · font-heading</Cap>
            </Sub>
          </Section>

          {/* ══ 5 · TOKEN REFERENCE ════════════════════════════ */}
          <Section id="tokens" title="Token Reference">

            {/* Utility classes */}
            <Sub title="Tailwind Utility Classes">
              <p className="mb-4 text-xs text-subtle">Generated by <code className="font-mono">@theme inline</code> in <code className="font-mono">index.css</code>. The <code className="font-mono">ok / err / warn / note</code> aliases map to success / danger / warning / info.</p>
              <Table
                headers={['Class', 'Maps to', 'Usage']}
                rows={[
                  // Text
                  ['text-hi',       '--text-primary',          'High-contrast text'],
                  ['text-md',       '--text-secondary',        'Medium / supporting text'],
                  ['text-lo',       '--text-tertiary',         'Low / label text'],
                  ['text-dim',      '--text-quaternary',       'Dim — hints, icon placeholders'],
                  ['text-faded',    '--text-disabled',         'Faded — disabled states'],
                  ['text-subtle',   '--text-placeholder',      'Subtle — section labels, placeholders'],
                  ['text-on-accent','--text-on-accent',        'Text on orange accent bg'],
                  ['text-accent-text','--accent-text',         'Orange brand text'],
                  // Backgrounds
                  ['bg-page',       '--background',            'Page root background'],
                  ['bg-surface',    '--surface',               'Card / panel background'],
                  ['bg-raised',     '--surface-raised',        'Raised surface (rows, dropdowns)'],
                  ['bg-fill',       '--surface-container',     'Subtle fill (slide options)'],
                  ['bg-fill-lo',    '--surface-container-low', 'Low fill'],
                  ['bg-fill-hi',    '--surface-container-high','High fill (slide chip bg)'],
                  ['bg-input-bg',   '--input-bg',              'Input field background'],
                  ['bg-accent-dim', '--accent-container',      'Tinted orange bg'],
                  ['bg-hover',      '--state-hover',           'Hover layer'],
                  ['bg-press',      '--state-press',           'Pressed layer'],
                  // Borders
                  ['border-line',   '--outline-subtle',        'Barely-visible divider'],
                  ['border-edge',   '--outline-default',       'Default border'],
                  ['border-rim',    '--outline-strong',        'Strong border (hover)'],
                  ['border-form',   '--outline-input',         'Form field border'],
                  ['border-ring',   '--outline-focus',         'Focus ring'],
                  ['border-ring-err','--outline-error',        'Error focus ring'],
                  // Status
                  ['text-ok-fg / bg-ok-tint / border-ok-line',  '--success-*', 'Success colours'],
                  ['text-err-fg / bg-err-tint / border-err-line','--danger-*',  'Danger colours'],
                  ['text-warn-fg / bg-warn-tint / border-warn-line','--warning-*','Warning colours'],
                  ['text-note-fg / bg-note-tint / border-note-line','--info-*',  'Info colours'],
                ]}
              />
            </Sub>

            {/* CSS tokens */}
            <Sub title="CSS Custom Properties">
              <div className="mb-3">
                <SearchInput
                  placeholder="Search tokens…"
                  value={tokenQ}
                  onChange={e => setTokenQ(e.target.value)}
                  onClear={() => setTokenQ('')}
                />
              </div>
              <div className="overflow-hidden rounded-xl border border-line">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-line bg-raised">
                      <th className="px-3 py-2.5 text-left font-semibold text-subtle">Token</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-subtle">Dark</th>
                      <th className="hidden px-3 py-2.5 text-left font-semibold text-subtle sm:table-cell">Light</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOKENS.filter(t =>
                      !tokenQ || t[0].toLowerCase().includes(tokenQ.toLowerCase()) || t[3].toLowerCase().includes(tokenQ.toLowerCase())
                    ).map(([token, dark, light, _use], i) => (
                      <tr key={token} className={`border-b border-line last:border-0 ${i % 2 === 0 ? 'bg-page' : 'bg-raised'}`}>
                        <td className="px-3 py-2"><code className="font-mono text-[10px] text-accent-text">{token}</code></td>
                        <td className="px-3 py-2 font-mono text-[10px] text-lo">{dark}</td>
                        <td className="hidden px-3 py-2 font-mono text-[10px] text-lo sm:table-cell">{light || <span className="text-faded">same</span>}</td>
                      </tr>
                    ))}
                    {TOKENS.filter(t =>
                      !tokenQ || t[0].toLowerCase().includes(tokenQ.toLowerCase()) || t[3].toLowerCase().includes(tokenQ.toLowerCase())
                    ).length === 0 && (
                      <tr><td colSpan={3} className="px-4 py-6 text-center text-subtle">No tokens matching "{tokenQ}"</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Sub>
          </Section>

          <p className="pb-8 text-center text-xs text-faded">
            Source: <span className="font-mono">src/tokens.css</span> · <span className="font-mono">src/index.css</span>
          </p>
        </div>
      </div>
    </div>
  )
}

/* ─── Token data — [token, dark, light, searchKeywords] ─────── */
const TOKENS: [string, string, string, string][] = [
  // Backgrounds
  ['--background',             '#09070d (ink-950)',         '#f4ede6 (cream-100)',      'background page'],
  ['--background-variant',     '#0d0a12 (ink-900)',         '#ece5dc (cream-200)',      'background variant'],
  ['--background-elevated',    '#120d14 (ink-800)',         '#fdf8f3 (cream-50)',       'background elevated'],
  ['--surface',                'rgba(24,20,29,0.92)',        'rgba(255,255,255,0.85)',  'surface card panel'],
  ['--surface-raised',         'rgba(24,20,29,0.98)',        'rgba(255,255,255,0.98)', 'surface raised dropdown'],
  ['--surface-container',      'rgba(255,255,255,0.05)',     'rgba(0,0,0,0.03)',        'fill container slide option'],
  ['--surface-container-high', 'rgba(255,255,255,0.10)',     'rgba(0,0,0,0.08)',        'fill hi chip'],
  // Brand
  ['--accent',                 'orange-300 #fdba74',        'orange-500 #f97316',      'accent brand orange'],
  ['--accent-hover',           'orange-200 #fed7aa',        'orange-600 #ea580c',      'accent hover'],
  ['--accent-active',          'orange-400 #fb923c',        'orange-700 #c2410c',      'accent active pressed'],
  ['--accent-text',            'orange-300 #fdba74',        'orange-700 #c2410c',      'accent text brand'],
  ['--accent-container',       'rgba(253,186,116,0.12)',    'rgba(249,115,22,0.09)',   'accent container dim bg'],
  // Text
  ['--text-primary',           '#f5f1ea (cream-text)',      'stone-900 #1c1917',       'text primary hi'],
  ['--text-secondary',         'rgba(245,241,234,0.78)',    'stone-800 #292524',       'text secondary md'],
  ['--text-tertiary',          'rgba(245,241,234,0.55)',    'stone-700 #44403c',       'text tertiary lo label'],
  ['--text-quaternary',        'rgba(245,241,234,0.38)',    'stone-600 #57534e',       'text quaternary dim hint'],
  ['--text-disabled',          'rgba(245,241,234,0.25)',    'stone-500 #78716c',       'text disabled faded'],
  ['--text-placeholder',       'rgba(245,241,234,0.35)',    'stone-500 #78716c',       'text placeholder subtle'],
  ['--text-on-accent',         'stone-950 #0c0a09',         '',                        'text on accent button'],
  // Outlines
  ['--outline-subtle',         'rgba(255,255,255,0.03)',    'rgba(0,0,0,0.06)',        'outline subtle line divider'],
  ['--outline-default',        'rgba(255,255,255,0.06)',    'rgba(0,0,0,0.10)',        'outline default border edge'],
  ['--outline-strong',         'rgba(255,255,255,0.12)',    'rgba(0,0,0,0.18)',        'outline strong rim hover'],
  ['--outline-input',          'rgba(255,255,255,0.08)',    'rgba(0,0,0,0.12)',        'outline input form border'],
  ['--outline-focus',          'rgba(251,146,60,0.55)',     'rgba(249,115,22,0.55)',   'outline focus ring'],
  ['--outline-error',          'rgba(251,113,133,0.55)',    'rgba(225,29,72,0.45)',    'outline error ring'],
  // States
  ['--state-hover',            'rgba(255,255,255,0.06)',    'rgba(0,0,0,0.04)',        'state hover'],
  ['--state-press',            'rgba(255,255,255,0.10)',    'rgba(0,0,0,0.08)',        'state press active'],
  ['--state-selected',         'rgba(253,186,116,0.12)',    'rgba(249,115,22,0.09)',   'state selected'],
  // Status — Success
  ['--success',                'emerald-400 #34d399',       'emerald-600 #059669',     'success ok green'],
  ['--success-foreground',     'emerald-300 #6ee7b7',       'emerald-700 #047857',     'success foreground text'],
  ['--success-container',      'rgba(52,211,153,0.10)',     'rgba(5,150,105,0.08)',    'success container tint'],
  ['--success-outline',        'rgba(110,231,183,0.25)',    'rgba(5,150,105,0.22)',    'success outline border'],
  // Status — Danger
  ['--danger',                 'rose-400 #fb7185',          'rose-600 #e11d48',        'danger error red'],
  ['--danger-foreground',      'rose-300 #fda4af',          'rose-700 #be123c',        'danger foreground text'],
  ['--danger-container',       'rgba(251,113,133,0.10)',    'rgba(225,29,72,0.07)',    'danger container tint'],
  ['--danger-outline',         'rgba(253,164,175,0.25)',    'rgba(225,29,72,0.18)',    'danger outline border'],
  // Status — Warning
  ['--warning',                'amber-400 #fbbf24',         'amber-600 #d97706',       'warning yellow amber'],
  ['--warning-foreground',     'amber-300 #fcd34d',         'amber-700 #b45309',       'warning foreground text'],
  ['--warning-container',      'rgba(251,191,36,0.10)',     'rgba(217,119,6,0.08)',    'warning container tint'],
  ['--warning-outline',        'rgba(252,211,77,0.25)',     'rgba(217,119,6,0.20)',    'warning outline border'],
  // Status — Info
  ['--info',                   'sky-400 #38bdf8',           'sky-600 #0284c7',         'info blue note'],
  ['--info-foreground',        'sky-300 #7dd3fc',           'sky-700 #0369a1',         'info foreground text'],
  ['--info-container',         'rgba(56,189,248,0.10)',     'rgba(2,132,199,0.08)',    'info container tint'],
  ['--info-outline',           'rgba(125,211,252,0.25)',    'rgba(2,132,199,0.20)',    'info outline border'],
  // Shadows
  ['--shadow-sm',              '0 1px 3px rgba(0,0,0,0.25)',   '0 1px 3px rgba(0,0,0,0.07)',   'shadow sm'],
  ['--shadow-md',              '0 4px 16px rgba(0,0,0,0.30)',  '0 4px 12px rgba(0,0,0,0.09)',  'shadow md'],
  ['--shadow-lg',              '0 8px 32px rgba(0,0,0,0.35)',  '0 8px 24px rgba(0,0,0,0.10)',  'shadow lg'],
  ['--shadow-xl',              '0 24px 80px rgba(0,0,0,0.40)','0 16px 48px rgba(0,0,0,0.12)', 'shadow xl'],
  ['--shadow-panel',           '0 24px 80px rgba(0,0,0,0.28)','0 4px 32px rgba(0,0,0,0.08)', 'shadow panel modal'],
  ['--overlay-md',             'rgba(0,0,0,0.50)',          'rgba(0,0,0,0.30)',        'overlay scrim backdrop'],
  ['--overlay-lg',             'rgba(0,0,0,0.70)',          'rgba(0,0,0,0.55)',        'overlay modal backdrop'],
  // Slide
  ['--slide-from',             'rgba(44,28,36,0.96)',       'rgba(253,248,243,1)',     'slide gradient start'],
  ['--slide-mid',              'rgba(27,19,28,0.98)',       'rgba(247,241,235,1)',     'slide gradient mid'],
  ['--slide-to',               'rgba(14,11,19,1)',          'rgba(235,227,218,1)',     'slide gradient end'],
  ['--slide-inset',            'rgba(255,255,255,0.06)',    'rgba(0,0,0,0.04)',        'slide inset highlight'],
  // Motion
  ['--transition-fast',        'all 0.12s ease',           '',                        'transition fast micro'],
  ['--transition-default',     'all 0.15s ease',           '',                        'transition default'],
  ['--transition-slow',        'all 0.2s ease-out',        '',                        'transition slow entrance'],
]
