// components/billing/A4Invoice.tsx
"use client";

import { useRef } from "react";
import { format } from "date-fns";
import { Billing } from "@/lib/api/billing";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface A4InvoiceProps {
  billing: Billing;
  onPrinted?: () => void;
}

export function A4Invoice({ billing, onPrinted }: A4InvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!invoiceRef.current) return;

    const printContent = invoiceRef.current.outerHTML;

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${billing.invoiceNumber}</title>
            <style>
              @page {
                size: A4;
                margin: 15mm;
              }
              body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 0;
                font-size: 12px;
                line-height: 1.4;
                color: #333;
              }
              .invoice-container {
                max-width: 100%;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 2px solid #000;
              }
              .store-name {
                font-size: 24px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 5px;
              }
              .store-details {
                font-size: 11px;
                color: #666;
              }
              .invoice-title {
                font-size: 18px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
              }
              .info-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 20px;
                gap: 20px;
              }
              .info-box {
                flex: 1;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 5px;
                background-color: #f9f9f9;
              }
              .info-label {
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 14px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              th, td {
                border: 1px solid #ddd;
                padding: 10px;
                text-align: left;
              }
              th {
                background-color: #f5f5f5;
                font-weight: bold;
              }
              .text-right {
                text-align: right;
              }
              .text-center {
                text-align: center;
              }
              .totals {
                width: 350px;
                margin-left: auto;
                margin-top: 20px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
              }
              .grand-total {
                font-weight: bold;
                font-size: 16px;
                border-top: 2px solid #000;
                margin-top: 10px;
                padding-top: 10px;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 10px;
                color: #999;
                border-top: 1px solid #ddd;
                padding-top: 20px;
              }
              .amount-words {
                margin-top: 20px;
                padding: 10px;
                background-color: #f9f9f9;
                border-left: 4px solid #4CAF50;
              }
              @media print {
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() {
                  window.parent.document.body.removeChild(window.frameElement);
                  window.parent.${
                    onPrinted ? "window.parent.location.reload()" : ""
                  };
                }, 1000);
              }
            </script>
          </body>
        </html>
      `);
      iframeDoc.close();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Safely get values with fallbacks
  const finalTotal = billing.finalTotal || billing.grandTotal || 0;
  const roundedGrandTotal = Math.round(finalTotal);
  const subTotal = billing.subTotal ?? 0;
  const discountAmount = billing.discountAmount ?? 0;
  const discountPercentage = billing.discount ?? 0;
  const freightCharge = billing.freightCharge ?? 0;
  const totalTax = billing.totalTax ?? 0;
  const amountAfterDiscount = subTotal - discountAmount;
  const taxableAmount = amountAfterDiscount + freightCharge;

  // Helper function to safely get branch details
  const getBranchName = () => {
    if (billing.branchId && typeof billing.branchId === "object") {
      return billing.branchId.branchName || "RETAIL CRAFT";
    }
    return "RETAIL CRAFT";
  };

  const getBranchAddress = () => {
    if (billing.branchId && typeof billing.branchId === "object") {
      const { address, city, state, pincode } = billing.branchId;
      return `${address || "Store Address"}, ${city || "City"}, ${
        state || "State"
      } - ${pincode || "000000"}`;
    }
    return "Store Address, City, State - 000000";
  };

  const getBranchPhone = () => {
    if (billing.branchId && typeof billing.branchId === "object") {
      return billing.branchId.branchPhoneNumber || "N/A";
    }
    return "N/A";
  };

  const getBranchGST = () => {
    if (billing.branchId && typeof billing.branchId === "object") {
      return billing.branchId.branchGstNumber || "N/A";
    }
    return "N/A";
  };

  const isTelangana =
    billing.customerId?.state?.trim().toLowerCase() === "telangana";

  const itemsByTax = billing.items.reduce((acc: any, item) => {
    const taxableAmt = item.price * item.quantity;
    const taxAmount = (taxableAmt * item.taxPercent) / 100;

    if (!acc[item.taxPercent]) {
      acc[item.taxPercent] = {
        rate: item.taxPercent,
        taxableAmt: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
      };
    }

    acc[item.taxPercent].taxableAmt += taxableAmt;

    if (isTelangana) {
      acc[item.taxPercent].cgst += taxAmount / 2;
      acc[item.taxPercent].sgst += taxAmount / 2;
    } else {
      acc[item.taxPercent].igst += taxAmount;
    }

    return acc;
  }, {});

  return (
    <div>
      <div className="no-print mb-4 text-right">
        <Button onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" />
          Print Invoice
        </Button>
      </div>

      <div ref={invoiceRef} className="invoice-container">
        {/* Header - Fixed to handle missing branch details */}
        <div className="header">
          <div className="store-name">{getBranchName()}</div>
          <div className="store-details">
            {getBranchAddress()}
            <br />
            Phone: {getBranchPhone()} | GST: {getBranchGST()}
          </div>
        </div>

        <div className="invoice-title">TAX INVOICE</div>

        {/* Invoice Info */}
        <div className="info-section">
          <div className="info-box">
            <div className="info-label">Invoice Details</div>
            <div>
              <strong>Invoice No:</strong> {billing.invoiceNumber || "N/A"}
            </div>
            <div>
              <strong>Invoice Date:</strong>{" "}
              {billing.invoiceDate
                ? format(new Date(billing.invoiceDate), "dd/MM/yyyy")
                : format(new Date(billing.createdAt), "dd/MM/yyyy hh:mm a")}
            </div>
            {billing.createdAt && (
              <div>
                <strong>Generated On:</strong>{" "}
                {format(new Date(billing.createdAt), "dd/MM/yyyy hh:mm a")}
              </div>
            )}
            <div>
              <strong>Payment Mode:</strong> {billing.paymentMode || "N/A"}
            </div>
            <div>
              <strong>Payment Status:</strong>{" "}
              {billing.paymentStatus || "Pending"}
            </div>
            <div>
              <strong>Invoice Type:</strong> {billing.invoiceType || "J1"}
            </div>
          </div>
          <div className="info-box">
            <div className="info-label">Customer Details</div>
            <div>
              <strong>Name:</strong> {billing.customerId?.name || "N/A"}
            </div>
            <div>
              <strong>Mobile:</strong> {billing.customerId?.mobile || "N/A"}
            </div>
            {billing.customerId?.email && (
              <div>
                <strong>Email:</strong> {billing.customerId?.email}
              </div>
            )}
            <div>
              <strong>Type:</strong> {billing.customerId?.customerType || "N/A"}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <table>
          <thead>
            <tr>
              <th style={{ width: "5%" }}>Sl No.</th>
              <th style={{ width: "45%" }}>Product</th>
              <th style={{ width: "10%" }} className="text-center">
                Qty
              </th>
              <th style={{ width: "10%" }} className="text-center">
                Unit
              </th>
              <th style={{ width: "20%" }} className="text-right">
                Price
              </th>
              <th style={{ width: "20%" }} className="text-right">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {billing.items.map((item, index) => (
              <tr key={index}>
                <td>{index + 1}</td>
                <td>
                  {item.productName}
                  <div style={{ fontSize: "10px", color: "#666" }}>
                    Code: {item.itemCode}
                  </div>
                </td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-center">Pcs.</td>
                <td className="text-right">{formatCurrency(item.price)}</td>
                <td className="text-right">
                  {formatCurrency(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Tax Table */}
        {Object.keys(itemsByTax).length > 0 && (
          <table style={{ width: "50%", marginLeft: "auto" }}>
            <thead>
              <tr>
                <th>Tax Rate</th>
                <th className="text-right">Taxable Amt.</th>

                {isTelangana ? (
                  <>
                    <th className="text-right">CGST</th>
                    <th className="text-right">SGST</th>
                  </>
                ) : (
                  <th className="text-right">IGST</th>
                )}
              </tr>
            </thead>
            <tbody>
              {Object.values(itemsByTax).map((item: any, index) => (
                <tr key={index}>
                  <td>{item.rate}%</td>
                  <td className="text-right">
                    {formatCurrency(item.taxableAmt)}
                  </td>

                  {isTelangana ? (
                    <>
                      <td className="text-right">
                        {formatCurrency(item.cgst)}
                      </td>

                      <td className="text-right">
                        {formatCurrency(item.sgst)}
                      </td>
                    </>
                  ) : (
                    <td className="text-right">{formatCurrency(item.igst)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Summary */}
        <div className="totals">
          <div className="total-row">
            <span>Base Amount:</span>
            <span>{formatCurrency(subTotal)}</span>
          </div>

          {discountPercentage > 0 && (
            <>
              <div className="total-row">
                <span>Discount ({discountPercentage}%):</span>
                <span style={{ color: "#e74c3c" }}>
                  -{formatCurrency(discountAmount)}
                </span>
              </div>
              <div className="total-row">
                <span>Amount after Discount:</span>
                <span>{formatCurrency(amountAfterDiscount)}</span>
              </div>
            </>
          )}

          {freightCharge > 0 && (
            <div className="total-row">
              <span>Freight Charge:</span>
              <span>+{formatCurrency(freightCharge)}</span>
            </div>
          )}

          <div className="total-row">
            <span>Taxable Amount:</span>
            <span>{formatCurrency(taxableAmount)}</span>
          </div>

          {isTelangana ? (
            <>
              <div className="total-row">
                <span>CGST:</span>
                <span>{formatCurrency(totalTax / 2)}</span>
              </div>

              <div className="total-row">
                <span>SGST:</span>
                <span>{formatCurrency(totalTax / 2)}</span>
              </div>
            </>
          ) : (
            <div className="total-row">
              <span>IGST:</span>
              <span>{formatCurrency(totalTax)}</span>
            </div>
          )}

          <div className="total-row">
            <span>Total Tax:</span>
            <span>{formatCurrency(totalTax)}</span>
          </div>

          <div className="total-row">
            <span>Grand Total:</span>
            <span>{formatCurrency(finalTotal)}</span>
          </div>

          <div className="grand-total">
            <span>NET PAYABLE:</span>
            <span>{formatCurrency(roundedGrandTotal)}</span>
          </div>
        </div>

        {/* Amount in Words */}
        <div className="amount-words">
          <strong>{numberToWords(roundedGrandTotal)} Only</strong>
        </div>

        {/* Footer */}
        <div className="footer">
          <div>Thank you for your business!</div>
          <div style={{ fontSize: "9px", marginTop: "5px" }}>
            This is a computer generated invoice.
          </div>
        </div>
      </div>
    </div>
  );
}

function numberToWords(num: number): string {
  const units = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  if (num === 0) return "Zero";

  const convertLessThanThousand = (n: number): string => {
    if (n === 0) return "";
    if (n < 10) return units[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      return (
        tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + units[n % 10] : "")
      );
    }
    return (
      units[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "")
    );
  };

  let result = "";
  let remainingNum = Math.round(num);

  if (remainingNum >= 100000) {
    result +=
      convertLessThanThousand(Math.floor(remainingNum / 100000)) + " Lakh ";
    remainingNum %= 100000;
  }
  if (remainingNum >= 1000) {
    result +=
      convertLessThanThousand(Math.floor(remainingNum / 1000)) + " Thousand ";
    remainingNum %= 1000;
  }
  if (remainingNum > 0) {
    result += convertLessThanThousand(remainingNum);
  }

  return result.trim();
}
