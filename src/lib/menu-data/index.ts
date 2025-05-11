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
  BarChart2
} from 'lucide-react';
import { MenuItem } from '@/components/panel/menu-item/type';

// Menu dành cho khách hàng (customer)
export const customerMenuItems: MenuItem[] = [
  {
    icon: Home,
    label: 'Trang chủ',
    pathname: '/customer/home',
  },
  {
    icon: Search,
    label: 'Tìm kiếm sân',
    pathname: '/customer/court-search',
  },
  {
    icon: Calendar,
    label: 'Đặt sân',
    pathname: '/customer/booking',
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
  {
    icon: User,
    label: 'Thông tin cá nhân',
    pathname: '/customer/profile',
  },
];

// Menu dành cho chủ sân (owner)
export const ownerMenuItems: MenuItem[] = [
  {
    icon: BarChart2,
    label: 'Thống kê sân',
    pathname: '/owner/court-stats',
  },
  {
    icon: LayoutDashboard,
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
];

// Menu dành cho quản trị viên (admin)
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

// Export mặc định tất cả menu items
export const menuItems = {
  admin: adminMenuItems,
  owner: ownerMenuItems,
  customer: customerMenuItems
};