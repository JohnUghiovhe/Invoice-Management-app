import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { InvoiceForm } from "../components/InvoiceForm";
import { ThemeToggle } from "../components/ThemeToggle";
import { createInvoice, getInvoice, updateInvoice } from "../lib/api";
import { emptyInvoice, type Invoice, type InvoiceFormValues, type UpsertInvoicePayload } from "../lib/types";

export function InvoiceFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const [initialData, setInitialData] = useState<InvoiceFormValues>(emptyInvoice);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isEditing || !id) {
      return;
    }

    setLoading(true);
    getInvoice(id)
      .then((invoice) => {
        setInitialData({
          createdAt: invoice.createdAt,
          paymentDue: invoice.paymentDue,
          description: invoice.description,
          paymentTerms: invoice.paymentTerms,
          clientName: invoice.clientName,
          clientEmail: invoice.clientEmail,
          senderAddress: invoice.senderAddress,
          clientAddress: invoice.clientAddress,
          items: invoice.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }))
        });
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Unable to load invoice"))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  const title = isEditing ? "Edit Invoice" : "Create Invoice";

  const handleSubmit = async (payload: UpsertInvoicePayload, asDraft: boolean) => {
    setSaving(true);
    setError("");

    try {
      if (isEditing && id) {
        const invoice = (await updateInvoice(id, payload, asDraft)) as Invoice;
        if (invoice) {
          navigate(`/invoice/${invoice.id}`);
        }
      } else {
        const invoice = (await createInvoice(payload, asDraft)) as Invoice;
        if (invoice) {
          navigate(`/invoice/${invoice.id}`);
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to save invoice");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 text-ink-700 dark:text-ink-200">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        Loading...
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl animate-rise px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <Link to={id ? `/invoice/${id}` : "/"} className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
            Back
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-ink-900 dark:text-ink-100">{title}</h1>
        </div>
        <ThemeToggle />
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-danger-300 bg-danger-100 p-3 text-sm text-danger-700 dark:border-danger-600 dark:bg-danger-500/20 dark:text-danger-300">
          {error}
        </p>
      ) : null}

      <InvoiceForm initialData={initialData} mode={isEditing ? "edit" : "create"} onSubmit={handleSubmit} isSaving={saving} />
    </main>
  );
}