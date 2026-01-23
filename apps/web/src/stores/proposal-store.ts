import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ApiService } from '../services/api';
import toast from 'react-hot-toast';

// Define the shape of your proposal form data
interface ProposalState {
  id: string | null;
  title: string;
  categoryId: string;
  description: string;
  // ... add all other fields from ProjectProposal schema
  
  coverImage: string | null;
  gallery: string[];
  kycDocuments: string[];

  // Store Actions
  setProposal: (proposal: any) => void;
  updateField: <K extends keyof ProposalState>(field: K, value: ProposalState[K]) => void;
  
  // SOTA: Auto-saving with debouncing
  saveDraft: () => Promise<void>;
  
  // Media Actions
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
    categoryId: '',
    description: '',
    coverImage: null,
    gallery: [],
    kycDocuments: [],

    setProposal: (proposal) => set(proposal),

    updateField: (field, value) => {
        set({ [field]: value });
        get().saveDraft(); // Trigger auto-save on any field change
    },
    
    saveDraft: async () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const state = get();
        if (!state.id) return; // Can't save if no draft ID exists

        // Construct the DTO for the API call
        const { id, saveDraft, setProposal, updateField, ...dto } = state;
        
        try {
          await ApiService.proposals.update(state.id, dto);
          // Optional: Show a subtle "saved" toast
          // toast.success('Draft saved');
        } catch (error) {
          toast.error('Failed to save draft.');
        }
      }, 1500); // 1.5 second debounce
    },

    addGalleryImage: (url) => set(state => ({ gallery: [...state.gallery, url] })),
    removeGalleryImage: (url) => set(state => ({ gallery: state.gallery.filter(item => item !== url) })),
    addKycDocument: (key) => set(state => ({ kycDocuments: [...state.kycDocuments, key] })),
    removeKycDocument: (key) => set(state => ({ kycDocuments: state.kycDocuments.filter(item => item !== key) })),
  }))
);