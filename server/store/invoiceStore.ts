import { mkdirSync } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import Database from "better-sqlite3";
import { type Invoice, type InvoiceStatus, type UpsertInvoicePayload } from "../types.js";

const NETLIFY_STORE_NAME = "invoice-management-app";
const NETLIFY_DATA_KEY = "invoices";

const STORE_FILE = path.resolve(
  process.env.INVOICE_STORE_FILE ?? path.join(process.cwd(), "server/store/data.db")
);

let database: Database.Database | null = null;
let databaseInitPromise: Promise<void> | null = null;
let netlifyStorePromise: Promise<import("@netlify/blobs").Store | null> | null = null;

export function getStoreFile(): string {
  return STORE_FILE;
}

export function closeDatabase(): void {
  databaseInitPromise = null;
  database?.close();
  database = null;
}

function isNetlifyRuntime(): boolean {
  return process.env.NETLIFY === "true" || Boolean(process.env.NETLIFY_BLOBS_ACCESS_TOKEN);
}

function getBlobsStore(): Promise<import("@netlify/blobs").Store | null> {
  if (!netlifyStorePromise) {
    netlifyStorePromise = import("@netlify/blobs")
      .then(({ getStore }) => getStore({ name: NETLIFY_STORE_NAME, consistency: "strong" }))
      .catch((error: unknown) => {
        // eslint-disable-next-line no-console
        console.error("Failed to initialize Netlify Blobs store:", error);
        return null;
      });
  }

  return netlifyStorePromise;
}

async function readNetlifyInvoices(): Promise<Invoice[]> {
  const store = await getBlobsStore();

  if (!store) {
    return [];
  }

  const invoices = await store.get(NETLIFY_DATA_KEY, { type: "json" });
  return Array.isArray(invoices) ? (invoices as Invoice[]) : [];
}

async function writeNetlifyInvoices(invoices: Invoice[]): Promise<void> {
  const store = await getBlobsStore();

  if (!store) {
    throw new Error("Netlify Blobs store is unavailable");
  }

  await store.setJSON(NETLIFY_DATA_KEY, invoices);
}

function getDatabase(): Database.Database {
  if (!database) {
    mkdirSync(path.dirname(STORE_FILE), { recursive: true });
    database = new Database(STORE_FILE);
  }

  return database;
}

function ensureSchema(): Promise<void> {
  if (!databaseInitPromise) {
    databaseInitPromise = Promise.resolve().then(() => {
      const db = getDatabase();
      db.exec(`
        create table if not exists invoices (
          id text primary key,
          status text not null check (status in ('draft', 'pending', 'paid')),
          payload text not null
        );
        create index if not exists invoices_status_idx on invoices(status);
      `);
    });
  }

  return databaseInitPromise;
}

type InvoiceRow = {
  id: string;
  status: string;
  payload: string;
};

function parseInvoiceRecord(record: InvoiceRow): Invoice {
  return JSON.parse(record.payload) as Invoice;
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
  if (isNetlifyRuntime()) {
    const invoices = await readNetlifyInvoices();
    return invoices.filter((invoice) => statuses.includes(invoice.status));
  }

  if (statuses.length === 0) {
    return [];
  }

  await ensureSchema();
  const db = getDatabase();

  const placeholders = statuses.map(() => "?").join(", ");
  const rows = db
    .prepare(`select id, status, payload from invoices where status in (${placeholders}) order by rowid asc`)
    .all(...statuses) as InvoiceRow[];

  return rows.map(parseInvoiceRecord);
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (isNetlifyRuntime()) {
    const invoices = await readNetlifyInvoices();
    return invoices.find((invoice) => invoice.id === id) ?? null;
  }

  await ensureSchema();
  const db = getDatabase();

  const record = db
    .prepare("select id, status, payload from invoices where id = ? limit 1")
    .get(id) as InvoiceRow | undefined;

  return record ? parseInvoiceRecord(record) : null;
}

export async function createInvoice(payload: UpsertInvoicePayload, asDraft: boolean): Promise<Invoice> {
  const invoice = toInvoice(payload, undefined, asDraft ? "draft" : "pending");

  if (isNetlifyRuntime()) {
    const invoices = await readNetlifyInvoices();
    invoices.push(invoice);
    await writeNetlifyInvoices(invoices);
    return invoice;
  }

  await ensureSchema();
  const db = getDatabase();
  db.prepare("insert into invoices (id, status, payload) values (?, ?, ?)").run(
    invoice.id,
    invoice.status,
    JSON.stringify(invoice)
  );

  return invoice;
}

export async function updateInvoice(
  id: string,
  payload: UpsertInvoicePayload,
  asDraft: boolean
): Promise<Invoice | null> {
  if (isNetlifyRuntime()) {
    const invoices = await readNetlifyInvoices();
    const index = invoices.findIndex((invoice) => invoice.id === id);

    if (index === -1) {
      return null;
    }

    const current = invoices[index];
    const nextStatus: InvoiceStatus = current.status === "paid" ? "paid" : asDraft ? "draft" : "pending";

    invoices[index] = toInvoice(payload, current.id, nextStatus);
    await writeNetlifyInvoices(invoices);
    return invoices[index];
  }

  await ensureSchema();
  const db = getDatabase();

  const current = db.prepare("select id, status from invoices where id = ?").get(id) as
    | { id: string; status: InvoiceStatus }
    | undefined;

  if (!current) {
    return null;
  }

  const nextStatus: InvoiceStatus = current.status === "paid" ? "paid" : asDraft ? "draft" : "pending";
  const invoice = toInvoice(payload, current.id, nextStatus);

  db.prepare("update invoices set status = ?, payload = ? where id = ?").run(
    invoice.status,
    JSON.stringify(invoice),
    id
  );

  return invoice;
}

export async function markInvoicePaid(id: string): Promise<Invoice | null> {
  const current = await getInvoiceById(id);

  if (!current) {
    return null;
  }

  if (current.status !== "pending") {
    return current;
  }

  const nextInvoice: Invoice = {
    ...current,
    status: "paid"
  };

  if (isNetlifyRuntime()) {
    const invoices = await readNetlifyInvoices();
    const index = invoices.findIndex((invoice) => invoice.id === id);

    if (index === -1) {
      return null;
    }

    invoices[index] = nextInvoice;
    await writeNetlifyInvoices(invoices);
    return invoices[index];
  }

  const db = getDatabase();
  db.prepare("update invoices set status = ?, payload = ? where id = ?").run(
    "paid",
    JSON.stringify(nextInvoice),
    id
  );

  return nextInvoice;
}

export async function deleteInvoice(id: string): Promise<boolean> {
  if (isNetlifyRuntime()) {
    const invoices = await readNetlifyInvoices();
    const nextInvoices = invoices.filter((invoice) => invoice.id !== id);

    if (nextInvoices.length === invoices.length) {
      return false;
    }

    await writeNetlifyInvoices(nextInvoices);
    return true;
  }

  await ensureSchema();
  const db = getDatabase();

  const result = db.prepare("delete from invoices where id = ?").run(id);
  return result.changes > 0;
}