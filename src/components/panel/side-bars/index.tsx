"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PanelsTopLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import MenuItemComponent from '../menu-item';
import { menuItems } from '@/lib/menu-data';
import { useStoreState, useStoreActions } from '@/lib/redux/hook';
import { getUserData, getUserRole } from '@/utils/auth';
import dynamic from 'next/dynamic';

type Role = 'ADMIN' | 'OWNER' | 'CUSTOMER';

const SidebarContent: React.FC = () => {
  const isShowSidebar = useStoreState(state => state.appState.isShowSidebar);
  const setIsShowSidebar = useStoreActions(actions => actions.appState.setIsShowSidebar);
  
  const [user, setUser] = useState<any>(null);
  const [sidebarMenuItems, setSidebarMenuItems] = useState<any[]>([]);

  useEffect(() => {
    const currentUser = getUserData();
    setUser(currentUser);
    
    if (currentUser) {
      const role = currentUser.role as Role;
      switch(role) {
        case 'ADMIN':
          setSidebarMenuItems(menuItems.admin);
          break;
        case 'OWNER':
          setSidebarMenuItems(menuItems.owner);
          break;
        case 'CUSTOMER':
          setSidebarMenuItems(menuItems.customer);
          break;
        default:
          setSidebarMenuItems([]);
      }
    }
  }, []);
  
  return (
    <div className={`${isShowSidebar ? 'w-16' : 'w-64'} min-h-screen bg-white p-4 transition-all duration-300 relative `}>
      <Link 
        href={user?.role === 'CUSTOMER' ? '/home' : user?.role === 'OWNER' ? '/home' : '/home'}
        className={`flex items-center ${
          isShowSidebar ? 'justify-center' : 'gap-3'
        } mb-4 px-2 pb-3 pt-3`}
      >
        <PanelsTopLeft size={32} className="text-blue-600 flex-shrink-0" />
        {!isShowSidebar && (
          <h1 className="text-xl font-bold text-gray-800 truncate">SPORT COURT</h1>
        )}
      </Link>
      
      <ul className="space-y-1">
        {sidebarMenuItems.map((item) => (
          <MenuItemComponent 
            key={item.label}
            item={item}
            depth={0}
          />
        ))}
      </ul>

      <button
        onClick={() => setIsShowSidebar(!isShowSidebar)}
        className="absolute -right-4 top-1/2 transform -translate-y-1/2 bg-white p-1 rounded-full shadow-md hover:bg-gray-50"
      >
        {isShowSidebar ? (
          <ChevronRight size={20} className="text-gray-600" />
        ) : (
          <ChevronLeft size={20} className="text-gray-600" />
        )}
      </button>
    </div>
  );
};

const Sidebar = dynamic(() => Promise.resolve(SidebarContent), {
  ssr: false
});

export default Sidebar;