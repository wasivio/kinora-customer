import React from 'react';

export const ProductSkeleton: React.FC = () => {
  return (
    <div className="group rounded-xl border border-neutral-200 bg-white p-3 sm:p-4 animate-pulse">
      <div className="w-full aspect-[3/4] bg-neutral-100 rounded-lg mb-3"></div>
      <div className="h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-neutral-100 rounded w-1/2 mb-3"></div>
      <div className="flex items-center justify-between pt-1">
        <div className="h-5 bg-neutral-200 rounded w-20"></div>
        <div className="h-8 bg-neutral-100 rounded-lg w-8"></div>
      </div>
    </div>
  );
};

export const BannerSkeleton: React.FC = () => {
  return (
    <div className="w-full h-[320px] sm:h-[450px] md:h-[550px] bg-neutral-100 animate-pulse rounded-2xl flex items-center justify-center">
      <div className="w-1/2 space-y-4 px-6 text-center">
        <div className="h-8 sm:h-12 bg-neutral-200 rounded-lg w-3/4 mx-auto"></div>
        <div className="h-4 bg-neutral-200 rounded w-1/2 mx-auto"></div>
        <div className="h-10 bg-neutral-300 rounded-full w-32 mx-auto mt-4"></div>
      </div>
    </div>
  );
};

export const CategorySkeleton: React.FC = () => {
  return (
    <div className="flex flex-col items-center space-y-2 animate-pulse">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-neutral-200"></div>
      <div className="h-3 bg-neutral-200 rounded w-16"></div>
    </div>
  );
};
