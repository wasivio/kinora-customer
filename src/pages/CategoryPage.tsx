import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/common/ProductCard';
import { ProductSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { categories, getProductsByCategory, isLoading } = useStore();

  const category = useMemo(() => {
    if (!slug) return undefined;
    return categories.find(
      (c) => c.slug?.toLowerCase() === slug.toLowerCase() || c.name.toLowerCase() === slug.toLowerCase()
    );
  }, [categories, slug]);

  const categoryProducts = useMemo(() => {
    if (!slug) return [];
    return getProductsByCategory(slug);
  }, [slug, getProductsByCategory]);

  const categoryTitle = category ? category.name : (slug ? slug.replace(/-/g, ' ').toUpperCase() : 'Category');

  return (
    <div className="min-h-screen bg-white pb-20">
      
      {/* Category Hero / Header */}
      <div className="border-b border-neutral-200 bg-neutral-50/50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/shop"
            className="inline-flex items-center space-x-1.5 text-xs uppercase tracking-wider text-neutral-500 hover:text-black mb-4 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Categories</span>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Collection
              </span>
              <h1 className="text-3xl sm:text-4xl font-bold font-display text-black tracking-tight mt-1">
                {categoryTitle}
              </h1>
              {category?.description && (
                <p className="text-xs sm:text-sm text-neutral-600 max-w-xl mt-2 leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>

            <div className="text-xs text-neutral-500">
              Showing <span className="font-semibold text-black">{categoryProducts.length}</span> pieces
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : categoryProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {categoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ShoppingBag}
            title={`No products in ${categoryTitle}`}
            description="We haven't added products to this category yet. Check back soon or explore our complete catalog."
            actionText="Explore All Products"
            actionLink="/shop"
          />
        )}
      </div>

    </div>
  );
};
