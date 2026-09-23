import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AlertTriangle, X, ShieldAlert } from 'lucide-react';

interface CancelOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: () => Promise<void>;
  isCancelling: boolean;
  orderNumber: string;
}

const HOLD_DURATION_MS = 3000; // 3 seconds hold requirement

export const CancelOrderModal: React.FC<CancelOrderModalProps> = ({
  isOpen,
  onClose,
  onConfirmCancel,
  isCancelling,
  orderNumber,
}) => {
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isHolding, setIsHolding] = useState<boolean>(false);
  const [showHoldHint, setShowHoldHint] = useState<boolean>(false);

  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const completedRef = useRef<boolean>(false);

  const resetHold = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    startTimeRef.current = null;
    setIsHolding(false);
    setHoldProgress(0);
  }, []);

  // Reset progress when modal state changes
  useEffect(() => {
    if (!isOpen) {
      resetHold();
      completedRef.current = false;
      setShowHoldHint(false);
    }
  }, [isOpen, resetHold]);

  const handleHoldStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    if (isCancelling || completedRef.current) return;

    setShowHoldHint(false);
    setIsHolding(true);
    startTimeRef.current = Date.now();

    const updateProgress = () => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        completedRef.current = true;
        setIsHolding(false);
        onConfirmCancel();
      } else {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const handleHoldEnd = (e?: React.TouchEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (completedRef.current || isCancelling) return;

    if (isHolding && holdProgress < 100) {
      // Released too early
      setShowHoldHint(true);
    }
    resetHold();
  };

  if (!isOpen) return null;

  const secondsRemaining = Math.max(
    0,
    ((HOLD_DURATION_MS - (holdProgress / 100) * HOLD_DURATION_MS) / 1000)
  ).toFixed(1);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={isCancelling ? undefined : onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-sm sm:max-w-md w-full p-6 shadow-2xl border border-neutral-100 relative space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 font-display">
                Cancel Order
              </h3>
              <p className="text-xs text-neutral-400 font-mono">
                {orderNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isCancelling}
            className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors disabled:opacity-30"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Are you sure you want to cancel this order? Once cancelled, the items will be returned to inventory and cannot be recovered.
          </p>

          <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start space-x-2.5 text-amber-900 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              To prevent accidental cancellations, <strong>single click is disabled</strong>. Please <strong>press and hold the button for 3 seconds</strong>.
            </p>
          </div>
        </div>

        {/* 3-Second Hold-to-Cancel Button */}
        <div className="space-y-2">
          <div
            onMouseDown={handleHoldStart}
            onMouseUp={handleHoldEnd}
            onMouseLeave={handleHoldEnd}
            onTouchStart={handleHoldStart}
            onTouchEnd={handleHoldEnd}
            onTouchCancel={handleHoldEnd}
            style={{ touchAction: 'none' }}
            className={`relative overflow-hidden w-full h-14 rounded-2xl border-2 select-none cursor-pointer flex items-center justify-center transition-all ${
              isCancelling
                ? 'bg-neutral-100 border-neutral-300 cursor-not-allowed'
                : isHolding
                ? 'bg-red-100 border-red-600 scale-[0.99] shadow-inner'
                : 'bg-red-50 hover:bg-red-100/70 border-red-300'
            }`}
          >
            {/* Animated Progress Bar Filling Up */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-red-600 transition-all ease-linear"
              style={{ width: `${holdProgress}%` }}
            />

            {/* Label over progress */}
            <div className="relative z-10 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center space-x-2 pointer-events-none">
              {isCancelling ? (
                <span className="text-neutral-600">Cancelling Order...</span>
              ) : isHolding ? (
                <span className="text-white drop-shadow-sm font-mono">
                  Hold: {secondsRemaining}s remaining...
                </span>
              ) : (
                <span className="text-red-700 flex items-center space-x-1.5">
                  <span>Press & Hold (3s) to Cancel</span>
                </span>
              )}
            </div>
          </div>

          {/* Hint if released early */}
          {showHoldHint && (
            <p className="text-[11px] text-amber-700 text-center font-medium animate-pulse">
              ⚠️ Cancel aborted. You must keep holding continuously for 3 full seconds!
            </p>
          )}
        </div>

        {/* Keep Order Button */}
        <div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCancelling}
            className="w-full py-3 rounded-2xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-40"
          >
            Keep My Order (Don't Cancel)
          </button>
        </div>

      </div>
    </div>
  );
};
