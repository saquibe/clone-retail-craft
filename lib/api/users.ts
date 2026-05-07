import axiosInstance from "./axios";

export interface User {
  _id: string;
  branchId: {
    _id: string;
    branchName: string;
    branchCode: string;
  };
  name: string;
  email: string;
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

// Get all users
export const getAllUsers = async (): Promise<ApiResponse<User[]>> => {
  try {
    const response = await axiosInstance.get("api/users");
    return response.data;
  } catch (error) {
    console.error("Get all users error:", error);
    throw error;
  }
};

// Get users by branch
export const getUsersByBranch = async (
  branchId: string,
): Promise<ApiResponse<User[]>> => {
  try {
    const response = await axiosInstance.get(`api/branches/${branchId}/users`);
    return response.data;
  } catch (error) {
    console.error("Get users by branch error:", error);
    throw error;
  }
};

// Create user in branch
export const createUser = async (
  branchId: string,
  data: CreateUserData,
): Promise<ApiResponse<User>> => {
  try {
    const response = await axiosInstance.post(
      `api/branches/${branchId}/users`,
      data,
    );
    return response.data;
  } catch (error) {
    console.error("Create user error:", error);
    throw error;
  }
};

// Update user
export const updateUser = async (
  id: string,
  data: UpdateUserData,
): Promise<ApiResponse<User>> => {
  try {
    const response = await axiosInstance.put(`api/users/${id}`, data);
    return response.data;
  } catch (error) {
    console.error("Update user error:", error);
    throw error;
  }
};

// Delete user
export const deleteUser = async (id: string): Promise<ApiResponse<null>> => {
  try {
    const response = await axiosInstance.delete(`api/users/${id}`);
    return response.data;
  } catch (error) {
    console.error("Delete user error:", error);
    throw error;
  }
};
