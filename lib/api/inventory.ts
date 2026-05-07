import axiosInstance from "./axios";

export interface InventoryItem {
  productId: string;
  productName: string;
  barCode: string;
  size: "S" | "M" | "L" | "XL" | "XXL";
  quantity: number;
}

export interface ProductInventory {
  success: boolean;
  product: {
    id: string;
    productName: string;
    barCode: string;
  };
  inventory: {
    size: "S" | "M" | "L" | "XL" | "XXL";
    quantity: number;
  }[];
}

export interface StockSummary {
  success: boolean;
  totalProducts: number;
  totalStock: number;
}

export interface LowStockItem {
  _id: string;
  branchId: string;
  productId: {
    _id: string;
    productName: string;
    barCode: string;
  };
  size: "S" | "M" | "L" | "XL" | "XXL";
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export interface StockOperation {
  productId: string;
  size: "S" | "M" | "L" | "XL" | "XXL";
  quantity: number;
}

export interface StockResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface ApiListResponse<T> {
  success: boolean;
  count?: number;
  data: T[];
}

// =====================================================
// GET /api/stocks
// Get ALL inventory of branch (shows all products stock size-wise)
// =====================================================
export const getAllInventory = async (): Promise<
  ApiListResponse<InventoryItem>
> => {
  try {
    const response = await axiosInstance.get("api/stocks");
    // console.log("Inventory response:", response.data);
    return response.data;
  } catch (error) {
    console.error("Get all inventory error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/stocks/summary
// Get stock summary of branch (total products, total stock)
// =====================================================
export const getStockSummary = async (): Promise<StockSummary> => {
  try {
    const response = await axiosInstance.get("api/stocks/summary");
    return response.data;
  } catch (error) {
    console.error("Get stock summary error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/stocks/low-stock
// Get products with low stock (quantity <= 5)
// =====================================================
export const getLowStock = async (): Promise<ApiListResponse<LowStockItem>> => {
  try {
    const response = await axiosInstance.get("api/stocks/low-stock");
    return response.data;
  } catch (error) {
    console.error("Get low stock error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/stocks/:productId
// Get inventory of specific product (size-wise)
// =====================================================
export const getProductInventory = async (
  productId: string,
): Promise<ProductInventory> => {
  try {
    const response = await axiosInstance.get(`api/stocks/${productId}`);
    return response.data;
  } catch (error) {
    console.error("Get product inventory error:", error);
    throw error;
  }
};

// =====================================================
// POST /api/stocks/add
// Add stock to product size (purchasing new items)
// =====================================================
export const addStock = async (
  data: StockOperation,
): Promise<StockResponse> => {
  try {
    const response = await axiosInstance.post("api/stocks/add", data);
    return response.data;
  } catch (error) {
    console.error("Add stock error:", error);
    throw error;
  }
};

// =====================================================
// POST /api/stocks/reduce
// Reduce stock from product size (selling products)
// =====================================================
export const reduceStock = async (
  data: StockOperation,
): Promise<StockResponse> => {
  try {
    const response = await axiosInstance.post("api/stocks/reduce", data);
    return response.data;
  } catch (error) {
    console.error("Reduce stock error:", error);
    throw error;
  }
};
