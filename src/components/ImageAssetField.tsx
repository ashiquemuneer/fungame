import { useId, useRef, useState, type ChangeEvent } from 'react'
import { ClipboardPaste, ImagePlus, Link2, Trash2, Upload } from 'lucide-react'

interface ImageAssetFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

function readFileAsDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Could not read the image file.'))
    }

    reader.onerror = () => reject(new Error('Could not read the image file.'))
    reader.readAsDataURL(file)
  })
}

export function ImageAssetField({
  label,
  value,
  onChange,
  placeholder = 'https://...',
}: ImageAssetFieldProps) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [status, setStatus] = useState('')
  const hasImage = Boolean(value.trim())

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setStatus('Select an image file only.')
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      onChange(dataUrl)
      setStatus('Image uploaded.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Image upload failed.')
    } finally {
      event.target.value = ''
    }
  }

  const handlePaste = async () => {
    if (!navigator.clipboard?.read) {
      setStatus('Clipboard image paste is not supported in this browser.')
      return
    }

    try {
      const clipboardItems = await navigator.clipboard.read()

      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith('image/'))
        if (!imageType) {
          continue
        }

        const blob = await item.getType(imageType)
        const dataUrl = await readFileAsDataUrl(blob)
        onChange(dataUrl)
        setStatus('Image pasted from clipboard.')
        return
      }

      setStatus('No image found in the clipboard.')
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : 'Clipboard paste failed.',
      )
    }
  }

  return (
    <div className="space-y-3">
      <label className="space-y-2 text-sm text-white/80" htmlFor={inputId}>
        <span>{label}</span>
        <div className="relative">
          <Link2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/35" />
          <input
            className="input pl-10"
            id={inputId}
            placeholder={placeholder}
            value={value}
            onChange={(event) => {
              onChange(event.target.value)
              if (status) {
                setStatus('')
              }
            }}
          />
        </div>
      </label>

      <input
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        type="file"
        onChange={handleUpload}
      />

      <div className="flex flex-wrap gap-2">
        <button
          className="button-ghost rounded-full border border-white/10"
          type="button"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="size-4" />
          Upload
        </button>
        <button
          className="button-ghost rounded-full border border-white/10"
          type="button"
          onClick={handlePaste}
        >
          <ClipboardPaste className="size-4" />
          Paste
        </button>
        {hasImage ? (
          <button
            className="button-ghost rounded-full border border-white/10"
            type="button"
            onClick={() => {
              onChange('')
              setStatus('Image cleared.')
            }}
          >
            <Trash2 className="size-4" />
            Clear
          </button>
        ) : null}
      </div>

      {hasImage ? (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/95">
          <img
            alt={label}
            className="h-32 w-full object-contain p-2"
            src={value}
          />
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/4 px-4 py-3 text-sm text-white/55">
          <ImagePlus className="size-4 text-orange-100" />
          Upload an image, paste one from clipboard, or keep using a URL.
        </div>
      )}

      {status ? <p className="text-xs text-white/45">{status}</p> : null}
    </div>
  )
}
