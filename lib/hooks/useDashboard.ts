"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getCompletedBillings,
  Billing,
  updatePaymentStatus,
} from "@/lib/api/billing";
import {
  getCompletedPurchases,
  PurchaseInvoice,
  updatePurchasePaymentStatus,
} from "@/lib/api/purchases";
import { getProducts, Product } from "@/lib/api/products";
import { getCustomers, Customer } from "@/lib/api/customers";
import { getSuppliers, Supplier } from "@/lib/api/suppliers";
import toast from "react-hot-toast";

export interface DashboardStats {
  totalSales: number;
  totalInvoices: number;
  soldQty: number;
  totalCustomers: number;
  toReceive: number;
  totalPurchase: number;
  totalBills: number;
  purchaseQty: number;
  totalSuppliers: number;
  toPay: number;
  totalPaid: number;
  totalExpense: number;
  totalProducts: number;
  stockQty: number;
  stockValue: number;
  grossProfit: number;
  avgProfitMargin: number;
  avgProfitMarginPercent: number;
  avgCartValue: number;
  avgBills: number;
}

export interface ReceivableTransaction {
  id: string;
  customerName: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: "pending" | "paid";
  paymentMode?: string;
  daysSinceInvoice?: number;
  invoiceStatus?: "paid" | "pending" | "pay_later";
}

export interface PayableTransaction {
  id: string;
  supplierName: string;
  billNo: string;
  referenceInvoiceNo?: string;
  billDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: "pending" | "paid";
  paymentMode?: string;
  daysSinceInvoice?: number;
  invoiceStatus?: "paid" | "pending" | "pay_later";
}

interface DashboardData {
  stats: DashboardStats;
  receivables: ReceivableTransaction[];
  payables: PayableTransaction[];
}

