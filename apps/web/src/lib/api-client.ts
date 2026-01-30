import axios, { AxiosError } from 'axios';
import { getCookie, deleteCookie } from 'cookies-next';
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
    const status = error.response?.status;
    const message = error.response?.data?.message || 'Something went wrong';

    if (status === 401) {
      deleteCookie('givar_token');
      deleteCookie('givar_user');
      deleteCookie('givar_refresh_token');

      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        // Only force redirect if the user is inside the app
        if (path.startsWith('/dashboard') || path.startsWith('/admin')) {
          window.location.href = '/login?reason=session_expired';
        }
      }
    }

    // 2. Handle 403 (Forbidden)
    if (status === 403) {
      toast.error("Access Denied");
    }

    // 3. Global Error Toasting (Excluding login/auth pages to avoid double messages)
    if (status !== 401 && typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (!path.includes('/login') && !path.includes('/signup')) {
            toast.error(message);
        }
    }
    
    return Promise.reject(error);
  }
);