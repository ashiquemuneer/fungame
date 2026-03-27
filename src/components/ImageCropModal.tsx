import { useCallback, useEffect, useRef, useState } from 'react'
import { Crop } from 'lucide-react'
import { Modal } from './ui/Modal'

interface CropBox { x: number; y: number; size: number }
type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br'

interface ImageCropModalProps {
  src: string
  open: boolean
  onClose: () => void
  onApply: (croppedDataUrl: string) => void
}

export function ImageCropModal({ src, open, onClose, onApply }: ImageCropModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [box, setBox] = useState<CropBox | null>(null)

  // drag-to-move state
  const dragRef = useRef<{ mx: number; my: number; bx: number; by: number } | null>(null)
  // drag-to-resize state
  const resizeRef = useRef<{ handle: ResizeHandle; mx: number; my: number; startBox: CropBox } | null>(null)

  const initBox = useCallback(() => {
    const img = imgRef.current
    const container = containerRef.current
    if (!img || !container) return
    const imgRect = img.getBoundingClientRect()
    const conRect = container.getBoundingClientRect()
    const offsetX = imgRect.left - conRect.left
    const offsetY = imgRect.top - conRect.top
    const size = Math.min(imgRect.width, imgRect.height) * 0.8
    setBox({
      x: offsetX + (imgRect.width - size) / 2,
      y: offsetY + (imgRect.height - size) / 2,
      size,
    })
  }, [])

  useEffect(() => {
    if (open && src) {
      const t = setTimeout(initBox, 80)
      return () => clearTimeout(t)
    }
  }, [open, src, initBox])

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? e.touches[0].clientX : e.clientX
      const cy = 'touches' in e ? e.touches[0].clientY : e.clientY
      const cRect = containerRef.current?.getBoundingClientRect()
      if (!cRect) return

      if (dragRef.current) {
        const dx = cx - dragRef.current.mx
        const dy = cy - dragRef.current.my
        setBox(b => {
          if (!b) return b
          return {
            ...b,
            x: Math.max(0, Math.min(cRect.width - b.size, dragRef.current!.bx + dx)),
            y: Math.max(0, Math.min(cRect.height - b.size, dragRef.current!.by + dy)),
          }
        })
      }

      if (resizeRef.current) {
        const { handle, mx, my, startBox: sb } = resizeRef.current
        const dx = cx - mx
        const dy = cy - my

        const fx = handle === 'tl' || handle === 'bl' ? sb.x + sb.size : sb.x
        const fy = handle === 'tl' || handle === 'tr' ? sb.y + sb.size : sb.y

        const movX = handle === 'tl' || handle === 'bl' ? sb.x + dx : sb.x + sb.size + dx
        const movY = handle === 'tl' || handle === 'tr' ? sb.y + dy : sb.y + sb.size + dy

        const rawSize = Math.min(Math.abs(movX - fx), Math.abs(movY - fy))
        const newSize = Math.max(40, rawSize)

        let newX = fx < movX ? fx : fx - newSize
        let newY = fy < movY ? fy : fy - newSize

        newX = Math.max(0, Math.min(cRect.width - newSize, newX))
        newY = Math.max(0, Math.min(cRect.height - newSize, newY))
        const finalSize = Math.min(newSize, cRect.width - newX, cRect.height - newY)

        setBox({ x: newX, y: newY, size: finalSize })
      }
    }

    const end = () => {
      dragRef.current = null
      resizeRef.current = null
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', end)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', end)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', end)
    }
  }, [])

  const apply = () => {
    const img = imgRef.current
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!img || !canvas || !container || !box) return
    const conRect = container.getBoundingClientRect()
    const imgRect = img.getBoundingClientRect()
    const scaleX = img.naturalWidth / imgRect.width
    const scaleY = img.naturalHeight / imgRect.height
    const imgOffX = imgRect.left - conRect.left
    const imgOffY = imgRect.top - conRect.top
    const sx = (box.x - imgOffX) * scaleX
    const sy = (box.y - imgOffY) * scaleY
    const sw = box.size * scaleX
    const sh = box.size * scaleY
    const size = Math.round(Math.min(sw, sh))
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size)
    onApply(canvas.toDataURL('image/jpeg', 0.92))
    onClose()
  }

  const startResize = (handle: ResizeHandle, e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!box) return
    const mx = 'touches' in e ? e.touches[0].clientX : e.clientX
    const my = 'touches' in e ? e.touches[0].clientY : e.clientY
    resizeRef.current = { handle, mx, my, startBox: { ...box } }
  }

  return (
    <Modal open={open} onClose={onClose} title="Crop to 1 : 1">
      <div className="space-y-4">
        <p className="text-xs text-lo">Drag the box to reposition. Drag corners to resize.</p>
        <div
          ref={containerRef}
          className="relative select-none overflow-hidden rounded-xl bg-black"
          style={{ touchAction: 'none' }}
        >
          <img
            ref={imgRef}
            src={src}
            alt=""
            className="block max-h-[55vh] w-full object-contain"
            draggable={false}
            onLoad={initBox}
          />
          {box && (
            <>
              {/* Overlay masks */}
              <div className="pointer-events-none absolute left-0 right-0 top-0 bg-black/60" style={{ height: box.y }} />
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 bg-black/60" style={{ top: box.y + box.size }} />
              <div className="pointer-events-none absolute bg-black/60" style={{ top: box.y, left: 0, width: box.x, height: box.size }} />
              <div className="pointer-events-none absolute bg-black/60" style={{ top: box.y, left: box.x + box.size, right: 0, height: box.size }} />

              {/* Crop box — drag to move */}
              <div
                className="absolute cursor-move border-2 border-white"
                style={{ left: box.x, top: box.y, width: box.size, height: box.size }}
                onMouseDown={(e) => {
                  if ((e.target as HTMLElement).dataset.handle) return
                  e.preventDefault()
                  dragRef.current = { mx: e.clientX, my: e.clientY, bx: box.x, by: box.y }
                }}
                onTouchStart={(e) => {
                  if ((e.target as HTMLElement).dataset.handle) return
                  e.preventDefault()
                  dragRef.current = { mx: e.touches[0].clientX, my: e.touches[0].clientY, bx: box.x, by: box.y }
                }}
              >
                {/* Rule-of-thirds grid */}
                <div className="pointer-events-none absolute inset-0 opacity-40">
                  <div className="absolute bottom-0 left-1/3 top-0 border-l border-white/60" />
                  <div className="absolute bottom-0 left-2/3 top-0 border-l border-white/60" />
                  <div className="absolute left-0 right-0 top-1/3 border-t border-white/60" />
                  <div className="absolute left-0 right-0 top-2/3 border-t border-white/60" />
                </div>

                {/* Corner handles — drag to resize */}
                <div data-handle="tl" className="absolute -left-1.5 -top-1.5 size-5 cursor-nw-resize border-l-[3px] border-t-[3px] border-white"
                  onMouseDown={(e) => startResize('tl', e)}
                  onTouchStart={(e) => startResize('tl', e)} />
                <div data-handle="tr" className="absolute -right-1.5 -top-1.5 size-5 cursor-ne-resize border-r-[3px] border-t-[3px] border-white"
                  onMouseDown={(e) => startResize('tr', e)}
                  onTouchStart={(e) => startResize('tr', e)} />
                <div data-handle="bl" className="absolute -bottom-1.5 -left-1.5 size-5 cursor-sw-resize border-b-[3px] border-l-[3px] border-white"
                  onMouseDown={(e) => startResize('bl', e)}
                  onTouchStart={(e) => startResize('bl', e)} />
                <div data-handle="br" className="absolute -bottom-1.5 -right-1.5 size-5 cursor-se-resize border-b-[3px] border-r-[3px] border-white"
                  onMouseDown={(e) => startResize('br', e)}
                  onTouchStart={(e) => startResize('br', e)} />
              </div>
            </>
          )}
        </div>
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex justify-end gap-3">
          <button className="button-secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="button-primary" type="button" onClick={apply}>
            <Crop className="size-4" />
            Apply crop
          </button>
        </div>
      </div>
    </Modal>
  )
}
