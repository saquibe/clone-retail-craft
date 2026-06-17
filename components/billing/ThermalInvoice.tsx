//app/components/billing/ThermalInvoice.tsx
//redeploy
"use client";

import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { Billing } from "@/lib/api/billing";

interface ThermalInvoiceProps {
  billing: Billing;
  onPrinted?: () => void;
}

export function ThermalInvoice({ billing, onPrinted }: ThermalInvoiceProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-print when component mounts
    const printInvoice = () => {
      if (invoiceRef.current) {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Invoice ${billing.invoiceNumber}</title>
                <style>
                  @page {
                    size: 80mm auto;
                    margin: 0;
                  }
                  body {
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 5px;
                    width: 72mm;
                    font-size: 10px;
                    line-height: 1.3;
                    background: white;
                  }
                  .store-section {
                    text-align: center;
                    margin-bottom: 8px;
                    border-bottom: 1px dashed #000;
                    padding-bottom: 6px;
                  }
                  .store-name {
                    font-size: 16px;
                    font-weight: bold;
                    text-transform: uppercase;
                    margin-bottom: 2px;
                    letter-spacing: 0.5px;
                  }
                  .store-address {
                    font-size: 8px;
                    margin: 2px 0;
                    line-height: 1.4;
                  }
                  .store-gst {
                    font-size: 9px;
                    font-weight: bold;
                    margin-top: 3px;
                  }
                  .invoice-title {
                    font-size: 14px;
                    font-weight: bold;
                    text-align: center;
                    margin: 8px 0;
                    text-transform: uppercase;
                    border-bottom: 1px dashed #000;
                    padding: 4px 0;
                  }
                  .info-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 9px;
                    margin: 4px 0;
                  }
                  .info-label {
                    font-weight: bold;
                  }
                  .divider {
                    border-top: 1px dashed #000;
                    margin: 6px 0;
                  }
                  table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 9px;
                    table-layout: fixed;
                  }
                  th {
                    text-align: left;
                    border-bottom: 1px solid #000;
                    padding: 4px 0;
                    font-weight: bold;
                  }
                  td {
                    padding: 4px 0;
                    vertical-align: top;
                  }
                  .text-right {
                    text-align: right;
                    padding-right: 2px;
                  }
                  .text-left {
                    text-align: left;
                  }
                  .product-col {
                    width: 40%;
                  }
                  .qty-col {
                    width: 15%;
                  }
                  .price-col {
                    width: 20%;
                  }
                  .amount-col {
                    width: 25%;
                  }
                  .product-name {
                    font-weight: bold;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 65mm;
                  }
                  .product-code {
                    font-size: 7px;
                    color: #666;
                  }
                  .amount-words {
                    font-size: 9px;
                    margin: 8px 0 4px 0;
                    padding: 6px 0;
                    font-weight: bold;
                    text-align: center;
                    text-transform: uppercase;
                  }
                  .totals {
                    margin-top: 6px;
                  }
                  .total-row {
                    display: flex;
                    justify-content: space-between;
                    margin: 4px 0;
                    font-size: 10px;
                  }
                  .grand-total {
                    font-weight: bold;
                    font-size: 12px;
                    border-top: 2px solid #000;
                    padding-top: 6px;
                    margin-top: 6px;
                  }
                  .footer {
                    text-align: center;
                    margin-top: 12px;
                    border-top: 1px dashed #000;
                    padding-top: 8px;
                  }
                  .thank-you {
                    font-size: 11px;
                    font-weight: bold;
                    margin: 5px 0;
                  }
                  .powered {
                    font-size: 7px;
                    color: #666;
                  }
                  .logo{
                    width:60mm;
                    display:block;
                    margin:0 auto 3px auto;
                  }
                  .return-note {
                    font-size: 8px;
                    margin: 4px 0;
                    color: #666;
                    font-style: italic;
                  }
                </style>
              </head>
              <body>
                ${invoiceRef.current.outerHTML}
                <script>
                  setTimeout(function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 1000);
                  }, 300);
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      }
    };

    printInvoice();
    if (onPrinted) {
      setTimeout(onPrinted, 1500);
    }
  }, [billing, onPrinted]);

  // Convert number to words
  const numberToWords = (num: number): string => {
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

    return result.trim() + " Only";
  };

  // Calculate taxable amount (base amount without tax) for each item
  // Formula: Taxable Amount = Total Amount / (1 + Tax Rate/100)
  const itemsByTax = billing.items.reduce((acc, item) => {
    // Calculate taxable amount (base amount excluding tax)
    const totalAmount = item.price * item.quantity;
    const taxableAmt = totalAmount / (1 + item.taxPercent / 100);
    const taxAmount = totalAmount - taxableAmt;

    if (!acc[item.taxPercent]) {
      acc[item.taxPercent] = {
        rate: item.taxPercent,
        taxableAmt: 0,
        cgst: 0,
        sgst: 0,
      };
    }

    acc[item.taxPercent].taxableAmt += taxableAmt;
    acc[item.taxPercent].cgst += taxAmount / 2;
    acc[item.taxPercent].sgst += taxAmount / 2;

    return acc;
  }, {} as Record<number, { rate: number; taxableAmt: number; cgst: number; sgst: number }>);

  // Calculate final total and rounded values
  const finalTotal = billing.finalTotal || billing.grandTotal;
  const roundedGrandTotal = Math.round(finalTotal);
  const roundOffAmount = roundedGrandTotal - finalTotal;

  // Safely access branch data
  const branch = billing.branchId || {};
  const customer = billing.customerId || {};

  return (
    <div
      ref={invoiceRef}
      className="thermal-invoice"
      style={{
        fontFamily: "Arial",
        fontSize: "10px",
        width: "72mm",
        margin: "0 auto",
        padding: "4px",
      }}
    >
      {/* Store Header */}
      <div className="store-section">
        <img src="/logo.jpeg" className="logo" alt="Logo" />
        <div className="store-name">
          {branch.branchName?.toUpperCase() || "VAMANA AGENCIES"}
        </div>
        <div className="store-address">
          {branch.address || "ASHOKA ONE MALL, KUKATPALLY"}
          <br />
          {branch.city || "HYDERABAD"}, {branch.state || "TELANGANA"} -{" "}
          {branch.pincode || "500072"}
          <br />
          Phone: {branch.branchPhoneNumber || "+91 8790448672"}
        </div>
        <div className="store-gst">
          GST NO: {branch.branchGstNumber || "36AVGPJ9045H1ZD"}
        </div>
      </div>

      {/* Invoice Title */}
      <div className="invoice-title">TAX INVOICE</div>

      {/* Invoice Details */}
      <div className="info-row">
        <span className="info-label">Invoice No/Date</span>
        <span>
          {billing.invoiceNumber} /{" "}
          {format(
            new Date(billing.updatedAt || billing.createdAt),
            "dd-MM-yyyy",
          )}
        </span>
      </div>

      <div className="info-row">
        <span className="info-label">Customer Name</span>
        <span>{customer.name || "Cash"}</span>
      </div>
      {customer.mobile && (
        <div className="info-row">
          <span className="info-label">Cust Mobile No</span>
          <span>{customer.mobile}</span>
        </div>
      )}

      <div className="divider"></div>

      {/* Items Table */}
      <table>
        <thead>
          <tr>
            <th className="product-col">Product</th>
            <th className="qty-col text-right">QTY</th>
            <th className="qty-col text-right">Unit</th>
            <th className="price-col text-right">MRP</th>
            <th className="amount-col text-right">Net Amt</th>
          </tr>
        </thead>
        <tbody>
          {billing.items.map((item, index) => (
            <tr key={index}>
              <td className="product-col">
                <div className="product-name">{item.productName}</div>
                <div className="product-code">{item.itemCode}</div>
              </td>
              <td className="qty-col text-right">{item.quantity}</td>
              <td className="qty-col text-right">Pcs.</td>
              <td className="price-col text-right">₹{item.price.toFixed(2)}</td>
              <td className="amount-col text-right">
                ₹{(item.price * item.quantity).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="divider"></div>

      {/* Tax Table - CGST and SGST */}
      <table>
        <thead>
          <tr>
            <th className="product-col">Tax Rate</th>
            <th className="qty-col text-right">Taxable Amt.</th>
            <th className="price-col text-right">CGST</th>
            <th className="amount-col text-right">SGST</th>
          </tr>
        </thead>
        <tbody>
          {Object.values(itemsByTax).map((item, index) => (
            <tr key={index}>
              <td className="product-col">{item.rate}%</td>
              <td className="qty-col text-right">
                ₹{item.taxableAmt.toFixed(2)}
              </td>
              <td className="price-col text-right">₹{item.cgst.toFixed(2)}</td>
              <td className="amount-col text-right">₹{item.sgst.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="totals">
        <div className="total-row">
          <span>Base Amount</span>
          <span>₹{billing.subTotal?.toFixed(2) || "0.00"}</span>
        </div>

        {/* Discount Section */}
        {(billing.discountAmount ?? 0) > 0 && (
          <>
            <div className="total-row">
              <span>Discount</span>

              <span
                style={{
                  fontStyle: "italic",
                  color: "#555",
                }}
              >
                -₹{billing.discountAmount!.toFixed(2)}
              </span>
            </div>

            <div className="total-row">
              <span>Amount after Discount</span>

              <span>
                ₹
                {(
                  (billing.subTotal || 0) - (billing.discountAmount || 0)
                ).toFixed(2)}
              </span>
            </div>
          </>
        )}

        {/* Freight Charge */}
        {(billing.freightCharge ?? 0) > 0 && (
          <div className="total-row">
            <span>Freight Charge</span>

            <span
              style={{
                color: "#555",
              }}
            >
              +₹{billing.freightCharge!.toFixed(2)}
            </span>
          </div>
        )}

        <div className="total-row">
          <span>Total Tax (GST)</span>
          <span>₹{billing.totalTax?.toFixed(2) || "0.00"}</span>
        </div>

        {/* Grand Total */}
        <div className="total-row">
          <span>Grand Total</span>
          <span>₹{finalTotal.toFixed(2)}</span>
        </div>

        {/* Rounded Off */}
        {roundOffAmount !== 0 && (
          <div className="total-row">
            <span>Rounded Off</span>
            <span
              className={roundOffAmount > 0 ? "text-blue-600" : "text-red-600"}
            >
              {roundOffAmount > 0
                ? `+₹${roundOffAmount.toFixed(2)}`
                : `-₹${Math.abs(roundOffAmount).toFixed(2)}`}
            </span>
          </div>
        )}

        {/* NET PAYABLE */}
        <div className="grand-total total-row">
          <span>NET PAYABLE</span>
          <span>₹{roundedGrandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="amount-words">
        Rupees {numberToWords(roundedGrandTotal)}
      </div>

      {/* Footer */}
      <div className="footer">
        <div className="thank-you">THANK YOU. VISIT US AGAIN.</div>
        <div
          className="return-note"
          style={{ fontSize: "8px", margin: "4px 0", color: "#666" }}
        >
          Note - Goods once sold will not be returned or exchanged
        </div>
        <div className="powered">** Powered by RetailCraft **</div>
      </div>
    </div>
  );
}
