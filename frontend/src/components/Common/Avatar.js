import React from 'react';
import { getInitials, generateColor } from '../../utils/helpers';

const Avatar = ({ user, size = 'md', showOnline = false, className = '' }) => {
  const sizes = {
    xs: 'w-8 h-8 text-xs',
    sm: 'w-10 h-10 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-20 h-20 text-2xl',
  };

  const onlineSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className={`${sizes[size]} rounded-full object-cover border-2 border-white dark:border-gray-700`}
        />
      ) : (
        <div
          className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white border-2 border-white dark:border-gray-700`}
          style={{ backgroundColor: generateColor(user?.name || user?.email || 'User') }}
        >
          {getInitials(user?.name || user?.email)}
        </div>
      )}
      
      {showOnline && user?.isOnline && (
        <span className={`absolute bottom-0 right-0 ${onlineSizes[size]} bg-green-500 border-2 border-white dark:border-gray-800 rounded-full`}></span>
      )}
    </div>
  );
};

export default Avatar;