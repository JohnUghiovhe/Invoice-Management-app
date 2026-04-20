const statusStyles = {
  draft: "bg-ink-200/85 text-ink-700 dark:bg-ink-600/35 dark:text-ink-200",
  pending: "bg-brand-100 text-brand-700 dark:bg-brand-500/25 dark:text-brand-200",
  paid: "bg-ink-300/80 text-ink-600 dark:bg-ink-500/30 dark:text-ink-100"
};

export function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex min-w-24 items-center justify-center gap-2 rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${statusStyles[status]}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}
