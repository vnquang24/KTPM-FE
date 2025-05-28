'use client';
import React, { useState, useEffect } from 'react';
import {
  useFindManyField,
  useFindManyBooking,
  useFindManyAccount,
  useFindManyCustomUser,
  useFindManyOwner
} from '@/generated/hooks';
import { Role } from '@prisma/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const generateMonthlyStats = (bookings: any[] | undefined, timeRange: string, customStartDate?: Date, customEndDate?: Date) => {
  if (!bookings || bookings.length === 0) return [];

  console.log('Generating stats for:', timeRange, 'with', bookings.length, 'bookings');

  const now = new Date();
  let months: any[] = [];

  // Helper function để lấy ngày từ booking (ưu tiên date, fallback beginTime)
  const getBookingDate = (booking: any) => {
    return booking.date ? new Date(booking.date) : new Date(booking.beginTime);
  };

  switch (timeRange) {
    case 'last-7-days':
      // Tạo data cho 7 ngày qua
      months = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (6 - i));
        return { 
          name: `${date.getDate()}/${date.getMonth() + 1}`, 
          bookings: 0, 
          revenue: 0,
          date: date.toDateString()
        };
      });
      
      bookings.forEach(booking => {
        const bookingDate = getBookingDate(booking);
        const bookingDateStr = bookingDate.toDateString();
        const monthIndex = months.findIndex(m => m.date === bookingDateStr);
        if (monthIndex !== -1) {
          months[monthIndex].bookings += 1;
          if (booking.status && booking.status.toLowerCase() === 'paid') {
            months[monthIndex].revenue += booking.price || 0;
          }
        }
      });
      break;

    case 'last-30-days':
      // Tạo data cho 30 ngày qua, hiển thị theo từng ngày
      months = Array.from({ length: 30 }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (29 - i));
        return { 
          name: `${date.getDate()}/${date.getMonth() + 1}`, 
          bookings: 0, 
          revenue: 0,
          date: date.toDateString()
        };
      });
      
      bookings.forEach(booking => {
        const bookingDate = getBookingDate(booking);
        const bookingDateStr = bookingDate.toDateString();
        const monthIndex = months.findIndex(m => m.date === bookingDateStr);
        if (monthIndex !== -1) {
          months[monthIndex].bookings += 1;
          if (booking.status && booking.status.toLowerCase() === 'paid') {
            months[monthIndex].revenue += booking.price || 0;
          }
        }
      });
      break;

    case 'last-3-months':
      // Tạo data cho 3 tháng qua (khoảng 90 ngày), hiển thị theo ngày
      const last3MonthsDays = 90; // 3 tháng ~ 90 ngày
      months = Array.from({ length: last3MonthsDays }, (_, i) => {
        const date = new Date(now);
        date.setDate(date.getDate() - (last3MonthsDays - 1 - i));
        return { 
          name: `${date.getDate()}/${date.getMonth() + 1}`, 
          bookings: 0, 
          revenue: 0,
          date: date.toDateString()
        };
      });

      bookings.forEach(booking => {
        const bookingDate = getBookingDate(booking);
        const bookingDateStr = bookingDate.toDateString();
        const monthIndex = months.findIndex(m => m.date === bookingDateStr);
        if (monthIndex !== -1) {
          months[monthIndex].bookings += 1;
          if (booking.status && booking.status.toLowerCase() === 'paid') {
            months[monthIndex].revenue += booking.price || 0;
          }
        }
      });
      break;

    case 'this-month':
      // Tạo data cho từng ngày trong tháng hiện tại
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      months = Array.from({ length: Math.min(daysInMonth, 31) }, (_, i) => {
        return { 
          name: `${i + 1}/${now.getMonth() + 1}`, 
          bookings: 0, 
          revenue: 0,
          day: i + 1
        };
      });

      bookings.forEach(booking => {
        const bookingDate = getBookingDate(booking);
        if (bookingDate.getMonth() === now.getMonth() && 
            bookingDate.getFullYear() === now.getFullYear()) {
          const dayIndex = bookingDate.getDate() - 1;
          if (dayIndex >= 0 && dayIndex < months.length) {
            months[dayIndex].bookings += 1;
            if (booking.status && booking.status.toLowerCase() === 'paid') {
              months[dayIndex].revenue += booking.price || 0;
            }
          }
        }
      });
      break;

    case 'custom':
      if (customStartDate && customEndDate) {
        // Tính số ngày giữa start và end date
        const timeDiff = customEndDate.getTime() - customStartDate.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
        
        // Luôn hiển thị theo ngày (theo yêu cầu thống kê doanh thu)
        months = Array.from({ length: daysDiff }, (_, i) => {
          const date = new Date(customStartDate);
          date.setDate(customStartDate.getDate() + i);
          return { 
            name: `${date.getDate()}/${date.getMonth() + 1}`, 
            bookings: 0, 
            revenue: 0,
            date: date.toDateString()
          };
        });
        
        bookings.forEach(booking => {
          const bookingDate = getBookingDate(booking);
          const bookingDateStr = bookingDate.toDateString();
          const monthIndex = months.findIndex(m => m.date === bookingDateStr);
          if (monthIndex !== -1) {
            months[monthIndex].bookings += 1;
            if (booking.status && booking.status.toLowerCase() === 'paid') {
              months[monthIndex].revenue += booking.price || 0;
            }
          }
        });
      }
      break;

    case 'this-year':
    default:
      // Tạo data cho 12 tháng trong năm hiện tại
      months = Array.from({ length: 12 }, (_, i) => {
        return { 
          name: `Tháng ${i + 1}`, 
          bookings: 0, 
          revenue: 0, 
          month: i + 1 
        };
      });

      bookings.forEach(booking => {
        const bookingDate = getBookingDate(booking);
        if (bookingDate.getFullYear() === now.getFullYear()) {
          const month = bookingDate.getMonth(); // 0-11
          months[month].bookings += 1;
          if (booking.status && booking.status.toLowerCase() === 'paid') {
            months[month].revenue += booking.price || 0;
          }
        }
      });
      break;
  }

  console.log('Generated monthly data:', months);
  return months;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState('this-month');
  const [activeTab, setActiveTab] = useState('overview');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const getBookingDateFilter = () => {
    const now = new Date();
    
    switch (timeRange) {
      case 'last-7-days':
        const last7Days = new Date(now);
        last7Days.setDate(now.getDate() - 7);
        last7Days.setHours(0, 0, 0, 0);
        return { 
          OR: [
            { date: { gte: last7Days } },
            { beginTime: { gte: last7Days } }
          ]
        };
      
      case 'last-30-days':
        const last30Days = new Date(now);
        last30Days.setDate(now.getDate() - 30);
        last30Days.setHours(0, 0, 0, 0);
        return { 
          OR: [
            { date: { gte: last30Days } },
            { beginTime: { gte: last30Days } }
          ]
        };
      
      case 'last-3-months':
        const last3Months = new Date(now);
        last3Months.setMonth(now.getMonth() - 3);
        last3Months.setHours(0, 0, 0, 0);
        return { 
          OR: [
            { date: { gte: last3Months } },
            { beginTime: { gte: last3Months } }
          ]
        };
      
      case 'this-month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { 
          OR: [
            { date: { gte: startOfMonth, lte: endOfMonth } },
            { beginTime: { gte: startOfMonth, lte: endOfMonth } }
          ]
        };
      
      case 'this-year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { 
          OR: [
            { date: { gte: startOfYear, lte: endOfYear } },
            { beginTime: { gte: startOfYear, lte: endOfYear } }
          ]
        };
      
      case 'custom':
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999);
          return { 
            OR: [
              { date: { gte: startDate, lte: endDate } },
              { beginTime: { gte: startDate, lte: endDate } }
            ]
          };
        }
        return undefined;
      
      default:
        return undefined;
    }
  };

  // Thống kê tổng thể (không phụ thuộc thời gian)
  const { data: accounts, isLoading: loadingAccounts } = useFindManyAccount();
  const { data: owners, isLoading: loadingOwners } = useFindManyOwner();
  const { data: users, isLoading: loadingUsers } = useFindManyCustomUser();
  const { data: fields, isLoading: loadingFields } = useFindManyField({
    include: {
      subFields: true
    }
  });

  // Chỉ thống kê booking theo thời gian được chọn
  const { data: bookings, isLoading: loadingBookings } = useFindManyBooking({
    where: getBookingDateFilter(),
    include: {
      customUser: {
        include: {
          account: true
        }
      },
      subfield: true
    }
  });

  // Thêm một query để lấy tất cả bookings để debug
  const { data: allBookings } = useFindManyBooking({
    include: {
      customUser: {
        include: {
          account: true
        }
      },
      subfield: true
    }
  });

  // Debug: Log để kiểm tra dữ liệu
  React.useEffect(() => {
    console.log('=== DEBUG STATISTICS ===');
    console.log('Time range:', timeRange);
    console.log('Filter:', getBookingDateFilter());
    console.log('Filtered bookings count:', bookings?.length || 0);
    console.log('Total bookings count (all):', allBookings?.length || 0);
    
    if (allBookings && allBookings.length > 0) {
      console.log('Sample all bookings:', allBookings.slice(0, 5).map(b => ({
        id: b.id,
        date: b.date,
        beginTime: b.beginTime,
        status: b.status,
        price: b.price
      })));
      
      // Kiểm tra phân bố theo tháng
      const monthDistribution: any = {};
      allBookings.forEach(booking => {
        const bookingDate = booking.date ? new Date(booking.date) : new Date(booking.beginTime);
        const monthKey = `${bookingDate.getFullYear()}-${bookingDate.getMonth() + 1}`;
        monthDistribution[monthKey] = (monthDistribution[monthKey] || 0) + 1;
      });
      console.log('Month distribution (all bookings):', monthDistribution);
    }
    
    if (bookings && bookings.length > 0) {
      console.log('Sample filtered bookings:', bookings.slice(0, 3).map(b => ({
        id: b.id,
        date: b.date,
        beginTime: b.beginTime,
        status: b.status,
        price: b.price
      })));
    }
    console.log('========================');
  }, [timeRange, bookings, allBookings]);

  const totalFields = fields?.length || 0;
  const totalSubFields = fields?.reduce((acc, field) => acc + (field.subFields?.length || 0), 0) || 0;
  const totalBookings = bookings?.length || 0;
  const totalRevenue = bookings?.reduce((sum, booking) => {
    if (booking.status && booking.status.toLowerCase() === 'paid') {
      return sum + (booking.price || 0);
    }
    return sum;
  }, 0) || 0;
  const totalOwners = owners?.length || 0;
  const totalUsers = users?.length || 0;

  const monthlyData = generateMonthlyStats(bookings, timeRange, customStartDate, customEndDate);

  const bookingStatusData = React.useMemo(() => {
    if (!bookings) return [];

    const statusCounts: { [key: string]: number } = {
      'pending': 0,
      'paid': 0, 
      'cancel': 0
    };

    bookings.forEach(booking => {
      if (booking.status) {
        statusCounts[booking.status.toLowerCase()] = (statusCounts[booking.status.toLowerCase()] || 0) + 1;
      }
    });

    return Object.keys(statusCounts).map(status => ({
      name: status === 'pending' ? 'Đang chờ' :
            status === 'paid' ? 'Đã thanh toán' :
            status === 'cancel' ? 'Đã hủy' : status,
      value: statusCounts[status]
    }));
  }, [bookings]);

  const userDistributionData = React.useMemo(() => {
    if (!accounts) return [];

    const roleCounts: { [key: string]: number } = {
      [Role.ADMIN]: 0,
      [Role.OWNER]: 0,
      [Role.CUSTOMER]: 0
    };

    accounts.forEach(account => {
      roleCounts[account.role] = (roleCounts[account.role] || 0) + 1;
    });

    return Object.keys(roleCounts).map(role => ({
      name: role === Role.ADMIN ? 'Quản trị viên' :
            role === Role.OWNER ? 'Chủ sân' :
            role === Role.CUSTOMER ? 'Người dùng' : role,
      value: roleCounts[role]
    }));
  }, [accounts]);

  const isLoading = loadingAccounts || loadingOwners || loadingUsers || loadingFields || loadingBookings;

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'last-7-days':
        return '7 ngày qua';
      case 'last-30-days':
        return '30 ngày qua';
      case 'last-3-months':
        return '3 tháng qua';
      case 'this-month':
        return 'tháng này';
      case 'this-year':
        return 'năm ' + currentYear;
      case 'custom':
        if (customStartDate && customEndDate) {
          return `từ ${format(customStartDate, 'dd/MM/yyyy', { locale: vi })} đến ${format(customEndDate, 'dd/MM/yyyy', { locale: vi })}`;
        }
        return 'khoảng thời gian tùy chọn';
      default:
        return 'hệ thống';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Thống kê toàn hệ thống</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-muted-foreground" />
            <Select value={timeRange} onValueChange={(value) => {
              setTimeRange(value);
              if (value !== 'custom') {
                setShowCustomDatePicker(false);
              } else {
                setShowCustomDatePicker(true);
              }
            }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Chọn khoảng thời gian" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="last-7-days">7 ngày qua</SelectItem>
                <SelectItem value="last-30-days">30 ngày qua</SelectItem>
                <SelectItem value="last-3-months">3 tháng qua</SelectItem>
                <SelectItem value="this-month">Tháng này</SelectItem>
                <SelectItem value="this-year">Năm {currentYear}</SelectItem>
                <SelectItem value="custom">Tùy chọn ngày</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showCustomDatePicker && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, 'dd/MM/yyyy', { locale: vi }) : 'Từ ngày'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    locale={vi}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <span className="text-muted-foreground">đến</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, 'dd/MM/yyyy', { locale: vi }) : 'Đến ngày'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    locale={vi}
                    initialFocus
                    disabled={(date) => customStartDate ? date < customStartDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-700">Tổng số sân</CardTitle>
            <CardDescription className="text-blue-600">Mặt sân & sân con (tổng hệ thống)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-end">
              <div className="text-3xl font-bold text-blue-600">{totalFields}</div>
              <div className="text-sm text-blue-500 mb-1">mặt sân</div>
              <div className="mx-2 text-gray-400">|</div>
              <div className="text-3xl font-bold text-blue-600">{totalSubFields}</div>
              <div className="text-sm text-blue-500 mb-1">sân con</div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-700">Lượt đặt sân</CardTitle>
            <CardDescription className="text-green-600">Trong {getTimeRangeLabel()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalBookings.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-purple-700">Doanh thu</CardTitle>
            <CardDescription className="text-purple-600">Trong {getTimeRangeLabel()}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {totalRevenue.toLocaleString()} VNĐ
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-700">Chủ sân</CardTitle>
            <CardDescription className="text-amber-600">Tổng số chủ sân trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{totalOwners}</div>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-red-700">Người dùng</CardTitle>
            <CardDescription className="text-red-600">Tổng số người dùng trong hệ thống</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full bg-white rounded-lg shadow p-6"
      >
        <TabsList className="grid grid-cols-4 mb-8">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg"
          >
            Tổng quan
          </TabsTrigger>
          <TabsTrigger 
            value="bookings"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg"
          >
            Đặt sân
          </TabsTrigger>
          <TabsTrigger 
            value="revenue"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg"
          >
            Doanh thu
          </TabsTrigger>
          <TabsTrigger 
            value="users"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-lg"
          >
            Người dùng
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <h2 className="text-xl font-semibold">Tổng quan thống kê hệ thống</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="text-lg">Phân bố đặt sân theo trạng thái</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {bookingStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} lượt`, 'Số lượng']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-4">
              <CardHeader>
                <CardTitle className="text-lg">Phân bố người dùng theo vai trò</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {userDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} người dùng`, 'Số lượng']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="bookings">
          <h2 className="text-xl font-semibold mb-4">Thống kê lượt đặt sân</h2>
          <div className="bg-white p-4 rounded-lg h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} lượt`, 'Số lượng đặt sân']} />
                <Legend />
                <Bar dataKey="bookings" name="Lượt đặt sân" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <h2 className="text-xl font-semibold mb-4">Thống kê doanh thu</h2>
          <div className="bg-white p-4 rounded-lg h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value.toLocaleString()} VNĐ`, 'Doanh thu']} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Doanh thu" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                  dot={{ r: 5 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <h2 className="text-xl font-semibold mb-4">Thống kê người dùng</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-4">
              <CardHeader>
                <CardTitle className="text-lg">Top 10 khách hàng đặt sân nhiều nhất</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-center py-10">Đang tải dữ liệu...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lần đặt sân</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bookings && bookings
                          .reduce((acc: any[], booking) => {
                            const userId = booking.customUserId;
                            const userEntry = acc.find(entry => entry.userId === userId);
                            
                            const bookingAmount = (booking.status && booking.status.toLowerCase() === 'paid') ? (booking.price || 0) : 0;
                            
                            if (userEntry) {
                              userEntry.bookingCount += 1;
                              userEntry.totalSpent += bookingAmount;
                            } else {
                              const username = booking.customUser?.account?.username || 'Người dùng';
                              acc.push({
                                userId,
                                userName: username,
                                bookingCount: 1,
                                totalSpent: bookingAmount
                              });
                            }
                            
                            return acc;
                          }, [])
                          .sort((a, b) => b.bookingCount - a.bookingCount)
                          .slice(0, 10)
                          .map((user, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap">{user.userName}</td>
                              <td className="px-6 py-4 whitespace-nowrap">{user.bookingCount} lần</td>
                              <td className="px-6 py-4 whitespace-nowrap">{user.totalSpent.toLocaleString()} VNĐ</td>
                            </tr>
                          ))
                        }
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}