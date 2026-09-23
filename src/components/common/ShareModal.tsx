import React, { useState } from 'react';
import { X, Copy, Check, MessageCircle, Share2, ExternalLink } from 'lucide-react';
import { Product } from '../../types';
import { useStore } from '../../context/StoreContext';
import { formatCurrency, calculateDiscountedPrice } from '../../lib/utils';
import { 
  getProductShareUrl, 
  copyToClipboard, 
  getProductWhatsAppShareUrl, 
  getProductTwitterShareUrl, 
  getProductFacebookShareUrl,
  canNativeShare, 
  triggerNativeShare 
} from '../../lib/share';
import { toast } from 'sonner';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { settings } = useStore();
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !product) return null;

  const { finalPrice } = calculateDiscountedPrice(product.price, product.discount);
  const formattedPrice = formatCurrency(finalPrice, settings.currencySymbol);
  const shareUrl = getProductShareUrl(product.id);
  const primaryImage = product.images?.[0]?.url;
  const isNativeSupported = canNativeShare();

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      setCopied(true);
      toast.success('Product link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } else {
      toast.error('Could not copy link to clipboard');
    }
  };

  const handleWhatsApp = () => {
    const url = getProductWhatsAppShareUrl(product, formattedPrice);
    window.open(url, '_blank');
  };

  const handleTwitter = () => {
    const url = getProductTwitterShareUrl(product, formattedPrice);
    window.open(url, '_blank');
  };

  const handleFacebook = () => {
    const url = getProductFacebookShareUrl(product);
    window.open(url, '_blank');
  };

  const handleNative = async () => {
    const shared = await triggerNativeShare(product, formattedPrice);
    if (shared) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-5 sm:p-6 shadow-2xl border border-neutral-100 relative space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-800">
              <Share2 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 font-display">
              Share Product
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product Preview Card */}
        <div className="flex items-center space-x-3.5 p-3 rounded-2xl bg-[#f5f5f5] border border-neutral-200/60">
          <div className="w-14 h-14 rounded-xl bg-white p-1 overflow-hidden shrink-0 flex items-center justify-center border border-neutral-100">
            {primaryImage ? (
              <img 
                src={primaryImage} 
                alt={product.name} 
                className="w-full h-full object-contain" 
              />
            ) : (
              <span className="text-[10px] font-bold text-neutral-400 font-display">KINORA</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 truncate">
              {product.name}
            </h4>
            <div className="flex items-center space-x-2 mt-0.5">
              <span className="text-xs font-bold text-honey font-sans">
                {formattedPrice}
              </span>
              {product.category && (
                <span className="text-[11px] text-neutral-400 capitalize truncate">
                  • {product.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Primary WhatsApp Share Button */}
        <div>
          <button
            onClick={handleWhatsApp}
            className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center space-x-2.5 transition-all shadow-md shadow-emerald-500/10"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Share via WhatsApp</span>
          </button>
        </div>

        {/* Copy Link Input Bar */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
            Copy Product Link
          </label>
          <div className="flex items-center space-x-2 bg-neutral-50 border border-neutral-200 rounded-2xl p-1.5 pl-3">
            <input 
              type="text" 
              readOnly 
              value={shareUrl}
              className="bg-transparent text-xs text-neutral-600 font-mono flex-1 outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 shrink-0 ${
                copied 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-neutral-900 hover:bg-neutral-800 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Other Share Channels */}
        <div className="pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
          {isNativeSupported && (
            <button
              onClick={handleNative}
              className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>More Apps</span>
            </button>
          )}

          <button
            onClick={handleTwitter}
            className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
            title="Share on X"
          >
            <span>Share on X</span>
          </button>

          <button
            onClick={handleFacebook}
            className="flex-1 py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
            title="Share on Facebook"
          >
            <span>Facebook</span>
          </button>
        </div>

      </div>
    </div>
  );
};
