import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { MenuItemProps } from './type';
import clsx from 'clsx';
import { useStoreState, useStoreActions } from '@/lib/redux/hook';

const MenuItemComponent: React.FC<MenuItemProps> = ({ item, depth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isShowSidebar = useStoreState(state => state.appState.isShowSidebar);

  return (
    <li>
      <div
      className={clsx(
          "flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-all duration-200 ease-in-out",
          {
            "justify-between": !isShowSidebar,
            "justify-center w-10": isShowSidebar,
            "ml-4": !isShowSidebar && depth === 1,
            "ml-8": !isShowSidebar && depth === 2,
            "ml-12": !isShowSidebar && depth === 3,
            "ml-16": !isShowSidebar && depth >= 4,
          }
        )}
      >
        <Link 
        href={item.pathname}
        className={clsx(
          "flex items-center gap-23",
          isShowSidebar ? "justify-center" : "w-48",
          "overflow-hidden"
        )}
      >
        {item.icon && (
          <item.icon 
            size={20 - depth * 2} 
            className="flex-shrink-0"
          />
        )}
        {!isShowSidebar && <span className="truncate">{item.label}</span>}
      </Link>
        {!isShowSidebar && item.subMenu && item.subMenu.length > 0 && (
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-500 hover:text-gray-600 flex-shrink-0"
          >
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        )}
      </div>

      {!isShowSidebar && isOpen && item.subMenu && (
        <ul className="mt-0.5">
          {item.subMenu.map((subItem) => (
            <MenuItemComponent 
              key={subItem.label}
              item={subItem}
              depth={depth + 1}
              isShowSidebar={isShowSidebar}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default MenuItemComponent;