import { useEffect, useRef } from "react";
import { useEscClose } from "../hooks/useEscClose";

function getTabbableElements(container) {
  return Array.from(
    container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  ).filter((element) => !element.hasAttribute("disabled"));
}

export function ConfirmModal({ isOpen, title, message, onConfirm, onClose, busy = false }) {
  const dialogRef = useRef(null);

  useEscClose(isOpen, onClose);

  useEffect(() => {
    if (!isOpen || !dialogRef.current) {
      return undefined;
    }

    const dialog = dialogRef.current;
    const tabbables = getTabbableElements(dialog);
    tabbables[0]?.focus();

    const handleTab = (event) => {
      if (event.key !== "Tab") {
        return;
      }

      const focusables = getTabbableElements(dialog);
      if (!focusables.length) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    dialog.addEventListener("keydown", handleTab);

    return () => {
      dialog.removeEventListener("keydown", handleTab);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/55 p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        className="w-full max-w-md rounded-2xl border border-ink-200 bg-white p-6 shadow-xl dark:border-ink-700 dark:bg-ink-800"
      >
        <h2 id="confirm-title" className="text-xl font-bold text-ink-900 dark:text-ink-100">
          {title}
        </h2>
        <p id="confirm-description" className="mt-2 text-sm leading-relaxed text-ink-700 dark:text-ink-200">
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-ink-100 px-6 py-3 text-sm font-bold text-ink-500 transition hover:bg-ink-200 dark:bg-ink-600 dark:text-ink-200 dark:hover:bg-white dark:hover:text-ink-500"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-full bg-danger-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-danger-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
