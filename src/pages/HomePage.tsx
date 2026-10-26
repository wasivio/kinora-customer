import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { ProductSkeleton } from '../components/common/LoadingSkeleton';
import { 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight, 
  Sparkles, 
  Truck, 
  Banknote, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { 
    products, 
    categories, 
    heroBanners, 
    getProductsByCategory,
    isLoading 
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('trending');
  const [currentBannerIndex, setCurrentBannerIndex] = useState<number>(0);

  // Category pills matching Screen 1 (Trending, Shoes, Bag, Shirts, etc.)
  const categoryPills = [
    { id: 'trending', name: 'Trending' },
    ...categories.map((c) => ({
      id: c.slug || c.id || c.name.toLowerCase(),
      name: c.name,
    })),
  ];

  const displayPills = categoryPills.length > 1 ? categoryPills : [
    { id: 'trending', name: 'Trending' },
    { id: 'shoes', name: 'Shoes' },
    { id: 'bag', name: 'Bag' },
    { id: 'shirts', name: 'Shirts' },
    { id: 'beauty', name: 'Beauty' },
    { id: 'lifestyle', name: 'Lifestyle' },
  ];

  // Filter products by selected category using robust category resolver
  const filteredProducts = selectedCategory === 'trending'
    ? products
    : getProductsByCategory(selectedCategory);

  const nextBanner = () => {
    if (heroBanners.length > 1) {
      setCurrentBannerIndex((prev) => (prev + 1) % heroBanners.length);
    }
  };

  const prevBanner = () => {
    if (heroBanners.length > 1) {
      setCurrentBannerIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
    }
  };

  const greetingName = user?.displayName?.split(' ')[0] || 'Friend';

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-24 sm:pb-32">
      
      {/* 1. Greeting & Hero Banner Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* User Greeting (compact and elegant) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-neutral-900 tracking-tight">
              Hello {greetingName}
            </h1>
            <p className="text-xs sm:text-sm text-neutral-500 mt-0.5 font-normal">
              Fashion confidence and reveals beauty.
            </p>
          </div>
          <Link
            to="/shop"
            className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-bold text-honey hover:text-honey-600 transition-colors"
          >
            <span>Explore All Products</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Hero Banner: Either Admin Banners OR Default High-End KINORA Showcase */}
        {heroBanners.length > 0 ? (
          <div className="relative w-full h-[180px] sm:h-[280px] lg:h-[360px] rounded-3xl overflow-hidden bg-black text-white shadow-sm border border-neutral-100">
            {heroBanners.map((banner, index) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  index === currentBannerIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
              >
                {banner.imageUrl && (
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="w-full h-full object-cover object-center brightness-90"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent flex flex-col justify-end p-6 sm:p-10">
                  <div className="max-w-xl">
                    {banner.subtitle && (
                      <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-honey mb-1 inline-block">
                        {banner.subtitle}
                      </span>
                    )}
                    <h2 className="text-lg sm:text-3xl font-bold font-display text-white mb-2 leading-tight">
                      {banner.title}
                    </h2>
                    {banner.linkUrl && (
                      <Link
                        to={banner.linkUrl}
                        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-full bg-honey hover:bg-honey-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                      >
                        <span>Explore Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {heroBanners.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prevBanner}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors backdrop-blur-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextBanner}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors backdrop-blur-xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        ) : (
          /* Default High-End KINORA Showcase Banner (when admin hasn't created a banner) */
          <div className="relative w-full rounded-3xl bg-neutral-900 overflow-hidden text-white p-6 sm:p-10 lg:p-12 shadow-sm border border-neutral-800">
            <div className="relative z-10 max-w-xl space-y-3">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-honey/20 border border-honey/30 text-honey-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-honey-400" />
                <span>New Collection 2026</span>
              </span>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-white tracking-tight leading-snug">
                Fashion That Speaks Confidence & Comfort
              </h2>

              <p className="text-xs sm:text-sm text-neutral-300 max-w-md leading-relaxed">
                Discover high-grade streetwear, premium oversized tees, and tailored essentials designed for everyday style.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to="/shop"
                  className="px-5 sm:px-6 py-2.5 rounded-full bg-honey hover:bg-honey-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95 inline-flex items-center space-x-2"
                >
                  <span>Explore Collection</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedCategory('trending')}
                  className="px-4 sm:px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-xs backdrop-blur-xs transition-all active:scale-95"
                >
                  Trending Drops
                </button>
              </div>
            </div>

            {/* Subtle Gradient Backdrops */}
            <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-honey/15 blur-3xl pointer-events-none" />
            <div className="absolute right-10 bottom-0 w-64 h-64 rounded-full bg-amber-600/10 blur-2xl pointer-events-none" />
          </div>
        )}
      </section>

      {/* 2. Trust & Features Highlight Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          
          <div className="flex items-center space-x-3 p-3 sm:p-4 rounded-2xl bg-white border border-neutral-100 shadow-xs">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900 truncate">Free Delivery</p>
              <p className="text-[10px] text-neutral-400 truncate">On qualifying orders</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 sm:p-4 rounded-2xl bg-white border border-neutral-100 shadow-xs">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-50 text-honey flex items-center justify-center shrink-0">
              <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900 truncate">Cash on Delivery</p>
              <p className="text-[10px] text-neutral-400 truncate">Doorstep cash accepted</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 sm:p-4 rounded-2xl bg-white border border-neutral-100 shadow-xs">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900 truncate">100% Original</p>
              <p className="text-[10px] text-neutral-400 truncate">Premium fabric quality</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 sm:p-4 rounded-2xl bg-white border border-neutral-100 shadow-xs">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-neutral-900 truncate">Fast Dispatch</p>
              <p className="text-[10px] text-neutral-400 truncate">Shipped in 24-48 hrs</p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. Category Filter Pills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
            Categories & Collections
          </h2>
          <Link
            to="/shop"
            className="text-xs font-bold text-honey hover:text-honey-600 transition-colors"
          >
            All Collections &rarr;
          </Link>
        </div>

        <div className="flex items-center space-x-2.5 overflow-x-auto scrollbar-none py-1">
          {displayPills.map((pill) => {
            const isSelected = selectedCategory === pill.id;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setSelectedCategory(pill.id)}
                className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-honey text-white shadow-sm'
                    : 'bg-pill-gray text-neutral-600 hover:text-neutral-900 hover:bg-neutral-200/60'
                }`}
              >
                {pill.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Products Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        
        {/* Section Title & Count */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h3 className="text-base sm:text-xl font-bold font-display text-neutral-900 capitalize">
              {selectedCategory === 'trending' ? 'Trending Fits & Bestsellers' : `${selectedCategory} Collection`}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </p>
          </div>

          <Link
            to="/shop"
            className="text-xs font-bold text-honey hover:text-honey-600 transition-colors"
          >
            View More &rarr;
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-neutral-100 p-8 shadow-xs">
            <p className="text-sm font-semibold text-neutral-800">No products found in this category</p>
            <p className="text-xs text-neutral-400 mt-1">Explore all creations or pick another collection</p>
            <button
              type="button"
              onClick={() => setSelectedCategory('trending')}
              className="mt-4 px-5 py-2 rounded-full bg-honey text-white text-xs font-semibold hover:bg-honey-600 transition-colors shadow-xs"
            >
              Show Trending Items
            </button>
          </div>
        )}
      </main>

    </div>
  );
};
