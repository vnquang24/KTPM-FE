"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { MenuItem } from './type';
import {ChevronUp,
        PanelsTopLeft,
        ChevronDown,
        Home,
        LayoutDashboard,
        Users,
        Settings,
        FileText,
        Database,
        Activity
} from 'lucide-react';

const menuItems: MenuItem[] = [
  {
    icon: Home, 
    label: 'Tổng hợp trường thông tin',
    pathname: '/info-summary',
    subMenu: [
        { label: 'Thông tin người dùng', pathname: '/map' },
        { label: 'Thông tin sân tập', pathname: '/statistics' },
        { label: 'Thông tin nhân viên', pathname: '/incident-summary' },
      ],
  },
  {
    icon : Settings,
    label: 'Quản lý sân tập',
    pathname: '/playground-management',
  },
  {
    icon : Users,
    label: 'Quản lý người thuê',
    pathname: '/user-management',
  },
  {
    icon : LayoutDashboard,
    label: 'Danh mục dùng chung',
    pathname: '/common-categories',
  },
  {
    icon : FileText,
    label: 'Nhật ký hệ thống',
    pathname: '/system-log',
  },
  {
    icon : Database,
    label: 'Hệ thống và dữ liệu',
    pathname: '/system-data',
  },
];

const Sidebar: React.FC = () => {
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  const toggleSubMenu = (label: string) => {
    setOpenSubMenu((prev) => (prev === label ? null : label));
  };

  return (
    <div className="w-64 min-h-screen bg-white p-4">
      <Link href="/home" className="flex items-center gap-3 mb-4 px-2 pb-3 pt-3">
        <PanelsTopLeft size={32} className="text-blue-600" />
        <h1 className="text-xl font-bold text-gray-800 truncate">Pickelball App</h1>
      </Link>
      <ul className="space-y-2"> {/* Reduced from space-y-2 to space-y-1 */}
        {menuItems.map((item) => (
          <li key={item.label}>
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-all duration-200 ease-in-out">
              <Link 
                href={item.pathname} 
                className="flex items-center gap-3 text-black font-semibold text-base w-48 overflow-hidden"
              >
                {item.icon && <item.icon size={20} className="flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </Link>
              {item.subMenu && (
                <button 
                  onClick={() => toggleSubMenu(item.label)} 
                  className="text-gray-500 hover:text-gray-600 flex-shrink-0"
                >
                  {openSubMenu === item.label ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              )}
            </div>

            {item.subMenu && openSubMenu === item.label && (
              <ul className="ml-4 mt-0.5 space-y-0.5"> {/* Reduced spacing */}
                {item.subMenu.map((subItem) => (
                  <li key={subItem.label}>
                    <Link 
                      href={subItem.pathname} 
                      className="text-gray-700 hover:text-blue-600 text-base block p-1.5 rounded-md hover:bg-gray-50 transition-all duration-200 ease-in-out overflow-hidden"
                    >
                      <span className="truncate block">{subItem.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
