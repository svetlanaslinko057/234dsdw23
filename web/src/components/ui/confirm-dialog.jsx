/**
 * Universal confirm dialog — Radix AlertDialog + brand styling.
 *
 * Rules (do not violate):
 *   - 1 dialog → 1 action → 1 toast
 *   - no inner loaders, no double confirms, no progress bars
 *   - variant="danger" for money-moving / destructive actions
 */
import * as AlertDialog from '@radix-ui/react-alert-dialog';

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default', // 'default' | 'danger'
  onConfirm,
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          data-testid="confirm-overlay"
        />
        <AlertDialog.Content
          className="fixed z-50 left-1/2 top-1/2 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-[#0B0F14] border border-white/10 p-5 shadow-2xl"
          data-testid="confirm-dialog"
        >
          <AlertDialog.Title className="text-white text-lg font-semibold">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-white/60 text-sm mt-2 whitespace-pre-line">
            {description}
          </AlertDialog.Description>
          <div className="flex justify-end gap-3 mt-6">
            <AlertDialog.Cancel asChild>
              <button
                className="px-4 py-2 text-sm text-white/60 hover:text-white transition"
                data-testid="confirm-cancel"
              >
                {cancelLabel}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                onClick={onConfirm}
                data-testid="confirm-action"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  variant === 'danger'
                    ? 'bg-red-500 text-white hover:bg-red-400'
                    : 'bg-[#2FE6A6] text-[#0B0F14] hover:opacity-90'
                }`}
              >
                {confirmLabel}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}

export default ConfirmDialog;
