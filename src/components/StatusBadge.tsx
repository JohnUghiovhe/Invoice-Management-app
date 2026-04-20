import { type InvoiceStatus } from "../lib/types";

const statusStyles: Record<InvoiceStatus, string> = {
  draft: "bg-ink-200/85 text-ink-700 dark:bg-ink-600/35 dark:text-ink-200",
  pending: "bg-pending-100 text-pending-700 dark:bg-pending-500/25 dark:text-pending-200",
  paid: "bg-success-100 text-success-700 dark:bg-success-500/25 dark:text-success-200"
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={`inline-flex min-w-24 items-center justify-center gap-2 rounded-full px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] ${statusStyles[status]}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}