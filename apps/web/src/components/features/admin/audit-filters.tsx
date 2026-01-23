'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { Search, X } from 'lucide-react';
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
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
            placeholder="Search IP, Entity ID, or Email..." 
            className="pl-9 bg-zinc-900 border-zinc-800 text-white placeholder:text-zinc-500 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Select value={action} onValueChange={setAction}>
        <SelectTrigger className="w-[200px] bg-zinc-900 border-zinc-800 text-zinc-300 rounded-xl">
            <SelectValue placeholder="Action Type" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300 rounded-xl">
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
          <Button variant="ghost" onClick={clearFilters} className="text-zinc-400 hover:text-white">
              <X className="h-4 w-4 mr-2" /> Clear
          </Button>
      )}
    </div>
  );
}