import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ChangeEvent,
  type ClipboardEvent,
  type PointerEvent,
} from 'react'
import { Upload, ClipboardPaste, Pencil, Trash2, X, Check } from 'lucide-react'

export interface FocalPoint {
  x: number
  y: number
}

const DESKTOP_ASPECT = 16 / 9
const MOBILE_ASPECT = 9 / 16
const MOBILE_FRAME_HEIGHT_PCT = 100
const MOBILE_FRAME_WIDTH_PCT = (MOBILE_ASPECT / DESKTOP_ASPECT) * MOBILE_FRAME_HEIGHT_PCT

interface Props {
  value: string
  focalPoint?: FocalPoint
  onChange: (url: string) => void
  onFocalPointChange?: (fp: FocalPoint) => void
}

function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Could not read file.'))
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.readAsDataURL(file)
  })
}

export function SectionImageField({ value, focalPoint = { x: 50, y: 50 }, onChange, onFocalPointChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pasteInputRef = useRef<HTMLInputElement>(null)
  const cropContainerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const [status, setStatus] = useState('')
  const [showPasteInput, setShowPasteInput] = useState(false)
  const [showCrop, setShowCrop] = useState(false)
  const [pendingFp, setPendingFp] = useState<FocalPoint>(focalPoint)

  const hasImage = Boolean(value.trim())

  // Auto-focus the paste input when it appears
  useEffect(() => {
    if (showPasteInput) {
      pasteInputRef.current?.focus()
    }
  }, [showPasteInput])

  const handleBrowse = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setStatus('Please select an image file.')
      return
    }
    try {
      const url = await readFileAsDataUrl(file)
      onChange(url)
      setStatus('')
      setShowPasteInput(false)
    } catch {
      setStatus('Upload failed.')
    }
    e.target.value = ''
  }

  // Handle Cmd+V / Ctrl+V paste inside the paste input — no permission needed
  const handlePasteEvent = async (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()

    // Image from clipboard (e.g. screenshot)
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find((item) => item.type.startsWith('image/'))
    if (imageItem) {
      const blob = imageItem.getAsFile()
      if (blob) {
        const url = await readFileAsDataUrl(blob)
        onChange(url)
        setShowPasteInput(false)
        setStatus('')
        return
      }
    }

    // URL text
    const text = e.clipboardData.getData('text').trim()
    if (text.match(/^https?:\/\//)) {
      onChange(text)
      setShowPasteInput(false)
      setStatus('')
      return
    }

    setStatus('No image or URL found. Copy an image or a URL and try again.')
  }

  const openCrop = () => {
    setPendingFp(focalPoint)
    setShowCrop(true)
  }

  const computeFp = useCallback((clientX: number, clientY: number) => {
    const el = cropContainerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const rawX = ((clientX - rect.left) / rect.width) * 100
    const rawY = ((clientY - rect.top) / rect.height) * 100
    const halfW = MOBILE_FRAME_WIDTH_PCT / 2
    const halfH = MOBILE_FRAME_HEIGHT_PCT / 2
    const x = Math.round(Math.min(100 - halfW, Math.max(halfW, rawX)))
    const y = Math.round(Math.min(100 - halfH, Math.max(halfH, rawY)))
    setPendingFp({ x, y })
  }, [])

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    isDragging.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    computeFp(e.clientX, e.clientY)
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return
    computeFp(e.clientX, e.clientY)
  }

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    isDragging.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const confirmCrop = () => {
    onFocalPointChange?.({
      x: Math.round(frameCenterX),
      y: Math.round(frameCenterY),
    })
    setShowCrop(false)
  }

  const frameCenterX = Math.min(
    100 - MOBILE_FRAME_WIDTH_PCT / 2,
    Math.max(MOBILE_FRAME_WIDTH_PCT / 2, pendingFp.x),
  )
  const frameCenterY = Math.min(
    100 - MOBILE_FRAME_HEIGHT_PCT / 2,
    Math.max(MOBILE_FRAME_HEIGHT_PCT / 2, pendingFp.y),
  )

  return (
    <>
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Cover Image</p>

        {/* Preview or empty state */}
        {hasImage ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-edge bg-raised">
            <img
              src={value}
              alt="Cover"
              className="h-full w-full object-cover"
              style={{ objectPosition: `${focalPoint.x}% ${focalPoint.y}%` }}
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-dashed border-rim bg-fill-lo">
            <p className="text-xs text-dim">No image selected</p>
          </div>
        )}

        {/* Paste input — shown when user clicks Paste */}
        {showPasteInput && (
          <div className="space-y-1.5">
            <input
              ref={pasteInputRef}
              type="text"
              readOnly
              className="input w-full cursor-default text-sm caret-transparent"
              placeholder="Press Cmd+V / Ctrl+V to paste an image or URL…"
              onPaste={handlePasteEvent}
              onBlur={() => setShowPasteInput(false)}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowPasteInput(false) }}
            />
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2">
          {hasImage ? (
            <>
              <button
                type="button"
                className="button-ghost flex items-center justify-center gap-1.5 rounded-xl border border-edge py-2 text-xs font-medium"
                onClick={openCrop}
              >
                <Pencil className="size-3.5" />
                Edit
              </button>
              <button
                type="button"
                className="button-ghost flex items-center justify-center gap-1.5 rounded-xl border border-err-line py-2 text-xs font-medium text-err-fg"
                onClick={() => { onChange(''); setStatus('') }}
              >
                <Trash2 className="size-3.5" />
                Clear
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="button-ghost flex items-center justify-center gap-1.5 rounded-xl border border-edge py-2 text-xs font-medium"
                onClick={() => { setShowPasteInput(false); fileInputRef.current?.click() }}
              >
                <Upload className="size-3.5" />
                Browse
              </button>
              <button
                type="button"
                className="button-ghost flex items-center justify-center gap-1.5 rounded-xl border border-edge py-2 text-xs font-medium"
                onClick={() => { setStatus(''); setShowPasteInput((v) => !v) }}
              >
                <ClipboardPaste className="size-3.5" />
                Paste
              </button>
            </>
          )}
        </div>

        {status && <p className="text-xs text-faded">{status}</p>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleBrowse}
      />

      {/* Crop / focal point modal */}
      {showCrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm">
          <div className="flex w-full max-w-3xl flex-col gap-5 rounded-3xl border border-edge bg-raised p-6 shadow-2xl">

            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-hi">Adjust focal point</h3>
                <p className="mt-0.5 text-xs text-lo">
                  Drag the 9:16 frame inside desktop view to control what mobile players see.
                </p>
              </div>
              <button
                className="flex size-8 items-center justify-center rounded-full text-lo transition hover:bg-fill hover:text-hi"
                onClick={() => setShowCrop(false)}
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Preview grid */}
            <div className="flex gap-5">

              {/* 16:9 interactive frame */}
              <div className="flex-1 space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Desktop 16∶9</p>
                <div
                  ref={cropContainerRef}
                  className="relative aspect-video w-full cursor-grab select-none overflow-hidden rounded-xl border border-edge active:cursor-grabbing"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                >
                  <img
                    src={value}
                    alt=""
                    draggable={false}
                    className="pointer-events-none h-full w-full object-cover"
                    style={{ objectPosition: `${frameCenterX}% ${frameCenterY}%` }}
                  />
                  {/* Mobile 9:16 frame inside desktop canvas */}
                  <div
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-[16px] border-2 border-white/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.22)]"
                    style={{
                      width: `${MOBILE_FRAME_WIDTH_PCT}%`,
                      height: `${MOBILE_FRAME_HEIGHT_PCT}%`,
                      left: `${frameCenterX}%`,
                      top: `${frameCenterY}%`,
                    }}
                  >
                    <div className="absolute left-1/2 top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-black/35" />
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 rounded-full border border-white/25 bg-black/45 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white/85">
                      9:16
                    </span>
                  </div>
                  {/* Crosshair */}
                  <div
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${frameCenterX}%`, top: `${frameCenterY}%` }}
                  >
                    <div className="absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-full bg-white/90 shadow-sm" />
                    <div className="absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 bg-white/90 shadow-sm" />
                    <div className="absolute left-1/2 top-1/2 h-px w-6 -translate-x-full -translate-y-1/2 bg-white/90 shadow-sm" />
                    <div className="absolute left-1/2 top-1/2 h-px w-6 -translate-y-1/2 bg-white/90 shadow-sm" />
                    <div className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow ring-1 ring-black/40" />
                  </div>
                </div>
              </div>

              {/* 9:16 mobile preview */}
              <div className="flex flex-col space-y-1.5">
                <p className="text-[10px] uppercase tracking-[0.12em] text-lo">Mobile 9∶16</p>
                <div
                  className="relative overflow-hidden rounded-xl border border-edge"
                  style={{ width: '7rem', aspectRatio: '9 / 16' }}
                >
                  <img
                    src={value}
                    alt=""
                    draggable={false}
                    className="pointer-events-none h-full w-full object-cover"
                    style={{ objectPosition: `${frameCenterX}% ${frameCenterY}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2">
              <button
                className="button-ghost rounded-xl border border-edge px-5 py-2 text-sm"
                onClick={() => setShowCrop(false)}
              >
                Cancel
              </button>
              <button
                className="flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2 text-sm font-medium text-on-accent transition hover:opacity-90"
                onClick={confirmCrop}
              >
                <Check className="size-4" />
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
