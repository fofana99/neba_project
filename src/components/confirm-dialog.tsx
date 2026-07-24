import type { ReactNode } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm border border-border bg-background p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="eyebrow text-destructive">Confirmation</p>
        <h2 className="mt-2 text-2xl">{title}</h2>
        {description && (
          <p className="mt-3 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={onConfirm}
            disabled={busy}
            className="btn-luxe disabled:opacity-50"
          >
            {busy ? "Suppression…" : confirmLabel}
          </button>
          <button
            onClick={onCancel}
            disabled={busy}
            className="btn-luxe-outline disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
