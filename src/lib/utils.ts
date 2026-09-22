import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol: string = '₹'): string {
  if (isNaN(amount)) return `${symbol}0`;
  return `${symbol}${amount.toLocaleString('en-IN')}`;
}

export function calculateDiscountedPrice(price: number, discount?: number): {
  finalPrice: number;
  originalPrice: number;
  discountAmount: number;
  discountPercentage: number;
  hasDiscount: boolean;
} {
  const original = Number(price) || 0;
  if (!discount || discount <= 0) {
    return {
      finalPrice: original,
      originalPrice: original,
      discountAmount: 0,
      discountPercentage: 0,
      hasDiscount: false,
    };
  }

  // If discount is <= 100, treat as percentage, otherwise treat as flat amount
  let discountAmount = 0;
  let discountPercentage = 0;

  if (discount <= 100) {
    discountPercentage = discount;
    discountAmount = Math.round((original * discount) / 100);
  } else {
    discountAmount = Math.min(discount, original);
    discountPercentage = Math.round((discountAmount / original) * 100);
  }

  const finalPrice = Math.max(0, original - discountAmount);

  return {
    finalPrice,
    originalPrice: original,
    discountAmount,
    discountPercentage,
    hasDiscount: discountAmount > 0,
  };
}

export function generateOrderNumber(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `KIN-${random}`;
}

export function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}
