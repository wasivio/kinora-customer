import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  CreditCard, 
  Banknote,
  Loader2,
  AlertTriangle,
  MapPin,
  Phone,
  User as UserIcon,
  ShoppingBag,
  CheckCircle2,
  Truck,
  RotateCcw
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
  const { settings, getProductById } = useStore();
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
  const [saveThisAddress, setSaveThisAddress] = useState<boolean>(() => {
    try {
      const alreadySaved = localStorage.getItem('kinora_address_saved_once');
      return !alreadySaved;
    } catch {
      return true;
    }
  });

  // Product-wise Payment Settings & Eligibility Calculations
  const codIneligibleItems = cart.filter((item) => {
    const prod = getProductById(item.productId);
    const allow = prod?.allowCOD ?? prod?.paymentSettings?.allowCOD ?? item.allowCOD ?? true;
    return allow === false;
  });

  const upiIneligibleItems = cart.filter((item) => {
    const prod = getProductById(item.productId);
    const allow = prod?.allowUPI ?? prod?.paymentSettings?.allowUPI ?? item.allowUPI ?? true;
    return allow === false;
  });

  const isCodEligible = codIneligibleItems.length === 0;
  const isUpiEligible = upiIneligibleItems.length === 0;

  // Itemized breakdown of configured COD charges per product in cart
  const codChargeBreakdown = useMemo(() => {
    const map = new Map<string, { id: string; name: string; codCharge: number }>();
    cart.forEach((item) => {
      const prod = getProductById(item.productId);
      const charge = Number(
        prod?.codCharge ??
        prod?.paymentSettings?.codCharge ??
        item.codCharge ??
        0
      );
      if (charge > 0 && !map.has(item.productId)) {
        map.set(item.productId, {
          id: item.productId,
          name: item.name,
          codCharge: charge,
        });
      }
    });
    return Array.from(map.values());
  }, [cart, getProductById]);

  // Total COD extra fee: Sum of configured COD charges for all products in cart
  const codExtraCharge = isCodEligible
    ? codChargeBreakdown.reduce((sum, item) => sum + item.codCharge, 0)
    : 0;

  // Final Order Total based on payment method
  const activeCodCharge = paymentMethod === 'cod' ? codExtraCharge : 0;
  const finalOrderTotal = total + activeCodCharge;

  // Auto switch payment method if currently selected one is ineligible
  useEffect(() => {
    if (!isCodEligible && paymentMethod === 'cod') {
      if (isUpiEligible) setPaymentMethod('online');
    } else if (!isUpiEligible && paymentMethod === 'online') {
      if (isCodEligible) setPaymentMethod('cod');
    }
  }, [isCodEligible, isUpiEligible, paymentMethod]);

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
      // Already has saved address in profile: uncheck by default so user manually checks only if desired
      setSaveThisAddress(false);
      try {
        localStorage.setItem('kinora_address_saved_once', 'true');
      } catch {}
    } else if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.displayName || prev.name,
      }));
      // First time user with no saved addresses: checked by default
      try {
        const alreadySaved = localStorage.getItem('kinora_address_saved_once');
        setSaveThisAddress(!alreadySaved);
      } catch {
        setSaveThisAddress(true);
      }
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

    if (!isCodEligible && !isUpiEligible) {
      toast.error('No payment method is available for your cart combination. Please remove conflicting items.');
      return;
    }

    if (paymentMethod === 'cod' && !isCodEligible) {
      toast.error('Cash on Delivery is unavailable for items in your cart. Please select Online Payment.');
      return;
    }

    if (paymentMethod === 'online' && !isUpiEligible) {
      toast.error('Online Payment is unavailable for items in your cart. Please select Cash on Delivery.');
      return;
    }

    setIsSubmitting(true);
    setProcessingMessage('Verifying cart and payment eligibility...');

    // Server-side validation before finalizing order
    let verifiedCodFee = activeCodCharge;
    let verifiedTotal = finalOrderTotal;

    try {
      const valRes = await fetch('/api/validate-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          paymentMethod,
          shippingFee,
          couponDiscount,
        }),
      });

      if (valRes.ok) {
        const valData = await valRes.json();
        if (valData.success === false || valData.valid === false) {
          throw new Error(valData.error || 'Cart payment verification failed. Please review your cart.');
        }
        if (paymentMethod === 'cod') {
          verifiedCodFee = Number(valData.codCharge) || 0;
          verifiedTotal =
            (Number(valData.subtotal) || subtotal) - couponDiscount + shippingFee + verifiedCodFee;
        } else {
          verifiedTotal = (Number(valData.subtotal) || subtotal) - couponDiscount + shippingFee;
        }
      }
    } catch (valErr: any) {
      if (valErr.message && !valErr.message.includes('Failed to fetch')) {
        toast.error(valErr.message);
        setIsSubmitting(false);
        setProcessingMessage('');
        return;
      }
    }

    // ==========================================
    // 1. CASH ON DELIVERY (COD) FLOW
    // ==========================================
    if (paymentMethod === 'cod') {
      setProcessingMessage('Placing COD Order...');

      try {
        const newOrder: Omit<Order, 'id'> = {
          orderNumber,
          customerId: user.uid,
          customerName: formData.name,
          customerEmail: user.email || '',
          customerPhone: formData.phone,
          items: orderItems,
          totalAmount: verifiedTotal,
          subtotal,
          discountAmount: couponDiscount,
          taxAmount: 0,
          shippingAmount: shippingFee,
          codCharge: verifiedCodFee,
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
          try {
            localStorage.setItem('kinora_address_saved_once', 'true');
          } catch {}
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
    setProcessingMessage('Creating secure Razorpay order...');

    try {
      // Step A: Create order on server with verified items
      const orderRes = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: verifiedTotal,
          currency: settings.currency || 'INR',
          receipt: orderNumber,
          items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
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
              totalAmount: verifiedTotal,
              subtotal,
              discountAmount: couponDiscount,
              taxAmount: 0,
              shippingAmount: shippingFee,
              codCharge: 0,
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
              try {
                localStorage.setItem('kinora_address_saved_once', 'true');
              } catch {}
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
    <div className="min-h-screen bg-[#FAFAFC] pb-24 sm:pb-32">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 sm:mb-6 border-b border-neutral-200/60">
          <div>
            <div className="flex items-center space-x-2 text-xs text-neutral-400 font-medium mb-1">
              <Link to="/cart" className="hover:text-neutral-800 transition-colors">Bag</Link>
              <span>/</span>
              <span className="text-neutral-800 font-bold">Express Checkout</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 font-display">
              Checkout & Delivery
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/cart"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white border border-neutral-200/80 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Cart</span>
            </Link>

            <div className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-700">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>256-Bit SSL Encrypted</span>
            </div>
          </div>
        </div>

        {!user ? (
          <div className="max-w-md mx-auto text-center p-8 sm:p-10 bg-white rounded-3xl border border-neutral-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] my-12">
            <div className="w-16 h-16 rounded-full bg-honey/10 text-honey flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2 font-display">
              Sign In to Complete Order
            </h2>
            <p className="text-xs text-neutral-500 mb-6">
              Sign in with Google to quickly place your order, use saved addresses, and track delivery.
            </p>
            <button
              onClick={loginWithGoogle}
              className="w-full py-3.5 px-6 rounded-full bg-honey hover:bg-honey-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
            >
              Continue with Google
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitOrder} className="lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10 items-start">
            
            {/* Left Column (8 cols): Delivery Details & Payment Selection */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              
              {/* 1. Delivery Details Card */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                      1
                    </span>
                    <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-900 font-display">
                      Delivery Details
                    </h2>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-medium">All fields with * are required</span>
                </div>

                {/* Saved Addresses Selector */}
                {userProfile?.addresses && userProfile.addresses.length > 0 && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600">
                        Select From Saved Addresses
                      </label>
                      <Link to="/profile" className="text-[11px] font-semibold text-honey hover:underline">
                        Manage Addresses
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {userProfile.addresses.map((addr, idx) => {
                        const isSelected = formData.street === addr.street && formData.zip === addr.zip;
                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              setFormData(addr);
                              setSaveThisAddress(false);
                            }}
                            className={`p-4 rounded-2xl border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                              isSelected
                                ? 'border-honey bg-honey/5 ring-1 ring-honey shadow-2xs'
                                : 'border-neutral-200/80 bg-[#FAFAFC] hover:bg-white hover:border-neutral-300'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-neutral-200/40">
                                <span className="font-bold text-neutral-900 text-xs sm:text-sm">{addr.name}</span>
                                {isSelected ? (
                                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-honey text-white text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Selected</span>
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-neutral-400">Address #{idx + 1}</span>
                                )}
                              </div>
                              <p className="text-neutral-600 line-clamp-2 leading-relaxed">{addr.street}</p>
                              <p className="text-neutral-500 font-medium mt-1">{addr.city}, {addr.state} - {addr.zip}</p>
                            </div>
                            <p className="text-[11px] text-neutral-400 pt-2 mt-2 border-t border-neutral-200/40 flex items-center space-x-1">
                              <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                              <span>{addr.phone}</span>
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Manual Address Input Fields */}
                <div className="pt-2 border-t border-neutral-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-3">
                    Shipping Address Form
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <UserIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g. Md Wasim Alam"
                          className="w-full bg-[#FAFAFC] border border-neutral-200/90 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 focus:outline-none focus:border-honey focus:bg-white focus:ring-1 focus:ring-honey transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                        <input
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="10-digit mobile number"
                          className="w-full bg-[#FAFAFC] border border-neutral-200/90 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 focus:outline-none focus:border-honey focus:bg-white focus:ring-1 focus:ring-honey transition-all"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Street Address, Flat / House No *
                      </label>
                      <div className="relative">
                        <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          name="street"
                          required
                          value={formData.street}
                          onChange={handleChange}
                          placeholder="House no., Building, Street, Area / Landmark"
                          className="w-full bg-[#FAFAFC] border border-neutral-200/90 rounded-xl pl-9 pr-3 py-2.5 text-neutral-900 focus:outline-none focus:border-honey focus:bg-white focus:ring-1 focus:ring-honey transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:col-span-2">
                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">
                          City / Town *
                        </label>
                        <input
                          type="text"
                          name="city"
                          required
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="City"
                          className="w-full bg-[#FAFAFC] border border-neutral-200/90 rounded-xl px-3 py-2.5 text-neutral-900 focus:outline-none focus:border-honey focus:bg-white focus:ring-1 focus:ring-honey transition-all"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          required
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="State"
                          className="w-full bg-[#FAFAFC] border border-neutral-200/90 rounded-xl px-3 py-2.5 text-neutral-900 focus:outline-none focus:border-honey focus:bg-white focus:ring-1 focus:ring-honey transition-all"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-neutral-700 mb-1">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          name="zip"
                          required
                          value={formData.zip}
                          onChange={handleChange}
                          placeholder="6-digit PIN"
                          className="w-full bg-[#FAFAFC] border border-neutral-200/90 rounded-xl px-3 py-2.5 text-neutral-900 focus:outline-none focus:border-honey focus:bg-white focus:ring-1 focus:ring-honey transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        disabled
                        value={formData.country}
                        className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-3 py-2.5 text-neutral-500 cursor-not-allowed font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-neutral-100">
                    <label className="flex items-center space-x-2.5 text-xs text-neutral-700 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={saveThisAddress}
                        onChange={(e) => setSaveThisAddress(e.target.checked)}
                        className="w-4 h-4 rounded border-neutral-300 text-honey focus:ring-honey accent-honey cursor-pointer"
                      />
                      <span className="font-medium">Save to my profile for faster 1-click checkout on future orders</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 2. Payment Method Card */}
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center font-mono">
                      2
                    </span>
                    <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-900 font-display">
                      Payment Method
                    </h2>
                  </div>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 tracking-wider">
                    Razorpay Active
                  </span>
                </div>

                {/* Conflict Notice: If neither COD nor Online UPI is available for all products */}
                {!isCodEligible && !isUpiEligible && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-red-900 text-sm">No Common Payment Method Available</p>
                        <p className="mt-1 text-red-700 leading-relaxed">
                          Your cart contains items with conflicting payment requirements. Some items only support Cash on Delivery while others only accept Online Payment. They cannot be checked out together.
                        </p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-red-200/60 flex items-center justify-between">
                      <span className="text-[11px] text-red-600 font-medium">Please separate your items into different orders.</span>
                      <Link to="/cart" className="font-bold text-red-800 underline hover:text-red-900 text-xs">
                        Review Cart &rarr;
                      </Link>
                    </div>
                  </div>
                )}

                {/* Option 1: Online Payment via Razorpay */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    !isUpiEligible
                      ? 'border-neutral-200 bg-neutral-100/70 opacity-70'
                      : paymentMethod === 'online'
                      ? 'border-honey bg-honey/5 ring-1 ring-honey shadow-xs'
                      : 'border-neutral-200/80 hover:border-neutral-300 cursor-pointer bg-[#FAFAFC]'
                  }`}
                  onClick={() => {
                    if (isUpiEligible) setPaymentMethod('online');
                  }}
                >
                  <label className={`flex items-start justify-between ${isUpiEligible ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                    <div className="flex items-start space-x-3.5">
                      <input
                        type="radio"
                        name="payment"
                        disabled={!isUpiEligible}
                        checked={paymentMethod === 'online'}
                        onChange={() => {
                          if (isUpiEligible) setPaymentMethod('online');
                        }}
                        className="mt-1 w-4 h-4 accent-honey text-honey cursor-pointer"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <CreditCard className="w-4 h-4 text-honey" />
                          <span className="text-xs sm:text-sm font-bold text-neutral-900">
                            UPI & Online Payment (Razorpay)
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                            Instant & Recommended
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                          Pay securely using UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, NetBanking, or Wallets.
                        </p>
                      </div>
                    </div>
                  </label>

                  {!isUpiEligible && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">Online payment disabled for item(s):</span>
                        <ul className="list-disc list-inside mt-0.5 text-[10px] space-y-0.5">
                          {upiIneligibleItems.map((item) => (
                            <li key={item.id} className="truncate">{item.name}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Option 2: Cash on Delivery */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    !isCodEligible
                      ? 'border-neutral-200 bg-neutral-100/70 opacity-70'
                      : paymentMethod === 'cod'
                      ? 'border-honey bg-honey/5 ring-1 ring-honey shadow-xs'
                      : 'border-neutral-200/80 hover:border-neutral-300 cursor-pointer bg-[#FAFAFC]'
                  }`}
                  onClick={() => {
                    if (isCodEligible) setPaymentMethod('cod');
                  }}
                >
                  <label className={`flex items-start justify-between ${isCodEligible ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                    <div className="flex items-start space-x-3.5 w-full">
                      <input
                        type="radio"
                        name="payment"
                        disabled={!isCodEligible}
                        checked={paymentMethod === 'cod'}
                        onChange={() => {
                          if (isCodEligible) setPaymentMethod('cod');
                        }}
                        className="mt-1 w-4 h-4 accent-honey text-honey cursor-pointer"
                      />
                      <div className="w-full">
                        <div className="flex flex-wrap items-center gap-2">
                          <Banknote className="w-4 h-4 text-honey" />
                          <span className="text-xs sm:text-sm font-bold text-neutral-900">
                            Cash on Delivery (COD)
                          </span>
                          {isCodEligible && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                codExtraCharge > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {codExtraCharge > 0 ? `+ ₹${codExtraCharge} COD Fee` : 'Free COD'}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                          Pay in cash upon doorstep delivery of your package by the courier.
                        </p>

                        {isCodEligible && codChargeBreakdown.length > 0 && (
                          <div className="mt-2.5 text-[11px] text-neutral-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/60 space-y-1">
                            <span className="font-semibold text-amber-900 block">Product-wise COD Extra Charges:</span>
                            {codChargeBreakdown.map((b) => (
                              <div key={b.id} className="flex justify-between text-neutral-600">
                                <span className="truncate max-w-[240px]">• {b.name}</span>
                                <span className="font-semibold text-neutral-800">+{formatCurrency(b.codCharge, settings.currencySymbol)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </label>

                  {!isCodEligible && (
                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold block">COD unavailable for item(s):</span>
                        <ul className="list-disc list-inside mt-0.5 text-[10px] space-y-0.5">
                          {codIneligibleItems.map((item) => (
                            <li key={item.id} className="truncate">{item.name}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Column (4 cols / 5 cols on lg): Sticky Order Summary & CTA */}
            <div className="lg:col-span-5 xl:col-span-4 mt-6 lg:mt-0 space-y-4 lg:sticky lg:top-24">
              
              <div className="bg-white p-6 sm:p-7 rounded-3xl border border-neutral-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 font-display">
                    Order Summary
                  </h3>
                  <span className="text-xs font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-full">
                    {cart.length} {cart.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Items in Cart */}
                <div className="divide-y divide-neutral-100 max-h-60 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-12 h-12 bg-[#f5f5f5] rounded-xl overflow-hidden shrink-0 p-1 flex items-center justify-center border border-neutral-100">
                          <img src={item.image || '/LOGO.png'} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-900 truncate">{item.name}</p>
                          {item.selectedVariants && (
                            <p className="text-neutral-400 text-[10px] truncate mt-0.5">
                              {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(' | ')}
                            </p>
                          )}
                          <p className="text-neutral-500 text-[11px] mt-0.5">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-neutral-900 font-sans shrink-0">
                        {formatCurrency(item.price * item.quantity, settings.currencySymbol)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Calculations */}
                <div className="space-y-2.5 text-xs text-neutral-600 pt-3 border-t border-neutral-100">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-neutral-900 font-sans">
                      {formatCurrency(subtotal, settings.currencySymbol)}
                    </span>
                  </div>

                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-honey font-medium">
                      <span>Coupon Discount</span>
                      <span>-{formatCurrency(couponDiscount, settings.currencySymbol)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span>Shipping Delivery</span>
                    <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[11px]">
                      {shippingFee === 0 ? 'FREE DELIVERY' : formatCurrency(shippingFee, settings.currencySymbol)}
                    </span>
                  </div>

                  {/* COD Extra Charge Line Item */}
                  {paymentMethod === 'cod' && isCodEligible && (
                    <div className="rounded-xl bg-amber-50/80 p-3 border border-amber-200/70 space-y-1.5 text-xs">
                      <div className="flex justify-between text-amber-900 font-bold">
                        <span>COD Extra Handling Fee</span>
                        <span>{codExtraCharge > 0 ? `+${formatCurrency(codExtraCharge, settings.currencySymbol)}` : 'FREE'}</span>
                      </div>
                      {codChargeBreakdown.length > 0 && (
                        <div className="text-[11px] text-amber-800/80 space-y-1 pt-1.5 border-t border-amber-200/60">
                          {codChargeBreakdown.map((item) => (
                            <div key={item.id} className="flex justify-between">
                              <span className="truncate max-w-[200px]">• {item.name}</span>
                              <span className="font-semibold">+{formatCurrency(item.codCharge, settings.currencySymbol)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-3 border-t border-neutral-100 flex justify-between items-baseline">
                    <div>
                      <span className="text-sm font-bold text-neutral-900 block font-display">Total Amount</span>
                      <span className="text-[10px] text-neutral-400">Inclusive of all taxes</span>
                    </div>
                    <span className="text-xl font-bold text-neutral-900 font-sans">
                      {formatCurrency(finalOrderTotal, settings.currencySymbol)}
                    </span>
                  </div>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || (!isCodEligible && !isUpiEligible)}
                  className="w-full py-4 px-6 rounded-full bg-honey hover:bg-honey-600 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-md hover:shadow-lg active:scale-95 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{processingMessage || 'Processing Order...'}</span>
                    </>
                  ) : !isCodEligible && !isUpiEligible ? (
                    <span>No Payment Method Available</span>
                  ) : paymentMethod === 'online' ? (
                    <span>Pay {formatCurrency(finalOrderTotal, settings.currencySymbol)} Online</span>
                  ) : (
                    <span>Place COD Order ({formatCurrency(finalOrderTotal, settings.currencySymbol)})</span>
                  )}
                </button>

                {/* Assurance & Security Badges */}
                <div className="pt-2 border-t border-neutral-100 space-y-2">
                  <div className="flex items-center justify-center space-x-1.5 text-[11px] text-neutral-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Razorpay 256-bit SSL encrypted checkout</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-neutral-500 text-center">
                    <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center space-x-1">
                      <Truck className="w-3 h-3 text-neutral-400" />
                      <span>Free Express Delivery</span>
                    </div>
                    <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center space-x-1">
                      <RotateCcw className="w-3 h-3 text-neutral-400" />
                      <span>7-Day Return Policy</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </form>
        )}

      </div>

    </div>
  );
};
