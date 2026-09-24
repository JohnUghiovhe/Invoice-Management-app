import { mkdirSync } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";
import Database from "better-sqlite3";
import { type Invoice, type InvoiceStatus, type UpsertInvoicePayload } from "../types.js";

const STORE_FILE = path.resolve(
  process.env.INVOICE_STORE_FILE ?? path.join(process.cwd(), "server/store/data.db")
);

let database: Database.Database | null = null;
let databaseInitPromise: Promise<void> | null = null;

export function getStoreFile(): string {
  return STORE_FILE;
}

export function closeDatabase(): void {
  databaseInitPromise = null;
  database?.close();
  database = null;
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
  await ensureSchema();
  const db = getDatabase();

  const record = db
    .prepare("select id, status, payload from invoices where id = ? limit 1")
    .get(id) as InvoiceRow | undefined;

  return record ? parseInvoiceRecord(record) : null;
}

export async function createInvoice(payload: UpsertInvoicePayload, asDraft: boolean): Promise<Invoice> {
  await ensureSchema();
  const db = getDatabase();

  const invoice = toInvoice(payload, undefined, asDraft ? "draft" : "pending");

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

  const db = getDatabase();
  db.prepare("update invoices set status = ?, payload = ? where id = ?").run(
    "paid",
    JSON.stringify(nextInvoice),
    id
  );

  return nextInvoice;
}

export async function deleteInvoice(id: string): Promise<boolean> {
  await ensureSchema();
  const db = getDatabase();

  const result = db.prepare("delete from invoices where id = ?").run(id);
  return result.changes > 0;
}