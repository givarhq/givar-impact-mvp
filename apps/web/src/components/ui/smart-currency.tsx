'use client';

import React from 'react';
import { SmartCurrencyProps } from '../../types';
import { cn } from '../../lib/utils/cn';

const sizeStyles = {
    default: {
        symbol: 'text-xl font-medium',
        main: 'text-2xl font-bold',
        fraction: 'text-xl font-medium',
    },
    large: {
        symbol: 'text-2xl md:text-3xl font-medium',
        main: 'text-4xl md:text-5xl font-bold',
        fraction: 'text-2xl md:text-3xl font-medium',
    }
}

export const SmartCurrency = ({ amount, currency, visible, className, size = 'default' }: SmartCurrencyProps) => {
  if (!visible) {
    return <span className="text-muted-foreground/50 tracking-widest text-3xl select-none">••••••</span>;
  }

  const numericAmount = Number(amount) / 100;
  
  let mainPart = '';
  let secondaryPart = '';
  
  const styles = sizeStyles[size];
  
  if (numericAmount >= 1_000_000_000) {
    mainPart = (numericAmount / 1_000_000_000).toFixed(1);
    secondaryPart = 'B';
  } else if (numericAmount >= 1_000_000) {
    mainPart = (numericAmount / 1_000_000).toFixed(1);
    secondaryPart = 'M';
  } else {
     const formattedTotal = new Intl.NumberFormat('en-US', {
       minimumFractionDigits: 2, 
       maximumFractionDigits: 2 
     }).format(numericAmount);
     
     const parts = formattedTotal.split('.');
     mainPart = parts[0];
     secondaryPart = `.${parts[1] || '00'}`;
  }

  return (
    <span className={cn("inline-flex items-baseline font-sans tabular-nums", className)}>
      <span className={cn(styles.symbol, "text-muted-foreground/60 mr-1")}>
        {currency === 'NGN' ? '₦' : currency}
      </span>
      <span className={cn(styles.main, "text-foreground tracking-tight")}>{mainPart}</span>
      <span className={cn(styles.fraction, "text-muted-foreground/60 ml-0.5")}>{secondaryPart}</span>
    </span>
  );
};