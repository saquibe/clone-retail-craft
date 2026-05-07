import axios from "axios";
import Cookies from "js-cookie";

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const userType = localStorage.getItem("userType");

        const refreshUrl =
          userType === "admin"
            ? `${baseURL}/api/admin/refresh-token`
            : `${baseURL}/api/users/refresh-token`;

        const response = await axios.get(refreshUrl, {
          withCredentials: true,
        });

        if (response.data.accessToken) {
          Cookies.set("accessToken", response.data.accessToken, {
            expires: 7,
            sameSite: "strict",
            path: "/",
          });

          originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;

          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // Redirect based on type
        const userType = localStorage.getItem("userType");

        if (userType === "admin") {
          window.location.href = "/admin-login";
        } else {
          window.location.href = "/user-login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
