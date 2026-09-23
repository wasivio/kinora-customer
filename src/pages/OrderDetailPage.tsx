import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { getWhatsAppOrderUrl, ADMIN_WHATSAPP_NUMBER } from '../lib/whatsapp';
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  Truck, 
  Home, 
  XCircle,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { settings } = useStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);
  const justPlaced = Boolean((location.state as any)?.justPlaced);

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

  const handleCancelOrder = async () => {
    if (!order || order.orderStatus !== 'pending') return;
    const confirm = window.confirm('Are you sure you wish to cancel this order?');
    if (!confirm) return;

    setIsCancelling(true);
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        orderStatus: 'cancelled',
        updatedAt: new Date().toISOString(),
      });
      toast.success('Order has been cancelled');
    } catch {
      toast.error('Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-6">
        <div className="h-6 bg-neutral-200 rounded w-32"></div>
        <div className="h-20 bg-neutral-100 rounded-3xl"></div>
        <div className="h-64 bg-neutral-100 rounded-3xl"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-3">Order Not Found</h2>
        <p className="text-neutral-500 text-sm mb-6">
          We could not locate this order.
        </p>
        <Link
          to="/orders"
          className="px-6 py-3 rounded-full bg-honey text-white text-xs font-bold uppercase tracking-wider shadow-sm"
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

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-32">
      
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link
            to="/orders"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-neutral-600 hover:text-honey transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Orders</span>
          </Link>
          <span className="text-xs font-mono font-bold text-neutral-800">
            {order.orderNumber}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-5">
        
        {/* WhatsApp Admin Notification Card (+91 8810519646) */}
        <div className="p-4 sm:p-5 rounded-3xl border border-emerald-200 bg-emerald-50/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shrink-0 shadow-sm">
              <MessageCircle className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-bold text-neutral-900 font-display">
                  WhatsApp Admin Alert: +91 8810519646
                </span>
                {justPlaced && (
                  <span className="px-2 py-0.5 rounded-full bg-[#25D366] text-white text-[10px] font-bold uppercase tracking-wider">
                    New Order
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-600 mt-0.5">
                Complete order details generated for WhatsApp number <strong>8810519646</strong>.
              </p>
            </div>
          </div>

          <a
            href={getWhatsAppOrderUrl(order)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center space-x-2 shrink-0"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Send to WhatsApp</span>
          </a>
        </div>

        {/* Progress Tracker */}
        <div className="p-6 rounded-3xl border border-neutral-100 bg-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-neutral-100 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-honey">
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
                <span className="text-xs text-neutral-400">Tracking Code</span>
                <p className="text-sm font-bold text-neutral-800 font-mono">{order.trackingNumber}</p>
              </div>
            )}
          </div>

          {order.orderStatus === 'cancelled' ? (
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center space-x-2 text-neutral-600 text-xs font-semibold">
              <XCircle className="w-5 h-5 text-neutral-400" />
              <span>This order has been cancelled.</span>
            </div>
          ) : (
            <div className="relative flex items-center justify-between px-2 sm:px-6">
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
                      className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all ${
                        isCompleted
                          ? 'bg-honey text-white ring-4 ring-honey/10 shadow-sm'
                          : 'bg-white text-neutral-400 border border-neutral-200'
                      }`}
                    >
                      <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-semibold mt-2 tracking-tight ${
                        isCurrent ? 'text-honey' : isCompleted ? 'text-neutral-800' : 'text-neutral-400'
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

        {/* Items */}
        <div className="p-6 rounded-3xl border border-neutral-100 bg-white shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-4">
            Items Ordered ({order.items?.length || 0})
          </h3>

          <div className="divide-y divide-neutral-100">
            {order.items?.map((item, idx) => (
              <div key={idx} className="py-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-14 h-14 bg-[#f5f5f5] rounded-2xl overflow-hidden shrink-0 p-1 flex items-center justify-center">
                    <img
                      src={item.image || '/LOGO.png'}
                      alt={item.name}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <Link
                      to={`/product/${item.productId}`}
                      className="text-xs sm:text-sm font-semibold text-neutral-900 hover:text-honey transition-colors"
                    >
                      {item.name}
                    </Link>
                    {item.variant && (
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {item.variant}
                      </p>
                    )}
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Qty: {item.quantity} × {formatCurrency(item.price, settings.currencySymbol)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-bold text-neutral-900 font-sans">
                    {formatCurrency(item.price * item.quantity, settings.currencySymbol)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Address & Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl border border-neutral-100 bg-white shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
              Delivery Destination
            </h4>
            <div className="text-xs text-neutral-600 space-y-1">
              <p className="font-bold text-neutral-900">{order.shippingAddress?.name}</p>
              <p>{order.shippingAddress?.street}</p>
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.zip}</p>
              <p className="text-neutral-400 pt-1">Phone: {order.shippingAddress?.phone}</p>
            </div>
          </div>

          <div className="p-5 rounded-3xl border border-neutral-100 bg-white shadow-sm space-y-2.5 text-xs text-neutral-600">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2 font-display">
              Payment Summary
            </h4>
            
            <div className="flex justify-between items-center">
              <span>Payment Method:</span>
              <span className="font-semibold text-neutral-900">
                {order.paymentMethod === 'RAZORPAY' 
                  ? 'Online Payment (Razorpay)' 
                  : order.paymentMethod === 'COD' 
                  ? 'Cash on Delivery (COD)' 
                  : order.paymentMethod}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span>Payment Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
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

            {order.razorpayOrderId && (
              <div className="flex justify-between items-center">
                <span>Razorpay Order ID:</span>
                <span className="font-mono text-[11px] text-neutral-800 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">
                  {order.razorpayOrderId}
                </span>
              </div>
            )}

            {order.razorpayPaymentId && (
              <div className="flex justify-between items-center">
                <span>Razorpay Payment ID:</span>
                <span className="font-mono text-[11px] text-neutral-800 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-100">
                  {order.razorpayPaymentId}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-neutral-100 flex justify-between">
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

            <div className="flex justify-between pt-2 border-t border-neutral-100 text-sm font-bold text-neutral-900">
              <span>Total Amount:</span>
              <span className="text-neutral-900 font-sans">{formatCurrency(order.totalAmount, settings.currencySymbol)}</span>
            </div>
          </div>
        </div>

        {order.orderStatus === 'pending' && (
          <div className="pt-2 text-center">
            <button
              onClick={handleCancelOrder}
              disabled={isCancelling}
              className="px-6 py-2.5 rounded-full border border-neutral-300 text-neutral-600 hover:text-honey hover:border-honey text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Order'}
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
