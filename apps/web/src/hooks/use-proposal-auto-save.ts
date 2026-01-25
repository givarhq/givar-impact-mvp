'use client';

import { useEffect } from 'react';
import { useProposalStore } from '../stores/proposal-store';
import { ApiService } from '../services/api';
import toast from 'react-hot-toast';

let debounceTimer: NodeJS.Timeout;

export function useProposalAutoSave() {
  const proposal = useProposalStore(state => state);

  useEffect(() => {
    if (!proposal.id) return; 

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const { 
          saveDraft, setProposal, updateField, addGalleryItem, 
          removeGalleryItem, updateGalleryItem, addKycDocument, 
          removeKycDocument, coverImage, gallery,
          ...dto 
      } = proposal;

      // Map the gallery to ensure the permanent S3 KEY is stored in the DB 'url' field
      const mappedGallery = gallery.map(item => ({
          id: item.id,
          url: item.key, // Permanent key/path saved to DB
          type: item.type,
          caption: item.caption
      }));

      const payload = { 
          ...dto, 
          coverImage: proposal.coverImageKey, // Permanent key saved to DB
          gallery: mappedGallery 
      };

      if (payload.targetAmount) {
          (payload as any).targetAmount = payload.targetAmount * 100;
      }
      
      try {
        await ApiService.proposals.update(proposal.id!, payload);
      } catch (error) {
        console.error('Auto-save failed:', error);
        toast.error('Auto-save failed. Check your data or connection.');
      }
    }, 2000); 

    return () => clearTimeout(debounceTimer);
  }, [proposal]); 
}