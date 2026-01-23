import axios, { AxiosError } from 'axios';
import { getCookie, deleteCookie } from 'cookies-next';
import toast from 'react-hot-toast';

const API_URL =
  `${process.env.NEXT_PUBLIC_API_URL}/v1` ||
  'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// --------------------------------------------------
// REQUEST INTERCEPTOR: Attach Token
// --------------------------------------------------
apiClient.interceptors.request.use((config) => {
  const token = getCookie('givar_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --------------------------------------------------
// RESPONSE INTERCEPTOR: 401 / 403 GLOBAL HANDLER
// --------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message || 'Something went wrong';

    if (status === 401 || status === 403) {
      // Clear auth state
      deleteCookie('givar_token');
      deleteCookie('givar_user');

      // Hard redirect (safe outside React)
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      return Promise.reject(error);
    }

    // Non-auth errors → toast
    toast.error(message);
    return Promise.reject(error);
  }
);
