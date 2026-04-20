import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import { type Invoice, type InvoiceStatus, type UpsertInvoicePayload } from "../types";

const STORE_DIR = path.resolve(process.cwd(), "server", "store");
const STORE_FILE = path.join(STORE_DIR, "invoices.json");

async function ensureStore(): Promise<void> {
  await mkdir(STORE_DIR, { recursive: true });

  try {
    await readFile(STORE_FILE, "utf-8");
  } catch {
    await writeFile(STORE_FILE, "[]", "utf-8");
  }
}

async function readInvoices(): Promise<Invoice[]> {
  await ensureStore();
  const raw = await readFile(STORE_FILE, "utf-8");
  return JSON.parse(raw) as Invoice[];
}

async function writeInvoices(invoices: Invoice[]): Promise<void> {
  await ensureStore();
  await writeFile(STORE_FILE, JSON.stringify(invoices, null, 2), "utf-8");
}

function toInvoice(payload: UpsertInvoicePayload, existingId?: string, nextStatus?: InvoiceStatus): Invoice {
  const items = payload.items.map((item) => {
    const total = Number((item.quantity * item.price).toFixed(2));

    return {
      id: nanoid(8),
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      total
    };
  });

  const total = Number(items.reduce((sum, item) => sum + item.total, 0).toFixed(2));

  return {
    id: existingId ?? nanoid(6).toUpperCase(),
    createdAt: payload.createdAt,
    paymentDue: payload.paymentDue,
    description: payload.description,
    paymentTerms: payload.paymentTerms,
    clientName: payload.clientName,
    clientEmail: payload.clientEmail,
    status: nextStatus ?? payload.status ?? "pending",
    senderAddress: payload.senderAddress,
    clientAddress: payload.clientAddress,
    items,
    total
  };
}

export async function listInvoices(statuses: InvoiceStatus[]): Promise<Invoice[]> {
  const invoices = await readInvoices();
  return invoices.filter((invoice) => statuses.includes(invoice.status));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const invoices = await readInvoices();
  return invoices.find((invoice) => invoice.id === id) ?? null;
}

export async function createInvoice(payload: UpsertInvoicePayload, asDraft: boolean): Promise<Invoice> {
  const invoices = await readInvoices();
  const invoice = toInvoice(payload, undefined, asDraft ? "draft" : "pending");
  invoices.push(invoice);
  await writeInvoices(invoices);
  return invoice;
}

export async function updateInvoice(
  id: string,
  payload: UpsertInvoicePayload,
  asDraft: boolean
): Promise<Invoice | null> {
  const invoices = await readInvoices();
  const index = invoices.findIndex((invoice) => invoice.id === id);

  if (index === -1) {
    return null;
  }

  const current = invoices[index];
  const nextStatus: InvoiceStatus = current.status === "paid" ? "paid" : asDraft ? "draft" : "pending";

  invoices[index] = toInvoice(payload, current.id, nextStatus);

  await writeInvoices(invoices);
  return invoices[index];
}

export async function markInvoicePaid(id: string): Promise<Invoice | null> {
  const invoices = await readInvoices();
  const index = invoices.findIndex((invoice) => invoice.id === id);

  if (index === -1) {
    return null;
  }

  const invoice = invoices[index];

  if (invoice.status !== "pending") {
    return invoice;
  }

  invoices[index] = {
    ...invoice,
    status: "paid"
  };

  await writeInvoices(invoices);
  return invoices[index];
}

export async function deleteInvoice(id: string): Promise<boolean> {
  const invoices = await readInvoices();
  const nextInvoices = invoices.filter((invoice) => invoice.id !== id);

  if (nextInvoices.length === invoices.length) {
    return false;
  }

  await writeInvoices(nextInvoices);
  return true;
}
