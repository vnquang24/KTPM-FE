import {
  Home,
  Search,
  Calendar,
  User,
  Settings,
  History,
  Star,
  DollarSign,
  Users,
  ShieldAlert,
  PieChart,
  ClipboardList,
  LayoutDashboard,
  Clock,
  CheckSquare,
  BarChart2,
  Building2
} from 'lucide-react';
import { MenuItem } from '@/components/panel/menu-item/type';

export const customerMenuItems: MenuItem[] = [
  {
    icon: User,
    label: 'Tài khoản',
    pathname: '/customer/profile',
  },
  {
    icon: History,
    label: 'Lịch sử đặt sân',
    pathname: '/customer/booking-history',
  },
  {
    icon: Star,
    label: 'Đánh giá sân',
    pathname: '/customer/rating',
  },
];

export const ownerMenuItems: MenuItem[] = [
  {
    icon: BarChart2,
    label: 'Thống kê sân',
    pathname: '/owner/court-stats',
  },
  {
    icon: Building2,
    label: 'Quản lý sân',
    pathname: '/owner/court-management',
  },
  {
    icon: Clock,
    label: 'Quản lý lịch hoạt động',
    pathname: '/owner/schedule',
  },
  {
    icon: CheckSquare,
    label: 'Quản lý đặt sân',
    pathname: '/owner/booking-management',
  },
  {
    icon: Star,
    label: 'Theo dõi đánh giá sân',
    pathname: '/owner/reviews',
  }
];

export const adminMenuItems: MenuItem[] = [
  {
    icon: Users,
    label: 'Quản lý người dùng',
    pathname: '/admin/users',
  },
  {
    icon: PieChart,
    label: 'Thống kê hệ thống',
    pathname: '/admin/statistics',
  },
];

export const menuItems = {
  admin: adminMenuItems,
  owner: ownerMenuItems,
  customer: customerMenuItems
}; 