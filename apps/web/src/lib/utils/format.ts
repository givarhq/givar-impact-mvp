export const formatCurrency = (amount: string | number | bigint, currency = 'NGN') => {
  let numericAmount = typeof amount === 'bigint' 
    ? Number(amount) / 100 
    : Number(amount) / 100;

  const isNegative = numericAmount < 0;
  if (isNegative) numericAmount = Math.abs(numericAmount);

  let formatted = '';

  if (numericAmount >= 100_000_000) {
    // Condition 3: >= 100M -> Abbreviated (e.g., 253.44M)
    const abbreviated = numericAmount / 1_000_000;
    formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(abbreviated) + 'M';
  } else if (numericAmount >= 10_000_000) {
    // Condition 2: 10M <= X < 100M -> Full amount, NO kobo
    formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  } else {
    // Condition 1: < 10M -> Full amount WITH kobo
    formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  }

  const symbol = currency === 'NGN' ? '₦' : currency;
  
  // Return format: -₦2,500.00 or ₦253.44M
  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
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