export type InvoiceStatus = "draft" | "pending" | "paid";

export type Address = {
  street: string;
  city: string;
  postCode: string;
  country: string;
};

export type InvoiceItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
};

export type Invoice = {
  id: string;
  createdAt: string;
  paymentDue: string;
  description: string;
  paymentTerms: number;
  clientName: string;
  clientEmail: string;
  status: InvoiceStatus;
  senderAddress: Address;
  clientAddress: Address;
  items: InvoiceItem[];
  total: number;
};

export type UpsertInvoicePayload = Omit<Invoice, "id" | "status" | "total" | "items"> & {
  status?: InvoiceStatus;
  items: Array<Omit<InvoiceItem, "id" | "total">>;
};

export type InvoiceFormItem = {
  name: string;
  quantity: number | string;
  price: number | string;
};

export type InvoiceFormValues = Omit<UpsertInvoicePayload, "items"> & {
  paymentTerms: number | string;
  items: InvoiceFormItem[];
};

export type InvoiceErrors = Record<string, string>;

export const INVOICE_STATUSES = ["draft", "pending", "paid"] as const satisfies readonly InvoiceStatus[];

export const emptyInvoice = {
  createdAt: new Date().toISOString().slice(0, 10),
  paymentDue: new Date().toISOString().slice(0, 10),
  description: "",
  paymentTerms: 30,
  clientName: "",
  clientEmail: "",
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
  },
  items: [{ name: "", quantity: 1, price: 0 }]
} satisfies InvoiceFormValues;