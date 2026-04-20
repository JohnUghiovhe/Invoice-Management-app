import { type InvoiceErrors, type UpsertInvoicePayload } from "./types";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInvoice(payload: UpsertInvoicePayload): InvoiceErrors {
  const errors: InvoiceErrors = {};

  if (!payload.clientName.trim()) {
    errors.clientName = "Client name is required";
  }

  if (!payload.clientEmail.trim()) {
    errors.clientEmail = "Client email is required";
  } else if (!emailPattern.test(payload.clientEmail)) {
    errors.clientEmail = "Enter a valid email";
  }

  if (!payload.description.trim()) {
    errors.description = "Project description is required";
  }

  if (!payload.items.length) {
    errors.items = "At least one invoice item is required";
  } else {
    payload.items.forEach((item, index) => {
      if (!item.name.trim()) {
        errors[`item-${index}-name`] = "Item name is required";
      }
      if (Number(item.quantity) <= 0) {
        errors[`item-${index}-quantity`] = "Quantity must be greater than 0";
      }
      if (Number(item.price) <= 0) {
        errors[`item-${index}-price`] = "Price must be greater than 0";
      }
    });
  }

  (["street", "city", "postCode", "country"] as const).forEach((field) => {
    if (!payload.senderAddress[field]?.trim()) {
      errors[`sender-${field}`] = "Required";
    }
    if (!payload.clientAddress[field]?.trim()) {
      errors[`client-${field}`] = "Required";
    }
  });

  return errors;
}