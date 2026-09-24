# Invoice Management App

A full-stack invoice management app with invoice CRUD, draft/pending/paid workflows, filtering, validation, and a responsive UI.

## Overview

The app is built with React + TypeScript on the client and Express + TypeScript on the server. Persistence needs no external database service: it uses an embedded SQLite database (via `better-sqlite3`) in local development, and Netlify Blobs (Netlify's own managed storage) when the API runs as a Netlify Function.

## Feature Set

- Create, read, update, and delete invoices
- Save as draft or submit as pending
- Mark pending invoices as paid
- Filter invoices by status
- Server-side validation with Zod
- Theme persistence on the client
- Responsive layout for desktop and mobile

## Tech Stack

### Frontend

- React 18
- TypeScript
- React Router DOM 7
- Tailwind CSS 3
- Vite 7

### Backend

- Node.js 22+
- Express 5
- TypeScript (native ESM)
- Zod
- nanoid
- better-sqlite3 (embedded SQLite, local dev)
- @netlify/blobs (durable storage on Netlify Functions)

### Testing

- Vitest
- Supertest

## Project Structure

```text
.
├─ server/
│  ├─ app.ts
│  ├─ server.ts
│  ├─ middleware/errorHandler.ts
│  ├─ store/
│  │  ├─ invoiceStore.ts
│  │  └─ importInvoices.ts
│  ├─ validation/invoiceSchema.ts
│  └─ types.ts
├─ src/
│  ├─ App.tsx
│  ├─ main.tsx
│  ├─ index.css
│  ├─ pages/
│  │  ├─ InvoiceListPage.tsx
│  │  ├─ InvoiceDetailPage.tsx
│  │  └─ InvoiceFormPage.tsx
│  ├─ components/
│  │  ├─ ConfirmModal.tsx
│  │  ├─ InvoiceCard.tsx
│  │  ├─ InvoiceForm.tsx
│  │  ├─ StatusBadge.tsx
│  │  ├─ ThemeToggle.tsx
│  │  └─ form/
│  │     ├─ AddressSection.tsx
│  │     ├─ FieldError.tsx
│  │     ├─ InputField.tsx
│  │     └─ InvoiceItemRow.tsx
│  ├─ context/ThemeContext.tsx
│  ├─ hooks/useEscClose.ts
│  └─ lib/
│     ├─ api.ts
│     ├─ format.ts
│     ├─ types.ts
│     └─ validation.ts
├─ tests/
│  ├─ api.test.ts
│  └─ validation.test.ts
├─ netlify/
│  └─ functions/api.ts
├─ netlify.toml
├─ vite.config.ts
├─ vitest.config.mts
└─ tailwind.config.cjs
```

## Architecture

### Request Flow

```text
React UI
  -> api.ts fetch client
  -> Express routes (/api/*)
  -> validation layer
  -> invoice store
  -> SQLite (local server) or Netlify Blobs (Netlify Functions)
```

### Server Design

- `app.ts` defines the API surface.
- `invoiceSchema.ts` validates request bodies and status query strings.
- `invoiceStore.ts` owns persistence and business rules.
- `errorHandler.ts` normalizes validation and app errors.

## Database

The store adapts to the runtime automatically.

### Local development (standalone server)

Uses an embedded SQLite database (via `better-sqlite3`):

- The database file defaults to `server/store/data.db` and is created automatically on first use.
- The `invoices` table is created with a `CHECK` on status (`draft`, `pending`, `paid`) and stores the full invoice JSON in a `payload` column.
- Set `INVOICE_STORE_FILE` to any writable path to relocate the database file (this is how tests isolate themselves, and how you'd point at a persistent volume).

### Netlify Functions

When the API runs inside a Netlify Function (`process.env.NETLIFY === "true"`), persistence switches to [Netlify Blobs](https://docs.netlify.com/blobs/overview/):

- All invoices are stored under a single `invoices` key in a store named `invoice-management-app`.
- No extra setup is required — the Functions runtime supplies the Blobs credentials automatically, and data persists across cold starts.
- This is what makes the deployed site durable on Netlify despite its ephemeral filesystem.

### Importing existing JSON data

[JSON files from the legacy file store or Postgres exports](server/store/importInvoices.ts) can be imported with:

```bash
npx tsx server/store/importInvoices.ts path/to/invoices.json
```

## Environment Variables

Create a local `.env` file with:

```env
PORT=4000
```

Optional:

- `INVOICE_STORE_FILE` for a custom SQLite database path (required on platforms without a persistent working directory, e.g. a mounted volume).

The server loads `.env` automatically.

## Running Locally

### Install

```bash
npm install
```

### Start both client and server

```bash
npm run dev
```

### Start each process separately

```bash
npm run dev:server
npm run dev:client
```

### Production build

```bash
npm run build
```

### Production start

```bash
npm start
```

## API Reference

Base path: `/api`

### Health

- `GET /health` -> `{ status: "ok" }`

### Invoices

- `GET /invoices`
- `GET /invoices?status=draft,pending,paid`
- `GET /invoices/:id`
- `POST /invoices?draft=true|false`
- `PUT /invoices/:id?draft=true|false`
- `PATCH /invoices/:id/mark-paid`
- `DELETE /invoices/:id`

### Status Rules

- New invoices are `pending` unless `draft=true` is passed.
- Updating a paid invoice keeps it paid.
- Only pending invoices can be marked paid.

## Testing

```bash
npm test
```

Tests use a temporary SQLite file so they do not touch your local database.

## Deployment

Two runtimes are supported:

### Netlify

1. Connect the GitHub repo to Netlify (build command `npm run build`, publish dir `dist`, functions dir `netlify/functions`).
2. Deploy. The API runs as a Netlify Function and persists data to Netlify Blobs automatically. No environment variables are required.
3. Verify `/api/health` and the invoice CRUD screens.

### Long-running server

To run the standalone server (e.g. Railway, a VPS, or a container):

1. Set `INVOICE_STORE_FILE` to a path inside a persistent volume (e.g. `/data/invoices.db`).
2. Run `npm run build && npm start`.

## Troubleshooting

- If the app fails to start, confirm you are on Node 22.12+ (`node -v`).
- If writes appear to be lost, verify `INVOICE_STORE_FILE` points to a persistent volume on your host.
- To reset local data, stop the server and delete `server/store/data.db` (the schema is recreated on the next start).

## Notes

- Local development uses embedded SQLite; Netlify deployments use Netlify Blobs.
- The app no longer depends on PostgreSQL, Supabase, or any third-party database service.