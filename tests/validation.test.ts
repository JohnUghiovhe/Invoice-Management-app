import { describe, expect, it } from "vitest";
import { validateInvoice } from "../src/lib/validation";

function buildValidInvoice() {
  return {
    createdAt: "2026-04-20",
    paymentDue: "2026-05-20",
    description: "Landing page redesign",
    paymentTerms: 30,
    clientName: "Ada Okafor",
    clientEmail: "ada@example.com",
    senderAddress: {
      street: "12 Opebi Road",
      city: "Lagos",
      postCode: "100281",
      country: "Nigeria"
    },
    clientAddress: {
      street: "18 Admiralty Way",
      city: "Lekki",
      postCode: "106104",
      country: "Nigeria"
    },
    items: [{ name: "Homepage design", quantity: 2, price: 450 }]
  };
}

describe("validateInvoice", () => {
  it("returns no errors for a valid invoice payload", () => {
    expect(validateInvoice(buildValidInvoice())).toEqual({});
  });

  it("reports required-field and item validation errors", () => {
    const errors = validateInvoice({
      ...buildValidInvoice(),
      clientName: "",
      clientEmail: "not-an-email",
      items: [{ name: "", quantity: 0, price: -10 }],
      senderAddress: {
        street: "",
        city: "",
        postCode: "",
        country: ""
      },
      clientAddress: {
        street: "",
        city: "",
        postCode: "",
        country: ""
      }
    }) as unknown as Record<string, string>;

    expect(errors.clientName).toBe("Client name is required");
    expect(errors.clientEmail).toBe("Enter a valid email");
    expect(errors["item-0-name"]).toBe("Item name is required");
    expect(errors["item-0-quantity"]).toBe("Quantity must be greater than 0");
    expect(errors["item-0-price"]).toBe("Price must be greater than 0");
    expect(errors["sender-street"]).toBe("Required");
    expect(errors["client-street"]).toBe("Required");
  });
});
