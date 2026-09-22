import React from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { ProductCard } from '../components/common/ProductCard';
import { EmptyState } from '../components/common/EmptyState';

export const WishlistPage: React.FC = () => {
  const { wishlist, clearWishlist } = useWishlist();

  return (
    <div className="min-h-screen bg-white pb-24">
      
      {/* Header */}
      <div className="border-b border-neutral-200 bg-neutral-50/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-black tracking-tight">
              My Wishlist
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-1">
              {wishlist.length} saved {wishlist.length === 1 ? 'piece' : 'pieces'}
            </p>
          </div>
          {wishlist.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs text-neutral-500 hover:text-black underline transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {wishlist.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlist.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Heart}
            title="Your Wishlist is Empty"
            description="Explore our collection and click the heart icon on any piece to save it here for later."
            actionText="Explore Collections"
            actionLink="/shop"
          />
        )}
      </div>

    </div>
  );
};
