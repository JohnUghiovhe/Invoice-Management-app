import { Link } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";
import { type Invoice } from "../lib/types";

export function InvoiceCard({ invoice }: { invoice: Invoice }) {
  return (
    <Link
      to={`/invoice/${invoice.id}`}
      className="group block rounded-[28px] border border-ink-200 bg-white px-5 py-4 shadow-sm transition hover:-translate-y-1 hover:border-brand-500 hover:shadow-lg dark:border-ink-700 dark:bg-ink-800 md:px-6 md:py-5"
    >
      <div className="grid gap-4 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold tracking-wide text-ink-900 dark:text-ink-100">#{invoice.id}</h3>
            <span className="hidden h-1.5 w-1.5 rounded-full bg-ink-300 md:block" aria-hidden="true" />
            <p className="text-sm text-ink-500 dark:text-ink-300">Due {invoice.paymentDue}</p>
          </div>
          <p className="text-sm text-ink-700 dark:text-ink-200">{invoice.clientName}</p>
        </div>

        <p className="text-sm text-ink-500 dark:text-ink-300 md:text-right">{invoice.paymentTerms} days</p>

        <p className="text-xl font-bold text-ink-900 transition group-hover:text-brand-600 dark:text-ink-50 md:text-right">
          ${invoice.total.toFixed(2)}
        </p>

        <div className="flex items-center justify-between gap-4 md:justify-end">
          <StatusBadge status={invoice.status} />
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-ink-700 dark:text-ink-200">
            ›
          </span>
        </div>
      </div>
    </Link>
  );
}