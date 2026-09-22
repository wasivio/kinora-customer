import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, calculateDiscountedPrice } from '../../lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { products, settings } = useStore();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProducts = query.trim()
    ? products.filter((p) => {
        const q = query.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.SKU?.toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  const handleSelectProduct = (productId: string) => {
    onClose();
    navigate(`/product/${productId}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center border-b border-neutral-200 px-4 py-3.5">
          <Search className="w-5 h-5 text-neutral-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products by title, category, or SKU..."
            className="w-full bg-transparent text-black placeholder-neutral-400 text-base focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-black mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold px-2 py-1 rounded bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          >
            ESC
          </button>
        </form>

        {/* Search Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 divide-y divide-neutral-100">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-neutral-400 text-sm">
              Type to search for products in the KINORA catalog...
            </div>
          ) : filteredProducts.length > 0 ? (
            <div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2 px-2">
                Products ({filteredProducts.length})
              </div>
              {filteredProducts.map((product) => {
                const { finalPrice } = calculateDiscountedPrice(product.price, product.discount);
                const primaryImage = product.images?.[0]?.url || '';
                return (
                  <div
                    key={product.id}
                    onClick={() => handleSelectProduct(product.id)}
                    className="flex items-center space-x-3 p-2.5 rounded-xl hover:bg-neutral-50 cursor-pointer transition-colors group"
                  >
                    <div className="w-12 h-14 bg-neutral-100 rounded-lg overflow-hidden shrink-0 border border-neutral-200">
                      {primaryImage ? (
                        <img src={primaryImage} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400">KINORA</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-black group-hover:text-neutral-700 truncate">
                        {product.name}
                      </div>
                      <div className="text-xs text-neutral-500 capitalize">
                        {product.category}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold text-black">
                        {formatCurrency(finalPrice, settings.currencySymbol)}
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-black group-hover:translate-x-0.5 transition-all inline-block ml-1" />
                    </div>
                  </div>
                );
              })}

              <div className="pt-3 mt-2 text-center">
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="text-xs font-semibold text-neutral-900 hover:underline inline-flex items-center space-x-1"
                >
                  <span>View all results for "{query}"</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-neutral-700 font-medium text-sm">No products found</p>
              <p className="text-neutral-400 text-xs mt-1">Try checking for typos or searching for general terms like "shirt" or "jacket".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
