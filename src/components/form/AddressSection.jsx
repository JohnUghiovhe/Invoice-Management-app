import { InputField } from "./InputField";

const addressFields = ["street", "city", "postCode", "country"];

export function AddressSection({ title, prefix, values, errors, onChange }) {
  return (
    <div>
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500 dark:text-ink-300">{title}</h2>
      <div className="grid gap-3">
        {addressFields.map((field) => {
          const id = `${prefix}-${field}`;

          return (
            <InputField
              key={id}
              id={id}
              label={field}
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
