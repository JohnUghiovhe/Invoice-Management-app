import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import Database from "better-sqlite3";
import type { Invoice } from "../types.js";
import { getStoreFile } from "./invoiceStore.js";

const sourcePath = process.argv[2] ?? path.resolve(process.cwd(), "server/store/data.json");

async function run() {
  const raw = await readFile(sourcePath, "utf-8");
  const invoices = JSON.parse(raw) as Invoice[];

  const storeFile = getStoreFile();
  const sql: Database.Database = new Database(storeFile);

  sql.exec(`
    create table if not exists invoices (
      id text primary key,
      status text not null check (status in ('draft', 'pending', 'paid')),
      payload text not null
    );
    create index if not exists invoices_status_idx on invoices(status);
  `);

  const upsert = sql.prepare(`
    insert into invoices (id, status, payload)
    values (@id, @status, @payload)
    on conflict(id)
    do update set
      status = excluded.status,
      payload = excluded.payload
  `);

  let upserted = 0;

  const apply = sql.transaction((items: Invoice[]) => {
    for (const invoice of items) {
      upsert.run({
        id: invoice.id,
        status: invoice.status,
        payload: JSON.stringify(invoice)
      });
      upserted += 1;
    }
  });

  apply(invoices);

  const result = sql.prepare("select count(*) as count from invoices").get() as { count: number };

  console.log(
    JSON.stringify({
      sourcePath,
      storeFile,
      imported: invoices.length,
      upserted,
      finalCount: result.count ?? 0
    })
  );

  sql.close();
}

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});