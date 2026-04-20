import type { Invoice, UpsertInvoicePayload } from "./types";

const API_BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({ message: "Request failed" }))) as { message?: string };
    throw new Error(payload.message || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json() as Promise<T>;
}

export function listInvoices(statuses: readonly string[] = []) {
  const query = statuses.length ? `?status=${encodeURIComponent(statuses.join(","))}` : "";
  return request<Invoice[]>(`/invoices${query}`);
}

export function getInvoice(id: string) {
  return request<Invoice>(`/invoices/${id}`);
}

export function createInvoice(payload: UpsertInvoicePayload, asDraft = false) {
  return request<Invoice>(`/invoices?draft=${asDraft}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateInvoice(id: string, payload: UpsertInvoicePayload, asDraft = false) {
  return request<Invoice>(`/invoices/${id}?draft=${asDraft}`, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function removeInvoice(id: string) {
  return request<void>(`/invoices/${id}`, {
    method: "DELETE"
  });
}

export function markAsPaid(id: string) {
  return request<Invoice>(`/invoices/${id}/mark-paid`, {
    method: "PATCH"
  });
}