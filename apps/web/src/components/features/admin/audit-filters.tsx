'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, memo } from 'react';
import { Search, X, Filter, ArrowRight, Download, Loader2 } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '../../ui/select';
import { cn } from '../../../lib/utils/cn';
import { ApiService } from '../../../services/api';
import toast from 'react-hot-toast';

export const AuditFilters = memo(function AuditFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [action, setAction] = useState(searchParams.get('action') || 'all');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(!!searchParams.get('search'));
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (search === (searchParams.get('search') || '') &&
      action === (searchParams.get('action') || 'all') &&
      startDate === (searchParams.get('startDate') || '') &&
      endDate === (searchParams.get('endDate') || '')) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    if (search) params.set('search', search); else params.delete('search');
    if (action !== 'all') params.set('action', action); else params.delete('action');
    if (startDate) params.set('startDate', startDate); else params.delete('startDate');
    if (endDate) params.set('endDate', endDate); else params.delete('endDate');

    const timeout = setTimeout(() => {
      if (params.toString() !== searchParams.toString()) {
        router.replace(`?${params.toString()}`, { scroll: false });
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [search, action, startDate, endDate, router, searchParams]);

  const clearFilters = () => {
    setSearch('');
    setAction('all');
    setStartDate('');
    setEndDate('');
  };

  const handleExport = async () => {
    setIsExporting(true);
    const toastId = toast.loading("Generating Forensic Audit Export...");
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('page');
      params.delete('limit');
      const response = await ApiService.admin.exportAuditLogs(params);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `givar-audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Forensic Ledger Exported', { id: toastId });
    } catch (e: any) {
      toast.error('Export Failed', { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters = search || action !== 'all' || startDate || endDate;

  const ActionOptions = () => (
    <>
      <SelectItem value="all" className="text-xs">All actions</SelectItem>

      <SelectGroup>
        <SelectLabel className="text-[10px] font-black text-primary px-2 py-1.5  tracking-widest">Identity & Access</SelectLabel>
        <SelectItem value="USER_LOGIN" className="text-xs">User Login</SelectItem>
        <SelectItem value="USER_LOGIN_FAILED" className="text-xs">Login Failed</SelectItem>
        <SelectItem value="USER_REGISTER" className="text-xs">User Registration</SelectItem>
        <SelectItem value="PASSWORD_CHANGE" className="text-xs">Password Change</SelectItem>
        <SelectItem value="PROFILE_UPDATED" className="text-xs">Profile Updated</SelectItem>
        <SelectItem value="AVATAR_UPDATED" className="text-xs">Avatar Updated</SelectItem>
        <SelectItem value="ACCOUNT_DELETED" className="text-xs">Account Deleted</SelectItem>
        <SelectItem value="USER_LOCKED" className="text-xs">User Restricted</SelectItem>
        <SelectItem value="USER_UNLOCKED" className="text-xs">User Restored</SelectItem>
        <SelectItem value="USER_ROLE_CHANGED" className="text-xs">Role Modified</SelectItem>
        <SelectItem value="IMPERSONATION_STARTED" className="text-xs">Forensic Proxy Initialized</SelectItem>
      </SelectGroup>

      <SelectGroup>
        <SelectLabel className="text-[10px] font-black text-primary px-2 py-1.5  tracking-widest">Hardware Security</SelectLabel>
        <SelectItem value="TWO_FACTOR_GEN_SECRET" className="text-xs">2FA Secret Generated</SelectItem>
        <SelectItem value="TWO_FACTOR_ENABLED" className="text-xs">2FA Enabled</SelectItem>
        <SelectItem value="TWO_FACTOR_DISABLED" className="text-xs">2FA Disabled</SelectItem>
        <SelectItem value="TWO_FACTOR_VERIFY_FAILED" className="text-xs">2FA Verify Failed</SelectItem>
      </SelectGroup>

      <SelectGroup>
        <SelectLabel className="text-[10px] font-black text-primary px-2 py-1.5  tracking-widest">Financial Ledger</SelectLabel>
        <SelectItem value="WALLET_FUND" className="text-xs">Wallet Funding Initiated</SelectItem>
        <SelectItem value="WALLET_FUND_SUCCESS" className="text-xs">Wallet Funding Success</SelectItem>
        <SelectItem value="WALLET_DEBIT" className="text-xs">Wallet Debit Recorded</SelectItem>
        <SelectItem value="DONATION_CREATED" className="text-xs">Donation Created</SelectItem>
        <SelectItem value="DIRECT_PAYMENT_INITIATED" className="text-xs">Direct Payment Initiated</SelectItem>
        <SelectItem value="DIRECT_PAYMENT_FULFILLED" className="text-xs">Direct Payment Fulfilled</SelectItem>
        <SelectItem value="RECONCILIATION_PERFORMED" className="text-xs">Manual Reconciliation</SelectItem>
        <SelectItem value="FUNDS_MOVED_TO_SUSPENSE" className="text-xs">Suspense Ledger Entry</SelectItem>
        <SelectItem value="FUNDS_REALLOCATED" className="text-xs">Capital Reallocated</SelectItem>
        <SelectItem value="DISBURSEMENT_RECORDED" className="text-xs">Disbursement Recorded</SelectItem>
        <SelectItem value="TRANSACTION_RESOLVED" className="text-xs">Ledger Entry Resolved</SelectItem>
        <SelectItem value="RECEIPT_VIEWED" className="text-xs">Receipt Access Logged</SelectItem>
      </SelectGroup>

      <SelectGroup>
        <SelectLabel className="text-[10px] font-black text-primary px-2 py-1.5  tracking-widest">Causes & Proposals</SelectLabel>
        <SelectItem value="PROJECT_CREATED" className="text-xs">Project Created</SelectItem>
        <SelectItem value="PROJECT_UPDATED" className="text-xs">Project Updated</SelectItem>
        <SelectItem value="PROJECT_DELETED" className="text-xs">Project Deleted</SelectItem>
        <SelectItem value="PROJECT_SUSPENDED" className="text-xs">Project Suspended</SelectItem>
        <SelectItem value="PROPOSAL_REJECTED" className="text-xs">Proposal Rejected</SelectItem>
        <SelectItem value="MILESTONE_PROOF_SUBMITTED" className="text-xs">Impact Evidence Submitted</SelectItem>
        <SelectItem value="USER_VERIFIED" className="text-xs">Entity KYC Verified</SelectItem>
        <SelectItem value="USER_REJECTED" className="text-xs">Entity KYC Rejected</SelectItem>
        <SelectItem value="MESSAGE_SENT" className="text-xs">Official Message Sent</SelectItem>
      </SelectGroup>

      <SelectGroup>
        <SelectLabel className="text-[10px] font-black text-primary px-2 py-1.5  tracking-widest">Discovery & Protocol</SelectLabel>
        <SelectItem value="RECOMMENDATION_CONFIG_UPDATED" className="text-xs">Algorithm Configuration Updated</SelectItem>
        <SelectItem value="FEATURED_SLOT_CREATED" className="text-xs">Featured Slot Assigned</SelectItem>
        <SelectItem value="FEATURED_SLOT_DELETED" className="text-xs">Featured Slot Removed</SelectItem>
        <SelectItem value="CATEGORY_WEIGHT_UPDATED" className="text-xs">Sector Weight Updated</SelectItem>
        <SelectItem value="PROJECT_DISCOVERY_WEIGHTS_UPDATED" className="text-xs">Discovery Weights Updated</SelectItem>
        <SelectItem value="WEBHOOK_RECEIVED" className="text-xs">Gateway Webhook Event</SelectItem>
        <SelectItem value="WEBHOOK_SIGNATURE_FAILED" className="text-xs">Webhook Signature Failure</SelectItem>
      </SelectGroup>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 relative min-h-[40px] w-full">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <h1 className="md:hidden text-lg font-bold tracking-tight text-foreground shrink-0">
            Audit Log
          </h1>

          <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-border/40 focus-within:border-primary/30 transition-all">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search IP address, entity ID, or email..."
              className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-10 w-full placeholder:text-muted-foreground/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
            className={cn(
              "md:hidden h-9 w-9 rounded-3xl flex items-center justify-center transition-all",
              isMobileSearchVisible ? "bg-primary/10 text-primary" : "bg-muted/50"
            )}
          >
            {isMobileSearchVisible ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>

          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-[24px] border border-border/40 shadow-sm">
              <div className="flex items-center px-3 gap-2">
                <span className="text-[10px] font-black text-muted-foreground/60 tracking-tighter ">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent h-9 text-[11px] font-bold text-foreground outline-none border-none cursor-pointer"
                />
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
              <div className="flex items-center px-3 gap-2">
                <span className="text-[10px] font-black text-muted-foreground/60 tracking-tighter ">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent h-9 text-[11px] font-bold text-foreground outline-none border-none cursor-pointer"
                />
              </div>
            </div>

            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-[180px] h-9 rounded-3xl bg-muted/40 border-border/40 font-bold text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="h-3 w-3 shrink-0" />
                  <SelectValue placeholder="Action Type" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-3xl max-h-[400px] overflow-y-auto">
                <ActionOptions />
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={isExporting}
              className="h-9 px-4 rounded-3xl border-border/60 font-bold text-xs gap-2 bg-transparent hover:bg-muted transition-all active:scale-95"
            >
              {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Export
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 rounded-3xl text-muted-foreground text-xs font-bold transition-all active:scale-95">
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {isMobileSearchVisible && (
        <div className="md:hidden space-y-2 animate-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search Audit Trail..."
              className="pl-10 h-10 rounded-3xl bg-muted/30 border-border/40 focus:bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between bg-muted/40 p-1 rounded-[22px] border border-border/40 shadow-sm">
              <div className="flex items-center px-3 gap-2 flex-1">
                <span className="text-[9px] font-black text-muted-foreground/60 tracking-tighter ">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent h-9 text-[10px] font-bold text-foreground outline-none border-none cursor-pointer w-full"
                />
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
              <div className="flex items-center px-3 gap-2 flex-1">
                <span className="text-[9px] font-black text-muted-foreground/60 tracking-tighter ">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent h-9 text-[10px] font-bold text-foreground outline-none border-none cursor-pointer w-full"
                />
              </div>
            </div>

            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-full h-10 rounded-3xl bg-muted/30 border-border/40 font-bold text-xs">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent className="rounded-3xl max-h-[350px] overflow-y-auto">
                <ActionOptions />
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport} disabled={isExporting} className="h-10 rounded-3xl border-border/60 font-bold text-xs gap-2 flex-1 active:scale-95 transition-all">
                {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Export CSV
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" onClick={clearFilters} className="h-10 rounded-3xl font-bold text-xs flex-1 active:scale-95 transition-all">
                  Reset Filters
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});