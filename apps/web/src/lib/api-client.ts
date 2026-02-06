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

    // Detect if the error response is a Blob (common in forensic exports)
    let data = error.response?.data;
    if (data instanceof Blob && data.type === 'application/json') {
      const text = await data.text();
      data = JSON.parse(text);
    }

    const message = data?.message || 'Something went wrong';

    // 401 Unauthorized: The trigger for session clearing
    if (status === 401) {
      // We use the API route to ensure server-side and client-side cookies are synced
      if (typeof window !== 'undefined') {
        window.location.href = '/api/auth/clear-session';
      }
    }

    if (status === 403) {
      // Check for custom read-only error from ReadOnlyGuard
      if (data?.error === 'READ_ONLY_MODE_ACTIVE') {
        toast.error("Forensic Mode: Mutations are prohibited.", {
          icon: '🛡️',
          style: { borderRadius: '12px', fontWeight: 'bold' }
        });
      } else {
        toast.error("Access Denied");
      }
    }

    // Prevent toast spamming on auth pages
    if (status !== 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/signup')) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);