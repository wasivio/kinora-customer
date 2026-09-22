import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  actionLink,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 my-8 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/50">
      <div className="w-16 h-16 rounded-full bg-neutral-200/80 flex items-center justify-center mb-4 text-neutral-800">
        <Icon className="w-8 h-8 stroke-[1.5]" />
      </div>
      <h3 className="text-xl font-semibold text-neutral-900 mb-2 font-display tracking-tight">
        {title}
      </h3>
      <p className="text-neutral-500 max-w-md text-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && (
        actionLink ? (
          <Link
            to={actionLink}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-all duration-200 shadow-sm"
          >
            {actionText}
          </Link>
        ) : (
          <button
            onClick={onAction}
            className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-all duration-200 shadow-sm"
          >
            {actionText}
          </button>
        )
      )}
    </div>
  );
};
