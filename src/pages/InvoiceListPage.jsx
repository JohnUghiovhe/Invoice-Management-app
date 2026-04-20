import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { InvoiceCard } from "../components/InvoiceCard";
import { useTheme } from "../context/ThemeContext";
import { listInvoices } from "../lib/api";
import { INVOICE_STATUSES } from "../lib/types";

export function InvoiceListPage() {
  const { theme, toggleTheme } = useTheme();
  const defaultProfileImage =
    "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=160&w=160";
  const [selectedStatuses, setSelectedStatuses] = useState(INVOICE_STATUSES);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(defaultProfileImage);
  const [uploadedProfileUrl, setUploadedProfileUrl] = useState("");
  const dropdownRef = useRef(null);
  const dropdownButtonRef = useRef(null);
  const profileInputRef = useRef(null);

  useEffect(() => {
    if (!selectedStatuses.length) {
      setInvoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    listInvoices(selectedStatuses)
      .then(setInvoices)
      .catch((err) => setError(err.message || "Unable to load invoices"))
      .finally(() => setLoading(false));
  }, [selectedStatuses]);

  useEffect(() => {
    if (!dropdownOpen) {
      return;
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setDropdownOpen(false);
        dropdownButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [dropdownOpen]);

  useEffect(() => {
    return () => {
      if (uploadedProfileUrl) {
        URL.revokeObjectURL(uploadedProfileUrl);
      }
    };
  }, [uploadedProfileUrl]);

  const headingText = useMemo(() => {
    if (loading) {
      return "Loading invoices...";
    }
    return `${invoices.length} invoice${invoices.length === 1 ? "" : "s"}`;
  }, [invoices.length, loading]);

  const handleToggleStatus = (status) => {
    setSelectedStatuses((current) => {
      if (current.includes(status)) {
        return current.filter((item) => item !== status);
      }
      return [...current, status];
    });
  };

  const handleProfileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const nextUrl = URL.createObjectURL(file);
    if (uploadedProfileUrl) {
      URL.revokeObjectURL(uploadedProfileUrl);
    }

    setUploadedProfileUrl(nextUrl);
    setProfileImage(nextUrl);
  };

  return (
    <div className="min-h-screen lg:pl-36">
      <aside className="flex h-20 items-stretch justify-between rounded-tr-xl rounded-br-xl bg-ink-700 pl-0 pr-4 shadow-lg sm:pr-6 lg:hidden">
        <div className="relative h-full w-[72px] bg-brand-500" aria-label="Invoice logo" title="Invoice logo">
          <div className="absolute bottom-0 left-0 h-8 w-full bg-brand-400/55" aria-hidden="true" />
          <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" aria-hidden="true" />
          <div className="absolute left-1/2 top-[26%] h-4 w-4 -translate-x-1/2 bg-brand-500" style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} aria-hidden="true" />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-ink-400/40 bg-ink-600/65 transition hover:border-brand-300 hover:bg-ink-500/80"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className={`h-2.5 w-2.5 rounded-full ${theme === "dark" ? "bg-ink-100" : "bg-brand-300"}`} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => profileInputRef.current?.click()}
            className="group rounded-full ring-2 ring-transparent transition hover:ring-brand-400"
            aria-label="Upload profile picture"
            title="Upload profile picture"
          >
            <img src={profileImage} alt="Profile" className="h-10 w-10 rounded-full border-2 border-ink-500/60 object-cover" />
          </button>
          <input ref={profileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} />
        </div>
      </aside>

      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:w-24 lg:flex-col lg:overflow-hidden lg:rounded-tr-xl lg:rounded-br-xl lg:bg-ink-700 lg:shadow-2xl">
        <div className="relative flex h-24 items-center justify-center bg-brand-500">
          <div className="absolute bottom-0 left-0 h-12 w-full bg-brand-400/55" aria-hidden="true" />
          <div className="relative z-10 h-11 w-11 rounded-full bg-white" aria-hidden="true" />
          <div className="absolute left-1/2 top-[30%] z-20 h-5 w-5 -translate-x-1/2 bg-brand-500" style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} aria-label="Invoice logo" title="Invoice logo" />
        </div>

        <div className="flex flex-1 flex-col justify-end">
          <div className="mb-7 flex items-center justify-center">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-ink-400/40 bg-ink-600/60 transition hover:border-brand-300 hover:bg-ink-500/80"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              <span
                className={`h-2.5 w-2.5 rounded-full ${theme === "dark" ? "bg-ink-100" : "bg-brand-300"}`}
                aria-hidden="true"
              />
            </button>
          </div>

          <div className="border-t border-ink-500/45 py-5">
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => profileInputRef.current?.click()}
                className="group rounded-full ring-2 ring-transparent transition hover:ring-brand-400"
                aria-label="Upload profile picture"
                title="Upload profile picture"
              >
                <img
                  src={profileImage}
                  alt="Profile"
                  className="h-10 w-10 rounded-full border-2 border-ink-500/60 object-cover"
                />
              </button>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfileUpload}
              />
            </div>
          </div>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-5xl animate-rise px-4 pb-6 pt-0 sm:px-6 sm:pb-8 sm:pt-2 lg:px-10 lg:py-12">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-ink-900 dark:text-ink-100">Invoices</h1>
            <p className="mt-1 text-sm font-medium text-ink-500 dark:text-ink-300">{headingText}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className="relative"
              ref={dropdownRef}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setDropdownOpen(false);
                }
              }}
            >
              <button
                ref={dropdownButtonRef}
                type="button"
                onClick={() => setDropdownOpen((open) => !open)}
                className="inline-flex items-center gap-2 text-sm font-bold text-ink-900 transition hover:text-brand-600 dark:text-ink-100 dark:hover:text-brand-300"
                aria-expanded={dropdownOpen}
                aria-controls="status-filter-menu"
                aria-haspopup="true"
              >
                Filter by status
                <span className={`text-brand-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} aria-hidden="true">
                  ▾
                </span>
              </button>

              {dropdownOpen && (
                <div
                  id="status-filter-menu"
                  className="absolute right-0 top-full z-10 mt-3 w-56 rounded-xl border border-ink-200 bg-white p-3 shadow-xl dark:border-ink-700 dark:bg-ink-700"
                >
                  <div className="space-y-2">
                    {INVOICE_STATUSES.map((status) => {
                      const isSelected = selectedStatuses.includes(status);
                      return (
                        <label
                          key={status}
                          className="flex cursor-pointer items-center justify-between border border-ink-200 bg-ink-50 px-3 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-400 hover:bg-brand-50 dark:border-ink-600 dark:bg-ink-800 dark:text-ink-100 dark:hover:bg-brand-700/20"
                        >
                          <span>{status[0].toUpperCase() + status.slice(1)}</span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleStatus(status)}
                            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <Link
              to="/invoice/new"
              className="inline-flex items-center gap-3 rounded-full bg-brand-500 pl-2 pr-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-brand-400"
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-base font-bold leading-none text-brand-500">+
              </span>
              New Invoice
            </Link>
          </div>
        </header>

        <section aria-live="polite" className="space-y-4">
          {loading ? <p className="text-sm text-ink-600 dark:text-ink-300">Loading...</p> : null}

          {error ? (
            <div className="rounded-xl border border-danger-300 bg-danger-100 p-4 text-sm font-medium text-danger-700 dark:border-danger-600 dark:bg-danger-500/20 dark:text-danger-300">
              {error}
            </div>
          ) : null}

          {!loading && !error && !invoices.length ? (
            <div className="rounded-[28px] border border-dashed border-ink-300 bg-white/70 p-10 text-center dark:border-ink-600 dark:bg-ink-800/70">
              <div className="mb-6 flex justify-center">
                <svg width="240" height="200" viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-brand-500">
                  {/* Envelope */}
                  <rect x="30" y="80" width="160" height="100" rx="8" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <path d="M 30 80 L 110 130 L 190 80" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  
                  {/* Person body */}
                  <ellipse cx="110" cy="70" rx="16" fill="currentColor"/>
                  <rect x="98" y="88" width="24" height="35" rx="4" fill="currentColor"/>
                  
                  {/* Person jacket */}
                  <path d="M 98 88 L 85 105 L 85 120 Q 85 125 90 125 L 130 125 Q 135 125 135 120 L 135 105 L 122 88" fill="currentColor" opacity="0.8"/>
                  
                  {/* Megaphone */}
                  <g transform="translate(145, 60)">
                    <circle cx="0" cy="0" r="8" fill="currentColor"/>
                    <path d="M 8 -8 L 20 -15 L 20 15 L 8 8 Q 5 0 8 0" fill="currentColor" opacity="0.8"/>
                    <path d="M -2 -3 L -8 0 L -2 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                  </g>

                  {/* Decorative elements */}
                  <circle cx="35" cy="35" r="4" fill="currentColor" opacity="0.6"/>
                  <rect x="45" y="25" width="8" height="12" rx="2" fill="currentColor" opacity="0.6" transform="rotate(-25 49 31)"/>
                  <path d="M 190 40 L 195 30 L 200 35" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.6" strokeLinecap="round"/>
                  <circle cx="210" cy="50" r="3" fill="currentColor" opacity="0.6"/>
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-ink-900 dark:text-ink-100">There is nothing here</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-600 dark:text-ink-300">
                Create a new invoice by clicking the "New Invoice" button and get started
              </p>
            </div>
          ) : null}

          {invoices.map((invoice) => (
            <InvoiceCard key={invoice.id} invoice={invoice} />
          ))}
        </section>
      </main>
    </div>
  );
}
