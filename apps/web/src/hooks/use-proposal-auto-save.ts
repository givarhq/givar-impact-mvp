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

      // ----------------------------------------------------------------------
      // BULLETPROOF PAYLOAD CONSTRUCTION
      // Logic: Instead of destructuring and hoping we caught all bad properties,
      // we explicitly map ONLY the properties permitted by UpdateProposalDto.
      // This strictly prevents the NestJS forbidNonWhitelisted pipe from throwing 400s.
      // ----------------------------------------------------------------------
      const payload: any = {};

      // 1. Primitive Fields
      if (proposal.title !== undefined) payload.title = proposal.title;
      if (proposal.shortDesc !== undefined) payload.shortDesc = proposal.shortDesc;
      if (proposal.description !== undefined) payload.description = proposal.description;
      if (proposal.personalMessage !== undefined) payload.personalMessage = proposal.personalMessage;
      if (proposal.location !== undefined) payload.location = proposal.location;
      if (proposal.endDate !== undefined) payload.endDate = proposal.endDate;
      if (proposal.currency !== undefined) payload.currency = proposal.currency;
      if (proposal.videoUrl !== undefined) payload.videoUrl = proposal.videoUrl;
      if (proposal.riskAnalysis !== undefined) payload.riskAnalysis = proposal.riskAnalysis;
      if (proposal.kycDocuments !== undefined) payload.kycDocuments = proposal.kycDocuments;
      if (proposal.organizationName !== undefined) payload.organizationName = proposal.organizationName;
      if (proposal.contactPhone !== undefined) payload.contactPhone = proposal.contactPhone;
      if (proposal.beneficiaryContact !== undefined) payload.beneficiaryContact = proposal.beneficiaryContact;
      if (proposal.beneficiaryName !== undefined) payload.beneficiaryName = proposal.beneficiaryName;
      if (proposal.beneficiaryAge !== undefined) payload.beneficiaryAge = proposal.beneficiaryAge;
      if (proposal.beneficiaryRelationship !== undefined) payload.beneficiaryRelationship = proposal.beneficiaryRelationship;

      // Legacy fields
      if (proposal.vendorName !== undefined) payload.vendorName = proposal.vendorName;
      if (proposal.vendorContactPerson !== undefined) payload.vendorContactPerson = proposal.vendorContactPerson;
      if (proposal.vendorEmail !== undefined) payload.vendorEmail = proposal.vendorEmail;
      if (proposal.vendorPhone !== undefined) payload.vendorPhone = proposal.vendorPhone;
      if (proposal.vendorAddress !== undefined) payload.vendorAddress = proposal.vendorAddress;

      // Financial Declarations
      if (proposal.hasPreCollectedFunds !== undefined) payload.hasPreCollectedFunds = proposal.hasPreCollectedFunds;
      if (proposal.preCollectedHeldAt !== undefined) payload.preCollectedHeldAt = proposal.preCollectedHeldAt;
      if (proposal.preCollectedProofKey !== undefined) payload.preCollectedProofKey = proposal.preCollectedProofKey;

      // Ensure UUIDs are valid or explicitly null to satisfy DTO constraints
      payload.categoryId = proposal.categoryId === '' ? null : proposal.categoryId;
      payload.subcategoryId = proposal.subcategoryId === '' ? null : proposal.subcategoryId;

      // 2. Computed / Transformed Fields
      if (proposal.coverImageKey || proposal.coverImage) {
        payload.coverImage = proposal.coverImageKey || proposal.coverImage;
      }

      if (proposal.targetAmount !== undefined && proposal.targetAmount !== null) {
        payload.targetAmount = proposal.targetAmount * 100;
      }

      if (proposal.preCollectedAmount !== undefined && proposal.preCollectedAmount !== null) {
        payload.preCollectedAmount = proposal.preCollectedAmount * 100;
      }

      // 3. Array & Object Structures (Strictly mapped to strip backend-only data)
      if (Array.isArray(proposal.gallery)) {
        payload.gallery = proposal.gallery.map(item => ({
          id: item.id,
          url: item.key || item.url, // Ensure permanent S3 key is used
          type: item.type,
          caption: item.caption
        }));
      }

      if (Array.isArray(proposal.vendors)) {
        payload.vendors = proposal.vendors.map(v => ({
          id: v.id,
          name: v.name,
          email: v.email || '',
          phone: v.phone || '',
          subaccountCode: v.subaccountCode || ''
        }));
      }

      if (Array.isArray(proposal.budgetBreakdown)) {
        payload.budgetBreakdown = proposal.budgetBreakdown.map((b: any) => {
          const cleanItem: any = {
            id: b.id,
            costType: b.costType,
            amount: b.amount,
            description: b.description,
          };
          if (b.vendorId) cleanItem.vendorId = b.vendorId;
          // Legacy properties bypass TS interface limits using any type
          if (b.payTo) cleanItem.payTo = b.payTo;
          if (b.vendorContact) cleanItem.vendorContact = b.vendorContact;
          if (b.stage && b.stage !== '') cleanItem.stage = b.stage;
          return cleanItem;
        });
      }

      if (Array.isArray(proposal.executionTimeline)) {
        payload.executionTimeline = proposal.executionTimeline.map(t => ({
          id: t.id,
          phase: t.phase,
          estimatedDate: t.estimatedDate || 'TBD',
          deliverables: t.deliverables || ''
        }));
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