import React from 'react';
import { User as UserIcon } from 'lucide-react';
import { HeaderProps } from './type';

const Header: React.FC<HeaderProps> = ({ pathName, user }) => {
  return (
    <header className="flex justify-between items-center p-4 bg-white shadow-md rounded-xl">
      <div className="text-blue-500 text-xl font-bold">{pathName}</div>
      <div className="flex items-center space-x-3">
        <span className="text-gray-700 text-lg">{user.name}</span>
        <div className="w-8 h-8">
          {user.icon ? (
            <img
              src={user.icon as string}
              alt="User Avatar"
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <UserIcon className="w-full h-full text-gray-500" />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
