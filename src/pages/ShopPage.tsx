import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, ArrowUpDown, X, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { ProductSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { calculateDiscountedPrice, formatCurrency } from '../lib/utils';

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, categories, settings, isLoading } = useStore();

  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = searchParams.get('sort') || 'default';
  const isFeaturedOnly = searchParams.get('featured') === 'true';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>(initialSearch);
  const [sortBy, setSortBy] = useState<string>(initialSort);
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(isFeaturedOnly);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 20000]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(12);

  const maxProductPrice = useMemo(() => {
    if (products.length === 0) return 10000;
    return Math.max(...products.map((p) => p.price || 0), 1000);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory !== 'all') {
        const catLower = selectedCategory.toLowerCase();
        const pCat = product.category?.toLowerCase();
        const pCatId = product.categoryId?.toLowerCase();
        const pSub = product.subcategory?.toLowerCase();
        if (pCat !== catLower && pCatId !== catLower && pSub !== catLower) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesDesc = product.description?.toLowerCase().includes(q);
        const matchesCat = product.category?.toLowerCase().includes(q);
        const matchesSku = product.SKU?.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat && !matchesSku) {
          return false;
        }
      }

      if (featuredOnly && !product.featured) {
        return false;
      }

      if (inStockOnly && (product.stock <= 0 || product.status === 'out_of_stock')) {
        return false;
      }

      const { finalPrice } = calculateDiscountedPrice(product.price, product.discount);
      if (finalPrice < priceRange[0] || finalPrice > priceRange[1]) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      const priceA = calculateDiscountedPrice(a.price, a.discount).finalPrice;
      const priceB = calculateDiscountedPrice(b.price, b.discount).finalPrice;

      if (sortBy === 'price-low') {
        return priceA - priceB;
      }
      if (sortBy === 'price-high') {
        return priceB - priceA;
      }
      if (sortBy === 'newest') {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [products, selectedCategory, searchQuery, featuredOnly, inStockOnly, priceRange, sortBy]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSortBy('default');
    setFeaturedOnly(false);
    setInStockOnly(false);
    setPriceRange([0, maxProductPrice]);
    setSearchParams({});
  };

  const handleCategorySelect = (catSlug: string) => {
    setSelectedCategory(catSlug);
    if (catSlug === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catSlug);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] pb-32">
      
      {/* Top Header */}
      <div className="bg-white border-b border-neutral-100 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight font-display">
              {selectedCategory !== 'all' 
                ? `${selectedCategory.toUpperCase()}` 
                : featuredOnly 
                ? 'BEST SELLERS' 
                : 'ALL PRODUCTS'}
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Showing {filteredProducts.length} items
            </p>
          </div>

          {/* Mobile Filter & Sort */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="flex-1 flex items-center justify-center space-x-1.5 py-2 px-3 rounded-full bg-charcoal text-white text-xs font-semibold shadow-sm"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            
            <div className="relative flex-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full appearance-none py-2 px-3 pr-7 rounded-full border border-neutral-200 text-xs font-medium text-neutral-800 bg-white focus:outline-none"
              >
                <option value="default">Sort: Popular</option>
                <option value="newest">Sort: Latest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>
              <ArrowUpDown className="w-3 h-3 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex gap-6">
          
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0 space-y-6 bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm h-fit">
            
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2.5">Search</h3>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Keywords..."
                  className="w-full bg-[#F5F7FA] border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-honey"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">Categories</h3>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => handleCategorySelect('all')}
                    className="text-[11px] text-honey hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <ul className="space-y-1 text-xs">
                <li>
                  <button
                    onClick={() => handleCategorySelect('all')}
                    className={`w-full text-left py-2 px-3 rounded-xl transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-honey text-white font-semibold shadow-sm'
                        : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                    }`}
                  >
                    All Categories ({products.length})
                  </button>
                </li>
                {categories.map((cat) => {
                  const count = products.filter(
                    (p) => p.category?.toLowerCase() === cat.name.toLowerCase() || p.categoryId === cat.id
                  ).length;
                  return (
                    <li key={cat.id}>
                      <button
                        onClick={() => handleCategorySelect(cat.slug || cat.name.toLowerCase())}
                        className={`w-full flex items-center justify-between py-2 px-3 rounded-xl transition-colors ${
                          selectedCategory.toLowerCase() === (cat.slug || cat.name).toLowerCase()
                            ? 'bg-honey text-white font-semibold shadow-sm'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                        }`}
                      >
                        <span>{cat.name}</span>
                        <span className="text-[10px] opacity-80">({count})</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                Max Price: {formatCurrency(priceRange[1], settings.currencySymbol)}
              </h3>
              <input
                type="range"
                min={0}
                max={maxProductPrice}
                step={100}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full accent-honey cursor-pointer"
              />
            </div>

            <div className="space-y-2.5 pt-3 border-t border-neutral-100 text-xs text-neutral-700">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-neutral-300 text-honey focus:ring-honey accent-honey w-3.5 h-3.5"
                />
                <span>In Stock Only</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => setFeaturedOnly(e.target.checked)}
                  className="rounded border-neutral-300 text-honey focus:ring-honey accent-honey w-3.5 h-3.5"
                />
                <span>Best Sellers Only</span>
              </label>
            </div>

            <button
              onClick={handleResetFilters}
              className="w-full py-2.5 px-3 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-600 hover:text-honey hover:border-honey transition-colors"
            >
              Clear All Filters
            </button>
          </aside>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                {[...Array(6)].map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : displayedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
                  {displayedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {displayedProducts.length < filteredProducts.length && (
                  <div className="mt-10 text-center">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                      className="px-8 py-3 rounded-full bg-white border border-honey text-honey hover:bg-honey hover:text-white text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                    >
                      Load More Items
                    </button>
                  </div>
                )}
              </>
            ) : (
              <EmptyState
                icon={ShoppingBag}
                title="No Products Found"
                description="We couldn't find any items matching your criteria. Try adjusting your filters."
                actionText="Reset All Filters"
                onAction={handleResetFilters}
              />
            )}
          </div>

        </div>
      </div>

      {/* Mobile Filter Sheet */}
      {isMobileFilterOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end lg:hidden animate-fade-in"
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div 
            className="bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-base font-bold text-neutral-900 font-display">Filter Products</h2>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">Category</h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleCategorySelect('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-honey text-white'
                      : 'bg-pill-gray text-neutral-700'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.slug || cat.name.toLowerCase())}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      selectedCategory.toLowerCase() === (cat.slug || cat.name).toLowerCase()
                        ? 'bg-honey text-white'
                        : 'bg-pill-gray text-neutral-700'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 mb-2">
                Max Price: {formatCurrency(priceRange[1], settings.currencySymbol)}
              </h3>
              <input
                type="range"
                min={0}
                max={maxProductPrice}
                step={100}
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full accent-honey cursor-pointer"
              />
            </div>

            <div className="space-y-2 text-xs text-neutral-700">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-neutral-300 text-honey focus:ring-honey accent-honey w-4 h-4"
                />
                <span>In Stock Only</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={featuredOnly}
                  onChange={(e) => setFeaturedOnly(e.target.checked)}
                  className="rounded border-neutral-300 text-honey focus:ring-honey accent-honey w-4 h-4"
                />
                <span>Best Sellers Only</span>
              </label>
            </div>

            <div className="pt-3 flex gap-3">
              <button
                onClick={handleResetFilters}
                className="flex-1 py-3 rounded-full border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700"
              >
                Reset
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 rounded-full bg-honey text-white text-xs font-bold uppercase tracking-wider shadow-sm"
              >
                Apply
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
