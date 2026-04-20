import { FieldError } from "./FieldError";

const baseInputClass =
  "mt-1 h-12 w-full rounded-lg border px-4 text-sm font-semibold outline-none transition-colors focus:ring-0";

export function inputClass(error) {
  return `${baseInputClass} ${
    error
      ? "border-danger-500 bg-white text-ink-800 focus:border-danger-500 dark:border-danger-400 dark:bg-ink-700 dark:text-ink-100"
      : "border-ink-200 bg-white text-ink-800 hover:border-brand-300 focus:border-brand-500 dark:border-ink-600 dark:bg-ink-700 dark:text-ink-100 dark:hover:border-brand-300 dark:focus:border-brand-500"
  }`;
}

export function InputField({ id, label, error, className, ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="text-xs font-semibold tracking-wide text-ink-700 dark:text-ink-200">
        {label}
      </label>
      <input id={id} className={inputClass(error)} {...props} />
      <FieldError message={error} />
    </div>
  );
}
