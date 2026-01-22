import { apiClient } from '../lib/api-client';
import { GivingGoal, Project, Wallet } from '../types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_V1 = `${BASE_URL}/v1`;

// SOTA: Server-Side Fetch Helper (No caching by default for financial data)
async function serverFetch<T>(endpoint: string, token: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const res = await fetch(`${API_V1}${endpoint}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers 
      },
      cache: 'no-store', // SOTA: Financial data must be fresh
      ...options,
    });
    
    if (!res.ok) {
        // Optional: Log error details on server
        console.error(`API Error ${endpoint}: ${res.status}`);
        return null;
    }
    return res.json();
  } catch (error) {
    console.error(`Fetch Error ${endpoint}:`, error);
    return null;
  }
}

export const ApiService = {
    // --- AUTH ---
  auth: {
    login: (data: any) => apiClient.post('/auth/login', data).then(r => r.data),
    signup: (data: any) => apiClient.post('/auth/signup', data).then(r => r.data),
    logout: () => apiClient.post('/auth/logout'),
  },

  // --- WALLET ---
  wallet: {
    get: (token?: string) => 
      token ? serverFetch<Wallet>('/wallet', token) : apiClient.get('/wallet').then(r => r.data),
    
    fund: (data: { amount: string; currency: string }) => 
      apiClient.post('/wallet/fund', data).then(r => r.data),
      
    getTransactions: (token: string, params: URLSearchParams) => 
      serverFetch<{ data: any[]; meta: any }>(`/wallet/transactions?${params.toString()}`, token),
      
    exportCsv: (params: URLSearchParams) => 
      apiClient.get(`/wallet/transactions/export?${params.toString()}`, { responseType: 'blob' }),
  },

  // --- PROJECTS ---
  projects: {
    list: (token: string, params: URLSearchParams) => 
      serverFetch<{ data: Project[]; meta: any }>(`/projects?${params.toString()}`, token),
      
    get: (token: string, slug: string) => 
      serverFetch<Project & { category: any; updates: any[]; donorCount: number }>(`/projects/${slug}`, token),
  },

  // --- DONATIONS ---
  donations: {
    create: (data: { projectId: string; amount: string; currency: string; message?: string }) => 
      apiClient.post('/donations', data).then(r => r.data),
      
    subscribe: (data: { projectId: string; amount: string; currency: string; interval: 'WEEKLY' | 'MONTHLY' }) => 
      apiClient.post('/donations/subscribe', data).then(r => r.data),
      
    direct: (data: { 
        projectId: string; 
        amount: string; 
        currency: string; 
        guestEmail?: string;
        guestName?: string;
    }) => 
      apiClient.post('/donations/direct', data).then(r => r.data),
      
    getHistory: (token: string) => 
      serverFetch<any[]>('/donations/my-history', token),
      
    getSubscriptions: (token: string) => 
      serverFetch<any[]>('/donations/subscriptions', token),
  },

  // --- GOALS ---
  goals: {
    upsert: (data: { targetAmount: string; currency: string; interval: 'MONTHLY' | 'YEARLY' }) => 
      apiClient.post('/goals', data).then(r => r.data),
      
    getActive: (token: string, interval: 'MONTHLY' | 'YEARLY' = 'MONTHLY') => 
      serverFetch<GivingGoal>(`/goals/active?interval=${interval}`, token),
  },

  // --- ADMIN ---
  admin: {
    getStats: (token: string) => 
      serverFetch<{ users: number; projects: number; donations: number; volume: string }>('/admin/dashboard', token),
      
    getUsers: (token: string, page = 1) => 
      serverFetch<any[]>(`/admin/users?page=${page}`, token),

    getProjects: (token: string, params: URLSearchParams) => 
      serverFetch<{ data: Project[]; meta: any }>(`/admin/projects?${params.toString()}`, token),
      
    approveProject: (id: string) => 
      apiClient.patch(`/admin/projects/${id}/approve`).then(r => r.data),
      
    suspendProject: (id: string) => 
      apiClient.patch(`/admin/projects/${id}/suspend`).then(r => r.data),
  }
};