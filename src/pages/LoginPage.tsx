import React, { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { user, loginWithGoogle, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';

  useEffect(() => {
    if (user && !isLoading) {
      navigate(redirectPath);
    }
  }, [user, isLoading, navigate, redirectPath]);

  const handleGoogleSignIn = async () => {
    try {
      await loginWithGoogle();
      toast.success('Welcome to KINORA');
      navigate(redirectPath);
    } catch (error: any) {
      console.error('Sign-in error:', error);
      toast.error(error?.message || 'Google sign-in could not be completed');
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-16 bg-[#FAFAFC]">
      <div className="w-full max-w-md bg-white border border-neutral-100 rounded-3xl p-8 sm:p-10 shadow-[0_4px_25px_rgba(0,0,0,0.03)] text-center space-y-6">
        
        {/* Brand Logo */}
        <div className="flex justify-center">
          <Link to="/">
            <img
              src="/LOGO.png"
              alt="KINORA"
              className="h-10 w-auto object-contain hover:opacity-90 transition-opacity"
            />
          </Link>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight font-display">
            Sign In to KINORA
          </h1>
          <p className="text-xs text-neutral-400 mt-1.5 leading-relaxed">
            Fashion confidence and reveals beauty. Access your orders, wishlist, and seamless checkout.
          </p>
        </div>

        {/* Google Sign In Button */}
        <div className="pt-2">
          <button
            onClick={handleGoogleSignIn}
            className="w-full py-3.5 px-6 rounded-full bg-honey hover:bg-honey-600 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center space-x-3 active:scale-[0.99]"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.344-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="pt-3 border-t border-neutral-50 flex items-center justify-center space-x-1.5 text-[11px] text-neutral-400">
          <ShieldCheck className="w-3.5 h-3.5 text-honey" />
          <span>Verified & encrypted single-tap login</span>
        </div>

        <div>
          <Link
            to="/"
            className="inline-flex items-center space-x-1 text-xs text-neutral-400 hover:text-honey transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Back to Store</span>
          </Link>
        </div>

      </div>
    </div>
  );
};
