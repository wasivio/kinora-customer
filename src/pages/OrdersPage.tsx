import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { Order } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { 
  Package, 
  ChevronRight, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Truck, 
  Heart, 
  User as UserIcon,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { EmptyState } from '../components/common/EmptyState';

export const OrdersPage: React.FC = () => {
  const { user, isLoading: authLoading, loginWithGoogle } = useAuth();
  const { settings } = useStore();
  const { wishlist } = useWishlist();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-neutral-200 rounded w-48 mb-6"></div>
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4 hidden lg:block h-72 bg-neutral-100 rounded-3xl"></div>
          <div className="lg:col-span-8 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 bg-neutral-100 rounded-3xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[65vh] flex items-center justify-center max-w-xl mx-auto px-4 text-center">
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

  const deliveredCount = orders.filter((o) => o.orderStatus === 'delivered').length;
  const inProgressCount = orders.filter((o) => ['pending', 'processing', 'shipped'].includes(o.orderStatus)).length;

  const filteredOrders = orders.filter((order) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return ['pending', 'processing', 'shipped'].includes(order.orderStatus);
    if (filterStatus === 'delivered') return order.orderStatus === 'delivered';
    if (filterStatus === 'cancelled') return order.orderStatus === 'cancelled';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-24 sm:pb-32">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* Top Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 sm:mb-6 border-b border-neutral-200/60">
          <div>
            <div className="flex items-center space-x-2 text-xs text-neutral-400 font-medium mb-1">
              <Link to="/" className="hover:text-neutral-800 transition-colors">Home</Link>
              <span>/</span>
              <Link to="/profile" className="hover:text-neutral-800 transition-colors">Account</Link>
              <span>/</span>
              <span className="text-neutral-800 font-bold">My Orders</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 font-display">
              Orders & Shipments
            </h1>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              to="/profile"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white border border-neutral-200/80 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-all shadow-xs"
            >
              <UserIcon className="w-3.5 h-3.5 text-neutral-600" />
              <span>My Profile</span>
            </Link>

            <Link
              to="/shop"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-honey hover:bg-honey-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Explore Shop</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10 items-start">
          
          {/* Left Column (4 cols): User summary, quick stats & navigation */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* Account Card */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex items-center space-x-3.5">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    className="w-13 h-13 rounded-full object-cover border-2 border-honey-200 shadow-xs"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-full bg-honey text-white flex items-center justify-center text-lg font-bold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm sm:text-base font-bold text-neutral-900 truncate font-display">
                    {user.displayName || 'KINORA Member'}
                  </h2>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Order Stats */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-100 text-center">
                <div className="p-2.5 rounded-2xl bg-neutral-50/80 border border-neutral-100">
                  <span className="block text-base font-bold text-neutral-900 font-mono">{orders.length}</span>
                  <span className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">Total</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-100">
                  <span className="block text-base font-bold text-amber-700 font-mono">{inProgressCount}</span>
                  <span className="text-[10px] text-amber-600 uppercase font-bold tracking-wider">Active</span>
                </div>
                <div className="p-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-100">
                  <span className="block text-base font-bold text-emerald-700 font-mono">{deliveredCount}</span>
                  <span className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">Delivered</span>
                </div>
              </div>

              {/* Quick Links */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-100 text-xs">
                <Link
                  to="/profile"
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-neutral-50 text-neutral-700 font-medium transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <UserIcon className="w-4 h-4 text-neutral-500" />
                    <span>Manage Addresses & Profile</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>

                <Link
                  to="/wishlist"
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-neutral-50 text-neutral-700 font-medium transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>My Wishlist ({wishlist.length})</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>

                <Link
                  to="/cart"
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-neutral-50 text-neutral-700 font-medium transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <ShoppingBag className="w-4 h-4 text-neutral-500" />
                    <span>My Bag ({totalItems})</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>
              </div>

              {/* Trust Badge */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-center space-x-2 text-[11px] text-neutral-400">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>100% Verified Order Guarantee</span>
              </div>
            </div>

          </div>

          {/* Right Column (8 cols): Orders List & Filters */}
          <div className="lg:col-span-8 mt-6 lg:mt-0 space-y-4">
            
            {/* Filter Tabs */}
            {orders.length > 0 && (
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { key: 'all', label: `All Orders (${orders.length})` },
                  { key: 'active', label: `Active (${inProgressCount})` },
                  { key: 'delivered', label: `Delivered (${deliveredCount})` },
                  { key: 'cancelled', label: `Cancelled (${orders.filter(o => o.orderStatus === 'cancelled').length})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFilterStatus(tab.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      filterStatus === tab.key
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {filteredOrders.length > 0 ? (
              <div className="space-y-3.5">
                {filteredOrders.map((order) => {
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
                      className="p-5 sm:p-6 rounded-3xl border border-neutral-100 hover:border-honey/40 bg-white transition-all cursor-pointer shadow-[0_4px_25px_rgba(0,0,0,0.02)] hover:shadow-md group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-neutral-100">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-neutral-900 font-mono">
                              #{order.orderNumber}
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
                          <p className="text-[11px] text-neutral-400 mt-1">
                            Ordered on {formatDate(order.createdAt)}
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-base sm:text-lg font-bold text-neutral-900 font-sans">
                            {formatCurrency(order.totalAmount, settings.currencySymbol)}
                          </p>
                          <p className="text-[11px] text-neutral-400">
                            {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}
                          </p>
                        </div>
                      </div>

                      {/* Items Preview */}
                      <div className="pt-3.5 flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 overflow-x-auto pr-2">
                          {order.items?.map((item, idx) => (
                            <div
                              key={idx}
                              className="w-13 h-13 bg-[#f5f5f5] rounded-2xl overflow-hidden shrink-0 p-1 flex items-center justify-center border border-neutral-100 group-hover:border-honey/30 transition-colors"
                            >
                              <img
                                src={item.image || '/LOGO.png'}
                                alt={item.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center space-x-1.5 text-xs font-bold text-honey shrink-0 ml-3 group-hover:translate-x-1 transition-transform">
                          <span>View Details</span>
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : orders.length > 0 ? (
              <div className="bg-white rounded-3xl border border-neutral-100 p-12 text-center space-y-3">
                <Package className="w-10 h-10 text-neutral-300 mx-auto" />
                <h3 className="text-sm font-bold text-neutral-800">No {filterStatus} orders found</h3>
                <p className="text-xs text-neutral-400">You don't have any orders matching this filter.</p>
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className="mt-2 px-4 py-2 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  View All Orders
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-neutral-100 p-10">
                <EmptyState
                  icon={ShoppingBag}
                  title="No Orders Yet"
                  description="You haven't made any purchases yet. Explore our latest trending collection."
                  actionText="Browse Products"
                  actionLink="/shop"
                />
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
