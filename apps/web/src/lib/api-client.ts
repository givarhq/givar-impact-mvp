import axios, { AxiosError } from 'axios';
import { getCookie, deleteCookie } from 'cookies-next';
import toast from 'react-hot-toast';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/v1` || 'http://localhost:3001/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// 1. REQUEST INTERCEPTOR: Attach Token
apiClient.interceptors.request.use((config) => {
  const token = getCookie('givar_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. RESPONSE INTERCEPTOR: Handle Errors Globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const message = error.response?.data?.message || 'Something went wrong';
    
    if (error.response?.status === 401) {
      // 1. Always clear bad credentials
      deleteCookie('givar_token');
      deleteCookie('givar_user');

      // 2. Only redirect if on a protected route
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        // If we are on the dashboard, kick them out.
        // If we are on /explore or /login, stay there.
        if (path.startsWith('/dashboard')) {
             window.location.href = '/login';
        }
      }
    }

    if (error.response?.status !== 401) {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);