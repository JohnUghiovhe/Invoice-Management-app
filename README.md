# Invoice Management App

A full-stack invoice management app with invoice CRUD, draft/pending/paid workflows, filtering, validation, and a responsive UI.

## Overview

The app is built with React + TypeScript on the client and Express + TypeScript on the server. Invoice persistence now uses PostgreSQL through the `postgres` package, which works well with a Supabase database connection string on Netlify or locally.

If `DATABASE_URL` is missing, the server falls back to a local JSON file store for development and test isolation. That fallback is not intended for production.

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
- React Router DOM 6
- Tailwind CSS 3
- Vite 7

### Backend

- Node.js 20+
- Express 5
- TypeScript
- Zod
- nanoid
- postgres

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
│  │  └─ schema.sql
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
  -> PostgreSQL or local JSON fallback
```

### Server Design

- `app.ts` defines the API surface.
- `invoiceSchema.ts` validates request bodies and status query strings.
- `invoiceStore.ts` owns persistence and business rules.
- `errorHandler.ts` normalizes validation and app errors.

## Database Setup

The app expects a Supabase Postgres connection string in `DATABASE_URL`.

### Automatic schema bootstrap

When `DATABASE_URL` is set, the server creates the `public.invoices` table and trigger automatically on first use.

### Manual schema

You can also run [server/store/schema.sql](server/store/schema.sql) directly in your SQL editor.

### Required table shape

- `id` text primary key
- `status` text check constrained to `draft`, `pending`, or `paid`
- `payload` jsonb containing the full invoice object
- `created_at` timestamptz
- `updated_at` timestamptz

## Environment Variables

Create a local `.env` file with:

```env
DATABASE_URL=
PORT=4000
```

Optional:

- `INVOICE_STORE_FILE` for a custom JSON fallback path during tests or debugging

The server and Netlify function both load `.env` automatically.

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

Tests use a temporary `INVOICE_STORE_FILE` so they do not touch your local database.

## Netlify Deployment

### Build settings

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

### Environment variables in Netlify

- `DATABASE_URL` with your Supabase connection string
- `PORT` if you want to override the default locally

### Deployment flow

1. Push the repository to GitHub.
2. Import the repo into Netlify.
3. Add `DATABASE_URL` in Netlify site settings.
4. Deploy.
5. Verify the API through `/api/health` and the invoice CRUD screens.

## Troubleshooting

- If `netlify build` is not recognized in PowerShell, run `npx netlify-cli build` or install Netlify CLI globally.
- If the app cannot connect to Postgres, verify that `DATABASE_URL` is set and includes the correct Supabase password and `sslmode=require`.
- If you want to reset local fallback data, delete the generated file at `server/store/data.json` or point `INVOICE_STORE_FILE` elsewhere.

## Notes

- Production should use PostgreSQL.
- The file fallback only exists to keep local development and tests simple when no database is configured.
- The app no longer depends on Netlify Blobs or the Supabase JS client.
