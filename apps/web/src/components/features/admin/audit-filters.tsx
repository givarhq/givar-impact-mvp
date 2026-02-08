'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { cn } from '../../../lib/utils/cn';

export function AuditFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [action, setAction] = useState(searchParams.get('action') || 'all');
  const [isMobileSearchVisible, setIsMobileSearchVisible] = useState(false);

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';
    const currentAction = searchParams.get('action') || 'all';

    if (search === currentSearch && action === currentAction) return;

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', '1');

      if (search) params.set('search', search);
      else params.delete('search');

      if (action && action !== 'all') params.set('action', action);
      else params.delete('action');

      router.replace(`?${params.toString()}`);
    }, 400);

    return () => clearTimeout(timeout);
  }, [search, action, router, searchParams]);

  const clearFilters = () => {
    setSearch('');
    setAction('all');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4 w-full relative min-h-[40px]">
        <div className="flex items-center gap-6 flex-1 min-w-0">
          <h1 className="md:hidden text-xl font-semibold tracking-tight text-foreground whitespace-nowrap">
            Audit Log
          </h1>

          <div className="hidden md:flex items-center flex-1 max-w-md group border-b border-transparent focus-within:border-primary/30 transition-all">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search IP, Entity ID, or Email..."
              className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-10 w-full placeholder:text-muted-foreground/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSearchVisible(!isMobileSearchVisible)}
            className={cn(
              "md:hidden h-10 w-10 rounded-xl transition-all",
              isMobileSearchVisible ? "bg-primary/10 text-primary" : "bg-muted/50"
            )}
          >
            {isMobileSearchVisible ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>

          <div className="hidden md:flex items-center gap-3">
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="w-[200px] h-10 bg-muted/50 border-none font-semibold text-xs tracking-widest rounded-xl">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  <SelectValue placeholder="Action Type" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-xl">
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="USER_LOGIN">Logins</SelectItem>
                <SelectItem value="USER_LOGIN_FAILED">Failed Logins</SelectItem>
                <SelectItem value="DONATION_CREATED">Donations</SelectItem>
                <SelectItem value="WALLET_FUND_SUCCESS">Wallet Funds</SelectItem>
                <SelectItem value="DIRECT_PAYMENT_FULFILLED">Direct Pay</SelectItem>
              </SelectContent>
            </Select>

            {(search || action !== 'all') && (
              <Button variant="ghost" onClick={clearFilters} className="h-10 px-4 rounded-xl text-muted-foreground text-xs font-semibold">
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {isMobileSearchVisible && (
        <div className="md:hidden space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search audit trail..."
              className="pl-11 h-12 rounded-2xl bg-muted/30 border-transparent focus:bg-background focus:border-primary/20"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Select value={action} onValueChange={setAction}>
              <SelectTrigger className="h-12 rounded-2xl bg-muted/30 border-transparent font-semibold text-xs tracking-widest">
                <div className="flex items-center gap-2">
                  <Filter className="h-3 w-3" />
                  <SelectValue placeholder="Action Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="USER_LOGIN">Logins</SelectItem>
                <SelectItem value="DONATION_CREATED">Donations</SelectItem>
                <SelectItem value="WALLET_FUND_SUCCESS">Wallet Funds</SelectItem>
              </SelectContent>
            </Select>
            {(search || action !== 'all') && (
              <Button variant="outline" onClick={clearFilters} className="h-12 rounded-2xl border-dashed border-border text-xs font-semibold">
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}