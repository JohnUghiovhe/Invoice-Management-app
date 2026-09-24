import { z } from "zod";
import { type InvoiceStatus, type UpsertInvoicePayload } from "../types.js";

const addressSchema = z.object({
  street: z.string().trim().min(1, "Street is required"),
  city: z.string().trim().min(1, "City is required"),
  postCode: z.string().trim().min(1, "Post code is required"),
  country: z.string().trim().min(1, "Country is required")
});

const itemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required"),
  quantity: z.number().positive("Quantity must be greater than 0"),
  price: z.number().positive("Price must be greater than 0")
});

export const invoiceSchema = z.object({
  createdAt: z.string().date("Created date is invalid"),
  paymentDue: z.string().date("Payment due date is invalid"),
  description: z.string().trim().min(1, "Description is required"),
  paymentTerms: z.number().int().positive("Payment terms must be greater than 0"),
  clientName: z.string().trim().min(1, "Client name is required"),
  clientEmail: z.string().trim().email("Client email is invalid"),
  senderAddress: addressSchema,
  clientAddress: addressSchema,
  items: z.array(itemSchema).min(1, "At least one invoice item is required")
});

export function parseInvoicePayload(input: unknown): UpsertInvoicePayload {
  return invoiceSchema.parse(input);
}

export function parseStatusQuery(statusValue: unknown): InvoiceStatus[] {
  if (typeof statusValue !== "string" || statusValue.trim().length === 0 || statusValue === "all") {
    return ["draft", "pending", "paid"];
  }

  const statuses = statusValue
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const filtered = statuses.filter((value): value is InvoiceStatus => {
    return value === "draft" || value === "pending" || value === "paid";
  });

  return filtered.length > 0 ? filtered : ["draft", "pending", "paid"];
}
