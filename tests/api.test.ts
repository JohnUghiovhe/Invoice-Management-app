import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const seedInvoices = [
  {
    id: "INV-001",
    createdAt: "2026-04-01",
    paymentDue: "2026-04-30",
    description: "Website redesign",
    paymentTerms: 30,
    clientName: "Karla Santos",
    clientEmail: "karla@example.com",
    status: "pending",
    senderAddress: {
      street: "42 Marina Quays",
      city: "Lagos",
      postCode: "100001",
      country: "Nigeria"
    },
    clientAddress: {
      street: "11 Bridgeview Street",
      city: "Victoria Island",
      postCode: "106104",
      country: "Nigeria"
    },
    items: [
      {
        id: "item-1",
        name: "UI direction and wireframes",
        quantity: 1,
        price: 1200,
        total: 1200
      }
    ],
    total: 1200
  },
  {
    id: "INV-002",
    createdAt: "2026-04-03",
    paymentDue: "2026-04-18",
    description: "Mobile app illustration pack",
    paymentTerms: 15,
    clientName: "Amina Yusuf",
    clientEmail: "amina@example.com",
    status: "draft",
    senderAddress: {
      street: "8 Unity Road",
      city: "Abuja",
      postCode: "900211",
      country: "Nigeria"
    },
    clientAddress: {
      street: "16 Flower Gate",
      city: "Wuse",
      postCode: "900281",
      country: "Nigeria"
    },
    items: [
      {
        id: "item-2",
        name: "Brand illustrations",
        quantity: 2,
        price: 650,
        total: 1300
      }
    ],
    total: 1300
  },
  {
    id: "INV-003",
    createdAt: "2026-03-26",
    paymentDue: "2026-04-10",
    description: "Analytics dashboard setup",
    paymentTerms: 14,
    clientName: "Musa Bello",
    clientEmail: "musa@example.com",
    status: "paid",
    senderAddress: {
      street: "17 Herbert Macaulay",
      city: "Kaduna",
      postCode: "800001",
      country: "Nigeria"
    },
    clientAddress: {
      street: "2 Riverbend Close",
      city: "Kubwa",
      postCode: "900108",
      country: "Nigeria"
    },
    items: [
      {
        id: "item-3",
        name: "Dashboard UI build",
        quantity: 1,
        price: 2500,
        total: 2500
      }
    ],
    total: 2500
  }
];

let tempDir;
let storeFile;
let app;

beforeAll(async () => {
  tempDir = await mkdtemp(path.join(os.tmpdir(), "invoice-app-tests-"));
  storeFile = path.join(tempDir, "invoices.json");
  await writeFile(storeFile, JSON.stringify(seedInvoices, null, 2), "utf-8");
  process.env.INVOICE_STORE_FILE = storeFile;

  ({ app } = await import("../server/app"));
});

afterAll(async () => {
  delete process.env.INVOICE_STORE_FILE;
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

describe("invoice API", () => {
  it("returns the seeded invoices and supports status filtering", async () => {
    const response = await request(app).get("/api/invoices?status=paid");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].status).toBe("paid");
  });

  it("creates a draft invoice, marks it as paid, and deletes it", async () => {
    const payload = {
      createdAt: "2026-04-20",
      paymentDue: "2026-05-20",
      description: "Homepage content refresh",
      paymentTerms: 30,
      clientName: "Ngozi Umeh",
      clientEmail: "ngozi@example.com",
      senderAddress: {
        street: "10 Allen Avenue",
        city: "Lagos",
        postCode: "101233",
        country: "Nigeria"
      },
      clientAddress: {
        street: "4 Ocean Drive",
        city: "Lekki",
        postCode: "106104",
        country: "Nigeria"
      },
      items: [{ name: "Copywriting", quantity: 1, price: 750 }]
    };

    const createResponse = await request(app).post("/api/invoices?draft=true").send(payload);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.status).toBe("draft");

    const markPaidResponse = await request(app).patch(`/api/invoices/${createResponse.body.id}/mark-paid`);
    expect(markPaidResponse.status).toBe(200);
    expect(markPaidResponse.body.status).toBe("paid");

    const deleteResponse = await request(app).delete(`/api/invoices/${createResponse.body.id}`);
    expect(deleteResponse.status).toBe(204);

    const stored = JSON.parse(await readFile(storeFile, "utf-8"));
    expect(stored.find((invoice) => invoice.id === createResponse.body.id)).toBeUndefined();
  });
});
