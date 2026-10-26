import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  X, 
  ShoppingBag, 
  ArrowRight, 
  Plus, 
  Minus, 
  Trash2, 
  ShieldCheck, 
  Truck, 
  RotateCcw 
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { formatCurrency } from '../lib/utils';
import { EmptyState } from '../components/common/EmptyState';
import { ProductCard } from '../components/common/ProductCard';

export const CartPage: React.FC = () => {
  const { 
    cart, 
    removeFromCart, 
    updateQuantity,
    subtotal, 
    couponDiscount, 
    shippingFee, 
    total,
    totalItems
  } = useCart();
  const { settings, products } = useStore();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center max-w-2xl mx-auto px-4 py-12">
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

  const recommendedProducts = products
    .filter((p) => !cart.some((c) => c.productId === p.id))
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-24 sm:pb-32">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 sm:mb-6 border-b border-neutral-200/60">
          <div>
            <div className="flex items-center space-x-2 text-xs text-neutral-400 font-medium mb-1">
              <Link to="/" className="hover:text-neutral-800 transition-colors">Home</Link>
              <span>/</span>
              <Link to="/shop" className="hover:text-neutral-800 transition-colors">Shop</Link>
              <span>/</span>
              <span className="text-neutral-800 font-bold">Shopping Cart</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 font-display">
              Shopping Cart{' '}
              <span className="text-sm sm:text-base font-normal text-neutral-500 font-sans">
                ({totalItems || cart.length} {(totalItems || cart.length) === 1 ? 'item' : 'items'})
              </span>
            </h1>
          </div>

          <Link
            to="/shop"
            className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white border border-neutral-200/80 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-all shadow-xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-neutral-600" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        {/* 2-Column Responsive Split on Desktop (lg:grid lg:grid-cols-12 lg:gap-8) */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10 items-start">
          
          {/* Left Column: Cart Items List (col-span-7 or 8 on desktop) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            
            <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-neutral-100">
              
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Cart Items
                </span>
                <span className="text-xs font-semibold text-neutral-500">
                  Subtotal
                </span>
              </div>

              {/* Items List */}
              <div className="divide-y divide-neutral-100">
                {cart.map((item) => {
                  const variantText = item.selectedVariants
                    ? Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(' • ')
                    : '';

                  return (
                    <div 
                      key={item.id} 
                      className="py-4 first:pt-2 last:pb-2 flex items-start sm:items-center justify-between gap-3 sm:gap-4 group"
                    >
                      {/* Left: Thumbnail & Details */}
                      <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                        <Link 
                          to={`/product/${item.productId}`}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#f5f5f5] p-2 shrink-0 overflow-hidden flex items-center justify-center hover:opacity-90 transition-opacity border border-neutral-100"
                        >
                          <img
                            src={item.image || '/LOGO.png'}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </Link>

                        <div className="min-w-0 flex-1 space-y-1">
                          <Link
                            to={`/product/${item.productId}`}
                            className="text-xs sm:text-sm font-bold text-neutral-900 hover:text-honey transition-colors line-clamp-1"
                          >
                            {item.name}
                          </Link>

                          {variantText && (
                            <p className="text-[11px] text-neutral-500 font-medium">
                              {variantText}
                            </p>
                          )}

                          <div className="flex items-center space-x-3 pt-1">
                            {/* Quantity Stepper */}
                            <div className="flex items-center space-x-2 bg-[#FDEBD2] text-neutral-800 rounded-full px-2.5 py-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                disabled={item.quantity <= 1}
                                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/60 active:scale-95 disabled:opacity-30 transition-colors"
                                title="Decrease"
                              >
                                <Minus className="w-2.5 h-2.5" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center font-mono">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-4 h-4 rounded-full bg-honey text-white flex items-center justify-center hover:bg-honey-600 active:scale-95 shadow-xs transition-colors"
                                title="Increase"
                              >
                                <Plus className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            {/* Remove button */}
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="text-[11px] font-semibold text-neutral-400 hover:text-red-500 transition-colors inline-flex items-center space-x-1 p-1"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Remove</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Right: Item Total Price */}
                      <div className="text-right shrink-0">
                        <span className="block text-sm sm:text-base font-extrabold text-neutral-900 font-sans">
                          {formatCurrency(item.price * item.quantity, settings.currencySymbol)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-[10px] text-neutral-400 block mt-0.5">
                            {formatCurrency(item.price, settings.currencySymbol)} each
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shopping Assurance Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center space-x-3 p-3.5 bg-white rounded-2xl border border-neutral-100 shadow-xs">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">100% Secure</p>
                  <p className="text-[10px] text-neutral-400">Encrypted checkout</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3.5 bg-white rounded-2xl border border-neutral-100 shadow-xs">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">Quick Delivery</p>
                  <p className="text-[10px] text-neutral-400">Doorstep shipping</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3.5 bg-white rounded-2xl border border-neutral-100 shadow-xs">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-neutral-900">Easy Support</p>
                  <p className="text-[10px] text-neutral-400">Fast assistance</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary & Checkout (col-span-5 or 4 on desktop) */}
          <div className="lg:col-span-5 xl:col-span-4 mt-6 lg:mt-0 lg:sticky lg:top-24">
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-neutral-100 space-y-4">
              
              <h2 className="text-base sm:text-lg font-bold text-neutral-900 font-display border-b border-neutral-100 pb-3">
                Order Summary
              </h2>

              <div className="space-y-2.5 text-xs text-neutral-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
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
                  <span className="font-semibold text-emerald-600">
                    {shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee, settings.currencySymbol)}
                  </span>
                </div>

                <div className="pt-3 border-t border-neutral-100 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-neutral-900">Total Price</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-neutral-900 font-sans">
                    {formatCurrency(total, settings.currencySymbol)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 rounded-full bg-honey hover:bg-honey-600 text-white font-bold text-xs sm:text-sm tracking-wide shadow-sm flex items-center justify-center space-x-2 transition-all active:scale-95"
              >
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <p className="text-[11px] text-neutral-400 text-center flex items-center justify-center gap-1.5 pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Safe & secure payments with Razorpay & COD</span>
              </p>

            </div>
          </div>

        </div>

        {/* Recommended Products Grid */}
        {recommendedProducts.length > 0 && (
          <div className="mt-12 sm:mt-16 pt-8 border-t border-neutral-200/60">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold font-display text-neutral-900">
                  Recommended For You
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Trending styles our customers love
                </p>
              </div>
              <Link
                to="/shop"
                className="text-xs font-bold text-honey hover:text-honey-600 transition-colors"
              >
                Explore Shop &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
