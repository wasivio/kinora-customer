import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { CancelOrderModal } from '../components/common/CancelOrderModal';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  Truck, 
  Home, 
  XCircle,
  MapPin,
  Phone,
  CreditCard,
  ShieldCheck,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { settings } = useStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    const docRef = doc(db, 'orders', id);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setOrder({ id: snapshot.id, ...(snapshot.data() as Omit<Order, 'id'>) });
        } else {
          setOrder(null);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('Error fetching order:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  const handleConfirmCancel = async () => {
    if (!order || order.orderStatus !== 'pending') return;

    setIsCancelling(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        orderStatus: 'cancelled',
        updatedAt: new Date().toISOString(),
      });
      toast.success('Order has been cancelled');
      setIsCancelModalOpen(false);
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 animate-pulse space-y-6">
        <div className="h-6 bg-neutral-200 rounded w-32"></div>
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-32 bg-neutral-100 rounded-3xl"></div>
            <div className="h-64 bg-neutral-100 rounded-3xl"></div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="h-48 bg-neutral-100 rounded-3xl"></div>
            <div className="h-48 bg-neutral-100 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[65vh] flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4 text-neutral-400">
          <Package className="w-8 h-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2 font-display">Order Not Found</h2>
        <p className="text-neutral-500 text-xs mb-6">
          We could not locate this order or it may have been removed.
        </p>
        <Link
          to="/orders"
          className="px-6 py-3 rounded-full bg-honey hover:bg-honey-600 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
        >
          View My Orders
        </Link>
      </div>
    );
  }

  const steps = [
    { key: 'pending', label: 'Order Placed', icon: Clock },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: Home },
  ];

  const currentStepIndex = order.orderStatus === 'cancelled'
    ? -1
    : steps.findIndex((s) => s.key === order.orderStatus);

  const statusBadgeStyles: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-blue-50 text-blue-700 border-blue-200',
    shipped: 'bg-honey-50 text-honey border-honey-200',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-neutral-100 text-neutral-400 line-through border-neutral-200',
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-24 sm:pb-32">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 sm:mb-6 border-b border-neutral-200/60">
          <div>
            <div className="flex items-center space-x-2 text-xs text-neutral-400 font-medium mb-1">
              <Link to="/" className="hover:text-neutral-800 transition-colors">Home</Link>
              <span>/</span>
              <Link to="/orders" className="hover:text-neutral-800 transition-colors">Orders</Link>
              <span>/</span>
              <span className="text-neutral-800 font-bold font-mono">#{order.orderNumber}</span>
            </div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 font-display">
                Order #{order.orderNumber}
              </h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  statusBadgeStyles[order.orderStatus] || statusBadgeStyles.pending
                }`}
              >
                {order.orderStatus}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              to="/orders"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white border border-neutral-200/80 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Orders</span>
            </Link>

            <Link
              to="/shop"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-honey hover:bg-honey-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10 items-start">
          
          {/* Left Column (8 cols): Tracker + Items Ordered */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Progress Tracker Card */}
            <div className="p-6 sm:p-7 rounded-3xl border border-neutral-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.03)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-neutral-100 gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-honey">
                    Tracking Status
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight mt-0.5 capitalize font-display">
                    {order.orderStatus}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Ordered on {formatDate(order.createdAt)}
                  </p>
                </div>

                {order.trackingNumber && (
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">Tracking Code</span>
                    <p className="text-sm font-bold text-neutral-800 font-mono mt-0.5">{order.trackingNumber}</p>
                  </div>
                )}
              </div>

              {order.orderStatus === 'cancelled' ? (
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center space-x-3 text-neutral-600 text-xs font-semibold">
                  <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <span>This order has been cancelled and will not be shipped.</span>
                </div>
              ) : (
                <div className="relative flex items-center justify-between px-2 sm:px-8 py-2">
                  <div className="absolute top-1/2 left-8 right-8 -translate-y-1/2 h-1 bg-neutral-100 z-0" />
                  <div 
                    className="absolute top-1/2 left-8 -translate-y-1/2 h-1 bg-honey z-0 transition-all duration-500"
                    style={{
                      width: currentStepIndex >= 0 ? `${(currentStepIndex / (steps.length - 1)) * 100}%` : '0%'
                    }}
                  />

                  {steps.map((step, index) => {
                    const isCompleted = currentStepIndex >= index;
                    const isCurrent = currentStepIndex === index;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.key} className="relative z-10 flex flex-col items-center">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-honey text-white ring-4 ring-honey/15 shadow-sm'
                              : 'bg-white text-neutral-400 border-2 border-neutral-200'
                          }`}
                        >
                          <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <span
                          className={`text-[10px] sm:text-xs font-semibold mt-2 tracking-tight ${
                            isCurrent ? 'text-honey font-bold' : isCompleted ? 'text-neutral-800 font-medium' : 'text-neutral-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Items Ordered Card */}
            <div className="p-6 sm:p-7 rounded-3xl border border-neutral-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-900 font-display">
                  Items in this order ({order.items?.length || 0})
                </h3>
              </div>

              <div className="divide-y divide-neutral-100">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5 min-w-0">
                      <div className="w-16 h-16 sm:w-18 sm:h-18 bg-[#f5f5f5] rounded-2xl overflow-hidden shrink-0 p-1.5 flex items-center justify-center border border-neutral-100">
                        <img
                          src={item.image || '/LOGO.png'}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/product/${item.productId}`}
                          className="text-xs sm:text-sm font-bold text-neutral-900 hover:text-honey transition-colors block truncate"
                        >
                          {item.name}
                        </Link>
                        {item.variant && (
                          <p className="text-[11px] text-neutral-500 mt-0.5">
                            Size / Variant: <span className="font-semibold text-neutral-800">{item.variant}</span>
                          </p>
                        )}
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Qty: {item.quantity} × {formatCurrency(item.price, settings.currencySymbol)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs sm:text-base font-bold text-neutral-900 font-sans">
                        {formatCurrency(item.price * item.quantity, settings.currencySymbol)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cancel Button if eligible */}
            {order.orderStatus === 'pending' && (
              <div className="p-5 rounded-3xl border border-red-100 bg-red-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Need to cancel this order?</h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Orders can be cancelled anytime before dispatch processing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCancelModalOpen(true)}
                  disabled={isCancelling}
                  className="px-5 py-2.5 rounded-full border border-red-300 bg-white text-red-600 hover:bg-red-50 text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 active:scale-95 shadow-2xs shrink-0"
                >
                  Cancel Order
                </button>
              </div>
            )}

          </div>

          {/* Right Column (4 cols): Delivery Address & Payment Summary */}
          <div className="lg:col-span-4 mt-6 lg:mt-0 space-y-5 lg:sticky lg:top-24">
            
            {/* Delivery Destination Card */}
            <div className="p-6 rounded-3xl border border-neutral-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 font-display flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-honey" />
                <span>Delivery Destination</span>
              </h4>
              <div className="text-xs text-neutral-600 space-y-1.5 pt-1">
                <p className="font-bold text-neutral-900 text-sm">{order.shippingAddress?.name}</p>
                <p className="leading-relaxed">{order.shippingAddress?.street}</p>
                <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zip}</p>
                <p className="text-neutral-500 pt-1 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{order.shippingAddress?.phone}</span>
                </p>
              </div>
            </div>

            {/* Payment Summary Card */}
            <div className="p-6 rounded-3xl border border-neutral-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-3 text-xs text-neutral-600">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 font-display flex items-center space-x-2">
                <CreditCard className="w-4 h-4 text-honey" />
                <span>Payment Summary</span>
              </h4>
              
              <div className="pt-2 space-y-2 border-t border-neutral-100">
                <div className="flex justify-between items-center">
                  <span>Method:</span>
                  <span className="font-semibold text-neutral-900">
                    {order.paymentMethod === 'RAZORPAY' 
                      ? 'Online (Razorpay)' 
                      : order.paymentMethod === 'COD' 
                      ? 'Cash on Delivery (COD)' 
                      : order.paymentMethod}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      order.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : order.paymentStatus === 'pending'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>

                {order.razorpayPaymentId && (
                  <div className="flex justify-between items-center">
                    <span>Payment ID:</span>
                    <span className="font-mono text-[10px] text-neutral-800 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">
                      {order.razorpayPaymentId}
                    </span>
                  </div>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="pt-3 space-y-2 border-t border-neutral-100">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-neutral-900">{formatCurrency(order.subtotal, settings.currencySymbol)}</span>
                </div>

                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-honey font-medium">
                    <span>Discount:</span>
                    <span>-{formatCurrency(order.discountAmount, settings.currencySymbol)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span className="font-semibold text-neutral-900">
                    {order.shippingAmount === 0 ? 'FREE' : formatCurrency(order.shippingAmount, settings.currencySymbol)}
                  </span>
                </div>

                {order.codCharge !== undefined && order.codCharge > 0 && (
                  <div className="flex justify-between text-amber-800 font-semibold bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/70">
                    <span>COD Extra Fee:</span>
                    <span>+{formatCurrency(order.codCharge, settings.currencySymbol)}</span>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-neutral-100 text-sm sm:text-base font-bold text-neutral-900">
                  <span>Total Amount:</span>
                  <span className="text-neutral-900 font-sans">{formatCurrency(order.totalAmount, settings.currencySymbol)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-center space-x-1.5 text-[11px] text-neutral-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Guaranteed Safe & Secure Checkout</span>
              </div>
            </div>

          </div>

        </div>

      </div>

      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirmCancel={handleConfirmCancel}
        isCancelling={isCancelling}
        orderNumber={order.orderNumber}
      />

    </div>
  );
};
