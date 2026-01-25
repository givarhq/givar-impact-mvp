import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Currency } from '../types';

// Define types for structured JSON fields for type safety
export interface BudgetItem {
  id: string;
  item: string;
  cost: number;
  vendor: string;
  type: 'SERVICE' | 'GOODS' | 'LOGISTICS' | 'OTHER';
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
  caption: string;
  file?: File;
}

interface ProposalState {
  id: string | null;
  title: string;
  shortDesc: string | null;
  description: string | null;
  categoryId: string | null;
  location: string | null;
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
    title: '',
    shortDesc: null,
    description: null,
    categoryId: null,
    location: null,
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

    setProposal: (proposal) => set(state => {
        const gallery = Array.isArray(proposal.gallery) 
            ? proposal.gallery.map((item: any) => ({
                ...item,
                key: item.url,
                url: '',
            })) 
            : [];
        const budget = proposal.budgetBreakdown && typeof proposal.budgetBreakdown === 'object' ? proposal.budgetBreakdown : [];
        const timeline = proposal.executionTimeline && typeof proposal.executionTimeline === 'object' ? proposal.executionTimeline : [];
        
        return { 
            ...state, 
            ...proposal,
            targetAmount: proposal.targetAmount ? Number(proposal.targetAmount) / 100 : null,
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