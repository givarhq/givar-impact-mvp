import { redirect } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { GivingGoal, Project, Wallet } from '../types';
import { cookies } from 'next/dist/server/request/cookies';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_V1 = `${BASE_URL}/v1`;

async function serverFetch<T>(
  endpoint: string,
  token?: string, 
  options: RequestInit = {}
): Promise<T | null> {
  const cookieStore = await cookies();

  const sanitizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${API_V1}${sanitizedEndpoint}`;

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    let res = await fetch(fullUrl, {
      ...options,
      headers: baseHeaders,
      cache: 'no-store',
    });

    // --------------------------------------------------
    // 401 → Attempt server-side refresh (Rescue the render)
    // --------------------------------------------------
    if (res.status === 401 && !endpoint.includes('/auth/refresh')) {
      const refreshToken = cookieStore.get('givar_refresh_token')?.value;

      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_V1}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${refreshToken}`,
              'Content-Type': 'application/json',
            },
            cache: 'no-store',
          });

          if (refreshRes.ok) {
            const { accessToken } = await refreshRes.json();

            /* 
               NOTE: We CANNOT call cookieStore.set() here because this 
               function is called during Server Component rendering. 
               
               We simply use the new accessToken to retry the current request 
               so the page loads correctly for the user.
            */

            const retryRes = await fetch(fullUrl, {
              ...options,
              headers: {
                ...(options.headers as Record<string, string>),
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
              },
              cache: 'no-store',
            });

            if (retryRes.ok) return retryRes.json();
          }
        } catch (err) {
          console.error(`[ServerFetch] Rescue failed for ${fullUrl}`, err);
        }
      }

      // If rescue fails, redirect to clear session
      redirect('/api/auth/clear-session');
    }

    if (!res.ok) {
      console.error(`[ServerFetch] API error ${res.status} at ${fullUrl}`);
      return null;
    }

    return res.json();

  } catch (error) {
    // If it's a redirect thrown by Next.js, re-throw it so Next.js can handle it
    if (error instanceof Error && error.message === 'NEXT_REDIRECT') throw error;
    
    console.error(`[ServerFetch] NETWORK ERROR at ${fullUrl}`, error);

    if (process.env.NODE_ENV === 'development') {
      throw new Error(`Fetch failed to ${fullUrl}. Is the backend running?`);
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

    delete: (id: string) => 
      apiClient.delete(`/proposals/${id}`).then(r => r.data),
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

    getProposals: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: any[]; meta: any }>(`/admin/proposals?${params.toString()}`, token),

    getProposalDetail: (token: string, id: string) =>
      serverFetch<any>(`/admin/proposals/${id}`, token),

    approveProposal: (id: string) =>
      apiClient.patch(`/admin/proposals/${id}/approve`).then(r => r.data),

    rejectProposal: (id: string, feedback: string) =>
      apiClient.patch(`/admin/proposals/${id}/reject`, { feedback }).then(r => r.data),

    requestChanges: (id: string, feedback: string) =>
      apiClient.patch(`/admin/proposals/${id}/request-changes`, { feedback }).then(r => r.data),
  },

  // Organization Verification Domain
  organizations: {
    submitKyc: (data: { legalName: string, registrationNumber?: string, documentKeys: string[] }) =>
      apiClient.post('/organizations/verify', data).then(r => r.data),

    getMe: (token?: string) =>
      token 
        ? serverFetch<any>('/organizations/me', token)
        : apiClient.get('/organizations/me').then(r => r.data),

    // Admin Methods
    getPending: (token: string) =>
      serverFetch<any[]>('/organizations/admin/pending', token),

    review: (id: string, data: { status: 'VERIFIED' | 'REJECTED', feedback?: string }) =>
      apiClient.patch(`/organizations/admin/review/${id}`, data).then(r => r.data),
  },
};