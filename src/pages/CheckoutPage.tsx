import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  CreditCard, 
  Banknote,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Order, OrderAddress, OrderItem } from '../types';
import { generateOrderNumber, formatCurrency } from '../lib/utils';
import { loadRazorpayScript, RazorpayResponse } from '../lib/razorpay';
import { toast } from 'sonner';

export const CheckoutPage: React.FC = () => {
  const { user, userProfile, loginWithGoogle, saveAddress } = useAuth();
  const { 
    cart, 
    subtotal, 
    couponDiscount, 
    shippingFee, 
    total, 
    clearCart
  } = useCart();
  const { settings } = useStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<OrderAddress>({
    name: user?.displayName || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
  });

  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [processingMessage, setProcessingMessage] = useState<string>('');
  const [saveThisAddress, setSaveThisAddress] = useState<boolean>(true);

  useEffect(() => {
    if (userProfile?.addresses && userProfile.addresses.length > 0) {
      const defaultAddr = userProfile.addresses[0];
      setFormData({
        name: defaultAddr.name || user?.displayName || '',
        phone: defaultAddr.phone || '',
        street: defaultAddr.street || '',
        city: defaultAddr.city || '',
        state: defaultAddr.state || '',
        zip: defaultAddr.zip || '',
        country: defaultAddr.country || 'India',
      });
    } else if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.displayName || prev.name,
      }));
    }
  }, [userProfile, user]);

  useEffect(() => {
    if (cart.length === 0) {
      navigate('/cart');
    }
  }, [cart, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in with Google to place your order');
      return;
    }

    if (
      !formData.name.trim() || 
      !formData.phone.trim() || 
      !formData.street.trim() || 
      !formData.city.trim() || 
      !formData.state.trim() || 
      !formData.zip.trim()
    ) {
      toast.error('Please complete all required delivery fields');
      return;
    }

    const orderNumber = generateOrderNumber();
    const orderItems: OrderItem[] = cart.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
      variant: item.selectedVariants 
        ? Object.entries(item.selectedVariants).map(([k, v]) => `${k}:${v}`).join(', ') 
        : undefined,
      sku: item.sku,
    }));

    // ==========================================
    // 1. CASH ON DELIVERY (COD) FLOW
    // ==========================================
    if (paymentMethod === 'cod') {
      setIsSubmitting(true);
      setProcessingMessage('Placing COD Order...');

      try {
        const newOrder: Omit<Order, 'id'> = {
          orderNumber,
          customerId: user.uid,
          customerName: formData.name,
          customerEmail: user.email || '',
          customerPhone: formData.phone,
          items: orderItems,
          totalAmount: total,
          subtotal,
          discountAmount: couponDiscount,
          taxAmount: 0,
          shippingAmount: shippingFee,
          paymentStatus: 'pending',
          orderStatus: 'pending',
          paymentMethod: 'COD',
          shippingAddress: formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const docRef = await addDoc(collection(db, 'orders'), newOrder);

        if (saveThisAddress) {
          saveAddress(formData).catch(() => {});
        }

        clearCart();
        toast.success(`Order ${orderNumber} placed successfully!`);
        navigate(`/orders/${docRef.id}`);
      } catch (err: any) {
        console.error('Error placing COD order:', err);
        toast.error(err?.message || 'Failed to place order. Please try again.');
      } finally {
        setIsSubmitting(false);
        setProcessingMessage('');
      }
      return;
    }

    // ==========================================
    // 2. ONLINE PAYMENT VIA RAZORPAY (TEST MODE)
    // ==========================================
    setIsSubmitting(true);
    setProcessingMessage('Creating secure Razorpay order...');

    try {
      // Step A: Create order on server
      const orderRes = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: total,
          currency: settings.currency || 'INR',
          receipt: orderNumber,
          notes: {
            customerId: user.uid,
            customerName: formData.name,
            customerEmail: user.email || '',
            orderNumber,
          },
        }),
      });

      const orderData = await orderRes.json();

      if (!orderRes.ok || !orderData.success || !orderData.orderId) {
        throw new Error(orderData.error || 'Failed to create payment order. Please check Razorpay configuration.');
      }

      // Step B: Load Razorpay Checkout SDK
      setProcessingMessage('Opening Razorpay Checkout...');
      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // Step C: Initialize Razorpay Checkout
      const rzpOptions = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: settings.storeName || 'KINORA',
        description: `Order #${orderNumber}`,
        image: '/LOGO.png',
        order_id: orderData.orderId,
        prefill: {
          name: formData.name,
          email: user.email || '',
          contact: formData.phone,
        },
        notes: {
          orderNumber,
          customerId: user.uid,
        },
        theme: {
          color: '#E8A048', // Honey Caramel
        },
        modal: {
          ondismiss: () => {
            setIsSubmitting(false);
            setProcessingMessage('');
            toast.info('Payment was cancelled. Your items remain safe in your cart.');
          },
          escape: true,
          backdropclose: false,
        },
        handler: async (response: RazorpayResponse) => {
          // Step D: Server-side signature verification
          setProcessingMessage('Verifying payment signature with bank...');

          try {
            const verifyRes = await fetch('/api/verify-razorpay-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success || !verifyData.verified) {
              throw new Error(verifyData.error || 'Payment verification failed. Invalid signature.');
            }

            // Step E: Create order in Firestore as PAID
            setProcessingMessage('Saving order details...');

            const newOrder: Omit<Order, 'id'> = {
              orderNumber,
              customerId: user.uid,
              customerName: formData.name,
              customerEmail: user.email || '',
              customerPhone: formData.phone,
              items: orderItems,
              totalAmount: total,
              subtotal,
              discountAmount: couponDiscount,
              taxAmount: 0,
              shippingAmount: shippingFee,
              paymentStatus: 'paid',
              orderStatus: 'pending',
              paymentMethod: 'RAZORPAY',
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              shippingAddress: formData,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            const docRef = await addDoc(collection(db, 'orders'), newOrder);

            if (saveThisAddress) {
              saveAddress(formData).catch(() => {});
            }

            clearCart();
            toast.success(`Payment verified! Order #${orderNumber} placed successfully.`);
            navigate(`/orders/${docRef.id}`);
          } catch (verifyErr: any) {
            console.error('Verification error:', verifyErr);
            toast.error(
              verifyErr?.message || 
              `Payment succeeded but verification failed. Payment ID: ${response.razorpay_payment_id}. Please contact support.`
            );
          } finally {
            setIsSubmitting(false);
            setProcessingMessage('');
          }
        },
      };

      const rzpInstance = new window.Razorpay(rzpOptions);

      rzpInstance.on('payment.failed', (failResponse: any) => {
        console.error('Razorpay payment failed:', failResponse);
        setIsSubmitting(false);
        setProcessingMessage('');
        const desc = failResponse?.error?.description || 'Payment was declined. Please try again or select COD.';
        toast.error(`Payment Failed: ${desc}`);
      });

      rzpInstance.open();
    } catch (err: any) {
      console.error('Error in online checkout flow:', err);
      toast.error(err?.message || 'Unable to start online payment. Please try again or select Cash on Delivery.');
      setIsSubmitting(false);
      setProcessingMessage('');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-32">
      
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link
            to="/cart"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-neutral-600 hover:text-honey transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Cart</span>
          </Link>
          <div className="flex items-center space-x-1 text-xs text-neutral-500 font-medium">
            <Lock className="w-3.5 h-3.5 text-honey" />
            <span>Secure Checkout</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        
        {!user ? (
          <div className="max-w-md mx-auto text-center p-8 bg-white rounded-3xl border border-neutral-100 shadow-sm mb-12">
            <h2 className="text-xl font-bold text-neutral-900 mb-2 font-display">
              Sign In to Complete Order
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Sign in with Google to quickly place your order and track your delivery.
            </p>
            <button
              onClick={loginWithGoogle}
              className="w-full py-3.5 px-6 rounded-full bg-honey hover:bg-honey-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
            >
              Continue with Google
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Delivery & Payment Details */}
            <div className="lg:col-span-2 space-y-5">
              
              {/* 1. Delivery Details */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 pb-2 border-b border-neutral-100 font-display">
                  1. Delivery Details
                </h2>

                {userProfile?.addresses && userProfile.addresses.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-neutral-600 mb-2">
                      Saved Addresses
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {userProfile.addresses.map((addr, idx) => (
                        <div
                          key={idx}
                          onClick={() => setFormData(addr)}
                          className={`p-3 rounded-2xl border text-xs cursor-pointer transition-all ${
                            formData.street === addr.street && formData.zip === addr.zip
                              ? 'border-honey bg-honey/5 font-medium'
                              : 'border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <p className="font-bold text-neutral-900">{addr.name}</p>
                          <p className="text-neutral-500 mt-0.5">{addr.street}, {addr.city}</p>
                          <p className="text-neutral-400">{addr.state} - {addr.zip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-medium text-neutral-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. John Doe"
                      className="w-full bg-[#F5F7FA] border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-honey"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-neutral-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Mobile number"
                      className="w-full bg-[#F5F7FA] border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-honey"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-medium text-neutral-700 mb-1">Street Address *</label>
                    <input
                      type="text"
                      name="street"
                      required
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="House/Apartment, Street, Area"
                      className="w-full bg-[#F5F7FA] border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-honey"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                      className="w-full bg-[#F5F7FA] border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-honey"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">State *</label>
                    <input
                      type="text"
                      name="state"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="State"
                      className="w-full bg-[#F5F7FA] border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-honey"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Pincode *</label>
                    <input
                      type="text"
                      name="zip"
                      required
                      value={formData.zip}
                      onChange={handleChange}
                      placeholder="Pincode"
                      className="w-full bg-[#F5F7FA] border border-neutral-200 rounded-xl p-2.5 text-neutral-900 focus:outline-none focus:border-honey"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      disabled
                      value={formData.country}
                      className="w-full bg-neutral-100 border border-neutral-200 rounded-xl p-2.5 text-neutral-500 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center space-x-2 text-xs text-neutral-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveThisAddress}
                      onChange={(e) => setSaveThisAddress(e.target.checked)}
                      className="rounded border-neutral-300 text-honey focus:ring-honey accent-honey"
                    />
                    <span>Save to my profile for future orders</span>
                  </label>
                </div>
              </div>

              {/* 2. Payment Method */}
              <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 font-display">
                    2. Payment Method
                  </h2>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 tracking-wider">
                    Razorpay Test Mode
                  </span>
                </div>

                {/* Option 1: Online Payment via Razorpay */}
                <label
                  className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'online'
                      ? 'border-honey bg-honey/5 ring-1 ring-honey shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'online'}
                      onChange={() => setPaymentMethod('online')}
                      className="mt-1 accent-honey text-honey"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4 text-honey" />
                        <span className="text-xs sm:text-sm font-bold text-neutral-900">
                          Online Payment (Razorpay)
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                          Instant
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Pay securely using UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, or Wallets.
                      </p>
                    </div>
                  </div>
                </label>

                {/* Option 2: Cash on Delivery */}
                <label
                  className={`flex items-start justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-honey bg-honey/5 ring-1 ring-honey shadow-sm'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="mt-1 accent-honey text-honey"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <Banknote className="w-4 h-4 text-honey" />
                        <span className="text-xs sm:text-sm font-bold text-neutral-900">
                          Cash on Delivery (COD)
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">
                        Pay in cash upon doorstep delivery of your package.
                      </p>
                    </div>
                  </div>
                </label>
              </div>

            </div>

            {/* Order Summary & CTA */}
            <div>
              <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm space-y-4 sticky top-24">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 font-display">
                  Order Summary
                </h3>

                <div className="divide-y divide-neutral-100 max-h-52 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-10 h-10 bg-[#f5f5f5] rounded-xl overflow-hidden shrink-0 p-1 flex items-center justify-center">
                          <img src={item.image || '/LOGO.png'} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-800 line-clamp-1">{item.name}</p>
                          <p className="text-neutral-400 text-[11px]">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-neutral-900 font-sans">
                        {formatCurrency(item.price * item.quantity, settings.currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-xs text-neutral-600 pt-2 border-t border-neutral-100">
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
                    <span>Shipping</span>
                    <span className="font-semibold text-neutral-900">
                      {shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee, settings.currencySymbol)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-neutral-100 flex justify-between text-base font-bold text-neutral-900">
                    <span>Total Amount</span>
                    <span className="text-neutral-900 font-sans">{formatCurrency(total, settings.currencySymbol)}</span>
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-full bg-honey hover:bg-honey-600 disabled:bg-neutral-200 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{processingMessage || 'Processing...'}</span>
                    </>
                  ) : paymentMethod === 'online' ? (
                    <span>Pay {formatCurrency(total, settings.currencySymbol)} Online</span>
                  ) : (
                    <span>Place COD Order</span>
                  )}
                </button>

                <div className="flex items-center justify-center space-x-1.5 text-[11px] text-neutral-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-honey" />
                  <span>Razorpay 256-bit SSL encrypted checkout</span>
                </div>
              </div>
            </div>

          </form>
        )}

      </div>

    </div>
  );
};
