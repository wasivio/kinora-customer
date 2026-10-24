import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Ruler, Loader2, AlertCircle } from 'lucide-react';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeChartUrl: string | null;
  productName?: string;
}

export const SizeChartModal: React.FC<SizeChartModalProps> = ({
  isOpen,
  onClose,
  sizeChartUrl,
  productName,
}) => {
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [reloadKey, setReloadKey] = useState<number>(0);

  // Reset state when modal opens or URL changes
  useEffect(() => {
    if (isOpen) {
      setIsZoomed(false);
      setIsLoading(true);
      setHasError(false);
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, sizeChartUrl, reloadKey]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !sizeChartUrl) return null;

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setReloadKey((prev) => prev + 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Size Chart Modal"
    >
      <div
        className="relative w-full max-w-3xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-neutral-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-white">
          <div className="flex items-center space-x-2.5 min-w-0 pr-3">
            <div className="w-8 h-8 rounded-full bg-honey/15 flex items-center justify-center text-honey flex-shrink-0">
              <Ruler className="w-4 h-4 text-honey" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 leading-tight">
                Size Chart & Guide
              </h3>
              {productName && (
                <p className="text-xs text-neutral-500 truncate mt-0.5">
                  {productName}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {!hasError && !isLoading && (
              <>
                <button
                  type="button"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                  title={isZoomed ? 'Zoom out' : 'Zoom in'}
                  aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
                >
                  {isZoomed ? (
                    <ZoomOut className="w-4 h-4" />
                  ) : (
                    <ZoomIn className="w-4 h-4" />
                  )}
                </button>
                {isZoomed && (
                  <button
                    type="button"
                    onClick={() => setIsZoomed(false)}
                    className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
                    title="Reset view"
                    aria-label="Reset view"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Image Viewer */}
        <div className="relative flex-1 min-h-[300px] max-h-[70vh] bg-[#f8f9fa] overflow-auto flex items-center justify-center p-3 sm:p-6">
          {/* Loading State */}
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#f8f9fa] z-10 space-y-3">
              <Loader2 className="w-8 h-8 text-honey animate-spin" />
              <p className="text-xs font-semibold text-neutral-600">
                Loading size chart...
              </p>
            </div>
          )}

          {/* Error State */}
          {hasError ? (
            <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 max-w-sm">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900">
                Unable to Load Size Chart
              </h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                The size chart image could not be loaded. Please check your connection or try again.
              </p>
              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="px-4 py-2 rounded-full bg-honey text-white text-xs font-bold hover:bg-honey-600 transition-colors shadow-sm"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-full bg-neutral-200 text-neutral-800 text-xs font-semibold hover:bg-neutral-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`transition-all duration-200 flex items-center justify-center w-full h-full ${
                isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
              }`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <img
                key={`${sizeChartUrl}-${reloadKey}`}
                src={sizeChartUrl}
                alt={productName ? `Size chart for ${productName}` : 'Size Chart'}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                className={`transition-all duration-300 rounded-xl select-none object-contain ${
                  isLoading ? 'opacity-0' : 'opacity-100'
                } ${
                  isZoomed
                    ? 'min-w-[650px] sm:min-w-[850px] max-w-none shadow-lg'
                    : 'max-h-[65vh] max-w-full'
                }`}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-neutral-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-neutral-400 text-center sm:text-left flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-honey" />
            <span>Click or tap the image to zoom in / out and inspect measurements.</span>
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
