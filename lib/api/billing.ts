import axiosInstance from "./axios";
import { Branch } from "./branches";
import { Customer } from "./customers";

export interface BillingItem {
  productId: string;
  productName: string;
  barCode: string;
  itemCode: string;
  quantity: number;
  price: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
}

export interface Billing {
  _id: string;
  userId: string;
  branchId: Branch;
  customerId: Customer;
  invoiceNumber: string;
  items: BillingItem[];
  subTotal: number;
  totalTax: number;
  grandTotal: number;
  discount?: number;
  discountAmount?: number;
  finalTotal?: number;
  freightCharge?: number;
  status: "Draft" | "Completed";
  createdAt: string;
  updatedAt: string;
  paymentMode?: string;
  remarks?: string;
  paymentStatus?: "Pending" | "Paid";
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  multiple?: boolean;
  count?: number;
}

// =====================================================
// POST /api/billing/create - Create new billing draft
// =====================================================
export const createBilling = async (
  customerId: string,
): Promise<ApiResponse<Billing>> => {
  try {
    const response = await axiosInstance.post("api/billing/create", {
      customerId,
    });
    return response.data;
  } catch (error) {
    console.error("Create billing error:", error);
    throw error;
  }
};

// =====================================================
// POST /api/billing/add-product - Add product by barcode
// =====================================================
export const addProductToBilling = async (
  billingId: string,
  barCode: string,
  quantity: number,
  productId?: string,
): Promise<ApiResponse<Billing>> => {
  try {
    const payload: any = {
      billingId,
      barCode,
      quantity,
    };
    if (productId) {
      payload.productId = productId;
    }
    const response = await axiosInstance.post(
      "api/billing/add-product",
      payload,
    );
    return response.data;
  } catch (error) {
    console.error("Add product error:", error);
    throw error;
  }
};

// =====================================================
// POST /api/billing/remove-product - Remove product from billing
// =====================================================
export const removeProductFromBilling = async (
  billingId: string,
  productId: string,
): Promise<ApiResponse<Billing>> => {
  try {
    const response = await axiosInstance.post("api/billing/remove-product", {
      billingId,
      productId,
    });
    return response.data;
  } catch (error) {
    console.error("Remove product error:", error);
    throw error;
  }
};

// =====================================================
// PUT /api/billing/update-quantity - Update product quantity
// =====================================================
export const updateProductQuantity = async (
  billingId: string,
  productId: string,
  quantity: number,
): Promise<ApiResponse<Billing>> => {
  try {
    const response = await axiosInstance.put("api/billing/update-quantity", {
      billingId,
      productId,
      quantity,
    });
    return response.data;
  } catch (error) {
    console.error("Update quantity error:", error);
    throw error;
  }
};

// =====================================================
// POST /api/billing/complete/:id - Complete billing
// =====================================================
export const completeBilling = async (
  billingId: string,
  paymentMode: string,
  discountAmount: number = 0,
  freightCharge: number = 0,
  remarks?: string,
  invoiceType: "J1" | "J2" = "J1",
): Promise<ApiResponse<Billing>> => {
  try {
    const payload: any = {
      paymentMode,
      discountAmount,
      freightCharge,
      invoiceType,
    };

    // Add remarks only for Pay Later
    if (paymentMode === "Pay Later" && remarks) {
      payload.remarks = remarks;
    }

    const response = await axiosInstance.post(
      `api/billing/complete/${billingId}`,
      payload,
    );
    return response.data;
  } catch (error) {
    console.error("Complete billing error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/billing/:id - Get billing by ID
// =====================================================
export const getBillingById = async (
  billingId: string,
): Promise<ApiResponse<Billing>> => {
  try {
    const response = await axiosInstance.get(`api/billing/${billingId}`);
    console.log("Get billing response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get billing error:", error);
    throw error;
  }
};

// =====================================================
// DELETE /api/billing/:id - Delete billing
// =====================================================
export const deleteBilling = async (
  billingId: string,
): Promise<ApiResponse<null>> => {
  try {
    const response = await axiosInstance.delete(`api/billing/${billingId}`);
    // console.log("Delete billing response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Delete billing error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/billing/complete/all - Get all completed billings
// =====================================================
export const getCompletedBillings = async (): Promise<
  ApiResponse<Billing[]>
> => {
  try {
    const response = await axiosInstance.get("api/billing/complete/all");
    // console.log("Get completed billings response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get completed billings error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/billing/payment-status/<billingId> - update payment status of a billing
// =====================================================
export const updatePaymentStatus = async (
  billingId: string,
  paymentStatus: "Pending" | "Paid",
): Promise<ApiResponse<Billing>> => {
  try {
    const response = await axiosInstance.put(
      `api/billing/payment-status/${billingId}`,
      {
        paymentStatus,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Update payment status error:", error);
    throw error;
  }
};
