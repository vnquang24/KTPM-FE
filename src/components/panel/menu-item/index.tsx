"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { MenuItemProps } from './type';
import clsx from 'clsx';
import { useStoreState } from '@/lib/redux/hook';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

const MenuItemComponent: React.FC<MenuItemProps> = ({ item, depth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isShowSidebar = useStoreState(state => state.appState.isShowSidebar);
  const pathname = usePathname();

  // Kiểm tra xem menu item có đang được chọn không
  const isActive = () => {
    // Exact match
    if (pathname === item.pathname) return true;
    
    // Nếu có submenu, không highlight parent menu khi chỉ có partial match
    // Chỉ highlight khi có exact match hoặc submenu item được chọn
    if (item.subMenu && item.subMenu.length > 0) {
      return item.subMenu.some(subItem => {
        if (pathname === subItem.pathname) return true;
        
        // Xử lý dynamic routes trong submenu
        if (subItem.pathname.includes('/sub-fields') && pathname.includes('/sub-fields/')) {
          return true;
        }
        
        return false;
      });
    }
    
    // Cho các menu không có submenu, kiểm tra partial match cho dynamic routes
    if (!item.subMenu || item.subMenu.length === 0) {
      // Kiểm tra các route đặc biệt
      if (item.pathname === '/customer/booking-history' && pathname.includes('/booking-details/')) {
        return true;
      }
      
      if (item.pathname === '/customer/profile' && pathname.includes('/customer/profile')) {
        return true;
      }
      
      if (item.pathname === '/owner/court-management' && pathname.includes('/court-management') && !pathname.includes('/sub-fields')) {
        return true;
      }
      
      // Partial match chung cho các route khác
      if (pathname.startsWith(item.pathname) && pathname !== '/') {
        return true;
      }
    }
    
    return false;
  };

  const isMenuActive = isActive();

  // Mở submenu nếu có item con đang active
  React.useEffect(() => {
    if (item.subMenu && item.subMenu.length > 0) {
      const hasActiveSubItem = item.subMenu.some(subItem => {
        if (pathname === subItem.pathname) return true;
        
        // Xử lý dynamic routes trong submenu
        if (subItem.pathname.includes('/sub-fields') && pathname.includes('/sub-fields/')) {
          return true;
        }
        
        return false;
      });
      
      if (hasActiveSubItem) {
        setIsOpen(true);
      }
    }
  }, [pathname, item.subMenu]);

  const getIconSize = (depth: number) => {
    if (depth === 0) return 22;
    if (depth === 1) return 9;
    return 14;
  };

  const handleItemClick = (e: React.MouseEvent) => {
    if (item.subMenu && item.subMenu.length > 0) {
      e.preventDefault(); // Ngăn chặn hành vi mặc định của Link
      setIsOpen(!isOpen);
    }
  };

  const menuItemContent = (
    <div
      className={clsx(
        "flex items-center gap-3 text-sm",
        isShowSidebar ? "justify-center" : "w-48",
        "overflow-hidden"
      )}
    >
      {item.icon && (
        <item.icon
          size={getIconSize(depth)}
          className={clsx(
            "flex-shrink-0",
            depth > 0 && "text-gray-500", // Màu nhạt hơn cho submenu
            isMenuActive && "text-white" // Màu trắng khi active
          )}
        />
      )}
      {!isShowSidebar && (
        <span className={clsx(
          "truncate",
          isMenuActive && "text-white font-medium" // Màu trắng và đậm khi active
        )}>
          {item.label}
        </span>
      )}
    </div>
  );

  const menuItemElement = item.subMenu && item.subMenu.length > 0 ? (
    <div
      onClick={handleItemClick}
      className={clsx(
        "flex items-center justify-between p-2 rounded-md transition-all duration-200 ease-in-out cursor-pointer",
        {
          "justify-between": !isShowSidebar,
          "justify-center w-10": isShowSidebar,
          "ml-4": !isShowSidebar && depth === 1,
          "ml-8": !isShowSidebar && depth === 2,
          "ml-12": !isShowSidebar && depth === 3,
          "ml-16": !isShowSidebar && depth >= 4,
          "bg-blue-600 text-white": isMenuActive, // Nền xanh khi active
          "hover:bg-gray-50": !isMenuActive, // Hover effect chỉ khi không active
        }
      )}
    >
      {menuItemContent}
      {!isShowSidebar && item.subMenu && item.subMenu.length > 0 && (
        <div className={clsx(
          "flex-shrink-0",
          isMenuActive ? "text-white" : "text-gray-500"
        )}>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      )}
    </div>
  ) : (
    <Link
      href={item.pathname}
      className={clsx(
        "flex items-center p-2 rounded-md transition-all duration-200 ease-in-out",
        {
          "justify-between": !isShowSidebar,
          "justify-center w-10": isShowSidebar,
          "ml-4": !isShowSidebar && depth === 1,
          "ml-8": !isShowSidebar && depth === 2,
          "ml-12": !isShowSidebar && depth === 3,
          "ml-16": !isShowSidebar && depth >= 4,
          "bg-blue-600 text-white": isMenuActive, // Nền xanh khi active
          "hover:bg-gray-50": !isMenuActive, // Hover effect chỉ khi không active
        }
      )}
    >
      {menuItemContent}
    </Link>
  );

  return (
    <div>
      <HoverCard openDelay={200} closeDelay={100}>
        <HoverCardTrigger asChild>
          {menuItemElement}
        </HoverCardTrigger>
        {isShowSidebar && (
          <HoverCardContent
            side="right"
            align="start"
            className="p-1 min-w-[100px]"
          >
            <div className="flex flex-col gap-2">
              <div className="font-medium text-sm">{item.label}</div>
            </div>
          </HoverCardContent>
        )}
      </HoverCard>
      
      {isOpen && item.subMenu && (
        <ul className="mt-0.5">
          {item.subMenu.map((subItem) => (
            <MenuItemComponent
              key={subItem.label}
              item={subItem}
              depth={depth + 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default MenuItemComponent;