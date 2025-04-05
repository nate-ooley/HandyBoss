import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from '../types';

interface ProfileCardProps {
  user: User;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
  return (
    <div className="mt-auto p-4 bg-accent bg-opacity-20 m-4 rounded-xl">
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-dark">{user.name}</h3>
          <p className="text-sm text-gray-500">{user.role}</p>
        </div>
      </div>
    </div>
  );
};
