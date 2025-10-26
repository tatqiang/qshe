import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  padding = 'md'
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {(title || subtitle || actions) && (
        <div className={`border-b border-gray-200 ${paddingClasses[padding]} ${padding === 'none' ? 'p-4 sm:p-6' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              {title && (
                <h3 className="text-base sm:text-lg font-medium text-gray-900">{title}</h3>
              )}
              {subtitle && (
                <p className="mt-1 text-xs sm:text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                {actions}
              </div>
            )}
          </div>
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
    </div>
  );
};
