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

    // Logic: Immediately kill any pending auto-save timers if the 
    // proposal is moving out of an editable state (like submission).
    if (proposal.status && !['DRAFT', 'CHANGES_REQUESTED'].includes(proposal.status)) {
      clearTimeout(debounceTimer);
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      // Isolate non-payload data to prevent server validation errors
      const {
        saveDraft, setProposal, updateField, addGalleryItem,
        removeGalleryItem, updateGalleryItem, addKycDocument,
        removeKycDocument, addVendor, removeVendor, updateVendor,
        coverImage, gallery, status, coverImageKey,
        ...dto
      } = proposal;

      // Map the gallery to ensure the permanent S3 KEY is stored in the DB 'url' field
      const mappedGallery = gallery.map(item => ({
        id: item.id,
        url: item.key, // Permanent key/path saved to DB
        type: item.type,
        caption: item.caption
      }));

      const payload: any = {
        ...dto,
        coverImage: proposal.coverImageKey, // Permanent key saved to DB
        gallery: mappedGallery,
      };

      // SECURITY & UX FIX: Prevent "subcategoryId must be a UUID" error.
      // Radix Select components often yield an empty string when cleared, but 
      // the NestJS backend strictly expects `null` or a valid UUID.
      if (payload.subcategoryId === '') payload.subcategoryId = null;
      if (payload.categoryId === '') payload.categoryId = null;

      if (payload.targetAmount !== undefined && payload.targetAmount !== null) {
        payload.targetAmount = payload.targetAmount * 100;
      }

      if (payload.preCollectedAmount !== undefined && payload.preCollectedAmount !== null) {
        payload.preCollectedAmount = payload.preCollectedAmount * 100;
      }

      try {
        await ApiService.proposals.update(proposal.id!, payload);
      } catch (error: any) {
        // Prevent generic toast if it's an expected lock rejection mid-flight
        if (error?.response?.status === 403) return;

        console.error('Auto-save failed:', error);
        toast.error('Auto-save failed. Check your data or connection.');
      }
    }, 2000);

    return () => clearTimeout(debounceTimer);
  }, [proposal]);
}