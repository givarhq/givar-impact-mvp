export const formatCurrency = (amount: string | number | bigint, currency = 'NGN') => {
  // Convert BigInt string (e.g., "500000" for 5k) to float if coming from API
  // OR handle raw numbers.
  // In our DB: stored as BigInt minor units. 
  // For UI display, we typically receive the minor unit count or already converted.
  
  const numericAmount = typeof amount === 'bigint' 
    ? Number(amount) / 100 
    : Number(amount) / 100; // API sends "100000" (1000.00). Ledger is in minor units.

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
};

export const formatDate = (dateString: string | Date) => {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export const formatNumberInput = (value: string): string => {
  const digitsOnly = value.replace(/\D/g, '');
  if (!digitsOnly) return '';

  const number = Number(digitsOnly);
  return new Intl.NumberFormat('en-US').format(number);
};

export const parseFormattedNumber = (value: string): string => {
  return value.replace(/,/g, '');
};