export function useDashboard(
  initialRange: "today" | "week" | "month" | "year" | "custom" = "today",
  initialStartDate?: Date,
  initialEndDate?: Date,
) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState(initialRange);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(
    initialStartDate,
  );
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(
    initialEndDate,
  );
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);

  // Calculate days since invoice date
  const calculateDaysSinceInvoice = (invoiceDate: string): number => {
    const today = new Date();
    const invoice = new Date(invoiceDate);

    today.setHours(0, 0, 0, 0);
    invoice.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - invoice.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  // Calculate due date (30 days from invoice for Pay Later)
  const calculateDueDate = (
    invoiceDate: string,
    paymentMode?: string,
  ): string => {
    const invoice = new Date(invoiceDate);
    if (paymentMode === "Pay Later") {
      const due = new Date(invoice);
      due.setDate(due.getDate() + 30);
      return due.toISOString();
    }
    return invoice.toISOString();
  };

  // Calculate invoice status
  const getInvoiceStatus = (
    paymentMode: string | undefined,
    paymentStatus: string | undefined,
    pendingAmount: number,
  ): "paid" | "pending" | "pay_later" => {
    if (paymentStatus === "Paid" || pendingAmount === 0) {
      return "paid";
    }
    if (paymentMode === "Pay Later") {
      return "pay_later";
    }
    return "pending";
  };

  const calculateStatus = (pendingAmount: number): "pending" | "paid" => {
    return pendingAmount > 0 ? "pending" : "paid";
  };

  // Mark payment as paid for Receivable (Billing)
  const markReceivableAsPaid = async (id: string): Promise<void> => {
    setUpdatingPayment(id);
    try {
      const response = await updatePaymentStatus(id, "Paid");
      if (response.success) {
        toast.success("Payment marked as paid successfully");
        await fetchDashboardData();
      } else {
        toast.error(response.message || "Failed to update payment status");
      }
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update payment status",
      );
    } finally {
      setUpdatingPayment(null);
    }
  };

  // Mark payment as paid for Payable (Purchase)
  const markPayableAsPaid = async (id: string): Promise<void> => {
    setUpdatingPayment(id);
    try {
      const response = await updatePurchasePaymentStatus(id, "Paid");
      if (response.success) {
        toast.success("Payment marked as paid successfully");
        await fetchDashboardData();
      } else {
        toast.error(response.message || "Failed to update payment status");
      }
    } catch (error: any) {
      console.error("Error updating payment status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update payment status",
      );
    } finally {
      setUpdatingPayment(null);
    }
  };

  // lib/hooks/useDashboard.ts - Replace the date filtering logic

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      const [
        billingsResponse,
        purchasesResponse,
        productsResponse,
        customersResponse,
        suppliersResponse,
      ] = await Promise.all([
        getCompletedBillings(),
        getCompletedPurchases(),
        getProducts("All"),
        getCustomers(),
        getSuppliers(),
      ]);

      // Calculate date range filter - Fix timezone issues
      let startDate: Date;
      let endDate: Date = new Date();

      if (dateRange === "custom" && customStartDate && customEndDate) {
        startDate = new Date(customStartDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
      } else {
        const now = new Date();

        switch (dateRange) {
          case "today":
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(now);
            endDate.setHours(23, 59, 59, 999);
            break;
          case "week":
            startDate = new Date(now);
            startDate.setDate(now.getDate() - 7);
            startDate.setHours(0, 0, 0, 0);
            break;
          case "month":
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
            break;
          case "year":
            startDate = new Date(now);
            startDate.setFullYear(now.getFullYear() - 1);
            startDate.setHours(0, 0, 0, 0);
            break;
          default:
            startDate = new Date(now);
            startDate.setMonth(now.getMonth() - 1);
            startDate.setHours(0, 0, 0, 0);
        }
      }

      // Debug logging
      // console.log("=== DASHBOARD DATA FETCH ===");
      // console.log("Date Range:", dateRange);
      // console.log("Start Date (local):", startDate.toLocaleString());
      // console.log("End Date (local):", endDate.toLocaleString());
      // console.log("Start Date (UTC):", startDate.toISOString());
      // console.log("End Date (UTC):", endDate.toISOString());

      // Improved date comparison that handles timezone correctly
      const isDateInRange = (dateStr: string) => {
        const date = new Date(dateStr);
        // Reset to start of day for comparison
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);

        const compareStart = new Date(startDate);
        compareStart.setHours(0, 0, 0, 0);

        const compareEnd = new Date(endDate);
        compareEnd.setHours(23, 59, 59, 999);

        return compareDate >= compareStart && compareDate <= compareEnd;
      };

      // Process Billings for Sales Stats
      let totalSales = 0;
      let totalInvoices = 0;
      let soldQty = 0;
      let toReceive = 0;
      let totalPaid = 0;
      let grossProfit = 0;
      let totalCartValue = 0;

      const receivables: ReceivableTransaction[] = [];

      if (billingsResponse.success && billingsResponse.data) {
        // Log all billings with their dates
        // console.log(
        //   "All Billings:",
        //   billingsResponse.data.map((b) => ({
        //     invoiceNumber: b.invoiceNumber,
        //     createdAt: b.createdAt,
        //     localDate: new Date(b.createdAt).toLocaleDateString(),
        //   })),
        // );

        const filteredBillings = billingsResponse.data.filter((b: Billing) =>
          isDateInRange(b.createdAt),
        );

        // console.log(
        //   `Billings: ${billingsResponse.data.length} total, ${filteredBillings.length} in range`,
        // );

        totalInvoices = filteredBillings.length;

        filteredBillings.forEach((billing: Billing) => {
          const finalAmount = billing.finalTotal || billing.grandTotal;
          const paidAmount = billing.paymentStatus === "Paid" ? finalAmount : 0;
          const pendingAmount = finalAmount - paidAmount;

          totalSales += finalAmount;
          totalPaid += paidAmount;

          if (pendingAmount > 0 || billing.paymentMode === "Pay Later") {
            toReceive += pendingAmount;
          }

          totalCartValue += finalAmount;

          billing.items?.forEach((item) => {
            soldQty += item.quantity;
            const profit = item.price * item.quantity * 0.2;
            grossProfit += profit;
          });

          const dueDate = calculateDueDate(
            billing.createdAt,
            billing.paymentMode,
          );
          const daysSinceInvoice = calculateDaysSinceInvoice(billing.createdAt);
          const invoiceStatus = getInvoiceStatus(
            billing.paymentMode,
            billing.paymentStatus,
            pendingAmount,
          );

          receivables.push({
            id: billing._id,
            customerName: billing.customerId?.name || "Unknown",
            invoiceNo: billing.invoiceNumber,
            invoiceDate: billing.createdAt,
            dueDate: dueDate,
            amount: finalAmount,
            paidAmount: paidAmount,
            pendingAmount: pendingAmount,
            status: calculateStatus(pendingAmount),
            paymentMode: billing.paymentMode,
            daysSinceInvoice: daysSinceInvoice,
            invoiceStatus: invoiceStatus,
          });
        });
      }

      // Process Purchases for Purchase Stats
      let totalPurchase = 0;
      let totalBills = 0;
      let purchaseQty = 0;
      let toPay = 0;
      let totalExpense = 0;

      const payables: PayableTransaction[] = [];

      if (purchasesResponse.success && purchasesResponse.data) {
        const filteredPurchases = purchasesResponse.data.filter(
          (p: PurchaseInvoice) => isDateInRange(p.createdAt),
        );

        // Log purchases that are today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayPurchases = purchasesResponse.data.filter(
          (p: PurchaseInvoice) => {
            const purchaseDate = new Date(p.invoiceDate);
            purchaseDate.setHours(0, 0, 0, 0);
            return purchaseDate.getTime() === today.getTime();
          },
        );

        if (todayPurchases.length > 0) {
          // console.log(
          //   "Today's purchases:",
          //   todayPurchases.map((p) => ({
          //     invoiceNumber: p.invoiceNumber,
          //     invoiceDate: p.invoiceDate,
          //     localDate: new Date(p.invoiceDate).toLocaleString(),
          //     amount: p.finalTotal || p.grandTotal,
          //   })),
          // );
        } else {
          // console.log(
          //   "No purchases found for today's date:",
          //   today.toLocaleDateString(),
          // );
        }

        totalBills = filteredPurchases.length;

        filteredPurchases.forEach((purchase: PurchaseInvoice) => {
          const finalAmount = purchase.finalTotal || purchase.grandTotal;
          const paidAmount =
            purchase.paymentStatus === "Paid" ? finalAmount : 0;
          const pendingAmount = finalAmount - paidAmount;

          totalPurchase += finalAmount;
          totalExpense += paidAmount;

          if (pendingAmount > 0 || purchase.paymentMode === "Pay Later") {
            toPay += pendingAmount;
          }

          purchase.items?.forEach((item) => {
            purchaseQty += item.quantity;
          });

          const dueDate = calculateDueDate(
            purchase.invoiceDate,
            purchase.paymentMode,
          );
          const daysSinceInvoice = calculateDaysSinceInvoice(
            purchase.invoiceDate,
          );
          const invoiceStatus = getInvoiceStatus(
            purchase.paymentMode,
            purchase.paymentStatus,
            pendingAmount,
          );

          payables.push({
            id: purchase._id,
            supplierName: purchase.supplierId?.name || "Unknown",
            billNo: purchase.invoiceNumber,
            referenceInvoiceNo: purchase.referenceInvoiceNumber || "",
            billDate: purchase.invoiceDate,
            dueDate: dueDate,
            amount: finalAmount,
            paidAmount: paidAmount,
            pendingAmount: pendingAmount,
            status: calculateStatus(pendingAmount),
            paymentMode: purchase.paymentMode,
            daysSinceInvoice: daysSinceInvoice,
            invoiceStatus: invoiceStatus,
          });
        });
      }

      // console.log("Purchase Summary:", {
      //   totalPurchase,
      //   totalBills,
      //   purchaseQty,
      //   toPay,
      // });

      // Process Products for Inventory Stats
      let totalProducts = 0;
      let stockQty = 0;
      let stockValue = 0;

      if (productsResponse.success && productsResponse.data) {
        totalProducts = productsResponse.data.length;
        productsResponse.data.forEach((product: Product) => {
          stockQty += product.quantity;
          stockValue += product.quantity * product.purchasePrice;
        });
      }

      const avgCartValue =
        totalInvoices > 0 ? totalCartValue / totalInvoices : 0;
      const avgBills = totalBills > 0 ? totalBills : 0;
      const avgProfitMargin =
        totalInvoices > 0 ? grossProfit / totalInvoices : 0;
      const avgProfitMarginPercent =
        totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

      setDashboardData({
        stats: {
          totalSales,
          totalInvoices,
          soldQty,
          totalCustomers: customersResponse.data?.length || 0,
          toReceive,
          totalPurchase,
          totalBills,
          purchaseQty,
          totalSuppliers: suppliersResponse.data?.length || 0,
          toPay,
          totalPaid,
          totalExpense,
          totalProducts,
          stockQty,
          stockValue,
          grossProfit,
          avgProfitMargin,
          avgProfitMarginPercent,
          avgCartValue,
          avgBills,
        },
        receivables,
        payables,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, customStartDate, customEndDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const changeDateRange = (
    range: "today" | "week" | "month" | "year" | "custom",
    startDate?: Date,
    endDate?: Date,
  ) => {
    setDateRange(range);
    if (range === "custom" && startDate && endDate) {
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
    }
    setLoading(true);
    fetchDashboardData();
  };

  const refresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return {
    dashboardData,
    loading,
    refreshing,
    dateRange,
    customStartDate,
    customEndDate,
    changeDateRange,
    refresh,
    markReceivableAsPaid,
    markPayableAsPaid,
    updatingPayment,
  };
}
