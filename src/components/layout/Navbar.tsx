import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  SlidersHorizontal, 
  ShoppingBag, 
  User as UserIcon, 
  LogOut, 
  Package,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { SearchModal } from '../common/SearchModal';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
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
          
          {/* Top Bar Row (Avatar, Brand Name, Cart Bag Icon) */}
          <div className="flex items-center justify-between h-16 sm:h-20">
            
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
                  className="h-8 sm:h-10 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Right: Cart Bag Icon with Dark Badge matching reference Screen 1 */}
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

          {/* Search Bar & Charcoal Filter Button Row (Screen 1) */}
          <div className="pb-3 pt-1">
            <div className="flex items-center space-x-2.5 max-w-xl mx-auto">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="flex-1 flex items-center bg-[#F5F7FA] hover:bg-neutral-100 border border-neutral-200/60 rounded-full px-4 py-2.5 text-xs text-neutral-400 transition-all text-left group"
              >
                <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0 group-hover:text-neutral-700" />
                <span className="text-neutral-500 font-normal">Search here</span>
              </button>

              <button
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
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
};
