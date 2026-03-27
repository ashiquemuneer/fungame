import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  variant      = 'danger',
  loading      = false,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} size="sm" closeOnBackdrop={!loading}>
      <div className="flex flex-col gap-5">
        <div>
          <h2 className="text-base font-semibold text-hi">{title}</h2>
          {description && <p className="mt-2 text-sm leading-relaxed text-lo">{description}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
