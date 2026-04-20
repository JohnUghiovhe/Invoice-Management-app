import { INVOICE_STATUSES } from "../lib/types";

export function FilterPanel({ selected, onToggle }) {
  return (
    <fieldset className="rounded-[28px] border border-ink-200 bg-white/90 p-5 shadow-sm dark:border-ink-700 dark:bg-ink-800/80 lg:sticky lg:top-6">
      <legend className="px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500 dark:text-ink-300">
        Filter by status
      </legend>
      <div className="mt-4 grid gap-3">
        {INVOICE_STATUSES.map((status) => {
          const checked = selected.includes(status);

          return (
            <label
              key={status}
              className="flex cursor-pointer items-center justify-between rounded-2xl border border-ink-200 bg-ink-50 px-4 py-3 text-sm font-medium text-ink-700 transition hover:border-brand-400 hover:bg-brand-50 dark:border-ink-700 dark:bg-ink-900/40 dark:text-ink-100 dark:hover:bg-brand-700/20"
            >
              <span>{status[0].toUpperCase() + status.slice(1)}</span>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(status)}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
