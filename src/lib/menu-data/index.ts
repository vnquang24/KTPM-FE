import {
    Home,
    LayoutDashboard,
    Users,
    Settings,
    FileText,
    Database,
    Activity
  } from 'lucide-react';
  import { MenuItem } from '@/components/panel/menu-item/type';
  
  export const menuItems: MenuItem[] = [
    {
      icon: Home, 
      label: 'Thống kê và lịch biểu đặt sân',
      pathname: '/time-table',
    },
    {
      icon: Settings,
      label: 'Quản lý thông tin',
      pathname: '/playground-management',
      subMenu: [
        { 
          label: 'Thông tin người dùng', 
          pathname: '/user-manage',
          icon: Users,
        },
        { 
          label: 'Thông tin sân tập', 
          pathname: '/statistics',
          icon: Database
        },
        { 
          label: 'Thông tin nhân viên', 
          pathname: '/incident-summary',
          icon: Users
        },
      ],
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