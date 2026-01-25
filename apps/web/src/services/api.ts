import { redirect } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { GivingGoal, Project, Wallet } from '../types';
import { cookies } from 'next/dist/server/request/cookies';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_V1 = `${BASE_URL}/v1`;

async function serverFetch<T>(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<T | null> {
  const cookieStore = await cookies();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${API_V1}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    let res = await fetch(fullUrl, {
      headers,
      cache: 'no-store',
      ...options,
    });

    // Server-Side Token Refresh Logic
    if (res.status === 401) {
      const refreshToken = cookieStore.get('givar_refresh_token')?.value;

      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_V1}/auth/refresh`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${refreshToken}`, 'Content-Type': 'application/json' },
          });

          if (refreshRes.ok) {
            const { accessToken } = await refreshRes.json();
            
            const retryRes = await fetch(fullUrl, {
              headers: { ...headers, 'Authorization': `Bearer ${accessToken}` },
              cache: 'no-store',
              ...options,
            });

            if (retryRes.ok) return retryRes.json();
          }
        } catch (e) {
          console.error("Server-side refresh failed");
        }
      }

      console.error(`Auth Session Expired at ${endpoint}`);
      redirect('/api/auth/clear-session');
    }

    if (!res.ok) {
        console.error(`API Error ${fullUrl}: ${res.status}`);
        return null;
    }
    
    return res.json();
  } catch (error) {
    console.error(`NETWORK ERROR at ${fullUrl}:`, error);
    
    if (process.env.NODE_ENV === 'development') {
        throw new Error(`Fetch failed to ${fullUrl}. Is the backend API running?`);
    }
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
      token
        ? serverFetch<Wallet>('/wallet', token)
        : apiClient.get('/wallet').then(r => r.data),

    fund: (data: { amount: string; currency: string }) =>
      apiClient.post('/wallet/fund', data).then(r => r.data),

    verifyTransaction: (reference: string) => 
      apiClient.get(`/wallet/verify/${reference}`).then(r => r.data),

    getTransactions: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: any[]; meta: any }>(
        `/wallet/transactions?${params.toString()}`,
        token
      ),

    exportCsv: (params: URLSearchParams) =>
      apiClient.get(`/wallet/transactions/export?${params.toString()}`, {
        responseType: 'blob',
      }),
  },

  // --- PROPOSALS ---
  proposals: {
    create: (data: { title: string; categoryId: string }) => 
      apiClient.post('/proposals', data).then(r => r.data),
      
    // 2. Get a specific proposal for editing
    get: (id: string, token?: string) =>
      token
        ? serverFetch<any>(`/proposals/${id}`, token)
        : apiClient.get(`/proposals/${id}`).then(r => r.data),

    // 3. Update (Auto-save) a draft
    update: (id: string, data: any) =>
      apiClient.patch(`/proposals/${id}`, data).then(r => r.data),
      
    // 4. Submit a draft for review
    submit: (id: string) =>
      apiClient.patch(`/proposals/${id}/submit`).then(r => r.data),
      
    // 5. Get all proposals for the logged-in user
    getMyProposals: (token: string) =>
      serverFetch<any[]>(`/proposals`, token),

    // 6. Get a presigned URL for file uploads
    getUploadUrl: (data: { fileType: string; useCase: 'public' | 'kyc' | 'docs' }) =>
      apiClient.post('/proposals/upload-url', data).then(r => r.data),

    getPreviewUrl: (key: string, proposalId: string) =>
      apiClient.get(`/proposals/preview-url?key=${key}&proposalId=${proposalId}`).then(r => r.data),
  },

  // --- PROJECTS ---
  projects: {
    list: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: Project[]; meta: any }>(
        `/projects?${params.toString()}`,
        token
      ),

    get: (token: string, slug: string) =>
      serverFetch<
        Project & {
          category: any;
          updates: any[];
          donorCount: number;
        }
      >(`/projects/${slug}`, token),

      getCategories: (token?: string) =>
      token
        ? serverFetch<any[]>('/projects/categories/list', token)
        : apiClient.get('/projects/categories/list').then(r => r.data),
  },

  // --- DONATIONS ---
  donations: {
    create: (data: {
      projectId: string;
      amount: string;
      currency: string;
      message?: string;
    }) => apiClient.post('/donations', data).then(r => r.data),

    subscribe: (data: {
      projectId: string;
      amount: string;
      currency: string;
      interval: 'WEEKLY' | 'MONTHLY';
    }) => apiClient.post('/donations/subscribe', data).then(r => r.data),

    direct: (data: {
      projectId: string;
      amount: string;
      currency: string;
      guestEmail?: string;
      guestName?: string;
    }) => apiClient.post('/donations/direct', data).then(r => r.data),

    getHistory: (token: string) =>
      serverFetch<any[]>('/donations/my-history', token),

    getSubscriptions: (token: string) =>
      serverFetch<any[]>('/donations/subscriptions', token),
    
    updateSubscription: (id: string, status: 'ACTIVE' | 'PAUSED' | 'CANCELLED') =>
      apiClient.patch(`/donations/subscriptions/${id}`, { status }).then(r => r.data),
  },

  // --- GOALS ---
  goals: {
    upsert: (data: {
      targetAmount: string;
      currency: string;
      interval: 'MONTHLY' | 'YEARLY';
    }) => apiClient.post('/goals', data).then(r => r.data),

    getActive: (
      token: string,
      interval: 'MONTHLY' | 'YEARLY' = 'MONTHLY'
    ) =>
      serverFetch<GivingGoal>(
        `/goals/active?interval=${interval}`,
        token
      ),
  },

  // --- ADMIN ---
  admin: {
    getStats: (token: string) =>
      serverFetch<{
        users: number;
        projects: number;
        donations: number;
        volume: string;
      }>('/admin/dashboard', token),

    getUsers: (token: string, page = 1) =>
      serverFetch<any[]>(`/admin/users?page=${page}`, token),

    getProjects: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: Project[]; meta: any }>(
        `/admin/projects?${params.toString()}`,
        token
      ),

    approveProject: (id: string) =>
      apiClient.patch(`/admin/projects/${id}/approve`).then(r => r.data),

    suspendProject: (id: string) =>
      apiClient.patch(`/admin/projects/${id}/suspend`).then(r => r.data),

    getAuditLogs: (token: string, params: URLSearchParams) => 
      serverFetch<{ data: any[]; meta: any }>(`/admin/audit?${params.toString()}`, token),
      
    getAuditSummary: (token: string) =>
      serverFetch<{ total24h: number; failedLogins24h: number; highRisk24h: number }>('/admin/audit/summary', token),
  },
};