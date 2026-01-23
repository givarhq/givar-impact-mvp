import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ApiService } from '../services/api';
import toast from 'react-hot-toast';
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
  gallery: string[];
  videoUrl: string | null;
  
  budgetBreakdown: BudgetItem[];
  executionTimeline: TimelineItem[];
  riskAnalysis: string | null;

  kycDocuments: string[];
  organizationName: string | null;
  contactPhone: string | null;

  setProposal: (proposal: any) => void;
  updateField: <K extends keyof Omit<ProposalState, 'setProposal' | 'updateField' | 'saveDraft' | 'addGalleryImage' | 'removeGalleryImage' | 'addKycDocument' | 'removeKycDocument'>>(
    field: K, 
    value: ProposalState[K]
  ) => void;
  
  saveDraft: () => Promise<void>;
  
  addGalleryImage: (url: string) => void;
  removeGalleryImage: (url: string) => void;
  addKycDocument: (key: string) => void;
  removeKycDocument: (key: string) => void;
}

let debounceTimer: NodeJS.Timeout;

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
    gallery: [],
    videoUrl: null,

    budgetBreakdown: [],
    executionTimeline: [],
    riskAnalysis: null,

    kycDocuments: [],
    organizationName: null,
    contactPhone: null,

    setProposal: (proposal) => set(state => {
        // Safely parse JSON fields from DB
        const budget = proposal.budgetBreakdown && typeof proposal.budgetBreakdown === 'object' ? proposal.budgetBreakdown : [];
        const timeline = proposal.executionTimeline && typeof proposal.executionTimeline === 'object' ? proposal.executionTimeline : [];
        
        return { 
            ...state, 
            ...proposal,
            targetAmount: proposal.targetAmount ? Number(proposal.targetAmount) / 100 : null,
            budgetBreakdown: budget,
            executionTimeline: timeline,
        };
    }),

    updateField: (field, value) => {
        set({ [field]: value });
        get().saveDraft();
    },
    
    saveDraft: async () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const state = get();
        if (!state.id) return;

        // Construct DTO
        const { id, saveDraft, setProposal, updateField, ...dto } = state;
        const payload = { ...dto };

        // Convert targetAmount to minor units for backend
        if (payload.targetAmount) {
            (payload as any).targetAmount = payload.targetAmount * 100;
        }
        
        try {
          await ApiService.proposals.update(state.id, payload);
        } catch (error) {
          toast.error('Failed to save draft.');
        }
      }, 1500);
    },

    addGalleryImage: (url) => set(state => ({ gallery: [...state.gallery, url] })),
    removeGalleryImage: (url) => set(state => ({ gallery: state.gallery.filter(item => item !== url) })),
    addKycDocument: (key) => set(state => ({ kycDocuments: [...state.kycDocuments, key] })),
    removeKycDocument: (key) => set(state => ({ kycDocuments: state.kycDocuments.filter(item => item !== key) })),
  }))
);