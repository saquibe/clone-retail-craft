// app/invoice/InvoiceRedirect.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function InvoiceRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const invoiceCode = searchParams.get("INV");

    if (invoiceCode) {
      // Redirect to the clean URL format
      router.replace(`/invoice/${invoiceCode}`);
    } else {
      // No invoice code provided, redirect to home
      router.replace("/");
    }
  }, [searchParams, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting to invoice...</p>
      </div>
    </div>
  );
}
