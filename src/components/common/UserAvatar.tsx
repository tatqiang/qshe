import { User } from 'lucide-react';
import type { User as UserType } from '../../types';

interface UserAvatarProps {
  user?: UserType;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export function UserAvatar({ 
  user, 
  size = 'md', 
  showName = true, 
  className = '' 
}: UserAvatarProps) {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (!user) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`${sizeClasses[size]} bg-gray-200 rounded-full flex items-center justify-center`}>
          <User className="w-3 h-3 text-gray-500" />
        </div>
        {showName && (
          <span className={`text-gray-500 ${textSizeClasses[size]}`}>
            Unknown User
          </span>
        )}
      </div>
    );
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.email;

  const initials = user.firstName && user.lastName
    ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    : user.email.charAt(0).toUpperCase();

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Avatar */}
      <div className={`${sizeClasses[size]} bg-blue-500 rounded-full flex items-center justify-center overflow-hidden`}>
        {user.profilePhotoUrl ? (
          <img
            src={user.profilePhotoUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if image fails to load
              e.currentTarget.style.display = 'none';
              const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
              if (nextElement) {
                nextElement.style.display = 'flex';
              }
            }}
          />
        ) : null}
        <div 
          className={`w-full h-full flex items-center justify-center text-white font-medium ${textSizeClasses[size]} ${user.profilePhotoUrl ? 'hidden' : ''}`}
        >
          {initials}
        </div>
      </div>

      {/* Name */}
      {showName && (
        <div className="flex flex-col">
          <span className={`font-medium text-gray-900 ${textSizeClasses[size]}`}>
            {displayName}
          </span>
          {user.role && (
            <span className={`text-gray-500 ${size === 'lg' ? 'text-xs' : 'text-xs'}`}>
              {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
