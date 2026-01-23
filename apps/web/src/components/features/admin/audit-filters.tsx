'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

export function AuditFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [action, setAction] = useState(searchParams.get('action') || 'all');

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
      router.replace('?page=1');
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 p-1">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
            placeholder="Search IP, Entity ID, or Email..." 
            className="pl-9 h-11 bg-card border-border text-foreground placeholder:text-muted-foreground rounded-xl shadow-sm focus-visible:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Select value={action} onValueChange={setAction}>
        <SelectTrigger className="w-full md:w-[240px] h-11 bg-card border-border text-foreground rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <SelectValue placeholder="Action Type" />
            </div>
        </SelectTrigger>
        <SelectContent className="bg-card border-border text-foreground rounded-xl shadow-xl">
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="USER_LOGIN">Logins</SelectItem>
            <SelectItem value="USER_LOGIN_FAILED">Failed Logins</SelectItem>
            <SelectItem value="DONATION_CREATED">Donations</SelectItem>
            <SelectItem value="WALLET_FUND">Wallet Funds</SelectItem>
            <SelectItem value="DIRECT_PAYMENT_FULFILLED">Direct Payments</SelectItem>
            <SelectItem value="SUBSCRIPTION_CREATED">Subscriptions</SelectItem>
        </SelectContent>
      </Select>
      {(search || action !== 'all') && (
          <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-foreground h-11 px-4">
              <X className="h-4 w-4 mr-2" /> Clear
          </Button>
      )}
    </div>
  );
}