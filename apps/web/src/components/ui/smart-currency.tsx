'use client';

import React from 'react';
import { SmartCurrencyProps } from '../../types';

export const SmartCurrency = ({ amount, currency, visible, className }: SmartCurrencyProps) => {
  if (!visible) {
    return <span className="text-muted-foreground/50 tracking-widest text-3xl select-none">••••••</span>;
  }

  const numericAmount = Number(amount) / 100;
  
  let mainPart = '';
  let secondaryPart = '';
  
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
    <span className={`inline-flex items-baseline font-sans tabular-nums ${className}`}>
      <span className="text-2xl md:text-3xl font-medium text-muted-foreground/60 mr-1.5">
        {currency === 'NGN' ? '₦' : currency}
      </span>
      <span className="text-foreground font-bold tracking-tight">{mainPart}</span>
      <span className="text-2xl md:text-3xl font-medium text-muted-foreground/60 ml-0.5">{secondaryPart}</span>
    </span>
  );
};