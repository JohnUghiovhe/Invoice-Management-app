type FieldErrorProps = {
  message?: string;
};

export function FieldError({ message }: FieldErrorProps) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-danger-600 dark:text-danger-300">{message}</p>;
}