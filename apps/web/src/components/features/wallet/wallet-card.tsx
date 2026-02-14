'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Plus, Wallet, ArrowUpRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { SmartCurrency } from '../../ui/smart-currency';

interface WalletCardProps {
  balance: string;
  currency: string;
}

export function WalletCard({ balance, currency }: WalletCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <Card className="relative h-full overflow-hidden bg-card border-border/40 rounded-3xl p-5 flex flex-col justify-between shadow-sm group">
      {/* Header Info */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-3xl bg-primary/10 text-primary border border-primary/10">
            <Wallet className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-0">
            <p className="text-sm font-bold tracking-wider text-primary">Wallet</p>
            <p className="text-xs font-medium text-muted-foreground">Available Balance</p>
          </div>
        </div>

        <button
          onClick={() => setIsVisible(!isVisible)}
          className="h-8 w-8 flex items-center justify-center rounded-3xl bg-muted/50 text-muted-foreground hover:text-primary transition-colors border border-border/50"
        >
          {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Balance Display */}
      <div className="relative z-10 mt-4 mb-6">
        <div className="flex items-baseline gap-2">
          <SmartCurrency
            amount={balance}
            currency={currency}
            visible={isVisible}
            size="large"
            className="text-foreground tracking-tight"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="relative z-10 flex items-center gap-2 mt-auto">
        <Link href="/dashboard/wallet/fund" className="flex-1">
          <Button className="w-full h-10 rounded-3xl bg-primary hover:bg-primary/90 text-white font-bold text-xs border-0 shadow-sm transition-all active:scale-95">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Funds
          </Button>
        </Link>
        <Button variant="outline" className="flex-1 h-10 rounded-3xl border-border bg-background text-muted-foreground hover:text-foreground font-bold text-xs transition-all">
          <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" /> Withdraw
        </Button>
      </div>
    </Card>
  );
}