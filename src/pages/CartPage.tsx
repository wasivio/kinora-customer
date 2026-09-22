import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../lib/utils';
import { EmptyState } from '../components/common/EmptyState';

export const CartPage: React.FC = () => {
  const { 
    cart, 
    removeFromCart, 
    subtotal, 
    couponDiscount, 
    shippingFee, 
    total 
  } = useCart();
  const { settings } = useStore();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center max-w-xl mx-auto px-4">
        <EmptyState
          icon={ShoppingBag}
          title="Your Cart is Empty"
          description="Looks like you haven't added any pieces to your bag yet. Explore our latest arrivals to get started."
          actionText="Start Shopping"
          actionLink="/shop"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-32">
      
      <div className="max-w-md mx-auto px-4 pt-6">
        
        {/* Cart Container Sheet matching Screen 3 */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-neutral-100 space-y-5">
          
          {/* Header Row: "My Cart" on left, "Add to Checkout" button on right */}
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <h1 className="text-lg font-bold text-neutral-900 font-display">
              My Cart
            </h1>
            <Link
              to="/shop"
              className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-pill-gray text-[11px] font-semibold text-neutral-700 hover:bg-neutral-200 transition-colors"
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Add Items</span>
            </Link>
          </div>

          {/* Cart Item Cards (Screen 3 style) */}
          <div className="space-y-3">
            {cart.map((item) => {
              const variantText = item.selectedVariants
                ? Object.entries(item.selectedVariants).map(([k, v]) => `${k} ${v}`).join(', ')
                : '';

              return (
                <div 
                  key={item.id} 
                  className="relative p-3.5 bg-[#F5F7FA] rounded-2xl flex items-center justify-between gap-3 group"
                >
                  {/* Left: Thumbnail & Info */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-[#f5f5f5] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={item.image || '/LOGO.png'}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="min-w-0">
                      <Link
                        to={`/product/${item.productId}`}
                        className="text-xs sm:text-sm font-semibold text-neutral-900 line-clamp-1 hover:text-honey transition-colors"
                      >
                        {item.name}
                      </Link>
                      {variantText && (
                        <p className="text-[11px] text-neutral-400 mt-0.5 truncate">
                          {variantText}
                        </p>
                      )}
                      <p className="text-[10px] text-neutral-400">Qty: {item.quantity}</p>
                    </div>
                  </div>

                  {/* Right: Price Badge in Black Pill (Screen 3) */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="bg-charcoal text-white px-3 py-1 rounded-full text-xs font-bold font-sans">
                      {formatCurrency(item.price * item.quantity, settings.currencySymbol)}
                    </span>

                    {/* Delete 'x' button at top-right */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-neutral-400 hover:text-neutral-900 transition-colors p-1"
                      title="Remove"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cost Breakdown (Screen 3) */}
          <div className="space-y-2 text-xs text-neutral-600 pt-3 border-t border-neutral-100">
            <div className="flex justify-between">
              <span>Sub-total</span>
              <span className="font-semibold text-neutral-900">
                {formatCurrency(subtotal, settings.currencySymbol)}
              </span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between text-honey font-medium">
                <span>Discount</span>
                <span>-{formatCurrency(couponDiscount, settings.currencySymbol)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-semibold text-neutral-900">
                {shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee, settings.currencySymbol)}
              </span>
            </div>

            <div className="pt-2 border-t border-neutral-100 flex justify-between text-sm sm:text-base font-bold text-neutral-900">
              <span>Total Price</span>
              <span className="text-neutral-900 font-sans">{formatCurrency(total, settings.currencySymbol)}</span>
            </div>
          </div>

          {/* Full-width Honey Caramel Checkout Button (Screen 3) */}
          <button
            onClick={() => navigate('/checkout')}
            className="w-full py-3.5 rounded-full bg-honey hover:bg-honey-600 text-white font-bold text-xs sm:text-sm tracking-wide shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-95"
          >
            <span>Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

        </div>

      </div>

    </div>
  );
};
