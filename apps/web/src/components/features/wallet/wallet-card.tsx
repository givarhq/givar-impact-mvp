'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Plus, Wallet, ArrowUpRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { SmartCurrency } from '../../ui/smart-currency';
import { cn } from '../../../lib/utils/cn';

interface WalletCardProps {
  balance: string;
  currency: string;
}

export function WalletCard({ balance, currency }: WalletCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="group relative h-full">
      {/* Premium Outer Glow (Subtle for light mode) */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/10 to-primary/5 rounded-[32px] blur-sm opacity-50 transition duration-1000 group-hover:opacity-100"></div>

      <Card className="relative h-full overflow-hidden bg-card border-border/50 rounded-[30px] p-6 flex flex-col justify-between shadow-xl">
        {/* Background Decor - Abstract Wallet Icon */}
        <div className="absolute -bottom-6 -right-6 p-4 opacity-[0.03] text-primary pointer-events-none">
          <Wallet className="h-40 w-40 -rotate-12" />
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Liquidity Node</p>
              <p className="text-xs font-bold text-muted-foreground">Available Balance</p>
            </div>
          </div>

          <button
            onClick={() => setIsVisible(!isVisible)}
            className="h-9 w-9 flex items-center justify-center rounded-xl bg-muted/50 text-muted-foreground hover:text-primary transition-colors border border-border/50"
          >
            {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative z-10 mt-6 mb-8">
          <div className="flex items-baseline gap-2">
            <SmartCurrency
              amount={balance}
              currency={currency}
              visible={isVisible}
              size="large"
              className="text-foreground tracking-tighter"
            />
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 mt-auto">
          <Link href="/dashboard/wallet/fund" className="flex-1">
            <Button className="w-full h-11 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-[10px] uppercase tracking-widest border-0 shadow-lg shadow-primary/20 transition-all active:scale-95">
              <Plus className="mr-2 h-4 w-4 stroke-[3px]" /> Add Funds
            </Button>
          </Link>
          <Button variant="outline" className="flex-1 h-11 rounded-2xl border-border bg-background text-muted-foreground hover:text-foreground font-black text-[10px] uppercase tracking-widest transition-all">
            <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw
          </Button>
        </div>
      </Card>
    </div>
  );
}