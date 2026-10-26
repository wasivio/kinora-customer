import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User as UserIcon, 
  Package, 
  Heart, 
  LogOut, 
  Plus, 
  Trash2, 
  ChevronRight,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { OrderAddress } from '../types';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { user, userProfile, logout, saveAddress, deleteAddress, loginWithGoogle } = useAuth();
  const { totalItems } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<OrderAddress>({
    name: user?.displayName || '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'India',
  });

  if (!user) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center max-w-md mx-auto px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-honey/10 text-honey flex items-center justify-center mb-4">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2 font-display">Sign in to ASLAM TAILOR</h2>
        <p className="text-xs text-neutral-500 mb-6">
          Access your profile, orders, and saved addresses.
        </p>
        <button
          type="button"
          onClick={loginWithGoogle}
          className="w-full py-3.5 px-6 rounded-full bg-honey hover:bg-honey-600 text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddress.name || !newAddress.phone || !newAddress.street || !newAddress.city || !newAddress.zip) {
      toast.error('Please fill in all address fields');
      return;
    }

    try {
      await saveAddress(newAddress);
      toast.success('Address saved successfully');
      setIsAddingAddress(false);
      setNewAddress({
        name: user.displayName || '',
        phone: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'India',
      });
    } catch {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (index: number) => {
    try {
      await deleteAddress(index);
      toast.success('Address removed');
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.info('Signed out from ASLAM TAILOR');
  };

  const addressesCount = userProfile?.addresses?.length || 0;

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-24 sm:pb-32">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* Top Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 sm:mb-6 border-b border-neutral-200/60">
          <div>
            <div className="flex items-center space-x-2 text-xs text-neutral-400 font-medium mb-1">
              <Link to="/" className="hover:text-neutral-800 transition-colors">Home</Link>
              <span>/</span>
              <span className="text-neutral-800 font-bold">Account Dashboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 font-display">
              My Profile & Settings
            </h1>
          </div>

          <div className="flex items-center space-x-2.5">
            <Link
              to="/shop"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-white border border-neutral-200/80 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-all shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-neutral-600" />
              <span>Browse Shop</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full border border-neutral-200/80 bg-white text-xs font-semibold text-neutral-700 hover:text-red-600 hover:border-red-200 transition-all shadow-xs active:scale-95"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10 items-start">
          
          {/* Left Column: Profile Card & Quick Navigation Menu (4 cols on desktop) */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* User Identity Card */}
            <div className="bg-white rounded-3xl p-6 border border-neutral-100 shadow-[0_4px_25px_rgba(0,0,0,0.03)] text-center sm:text-left space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Profile'}
                    className="w-16 h-16 rounded-full object-cover border-2 border-honey-200 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-honey text-white flex items-center justify-center text-xl font-bold shrink-0 shadow-sm">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900 font-display truncate">
                    {user.displayName || 'ASLAM TAILOR Member'}
                  </h2>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">
                    {user.email}
                  </p>
                  <div className="mt-2 inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-100">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified Customer</span>
                  </div>
                </div>
              </div>

              {/* Quick Counter Strip */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-neutral-100 text-center">
                <Link to="/orders" className="p-2 rounded-2xl hover:bg-neutral-50 transition-colors">
                  <span className="block text-sm font-bold text-neutral-900 font-mono">Orders</span>
                  <span className="text-[10px] text-neutral-400">History</span>
                </Link>
                <Link to="/wishlist" className="p-2 rounded-2xl hover:bg-neutral-50 transition-colors">
                  <span className="block text-sm font-bold text-neutral-900 font-mono">{wishlist.length}</span>
                  <span className="text-[10px] text-neutral-400">Wishlist</span>
                </Link>
                <Link to="/cart" className="p-2 rounded-2xl hover:bg-neutral-50 transition-colors">
                  <span className="block text-sm font-bold text-neutral-900 font-mono">{totalItems}</span>
                  <span className="text-[10px] text-neutral-400">In Cart</span>
                </Link>
              </div>

              {/* Navigation Menu */}
              <div className="space-y-1.5 pt-2 border-t border-neutral-100">
                <Link
                  to="/orders"
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-honey/10 text-honey flex items-center justify-center">
                      <Package className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">My Orders & Shipments</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400" />
                </Link>

                <Link
                  to="/wishlist"
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-honey/10 text-honey flex items-center justify-center">
                      <Heart className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">My Wishlist</span>
                  </div>
                  <span className="text-[11px] font-bold text-honey bg-honey/10 px-2 py-0.5 rounded-full">
                    {wishlist.length}
                  </span>
                </Link>

                <Link
                  to="/cart"
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-neutral-50 text-neutral-700 hover:text-neutral-900 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold">Shopping Bag</span>
                  </div>
                  <span className="text-[11px] font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded-full">
                    {totalItems}
                  </span>
                </Link>
              </div>

              {/* Security Footnote */}
              <div className="pt-3 border-t border-neutral-100 text-center">
                <p className="text-[11px] text-neutral-400 flex items-center justify-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google SSL Encrypted Login</span>
                </p>
              </div>
            </div>

          </div>

          {/* Right Column: Main Dashboard Content (8 cols on desktop) */}
          <div className="lg:col-span-8 mt-6 lg:mt-0 space-y-6">
            
            {/* Quick Overview Cards (3 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Link
                to="/orders"
                className="p-5 rounded-3xl border border-neutral-100 hover:border-honey/40 bg-white transition-all flex items-center justify-between shadow-xs hover:shadow-md group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-honey/10 text-honey flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">Transaction & Orders</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">Track shipments & order history</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-neutral-50 group-hover:bg-honey group-hover:text-white flex items-center justify-center text-neutral-400 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>

              <Link
                to="/wishlist"
                className="p-5 rounded-3xl border border-neutral-100 hover:border-honey/40 bg-white transition-all flex items-center justify-between shadow-xs hover:shadow-md group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-neutral-900">My Saved Wishlist</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-neutral-50 group-hover:bg-honey group-hover:text-white flex items-center justify-center text-neutral-400 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </div>

            {/* Delivery Addresses Management Card */}
            <div className="p-6 sm:p-7 rounded-3xl border border-neutral-100 bg-white shadow-[0_4px_25px_rgba(0,0,0,0.03)] space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                <div>
                  <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-neutral-900 font-display">
                    Delivery Addresses
                  </h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Saved addresses for seamless 1-click checkout
                  </p>
                </div>

                {!isAddingAddress && (
                  <button
                    type="button"
                    onClick={() => setIsAddingAddress(true)}
                    className="self-start sm:self-auto inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-honey hover:bg-honey-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Address</span>
                  </button>
                )}
              </div>

              {/* Add Address Form */}
              {isAddingAddress && (
                <form 
                  onSubmit={handleSaveAddress} 
                  className="p-5 rounded-2xl border border-neutral-200/80 bg-[#FAFAFC] space-y-4 animate-fade-in text-xs"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-neutral-900 text-sm">Add New Delivery Address</h3>
                    <span className="text-[11px] text-neutral-400">* Required fields</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={newAddress.name}
                        onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-honey focus:ring-1 focus:ring-honey transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="10-digit mobile number"
                        value={newAddress.phone}
                        onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-honey focus:ring-1 focus:ring-honey transition-all"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-neutral-700 mb-1">Street Address, Flat / House No *</label>
                      <input
                        type="text"
                        required
                        placeholder="House no., Building, Street, Area"
                        value={newAddress.street}
                        onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-honey focus:ring-1 focus:ring-honey transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">City / Town *</label>
                      <input
                        type="text"
                        required
                        placeholder="City"
                        value={newAddress.city}
                        onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-honey focus:ring-1 focus:ring-honey transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">State *</label>
                      <input
                        type="text"
                        required
                        placeholder="State"
                        value={newAddress.state}
                        onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-honey focus:ring-1 focus:ring-honey transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Pincode *</label>
                      <input
                        type="text"
                        required
                        placeholder="6-digit pincode"
                        value={newAddress.zip}
                        onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-honey focus:ring-1 focus:ring-honey transition-all"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-neutral-700 mb-1">Country</label>
                      <input
                        type="text"
                        disabled
                        value="India"
                        className="w-full bg-neutral-100 border border-neutral-200 rounded-xl p-2.5 text-xs text-neutral-500 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2.5 pt-3 border-t border-neutral-200">
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(false)}
                      className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-full bg-honey hover:bg-honey-600 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                    >
                      Save Address
                    </button>
                  </div>
                </form>
              )}

              {/* Saved Address Cards */}
              {userProfile?.addresses && userProfile.addresses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {userProfile.addresses.map((addr, index) => (
                    <div
                      key={index}
                      className="p-4 sm:p-5 rounded-2xl border border-neutral-200/80 bg-[#F5F7FA] hover:bg-white hover:border-honey/40 transition-all flex flex-col justify-between group shadow-2xs"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200/60">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Address #{index + 1}
                          </span>
                          {index === 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wide">
                              Default
                            </span>
                          )}
                        </div>

                        <div className="text-xs space-y-1">
                          <p className="font-bold text-neutral-900 text-sm">{addr.name}</p>
                          <p className="text-neutral-600 leading-relaxed flex items-start space-x-1.5 pt-1">
                            <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                            <span>{addr.street}, {addr.city}, {addr.state} - {addr.zip}</span>
                          </p>
                          <p className="text-neutral-600 flex items-center space-x-1.5 pt-1">
                            <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span>{addr.phone}</span>
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-neutral-200/60 flex items-center justify-between">
                        <span className="text-[10px] text-neutral-400">Delivery destination</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(index)}
                          className="text-neutral-400 hover:text-red-600 text-xs inline-flex items-center space-x-1 transition-colors p-1"
                          title="Remove address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !isAddingAddress && (
                  <div className="text-center py-10 bg-[#FAFAFC] rounded-2xl border border-neutral-100 p-6 space-y-2">
                    <MapPin className="w-8 h-8 text-neutral-300 mx-auto" />
                    <p className="text-xs font-semibold text-neutral-700">No saved addresses yet</p>
                    <p className="text-[11px] text-neutral-400">Add an address now for faster checkout on your next order.</p>
                    <button
                      type="button"
                      onClick={() => setIsAddingAddress(true)}
                      className="mt-2 px-4 py-2 rounded-full bg-honey hover:bg-honey-600 text-white text-xs font-bold transition-all"
                    >
                      Add Address Now
                    </button>
                  </div>
                )
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
