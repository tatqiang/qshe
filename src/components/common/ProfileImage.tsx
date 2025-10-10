import React, { useState } from 'react';
import { convertToPublicUrl } from '../../lib/storage/r2Client';

interface ProfileImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackInitials?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const ProfileImage: React.FC<ProfileImageProps> = ({
  src,
  alt,
  className = '',
  fallbackInitials = '??',
  size = 'md'
}) => {
  const [imageError, setImageError] = useState(false);

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl'
  };

  const handleImageError = () => {
    console.warn('Failed to load profile image:', src);
    setImageError(true);
  };

  // Convert old private URLs to public format
  const imageUrl = src ? convertToPublicUrl(src) : null;
  
  // Debug logging
  if (src && imageUrl && src !== imageUrl) {
    console.log('🔄 URL Conversion:', {
      original: src,
      converted: imageUrl
    });
  }
  
  const shouldShowImage = imageUrl && !imageError;

  return (
    <div className={`${shouldShowImage ? 'bg-gray-200' : 'bg-blue-500'} rounded-full flex items-center justify-center overflow-hidden ${sizeClasses[size]} ${className}`}>
      {shouldShowImage ? (
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          onError={handleImageError}
        />
      ) : (
        <span className="text-white font-medium">
          {fallbackInitials}
        </span>
      )}
    </div>
  );
};
