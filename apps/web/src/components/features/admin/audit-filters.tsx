'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, X, Filter, ArrowRight } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '../../ui/select';
import { cn } from '../../../lib/utils/cn';

export function AuditFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [action, setAction] = useState(searchParams.get('action') || 'all');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', '1');

    if (search) params.set('search', search); else params.delete('search');
    if (action !== 'all') params.set('action', action); else params.delete('action');
    if (startDate) params.set('startDate', startDate); else params.delete('startDate');
    if (endDate) params.set('endDate', endDate); else params.delete('endDate');

    const timeout = setTimeout(() => {
      if (params.toString() !== searchParams.toString()) {
        router.replace(`?${params.toString()}`);
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

  const hasActiveFilters = search || action !== 'all' || startDate || endDate;

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
              placeholder="Search IP, Entity ID, or Email..."
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
                <span className="text-[10px] font-black text-muted-foreground/60 tracking-tighter">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent h-9 text-[11px] font-bold text-foreground outline-none border-none cursor-pointer"
                />
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/30" />
              <div className="flex items-center px-3 gap-2">
                <span className="text-[10px] font-black text-muted-foreground/60 tracking-tighter">To</span>
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
              <SelectContent className="rounded-3xl max-h-[400px]">
                <SelectItem value="all" className="text-xs">All Actions</SelectItem>

                <SelectGroup>
                  <SelectLabel className="text-[10px] font-black tracking-widest text-primary  px-2 py-1.5">Identity & Access</SelectLabel>
                  <SelectItem value="USER_LOGIN" className="text-xs">Login</SelectItem>
                  <SelectItem value="USER_LOGIN_FAILED" className="text-xs">Login Failed</SelectItem>
                  <SelectItem value="USER_REGISTER" className="text-xs">Registration</SelectItem>
                  <SelectItem value="PASSWORD_CHANGE" className="text-xs">Password Change</SelectItem>
                  <SelectItem value="PROFILE_UPDATED" className="text-xs">Profile Updated</SelectItem>
                  <SelectItem value="AVATAR_UPDATED" className="text-xs">Avatar Updated</SelectItem>
                  <SelectItem value="ACCOUNT_DELETED" className="text-xs">Account Deleted</SelectItem>
                  <SelectItem value="USER_LOCKED" className="text-xs">User Locked</SelectItem>
                  <SelectItem value="USER_UNLOCKED" className="text-xs">User Unlocked</SelectItem>
                  <SelectItem value="USER_ROLE_CHANGED" className="text-xs">Role Changed</SelectItem>
                  <SelectItem value="IMPERSONATION_STARTED" className="text-xs">Forensic Proxy Started</SelectItem>
                </SelectGroup>

                <SelectGroup>
                  <SelectLabel className="text-[10px] font-black tracking-widest text-primary  px-2 py-1.5">Security (2FA)</SelectLabel>
                  <SelectItem value="TWO_FACTOR_GEN_SECRET" className="text-xs">2FA Secret Generated</SelectItem>
                  <SelectItem value="TWO_FACTOR_ENABLED" className="text-xs">2FA Enabled</SelectItem>
                  <SelectItem value="TWO_FACTOR_DISABLED" className="text-xs">2FA Disabled</SelectItem>
                  <SelectItem value="TWO_FACTOR_VERIFY_FAILED" className="text-xs">2FA Verify Failed</SelectItem>
                </SelectGroup>

                <SelectGroup>
                  <SelectLabel className="text-[10px] font-black tracking-widest text-primary  px-2 py-1.5">Financial Ledger</SelectLabel>
                  <SelectItem value="WALLET_FUND" className="text-xs">Wallet Fund Init</SelectItem>
                  <SelectItem value="WALLET_FUND_SUCCESS" className="text-xs">Wallet Fund Success</SelectItem>
                  <SelectItem value="WALLET_DEBIT" className="text-xs">Wallet Debit</SelectItem>
                  <SelectItem value="DONATION_CREATED" className="text-xs">Donation Created</SelectItem>
                  <SelectItem value="DIRECT_PAYMENT_INITIATED" className="text-xs">Direct Pay Init</SelectItem>
                  <SelectItem value="DIRECT_PAYMENT_FULFILLED" className="text-xs">Direct Pay Fulfilled</SelectItem>
                  <SelectItem value="RECONCILIATION_PERFORMED" className="text-xs">Manual Reconciliation</SelectItem>
                  <SelectItem value="FUNDS_MOVED_TO_SUSPENSE" className="text-xs">Suspense Entry</SelectItem>
                  <SelectItem value="FUNDS_REALLOCATED" className="text-xs">Funds Reallocated</SelectItem>
                  <SelectItem value="DISBURSEMENT_RECORDED" className="text-xs">Disbursement Recorded</SelectItem>
                  <SelectItem value="TRANSACTION_RESOLVED" className="text-xs">Transaction Resolved</SelectItem>
                  <SelectItem value="RECEIPT_VIEWED" className="text-xs">Receipt Viewed</SelectItem>
                </SelectGroup>

                <SelectGroup>
                  <SelectLabel className="text-[10px] font-black tracking-widest text-primary  px-2 py-1.5">Projects & Proposals</SelectLabel>
                  <SelectItem value="PROJECT_CREATED" className="text-xs">Project Created</SelectItem>
                  <SelectItem value="PROJECT_UPDATED" className="text-xs">Project Updated</SelectItem>
                  <SelectItem value="PROJECT_DELETED" className="text-xs">Project Deleted</SelectItem>
                  <SelectItem value="PROJECT_SUSPENDED" className="text-xs">Project Suspended</SelectItem>
                  <SelectItem value="PROPOSAL_REJECTED" className="text-xs">Proposal Rejected</SelectItem>
                  <SelectItem value="MILESTONE_PROOF_SUBMITTED" className="text-xs">Proof Submitted</SelectItem>
                  <SelectItem value="USER_VERIFIED" className="text-xs">Org KYC Verified</SelectItem>
                  <SelectItem value="USER_REJECTED" className="text-xs">Org KYC Rejected</SelectItem>
                  <SelectItem value="MESSAGE_SENT" className="text-xs">Message Sent</SelectItem>
                </SelectGroup>

                <SelectGroup>
                  <SelectLabel className="text-[10px] font-black tracking-widest text-primary  px-2 py-1.5">Discovery & System</SelectLabel>
                  <SelectItem value="RECOMMENDATION_CONFIG_UPDATED" className="text-xs">Algorithm Update</SelectItem>
                  <SelectItem value="FEATURED_SLOT_CREATED" className="text-xs">Featured Slot Set</SelectItem>
                  <SelectItem value="FEATURED_SLOT_DELETED" className="text-xs">Featured Slot Removed</SelectItem>
                  <SelectItem value="CATEGORY_WEIGHT_UPDATED" className="text-xs">Sector Weight Update</SelectItem>
                  <SelectItem value="PROJECT_DISCOVERY_WEIGHTS_UPDATED" className="text-xs">Node Weight Update</SelectItem>
                  <SelectItem value="WEBHOOK_RECEIVED" className="text-xs">Webhook Event</SelectItem>
                  <SelectItem value="WEBHOOK_SIGNATURE_FAILED" className="text-xs">Webhook Sig Failure</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="h-9 px-3 rounded-3xl text-muted-foreground text-xs font-bold">
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
              placeholder="Search audit trail..."
              className="pl-10 h-10 rounded-3xl bg-muted/30 border-border/40 focus:bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between bg-muted/40 p-1 rounded-[22px] border border-border/40 shadow-sm">
              <div className="flex items-center px-3 gap-2 flex-1">
                <span className="text-[9px] font-black text-muted-foreground/60 tracking-tighter">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent h-9 text-[10px] font-bold text-foreground outline-none border-none cursor-pointer w-full"
                />
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground/30 shrink-0" />
              <div className="flex items-center px-3 gap-2 flex-1">
                <span className="text-[9px] font-black text-muted-foreground/60 tracking-tighter">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent h-9 text-[10px] font-bold text-foreground outline-none border-none cursor-pointer w-full"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger className="flex-1 h-10 rounded-3xl bg-muted/30 border-border/40 font-bold text-xs">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent className="rounded-3xl max-h-[300px]">
                  <SelectItem value="all">All Actions</SelectItem>
                  {/* Logic: Flat list for mobile to avoid nested scroll complexity */}
                  <SelectItem value="USER_LOGIN">Login</SelectItem>
                  <SelectItem value="DONATION_CREATED">Donation</SelectItem>
                  <SelectItem value="WALLET_FUND_SUCCESS">Wallet Fund</SelectItem>
                  <SelectItem value="PROJECT_CREATED">Project Creation</SelectItem>
                  <SelectItem value="USER_LOCKED">Account Lock</SelectItem>
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="outline" onClick={clearFilters} className="h-10 px-4 rounded-3xl border-border/60 text-xs font-bold shrink-0">
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}