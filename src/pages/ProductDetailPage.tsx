import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Maximize2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { calculateDiscountedPrice, formatCurrency } from '../lib/utils';
import { ImageZoomModal } from '../components/common/ImageZoomModal';
import { ProductCard } from '../components/common/ProductCard';
import { toast } from 'sonner';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getProductById, products, settings, isLoading } = useStore();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const product = useMemo(() => {
    if (!id) return undefined;
    return getProductById(id);
  }, [id, getProductById]);

  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);

  // Initialize selected variants from admin's actual product variants
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const initial: Record<string, string> = {};
      product.variants.forEach((v) => {
        if (v.options && v.options.length > 0) {
          initial[v.name] = v.options[0];
        }
      });
      setSelectedVariants(initial);
    } else {
      setSelectedVariants({});
    }
    setSelectedImageIndex(0);
    setQuantity(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 animate-pulse space-y-4">
        <div className="aspect-[4/3] bg-[#f5f5f5] rounded-3xl"></div>
        <div className="h-6 bg-neutral-200 rounded w-3/4"></div>
        <div className="h-5 bg-neutral-100 rounded w-1/4"></div>
        <div className="h-20 bg-neutral-100 rounded"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
        <h2 className="text-2xl font-bold font-display text-neutral-900 mb-3">Product Not Found</h2>
        <p className="text-neutral-500 text-sm mb-6">
          The item you are looking for might have been removed or is unavailable.
        </p>
        <Link
          to="/shop"
          className="px-6 py-3 rounded-full bg-honey text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:bg-honey-600"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  const { finalPrice, originalPrice, hasDiscount } = calculateDiscountedPrice(
    product.price,
    product.discount
  );

  const images = product.images && product.images.length > 0
    ? product.images.map((img) => img.url)
    : [];

  const isWished = isInWishlist(product.id);
  const isOutOfStock = product.stock <= 0 || product.status === 'out_of_stock';
  const hasVariants = Boolean(
    product.variants && 
    product.variants.length > 0 && 
    product.variants.some((v) => v.options && v.options.length > 0)
  );

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const success = addToCart(product, quantity, selectedVariants);
    if (success) {
      toast.success(`${product.name} added to cart!`);
    } else {
      toast.error('Item could not be added');
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    const success = addToCart(product, quantity, selectedVariants);
    if (success) {
      navigate('/checkout');
    }
  };

  const relatedProducts = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-32">
      
      <div className="max-w-xl mx-auto">
        
        {/* Top Floating Bar: Back Button, Title "Details", Wishlist Heart (Screen 2) */}
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-neutral-100 flex items-center justify-center text-neutral-800 hover:bg-neutral-50 active:scale-95 transition-all"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <h2 className="text-base font-bold text-neutral-900 font-display">
            Details
          </h2>

          <button
            onClick={() => {
              toggleWishlist(product);
              if (isWished) {
                toast.info('Removed from wishlist');
              } else {
                toast.success('Saved to wishlist');
              }
            }}
            className="w-10 h-10 rounded-full bg-white shadow-sm border border-neutral-100 flex items-center justify-center hover:bg-neutral-50 active:scale-95 transition-all"
            title={isWished ? "In Wishlist" : "Add to Wishlist"}
          >
            <Heart 
              className={`w-5 h-5 ${
                isWished ? 'fill-honey text-honey stroke-honey' : 'text-neutral-500 stroke-[1.8]'
              }`} 
            />
          </button>
        </div>

        {/* Hero Showcase with #f5f5f5 Background and Stacked Thumbnails (Screen 2) */}
        <div className="relative mx-4 mt-2 h-[300px] sm:h-[380px] rounded-3xl bg-[#f5f5f5] overflow-hidden p-6 flex items-center justify-center">
          
          {/* Admin Badges on Showcase: Discount or Out of Stock */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5 items-start">
            {isOutOfStock ? (
              <span className="px-3 py-1 rounded-full bg-charcoal text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm shadow-sm">
                Out of Stock
              </span>
            ) : hasDiscount ? (
              <span className="px-3 py-1 rounded-full bg-honey text-white text-xs font-bold tracking-tight shadow-sm">
                -{product.discount}% OFF
              </span>
            ) : null}
          </div>

          {images.length > 0 ? (
            <img
              src={images[selectedImageIndex]}
              alt={product.name}
              className="max-h-full max-w-[80%] object-contain drop-shadow-md cursor-zoom-in transition-transform duration-300 hover:scale-105"
              onClick={() => setIsZoomModalOpen(true)}
            />
          ) : (
            <div className="text-honey-900 font-bold text-lg font-display tracking-wider">
              KINORA
            </div>
          )}

          {/* Zoom Trigger (only if image exists) */}
          {images.length > 0 && (
            <button
              onClick={() => setIsZoomModalOpen(true)}
              className="absolute bottom-3 left-3 p-2 rounded-full bg-white/80 hover:bg-white text-neutral-700 shadow-sm transition-colors"
              title="Zoom image"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}

          {/* Stacked Vertical Thumbnails on the Right (ONLY if admin uploaded multiple images) */}
          {images.length > 1 && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex flex-col space-y-2 z-10 max-h-[85%] overflow-y-auto scrollbar-none py-1">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-12 h-12 rounded-xl overflow-hidden border-2 bg-white/40 backdrop-blur-sm p-1 transition-all shrink-0 ${
                    selectedImageIndex === idx
                      ? 'border-white scale-105 shadow-md'
                      : 'border-white/50 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details White Container (Screen 2) */}
        <div className="bg-white rounded-3xl p-6 mx-4 mt-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-neutral-100 space-y-5">
          
          {/* Admin Metadata: Category, Subcategory & SKU */}
          {(product.category || product.subcategory || product.SKU) && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-1.5 flex-wrap">
                {product.category && (
                  <span className="px-2.5 py-0.5 rounded-full bg-[#F5F7FA] text-neutral-700 font-semibold">
                    {product.category}
                  </span>
                )}
                {product.subcategory && (
                  <span className="text-neutral-400 font-medium">
                    / {product.subcategory}
                  </span>
                )}
              </div>

              {product.SKU && (
                <span className="font-mono text-[11px] text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-100">
                  SKU: {product.SKU}
                </span>
              )}
            </div>
          )}

          {/* Title & Quantity Stepper Row */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 font-display leading-tight">
              {product.name}
            </h1>

            {/* Stepper matching Screen 2 [ - 01 + ] (Only if in stock) */}
            {!isOutOfStock && product.stock > 0 && (
              <div className="flex items-center space-x-2 bg-[#FDEBD2] text-neutral-800 rounded-full px-2.5 py-1 shrink-0 mt-0.5">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/60 active:scale-95 disabled:opacity-30"
                  title="Decrease quantity"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-bold w-5 text-center font-mono">
                  {quantity < 10 ? `0${quantity}` : quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.min(product.stock, prev + 1))}
                  disabled={quantity >= product.stock}
                  className="w-5 h-5 rounded-full bg-honey text-white flex items-center justify-center hover:bg-honey-600 active:scale-95 disabled:opacity-30 shadow-sm"
                  title="Increase quantity"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Price & Stock Status Row */}
          <div className="flex items-center justify-between pt-1 border-b border-neutral-100 pb-4">
            <div className="flex items-baseline space-x-2">
              <span className="text-xs text-neutral-400 font-normal">Price: </span>
              <span className="text-xl sm:text-2xl font-bold text-neutral-900 font-sans">
                {formatCurrency(finalPrice, settings.currencySymbol)}
              </span>
              {hasDiscount && (
                <span className="text-xs sm:text-sm text-neutral-400 line-through font-sans">
                  {formatCurrency(originalPrice, settings.currencySymbol)}
                </span>
              )}
            </div>

            {/* Live Stock Status from Admin */}
            <div>
              {isOutOfStock ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-red-50 text-red-600 text-xs font-semibold border border-red-100">
                  <AlertCircle className="w-3 h-3" />
                  <span>Out of Stock</span>
                </span>
              ) : product.stock <= 5 ? (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                  <span>Only {product.stock} left!</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>In Stock</span>
                </span>
              )}
            </div>
          </div>

          {/* Dynamic Variants configured by Admin (ONLY rendered if admin entered variants) */}
          {hasVariants && (
            <div className="space-y-4 pt-1">
              {product.variants!.map((variant, vIdx) => {
                if (!variant.options || variant.options.length === 0) return null;
                const isColorVariant = /colou?r/i.test(variant.name);
                const currentSelection = selectedVariants[variant.name] || variant.options[0];

                return (
                  <div key={variant.id || vIdx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-neutral-800">
                        {variant.name}
                        <span className="font-normal text-neutral-500 ml-1.5">
                          ({currentSelection})
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {variant.options.map((option) => {
                        const isSelected = currentSelection === option;
                        const isHex = /^#([0-9A-F]{3}){1,2}$/i.test(option.trim());

                        if (isColorVariant && isHex) {
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                setSelectedVariants((prev) => ({
                                  ...prev,
                                  [variant.name]: option,
                                }))
                              }
                              style={{ backgroundColor: option }}
                              className={`w-7 h-7 rounded-full border-2 transition-all ${
                                isSelected
                                  ? 'border-neutral-900 scale-110 shadow-sm'
                                  : 'border-white hover:scale-105'
                              }`}
                              title={option}
                            />
                          );
                        }

                        return (
                          <button
                            key={option}
                            type="button"
                            onClick={() =>
                              setSelectedVariants((prev) => ({
                                ...prev,
                                [variant.name]: option,
                              }))
                            }
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ${
                              isSelected
                                ? 'bg-honey text-white shadow-sm'
                                : 'bg-pill-gray text-neutral-700 hover:bg-neutral-200/70'
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Description (ONLY rendered if admin entered description) */}
          {product.description && product.description.trim() && (
            <div className="pt-2 border-t border-neutral-100">
              <span className="block text-xs font-bold text-neutral-800 mb-1.5">
                Description
              </span>
              <p className="text-xs text-neutral-600 leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
          )}

          {/* Additional Admin Specifications / Details (if provided by admin) */}
          {(product.brand || product.material || (product.tags && product.tags.length > 0) || product.specifications || (product.deliveryCharge && Number(product.deliveryCharge) > 0) || (product.shippingFee && Number(product.shippingFee) > 0)) && (
            <div className="pt-3 border-t border-neutral-100">
              <span className="block text-xs font-bold text-neutral-800 mb-2">
                Specifications
              </span>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {product.brand && (
                  <>
                    <dt className="text-neutral-400 font-normal">Brand</dt>
                    <dd className="text-neutral-800 font-medium">{product.brand}</dd>
                  </>
                )}
                {product.material && (
                  <>
                    <dt className="text-neutral-400 font-normal">Material</dt>
                    <dd className="text-neutral-800 font-medium">{product.material}</dd>
                  </>
                )}
                {((product.deliveryCharge !== undefined && Number(product.deliveryCharge) > 0) || (product.shippingFee !== undefined && Number(product.shippingFee) > 0)) && (
                  <>
                    <dt className="text-neutral-400 font-normal">Delivery Charge</dt>
                    <dd className="text-neutral-800 font-medium">{formatCurrency(Number(product.deliveryCharge || product.shippingFee), settings.currencySymbol)}</dd>
                  </>
                )}
                {product.specifications && typeof product.specifications === 'object' && (
                  Array.isArray(product.specifications)
                    ? product.specifications.map((spec: any, i: number) => (
                        <React.Fragment key={i}>
                          <dt className="text-neutral-400 font-normal capitalize">{spec.key || spec.name}</dt>
                          <dd className="text-neutral-800 font-medium">{spec.value}</dd>
                        </React.Fragment>
                      ))
                    : Object.entries(product.specifications).map(([k, v]) => (
                        <React.Fragment key={k}>
                          <dt className="text-neutral-400 font-normal capitalize">{k}</dt>
                          <dd className="text-neutral-800 font-medium">{String(v)}</dd>
                        </React.Fragment>
                      ))
                )}
              </dl>

              {product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-neutral-50">
                  {product.tags.map((tag: string, i: number) => (
                    <span key={i} className="px-2.5 py-0.5 rounded-md bg-[#F5F7FA] text-[11px] text-neutral-500">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Dual Action Buttons matching Screen 2 (Add to Cart & Buy Now) */}
          <div className="flex items-center space-x-3 pt-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex-1 py-3.5 rounded-full bg-pill-gray hover:bg-neutral-200 text-neutral-800 font-bold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="flex-1 py-3.5 rounded-full bg-honey hover:bg-honey-600 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isOutOfStock ? 'Unavailable' : 'Buy Now'}
            </button>
          </div>

        </div>

        {/* Related Products in same Category */}
        {relatedProducts.length > 0 && (
          <div className="mx-4 mt-8">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">
              Similar Styles
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>

      <ImageZoomModal
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        images={images}
        initialIndex={selectedImageIndex}
      />

    </div>
  );
};

