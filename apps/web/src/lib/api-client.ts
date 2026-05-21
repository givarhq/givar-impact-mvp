import axios, { AxiosError } from 'axios';
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
  // Logic: Force no-cache for client-side mutations to prevent stale UI
  if (config.method !== 'get') {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers['Pragma'] = 'no-cache';
  }

  return config;
});

// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    // Logic: Silently ignore network drops or aborted requests caused by hard browser navigations
    if (axios.isCancel(error) || error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    let data = error.response?.data;
    if (data instanceof Blob && data.type === 'application/json') {
      const text = await data.text();
      data = JSON.parse(text);
    }

    const message = data?.message || 'Something went wrong';

    if (status === 401) {
      if (typeof window !== 'undefined') {
        window.location.href = '/api/auth/clear-session';
      }
    }

    if (status === 403) {
      if (data?.error === 'READ_ONLY_MODE_ACTIVE') {
        toast.error("Forensic Mode: Mutations are prohibited.", {
          icon: '🛡️',
          style: { borderRadius: '12px', fontWeight: 'bold', fontSize: '12px' }
        });
      } else {
        toast.error("Access denied");
      }
    }

    if (status !== 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (!path.includes('/login') && !path.includes('/signup')) {
        // Logic: Only show the first message if it's an array (class-validator default)
        const displayMessage = Array.isArray(message) ? message[0] : message;
        toast.error(displayMessage, {
          style: { borderRadius: '24px', fontWeight: 'bold', fontSize: '12px' }
        });
      }
    }

    return Promise.reject(error);
  }
);