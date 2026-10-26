import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  ShoppingBag, 
  User as UserIcon, 
  LogOut, 
  Package,
  ArrowLeft,
  Heart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { SearchModal } from '../common/SearchModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState<boolean>(false);

  const isHome = location.pathname === '/';

  return (
    <>
      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* ======================================================== */}
          {/* 1. DESKTOP UNIFIED NAVBAR (lg:flex, hidden on mobile)     */}
          {/* ======================================================== */}
          <div className="hidden lg:flex items-center justify-between h-20 gap-6">
            
            {/* Left: Brand Logo & Navigation Links */}
            <div className="flex items-center space-x-8 shrink-0">
              <Link to="/" className="inline-block">
                <img
                  src="/LOGO.png"
                  alt="KINORA"
                  className="h-10 w-auto object-contain"
                />
              </Link>

              <nav className="flex items-center space-x-6 text-sm font-semibold">
                <Link 
                  to="/" 
                  className={`transition-colors ${isHome ? 'text-honey' : 'text-neutral-700 hover:text-neutral-950'}`}
                >
                  Home
                </Link>
                <Link 
                  to="/shop" 
                  className={`transition-colors ${location.pathname === '/shop' ? 'text-honey' : 'text-neutral-700 hover:text-neutral-950'}`}
                >
                  Shop
                </Link>
                <Link 
                  to="/orders" 
                  className={`transition-colors ${location.pathname === '/orders' ? 'text-honey' : 'text-neutral-700 hover:text-neutral-950'}`}
                >
                  Orders
                </Link>
              </nav>
            </div>

            {/* Center: Search Bar with Filter button */}
            <div className="flex-1 max-w-md xl:max-w-xl mx-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="flex-1 flex items-center bg-[#F5F7FA] hover:bg-neutral-100 border border-neutral-200/80 rounded-full px-4 py-2.5 text-xs text-neutral-400 transition-all text-left group shadow-xs"
                >
                  <Search className="w-4 h-4 text-neutral-400 mr-2.5 shrink-0 group-hover:text-neutral-700" />
                  <span className="text-neutral-500 font-normal">Search for t-shirts, oversized fits, hoodies...</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-charcoal hover:bg-neutral-800 text-white text-xs font-semibold shrink-0 transition-all shadow-sm active:scale-95"
                  title="Filter & Browse Shop"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>
              </div>
            </div>

            {/* Right: Wishlist, Profile Menu & Cart */}
            <div className="flex items-center space-x-3 shrink-0">
              
              {/* Wishlist Link with Badge */}
              <Link
                to="/profile"
                className="relative p-2.5 rounded-full hover:bg-neutral-100 text-neutral-700 hover:text-neutral-950 transition-colors"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold bg-honey text-white rounded-full">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              {/* Cart Button with Count Badge */}
              <Link
                to="/cart"
                className="relative flex items-center space-x-2 px-3.5 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-all active:scale-95 shadow-xs"
                title="Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="text-xs font-bold font-sans">
                  Cart
                </span>
                {totalItems > 0 && (
                  <span className="flex items-center justify-center min-w-4 h-4 px-1.5 text-[10px] font-bold bg-charcoal text-white rounded-full">
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* User Profile Menu */}
              {user ? (
                <div 
                  className="relative"
                  onMouseEnter={() => setIsProfileMenuOpen(true)}
                  onMouseLeave={() => setIsProfileMenuOpen(false)}
                >
                  <button 
                    onClick={() => navigate('/profile')}
                    className="flex items-center space-x-2 p-1 pr-3 rounded-full border border-neutral-200/80 hover:bg-neutral-50 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full border-2 border-honey-200 overflow-hidden bg-honey-50 flex items-center justify-center shrink-0">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Profile'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-honey-700">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-neutral-800 max-w-[90px] truncate">
                      {user.displayName?.split(' ')[0] || 'Account'}
                    </span>
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-neutral-100 shadow-xl rounded-2xl py-2 z-50 animate-fade-in text-xs">
                      <div className="px-4 py-2 border-b border-neutral-100">
                        <p className="font-semibold text-neutral-900 truncate">
                          {user.displayName || 'KINORA Customer'}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center space-x-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-honey transition-colors"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/orders"
                        className="flex items-center space-x-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-honey transition-colors"
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>My Orders</span>
                      </Link>
                      <button
                        onClick={logout}
                        className="w-full text-left flex items-center space-x-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-honey border-t border-neutral-100 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full bg-honey hover:bg-honey-600 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
                >
                  Sign In
                </Link>
              )}

            </div>
          </div>

          {/* ======================================================== */}
          {/* 2. MOBILE TOP BAR & SEARCH ROW (lg:hidden)               */}
          {/* ======================================================== */}
          <div className="lg:hidden">
            {/* Top Bar Row (Avatar, Brand Name, Cart Bag Icon) */}
            <div className="flex items-center justify-between h-16">
              
              {/* Left: User Avatar or Back Button */}
              <div className="flex items-center space-x-3">
                {!isHome ? (
                  <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-800 transition-all active:scale-95"
                    title="Go Back"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                ) : user ? (
                  <div 
                    className="relative"
                    onMouseEnter={() => setIsProfileMenuOpen(true)}
                    onMouseLeave={() => setIsProfileMenuOpen(false)}
                  >
                    <button 
                      onClick={() => navigate('/profile')}
                      className="w-10 h-10 rounded-full border-2 border-honey-200 overflow-hidden p-0.5 bg-honey-50 flex items-center justify-center transition-transform active:scale-95"
                    >
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Profile'}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-honey-700">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                        </span>
                      )}
                    </button>

                    {isProfileMenuOpen && (
                      <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-neutral-100 shadow-xl rounded-2xl py-2 z-50 animate-fade-in text-xs">
                        <div className="px-4 py-2 border-b border-neutral-100">
                          <p className="font-semibold text-neutral-900 truncate">
                            {user.displayName || 'KINORA Customer'}
                          </p>
                          <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="flex items-center space-x-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-honey transition-colors"
                        >
                          <UserIcon className="w-3.5 h-3.5" />
                          <span>Profile</span>
                        </Link>
                        <Link
                          to="/orders"
                          className="flex items-center space-x-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-honey transition-colors"
                        >
                          <Package className="w-3.5 h-3.5" />
                          <span>My Orders</span>
                        </Link>
                        <button
                          onClick={logout}
                          className="w-full text-left flex items-center space-x-2 px-4 py-2 text-neutral-700 hover:bg-neutral-50 hover:text-honey border-t border-neutral-100 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/login"
                    className="w-10 h-10 rounded-full bg-honey-50 text-honey flex items-center justify-center hover:bg-honey-100 transition-colors"
                    title="Sign In"
                  >
                    <UserIcon className="w-5 h-5" />
                  </Link>
                )}
              </div>

              {/* Center: Official KINORA Brand */}
              <div className="flex items-center justify-center">
                <Link to="/" className="inline-block">
                  <img
                    src="/LOGO.png"
                    alt="KINORA"
                    className="h-8 w-auto object-contain"
                  />
                </Link>
              </div>

              {/* Right: Cart Bag Icon with Dark Badge */}
              <div className="flex items-center space-x-3">
                <Link
                  to="/cart"
                  className="relative w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-800 transition-all active:scale-95"
                  title="Cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 text-[9px] font-bold bg-charcoal text-white rounded-full">
                      {totalItems}
                    </span>
                  )}
                </Link>
              </div>

            </div>

            {/* Mobile Search Bar Row */}
            <div className="pb-3 pt-1">
              <div className="flex items-center space-x-2.5">
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="flex-1 flex items-center bg-[#F5F7FA] hover:bg-neutral-100 border border-neutral-200/60 rounded-full px-4 py-2.5 text-xs text-neutral-400 transition-all text-left group"
                >
                  <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0 group-hover:text-neutral-700" />
                  <span className="text-neutral-500 font-normal">Search here</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="flex items-center space-x-1.5 px-4 py-2.5 rounded-full bg-charcoal hover:bg-neutral-800 text-white text-xs font-semibold shrink-0 transition-all shadow-sm active:scale-95"
                  title="Filter"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
