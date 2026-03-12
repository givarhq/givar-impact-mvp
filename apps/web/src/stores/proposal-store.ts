import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Currency } from '../types';

export interface BudgetItem {
  id: string;
  payTo: string;
  costType: string;
  amount: number;
  description: string;
  stage?: string;
}

export interface TimelineItem {
  id: string;
  phase: string;
  estimatedDate: string;
  deliverables: string;
}

export interface MediaItem {
  id: string;
  url: string;
  key: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  caption?: string;
  file?: File;
}

interface ProposalState {
  id: string | null;
  status: string | null;
  title: string;
  shortDesc: string | null;
  description: string | null;
  categoryId: string | null;
  location: string | null;
  endDate: string | null;
  targetAmount: number | null;
  currency: Currency;

  coverImage: string | null;
  coverImageKey: string | null;
  gallery: MediaItem[];
  videoUrl: string | null;

  budgetBreakdown: BudgetItem[];
  executionTimeline: TimelineItem[];
  riskAnalysis: string | null;

  kycDocuments: string[];
  organizationName: string | null;
  contactPhone: string | null;
  beneficiaryContact: string | null;

  // --- NEW ALIGNMENT FIELDS ---
  beneficiaryName: string | null;
  beneficiaryAge: number | null;
  beneficiaryRelationship: string | null;

  vendorName: string | null;
  vendorContactPerson: string | null;
  vendorEmail: string | null;
  vendorPhone: string | null;
  vendorAddress: string | null;

  hasPreCollectedFunds: boolean;
  preCollectedAmount: number | null;
  preCollectedHeldAt: string | null;
  preCollectedProofKey: string | null;

  setProposal: (proposal: any) => void;
  updateField: <K extends keyof Omit<ProposalState, 'setProposal' | 'updateField' | 'saveDraft' | 'addGalleryItem' | 'removeGalleryItem' | 'updateGalleryItem'>>(
    field: K,
    value: ProposalState[K]
  ) => void;

  saveDraft: () => Promise<void>;

  addGalleryItem: (item: MediaItem) => void;
  removeGalleryItem: (id: string) => void;
  updateGalleryItem: (id: string, updates: Partial<MediaItem>) => void;

  addKycDocument: (key: string) => void;
  removeKycDocument: (key: string) => void;
}

export const useProposalStore = create<ProposalState>()(
  devtools((set, get) => ({
    // Initial State
    id: null,
    status: null,
    title: '',
    shortDesc: null,
    description: null,
    categoryId: null,
    location: null,
    endDate: null,
    targetAmount: null,
    currency: Currency.NGN,

    coverImage: null,
    coverImageKey: null,
    gallery: [],
    videoUrl: null,

    budgetBreakdown: [],
    executionTimeline: [],
    riskAnalysis: null,

    kycDocuments: [],
    organizationName: null,
    contactPhone: null,
    beneficiaryContact: null,

    beneficiaryName: null,
    beneficiaryAge: null,
    beneficiaryRelationship: null,

    vendorName: null,
    vendorContactPerson: null,
    vendorEmail: null,
    vendorPhone: null,
    vendorAddress: null,

    hasPreCollectedFunds: false,
    preCollectedAmount: null,
    preCollectedHeldAt: null,
    preCollectedProofKey: null,

    setProposal: (proposal) => set(state => {
      const gallery = Array.isArray(proposal.gallery)
        ? proposal.gallery.map((item: any) => ({
          ...item,
          key: item.url,
          url: '',
        }))
        : [];

      // Dynamic mapping to bridge legacy schema to new Use of Funds schema
      const budget = Array.isArray(proposal.budgetBreakdown)
        ? proposal.budgetBreakdown.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          payTo: item.payTo || item.vendor || '',
          costType: item.costType || item.type || 'GOODS',
          amount: item.amount !== undefined ? item.amount : (item.cost || 0),
          description: item.description || item.item || '',
          stage: item.stage || ''
        }))
        : [];

      const timeline = proposal.executionTimeline && typeof proposal.executionTimeline === 'object' ? proposal.executionTimeline : [];

      return {
        ...state,
        ...proposal,
        status: proposal.status || null,
        targetAmount: proposal.targetAmount ? Number(proposal.targetAmount) / 100 : null,
        preCollectedAmount: proposal.preCollectedAmount ? Number(proposal.preCollectedAmount) / 100 : null,
        endDate: proposal.endDate || null,
        coverImageKey: proposal.coverImage,
        gallery,
        budgetBreakdown: budget,
        executionTimeline: timeline,
      };
    }),

    updateField: (field, value) => {
      set({ [field]: value });
      get().saveDraft();
    },

    saveDraft: async () => {
      // The useProposalAutoSave hook handles the actual network request.
    },

    addGalleryItem: (item) => {
      set(state => ({ gallery: [...state.gallery, item] }));
      get().saveDraft();
    },
    removeGalleryItem: (id) => {
      set(state => ({ gallery: state.gallery.filter(item => item.id !== id) }));
      get().saveDraft();
    },
    updateGalleryItem: (id, updates) => {
      set(state => ({
        gallery: state.gallery.map(item => item.id === id ? { ...item, ...updates } : item)
      }));
      get().saveDraft();
    },

    addKycDocument: (key) => set(state => ({ kycDocuments: [...state.kycDocuments, key] })),
    removeKycDocument: (key) => set(state => ({ kycDocuments: state.kycDocuments.filter(item => item !== key) })),
  }))
);