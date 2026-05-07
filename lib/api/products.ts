import axiosInstance from "./axios";

export interface Product {
  _id: string;
  userId: string;
  branchId: string;
  productName: string;
  itemCode?: string;
  barCode: string;
  color: string;
  size: string;
  quantity: number;
  hsnCode?: string;
  salesTax: number;
  purchaseTax: number;
  shortDescription?: string;
  b2bSalePrice: number;
  b2cSalePrice: number;
  purchasePrice: number;
  status: "Active" | "Inactive";
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  productName: string;
  itemCode?: string;
  barCode: string;
  color: string;
  size: string;
  quantity?: number;
  hsnCode?: string;
  salesTax: number;
  purchaseTax: number;
  shortDescription?: string;
  b2bSalePrice: number;
  b2cSalePrice: number;
  purchasePrice: number;
}

export interface UpdateProductData extends Partial<CreateProductData> {}

export interface StockOperation {
  productId: string;
  quantity: number;
}

export interface StockSummary {
  success: boolean;
  totalProducts: number;
  totalStock: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: string[];
}

// Export form data type
export type ProductFormData = CreateProductData;

// =====================================================
// GET /api/products - Get products with status filter
// Default: Active only
// ?status=All - All products
// ?status=Inactive - Inactive only
// =====================================================
export const getProducts = async (
  status?: "All" | "Inactive",
): Promise<ApiResponse<Product[]>> => {
  try {
    const params = status ? { status } : {};
    const response = await axiosInstance.get("api/products", { params });
    return response.data;
  } catch (error) {
    console.error("Get products error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/products/:id - Get product by ID
// =====================================================
export const getProductById = async (
  id: string,
): Promise<ApiResponse<Product>> => {
  try {
    const response = await axiosInstance.get(`api/products/${id}`);
    return response.data;
  } catch (error) {
    console.error("Get product by ID error:", error);
    throw error;
  }
};

// =====================================================
// POST /api/products - Create product
// =====================================================
export const createProduct = async (
  data: CreateProductData,
): Promise<ApiResponse<Product>> => {
  try {
    const response = await axiosInstance.post("api/products", data);
    return response.data;
  } catch (error) {
    console.error("Create product error:", error);
    throw error;
  }
};

// =====================================================
// PUT /api/products/:id - Update product
// =====================================================
export const updateProduct = async (
  id: string,
  data: UpdateProductData,
): Promise<ApiResponse<Product>> => {
  try {
    const response = await axiosInstance.put(`api/products/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Update product error:", error);
    throw error;
  }
};

// =====================================================
// POST /api/products/add-stock - Add stock to product
// =====================================================
export const addStock = async (
  data: StockOperation,
): Promise<ApiResponse<Product>> => {
  try {
    const response = await axiosInstance.post("api/products/add-stock", data);
    return response.data;
  } catch (error) {
    console.error("Add stock error:", error);
    throw error;
  }
};

// =====================================================
// POST /api/products/reduce-stock - Reduce stock from product
// =====================================================
export const reduceStock = async (
  data: StockOperation,
): Promise<ApiResponse<Product>> => {
  try {
    const response = await axiosInstance.post(
      "api/products/reduce-stock",
      data,
    );
    return response.data;
  } catch (error) {
    console.error("Reduce stock error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/products/low-stock - Get products with stock <=5
// =====================================================
export const getLowStockProducts = async (): Promise<
  ApiResponse<Product[]>
> => {
  try {
    const response = await axiosInstance.get("api/products/low-stock");
    return response.data;
  } catch (error) {
    console.error("Get low stock products error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/products/stock-summary - Get branch stock summary
// =====================================================
export const getStockSummary = async (): Promise<StockSummary> => {
  try {
    const response = await axiosInstance.get("api/products/stock-summary");
    return response.data;
  } catch (error) {
    console.error("Get stock summary error:", error);
    throw error;
  }
};

// =====================================================
// DELETE /api/products/:id - Delete product
// =====================================================
export const deleteProduct = async (id: string): Promise<ApiResponse<null>> => {
  try {
    const response = await axiosInstance.delete(`api/products/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete product error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/products/search - Search products by name or barcode
// =====================================================
export const searchProducts = async (
  searchTerm: string,
): Promise<ApiResponse<Product[]>> => {
  try {
    const response = await axiosInstance.get("api/products/search", {
      params: { search: searchTerm },
    });
    return response.data;
  } catch (error) {
    console.error("Search products error:", error);
    throw error;
  }
};

// =====================================================
// GET /api/products/export/csv - Export products as CSV
// =====================================================
export const exportProductsToCSV = async (): Promise<Blob> => {
  try {
    const response = await axiosInstance.get("api/products/export/csv", {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Export products to CSV error:", error);
    throw error;
  }
};
