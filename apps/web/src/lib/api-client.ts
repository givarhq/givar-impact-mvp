import axios, { AxiosError } from 'axios';
import { getCookie, deleteCookie, setCookie } from 'cookies-next';
import toast from 'react-hot-toast';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
const API_URL = BASE_URL.endsWith('/v1') ? BASE_URL : `${BASE_URL}/v1`;

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Refresh Queue Logic
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use((config) => {
  const token = getCookie('givar_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    const originalRequest: any = error.config;
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong';

    // 1. Handle 401 - Refresh Token Logic
    if (status === 401 && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return apiClient(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getCookie('givar_refresh_token');

        if (!refreshToken) {
            throw new Error("No refresh token available");
        }

        // Call backend refresh endpoint
        // NOTE: This call must NOT use apiClient to avoid infinite loops
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, {
            headers: { Authorization: `Bearer ${refreshToken}` }
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Update Cookies
        setCookie('givar_token', accessToken, { maxAge: 900 }); // 15 min
        setCookie('givar_refresh_token', newRefreshToken, { maxAge: 604800 }); // 7 days

        // Update defaults & process queue
        apiClient.defaults.headers.common['Authorization'] = 'Bearer ' + accessToken;
        processQueue(null, accessToken);

        // Retry Original
        originalRequest.headers['Authorization'] = 'Bearer ' + accessToken;
        return apiClient(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        
        // Final Logout if refresh fails
        deleteCookie('givar_token');
        deleteCookie('givar_user');
        deleteCookie('givar_refresh_token');

        if (typeof window !== 'undefined') {
             const path = window.location.pathname;
             if (path.startsWith('/dashboard') || path.startsWith('/admin')) {
                window.location.href = '/login?reason=session_expired';
             }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // 2. Handle 403 (Forbidden)
    if (status === 403 && !originalRequest?.url?.includes('/auth/refresh')) {
      // Don't auto-logout on 403, just reject. 403 means "Logged in but not allowed" (e.g. User accessing Admin)
      // Only logout if it's a critical auth failure
      toast.error("Access Denied");
    }

    // 3. General Errors
    if (status !== 401 && !originalRequest?.url?.includes('/auth/refresh')) {
      // Don't toast if we are just checking a token silently
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);