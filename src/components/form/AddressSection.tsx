import { InputField } from "./InputField";
import { type Address, type InvoiceErrors } from "../../lib/types";

const addressFields = ["street", "city", "postCode", "country"] as const;
const addressLabels: Record<(typeof addressFields)[number], string> = {
  street: "Street Address",
  city: "City",
  postCode: "Post Code",
  country: "Country"
};

type AddressSectionProps = {
  title: string;
  prefix: string;
  values: Address;
  errors: InvoiceErrors;
  onChange: (field: (typeof addressFields)[number], value: string) => void;
};

export function AddressSection({ title, prefix, values, errors, onChange }: AddressSectionProps) {
  return (
    <div>
      <h2 className="mb-2 text-sm font-extrabold uppercase tracking-[0.18em] text-ink-900 dark:text-ink-100">{title}</h2>
      <div className="grid gap-3">
        {addressFields.map((field) => {
          const id = `${prefix}-${field}`;

          return (
            <InputField
              key={id}
              id={id}
              label={addressLabels[field]}
              value={values[field]}
              onChange={(event) => onChange(field, event.target.value)}
              error={errors[id]}
            />
          );
        })}
      </div>
    </div>
  );
}