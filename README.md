# Invoice Management App

A full-stack invoice management app with invoice CRUD, status workflows, filtering, validation, dark/light theme persistence, and responsive UI.

## Quick Start

For first-time reviewers, run only these 4 commands:

```bash
git clone <your-repo-url>
cd "Invoice Management App"
npm install
npm run dev
```

## Table of Contents

- Overview
- Feature Set
- Tech Stack
- Project Structure
- Architecture
- Data Model
- API Reference
- Setup Instructions
- Running the App
- Testing
- Build and Production
- Validation Strategy
- Accessibility Notes
- Trade-offs and Design Decisions
- Improvements Beyond Requirements
- Known Limitations
- Suggested Next Improvements

## Overview

This project covers the full invoice lifecycle:

- Create, read, update, and delete invoices
- Save drafts and submit pending invoices
- Mark pending invoices as paid
- Filter by status (draft, pending, paid)
- Persist theme preference across reloads

It uses React + TypeScript + Tailwind on the client and Express + TypeScript on the server.

## Feature Set

### Core Features

- Invoice CRUD
- Save as draft
- Mark as paid
- Status filtering
- Theme toggle with persistence
- Mobile-first responsive layout

### UX and Reliability Features

- Client-side validation with inline field errors
- Server-side Zod validation and normalized error responses
- Reusable form primitives to reduce duplication
- Confirmation modal for destructive actions
- Centralized backend error middleware
- Desktop sidebar with uploadable profile picture and responsive top bar navigation on tablet/mobile

## Tech Stack

### Frontend

- React 18
- TypeScript
- React Router DOM 6
- Tailwind CSS 3
- Vite 7

### Backend

