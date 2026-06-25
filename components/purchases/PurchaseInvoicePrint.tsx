"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";

interface PurchaseInvoicePrintProps {
  purchase: any;
  onPrint?: () => void;
}

export function PurchaseInvoicePrint({
  purchase,
  onPrint,
}: PurchaseInvoicePrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContent.outerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Reload to restore React state
    onPrint?.();
  };

  if (!purchase) return null;

  const isTelangana =
    purchase.supplierId?.state?.trim().toLowerCase() === "telangana";

  const taxableAmount =
    (purchase.subTotal || 0) -
    (purchase.discountAmount || 0) +
    (purchase.freightCharge || 0);

  const taxRate =
    (purchase.subTotal || 0) > 0
      ? (purchase.totalTax || 0) / purchase.subTotal
      : 0;

  const recalculatedTax = taxableAmount * taxRate;

  const finalTotal = taxableAmount + recalculatedTax;

  const roundedGrandTotal = Math.round(finalTotal);

  const roundOffAmount = roundedGrandTotal - finalTotal;

  // Group items by tax rate for tax table
  const itemsByTax = purchase.items?.reduce((acc: any, item: any) => {
    const baseAmount = item.purchasePrice * item.quantity;
    const taxAmount = (baseAmount * item.taxPercent) / 100;

    if (!acc[item.taxPercent]) {
      acc[item.taxPercent] = {
        rate: item.taxPercent,
        taxableAmt: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
      };
    }

    acc[item.taxPercent].taxableAmt += baseAmount;

    if (isTelangana) {
      acc[item.taxPercent].cgst += taxAmount / 2;
      acc[item.taxPercent].sgst += taxAmount / 2;
    } else {
      acc[item.taxPercent].igst += taxAmount;
    }

    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print Invoice
        </Button>
      </div>

      {/* Print Layout */}
      <div
        ref={printRef}
        className="hidden print:block p-8"
        style={{
          fontFamily: "Arial, sans-serif",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">PURCHASE INVOICE</h1>
          {/* <p className="text-sm text-gray-600">
            {purchase.branchId?.branchName}
          </p>
          <p className="text-sm text-gray-600">
            {purchase.branchId?.address}, {purchase.branchId?.city},{" "}
            {purchase.branchId?.state} - {purchase.branchId?.pincode}
          </p>
          <p className="text-sm text-gray-600">
            GST: {purchase.branchId?.branchGstNumber}
          </p> */}
        </div>

        {/* Invoice Info */}
        <div className="mb-6">
          <div className="flex justify-between">
            <div>
              <p className="text-sm">
                <span className="font-bold">Invoice No:</span>{" "}
                {purchase.invoiceNumber}
              </p>
              <p className="text-sm">
                <span className="font-bold">Invoice Date:</span>{" "}
                {format(new Date(purchase.invoiceDate), "dd MMM yyyy")}
              </p>
              <p className="text-sm">
                <span className="font-bold">Ref. Invoice No:</span>{" "}
                {purchase.referenceInvoiceNumber || "-"}
              </p>
              <p className="text-sm">
                <span className="font-bold">Payment Mode:</span>{" "}
                {purchase.paymentMode || "N/A"}
              </p>
              {purchase.paymentMode === "Pay Later" && purchase.remarks && (
                <p className="text-sm">
                  <span className="font-bold">Remarks:</span> {purchase.remarks}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm">
                <span className="font-bold">Created:</span>{" "}
                {format(new Date(purchase.createdAt), "dd MMM yyyy, hh:mm a")}
              </p>
              <p className="text-sm">
                <span className="font-bold">Status:</span>{" "}
                <span
                  className={
                    purchase.status === "Completed"
                      ? "text-green-600"
                      : "text-yellow-600"
                  }
                >
                  {purchase.status}
                </span>
              </p>
              <p className="text-sm">
                <span className="font-bold">Payment Status:</span>{" "}
                <span
                  className={
                    purchase.paymentStatus === "Paid"
                      ? "text-green-600"
                      : "text-orange-600"
                  }
                >
                  {purchase.paymentStatus || "Pending"}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Supplier Details */}
        <div className="mb-6 p-3 bg-gray-50 rounded">
          <h2 className="font-bold mb-2">Supplier Details:</h2>
          <p className="text-sm">Name: {purchase.supplierId?.name}</p>
          <p className="text-sm">GST: {purchase.supplierId?.gstIn}</p>
          <p className="text-sm">
            Address: {purchase.supplierId?.address}, {purchase.supplierId?.city}
            , {purchase.supplierId?.state} - {purchase.supplierId?.pincode}
          </p>
          <p className="text-sm">
            Contact: {purchase.supplierId?.email} |{" "}
            {purchase.supplierId?.mobile}
          </p>
        </div>

        {/* Items Table */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-black">
              <th className="text-left py-2">Sl No.</th>
              <th className="text-left py-2">Product</th>
              <th className="text-left py-2">Barcode</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Unit</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {purchase.items?.map((item: any, index: number) => {
              const baseAmount = item.purchasePrice * item.quantity;
              const taxAmount = (baseAmount * item.taxPercent) / 100;
              const totalAmount = baseAmount + taxAmount;

              return (
                <tr key={item.productId} className="border-b">
                  <td className="py-2">{index + 1}</td>
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2 font-mono">{item.itemCode}</td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">Pcs.</td>
                  <td className="text-right py-2">
                    ₹{item.purchasePrice.toFixed(2)}
                  </td>
                  <td className="text-right py-2">₹{totalAmount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Tax Table - SGST & CGST */}
        {Object.keys(itemsByTax).length > 0 && (
          <>
            <div className="divider"></div>
            <table className="w-full text-sm mb-6">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left py-2">Tax Rate</th>
                  <th className="text-right py-2">Taxable Amt.</th>
                  {isTelangana ? (
                    <>
                      <th className="text-right py-2">CGST</th>
                      <th className="text-right py-2">SGST</th>
                    </>
                  ) : (
                    <th className="text-right py-2">IGST</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {Object.values(itemsByTax).map((item: any, index: number) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{item.rate}%</td>
                    <td className="text-right py-2">
                      ₹{item.taxableAmt.toFixed(2)}
                    </td>
                    {isTelangana ? (
                      <>
                        <td className="text-right py-2">
                          ₹{item.cgst.toFixed(2)}
                        </td>

                        <td className="text-right py-2">
                          ₹{item.sgst.toFixed(2)}
                        </td>
                      </>
                    ) : (
                      <td className="text-right py-2">
                        ₹{item.igst.toFixed(2)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Summary */}
        <div className="text-right space-y-1 border-t-2 border-black pt-4">
          <p className="text-sm">
            <span className="font-bold w-32">Base Amount:</span>
            <span className="inline-block w-32">
              ₹{purchase.subTotal?.toFixed(2) || "0.00"}
            </span>
          </p>

          {/* Discount Section */}
          {Number(purchase.discountAmount) > 0 && (
            <>
              <p className="text-sm">
                <span className="font-bold w-32">Discount:</span>
                <span className="inline-block w-32 text-red-600">
                  -₹{Number(purchase.discountAmount).toFixed(2)}
                </span>
              </p>

              <p className="text-sm">
                <span className="font-bold w-32">Amount after Discount:</span>
                <span className="inline-block w-32">
                  ₹
                  {(
                    (Number(purchase.subTotal) || 0) -
                    Number(purchase.discountAmount)
                  ).toFixed(2)}
                </span>
              </p>
            </>
          )}
          {/* Freight Charge */}
          {Number(purchase.freightCharge) > 0 && (
            <p className="text-sm">
              <span className="font-bold w-32">Freight Charge:</span>

              <span className="inline-block w-32 text-blue-600">
                +₹{Number(purchase.freightCharge).toFixed(2)}
              </span>
            </p>
          )}

          <p className="text-sm">
            <span className="font-bold w-32">Taxable Amount:</span>

            <span className="inline-block w-32">
              ₹{taxableAmount.toFixed(2)}
            </span>
          </p>

          {isTelangana ? (
            <>
              <p className="text-sm">
                <span className="font-bold w-32">SGST:</span>

                <span className="inline-block w-32">
                  ₹{(recalculatedTax / 2).toFixed(2)}
                </span>
              </p>

              <p className="text-sm">
                <span className="font-bold w-32">CGST:</span>

                <span className="inline-block w-32">
                  ₹{(recalculatedTax / 2).toFixed(2)}
                </span>
              </p>
            </>
          ) : (
            <p className="text-sm">
              <span className="font-bold w-32">IGST:</span>

              <span className="inline-block w-32">
                ₹{recalculatedTax.toFixed(2)}
              </span>
            </p>
          )}

          <p className="text-sm">
            <span className="font-bold w-32">Total Tax:</span>

            <span className="inline-block w-32">
              ₹{recalculatedTax.toFixed(2)}
            </span>
          </p>
          {/* Grand Total (Before Rounding) */}
          <p className="text-sm">
            <span className="font-bold w-32">Grand Total:</span>
            <span className="inline-block w-32">₹{finalTotal.toFixed(2)}</span>
          </p>
          {/* Rounded Off */}
          {roundOffAmount !== 0 && (
            <p className="text-sm">
              <span className="font-bold w-32">Rounded Off:</span>
              <span
                className={`inline-block w-32 ${
                  roundOffAmount > 0 ? "text-blue-600" : "text-red-600"
                }`}
              >
                {roundOffAmount > 0
                  ? `+₹${roundOffAmount.toFixed(2)}`
                  : `-₹${Math.abs(roundOffAmount).toFixed(2)}`}
              </span>
            </p>
          )}
          {/* Final Rounded Total */}
          <p className="text-lg font-bold mt-2 border-t pt-2">
            <span className="w-32">NET PAYABLE:</span>
            <span className="w-32">₹{roundedGrandTotal.toFixed(2)}</span>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm">
          <p className="mb-1">Goods received in good condition</p>
          <div className="flex justify-between mt-8">
            <div className="text-center">
              <p>Receiver's Signature</p>
            </div>
            <div className="text-center">
              <p>Authorised Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
