import axiosInstance from "./axios";

export interface Supplier {
  _id: string;
  userId: string;
  name: string;
  email?: string;
  mobile?: string;
  address: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  gstIn: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierData {
  name: string;
  email?: string;
  mobile?: string;
  address: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  gstIn: string;
}

export type SupplierFormData = CreateSupplierData;

export interface UpdateSupplierData extends Partial<CreateSupplierData> {}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  errors?: string[];
}

// Get all suppliers
export const getSuppliers = async (): Promise<ApiResponse<Supplier[]>> => {
  try {
    const response = await axiosInstance.get("api/suppliers");
    return response.data;
  } catch (error) {
    console.error("Get suppliers error:", error);
    throw error;
  }
};

// Get supplier by ID
export const getSupplierById = async (
  id: string,
): Promise<ApiResponse<Supplier>> => {
  try {
    const response = await axiosInstance.get(`api/suppliers/${id}`);
    return response.data;
  } catch (error) {
    console.error("Get supplier by ID error:", error);
    throw error;
  }
};

// Create supplier
export const createSupplier = async (
  data: CreateSupplierData,
): Promise<ApiResponse<Supplier>> => {
  try {
    const response = await axiosInstance.post("api/suppliers", data);
    return response.data;
  } catch (error) {
    console.error("Create supplier error:", error);
    throw error;
  }
};

// Update supplier
export const updateSupplier = async (
  id: string,
  data: UpdateSupplierData,
): Promise<ApiResponse<Supplier>> => {
  try {
    const response = await axiosInstance.put(`api/suppliers/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Update supplier error:", error);
    throw error;
  }
};

// Delete supplier
export const deleteSupplier = async (
  id: string,
): Promise<ApiResponse<null>> => {
  try {
    const response = await axiosInstance.delete(`api/suppliers/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete supplier error:", error);
    throw error;
  }
};
