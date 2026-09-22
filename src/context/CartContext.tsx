import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, Coupon } from '../types';
import { calculateDiscountedPrice } from '../lib/utils';
import { useStore } from './StoreContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedVariants?: Record<string, string>) => boolean;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  totalItems: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'kinora_customer_cart';
const COUPON_STORAGE_KEY = 'kinora_customer_coupon';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, getCouponByCode } = useStore();

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem(COUPON_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error('Error saving cart to localStorage:', err);
    }
  }, [cart]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    } catch (err) {
      console.error('Error saving coupon to localStorage:', err);
    }
  }, [appliedCoupon]);

  const addToCart = (
    product: Product,
    quantity: number = 1,
    selectedVariants?: Record<string, string>
  ): boolean => {
    if (product.stock <= 0) {
      return false;
    }

    // Generate unique ID based on product ID and selected variants
    const variantKey = selectedVariants 
      ? Object.entries(selectedVariants).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`).join('|')
      : 'default';
    const itemId = `${product.id}_${variantKey}`;

    const { finalPrice, originalPrice } = calculateDiscountedPrice(product.price, product.discount);
    const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || '';

    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.id === itemId);
      if (existingIndex > -1) {
        const existing = prevCart[existingIndex];
        const newQuantity = Math.min(existing.quantity + quantity, product.stock);
        const updated = [...prevCart];
        updated[existingIndex] = { ...existing, quantity: newQuantity };
        return updated;
      } else {
        const newItem: CartItem = {
          id: itemId,
          productId: product.id,
          name: product.name,
          price: finalPrice,
          originalPrice,
          image: primaryImage,
          quantity: Math.min(quantity, product.stock),
          selectedVariants,
          maxStock: product.stock,
          sku: product.SKU,
          deliveryCharge: Number(product.deliveryCharge || product.shippingFee || 0),
        };
        return [...prevCart, newItem];
      }
    });

    return true;
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const validQty = Math.min(quantity, item.maxStock);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const coupon = getCouponByCode(code);
    if (!coupon) {
      return { success: false, message: 'Invalid or expired promo code.' };
    }

    const currentSubtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    if (coupon.minPurchase && currentSubtotal < coupon.minPurchase) {
      return {
        success: false,
        message: `Minimum order amount of ${settings.currencySymbol}${coupon.minPurchase} required for this code.`,
      };
    }

    setAppliedCoupon(coupon);
    return { success: true, message: `Coupon "${coupon.code}" applied successfully!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  // Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // Product-level discount sum
  const discountAmount = cart.reduce((acc, item) => {
    const diff = (item.originalPrice - item.price) * item.quantity;
    return acc + Math.max(0, diff);
  }, 0);

  // Coupon discount calculation
  let couponDiscount = 0;
  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.discountType === 'percentage') {
      couponDiscount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
      if (appliedCoupon.maxDiscount && couponDiscount > appliedCoupon.maxDiscount) {
        couponDiscount = appliedCoupon.maxDiscount;
      }
    } else {
      couponDiscount = Math.min(appliedCoupon.discountValue, subtotal);
    }
  }

  // Delivery charge calculation:
  // Only add delivery fee if admin added a delivery charge on the products, or configured a store delivery fee.
  const productDeliveryCharges = cart.reduce((acc, item) => {
    const charge = Number(item.deliveryCharge || item.shippingFee || 0);
    return acc + (charge * item.quantity);
  }, 0);

  const storeShippingFee = (settings.shippingFee && Number(settings.shippingFee) > 0 && subtotal > 0 && (!settings.freeShippingThreshold || subtotal < settings.freeShippingThreshold))
    ? Number(settings.shippingFee)
    : 0;

  const shippingFee = productDeliveryCharges > 0 
    ? productDeliveryCharges 
    : storeShippingFee;

  const total = Math.max(0, subtotal - couponDiscount + shippingFee);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        subtotal,
        discountAmount,
        couponDiscount,
        shippingFee,
        total,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
