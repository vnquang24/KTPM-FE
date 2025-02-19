"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { PanelsTopLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import MenuItemComponent from '../menu-item';
import { menuItems } from '@/lib/menu-data';
import { useStoreState, useStoreActions } from '@/lib/redux/hook';

const Sidebar: React.FC = () => {
  const isShowSidebar = useStoreState(state => state.appState.isShowSidebar);
  const setIsShowSidebar = useStoreActions(actions => actions.appState.setIsShowSidebar);
  
  return (
    <div className={`${isShowSidebar ? 'w-16' : 'w-64'} min-h-screen bg-white p-4 transition-all duration-300 relative `}>
      {/* Logo và tên app */}
    <Link 
      href="/home" 
      className={`flex items-center ${
        isShowSidebar ? 'justify-center' : 'gap-3'
      } mb-4 px-2 pb-3 pt-3`}
    >
      <PanelsTopLeft size={32} className="text-blue-600 flex-shrink-0" />
      {!isShowSidebar && (
        <h1 className="text-xl font-bold text-gray-800 truncate">Pickelball App</h1>
      )}
    </Link>
    
      {/* Menu Items */}
      <ul className="space-y-1">
        {menuItems.map((item) => (
          <MenuItemComponent 
            key={item.label}
            item={item}
            depth={0}
            isShowSidebar={isShowSidebar}
          />
        ))}
      </ul>

      {/* Toggle Button */}
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

export default Sidebar;