import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Product } from '../../types';
import { formatCurrency, calculateDiscountedPrice } from '../../lib/utils';
import { useWishlist } from '../../context/WishlistContext';
import { useStore } from '../../context/StoreContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { settings } = useStore();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const isWished = isInWishlist(product.id);
  const { finalPrice, originalPrice, hasDiscount } = calculateDiscountedPrice(
    product.price,
    product.discount
  );

  const primaryImage = product.images?.[0]?.url || '';
  const isOutOfStock = product.stock <= 0 || product.status === 'out_of_stock';

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    if (isWished) {
      toast.info('Removed from wishlist');
    } else {
      toast.success('Saved to wishlist');
    }
  };

  return (
    <div className="group relative flex flex-col bg-white rounded-3xl p-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-neutral-100 hover:shadow-md transition-all duration-300">
      
      {/* Product Image Container */}
      <Link to={`/product/${product.id}`} className="relative block aspect-square w-full rounded-2xl overflow-hidden bg-[#f5f5f5] p-4 mb-3">
        {/* Admin Badges: Out of Stock or Discount */}
        {isOutOfStock ? (
          <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full bg-neutral-900/80 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
            Out of Stock
          </span>
        ) : hasDiscount ? (
          <span className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded-full bg-honey text-white text-[10px] font-bold tracking-tight shadow-sm">
            -{product.discount}%
          </span>
        ) : null}

        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105 drop-shadow-sm"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-neutral-400 text-xs font-mono">
            <span className="font-display font-bold text-sm tracking-widest text-honey-600">KINORA</span>
          </div>
        )}

        {/* Floating Circular Wishlist Button at Top-Right */}
        <button
          onClick={handleWishlistToggle}
          className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
          title={isWished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart 
            className={`w-4 h-4 transition-colors ${
              isWished 
                ? 'fill-honey text-honey stroke-honey' 
                : 'text-neutral-500 stroke-[1.8]'
            }`} 
          />
        </button>
      </Link>

      {/* Product Details - Name & Category on Left, Price & Discount on Right */}
      <div className="flex items-start justify-between gap-2 px-1 pb-1">
        <div className="min-w-0 flex-1">
          <Link to={`/product/${product.id}`}>
            <h3 className="text-xs sm:text-sm font-semibold text-neutral-800 line-clamp-1 hover:text-honey transition-colors">
              {product.name}
            </h3>
          </Link>
          {product.category && (
            <p className="text-[11px] text-neutral-400 capitalize mt-0.5 truncate">
              {product.category}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <span className="text-[10px] text-neutral-400 block font-normal leading-none">
            Price
          </span>
          <span className="text-xs sm:text-sm font-bold text-neutral-900 font-sans mt-0.5 block">
            {formatCurrency(finalPrice, settings.currencySymbol)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-neutral-400 line-through block font-sans">
              {formatCurrency(originalPrice, settings.currencySymbol)}
            </span>
          )}
        </div>
      </div>

    </div>
  );
};
