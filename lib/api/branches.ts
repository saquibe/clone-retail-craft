import axiosInstance from "./axios";
import { BranchFormData } from "@/components/forms/BranchForm";

export interface Branch extends BranchFormData {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

// Get all branches
export const getBranches = async (): Promise<ApiResponse<Branch[]>> => {
  try {
    const response = await axiosInstance.get("api/branches");
    return response.data;
  } catch (error) {
    console.error("Get branches error:", error);
    throw error;
  }
};

// Get branch by ID
export const getBranchById = async (
  id: string,
): Promise<ApiResponse<Branch>> => {
  try {
    const response = await axiosInstance.get(`api/branches/${id}`);
    return response.data;
  } catch (error) {
    console.error("Get branch by ID error:", error);
    throw error;
  }
};

// Create branch
export const createBranch = async (
  data: BranchFormData,
): Promise<ApiResponse<Branch>> => {
  try {
    const response = await axiosInstance.post("api/branches", data);
    return response.data;
  } catch (error) {
    console.error("Create branch error:", error);
    throw error;
  }
};

// Update branch
export const updateBranch = async (
  id: string,
  data: Partial<BranchFormData>,
): Promise<ApiResponse<Branch>> => {
  try {
    const response = await axiosInstance.put(`api/branches/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Update branch error:", error);
    throw error;
  }
};

// Delete branch
export const deleteBranch = async (id: string): Promise<ApiResponse<null>> => {
  try {
    const response = await axiosInstance.delete(`api/branches/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete branch error:", error);
    throw error;
  }
};
