import axiosInstance from "./axios";

export interface PurchaseItem {
  productId: string;
  productName: string;
  barCode: string;
  itemCode: string;
  quantity: number;
  purchasePrice: number;
  b2cSalePrice: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
}

export interface PurchaseInvoice {
  _id: string;
  userId: string;
  branchId: {
    _id: string;
    branchName: string;
    branchPhoneNumber: string;
    address: string;
    country: string;
    state: string;
    city: string;
    pincode: string;
    branchCode: string;
    branchGstNumber: string;
  };
  supplierId: {
    _id: string;
    name: string;
    email?: string;
    mobile?: string;
    address: string;
    country: string;
    state: string;
    city: string;
    pincode: string;
    gstIn: string;
  };
  invoiceNumber: string;
  referenceInvoiceNumber?: string;
  invoiceDate: string;
  placeOfSupply: string;
  reverseCharge: string;
  items: PurchaseItem[];
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

export interface CreatePurchaseData {
  supplierId: string;
  invoiceNumber: string;
  invoiceDate: string;
  placeOfSupply: string;
  reverseCharge: string;
}

export interface AddProductData {
  purchaseId: string;
  barCode: string;
  quantity: number;
  productId?: string;
}

export interface UpdateQuantityData {
  purchaseId: string;
  productId: string;
  quantity: number;
}

export interface RemoveProductData {
  purchaseId: string;
  productId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: string[];
  multiple?: boolean; // For multi-product responses
}

// =====================================================
// POST /api/purchase-invoice/create - Create purchase invoice
// =====================================================
export const createPurchase = async (
  data: CreatePurchaseData,
): Promise<ApiResponse<PurchaseInvoice>> => {
  try {
    const response = await axiosInstance.post(
      "api/purchase-invoice/create",
      data,
    );
    return response.data;
  } catch (error) {
    console.error("Create purchase error:", error);
    throw error;
  }
};

// =====================================================
// POST /api/purchase-invoice/add-product - Add product by barcode
// =====================================================
export const addProductToPurchase = async (
  data: AddProductData,
): Promise<ApiResponse<PurchaseInvoice>> => {
  try {
    const payload: any = {
      purchaseId: data.purchaseId,
      barCode: data.barCode,
      quantity: data.quantity,
    };
    if (data.productId) {
      payload.productId = data.productId;
    }
    const response = await axiosInstance.post(
      "api/purchase-invoice/add-product",
      payload,
    );
    return response.data;
  } catch (error) {
    console.error("Add product to purchase error:", error);
    throw error;
  }
};

// =====================================================
// POST /api/purchase-invoice/remove-product - Remove product from purchase
// =====================================================
export const removeProductFromPurchase = async (
  data: RemoveProductData,
): Promise<ApiResponse<PurchaseInvoice>> => {
  try {
    const response = await axiosInstance.post(
      "api/purchase-invoice/remove-product",
      data,
    );
    return response.data;
  } catch (error) {
    console.error("Remove product from purchase error:", error);
    throw error;
  }
};

// =====================================================
// PUT /api/purchase-invoice/update-quantity - Update product quantity
// =====================================================
export const updatePurchaseQuantity = async (
  data: UpdateQuantityData,
): Promise<ApiResponse<PurchaseInvoice>> => {
  try {
    const response = await axiosInstance.put(
      "api/purchase-invoice/update-quantity",
      data,
    );
    return response.data;
  } catch (error) {
    console.error("Update purchase quantity error:", error);
    throw error;
  }
};

// =====================================================
// POST /api/purchase-invoice/complete/:id - Complete purchase invoice
// =====================================================
// Update completePurchase function
export const completePurchase = async (
  id: string,
  discountAmount: number = 0,
  freightCharge: number = 0,
  paymentMode: string = "Cash",
  remarks?: string,
): Promise<ApiResponse<PurchaseInvoice>> => {
  try {
    const payload: any = { discountAmount, freightCharge, paymentMode };
    if (paymentMode === "Pay Later" && remarks) {
      payload.remarks = remarks;
    }
    const response = await axiosInstance.post(
      `api/purchase-invoice/complete/${id}`,
      payload,
    );
    return response.data;
  } catch (error) {
    console.error("Complete purchase error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/purchase-invoice/:id - Get purchase by ID
// =====================================================
export const getPurchaseById = async (
  id: string,
): Promise<ApiResponse<PurchaseInvoice>> => {
  try {
    const response = await axiosInstance.get(`api/purchase-invoice/${id}`);
    return response.data;
  } catch (error) {
    console.error("Get purchase by ID error:", error);
    throw error;
  }
};

// =====================================================
// DELETE /api/purchase-invoice/:id - Delete purchase invoice
// =====================================================
export const deletePurchase = async (
  id: string,
): Promise<ApiResponse<null>> => {
  try {
    const response = await axiosInstance.delete(`api/purchase-invoice/${id}`);
    // console.log("Delete purchase response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Delete purchase error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/purchase-invoice/complete/all - Get all completed purchase invoices
// =====================================================
export const getCompletedPurchases = async (): Promise<
  ApiResponse<PurchaseInvoice[]>
> => {
  try {
    const response = await axiosInstance.get(
      "api/purchase-invoice/complete/all",
    );
    // console.log("Get completed purchases response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get completed purchases error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/purchase-invoice/payment-status/:id - Get purchase payment status
// =====================================================
export const updatePurchasePaymentStatus = async (
  id: string,
  paymentStatus: "Pending" | "Paid",
): Promise<ApiResponse<PurchaseInvoice>> => {
  try {
    const response = await axiosInstance.put(
      `api/purchase-invoice/payment-status/${id}`,
      {
        paymentStatus,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Update purchase payment status error:", error);
    throw error;
  }
};
