import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { ProductSkeleton, BannerSkeleton } from '../components/common/LoadingSkeleton';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { 
    products, 
    categories, 
    heroBanners, 
    isLoading 
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('trending');
  const [currentBannerIndex, setCurrentBannerIndex] = useState<number>(0);

  // Category pills matching Screen 1 (Trending, Shoes, Bag, Shirts, etc.)
  const categoryPills = [
    { id: 'trending', name: 'Trending' },
    ...categories.map((c) => ({
      id: c.slug || c.name.toLowerCase(),
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

  // Filter products by selected category
  const filteredProducts = selectedCategory === 'trending'
    ? products
    : products.filter(
        (p) =>
          p.category?.toLowerCase() === selectedCategory.toLowerCase() ||
          p.categoryId?.toLowerCase() === selectedCategory.toLowerCase() ||
          p.subcategory?.toLowerCase() === selectedCategory.toLowerCase()
      );

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
    <div className="min-h-screen bg-[#FAFAFC] pb-32">
      
      {/* Greeting Section (Screen 1) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-neutral-900 tracking-tight">
            Hello {greetingName}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-normal">
            Fashion confidence and reveals beauty.
          </p>
        </div>
      </section>

      {/* Category Pills (Horizontal Scroll matching Screen 1) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2">
        <div className="flex items-center space-x-2.5 overflow-x-auto scrollbar-none py-1">
          {displayPills.map((pill) => {
            const isSelected = selectedCategory === pill.id;
            return (
              <button
                key={pill.id}
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

      {/* Hero Banner Carousel (if active banners exist in Firestore) */}
      {heroBanners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3">
          <div className="relative w-full h-[160px] sm:h-[260px] md:h-[340px] rounded-3xl overflow-hidden bg-black text-white shadow-sm">
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-5 sm:p-8">
                  <div className="max-w-md">
                    {banner.subtitle && (
                      <span className="text-[10px] sm:text-xs font-semibold tracking-wider uppercase text-honey mb-1 inline-block">
                        {banner.subtitle}
                      </span>
                    )}
                    <h2 className="text-base sm:text-2xl font-bold font-display text-white mb-2 leading-tight">
                      {banner.title}
                    </h2>
                    {banner.linkUrl && (
                      <Link
                        to={banner.linkUrl}
                        className="inline-flex items-center space-x-1 px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors"
                      >
                        <span>Explore</span>
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
                  onClick={prevBanner}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextBanner}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </section>
      )}

      {/* Products Grid - 2 columns on mobile, 3/4 columns on desktop (Screen 1) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-neutral-100 p-8">
            <p className="text-sm font-medium text-neutral-700">No products found in this category</p>
            <p className="text-xs text-neutral-400 mt-1">Explore all creations or pick another collection</p>
            <button
              onClick={() => setSelectedCategory('trending')}
              className="mt-4 px-5 py-2 rounded-full bg-honey text-white text-xs font-semibold hover:bg-honey-600 transition-colors"
            >
              Show Trending Items
            </button>
          </div>
        )}
      </main>

    </div>
  );
};
