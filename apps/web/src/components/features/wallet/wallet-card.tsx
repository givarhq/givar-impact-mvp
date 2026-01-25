'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Plus, Wallet, ArrowUpRight } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { SmartCurrency } from '../../ui/smart-currency';

interface WalletCardProps {
  balance: string; // Minor units string
  currency: string;
}

export function WalletCard({ balance, currency }: WalletCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <div className="group relative rounded-2xl p-[1px] bg-gradient-to-br from-primary/60 via-primary/10 to-transparent transition-all duration-300">
      <Card className="relative h-full w-full overflow-hidden bg-card border-none rounded-2xl p-6 flex flex-col justify-between shadow-none min-h-[180px]">
        
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-20 pointer-events-none" />
        <Wallet className="absolute -bottom-6 -right-6 h-36 w-36 text-primary opacity-[0.03] pointer-events-none transition-transform group-hover:scale-105 duration-500" />

        {/* Header Section */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl shadow-sm backdrop-blur-md bg-primary/10 text-primary border border-primary/20">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground leading-tight">Total Balance</p>
              <p className="text-sm font-bold text-foreground">Available Liquidity</p>
            </div>
          </div>
          
          <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-muted-foreground hover:text-foreground rounded-xl" 
              onClick={() => setIsVisible(!isVisible)}
          >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>

        {/* Balance Display */}
        <div className="relative z-10 mt-7">
          <div className="flex items-end gap-2">
             <h3 className="text-4xl md:text-5xl truncate max-w-full leading-none py-1">
                <SmartCurrency 
                  amount={balance} 
                  currency={currency} 
                  visible={isVisible} 
                  size="large" 
                />
             </h3>
          </div>
        </div>

        {/* Action Section: Navigates to dedicated pages */}
        <div className="relative z-10 mt-7 flex items-center gap-3">
          <Link href="/dashboard/wallet/fund" className="flex-1 sm:flex-none">
            <Button 
                className="w-full h-11 px-6 text-xs font-bold shadow-lg shadow-primary/20 rounded-xl"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Funds
            </Button>
          </Link>
          
          <Button 
              variant="outline"
              className="h-11 px-6 text-xs font-bold border-border hover:bg-secondary rounded-xl transition-all"
          >
            <ArrowUpRight className="mr-2 h-4 w-4" /> Withdraw
          </Button>
        </div>

        {/* Decorative Chart Line */}
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-[0.05] group-hover:opacity-10 transition-opacity pointer-events-none">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-full w-full">
              <path d="M0 15 Q 20 18, 40 10 T 80 12 T 100 5 V 20 H 0 Z" fill="currentColor" className="text-primary" />
              <path d="M0 15 Q 20 18, 40 10 T 80 12 T 100 5" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary" />
          </svg>
        </div>

      </Card>
    </div>
  );
}