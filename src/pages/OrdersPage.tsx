import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const OrdersPage: React.FC = () => {
  const { user, isLoading: authLoading, loginWithGoogle } = useAuth();
  const { settings } = useStore();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Order[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...(doc.data() as Omit<Order, 'id'>) });
        });
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(list);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching orders:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="h-8 bg-neutral-200 rounded w-48 mb-6"></div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-28 bg-neutral-100 rounded-3xl"></div>
        ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center max-w-xl mx-auto px-4 text-center">
        <EmptyState
          icon={Package}
          title="Sign in to View Your Orders"
          description="Log in with your Google account to track your orders, view previous purchases, and manage shipments."
          actionText="Sign In with Google"
          onAction={loginWithGoogle}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-32">
      
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight font-display">
            My Orders
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Track and review your KINORA purchases
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        {orders.length > 0 ? (
          <div className="space-y-3">
            {orders.map((order) => {
              const statusBadgeStyles: Record<string, string> = {
                pending: 'bg-amber-50 text-amber-700 border-amber-200',
                processing: 'bg-blue-50 text-blue-700 border-blue-200',
                shipped: 'bg-honey-50 text-honey border-honey-200',
                delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                cancelled: 'bg-neutral-100 text-neutral-400 line-through border-neutral-200',
              };

              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="p-5 rounded-3xl border border-neutral-100 hover:border-honey/40 bg-white transition-all cursor-pointer shadow-sm hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-50">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <span className="text-xs sm:text-sm font-bold text-neutral-900 font-mono">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            statusBadgeStyles[order.orderStatus] || statusBadgeStyles.pending
                          }`}
                        >
                          {order.orderStatus}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {order.paymentMethod === 'RAZORPAY' ? 'Online' : 'COD'}: {order.paymentStatus}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Ordered on {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-sm sm:text-base font-bold text-neutral-900 font-sans">
                        {formatCurrency(order.totalAmount, settings.currencySymbol)}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                      </p>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="pt-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2 overflow-x-auto pr-2">
                      {order.items?.map((item, idx) => (
                        <div
                          key={idx}
                          className="w-12 h-12 bg-[#f5f5f5] rounded-xl overflow-hidden shrink-0 p-1 flex items-center justify-center border border-neutral-100"
                        >
                          <img
                            src={item.image || '/LOGO.png'}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center space-x-1 text-xs font-semibold text-honey shrink-0 ml-3">
                      <span>Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title="No Orders Yet"
            description="You haven't made any purchases yet. Explore our latest trending collection."
            actionText="Browse Products"
            actionLink="/shop"
          />
        )}
      </div>

    </div>
  );
};
