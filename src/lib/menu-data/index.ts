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
      label: 'Tổng hợp trường thông tin',
      pathname: '/info-summary',
      subMenu: [
        { 
          label: 'Thông tin người dùng', 
          pathname: '/map',
          icon: Users,
          subMenu: [
            {
              label: 'Danh sách người dùng',
              pathname: '/user-list',
              icon: Activity
            },
            {
              label: 'Thống kê người dùng',
              pathname: '/user-stats',
              icon: FileText
            }
          ]
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
      icon: Settings,
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