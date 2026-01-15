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

  // 1. Parse BigInt string to Number
  let numericAmount = Number(amount) / 100;
  
  // Handle Negative Values
  const isNegative = numericAmount < 0;
  if (isNegative) numericAmount = Math.abs(numericAmount);

  let mainPart = '';
  let secondaryPart = '';
  const currencySymbol = currency === 'NGN' ? '₦' : currency;

  // 2. Logic Implementation
  if (numericAmount >= 100_000_000) {
    // Condition 3: >= 100M -> Abbreviated (e.g., 253.44 M)
    const abbreviated = numericAmount / 1_000_000;
    // Format to max 2 decimal places, remove trailing zeros (e.g. 100.00 -> 100)
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(abbreviated);
    
    mainPart = formatted;
    secondaryPart = 'M';

  } else if (numericAmount >= 10_000_000) {
    // Condition 2: 10M <= X < 100M -> Full amount, NO kobo
    mainPart = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(numericAmount);
    secondaryPart = ''; // No decimals

  } else {
    // Condition 1: < 10M -> Full amount WITH kobo
    const formattedTotal = new Intl.NumberFormat('en-US', {
       minimumFractionDigits: 2, 
       maximumFractionDigits: 2 
     }).format(numericAmount);
     
     const parts = formattedTotal.split('.');
     mainPart = parts[0];
     secondaryPart = `.${parts[1]}`;
  }

  const styles = sizeStyles[size];

  return (
    <span className={cn("inline-flex items-baseline font-sans tabular-nums", className)}>
      
      {/* Negative Sign */}
      {isNegative && (
          <span className={cn(styles.symbol, "text-muted-foreground/80 mr-0.5")}>-</span>
      )}

      <span className={cn(styles.symbol, "text-muted-foreground/60 mr-1")}>
        {currencySymbol}
      </span>
      
      <span className={cn(styles.main, "text-foreground tracking-tight")}>
        {mainPart}
      </span>
      
      {/* Secondary Part (Decimals or Suffix like 'M') */}
      {secondaryPart && (
          <span className={cn(styles.fraction, "text-muted-foreground/60 ml-0.5")}>
            {secondaryPart}
          </span>
      )}
    </span>
  );
};