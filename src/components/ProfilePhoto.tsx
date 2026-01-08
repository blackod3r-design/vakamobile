import React, { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfilePhotoProps {
  isCollapsed?: boolean;
}

export function ProfilePhoto({ isCollapsed = false }: ProfilePhotoProps) {
  const [profilePhoto, setProfilePhoto] = useState<string>(() => {
    return localStorage.getItem('profile-photo') || '';
  });

  useEffect(() => {
    const handleStorageChange = () => {
      setProfilePhoto(localStorage.getItem('profile-photo') || '');
    };
    
    window.addEventListener('storage-update', handleStorageChange);
    return () => window.removeEventListener('storage-update', handleStorageChange);
  }, []);

  const size = isCollapsed ? 'w-30 h-30' : 'w-50 h-50';

  return (
    <div className="flex justify-center">
      <div className={cn('rounded-full overflow-hidden border-2 border-border', size)}>
        {profilePhoto ? (
          <img
            src={profilePhoto}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full gradient-primary flex items-center justify-center">
            <User className={cn('text-white', isCollapsed ? 'w-15 h-15' : 'w-25 h-25')} />
          </div>
        )}
      </div>
    </div>
  );
}
