import axiosInstance from "./axios";

// ==================== ADMIN APIS ====================
export const adminLogin = async (
  email: string,
  password: string,
  captchaToken: string,
) => {
  try {
    const response = await axiosInstance.post("api/admin/login", {
      email,
      password,
      captchaToken,
    });
    return response.data;
  } catch (error) {
    console.error("Admin login API error:", error);
    throw error;
  }
};

export const adminLogout = async () => {
  try {
    const response = await axiosInstance.post("api/admin/logout");
    return response.data;
  } catch (error) {
    console.error("Logout API error:", error);
    throw error;
  }
};

export const getAdminProfile = async () => {
  try {
    const response = await axiosInstance.get("api/admin/profile");
    return response.data;
  } catch (error) {
    console.error("Get admin profile error:", error);
    throw error;
  }
};

export const updateAdminProfile = async (data: FormData) => {
  try {
    const response = await axiosInstance.put("api/admin/profile", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Update admin profile error:", error);
    throw error;
  }
};

export const adminForgotPassword = async (email: string) => {
  try {
    const response = await axiosInstance.post("api/admin/forgot-password", {
      email,
    });
    return response.data;
  } catch (error) {
    console.error("Admin forgot password error:", error);
    throw error;
  }
};

export const adminResetPassword = async (token: string, password: string) => {
  try {
    const response = await axiosInstance.post(
      `api/admin/reset-password/${token}`,
      {
        password,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Admin reset password error:", error);
    throw error;
  }
};

// ==================== USER APIS ====================
export const userLogin = async (
  email: string,
  password: string,
  captchaToken: string,
) => {
  try {
    const response = await axiosInstance.post("api/users/login", {
      email,
      password,
      captchaToken,
    });
    return response.data;
  } catch (error) {
    console.error("User login API error:", error);
    throw error;
  }
};

export const userLogout = async () => {
  try {
    const response = await axiosInstance.post("api/users/logout");
    return response.data;
  } catch (error) {
    console.error("User logout error:", error);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await axiosInstance.get("api/users/profile");
    return response.data;
  } catch (error) {
    console.error("Get user profile error:", error);
    throw error;
  }
};

export const updateUserProfile = async (data: FormData) => {
  try {
    const response = await axiosInstance.put("api/users/profile", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Update user profile error:", error);
    throw error;
  }
};

export const userForgotPassword = async (email: string) => {
  try {
    const response = await axiosInstance.post("api/users/forgot-password", {
      email,
    });
    return response.data;
  } catch (error) {
    console.error("User forgot password error:", error);
    throw error;
  }
};

export const userResetPassword = async (token: string, password: string) => {
  try {
    const response = await axiosInstance.post(
      `api/users/reset-password/${token}`,
      {
        password,
      },
    );
    return response.data;
  } catch (error) {
    console.error("User reset password error:", error);
    throw error;
  }
};

// ==================== COMMON APIS ====================
export const forgotPassword = async (
  email: string,
  userType: "admin" | "user",
) => {
  if (userType === "admin") {
    return adminForgotPassword(email);
  } else {
    return userForgotPassword(email);
  }
};

export const resetPassword = async (
  token: string,
  password: string,
  userType: "admin" | "user",
) => {
  if (userType === "admin") {
    return adminResetPassword(token, password);
  } else {
    return userResetPassword(token, password);
  }
};
