// lib/api/dashboard.ts
import axiosInstance from "./axios";
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

export interface Receivable {
  id: string;
  customerName: string;
  invoiceNo: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: "paid" | "pending";
}

export interface Payable {
  id: string;
  supplierName: string;
  billNo: string;
  billDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  pendingAmount: number;
  status: "paid" | "pending";
}

export interface DashboardData {
  stats: DashboardStats;
  receivables: any[];
  payables: any[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

// Get complete dashboard data
export const getDashboardData = async (
  range: "today" | "week" | "month" | "year" = "month",
): Promise<ApiResponse<DashboardData>> => {
  try {
    const response = await axiosInstance.get(`api/dashboard?range=${range}`);
    return response.data;
  } catch (error) {
    console.error("Get dashboard data error:", error);
    throw error;
  }
};

// Get receivables only
export const getReceivables = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await axiosInstance.get("api/dashboard/receivables");
    return response.data;
  } catch (error) {
    console.error("Get receivables error:", error);
    throw error;
  }
};

// Get payables only
export const getPayables = async (): Promise<ApiResponse<any[]>> => {
  try {
    const response = await axiosInstance.get("api/dashboard/payables");
    return response.data;
  } catch (error) {
    console.error("Get payables error:", error);
    throw error;
  }
};
