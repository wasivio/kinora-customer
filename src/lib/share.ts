import { Product } from '../types';

/**
 * Returns the full web URL for a given product ID.
 */
export const getProductShareUrl = (productId: string): string => {
  const origin = typeof window !== 'undefined' && window.location ? window.location.origin : '';
  return `${origin}/product/${productId}`;
};

/**
 * Copies plain text to the clipboard with robust fallbacks.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Continue to fallback if clipboard API permissions fail
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    textArea.remove();
    return Boolean(successful);
  } catch (err) {
    console.error('Fallback copyToClipboard failed:', err);
    return false;
  }
};

/**
 * Returns a direct WhatsApp URL prefilled with product title, price, and link.
 */
export const getProductWhatsAppShareUrl = (
  product: Pick<Product, 'id' | 'name'>, 
  formattedPrice: string
): string => {
  const url = getProductShareUrl(product.id);
  const text = `🛍️ Check out *${product.name}* on KINORA!\nPrice: *${formattedPrice}*\n\n👉 View & Order here:\n${url}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

/**
 * Returns a Twitter / X intent URL for sharing the product.
 */
export const getProductTwitterShareUrl = (
  product: Pick<Product, 'id' | 'name'>, 
  formattedPrice: string
): string => {
  const url = getProductShareUrl(product.id);
  const text = `Check out ${product.name} on KINORA (${formattedPrice})!`;
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
};

/**
 * Returns a Facebook share dialog URL.
 */
export const getProductFacebookShareUrl = (product: Pick<Product, 'id'>): string => {
  const url = getProductShareUrl(product.id);
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
};

/**
 * Checks whether the current browser/device supports navigator.share (Web Share API).
 */
export const canNativeShare = (): boolean => {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
};

/**
 * Invokes the native OS share sheet (WhatsApp, Instagram, Messages, etc.).
 */
export const triggerNativeShare = async (
  product: Pick<Product, 'id' | 'name'>, 
  formattedPrice: string
): Promise<boolean> => {
  if (!canNativeShare()) return false;
  const url = getProductShareUrl(product.id);
  try {
    await navigator.share({
      title: product.name,
      text: `Check out ${product.name} on KINORA (${formattedPrice})!`,
      url,
    });
    return true;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return true; // User dismissed share sheet normally
    }
    console.warn('Native share error:', err);
    return false;
  }
};
