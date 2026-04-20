import { FieldError } from "./FieldError";

const baseInputClass =
  "mt-1 w-full rounded-2xl border bg-white px-4 py-2.5 text-sm text-ink-900 outline-none transition focus:ring-2 dark:bg-ink-900 dark:text-ink-100";

export function inputClass(error) {
  return `${baseInputClass} ${
    error
      ? "border-red-500 focus:border-red-500 focus:ring-red-300 dark:border-red-400"
      : "border-ink-300 focus:border-brand-500 focus:ring-brand-200 dark:border-ink-600"
  }`;
}

export function InputField({ id, label, error, className, ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-ink-700 dark:text-ink-200">
        {label}
      </label>
      <input id={id} className={inputClass(error)} {...props} />
      <FieldError message={error} />
    </div>
  );
}