- Node.js
- Express 5
- TypeScript
- Zod
- nanoid

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
│  │  └─ data.json
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
├─ vite.config.ts
├─ vitest.config.mts
├─ tailwind.config.cjs
├─ tsconfig.json
└─ tsconfig.server.json
```

## Architecture

### High-Level Flow

```text
React UI
  -> api.ts fetch client
  -> Express routes (/api/*)
  -> validation (Zod + query parser)
  -> store/business logic
  -> JSON persistence (server/store/data.json)
```

### Frontend Architecture

- Route-driven pages: list, detail, create/edit form.
- Shared UI components for cards, badges, and modal; status filtering lives in the invoice list header dropdown.
- Reusable form primitives: InputField, FieldError, AddressSection, InvoiceItemRow.
- Local state for page concerns; ThemeContext for global theme only.

### Backend Architecture

- app.ts defines API surface and delegates to store/validation layers.
- invoiceStore.ts owns persistence and invoice status business rules.
- invoiceSchema.ts validates payloads and parses status query filters.
- errorHandler.ts centralizes app and validation error responses.

This separation keeps handlers small and logic easier to test.

## Data Model

Statuses:

- draft, pending, paid

Invoice shape:

```ts
type Invoice = {
  id: string;
  createdAt: string;   // YYYY-MM-DD
  paymentDue: string;  // YYYY-MM-DD
  description: string;
  paymentTerms: number;
  clientName: string;
  clientEmail: string;
  status: "draft" | "pending" | "paid";
  senderAddress: Address;
  clientAddress: Address;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  total: number;
};
```

## API Reference

Base path: /api

### Health

- GET /health -> { status: "ok" }

### Invoices

- GET /invoices
- GET /invoices?status=draft,pending,paid
- GET /invoices/:id
- POST /invoices?draft=true|false
- PUT /invoices/:id?draft=true|false
- PATCH /invoices/:id/mark-paid
- DELETE /invoices/:id

### Status Logic Behavior

- Create:
  - draft=true -> draft
  - draft=false -> pending
- Update:
  - paid remains paid
  - non-paid resolves to draft or pending via query flag
- Mark as paid:
  - only pending can transition to paid

## Setup Instructions

### Prerequisites

- Node.js 18+
- npm 9+

### Install

```bash
npm install
```

### Optional environment variables

- PORT: API port (default 4000)
- INVOICE_STORE_FILE: custom path for JSON store (useful in tests)

PowerShell example:

```powershell
$env:PORT="4000"
$env:INVOICE_STORE_FILE="C:\temp\data.json"
```

## Running the App

### Main dev command

```bash
npm run dev
```

Expected endpoints:

- API: http://localhost:4000, Client: http://localhost:5173 (or next available port)

### Run each process separately

```bash
npm run dev:server
npm run dev:client
```

### Script reference

- npm run dev, npm run dev:server, npm run dev:client, npm run build, npm run build:client, npm run build:server, npm test, npm run test:watch, npm start

## Testing

Run all tests:

```bash
npm test
```

Coverage in this project:

- tests/validation.test.ts
  - valid invoice returns no errors
  - invalid payload returns field-specific errors
- tests/api.test.ts
  - status filtering behavior
  - create -> mark-paid -> delete lifecycle

Test isolation note:

- API tests use a temporary store file via INVOICE_STORE_FILE to avoid mutating local data.

## Build and Production

Build both client and server:

```bash
npm run build
```

Start production server:

```bash
npm start
```

Artifacts:

- Frontend static assets are generated by Vite.
- Backend runtime is emitted to dist/server.js.

## Netlify Deployment

This app is configured for single-site Netlify deployment:

- Frontend served as static assets from `dist`
- API served by a Netlify Function at `netlify/functions/api.ts`
- Client requests to `/api/*` are rewritten to the function via `netlify.toml`

### Netlify build settings

- Build command: `npm run build:client`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Node version: `20.19.0` (configured in `netlify.toml`)

### Deploy steps

1. Push the repository to GitHub.
2. In Netlify, choose Add new site -> Import an existing project.
3. Select this repository and branch.
4. Confirm Netlify detected `netlify.toml` settings.
5. Deploy the site.
6. Verify:
  - SPA routes load correctly after refresh.
  - `GET /api/health` returns `{ status: "ok" }`.
  - Invoice CRUD flows work in the UI.

### Data persistence note for Netlify

Netlify Functions use ephemeral storage. By default, this app stores invoice JSON in `/tmp/invoice-store/data.json` on Netlify, which is not durable across cold starts/deploys.

For persistent production data, move storage to an external database (recommended) or external durable storage service.

## Validation Strategy

Validation runs at two layers.

### Client-side

- Implemented in src/lib/validation.ts
- Immediate feedback before submit
- Checks required fields, email format, item count, quantity/price constraints, and address completeness

### Server-side

- Implemented in server/validation/invoiceSchema.ts with Zod
- Rejects malformed or invalid payloads
- Keeps API behavior reliable for any client

### Why both

- Better UX on the frontend
- Stronger data integrity on the backend

## Accessibility Notes

Accessibility measures included:

- Semantic inputs with associated labels
- Keyboard-usable interactive elements
- ConfirmModal uses role="dialog", aria-modal="true", and aria-labelledby
- Escape closes modal through reusable hook
- Focus trap keeps tab navigation within modal while open
- Initial modal focus is moved to a tabbable element
- Status filter dropdown closes on Escape and returns focus to the trigger
- Light/dark themes maintain usable visual hierarchy

Recommended next step for a11y confidence:

- Add automated audits (axe/Lighthouse) in CI.

## Trade-offs and Design Decisions

### JSON file persistence instead of database

- Decision: persist invoices in server/store/data.json
- Benefit: zero infra setup and easy inspection
- Trade-off: limited scalability and concurrent write safety

### CommonJS backend output

- Decision: TypeScript backend compiles to CommonJS
- Benefit: straightforward Node runtime execution
- Trade-off: less ESM-native ergonomics

### Local state-first frontend

- Decision: keep state local except theme context
- Benefit: lower complexity for current app size
- Trade-off: may need broader state strategy as features grow

### Dual validation

- Decision: validate on both client and server
- Benefit: UX + robust API boundaries
- Trade-off: duplicated rule maintenance

### Reusable form primitives

- Decision: compose InvoiceForm from smaller shared components
- Benefit: cleaner structure and less duplicate JSX
- Trade-off: small abstraction overhead for simple cases

## Improvements Beyond Requirements

Already implemented beyond baseline CRUD:

- Reusable form architecture (InputField, FieldError, AddressSection, InvoiceItemRow)
- API helper layer for consistent request/error handling
- Global backend error middleware
- Health endpoint for monitoring checks
- Modal keyboard handling and focus management
- Test isolation using temporary store file
- Dedicated Vitest config for stable test execution
- Guardrails for status transitions

## Known Limitations

- No authentication or authorization
- JSON storage is not ideal for high-concurrency production use
- No pagination or full-text search
- No offline/optimistic update strategy
- React Router future warnings may appear during development

## Suggested Next Improvements

- Move persistence to PostgreSQL (or similar DB)
- Add authentication and role-based permissions
- Add end-to-end tests with Playwright or Cypress
- Add OpenAPI documentation and contract checks
- Add CI pipeline for lint, test, build, and security scans
- Add containerized deployment setup
- Add status/audit history tracking
