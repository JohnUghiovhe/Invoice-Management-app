import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ConfirmModal } from "../components/ConfirmModal";
import { StatusBadge } from "../components/StatusBadge";
import { getInvoice, markAsPaid, removeInvoice } from "../lib/api";
import { formatCurrency } from "../lib/format";

export function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError("");

    getInvoice(id)
      .then(setInvoice)
      .catch((err) => setError(err.message || "Unable to load invoice"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleMarkPaid = async () => {
    if (!invoice || invoice.status !== "pending") {
      return;
    }

    setBusy(true);
    try {
      const updated = await markAsPaid(invoice.id);
      setInvoice(updated);
    } catch (err) {
      setError(err.message || "Unable to mark invoice as paid");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!invoice) {
      return;
    }

    setBusy(true);
    try {
      await removeInvoice(invoice.id);
      navigate("/");
    } catch (err) {
      setError(err.message || "Unable to delete invoice");
      setBusy(false);
    }
  };

  if (loading) {
    return <main className="mx-auto max-w-4xl px-4 py-8 text-ink-700 dark:text-ink-200">Loading...</main>;
  }

  if (error || !invoice) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link to="/" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
          Back to invoices
        </Link>
        <p className="mt-4 rounded-xl border border-danger-300 bg-danger-100 p-4 text-sm text-danger-700 dark:border-danger-600 dark:bg-danger-500/20 dark:text-danger-300">
          {error || "Invoice not found"}
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl animate-rise px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <Link to="/" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
        Back to invoices
      </Link>

      <section className="mt-4 rounded-[32px] border border-ink-200 bg-white p-6 shadow-lg dark:border-ink-700 dark:bg-ink-800 sm:p-7 lg:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-100 pb-5 dark:border-ink-700">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-ink-500 dark:text-ink-300">Invoice Detail</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-100">#{invoice.id}</h1>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{invoice.description}</p>
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_260px]">
          <article className="rounded-[24px] bg-ink-50 p-5 dark:bg-ink-900/50">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-300">Bill To</h2>
            <p className="mt-2 text-sm font-medium text-ink-800 dark:text-ink-100">{invoice.clientName}</p>
            <p className="text-sm text-ink-700 dark:text-ink-200">{invoice.clientEmail}</p>
            <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">{invoice.clientAddress.street}</p>
            <p className="text-sm text-ink-700 dark:text-ink-200">
              {invoice.clientAddress.city}, {invoice.clientAddress.postCode}
            </p>
            <p className="text-sm text-ink-700 dark:text-ink-200">{invoice.clientAddress.country}</p>
          </article>

          <article className="rounded-[24px] bg-ink-50 p-5 dark:bg-ink-900/50">
            <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-500 dark:text-ink-300">Payment</h2>
            <p className="mt-2 text-sm text-ink-700 dark:text-ink-200">Created: {invoice.createdAt}</p>
            <p className="text-sm text-ink-700 dark:text-ink-200">Due: {invoice.paymentDue}</p>
            <p className="text-sm text-ink-700 dark:text-ink-200">Terms: {invoice.paymentTerms} days</p>
            <p className="mt-4 text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-100">{formatCurrency(invoice.total)}</p>
          </article>
        </div>

        <section className="mt-6 rounded-[24px] border border-ink-200 dark:border-ink-700">
          <h2 className="border-b border-ink-200 px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500 dark:border-ink-700 dark:text-ink-300">
            Items
          </h2>
          <ul className="divide-y divide-ink-200 dark:divide-ink-700">
            {invoice.items.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 text-sm">
                <span className="font-medium text-ink-800 dark:text-ink-100">{item.name}</span>
                <span className="text-ink-600 dark:text-ink-300">
                  {item.quantity} x {formatCurrency(item.price)} = <strong>{formatCurrency(item.total)}</strong>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-ink-100 pt-6 dark:border-ink-700">
          <Link
            to={`/invoice/${invoice.id}/edit`}
            className="rounded-full bg-ink-100 px-6 py-3 text-sm font-bold text-ink-500 transition hover:bg-ink-200 dark:bg-ink-600 dark:text-ink-200 dark:hover:bg-white dark:hover:text-ink-500"
          >
            Edit
          </Link>

          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-full bg-danger-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-danger-400"
          >
            Delete
          </button>

          <button
            type="button"
            onClick={handleMarkPaid}
            disabled={busy || invoice.status !== "pending"}
            className="rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy && invoice.status === "pending" ? "Updating..." : "Mark as Paid"}
          </button>
        </div>
      </section>

      <ConfirmModal
        isOpen={deleteOpen}
        title="Confirm Deletion"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        busy={busy}
      />
    </main>
  );
}
