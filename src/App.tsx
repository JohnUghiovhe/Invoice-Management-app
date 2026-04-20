import { Navigate, Route, Routes } from "react-router-dom";
import { InvoiceDetailPage } from "./pages/InvoiceDetailPage";
import { InvoiceFormPage } from "./pages/InvoiceFormPage";
import { InvoiceListPage } from "./pages/InvoiceListPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<InvoiceListPage />} />
      <Route path="/invoice/new" element={<InvoiceFormPage />} />
      <Route path="/invoice/:id" element={<InvoiceDetailPage />} />
      <Route path="/invoice/:id/edit" element={<InvoiceFormPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}