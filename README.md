# Invoice Management App

A full-stack invoice management app with invoice CRUD, draft/pending/paid workflows, filtering, validation, and a responsive UI.

## Overview

The app is built with React + TypeScript on the client and Express + TypeScript on the server. Persistence uses an embedded SQLite database through `better-sqlite3`, so no external database service is required in dev or production. The schema is created automatically on first use; the database lives in a single local file.

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
- better-sqlite3 (embedded SQLite)

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
  -> embedded SQLite database
```

### Server Design

- `app.ts` defines the API surface.
- `invoiceSchema.ts` validates request bodies and status query strings.
- `invoiceStore.ts` owns persistence and business rules.
- `errorHandler.ts` normalizes validation and app errors.

## Database

The app uses an embedded SQLite database (via `better-sqlite3`); there is no external database service.

- The database file defaults to `server/store/data.db` and is created automatically on first use.
- The `invoices` table is created with a `CHECK` on status (`draft`, `pending`, `paid`) and stores the full invoice JSON in a `payload` column.
- Set `INVOICE_STORE_FILE` to any writable path to relocate the database file (this is how tests isolate themselves, and how you'd point at a persistent volume in production).

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

Because SQLite is a local file database, production needs a persistent filesystem. The recommended setup is a long-running Node server (e.g. Railway, a VPS, or a container) with a mounted volume:

1. Push the repository to your host.
2. Set `INVOICE_STORE_FILE` to a path inside the persistent volume (e.g. `/data/invoices.db`).
3. Run `npm run build && npm start`.

### Netlify note

Netlify Functions run on ephemeral filesystems, so a file-based SQLite database does **not** persist across function invocations there. Use the standalone server deployment above if you need durable storage.

## Troubleshooting

- If the app fails to start, confirm you are on Node 22.12+ (`node -v`).
- If writes appear to be lost, verify `INVOICE_STORE_FILE` points to a persistent volume on your host.
- To reset local data, stop the server and delete `server/store/data.db` (the schema is recreated on the next start).

## Notes

- Production should run on a long-running server with a persistent volume for the SQLite file.
- The app no longer depends on PostgreSQL, Supabase, Netlify Blobs, or any external database.