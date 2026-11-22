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

    if (proposal.status && !['DRAFT', 'CHANGES_REQUESTED'].includes(proposal.status)) {
      clearTimeout(debounceTimer);
      return;
    }

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const payload: any = {};

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
      if (proposal.isMinor !== undefined) payload.isMinor = proposal.isMinor;
      if (proposal.beneficiaryRelationship !== undefined) payload.beneficiaryRelationship = proposal.beneficiaryRelationship;

      if (proposal.vendorName !== undefined) payload.vendorName = proposal.vendorName;
      if (proposal.vendorContactPerson !== undefined) payload.vendorContactPerson = proposal.vendorContactPerson;
      if (proposal.vendorEmail !== undefined) payload.vendorEmail = proposal.vendorEmail;
      if (proposal.vendorPhone !== undefined) payload.vendorPhone = proposal.vendorPhone;
      if (proposal.vendorAddress !== undefined) payload.vendorAddress = proposal.vendorAddress;

      if (proposal.hasPreCollectedFunds !== undefined) payload.hasPreCollectedFunds = proposal.hasPreCollectedFunds;

      payload.categoryId = proposal.categoryId === '' ? null : proposal.categoryId;
      payload.subcategoryId = proposal.subcategoryId === '' ? null : proposal.subcategoryId;

      if (proposal.coverImageKey || proposal.coverImage) {
        payload.coverImage = proposal.coverImageKey || proposal.coverImage;
      }

      if (proposal.targetAmount !== undefined && proposal.targetAmount !== null) {
        payload.targetAmount = proposal.targetAmount * 100;
      }

      if (proposal.preCollectedAmount !== undefined && proposal.preCollectedAmount !== null) {
        payload.preCollectedAmount = proposal.preCollectedAmount * 100;
      }

      if (Array.isArray(proposal.gallery)) {
        payload.gallery = proposal.gallery.map(item => ({
          id: item.id,
          url: item.key || item.url,
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
        if (error?.response?.status === 403) return;

        console.error('Auto-save failed:', error);
        toast.error('Auto-save failed. Check your data or connection.');
      }
    }, 2000);

    return () => clearTimeout(debounceTimer);
  }, [proposal]);
}