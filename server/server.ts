import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import {
  createInvoice,
  deleteInvoice,
  getInvoiceById,
  listInvoices,
  markInvoicePaid,
  updateInvoice
} from "./store/invoiceStore";
import { AppError, errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { parseInvoicePayload, parseStatusQuery } from "./validation/invoiceSchema";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/api/invoices", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const statuses = parseStatusQuery(req.query.status);
    const invoices = await listInvoices(statuses);
    res.json(invoices);
  } catch (error) {
    next(error);
  }
});

app.get("/api/invoices/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = String(req.params.id);
    const invoice = await getInvoiceById(invoiceId);

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

app.post("/api/invoices", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = parseInvoicePayload(req.body);
    const asDraft = req.query.draft === "true";
    const invoice = await createInvoice(payload, asDraft);
    res.status(201).json(invoice);
  } catch (error) {
    next(error);
  }
});

app.put("/api/invoices/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = String(req.params.id);
    const payload = parseInvoicePayload(req.body);
    const asDraft = req.query.draft === "true";
    const invoice = await updateInvoice(invoiceId, payload, asDraft);

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

app.patch("/api/invoices/:id/mark-paid", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = String(req.params.id);
    const invoice = await markInvoicePaid(invoiceId);

    if (!invoice) {
      throw new AppError("Invoice not found", 404);
    }

    if (invoice.status !== "paid") {
      throw new AppError("Only pending invoices can be marked as paid", 400);
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/invoices/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoiceId = String(req.params.id);
    const deleted = await deleteInvoice(invoiceId);

    if (!deleted) {
      throw new AppError("Invoice not found", 404);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});
