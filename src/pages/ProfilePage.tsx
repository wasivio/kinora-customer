import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User as UserIcon, 
  Package, 
  Heart, 
  LogOut, 
  Plus, 
  Trash2, 
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { OrderAddress } from '../types';
import { toast } from 'sonner';

export const ProfilePage: React.FC = () => {
  const { user, userProfile, logout, saveAddress, deleteAddress, loginWithGoogle } = useAuth();
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center max-w-md mx-auto px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-honey/10 text-honey flex items-center justify-center mb-4">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2 font-display">Sign in to KINORA</h2>
        <p className="text-xs text-neutral-500 mb-6">
          Access your profile, orders, and saved addresses.
        </p>
        <button
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
      toast.success('Address saved');
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
    toast.info('Signed out from KINORA');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-32">
      
      {/* Header */}
      <div className="bg-white border-b border-neutral-100 py-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center space-x-4">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Profile'}
                className="w-14 h-14 rounded-full object-cover border-2 border-honey-200"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-honey text-white flex items-center justify-center text-lg font-bold">
                {user.displayName?.charAt(0) || 'U'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-neutral-900 tracking-tight font-display">
                {user.displayName || 'KINORA Member'}
              </h1>
              <p className="text-xs text-neutral-400">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/orders"
            className="p-5 rounded-3xl border border-neutral-100 hover:border-honey/40 bg-white transition-all flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-honey/10 text-honey flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-900">Transaction & Orders</h3>
                <p className="text-[11px] text-neutral-400">Track shipments & history</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </Link>

          <Link
            to="/wishlist"
            className="p-5 rounded-3xl border border-neutral-100 hover:border-honey/40 bg-white transition-all flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-honey/10 text-honey flex items-center justify-center">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-900">Wishlist</h3>
                <p className="text-[11px] text-neutral-400">View saved products</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </Link>
        </div>

        {/* Addresses */}
        <div className="p-6 rounded-3xl border border-neutral-100 bg-white shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900">
                Delivery Addresses
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Saved addresses for fast checkout
              </p>
            </div>

            {!isAddingAddress && (
              <button
                onClick={() => setIsAddingAddress(true)}
                className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-full bg-honey hover:bg-honey-600 text-white text-xs font-semibold transition-colors active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            )}
          </div>

          {isAddingAddress && (
            <form onSubmit={handleSaveAddress} className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3 animate-fade-in text-xs">
              <h3 className="font-bold text-neutral-800">New Address</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-medium text-neutral-600 mb-1">Name *</label>
                  <input
                    type="text"
                    required
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-xl p-2 focus:outline-none focus:border-honey"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-600 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={newAddress.phone}
                    onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-xl p-2 focus:outline-none focus:border-honey"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-medium text-neutral-600 mb-1">Street *</label>
                  <input
                    type="text"
                    required
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-xl p-2 focus:outline-none focus:border-honey"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-600 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-xl p-2 focus:outline-none focus:border-honey"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-600 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-xl p-2 focus:outline-none focus:border-honey"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-600 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={newAddress.zip}
                    onChange={(e) => setNewAddress({ ...newAddress, zip: e.target.value })}
                    className="w-full bg-white border border-neutral-200 rounded-xl p-2 focus:outline-none focus:border-honey"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAddress(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-neutral-300 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-honey text-white text-xs font-semibold hover:bg-honey-600"
                >
                  Save
                </button>
              </div>
            </form>
          )}

          {userProfile?.addresses && userProfile.addresses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userProfile.addresses.map((addr, index) => (
                <div
                  key={index}
                  className="p-4 rounded-2xl border border-neutral-100 bg-[#F5F7FA] flex flex-col justify-between"
                >
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-neutral-900">{addr.name}</p>
                    <p className="text-neutral-500">{addr.street}</p>
                    <p className="text-neutral-500">{addr.city}, {addr.state} - {addr.zip}</p>
                    <p className="text-neutral-400 pt-1">Phone: {addr.phone}</p>
                  </div>

                  <div className="pt-3 mt-2 border-t border-neutral-200/50 flex justify-end">
                    <button
                      onClick={() => handleDeleteAddress(index)}
                      className="text-neutral-400 hover:text-honey text-xs inline-flex items-center space-x-1"
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
              <p className="text-xs text-neutral-400 italic">No saved addresses.</p>
            )
          )}
        </div>

        {/* Logout */}
        <div className="pt-2 flex justify-between items-center">
          <span className="text-xs text-neutral-400">Signed in via Google</span>
          <button
            onClick={handleLogout}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-700 hover:text-honey hover:border-honey transition-colors active:scale-95"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>

    </div>
  );
};
