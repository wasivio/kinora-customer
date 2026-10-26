import React from 'react';

interface BrandLogoProps {
  variant?: 'light' | 'dark'; // 'light' is for white backgrounds; 'dark' is for dark/black backgrounds
  className?: string;
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'light',
  className = '',
  showTagline = true,
  size = 'md',
}) => {
  const isDark = variant === 'dark';

  // Sizing configurations
  const heightClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
  };

  return (
    <div className={`inline-flex items-center select-none ${heightClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 280 70"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto"
      >
        <defs>
          <linearGradient id={`atGold-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F59E0B" />
            <stop offset="45%" stopColor="#E8A048" />
            <stop offset="100%" stopColor="#C27803" />
          </linearGradient>
          <linearGradient id={`atShield-${variant}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isDark ? '#1F242D' : '#1E2024'} />
            <stop offset="100%" stopColor={isDark ? '#0C0E12' : '#0A0B0D'} />
          </linearGradient>
        </defs>

        {/* Crest Emblem (Left) */}
        <g transform="translate(6, 6)">
          {/* Outer Shield / Rounded Rect Base */}
          <rect
            x="1"
            y="1"
            width="56"
            height="56"
            rx="16"
            fill={`url(#atShield-${variant})`}
            stroke={`url(#atGold-${variant})`}
            strokeWidth="1.75"
          />

          {/* Fine Tailor Stitches Inner Border */}
          <rect
            x="5.5"
            y="5.5"
            width="47"
            height="47"
            rx="12"
            fill="none"
            stroke={`url(#atGold-${variant})`}
            strokeWidth="1"
            strokeDasharray="3.5,2"
            opacity="0.88"
          />

          {/* Sewing Needle (Vertical stem of T) */}
          <path
            d="M29 13 L29 45"
            stroke={`url(#atGold-${variant})`}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Needle Eye */}
          <ellipse
            cx="29"
            cy="18"
            rx="0.75"
            ry="2.2"
            fill={isDark ? '#0C0E12' : '#0A0B0D'}
            stroke={`url(#atGold-${variant})`}
            strokeWidth="0.8"
          />
          {/* Needle Point */}
          <polygon points="28,43 29,46 30,43" fill={`url(#atGold-${variant})`} />

          {/* Capital Letter A (Overlapping with T) */}
          <path
            d="M19 43 L29 16 L39 43"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Crossbar of A (Tailor's Golden Measuring Ribbon) */}
          <path
            d="M23 32 L35 32"
            stroke={`url(#atGold-${variant})`}
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Top Bar of T */}
          <path
            d="M17 16 L41 16"
            stroke={`url(#atGold-${variant})`}
            strokeWidth="2.6"
            strokeLinecap="round"
          />

          {/* Flowing Thread Through Needle Eye */}
          <path
            d="M29 18 C35 12, 44 14, 43 22 C41 28, 31 24, 23 27 C18 29, 17 36, 20 38"
            fill="none"
            stroke="#FEF08A"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="3.5,1.5"
            opacity="0.92"
          />

          {/* 4 Corner Tailor Studs */}
          <circle cx="10" cy="10" r="1.2" fill={`url(#atGold-${variant})`} />
          <circle cx="48" cy="10" r="1.2" fill={`url(#atGold-${variant})`} />
          <circle cx="10" cy="48" r="1.2" fill={`url(#atGold-${variant})`} />
          <circle cx="48" cy="48" r="1.2" fill={`url(#atGold-${variant})`} />
        </g>

        {/* Brand Typography: ASLAM TAILOR */}
        <g transform="translate(74, 9)">
          {/* Brand Name: ASLAM */}
          <text
            x="0"
            y="24"
            fontFamily="'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize="22"
            letterSpacing="2.5"
            fill={isDark ? '#FFFFFF' : '#0F172A'}
          >
            ASLAM
          </text>

          {/* Sub-brand: TAILOR in Premium Honey Gold */}
          <text
            x="1"
            y="41"
            fontFamily="'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="700"
            fontSize="12.5"
            letterSpacing="4.5"
            fill={`url(#atGold-${variant})`}
          >
            TAILOR
          </text>

          {/* Tagline: BESPOKE & LUXURY APPAREL */}
          {showTagline && (
            <text
              x="1"
              y="52"
              fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontWeight="600"
              fontSize="7"
              letterSpacing="2.2"
              fill={isDark ? '#94A3B8' : '#64748B'}
            >
              BESPOKE &amp; APPAREL
            </text>
          )}
        </g>
      </svg>
    </div>
  );
};
