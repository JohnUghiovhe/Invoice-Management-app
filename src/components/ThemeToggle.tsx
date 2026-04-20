import { useTheme } from "../context/ThemeContext";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink-300 bg-white/85 text-xl text-ink-900 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-400 hover:bg-white dark:border-ink-600 dark:bg-ink-700 dark:text-ink-100 dark:hover:bg-ink-600"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <span aria-hidden="true" className="leading-none">
        {theme === "dark" ? "◐" : "◑"}
      </span>
    </button>
  );
}