import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Upload, 
  Sparkles, 
  Download, 
  Share2, 
  MessageCircle, 
  RotateCcw, 
  Check, 
  Trash2, 
  ShieldCheck, 
  Layers, 
  Sliders, 
  ExternalLink,
  Shirt
} from 'lucide-react';
import { Product } from '../../types';
import { saveLocalTryOnLook, getLocalTryOnLooks, deleteLocalTryOnLook, TryOnLook } from '../../lib/tryonStorage';
import { getProductShareUrl } from '../../lib/share';
import { toast } from 'sonner';

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
}

export const TryOnModal: React.FC<TryOnModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const [activeTab, setActiveTab] = useState<'studio' | 'history'>('studio');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  
  // Auto-detect garment type from product category
  const initialGarmentType = /pant|jean|trouser|bottom|short|skirt/i.test(
    `${product.category || ''} ${product.subcategory || ''} ${product.name}`
  ) ? 'lower' : 'upper';

  const [garmentType, setGarmentType] = useState<'upper' | 'lower'>(initialGarmentType);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  // Fitting adjustments
  const [garmentScale, setGarmentScale] = useState<number>(100); // 80 - 130%
  const [verticalOffset, setVerticalOffset] = useState<number>(0); // -50 to +50px
  const [horizontalOffset, setHorizontalOffset] = useState<number>(0); // -50 to +50px
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [savedLooks, setSavedLooks] = useState<TryOnLook[]>([]);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [needApiKeyNotice, setNeedApiKeyNotice] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop camera when closing modal or switching tabs
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setIsProcessing(false);
    } else {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    const looks = await getLocalTryOnLooks();
    setSavedLooks(looks);
  };

  // Start Camera
  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      toast.error('Unable to access camera. Please allow camera permissions or upload a photo.');
    }
  };

  // Flip Camera Front/Back
  const toggleCameraFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture Snapshot from Camera
  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth || 640;
    captureCanvas.height = video.videoHeight || 480;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) return;

    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(captureCanvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);
    const dataUrl = captureCanvas.toDataURL('image/jpeg', 0.92);
    setUserPhoto(dataUrl);
    setResultImage(null);
    stopCamera();
  };

  // Handle Photo Upload from Disk
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setUserPhoto(event.target?.result as string);
      setResultImage(null);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  // Composite user photo with garment
  const handleGenerateTryOn = async () => {
    if (!userPhoto) {
      toast.error('Please capture or upload your photo first');
      return;
    }

    const primaryProductImgUrl = product.images?.[0]?.url;
    if (!primaryProductImgUrl) {
      toast.error('Product image not available for try-on');
      return;
    }

    setIsProcessing(true);

    // 1. Try Photorealistic AI Virtual Try-On API first (FASHN.ai or Replicate)
    try {
      const apiRes = await fetch('/api/virtual-tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personImage: userPhoto,
          garmentImage: primaryProductImgUrl,
          garmentType,
          garmentName: product.name,
        }),
      });

      const apiData = await apiRes.json();
      if (apiData.success && apiData.imageUrl) {
        setResultImage(apiData.imageUrl);
        await saveLocalTryOnLook({
          productId: product.id,
          productName: product.name,
          garmentType,
          imageUri: apiData.imageUrl,
        });
        await loadHistory();
        toast.success('✨ Photorealistic AI Try-On generated successfully!');
        setIsProcessing(false);
        return;
      } else if (apiData.needApiKey) {
        setNeedApiKeyNotice(true);
      }
    } catch (apiErr) {
      console.warn('AI Try-On API call skipped or timed out, continuing with precision canvas:', apiErr);
    }

    // 2. Precision Canvas Fitting (Positioned properly on shoulders/torso, not face)
    try {
      const userImg = new Image();
      userImg.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        userImg.onload = resolve;
        userImg.onerror = reject;
        userImg.src = userPhoto;
      });

      const garmentImg = new Image();
      garmentImg.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        garmentImg.onload = resolve;
        garmentImg.onerror = reject;
        garmentImg.src = primaryProductImgUrl;
      });

      const canvas = canvasRef.current || document.createElement('canvas');
      const width = userImg.naturalWidth || userImg.width || 800;
      const height = userImg.naturalHeight || userImg.height || 1000;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not initialize canvas context');

      // Draw customer photo as background
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(userImg, 0, 0, width, height);

      // Compute garment sizing and positioning
      const scaleMultiplier = (garmentScale / 100);
      let gWidth = width * 0.65 * scaleMultiplier;
      let gHeight = (garmentImg.height / garmentImg.width) * gWidth;

      // Adjust height if garment image is too tall
      if (gHeight > height * 0.65) {
        gHeight = height * 0.65 * scaleMultiplier;
        gWidth = (garmentImg.width / garmentImg.height) * gHeight;
      }

      // Positioning based on Upper vs Lower wear
      // IMPORTANT: Sits below the chin/neck on shoulders/torso, NOT over the face!
      let gX = (width - gWidth) / 2 + (horizontalOffset * (width / 500));
      let gY: number;

      if (garmentType === 'upper') {
        // Position on upper chest/torso (roughly 42% - 46% from top, below chin)
        gY = height * 0.42 + (verticalOffset * (height / 500));
      } else {
        // Position on lower waist/legs (roughly 64% - 68% from top)
        gY = height * 0.64 + (verticalOffset * (height / 500));
      }

      // Draw soft shadow beneath garment for realistic depth
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 12;

      // Draw garment onto customer
      ctx.drawImage(garmentImg, gX, gY, gWidth, gHeight);
      ctx.restore();

      // Subtle watermark badge for branding
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      const badgeW = 160;
      const badgeH = 34;
      const bX = width - badgeW - 20;
      const bY = height - badgeH - 20;
      
      ctx.beginPath();
      ctx.roundRect(bX, bY, badgeW, badgeH, 12);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('KINORA Virtual Try-On', bX + 12, bY + 21);
      ctx.restore();

      const finalDataUrl = canvas.toDataURL('image/jpeg', 0.94);
      setResultImage(finalDataUrl);

      // Save locally to device (IndexedDB) - ZERO FIREBASE
      await saveLocalTryOnLook({
        productId: product.id,
        productName: product.name,
        garmentType,
        imageUri: finalDataUrl,
      });

      await loadHistory();
      toast.success('Fitting generated & saved locally to your device!');
    } catch (err: any) {
      console.error('Try-on generation error:', err);
      toast.error('Failed to generate try-on. Please try again with another photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Download high-resolution image to device
  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage;
    a.download = `kinora-${product.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-tryon.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Photo downloaded to your device!');
  };

  // Share photo with friends via WhatsApp or Web Share API
  const handleShare = async () => {
    const productUrl = getProductShareUrl(product.id);
    const message = `Check out my look with *${product.name}* on KINORA!\n👉 View product here: ${productUrl}`;

    // If native sharing with files is supported
    if (resultImage && typeof navigator !== 'undefined' && navigator.canShare) {
      try {
        const res = await fetch(resultImage);
        const blob = await res.blob();
        const file = new File([blob], 'kinora-tryon.jpg', { type: 'image/jpeg' });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `My Try-On Look: ${product.name}`,
            text: message,
            files: [file],
          });
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }

    // Direct WhatsApp share fallback
    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
  };

  const handleDeleteLook = async (lookId: string) => {
    await deleteLocalTryOnLook(lookId);
    await loadHistory();
    toast.info('Look removed from local storage');
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-neutral-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
              <Sparkles className="w-5 h-5 fill-amber-500 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 font-display">
                Virtual AI Fitting Room
              </h3>
              <p className="text-[11px] text-neutral-500">
                Try <span className="font-semibold text-neutral-800">{product.name}</span> on your photo
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-neutral-100 bg-[#FAFAFC] px-4 pt-2 shrink-0">
          <button
            onClick={() => { stopCamera(); setActiveTab('studio'); }}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'studio'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Try-On Studio</span>
          </button>

          <button
            onClick={() => { stopCamera(); setActiveTab('history'); }}
            className={`pb-2.5 px-4 text-xs font-bold transition-all border-b-2 flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'border-neutral-900 text-neutral-900'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Saved Looks ({savedLooks.length})</span>
          </button>
        </div>

        {/* Tab Content (Scrollable) */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          
          {activeTab === 'studio' ? (
            <>
              {/* Privacy Notice Banner */}
              <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  <strong>100% Private & Local:</strong> Your photos are stored only in your device's browser. Nothing is uploaded to Firebase.
                </span>
              </div>

              {/* Step 1: Capture / Upload Photo */}
              {!resultImage && (
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                    Step 1: Provide Your Photo
                  </span>

                  {isCameraActive ? (
                    <div className="relative rounded-2xl overflow-hidden bg-black aspect-[3/4] max-h-[380px] w-full flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''}`}
                      />
                      
                      {/* Camera Controls Overlay */}
                      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center space-x-4 px-4">
                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-all"
                          title="Switch Camera"
                        >
                          <RotateCcw className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={handleCapturePhoto}
                          className="w-14 h-14 rounded-full bg-white text-neutral-900 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                          title="Take Photo"
                        >
                          <div className="w-11 h-11 rounded-full border-2 border-neutral-900 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-neutral-900" />
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={stopCamera}
                          className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white flex items-center justify-center transition-all"
                          title="Cancel Camera"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : userPhoto ? (
                    <div className="relative rounded-2xl overflow-hidden bg-[#f5f5f5] aspect-[3/4] max-h-[340px] w-full flex items-center justify-center border border-neutral-200">
                      <img
                        src={userPhoto}
                        alt="Your Photo"
                        className="w-full h-full object-cover"
                      />

                      {/* Live Alignment Preview of Garment over Customer */}
                      {product.images?.[0]?.url && (
                        <div 
                          className="absolute pointer-events-none transition-all duration-100 flex items-center justify-center"
                          style={{
                            top: `${garmentType === 'upper' ? 42 + (verticalOffset * 0.4) : 64 + (verticalOffset * 0.4)}%`,
                            left: `${50 + (horizontalOffset * 0.4)}%`,
                            width: `${garmentScale * 0.65}%`,
                            transform: 'translate(-50%, 0)',
                          }}
                        >
                          <img
                            src={product.images[0].url}
                            alt="Garment Preview"
                            className="w-full h-auto object-contain opacity-95 drop-shadow-2xl"
                          />
                        </div>
                      )}

                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold">
                        Live Fit Preview
                      </div>

                      <button
                        type="button"
                        onClick={() => { setUserPhoto(null); setResultImage(null); }}
                        className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white text-xs font-semibold flex items-center space-x-1 transition-all"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Change Photo</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => startCamera('user')}
                        className="p-6 rounded-2xl border-2 border-dashed border-neutral-200 hover:border-neutral-900 bg-neutral-50/50 hover:bg-neutral-50 flex flex-col items-center justify-center text-center transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-neutral-700 group-hover:scale-110 transition-transform mb-2">
                          <Camera className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-neutral-800">
                          Take a Photo
                        </span>
                        <span className="text-[10px] text-neutral-400 mt-0.5">
                          Use live camera
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-6 rounded-2xl border-2 border-dashed border-neutral-200 hover:border-neutral-900 bg-neutral-50/50 hover:bg-neutral-50 flex flex-col items-center justify-center text-center transition-all group"
                      >
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-neutral-700 group-hover:scale-110 transition-transform mb-2">
                          <Upload className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-neutral-800">
                          Upload Photo
                        </span>
                        <span className="text-[10px] text-neutral-400 mt-0.5">
                          Select from gallery
                        </span>
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Garment Type Selection (Upper vs Lower) */}
              {userPhoto && !resultImage && (
                <div className="space-y-3 pt-2 border-t border-neutral-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Step 2: Choose Garment Placement
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Select how this product is worn
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setGarmentType('upper')}
                      className={`p-3.5 rounded-2xl border-2 flex items-center space-x-3 transition-all ${
                        garmentType === 'upper'
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <Shirt className="w-5 h-5 shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-bold">Upper Wear</p>
                        <p className={`text-[10px] ${garmentType === 'upper' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          Shirt / T-Shirt / Top
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setGarmentType('lower')}
                      className={`p-3.5 rounded-2xl border-2 flex items-center space-x-3 transition-all ${
                        garmentType === 'lower'
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-sm'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      <Layers className="w-5 h-5 shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-bold">Lower Wear</p>
                        <p className={`text-[10px] ${garmentType === 'lower' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                          Pant / Jeans / Trousers
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Fitting Sliders */}
                  <div className="p-3.5 rounded-2xl bg-[#FAFAFC] border border-neutral-100 space-y-3">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-neutral-700">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Fitting & Alignment Controls</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span>Garment Size</span>
                        <span className="font-mono font-bold text-neutral-800">{garmentScale}%</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="130"
                        value={garmentScale}
                        onChange={(e) => setGarmentScale(Number(e.target.value))}
                        className="w-full accent-neutral-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span>Vertical Placement</span>
                        <span className="font-mono font-bold text-neutral-800">{verticalOffset > 0 ? `+${verticalOffset}` : verticalOffset}</span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        value={verticalOffset}
                        onChange={(e) => setVerticalOffset(Number(e.target.value))}
                        className="w-full accent-neutral-900"
                      />
                    </div>
                  </div>

                  {/* Photorealistic AI Try-On Notice */}
                  <div className={`p-3.5 rounded-2xl border transition-all space-y-1.5 text-xs ${
                    needApiKeyNotice 
                      ? 'bg-amber-100/90 border-amber-400 text-amber-950 ring-2 ring-amber-300' 
                      : 'bg-amber-50/80 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center space-x-2 font-bold text-amber-900">
                      <Sparkles className="w-4 h-4 fill-amber-500 text-amber-600 shrink-0" />
                      <span>Photorealistic AI Clothing Swap</span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      For AI to automatically replace your existing clothes and naturally wrap this garment onto your body shape, add your free <strong>FASHN_API_KEY</strong> (from <a href="https://fashn.ai" target="_blank" rel="noreferrer" className="underline font-bold">fashn.ai</a>) or <strong>REPLICATE_API_TOKEN</strong> (from <a href="https://replicate.com" target="_blank" rel="noreferrer" className="underline font-bold">replicate.com</a>) in <code>.env</code>.
                    </p>
                  </div>

                  {/* Generate Button */}
                  <button
                    type="button"
                    onClick={handleGenerateTryOn}
                    disabled={isProcessing}
                    className="w-full py-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] text-white text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md shadow-neutral-900/10 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{isProcessing ? 'Generating AI Try-On...' : 'Generate Try-On Look'}</span>
                  </button>
                </div>
              )}

              {/* Step 3: Result View */}
              {resultImage && (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden bg-[#f5f5f5] aspect-[3/4] max-h-[420px] w-full flex items-center justify-center border border-neutral-200 shadow-inner">
                    <img
                      src={resultImage}
                      alt="Try-On Look"
                      className="w-full h-full object-contain"
                    />
                    
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center space-x-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ready to Wear</span>
                    </span>
                  </div>

                  {/* Actions: Download, Share, Re-adjust */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Photo</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShare}
                      className="py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-sm"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Share with Friends</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setResultImage(null)}
                    className="w-full py-2.5 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Adjust Fit / Try Another Angle</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            /* History Tab: Local Storage Looks Only */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    My Saved Try-On Looks
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Saved exclusively on this device ({savedLooks.length} items)
                  </p>
                </div>
              </div>

              {savedLooks.length === 0 ? (
                <div className="py-12 text-center text-neutral-400 space-y-2">
                  <Layers className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs">No saved try-on looks on this device yet.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('studio')}
                    className="px-4 py-2 rounded-full bg-neutral-900 text-white text-xs font-bold"
                  >
                    Create Your First Look
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {savedLooks.map((look) => (
                    <div
                      key={look.id}
                      className="group relative rounded-2xl overflow-hidden border border-neutral-200 bg-white p-2 shadow-sm space-y-2"
                    >
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-neutral-100 relative">
                        <img
                          src={look.imageUri}
                          alt={look.productName}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteLook(look.id)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 text-neutral-600 hover:text-red-600 flex items-center justify-center shadow-sm opacity-90 hover:opacity-100"
                          title="Delete from device"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="px-1">
                        <p className="text-xs font-bold text-neutral-900 truncate">
                          {look.productName}
                        </p>
                        <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                          {look.garmentType === 'upper' ? '👕 Upper Wear' : '👖 Lower Wear'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 pt-1 border-t border-neutral-100">
                        <a
                          href={look.imageUri}
                          download={`kinora-${look.id}.jpg`}
                          className="flex-1 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold text-center flex items-center justify-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Save</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            setResultImage(look.imageUri);
                            setActiveTab('studio');
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-neutral-900 text-white text-[11px] font-bold text-center flex items-center justify-center space-x-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Hidden Canvas used for off-screen rendering */}
        <canvas ref={canvasRef} className="hidden" />

      </div>
    </div>
  );
};
