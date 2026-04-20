import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FilterPanel } from "../components/FilterPanel";
import { InvoiceCard } from "../components/InvoiceCard";
import { ThemeToggle } from "../components/ThemeToggle";
import { listInvoices } from "../lib/api";
import { INVOICE_STATUSES } from "../lib/types";

export function InvoiceListPage() {
  const [selectedStatuses, setSelectedStatuses] = useState(INVOICE_STATUSES);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!selectedStatuses.length) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    listInvoices(selectedStatuses)
      .then(setInvoices)
      .catch((err) => setError(err.message || "Unable to load invoices"))
      .finally(() => setLoading(false));
  }, [selectedStatuses]);

  const headingText = useMemo(() => {
    if (loading) {
      return "Loading invoices...";
    }
    return `${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`;
  }, [invoices.length, loading]);

  const handleToggleStatus = (status) => {
    setSelectedStatuses((current) => {
      if (current.includes(status)) {
        return current.filter((item) => item !== status);
      }
      return [...current, status];
    });
  };

  return (
    <main className="mx-auto w-full max-w-7xl animate-rise px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <header className="mb-6 rounded-[32px] bg-gradient-to-r from-brand-700 via-brand-600 to-ink-700 p-6 text-white shadow-xl sm:p-7 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/70">Invoice Management</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">Invoice Studio</h1>
            <p className="mt-3 text-sm leading-6 text-white/90 sm:text-[15px]">{headingText}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-end">
            <ThemeToggle />
            <Link
              to="/invoice/new"
              className="inline-flex items-center gap-3 rounded-full bg-brand-500 pl-2 pr-5 py-2 text-sm font-bold text-white shadow transition hover:bg-brand-400"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold leading-none text-brand-500">
                +
              </span>
              New Invoice
            </Link>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]">
        <FilterPanel selected={selectedStatuses} onToggle={handleToggleStatus} />

        <section aria-live="polite" className="space-y-4 lg:pt-1">
          {loading ? <p className="text-sm text-ink-600 dark:text-ink-300">Loading...</p> : null}

          {error ? (
            <div className="rounded-xl border border-danger-300 bg-danger-100 p-4 text-sm font-medium text-danger-700 dark:border-danger-600 dark:bg-danger-500/20 dark:text-danger-300">
              {error}
            </div>
          ) : null}

          {!loading && !error && !invoices.length ? (
            <div className="rounded-[28px] border border-dashed border-ink-300 bg-white/70 p-10 text-center dark:border-ink-600 dark:bg-ink-800/70">
              <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">No invoices found</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-600 dark:text-ink-300">
                Try changing the selected status filters or create a new invoice.
              </p>
            </div>
          ) : null}

          {invoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </section>
      </div>
    </main>
  );
}
