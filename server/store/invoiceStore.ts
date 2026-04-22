import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";
import postgres from "postgres";
import { type Invoice, type InvoiceStatus, type UpsertInvoicePayload } from "../types";

const DATABASE_SCHEMA = "public";
const DATABASE_TABLE = "invoices";
const STORE_FILE = process.env.INVOICE_STORE_FILE
  ? path.resolve(process.env.INVOICE_STORE_FILE)
  : null;

let databaseClient: ReturnType<typeof postgres> | null = null;
let databaseInitPromise: Promise<void> | null = null;
let activeDatabaseUrl: string | null = null;

function getDatabaseUrl() {
  const value = process.env.DATABASE_URL?.trim();
  return value && value.length > 0 ? value : null;
}

function hasDatabaseConfig() {
  return Boolean(getDatabaseUrl());
}

function getDatabaseClient() {
  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    throw new Error("Database is not configured. Set DATABASE_URL to your Supabase connection string.");
  }

  if (activeDatabaseUrl && activeDatabaseUrl !== connectionString) {
    databaseClient = null;
    databaseInitPromise = null;
  }

  if (!databaseClient) {
    databaseClient = postgres(connectionString, {
      max: 1,
      idle_timeout: 20,
      connect_timeout: 10,
      ssl: "require",
      prepare: false
    });
    activeDatabaseUrl = connectionString;
  }

  return databaseClient;
}

function hasFileStoreConfig() {
  return Boolean(STORE_FILE);
}

async function ensureStore(): Promise<void> {
  if (!STORE_FILE) {
    throw new Error("DATABASE_URL is required. Set INVOICE_STORE_FILE only for tests or local file-based debugging.");
  }

  await mkdir(path.dirname(STORE_FILE), { recursive: true });

  try {
    await readFile(STORE_FILE, "utf-8");
  } catch {
    await writeFile(STORE_FILE, "[]", "utf-8");
  }
}

async function ensureDatabaseSchema(): Promise<void> {
  if (!hasDatabaseConfig()) {
    return;
  }

  if (!databaseInitPromise) {
    databaseInitPromise = (async () => {
      const sql = getDatabaseClient();

      await sql.unsafe(`
        create table if not exists public.invoices (
          id text primary key,
          status text not null check (status in ('draft', 'pending', 'paid')),
          payload jsonb not null,
          created_at timestamptz not null default now(),
          updated_at timestamptz not null default now()
        )
      `);

      await sql.unsafe(`
        create or replace function public.set_invoice_updated_at()
        returns trigger
        language plpgsql
        as $$
        begin
          new.updated_at = now();
          return new;
        end;
        $$
      `);

      await sql.unsafe(`drop trigger if exists invoices_set_updated_at on public.invoices`);

      await sql.unsafe(`
        create trigger invoices_set_updated_at
        before update on public.invoices
        for each row
        execute function public.set_invoice_updated_at()
      `);
    })();
  }

  await databaseInitPromise;
}

function parseInvoiceRecord(record: { payload: unknown }): Invoice {
  return typeof record.payload === "string"
    ? JSON.parse(record.payload) as Invoice
    : record.payload as Invoice;
}

async function readInvoices(): Promise<Invoice[]> {
  if (hasDatabaseConfig()) {
    await ensureDatabaseSchema();

    const sql = getDatabaseClient();
    const invoices = await sql`
      select payload
      from ${sql.unsafe("public.invoices")}
      order by created_at asc
    `;

    return (invoices as unknown as Array<{ payload: unknown }>).map(parseInvoiceRecord);
  }

  if (!hasFileStoreConfig()) {
    throw new Error("DATABASE_URL is required for invoice storage.");
  }

  const storeFile = STORE_FILE as string;
  await ensureStore();
  const raw = await readFile(storeFile, "utf-8");
  return JSON.parse(raw) as Invoice[];
}

async function writeInvoices(invoices: Invoice[]): Promise<void> {
  if (hasDatabaseConfig()) {
    return;
  }

  if (!hasFileStoreConfig()) {
    throw new Error("DATABASE_URL is required for invoice storage.");
  }

  const storeFile = STORE_FILE as string;
  await ensureStore();
  await writeFile(storeFile, JSON.stringify(invoices, null, 2), "utf-8");
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
  if (hasDatabaseConfig()) {
    await ensureDatabaseSchema();

    const sql = getDatabaseClient();
    const invoices = await sql`
      select payload
      from ${sql.unsafe("public.invoices")}
      where status = any(${statuses})
      order by created_at asc
    `;

    return (invoices as unknown as Array<{ payload: unknown }>).map(parseInvoiceRecord);
  }

  const invoices = await readInvoices();
  return invoices.filter((invoice) => statuses.includes(invoice.status));
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (hasDatabaseConfig()) {
    await ensureDatabaseSchema();

    const sql = getDatabaseClient();
    const invoices = await sql`
      select payload
      from ${sql.unsafe("public.invoices")}
      where id = ${id}
      limit 1
    `;

    const [record] = invoices as unknown as Array<{ payload: unknown }>;
    return record ? parseInvoiceRecord(record) : null;
  }

  const invoices = await readInvoices();
  return invoices.find((invoice) => invoice.id === id) ?? null;
}

export async function createInvoice(payload: UpsertInvoicePayload, asDraft: boolean): Promise<Invoice> {
  if (hasDatabaseConfig()) {
    await ensureDatabaseSchema();

    const sql = getDatabaseClient();
    const invoice = toInvoice(payload, undefined, asDraft ? "draft" : "pending");
    await sql`
      insert into ${sql.unsafe("public.invoices")} ${sql(
        { id: invoice.id, status: invoice.status, payload: invoice },
        "id",
        "status",
        "payload"
      )}
    `;

    return invoice;
  }

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
  if (hasDatabaseConfig()) {
    await ensureDatabaseSchema();

    const sql = getDatabaseClient();
    const current = await getInvoiceById(id);

    if (!current) {
      return null;
    }

    const nextStatus: InvoiceStatus = current.status === "paid" ? "paid" : asDraft ? "draft" : "pending";
    const invoice = toInvoice(payload, current.id, nextStatus);
    await sql`
      update ${sql.unsafe("public.invoices")}
      set ${sql({ status: invoice.status, payload: invoice }, "status", "payload")}
      where id = ${id}
    `;

    return invoice;
  }

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
  if (hasDatabaseConfig()) {
    await ensureDatabaseSchema();

    const sql = getDatabaseClient();
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

    await sql`
      update ${sql.unsafe("public.invoices")}
      set ${sql({ status: "paid", payload: nextInvoice }, "status", "payload")}
      where id = ${id}
    `;

    return nextInvoice;
  }

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
  if (hasDatabaseConfig()) {
    await ensureDatabaseSchema();

    const sql = getDatabaseClient();
    const invoices = await sql`
      delete from ${sql.unsafe("public.invoices")}
      where id = ${id}
      returning id
    `;

    return (invoices as unknown as Array<{ id: string }>).length > 0;
  }

  const invoices = await readInvoices();
  const nextInvoices = invoices.filter((invoice) => invoice.id !== id);

  if (nextInvoices.length === invoices.length) {
    return false;
  }

  await writeInvoices(nextInvoices);
  return true;
}
