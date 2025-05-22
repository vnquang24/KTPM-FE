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

const generateMonthlyStats = (bookings: any[] | undefined) => {
  if (!bookings || bookings.length === 0) return [];

  const months = Array.from({ length: 12 }, (_, i) => {
    return { 
      name: `Tháng ${i + 1}`, 
      bookings: 0, 
      revenue: 0, 
      month: i + 1 
    };
  });

  bookings.forEach(booking => {
    const date = new Date(booking.beginTime);
    const month = date.getMonth(); // 0-11
    
    months[month].bookings += 1;
    if (booking.status && booking.status.toLowerCase() === 'paid') {
      months[month].revenue += booking.price || 0;
    }
  });

  return months;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

export default function StatisticsPage() {
  const [timeRange, setTimeRange] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const getDateFilter = () => {
    const now = new Date();
    
    switch (timeRange) {
      case 'this-month':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        return { gte: startOfMonth };
      case 'this-year':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        return { gte: startOfYear };
      default:
        return undefined;
    }
  };

  const { data: accounts, isLoading: loadingAccounts } = useFindManyAccount({
    where: {
      createdAt: getDateFilter()
    }
  });

  const { data: owners, isLoading: loadingOwners } = useFindManyOwner({
    where: {
      createdAt: getDateFilter()
    }
  });

  const { data: users, isLoading: loadingUsers } = useFindManyCustomUser({
    where: {
      createdAt: getDateFilter()
    }
  });

  const { data: fields, isLoading: loadingFields } = useFindManyField({
    where: {
      createdAt: getDateFilter()
    },
    include: {
      subFields: true
    }
  });

  const { data: bookings, isLoading: loadingBookings } = useFindManyBooking({
    where: {
      date: getDateFilter() // Sử dụng trường date thay vì beginTime để lọc chính xác hơn
    },
    include: {
      customUser: {
        include: {
          account: true
        }
      },
      subfield: true
    }
  });

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

  const monthlyData = generateMonthlyStats(bookings);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Thống kê toàn hệ thống</h1>
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Chọn khoảng thời gian" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thời gian</SelectItem>
              <SelectItem value="this-month">Tháng này</SelectItem>
              <SelectItem value="this-year">Năm {currentYear}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-blue-700">Tổng số sân</CardTitle>
            <CardDescription className="text-blue-600">Mặt sân & sân con</CardDescription>
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
            <CardTitle className="text-lg text-green-700">Tổng số đặt sân</CardTitle>
            <CardDescription className="text-green-600">Lượt đặt sân thành công</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{totalBookings.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-purple-700">Doanh thu</CardTitle>
            <CardDescription className="text-purple-600">Tổng doanh thu qua hệ thống</CardDescription>
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
            <CardDescription className="text-amber-600">Số lượng chủ sân</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600">{totalOwners}</div>
          </CardContent>
        </Card>

        <Card className="bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-red-700">Người dùng</CardTitle>
            <CardDescription className="text-red-600">Số lượng người dùng đặt sân</CardDescription>
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
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="bookings">Đặt sân</TabsTrigger>
          <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          <TabsTrigger value="users">Người dùng</TabsTrigger>
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