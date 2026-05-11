// app/invoice/page.tsx
import { Suspense } from "react";
import InvoiceRedirect from "./InvoiceRedirect";

export default function InvoicePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <InvoiceRedirect />
    </Suspense>
  );
}
