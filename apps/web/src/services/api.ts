import { redirect } from 'next/navigation';
import { apiClient } from '../lib/api-client';
import { GivingGoal, OrganizationProfile, Project, Wallet } from '../types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_V1 = `${BASE_URL}/v1`;

async function serverFetch<T>(
  endpoint: string,
  token?: string,
  options: RequestInit = {}
): Promise<T | null> {
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
    const res = await fetch(fullUrl, {
      ...options,
      headers: baseHeaders,
      cache: 'no-store',
      // Add a signal to prevent hanging requests from blocking the server thread
      signal: AbortSignal.timeout(8000),
    });

    if (res.status === 401 || res.status === 403) {
      console.error(`[ServerFetch] Auth failure at ${endpoint}. Returning null for handler.`);
      return null;
    }

    if (!res.ok) {
      console.error(`[ServerFetch] Error ${res.status} at ${endpoint}`);
      return null;
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;

  } catch (error) {
    if (error instanceof Error && (error as any).name === 'TimeoutError') {
      console.error(`[ServerFetch] Request timed out: ${fullUrl}`);
      return null;
    }
    console.error(`[ServerFetch] Execution Error at ${fullUrl}`, error);
    return null;
  }
}

export const ApiService = {
  // --- AUTH ---
  auth: {
    login: (data: any) => apiClient.post('/auth/login', data).then(r => r.data),
    signup: (data: any) => apiClient.post('/auth/signup', data).then(r => r.data),
    logout: () => apiClient.post('/auth/logout'),
    forgotPassword: (email: string) =>
      apiClient.post('/auth/forgot-password', { email }).then(r => r.data),

    resetPassword: (data: any) =>
      apiClient.post('/auth/reset-password', data).then(r => r.data),
    verifyEmail: (token: string) =>
      apiClient.get(`/auth/verify-email?token=${token}`).then(r => r.data),
    verifyEmailCode: (code: string) =>
      apiClient.post('/auth/verify-email/code', { code }).then(r => r.data),

    resendVerification: (email: string) =>
      apiClient.post('/auth/resend-verification', { email }).then(r => r.data),

    upgradeToOrganizer: () =>
      apiClient.patch('/auth/account-type/organizer').then(r => r.data),

    getMe: (token: string) => serverFetch<any>('/auth/me', token),

    updateProfile: (data: { firstName: string; lastName: string }) =>
      apiClient.patch('/auth/profile', data).then(r => r.data),

    getMyAuditLogs: (page?: number) =>
      apiClient.get(`/auth/my-audit-logs?page=${page || 1}`).then(r => r.data),

    updatePassword: (data: any) =>
      apiClient.patch('/auth/security/password', data).then(r => r.data),

    updateAvatar: (key: string) =>
      apiClient.patch('/auth/profile/avatar', { key }).then(r => r.data),

    deleteAccount: (password: string) =>
      apiClient.post('/auth/profile/delete', { password }).then(r => r.data),

    generate2FA: () =>
      apiClient.post('/auth/2fa/generate').then(r => r.data),

    enable2FA: (code: string) =>
      apiClient.post('/auth/2fa/enable', { code }).then(r => r.data),

    disable2FA: (password: string) =>
      apiClient.post('/auth/2fa/disable', { password }).then(r => r.data),

    updatePreferences: (prefs: any) =>
      apiClient.patch('/auth/preferences', prefs).then(r => r.data),

    switchAccountType: (type: 'INDIVIDUAL' | 'ORGANIZER') =>
      apiClient.post('/auth/account-type/switch', { type }).then(r => r.data),
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

    defer: (id: string) =>
      apiClient.patch(`/proposals/${id}/defer`).then(r => r.data),
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

    // Submit Proof of Work for a specific milestone
    submitProof: (projectId: string, data: { milestoneId: string; description: string; imageKeys: string[] }) =>
      apiClient.post(`/projects/${projectId}/proof`, data).then(r => r.data),

    getOwnerView: (id: string, token: string) =>
      serverFetch<any>(`/projects/${id}/manage`, token),

    globalSearch: (query: string) =>
      apiClient.get(`/projects/search/global?q=${encodeURIComponent(query)}`).then(r => r.data),
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
    getAnalytics: (token: string) =>
      serverFetch<any>('/admin/analytics/full-report', token),

    getUsers: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: any[]; meta: any }>(`/admin/users?${params.toString()}`, token),

    getUserDetail: (token: string, id: string) =>
      serverFetch<any>(`/admin/users/${id}`, token),

    updateUserStatus: (id: string, action: 'LOCK' | 'UNLOCK') =>
      apiClient.patch(`/admin/users/${id}/status`, { action }).then(r => r.data),

    updateUserRole: (id: string, role: string) =>
      apiClient.patch(`/admin/users/${id}/role`, { role }).then(r => r.data),

    bulkUpdateUsers: (data: { userIds: string[], action: 'LOCK' | 'UNLOCK' | 'SET_USER' | 'SET_ADMIN' }) =>
      apiClient.post('/admin/users/bulk', data).then(r => r.data),

    exportUsers: (params: URLSearchParams) =>
      apiClient.get(`/admin/users/export?${params.toString()}`, {
        responseType: 'blob',
      }),

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

    createProject: (data: any) =>
      apiClient.post('/admin/projects', data).then(r => r.data),

    updateProject: (id: string, data: any) =>
      apiClient.patch(`/admin/projects/${id}`, data).then(r => r.data),

    deleteProject: (id: string) =>
      apiClient.delete(`/admin/projects/${id}`).then(r => r.data),

    // Reuse the public getProject for editing details
    getProjectDetail: (slug: string) =>
      apiClient.get(`/projects/${slug}`).then(r => r.data),

    getProjectById: (token: string, id: string) =>
      serverFetch<any>(`/admin/projects/${id}`, token),

    verifyExternalRef: (token: string, ref: string) =>
      serverFetch<any>(`/admin/reconcile/verify/${ref}`, token),

    executeReconcile: (reference: string) =>
      apiClient.post('/admin/reconcile', { reference }).then(r => r.data),

    getSuspense: (token: string) =>
      serverFetch<any[]>('/admin/suspense', token),

    resolveSuspense: (id: string, data: {
      action: 'REFUND' | 'ALLOCATE';
      allocations?: Array<{ projectId: string; amount: string }>
    }) =>
      apiClient.patch(`/admin/suspense/${id}/resolve`, data).then(r => r.data),

    updateMilestone: (projectId: string, milestoneId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED', imageUrl?: string) =>
      apiClient.patch(`/admin/projects/${projectId}/milestones/${milestoneId}`, { status, imageUrl }).then(r => r.data),

    getPendingEvidence: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: any[]; meta: any }>(`/admin/evidence/pending?${params.toString()}`, token),

    reviewEvidence: (id: string, data: { status: 'APPROVED' | 'REJECTED', feedback?: string }) =>
      apiClient.patch(`/admin/evidence/${id}/review`, data).then(r => r.data),

    recordDisbursement: (projectId: string, data: {
      milestoneId: string;
      amount: string; // Minor units string
      vendorName: string;
      reference: string;
      receiptKey?: string;
    }) =>
      apiClient.post(`/admin/projects/${projectId}/disbursements`, data).then(r => r.data),

    impersonate: (userId: string) =>
      apiClient.post(`/admin/users/${userId}/impersonate`).then(r => r.data),

    globalSearch: (query: string, token: string) =>
      serverFetch<{
        users: any[];
        projects: any[];
        proposals: any[];
        organizations: any[];
        transactions: any[];
        auditLogs: any[];
      }>(`/admin/search?q=${encodeURIComponent(query)}`, token),
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



    getOrganizations: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: OrganizationProfile[]; meta: any }>(
        `/organizations/admin/list?${params.toString()}`,
        token
      ),
    getOrganizationById: (token: string, id: string) =>
      serverFetch<any>(`/organizations/admin/${id}`, token),
  },
};