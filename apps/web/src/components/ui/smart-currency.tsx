'use client';

import React from 'react';
import { SmartCurrencyProps } from '../../types';
import { cn } from '../../lib/utils/cn';

const sizeStyles = {
  small: {
    symbol: 'text-xs font-medium',
    main: 'text-xs font-bold',
    fraction: 'text-xs font-medium',
  },
  default: {
    symbol: 'text-xs font-medium',
    main: 'text-sm font-bold',
    fraction: 'text-xs font-medium',
  },
  large: {
    symbol: 'text-sm font-medium',
    main: 'text-2xl font-bold',
    fraction: 'text-lg font-medium',
  }
}

const SYMBOL_MAP: Record<string, string> = {
  NGN: '₦',
  USD: '$',
  GBP: '£',
  EUR: '€',
  CAD: 'C$',
};

export const SmartCurrency = ({ amount, currency, visible, className, size = 'default', hideKobo = false }: SmartCurrencyProps) => {
  if (!visible) {
    return <span className="text-muted-foreground/40 tracking-widest text-lg select-none">••••</span>;
  }

  // 1. Parse BigInt string to Number
  let numericAmount = typeof amount === 'bigint'
    ? Number(amount) / 100
    : Number(amount) / 100;

  // Handle Negative Values
  const isNegative = numericAmount < 0;
  if (isNegative) numericAmount = Math.abs(numericAmount);

  let mainPart = '';
  let secondaryPart = '';

  // Resolve standard currency symbols safely
  const currencySymbol = SYMBOL_MAP[currency] || currency;
  const spacing = currencySymbol.length > 1 ? ' ' : '';

  // 2. Logic Implementation
  if (numericAmount >= 100_000_000) {
    // Condition 3: >= 100M -> Abbreviated (e.g., 253.44 M)
    const abbreviated = numericAmount / 1_000_000;

    // LOGIC FIX: We ignore hideKobo here because these decimals represent hundreds of thousands, not kobo.
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
    secondaryPart = '';

  } else {
    // Condition 1: < 10M -> Full amount. 
    // If hideKobo is true, we set decimals to 0 (which triggers rounding, e.g., 50.60 -> 51).
    const formattedTotal = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: hideKobo ? 0 : 2,
      maximumFractionDigits: hideKobo ? 0 : 2
    }).format(numericAmount);

    const parts = formattedTotal.split('.');
    mainPart = parts[0];
    secondaryPart = parts[1] ? `.${parts[1]}` : '';
  }

  const styles = sizeStyles[size];

  return (
    <span className={cn("inline-flex items-baseline font-sans tabular-nums", className)}>

      {/* Negative Sign */}
      {isNegative && (
        <span className={cn(styles.symbol, "text-muted-foreground/80 mr-0.5")}>-</span>
      )}

      <span className={cn(styles.symbol, "text-muted-foreground/60 whitespace-pre")}>
        {currencySymbol}{spacing}
      </span>

      <span className={cn(styles.main, "text-inherit tracking-tight ml-0.5")}>
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