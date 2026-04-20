import { useMemo, useState } from "react";
import { validateInvoice } from "../lib/validation";

const baseInputClass =
  "mt-1 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-ink-900 outline-none transition focus:ring-2 dark:bg-ink-900 dark:text-ink-100";

function FieldError({ message }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-red-600 dark:text-red-300">{message}</p>;
}

function normalizeInvoice(values) {
  return {
    ...values,
    paymentTerms: Number(values.paymentTerms),
    items: values.items.map((item) => ({
      ...item,
      quantity: Number(item.quantity),
      price: Number(item.price)
    }))
  };
}

export function InvoiceForm({ initialData, mode, onSubmit, isSaving }) {
  const [formValues, setFormValues] = useState(() => structuredClone(initialData));
  const [errors, setErrors] = useState({});

  const totalAmount = useMemo(() => {
    return formValues.items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0), 0);
  }, [formValues.items]);

  const handleField = (name, value) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressField = (group, field, value) => {
    setFormValues((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: value
      }
    }));
  };

  const handleItemField = (index, field, value) => {
    setFormValues((prev) => {
      const items = prev.items.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }

        return {
          ...item,
          [field]: value
        };
      });

      return {
        ...prev,
        items
      };
    });
  };

  const addItem = () => {
    setFormValues((prev) => ({
      ...prev,
      items: [...prev.items, { name: "", quantity: 1, price: 0 }]
    }));
  };

  const removeItem = (index) => {
    setFormValues((prev) => ({
      ...prev,
      items: prev.items.filter((_item, itemIndex) => itemIndex !== index)
    }));
  };

  const submitWithState = async (asDraft) => {
    const payload = normalizeInvoice(formValues);

    if (!asDraft) {
      const nextErrors = validateInvoice(payload);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length) {
        return;
      }
    }

    setErrors({});
    await onSubmit(payload, asDraft);
  };

  const inputClass = (error) =>
    `${baseInputClass} ${
      error
        ? "border-red-500 focus:border-red-500 focus:ring-red-300 dark:border-red-400"
        : "border-ink-300 focus:border-brand-500 focus:ring-brand-200 dark:border-ink-600"
    }`;

  return (
    <form
      className="space-y-7 rounded-[32px] border border-ink-200 bg-white p-5 shadow-lg dark:border-ink-700 dark:bg-ink-800 sm:p-6 lg:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        void submitWithState(false);
      }}
      noValidate
    >
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink-100 pb-5 dark:border-ink-700">
        <h1 className="text-2xl font-bold text-ink-900 dark:text-ink-100">
          {mode === "create" ? "New Invoice" : "Edit Invoice"}
        </h1>
        <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">Total: ${totalAmount.toFixed(2)}</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="description" className="text-sm font-medium text-ink-700 dark:text-ink-200">
            Project Description
          </label>
          <input
            id="description"
            value={formValues.description}
            onChange={(event) => handleField("description", event.target.value)}
            className={inputClass(errors.description)}
          />
          <FieldError message={errors.description} />
        </div>

        <div>
          <label htmlFor="paymentTerms" className="text-sm font-medium text-ink-700 dark:text-ink-200">
            Payment Terms (days)
          </label>
          <input
            id="paymentTerms"
            type="number"
            min="1"
            value={formValues.paymentTerms}
            onChange={(event) => handleField("paymentTerms", event.target.value)}
            className={inputClass()}
          />
        </div>

        <div>
          <label htmlFor="createdAt" className="text-sm font-medium text-ink-700 dark:text-ink-200">
            Created Date
          </label>
          <input
            id="createdAt"
            type="date"
            value={formValues.createdAt}
            onChange={(event) => handleField("createdAt", event.target.value)}
            className={inputClass()}
          />
        </div>

        <div>
          <label htmlFor="paymentDue" className="text-sm font-medium text-ink-700 dark:text-ink-200">
            Payment Due
          </label>
          <input
            id="paymentDue"
            type="date"
            value={formValues.paymentDue}
            onChange={(event) => handleField("paymentDue", event.target.value)}
            className={inputClass()}
          />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="clientName" className="text-sm font-medium text-ink-700 dark:text-ink-200">
            Client Name
          </label>
          <input
            id="clientName"
            value={formValues.clientName}
            onChange={(event) => handleField("clientName", event.target.value)}
            className={inputClass(errors.clientName)}
          />
          <FieldError message={errors.clientName} />
        </div>

        <div>
          <label htmlFor="clientEmail" className="text-sm font-medium text-ink-700 dark:text-ink-200">
            Client Email
          </label>
          <input
            id="clientEmail"
            type="email"
            value={formValues.clientEmail}
            onChange={(event) => handleField("clientEmail", event.target.value)}
            className={inputClass(errors.clientEmail)}
          />
          <FieldError message={errors.clientEmail} />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500 dark:text-ink-300">
            Sender Address
          </h2>
          <div className="grid gap-3">
            {Object.keys(formValues.senderAddress).map((field) => (
              <div key={`sender-${field}`}>
                <label htmlFor={`sender-${field}`} className="text-sm font-medium text-ink-700 dark:text-ink-200">
                  {field}
                </label>
                <input
                  id={`sender-${field}`}
                  value={formValues.senderAddress[field]}
                  onChange={(event) => handleAddressField("senderAddress", field, event.target.value)}
                  className={inputClass(errors[`sender-${field}`])}
                />
                <FieldError message={errors[`sender-${field}`]} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500 dark:text-ink-300">
            Client Address
          </h2>
          <div className="grid gap-3">
            {Object.keys(formValues.clientAddress).map((field) => (
              <div key={`client-${field}`}>
                <label htmlFor={`client-${field}`} className="text-sm font-medium text-ink-700 dark:text-ink-200">
                  {field}
                </label>
                <input
                  id={`client-${field}`}
                  value={formValues.clientAddress[field]}
                  onChange={(event) => handleAddressField("clientAddress", field, event.target.value)}
                  className={inputClass(errors[`client-${field}`])}
                />
                <FieldError message={errors[`client-${field}`]} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-4">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500 dark:text-ink-300">
            Invoice Items
          </h2>
          <button
            type="button"
            onClick={addItem}
            className="rounded-full border border-brand-500 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-400 dark:text-brand-300 dark:hover:bg-brand-900/35"
          >
            Add New Item
          </button>
        </div>

        <div className="space-y-3">
          {formValues.items.map((item, index) => (
            <div key={`item-${index}`} className="rounded-2xl border border-ink-200 p-4 dark:border-ink-700">
              <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
                <div>
                  <label htmlFor={`item-name-${index}`} className="text-sm font-medium text-ink-700 dark:text-ink-200">
                    Name
                  </label>
                  <input
                    id={`item-name-${index}`}
                    value={item.name}
                    onChange={(event) => handleItemField(index, "name", event.target.value)}
                    className={inputClass(errors[`item-${index}-name`])}
                  />
                  <FieldError message={errors[`item-${index}-name`]} />
                </div>

                <div>
                  <label htmlFor={`item-qty-${index}`} className="text-sm font-medium text-ink-700 dark:text-ink-200">
                    Qty
                  </label>
                  <input
                    id={`item-qty-${index}`}
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) => handleItemField(index, "quantity", event.target.value)}
                    className={inputClass(errors[`item-${index}-quantity`])}
                  />
                  <FieldError message={errors[`item-${index}-quantity`]} />
                </div>

                <div>
                  <label htmlFor={`item-price-${index}`} className="text-sm font-medium text-ink-700 dark:text-ink-200">
                    Price
                  </label>
                  <input
                    id={`item-price-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(event) => handleItemField(index, "price", event.target.value)}
                    className={inputClass(errors[`item-${index}-price`])}
                  />
                  <FieldError message={errors[`item-${index}-price`]} />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/25"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <FieldError message={errors.items} />
      </section>

      <div className="flex flex-wrap justify-end gap-3 border-t border-ink-100 pt-5 dark:border-ink-700">
        <button
          type="button"
          disabled={isSaving}
          onClick={() => {
            void submitWithState(true);
          }}
          className="rounded-lg border border-ink-300 px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-ink-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-ink-600 dark:text-ink-200 dark:hover:bg-ink-700"
        >
          Save as Draft
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : mode === "create" ? "Save & Send" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
