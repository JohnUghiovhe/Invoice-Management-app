import "dotenv/config";
import { readFile } from "node:fs/promises";
import postgres from "postgres";
import type { Invoice } from "../types";

const sourcePath = process.argv[2] ?? "C:/Users/ughio/Documents/data.json";

async function run() {
  const databaseUrl = process.env.DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing in .env");
  }

  const raw = await readFile(sourcePath, "utf-8");
  const invoices = JSON.parse(raw) as Invoice[];

  const sql = postgres(databaseUrl, {
    ssl: "require",
    max: 1,
    prepare: false
  });

  await sql.unsafe(`
    create table if not exists public.invoices (
      id text primary key,
      status text not null check (status in ('draft', 'pending', 'paid')),
      payload jsonb not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  let upserted = 0;

  for (const invoice of invoices) {
    await sql`
      insert into public.invoices (id, status, payload)
      values (${invoice.id}, ${invoice.status}, ${JSON.stringify(invoice)}::jsonb)
      on conflict (id)
      do update set
        status = excluded.status,
        payload = excluded.payload
    `;

    upserted += 1;
  }

  const countResult = await sql<{ count: number }[]>`
    select count(*)::int as count
    from public.invoices
  `;

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      sourcePath,
      imported: invoices.length,
      upserted,
      finalCount: countResult[0]?.count ?? 0
    })
  );

  await sql.end();
}

run().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
