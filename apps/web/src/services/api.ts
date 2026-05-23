import { apiClient } from '../lib/api-client';
import { GivingGoal, OrganizationProfile, Project, Wallet } from '../types';
import { setCookie } from 'cookies-next';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_V1 = `${BASE_URL}/v1`;

/**
 * Enhanced Server Fetch
 * Logic: Implements Next.js Cache Tags and granular revalidation.
 * This allows "Instant" navigation by serving cached results from the edge.
 */
async function serverFetch<T>(
  endpoint: string,
  token?: string,
  options: RequestInit & { tags?: string[] } = {}
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
    const { tags, ...fetchOptions } = options;

    const res = await fetch(fullUrl, {
      ...fetchOptions,
      headers: baseHeaders,
      cache: options.next?.revalidate === 0 ? 'no-store' : (options.cache as any),
      // Logic: Use Next.js Data Cache with specific invalidation tags
      next: {
        tags: tags || [],
        ...(options.next?.revalidate !== undefined && { revalidate: options.next.revalidate })
      },
      signal: AbortSignal.timeout(30000),
    });

    if (res.status === 401 || res.status === 403) {
      return null;
    }

    if (!res.ok) {
      return null;
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;

  } catch (error) {
    if (error instanceof Error && (error as any).name === 'TimeoutError') {
      console.error(`[ServerFetch] Timeout at ${fullUrl}`);
      return null;
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

    getMe: async (token?: string) => {
      if (token) return serverFetch<any>('/auth/me', token, {
        tags: ['user-profile'],
        next: { revalidate: 0 } // Identity is always fresh
      });

      const res = await apiClient.get('/auth/me');

      if (typeof window !== 'undefined') {
        const cookieOptions = { maxAge: 604800, path: '/', sameSite: 'lax' as const };
        setCookie('givar_user', JSON.stringify(res.data), cookieOptions);
      }

      return res.data;
    },

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
        ? serverFetch<Wallet>('/wallet', token, {
          tags: ['wallet-balance'],
          next: { revalidate: 0 }
        })
        : apiClient.get('/wallet').then(r => r.data),

    fund: (data: {
      amount: string;
      currency: string;
      donorCurrency?: string;
      donorAmount?: string;
      fxRate?: number;
    }) =>
      apiClient.post('/wallet/fund', data).then(r => r.data),

    verifyTransaction: (reference: string) =>
      apiClient.get(`/wallet/verify/${reference}`).then(r => r.data),

    getTransactions: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: any[]; meta: any }>(
        `/wallet/transactions?${params.toString()}`,
        token,
        { tags: ['wallet-history'] }
      ),

    exportCsv: (params: URLSearchParams) =>
      apiClient.get(`/wallet/transactions/export?${params.toString()}`, {
        responseType: 'blob',
      }),
  },

  // --- PROPOSALS ---
  proposals: {
    create: (data: {
      title: string;
      categoryId: string;
      subcategoryId: string;
      beneficiaryRelationship?: string | null;
      beneficiaryName?: string | null;
      beneficiaryAge?: number | null;
      beneficiaryContact?: string | null;
    }) =>
      apiClient.post('/proposals', data).then(r => r.data),

    get: (id: string, token?: string) =>
      token
        ? serverFetch<any>(`/proposals/${id}`, token, { tags: [`proposal-${id}`] })
        : apiClient.get(`/proposals/${id}`).then(r => r.data),

    update: (id: string, data: any) =>
      apiClient.patch(`/proposals/${id}`, data).then(r => r.data),

    submit: (id: string) =>
      apiClient.patch(`/proposals/${id}/submit`).then(r => r.data),

    getMyProposals: (token: string) =>
      serverFetch<any[]>(`/proposals`, token, { tags: ['my-proposals'], next: { revalidate: 0 } }),

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
        token,
        { tags: ['projects-list'], next: { revalidate: 0 } }
      ),

    get: (token: string, slug: string) =>
      serverFetch<
        Project & {
          category: any;
          updates: any[];
          donorCount: number;
        }
      >(`/projects/${slug}`, token, { tags: [`project-${slug}`], next: { revalidate: 0 } }),

    getCategories: (token?: string) =>
      token
        ? serverFetch<any[]>('/projects/categories/list', token, {
          tags: ['categories'],
          next: { revalidate: 0 } // Logic: Bypass cache so admin edits reflect instantly
        })
        : apiClient.get('/projects/categories/list').then(r => r.data),

    submitProof: (projectId: string, data: { milestoneId: string; description: string; imageKeys: string[] }) =>
      apiClient.post(`/projects/${projectId}/proof`, data).then(r => r.data),

    getOwnerView: (id: string, token: string) =>
      serverFetch<any>(`/projects/${id}/manage`, token, { tags: [`project-manage-${id}`] }),

    globalSearch: (query: string) =>
      apiClient.get(`/projects/search/global?q=${encodeURIComponent(query)}`).then(r => r.data),

    getLedger: (params: URLSearchParams, slug?: string, token?: string) => {
      const endpoint = slug ? `/projects/${slug}/ledger` : `/projects/ledger/global`;

      if (token) {
        return serverFetch<any>(`${endpoint}?${params.toString()}`, token, { next: { revalidate: 0 } });
      }

      return apiClient.get(`${endpoint}?${params.toString()}`).then(r => r.data);
    },

    joinWaitlist: (id: string, email: string) =>
      apiClient.post(`/projects/${id}/waitlist`, { email }).then(r => r.data),
  },

  // --- DONATIONS ---
  donations: {
    create: (data: {
      projectId: string;
      amount: string;
      tipAmount?: string; // Optional platform tip in minor units
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
      tipAmount?: string;
      currency: string;
      guestEmail?: string;
      guestName?: string;
      donorCurrency?: string;
      donorAmount?: string;
      fxRate?: number;
    }) => apiClient.post('/donations/direct', data).then(r => r.data),

    getHistory: (token: string) =>
      serverFetch<any[]>('/donations/my-history', token, {
        tags: ['donation-history']
      }),

    getSubscriptions: (token: string) =>
      serverFetch<any[]>('/donations/subscriptions', token, { tags: ['subscriptions'] }),

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
        token,
        { tags: ['giving-goals'] }
      ),
  },

  // --- ADMIN ---
  admin: {
    getAnalytics: (token: string) =>
      serverFetch<any>('/admin/analytics/full-report', token, {
        tags: ['admin-analytics'],
        next: { revalidate: 0 } // 1 minute freshness for heavy analytics
      }),

    getUsers: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: any[]; meta: any }>(`/admin/users?${params.toString()}`, token, { tags: ['admin-users'] }),

    getUserDetail: (token: string, id: string) =>
      serverFetch<any>(`/admin/users/${id}`, token, { tags: [`admin-user-${id}`] }),

    updateUserStatus: (id: string, action: 'LOCK' | 'UNLOCK') =>
      apiClient.patch(`/admin/users/${id}/status`, { action }).then(r => r.data),

    updateUserRole: (id: string, role: string) =>
      apiClient.patch(`/admin/users/${id}/role`, { role }).then(r => r.data),

    bulkUpdateUsers: (data: { userIds: string[], action: 'LOCK' | 'UNLOCK' | 'SET_USER' | 'SET_ADMIN' }) =>
      apiClient.post('/admin/users/bulk', data).then(r => r.data),

    bulkUpdateProjects: (data: { projectIds: string[], action: 'ACTIVATE' | 'SUSPEND' | 'DELETE' }) =>
      apiClient.post('/admin/projects/bulk', data).then(r => r.data),

    bulkUpdateProposals: (data: { proposalIds: string[], action: 'APPROVE' | 'REJECT' }) =>
      apiClient.post('/admin/proposals/bulk', data).then(r => r.data),

    exportUsers: (params: URLSearchParams) =>
      apiClient.get(`/admin/users/export?${params.toString()}`, {
        responseType: 'blob',
      }),

    getProjects: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: Project[]; meta: any }>(
        `/admin/projects?${params.toString()}`,
        token,
        { tags: ['admin-projects'] }
      ),

    approveProject: (id: string) =>
      apiClient.patch(`/admin/projects/${id}/approve`).then(r => r.data),

    suspendProject: (id: string) =>
      apiClient.patch(`/admin/projects/${id}/suspend`).then(r => r.data),

    // Endpoint to finalize a project and trigger donor notifications
    finalizeProject: (id: string, data: { completionNote: string; imageUrl?: string }) =>
      apiClient.post(`/admin/projects/${id}/finalize`, data).then(r => r.data),

    getAuditLogs: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: any[]; meta: any }>(`/admin/audit?${params.toString()}`, token, { tags: ['admin-audit'] }),

    getAuditSummary: (token: string) =>
      serverFetch<{ total24h: number; failedLogins24h: number; highRisk24h: number }>('/admin/audit/summary', token, { next: { revalidate: 0 } }),

    exportAuditLogs: (params: URLSearchParams) =>
      apiClient.get(`/admin/audit/export?${params.toString()}`, {
        responseType: 'blob',
      }),

    getProposals: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: any[]; meta: any }>(`/admin/proposals?${params.toString()}`, token, { tags: ['admin-proposals'] }),

    getProposalDetail: (token: string, id: string) =>
      serverFetch<any>(`/admin/proposals/${id}`, token, { tags: [`admin-proposal-${id}`] }),

    approveProposal: (id: string) =>
      apiClient.patch(`/admin/proposals/${id}/approve`).then(r => r.data),

    rejectProposal: (id: string, feedback: string) =>
      apiClient.patch(`/admin/proposals/${id}/reject`, { feedback }).then(r => r.data),

    requestChanges: (id: string, feedback: string) =>
      apiClient.patch(`/admin/proposals/${id}/request-changes`, { feedback }).then(r => r.data),

    updateAwarenessStatus: (id: string, status: string) =>
      apiClient.patch(`/admin/proposals/${id}/awareness`, { status }).then(r => r.data),

    createProject: (data: any) =>
      apiClient.post('/admin/projects', data).then(r => r.data),

    updateProject: (id: string, data: any) =>
      apiClient.patch(`/admin/projects/${id}`, data).then(r => r.data),

    deleteProject: (id: string) =>
      apiClient.delete(`/admin/projects/${id}`).then(r => r.data),

    getProjectDetail: (slug: string) =>
      apiClient.get(`/projects/${slug}`).then(r => r.data),

    getProjectById: (token: string, id: string) =>
      serverFetch<any>(`/admin/projects/${id}`, token, { tags: [`admin-project-${id}`] }),

    verifyExternalRef: (token: string, ref: string) =>
      serverFetch<any>(`/admin/reconcile/verify/${ref}`, token, { next: { revalidate: 0 } }),

    executeReconcile: (reference: string) =>
      apiClient.post('/admin/reconcile', { reference }).then(r => r.data),

    getSuspense: (token: string) =>
      serverFetch<any[]>('/admin/suspense', token, { tags: ['admin-suspense'], next: { revalidate: 0 } }),

    resolveSuspense: (id: string, data: {
      action: 'REFUND' | 'ALLOCATE';
      allocations?: Array<{ projectId: string; amount: string }>
    }) =>
      apiClient.patch(`/admin/suspense/${id}/resolve`, data).then(r => r.data),

    updateMilestone: (projectId: string, milestoneId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED', imageUrl?: string) =>
      apiClient.patch(`/admin/projects/${projectId}/milestones/${milestoneId}`, { status, imageUrl }).then(r => r.data),

    getPendingEvidence: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: any[]; meta: any }>(`/admin/evidence/pending?${params.toString()}`, token, { tags: ['admin-evidence'] }),

    reviewEvidence: (id: string, data: { status: 'APPROVED' | 'REJECTED', feedback?: string }) =>
      apiClient.patch(`/admin/evidence/${id}/review`, data).then(r => r.data),

    recordDisbursement: (projectId: string, data: {
      milestoneId: string;
      amount: string;
      vendorName: string;
      reference: string;
      receiptKey?: string;
    }) =>
      apiClient.post(`/admin/projects/${projectId}/disbursements`, data).then(r => r.data),

    impersonate: (userId: string) =>
      apiClient.post(`/admin/users/${userId}/impersonate`).then(r => r.data),

    globalSearch: (query: string, token: string) =>
      serverFetch<any>(`/admin/search?q=${encodeURIComponent(query)}`, token, { next: { revalidate: 0 } }),

    triggerDustSweep: () =>
      apiClient.post('/admin/ledger/sweep').then(r => r.data),

    getFinanceReport: (token: string, params: URLSearchParams) =>
      serverFetch<any>(`/admin/finances/report?${params.toString()}`, token, {
        tags: ['admin-finance-report'],
        next: { revalidate: 0 }
      }),

    exportFinanceCsv: (params: URLSearchParams) =>
      apiClient.get(`/admin/finances/export?${params.toString()}`, {
        responseType: 'blob',
      }),

    createCategory: (data: { name: string; description?: string; icon?: string }) =>
      apiClient.post('/admin/categories', data).then(r => r.data),

    updateCategory: (id: string, data: { name?: string; description?: string; icon?: string }) =>
      apiClient.patch(`/admin/categories/${id}`, data).then(r => r.data),

    deleteCategory: (id: string) =>
      apiClient.delete(`/admin/categories/${id}`).then(r => r.data),

    createSubcategory: (categoryId: string, data: { name: string }) =>
      apiClient.post(`/admin/categories/${categoryId}/subcategories`, data).then(r => r.data),

    updateSubcategory: (id: string, data: { name: string }) =>
      apiClient.patch(`/admin/subcategories/${id}`, data).then(r => r.data),

    deleteSubcategory: (id: string) =>
      apiClient.delete(`/admin/subcategories/${id}`).then(r => r.data),

    getConfig: (token: string) =>
      serverFetch<any>('/recommendations/admin/config', token, {
        tags: ['recommendation-config'],
        next: { revalidate: 0 } // Logic: Ensure global config loads instantly upon save
      }),

    updateConfig: (data: any) =>
      apiClient.patch('/recommendations/admin/config', data).then(r => r.data),

    getSlots: (token: string) =>
      serverFetch<any[]>('/recommendations/admin/slots', token, {
        tags: ['featured-slots'],
        next: { revalidate: 0 } // Logic: Ensure slots load instantly upon pin
      }),

    createSlot: (data: { projectId: string; position: number; expiresAt?: string }) =>
      apiClient.post('/recommendations/admin/slots', data).then(r => r.data),

    deleteSlot: (id: string) =>
      apiClient.delete(`/recommendations/admin/slots/${id}`).then(r => r.data),

    updateProjectWeights: (id: string, data: { featureWeight?: number; visibilityScore?: number }) =>
      apiClient.patch(`/recommendations/admin/project/${id}/weights`, data).then(r => r.data),

    updateCategoryWeight: (id: string, weight: number) =>
      apiClient.patch(`/recommendations/admin/category/${id}/weight`, { weight }).then(r => r.data),

    getPaystackBanks: () => apiClient.get('/admin/paystack/banks').then(r => r.data),

    createPaystackSubaccount: (data: { businessName: string; bankCode: string; accountNumber: string; vendorEmail?: string }) =>
      apiClient.post('/admin/paystack/subaccount', data).then(r => r.data),

    bindProposalVendor: (proposalId: string, budgetItemId: string, data: any) =>
      apiClient.patch(`/admin/proposals/${proposalId}/budget/${budgetItemId}/bind-vendor`, data).then(r => r.data),

    rejectAmendment: (messageId: string, feedback: string) =>
      apiClient.patch(`/admin/communication/amendment/${messageId}/reject`, { feedback }).then(r => r.data),
  },

  recommendations: {
    getFeatured: (token?: string) =>
      token
        ? serverFetch<{ data: Project[]; meta: any }>('/recommendations/featured', token, {
          tags: ['featured-feed'],
          next: { revalidate: 0 }
        })
        : apiClient.get('/recommendations/featured').then(r => r.data),

    getFeed: (token?: string, page: number = 1, limit: number = 24) => {
      const endpoint = `/recommendations/feed?page=${page}&limit=${limit}`;
      return token
        ? serverFetch<{ data: Project[]; meta: any }>(endpoint, token, {
          tags: ['discovery-feed'],
          next: { revalidate: 0 }
        })
        : apiClient.get(endpoint).then(r => r.data);
    },

    getGroupedFeed: (token?: string) =>
      token
        ? serverFetch<any[]>('/recommendations/grouped', token, {
          tags: ['grouped-feed'],
          next: { revalidate: 0 }
        })
        : apiClient.get('/recommendations/grouped').then(r => r.data),
  },

  organizations: {
    submitKyc: (data: { legalName: string, registrationNumber?: string, documentKeys: string[], kycType: 'INDIVIDUAL' | 'ORGANIZATION' }) =>
      apiClient.post('/organizations/verify', data).then(r => r.data),

    getMe: (token?: string) =>
      token
        ? serverFetch<any>('/organizations/me', token, { tags: ['org-profile'] })
        : apiClient.get('/organizations/me').then(r => r.data),

    getPending: (token: string) =>
      serverFetch<any[]>('/organizations/admin/pending', token, { tags: ['admin-kyc-queue'] }),

    review: (id: string, data: { status: 'VERIFIED' | 'REJECTED', feedback?: string }) =>
      apiClient.patch(`/organizations/admin/review/${id}`, data).then(r => r.data),

    getOrganizations: (token: string, params: URLSearchParams) =>
      serverFetch<{ data: OrganizationProfile[]; meta: any }>(
        `/organizations/admin/list?${params.toString()}`,
        token,
        { tags: ['admin-orgs-list'] }
      ),
    getOrganizationById: (token: string, id: string) =>
      serverFetch<any>(`/organizations/admin/${id}`, token, { tags: [`admin-org-${id}`] }),

    getPreviewUrl: (key: string) =>
      apiClient.get(`/organizations/documents/preview?key=${encodeURIComponent(key)}`).then(r => r.data),
  },

  communication: {
    sendMessage: (data: { content: string; proposalId?: string; projectId?: string; metadata?: any }) =>
      apiClient.post('/communication', data).then(r => r.data),

    getThread: (params: { proposalId?: string; projectId?: string }) => {
      const query = new URLSearchParams();
      if (params.proposalId) query.set('proposalId', params.proposalId);
      if (params.projectId) query.set('projectId', params.projectId);
      return apiClient.get(`/communication/thread?${query.toString()}`).then(r => r.data);
    }
  },

  notifications: {
    list: () => apiClient.get('/notifications').then(r => r.data),
    unreadCount: () => apiClient.get('/notifications/unread-count').then(r => r.data),
    markRead: (id: string) => apiClient.patch(`/notifications/${id}/read`).then(r => r.data),
    markAllRead: () => apiClient.patch('/notifications/read-all').then(r => r.data),
  },

  // --- FEES ---
  fees: {
    getPublicCurrent: () =>
      apiClient.get('/fees/current').then(r => r.data),

    getAdminCurrent: (token: string) =>
      serverFetch<any>('/admin/fees/current', token, { tags: ['admin-fees'], next: { revalidate: 0 } }),

    getHistory: (token: string) =>
      serverFetch<any[]>('/admin/fees/history', token, { tags: ['admin-fees-history'], next: { revalidate: 0 } }),

    updateGlobalRule: (data: any) =>
      apiClient.post('/admin/fees/update', data).then(r => r.data),
  },
};