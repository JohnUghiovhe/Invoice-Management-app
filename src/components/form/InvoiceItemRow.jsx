import { InputField } from "./InputField";

export function InvoiceItemRow({ index, item, errors, onChange, onRemove }) {
  return (
    <div className="rounded-2xl border border-ink-200 p-4 dark:border-ink-700">
      <div className="grid gap-3 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
        <InputField
          id={`item-name-${index}`}
          label="Name"
          value={item.name}
          onChange={(event) => onChange(index, "name", event.target.value)}
          error={errors[`item-${index}-name`]}
        />

        <InputField
          id={`item-qty-${index}`}
          label="Qty"
          type="number"
          min="1"
          value={item.quantity}
          onChange={(event) => onChange(index, "quantity", event.target.value)}
          error={errors[`item-${index}-quantity`]}
        />

        <InputField
          id={`item-price-${index}`}
          label="Price"
          type="number"
          min="0"
          step="0.01"
          value={item.price}
          onChange={(event) => onChange(index, "price", event.target.value)}
          error={errors[`item-${index}-price`]}
        />

        <div className="flex items-end">
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/25"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
