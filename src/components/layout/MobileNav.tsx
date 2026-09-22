import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, User as UserIcon, Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';

export const MobileNav: React.FC = () => {
  const { totalItems } = useCart();
  const { wishlist } = useWishlist();

  return (
    <div className="fixed bottom-4 inset-x-4 max-w-sm mx-auto z-40 lg:hidden pointer-events-none safe-bottom">
      <nav className="pointer-events-auto bg-white/85 backdrop-blur-xl border border-white/60 shadow-[0_10px_35px_rgba(0,0,0,0.12)] rounded-full px-6 py-2.5 flex items-center justify-between">
        
        {/* Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-all ${
              isActive ? 'text-charcoal' : 'text-neutral-400 hover:text-neutral-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-charcoal mb-0.5" />}
              <Home className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[9px] font-semibold tracking-tight mt-0.5">Home</span>
            </>
          )}
        </NavLink>

        {/* Shop / Explore */}
        <NavLink
          to="/shop"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-all ${
              isActive ? 'text-charcoal' : 'text-neutral-400 hover:text-neutral-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-charcoal mb-0.5" />}
              <ShoppingBag className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[9px] font-semibold tracking-tight mt-0.5">Shop</span>
            </>
          )}
        </NavLink>

        {/* Wishlist */}
        <NavLink
          to="/wishlist"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center transition-all ${
              isActive ? 'text-charcoal' : 'text-neutral-400 hover:text-neutral-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-charcoal mb-0.5" />}
              <div className="relative">
                <Heart className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-3.5 h-3.5 px-0.5 text-[8px] font-bold bg-honey text-white rounded-full">
                    {wishlist.length}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-semibold tracking-tight mt-0.5">Wishlist</span>
            </>
          )}
        </NavLink>

        {/* Cart */}
        <NavLink
          to="/cart"
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center transition-all ${
              isActive ? 'text-charcoal' : 'text-neutral-400 hover:text-neutral-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-charcoal mb-0.5" />}
              <div className="relative">
                <ShoppingCart className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-2 flex items-center justify-center min-w-3.5 h-3.5 px-0.5 text-[8px] font-bold bg-honey text-white rounded-full">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-semibold tracking-tight mt-0.5">Cart</span>
            </>
          )}
        </NavLink>

        {/* Profile */}
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center transition-all ${
              isActive ? 'text-charcoal' : 'text-neutral-400 hover:text-neutral-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="w-1.5 h-1.5 rounded-full bg-charcoal mb-0.5" />}
              <UserIcon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span className="text-[9px] font-semibold tracking-tight mt-0.5">Profile</span>
            </>
          )}
        </NavLink>

      </nav>
    </div>
  );
};
