import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  ArrowLeft, 
  Plus, 
  Minus, 
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Share2,
  MessageCircle,
  Sparkles,
  Banknote,
  CreditCard,
  Ruler,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { calculateDiscountedPrice, formatCurrency } from '../lib/utils';
import { ImageZoomModal } from '../components/common/ImageZoomModal';
import { ShareModal } from '../components/common/ShareModal';
import { TryOnModal } from '../components/common/TryOnModal';
import { SizeChartModal } from '../components/common/SizeChartModal';
import { getProductWhatsAppShareUrl } from '../lib/share';
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
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isTryOnModalOpen, setIsTryOnModalOpen] = useState<boolean>(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState<boolean>(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState<boolean>(false);

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
    setIsDescriptionExpanded(false);
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
  const isCodAllowed = product.allowCOD ?? product.paymentSettings?.allowCOD ?? true;
  const isUpiAllowed = product.allowUPI ?? product.paymentSettings?.allowUPI ?? true;
  const codFee = Number(product.codCharge ?? product.paymentSettings?.codCharge ?? 0);
  const hasVariants = Boolean(
    product.variants && 
    product.variants.length > 0 && 
    product.variants.some((v) => v.options && v.options.length > 0)
  );

  const sizeChartUrl = (() => {
    if (!product) return null;
    const p = product as any;
    if (p.sizeChart && typeof p.sizeChart === 'object' && p.sizeChart.url && typeof p.sizeChart.url === 'string') {
      return p.sizeChart.url.trim();
    }
    if (typeof p.sizeChart === 'string' && p.sizeChart.trim()) {
      return p.sizeChart.trim();
    }
    if (typeof p.sizeChartUrl === 'string' && p.sizeChartUrl.trim()) {
      return p.sizeChartUrl.trim();
    }
    return null;
  })();

  const hasSizeVariant = Boolean(
    product.variants && 
    product.variants.some((v) => /size/i.test(v.name))
  );

  const isLongDescription = Boolean(
    product.description && 
    (product.description.trim().length > 140 || product.description.split('\n').length > 3)
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
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-24 sm:pb-32">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Top Floating Bar */}
        <div className="lg:hidden pt-4 pb-2 flex items-center justify-between">
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

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="w-10 h-10 rounded-full bg-white shadow-sm border border-neutral-100 flex items-center justify-center text-neutral-700 hover:bg-neutral-50 active:scale-95 transition-all"
              title="Share Product"
            >
              <Share2 className="w-4 h-4 text-neutral-600 stroke-[2]" />
            </button>

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
        </div>

        {/* Desktop Breadcrumb & Navigation Bar */}
        <div className="hidden lg:flex items-center justify-between py-4 mb-2 border-b border-neutral-200/60">
          <div className="flex items-center space-x-3 text-xs">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-200/80 text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 font-semibold transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <nav className="flex items-center space-x-2 text-neutral-400 font-medium">
              <Link to="/" className="hover:text-neutral-800 transition-colors">Home</Link>
              <span>/</span>
              <Link to="/shop" className="hover:text-neutral-800 transition-colors">Shop</Link>
              {product.category && (
                <>
                  <span>/</span>
                  <Link to={`/category/${encodeURIComponent(product.category)}`} className="hover:text-neutral-800 transition-colors capitalize">
                    {product.category}
                  </Link>
                </>
              )}
              <span>/</span>
              <span className="text-neutral-900 font-bold truncate max-w-sm">
                {product.name}
              </span>
            </nav>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 text-neutral-700 hover:bg-neutral-50 font-semibold text-xs transition-all shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-neutral-600" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={() => {
                toggleWishlist(product);
                if (isWished) {
                  toast.info('Removed from wishlist');
                } else {
                  toast.success('Saved to wishlist');
                }
              }}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white border border-neutral-200/80 text-neutral-700 hover:bg-neutral-50 font-semibold text-xs transition-all shadow-xs"
            >
              <Heart 
                className={`w-3.5 h-3.5 ${
                  isWished ? 'fill-honey text-honey stroke-honey' : 'text-neutral-500'
                }`} 
              />
              <span>{isWished ? 'Wishlisted' : 'Wishlist'}</span>
            </button>
          </div>
        </div>

        {/* Responsive 2-Column Split: Left is Image Gallery, Right is Details Panel */}
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 xl:gap-10 lg:items-start mt-2">
          
          {/* Left Column: Image Showcase & Gallery (7 cols on desktop) */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-3">
            <div className="relative h-[320px] sm:h-[400px] lg:h-[540px] rounded-3xl bg-[#f5f5f5] overflow-hidden p-6 lg:p-8 flex items-center justify-center border border-neutral-100 shadow-xs">
              
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
                  className="max-h-full max-w-[85%] object-contain drop-shadow-md cursor-zoom-in transition-transform duration-300 hover:scale-105"
                  onClick={() => setIsZoomModalOpen(true)}
                />
              ) : (
                <div className="text-honey-900 font-bold text-lg font-display tracking-wider">
                  ASLAM TAILOR
                </div>
              )}

              {/* Zoom Trigger (only if image exists) */}
              {images.length > 0 && (
                <div className="absolute bottom-3 left-3 flex items-center space-x-2">
                  <button
                    onClick={() => setIsZoomModalOpen(true)}
                    className="p-2.5 rounded-full bg-white/90 hover:bg-white text-neutral-700 shadow-sm transition-colors"
                    title="Zoom image"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Floating Virtual Try-On Badge on Image (Coming Soon) */}
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    toast.info('✨ Virtual AI Try-On (Fitting Room) is coming soon! Stay tuned.');
                  }}
                  className="absolute bottom-3 right-3 sm:right-4 z-10 px-3.5 py-1.5 rounded-full bg-neutral-900/90 hover:bg-neutral-900 text-white text-xs font-bold shadow-md backdrop-blur-md flex items-center space-x-1.5 active:scale-95 transition-all"
                  title="Virtual AI Fitting Room (Coming Soon)"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>Try On</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400/25 text-amber-300 text-[9px] font-semibold tracking-wide">
                    Coming Soon
                  </span>
                </button>
              )}

              {/* Floating Vertical Thumbnails for Mobile */}
              {images.length > 1 && (
                <div className="lg:hidden absolute right-3.5 top-1/2 -translate-y-1/2 flex flex-col space-y-2 z-10 max-h-[85%] overflow-y-auto scrollbar-none py-1">
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

            {/* Desktop Horizontal Thumbnails Row */}
            {images.length > 1 && (
              <div className="hidden lg:flex items-center gap-3 overflow-x-auto py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-2xl overflow-hidden border-2 bg-white p-1 transition-all shrink-0 ${
                      selectedImageIndex === idx
                        ? 'border-honey scale-105 shadow-sm'
                        : 'border-neutral-200/80 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details White Container (5 cols on desktop) */}
          <div className="lg:col-span-5 mt-4 lg:mt-0">
            <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-[0_4px_25px_rgba(0,0,0,0.03)] border border-neutral-100 space-y-5">
          
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

          {/* Title Row (Full width for clean, un-squished typography) */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 font-display leading-snug">
              {product.name}
            </h1>
          </div>

          {/* Price, Stock & Quantity Stepper Row */}
          <div className="flex items-center justify-between gap-3 pt-1 pb-3 border-b border-neutral-100">
            {/* Price & Stock Column */}
            <div className="space-y-1">
              <div className="flex items-baseline space-x-2 flex-wrap">
                <span className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-sans tracking-tight">
                  {formatCurrency(finalPrice, settings.currencySymbol)}
                </span>
                {hasDiscount && (
                  <span className="text-xs sm:text-sm text-neutral-400 line-through font-sans">
                    {formatCurrency(originalPrice, settings.currencySymbol)}
                  </span>
                )}
                {hasDiscount && (
                  <span className="px-2 py-0.5 rounded-full bg-honey/15 text-honey-700 text-[10px] sm:text-xs font-bold">
                    -{product.discount}% OFF
                  </span>
                )}
              </div>

              {/* Live Stock Status from Admin */}
              <div>
                {isOutOfStock ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-[11px] font-semibold border border-red-100">
                    <AlertCircle className="w-3 h-3" />
                    <span>Out of Stock</span>
                  </span>
                ) : product.stock <= 5 ? (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold border border-amber-200">
                    <span>Only {product.stock} left in stock!</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>In Stock</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quantity Stepper [ - 01 + ] */}
            {!isOutOfStock && product.stock > 0 && (
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  Quantity
                </span>
                <div className="flex items-center space-x-2 bg-[#FDEBD2] text-neutral-800 rounded-full px-2.5 py-1 shadow-xs">
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
              </div>
            )}
          </div>

          {/* Payment & Trust Info Cards (Clean 2-Column Grid) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* COD Card */}
            <div className={`flex items-center space-x-2.5 p-2.5 rounded-2xl border transition-all ${
              isCodAllowed
                ? 'bg-emerald-50/60 border-emerald-100/90 text-emerald-950'
                : 'bg-neutral-50 border-neutral-100 text-neutral-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isCodAllowed ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-400'
              }`}>
                <Banknote className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold truncate leading-tight">Cash on Delivery</p>
                <p className={`text-[10px] truncate leading-tight mt-0.5 ${
                  isCodAllowed ? 'text-emerald-700 font-medium' : 'text-neutral-400'
                }`}>
                  {isCodAllowed 
                    ? (codFee > 0 ? `+₹${codFee} extra fee` : 'Available')
                    : 'Not Available'}
                </p>
              </div>
            </div>

            {/* UPI / Online Card */}
            <div className={`flex items-center space-x-2.5 p-2.5 rounded-2xl border transition-all ${
              isUpiAllowed
                ? 'bg-amber-50/60 border-amber-200/60 text-amber-950'
                : 'bg-neutral-50 border-neutral-100 text-neutral-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                isUpiAllowed ? 'bg-amber-100 text-honey-700' : 'bg-neutral-200 text-neutral-400'
              }`}>
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold truncate leading-tight">UPI / Online Pay</p>
                <p className={`text-[10px] truncate leading-tight mt-0.5 ${
                  isUpiAllowed ? 'text-amber-800 font-medium' : 'text-neutral-400'
                }`}>
                  {isUpiAllowed ? 'Fast & 100% Safe' : 'Not Available'}
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Variants configured by Admin (ONLY rendered if admin entered variants) */}
          {hasVariants && (
            <div className="space-y-4 pt-1">
              {product.variants!.map((variant, vIdx) => {
                if (!variant.options || variant.options.length === 0) return null;
                const isColorVariant = /colou?r/i.test(variant.name);
                const isSizeVariant = /size/i.test(variant.name);
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

                      {/* View Size Chart Button next to Size Selector */}
                      {isSizeVariant && sizeChartUrl && (
                        <button
                          type="button"
                          onClick={() => setIsSizeChartOpen(true)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-honey hover:text-honey-600 transition-all py-1 px-2.5 rounded-lg bg-honey/10 hover:bg-honey/20 active:scale-95"
                          title="View Size Chart"
                        >
                          <Ruler className="w-3.5 h-3.5" />
                          <span>View Size Chart</span>
                        </button>
                      )}
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
              <p
                className={`text-xs text-neutral-600 leading-relaxed whitespace-pre-line transition-all duration-200 ${
                  !isDescriptionExpanded && isLongDescription ? 'line-clamp-3' : ''
                }`}
              >
                {product.description}
              </p>
              {isLongDescription && (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                  className="mt-1.5 text-xs font-bold text-honey hover:text-honey-600 transition-colors inline-flex items-center gap-1 active:scale-95"
                  aria-expanded={isDescriptionExpanded}
                >
                  <span>{isDescriptionExpanded ? 'Less' : 'More'}</span>
                  {isDescriptionExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
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

          {/* View Size Chart Button (if product has size chart but no size variant selector) */}
          {sizeChartUrl && !hasSizeVariant && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsSizeChartOpen(true)}
                className="w-full py-3 px-4 rounded-2xl border border-honey/40 bg-honey/5 hover:bg-honey/10 text-honey-600 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all active:scale-[0.99]"
              >
                <Ruler className="w-4 h-4 text-honey" />
                <span>View Size Chart & Measurements</span>
              </button>
            </div>
          )}

          {/* Virtual AI Try-On / Fitting Room Banner (Coming Soon) */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                toast.info('✨ Virtual AI Try-On (Fitting Room) is coming soon! Stay tuned.');
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-neutral-900/95 hover:bg-neutral-900 text-white text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center space-x-2.5 transition-all shadow-md active:scale-[0.99] border border-neutral-700/30 group"
            >
              <Sparkles className="w-4 h-4 fill-amber-400 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Try On This Product</span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-bold tracking-normal normal-case border border-amber-400/30">
                Coming Soon
              </span>
            </button>
          </div>

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

          {/* Share Product Bar (WhatsApp & Social) */}
          <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-neutral-500">
              Share with friends:
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  const url = getProductWhatsAppShareUrl(
                    product, 
                    formatCurrency(finalPrice, settings.currencySymbol)
                  );
                  window.open(url, '_blank');
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#25D366] hover:bg-[#20ba59] active:scale-95 text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                title="Share on WhatsApp"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-white" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 text-xs font-semibold transition-all flex items-center space-x-1.5"
                title="More Sharing Options"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          </div>
          </div>
        </div>

        {/* Related Products in same Category (Full Width on Desktop) */}
        {relatedProducts.length > 0 && (
          <div className="mt-12 lg:mt-16 pt-8 border-t border-neutral-200/60">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold font-display text-neutral-900">
                  Similar Styles
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Handpicked matching designs in {product.category || 'this collection'}
                </p>
              </div>
              <Link
                to={product.category ? `/category/${encodeURIComponent(product.category)}` : '/shop'}
                className="text-xs font-bold text-honey hover:text-honey-600 transition-colors"
              >
                View More &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
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

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        product={product}
      />

      <TryOnModal
        isOpen={isTryOnModalOpen}
        onClose={() => setIsTryOnModalOpen(false)}
        product={product}
      />

      <SizeChartModal
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
        sizeChartUrl={sizeChartUrl}
        productName={product.name}
      />

    </div>
  );
};

