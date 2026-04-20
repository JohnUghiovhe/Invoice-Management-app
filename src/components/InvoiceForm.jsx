import { useMemo, useState } from "react";
import { validateInvoice } from "../lib/validation";
import { AddressSection } from "./form/AddressSection";
import { FieldError } from "./form/FieldError";
import { InputField } from "./form/InputField";
import { InvoiceItemRow } from "./form/InvoiceItemRow";

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
        <InputField
          id="description"
          label="Project Description"
          value={formValues.description}
          onChange={(event) => handleField("description", event.target.value)}
          error={errors.description}
        />

        <InputField
          id="paymentTerms"
          label="Payment Terms (days)"
          type="number"
          min="1"
          value={formValues.paymentTerms}
          onChange={(event) => handleField("paymentTerms", event.target.value)}
        />

        <InputField
          id="createdAt"
          label="Created Date"
          type="date"
          value={formValues.createdAt}
          onChange={(event) => handleField("createdAt", event.target.value)}
        />

        <InputField
          id="paymentDue"
          label="Payment Due"
          type="date"
          value={formValues.paymentDue}
          onChange={(event) => handleField("paymentDue", event.target.value)}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <InputField
          id="clientName"
          label="Client Name"
          value={formValues.clientName}
          onChange={(event) => handleField("clientName", event.target.value)}
          error={errors.clientName}
        />

        <InputField
          id="clientEmail"
          label="Client Email"
          type="email"
          value={formValues.clientEmail}
          onChange={(event) => handleField("clientEmail", event.target.value)}
          error={errors.clientEmail}
        />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <AddressSection
          title="Sender Address"
          prefix="sender"
          values={formValues.senderAddress}
          errors={errors}
          onChange={(field, value) => handleAddressField("senderAddress", field, value)}
        />

        <AddressSection
          title="Client Address"
          prefix="client"
          values={formValues.clientAddress}
          errors={errors}
          onChange={(field, value) => handleAddressField("clientAddress", field, value)}
        />
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
            <InvoiceItemRow
              key={`item-${index}`}
              index={index}
              item={item}
              errors={errors}
              onChange={handleItemField}
              onRemove={removeItem}
            />
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
