'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, parseISO, isEqual, isSameDay, addDays, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, startOfMonth, endOfMonth, getMonth, getYear, parse, getDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  useFindFirstOwner,
  useFindManyBooking,
  useFindManyField,
  useUpdateBooking
} from '@/generated/hooks';
import { getUserId } from '@/utils/auth';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { 
  CheckCircle2, 
  Clock, 
  Calendar as CalendarIcon,
  ChevronDown, 
  X, 
  FileText,
  UserCheck,
  UserX, 
  Filter, 
  Search,
  ChevronLeft,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Setup Calendar Localizer
const locales = {
  'vi': vi,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Calendar Event Type
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId?: string;
  status: string;
  allDay?: boolean;
  bookingData?: any; // Full booking data
}

// Define booking status types
type BookingStatus = 'PENDING' | 'APPROVED' | 'CANCELED' | 'ALL';

// Mapping từ trạng thái trong database sang trạng thái hiển thị trong UI
const mapDatabaseToUIStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'PENDING',
    'paid': 'APPROVED',
    'cancel': 'CANCELED'
  };
  
  return statusMap[status.toLowerCase()] || 'PENDING';
};

// Mapping từ trạng thái UI sang trạng thái database để lưu trữ
const mapUIToDatabaseStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PENDING': 'pending',
    'APPROVED': 'paid',
    'CANCELED': 'cancel',
    'ALL': 'all' // Không dùng cho lưu trữ, chỉ dùng cho filter
  };
  
  return statusMap[status] || 'pending';
};

const BookingManagementPage: React.FC = () => {
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showBookingDetail, setShowBookingDetail] = useState(false);
  const [statusFilter, setStatusFilter] = useState<BookingStatus>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [timeRangeFilter, setTimeRangeFilter] = useState<{
    startTime: string;
    endTime: string;
  }>({
    startTime: '',
    endTime: ''
  });
  
  // Calendar view states
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'agenda'>('week');
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Get user ID from auth
  const userId = getUserId();
  
  // Get owner information
  const { data: owner } = useFindFirstOwner({
    where: {
      account: {
        id: userId || '',
      }
    }
  });
  
  // Get all fields for this owner
  const { data: fields } = useFindManyField({
    where: {
      ownerId: owner?.id,
    },
    include: {
      subFields: true,
    },
  }, {
    enabled: !!owner?.id,
  });

  // Get all bookings for fields owned by this owner
  const { data: bookings, refetch: refetchBookings } = useFindManyBooking({
    where: {
      subfield: {
        field: {
          ownerId: owner?.id,
        },
      },
      ...(statusFilter !== 'ALL' ? { status: mapUIToDatabaseStatus(statusFilter) } : {}),
      ...(selectedField !== 'all' ? { 
        subfield: {
          fieldId: selectedField
        } 
      } : {}),
    },
    include: {
      customUser: {
        include: {
          account: true
        }
      },
      subfield: {
        include: {
          field: true
        }
      },
      review: true
    },
    orderBy: [
      { date: 'desc' },
      { beginTime: 'desc' }
    ]
  }, {
    enabled: !!owner?.id,
  });
  
  console.log(bookings);
  // Booking status update mutation
  const updateBooking = useUpdateBooking();

  // Handle update booking status
  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      await updateBooking.mutateAsync({
        where: { id: bookingId },
        data: { status: mapUIToDatabaseStatus(newStatus) }
      });
      toast.success(`Đã cập nhật trạng thái thành ${getStatusLabel(newStatus)}`);
      refetchBookings();
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái đặt sân:', error);
      toast.error('Không thể cập nhật trạng thái đặt sân. Vui lòng thử lại.');
    }
  };

  // Filter bookings based on search term and time range
  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    
    return bookings.filter(booking => {
      // Lọc theo từ khóa tìm kiếm
      const customerName = booking.customUser?.account?.username?.toLowerCase() || '';
      const courtName = booking.subfield?.field?.location?.toLowerCase() || '';
      const bookingId = booking.id?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = customerName.includes(searchLower) || 
                           courtName.includes(searchLower) ||
                           bookingId.includes(searchLower);
      
      // Lọc theo ngày
      let matchesDate = true;
      if (dateFilter) {
        const bookingDate = new Date(booking.date);
        const filterDate = new Date(dateFilter);
        
        // So sánh năm, tháng, ngày (không quan tâm đến giờ, phút, giây)
        if (
          bookingDate.getFullYear() !== filterDate.getFullYear() ||
          bookingDate.getMonth() !== filterDate.getMonth() ||
          bookingDate.getDate() !== filterDate.getDate()
        ) {
          matchesDate = false;
        }
      }
      
      // Lọc theo khoảng thời gian
      let matchesTimeRange = true;
      if (timeRangeFilter.startTime || timeRangeFilter.endTime) {
        const bookingBeginTime = new Date(booking.beginTime);
        const bookingEndTime = new Date(booking.endTime);
        
        const beginHour = bookingBeginTime.getHours();
        const beginMinute = bookingBeginTime.getMinutes();
        const beginTimeMinutes = beginHour * 60 + beginMinute;
        
        const endHour = bookingEndTime.getHours();
        const endMinute = bookingEndTime.getMinutes();
        const endTimeMinutes = endHour * 60 + endMinute;
        
        if (timeRangeFilter.startTime) {
          const [filterStartHour, filterStartMinute] = timeRangeFilter.startTime.split(':').map(Number);
          const filterStartMinutes = filterStartHour * 60 + filterStartMinute;
          
          if (beginTimeMinutes < filterStartMinutes) {
            matchesTimeRange = false;
          }
        }
        
        if (timeRangeFilter.endTime && matchesTimeRange) {
          const [filterEndHour, filterEndMinute] = timeRangeFilter.endTime.split(':').map(Number);
          const filterEndMinutes = filterEndHour * 60 + filterEndMinute;
          
          if (endTimeMinutes > filterEndMinutes) {
            matchesTimeRange = false;
          }
        }
      }
      
      return matchesSearch && matchesDate && matchesTimeRange;
    });
  }, [bookings, searchTerm, dateFilter, timeRangeFilter]);

  // Get display text for booking status
  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'APPROVED': return 'Đã thanh toán';
      case 'CANCELED': return 'Đã hủy';
      default: return status;
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'APPROVED': return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'CANCELED': return 'bg-red-500 text-white hover:bg-red-600';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Available actions for each booking status
  const getAvailableActions = (booking: any): { label: string; action: string; icon?: React.ReactNode }[] => {
    const status = mapDatabaseToUIStatus(booking.status);
    switch (status) {
      case 'PENDING':
        return [
          { label: 'Duyệt đặt sân', action: 'APPROVED', icon: <CheckCircle2 className="h-4 w-4 mr-2" /> },
          { label: 'Hủy đặt sân', action: 'CANCELED', icon: <X className="h-4 w-4 mr-2" /> }
        ];
      default:
        return [];
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setStatusFilter('ALL');
    setSearchTerm('');
    setSelectedField('all');
    setDateFilter('');
    setTimeRangeFilter({ startTime: '', endTime: '' });
  };

  // Convert bookings to calendar events
  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    if (!filteredBookings) return [];
    
    return filteredBookings.map(booking => {
      const bookingDate = new Date(booking.date);
      const beginTime = new Date(booking.beginTime);
      const endTime = new Date(booking.endTime);
      
      // Create start and end date objects
      const start = new Date(
        bookingDate.getFullYear(),
        bookingDate.getMonth(),
        bookingDate.getDate(),
        beginTime.getHours(),
        beginTime.getMinutes()
      );
      
      const end = new Date(
        bookingDate.getFullYear(),
        bookingDate.getMonth(),
        bookingDate.getDate(),
        endTime.getHours(),
        endTime.getMinutes()
      );
      
      return {
        id: booking.id,
        title: `${booking.customUser?.account?.username} - ${booking.subfield?.field?.location}`,
        start,
        end,
        resourceId: booking.subfield?.id,
        status: mapDatabaseToUIStatus(booking.status),
        bookingData: booking
      };
    });
  }, [filteredBookings]);

  // Event styling based on status
  const eventStyleGetter = (event: CalendarEvent) => {
    let style: React.CSSProperties = {
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
    };

    switch (event.status) {
      case 'PENDING':
        style.backgroundColor = '#eab308'; // Yellow-500
        break;
      case 'APPROVED':
        style.backgroundColor = '#3b82f6'; // Blue-500
        break;
      case 'CANCELED':
        style.backgroundColor = '#ef4444'; // Red-500
        break;
      default:
        style.backgroundColor = '#6b7280'; // Gray-500
    }

    return { style };
  };

  // Custom Calendar Toolbar
  const CustomToolbar = ({ label, onView, onNavigate }: any) => (
    <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => onNavigate('TODAY')}>
          Hôm nay
        </Button>
        <Button variant="outline" onClick={() => onNavigate('PREV')}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={() => onNavigate('NEXT')}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <h3 className="text-base font-semibold">{label}</h3>
      </div>
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={() => onView('month')}
          className={cn(calendarView === 'month' ? 'bg-amber-100 text-amber-900' : '')}
        >
          Tháng
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onView('week')}
          className={cn(calendarView === 'week' ? 'bg-amber-100 text-amber-900' : '')}
        >
          Tuần
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onView('day')}
          className={cn(calendarView === 'day' ? 'bg-amber-100 text-amber-900' : '')}
        >
          Ngày
        </Button>
        <Button 
          variant="outline" 
          onClick={() => onView('agenda')}
          className={cn(calendarView === 'agenda' ? 'bg-amber-100 text-amber-900' : '')}
        >
          Lịch trình
        </Button>
      </div>
    </div>
  );

  // Handle event selection
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedBooking(event.bookingData);
    setShowBookingDetail(true);
  };

  return (
    <div className="container mx-auto py-4">
      <div className="flex flex-col space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Đặt Sân</h1>
          <p className="text-gray-500 mt-1">
            Xem và xử lý các đơn đặt sân
          </p>
        </div>
        
        {/* Filter Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Bộ lọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="status-filter" className="mb-2 block">Trạng thái</Label>
                <Select value={statusFilter} onValueChange={(value: BookingStatus) => setStatusFilter(value)}>
                  <SelectTrigger id="status-filter">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                    <SelectItem value="PENDING">Chờ duyệt</SelectItem>
                    <SelectItem value="APPROVED">Đã thanh toán</SelectItem>
                    <SelectItem value="CANCELED">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="field-filter" className="mb-2 block">Sân</Label>
                <Select value={selectedField} onValueChange={setSelectedField}>
                  <SelectTrigger id="field-filter">
                    <SelectValue placeholder="Chọn sân" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="all">Tất cả các sân</SelectItem>
                    {fields?.map(field => (
                      <SelectItem key={field.id} value={field.id}>
                        {field.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="date-filter" className="mb-2 block">Ngày</Label>
                <Input
                  id="date-filter"
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="search" className="mb-2 block">Tìm kiếm</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Tìm theo tên, sân..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <Label className="mb-2 block">Khoảng thời gian</Label>
                <div className="flex space-x-2">
                  <div className="w-1/2">
                    <Input
                      type="time"
                      placeholder="Từ giờ"
                      value={timeRangeFilter.startTime}
                      onChange={(e) => setTimeRangeFilter(prev => ({
                        ...prev,
                        startTime: e.target.value
                      }))}
                      className="w-full"
                    />
                  </div>
                  <div className="w-1/2">
                    <Input
                      type="time"
                      placeholder="Đến giờ"
                      value={timeRangeFilter.endTime}
                      onChange={(e) => setTimeRangeFilter(prev => ({
                        ...prev,
                        endTime: e.target.value
                      }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={resetFilters} className="flex items-center gap-2">
                <Filter className="h-4 w-4" /> Xóa bộ lọc
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Bookings Table */}
        <Card>
          <CardContent className="p-0">
            <Tabs defaultValue="list" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">Danh sách</TabsTrigger>
                <TabsTrigger value="calendar">Lịch</TabsTrigger>
              </TabsList>
              
              <TabsContent value="list" className="p-4">
                <div className="rounded-md border">
                  <Table>
                    <TableCaption>Danh sách đơn đặt sân</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>STT</TableHead>
                        <TableHead>Khách hàng</TableHead>
                        <TableHead>Sân</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Thời gian</TableHead>
                        <TableHead>Giá (VNĐ)</TableHead>
                        <TableHead className="text-center">Trạng thái</TableHead>
                        <TableHead className="text-center">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings && filteredBookings.length > 0 ? (
                        filteredBookings.map((booking, index) => (
                          <TableRow key={booking.id}>
                            <TableCell className="font-medium">{index + 1}</TableCell>
                            <TableCell>{booking.customUser?.account?.username}</TableCell>
                            <TableCell>
                              {booking.subfield?.field?.location}
                              {booking.subfield?.subfieldDescription ? ` - ${booking.subfield?.subfieldDescription}` : ''}
                            </TableCell>
                            <TableCell>
                              {format(new Date(booking.date), 'dd/MM/yyyy', { locale: vi })}
                            </TableCell>
                            <TableCell>
                              {format(new Date(booking.beginTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                            </TableCell>
                            <TableCell>{new Intl.NumberFormat('vi-VN').format(booking.price)}</TableCell>
                            <TableCell className="text-center">
                              <Badge 
                                className={`${getStatusBadgeColor(mapDatabaseToUIStatus(booking.status))}`}
                              >
                                {getStatusLabel(mapDatabaseToUIStatus(booking.status))}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center space-x-2">
                                {booking.status === 'PENDING' && (
                                  <>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
                                      onClick={() => handleUpdateStatus(booking.id, 'APPROVED')}
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                                      onClick={() => handleUpdateStatus(booking.id, 'CANCELED')}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedBooking(booking);
                                    setShowBookingDetail(true);
                                  }}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                

                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10">
                            <div className="flex flex-col items-center justify-center">
                              <CalendarIcon className="h-10 w-10 text-gray-400 mb-2" />
                              <p className="text-lg font-medium text-gray-900">Không có đơn đặt sân nào</p>
                              <p className="text-sm text-gray-500 mt-1">
                                Không tìm thấy đơn đặt sân nào phù hợp với điều kiện tìm kiếm
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              <TabsContent value="calendar" className="p-4">
                <Card>
                  <CardContent className="p-4">
                    <div style={{ height: 700 }}>
                      <Calendar
                        localizer={localizer}
                        events={calendarEvents}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        views={['month', 'week', 'day', 'agenda']}
                        defaultView="week"
                        view={calendarView}
                        onView={(view) => setCalendarView(view as 'month' | 'week' | 'day' | 'agenda')}
                        date={calendarDate}
                        onNavigate={date => setCalendarDate(date)}
                        selectable={false}
                        onSelectEvent={handleSelectEvent}
                        eventPropGetter={eventStyleGetter}
                        components={{
                          toolbar: CustomToolbar
                        }}
                        culture="vi"
                        formats={{
                          dayHeaderFormat: (date) => format(date, 'EEEE dd/MM', { locale: vi }),
                          dayRangeHeaderFormat: ({ start, end }) =>
                            `${format(start, 'dd/MM', { locale: vi })} - ${format(end, 'dd/MM', { locale: vi })}`,
                        }}
                        messages={{
                          today: 'Hôm nay',
                          previous: 'Trước',
                          next: 'Sau',
                          month: 'Tháng',
                          week: 'Tuần',
                          day: 'Ngày',
                          agenda: 'Lịch trình',
                          noEventsInRange: 'Không có đặt sân nào trong khoảng thời gian này',
                          showMore: (total) => `+ ${total} đặt sân khác`
                        }}
                      />
                    </div>
                    {/* Legend */}
                    <div className="flex space-x-4 items-center flex-wrap mt-4 pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
                        <span className="text-sm">Chờ duyệt</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                        <span className="text-sm">Đã thanh toán</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                        <span className="text-sm">Đã hủy</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Booking Detail Modal */}
      <Dialog open={showBookingDetail} onOpenChange={setShowBookingDetail}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Chi tiết đặt sân</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về đơn đặt sân
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Thông tin khách hàng</h3>
                  <div className="mt-2 border rounded-md p-4">
                    <p><span className="font-medium">Tên:</span> {selectedBooking.customUser?.account?.username}</p>
                    <p><span className="font-medium">Email:</span> {selectedBooking.customUser?.account?.email || 'Không có'}</p>
                    <p><span className="font-medium">SĐT:</span> {selectedBooking.customUser?.account?.phone || 'Không có'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Thông tin sân</h3>
                  <div className="mt-2 border rounded-md p-4">
                    <p><span className="font-medium">Sân:</span> {selectedBooking.subfield?.field?.location}</p>
                    {selectedBooking.subfield?.subfieldDescription ? (
                      <p><span className="font-medium">Mô tả sân:</span> {selectedBooking.subfield?.subfieldDescription}</p>
                    ) : null}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Thông tin đặt sân</h3>
                  <div className="mt-2 border rounded-md p-4">
                    <p><span className="font-medium">Mã đặt sân:</span> {selectedBooking.id.substring(0, 8)}</p>
                    <p>
                      <span className="font-medium">Ngày:</span> {format(new Date(selectedBooking.date), 'dd/MM/yyyy', { locale: vi })}
                    </p>
                    <p>
                      <span className="font-medium">Thời gian:</span> {format(new Date(selectedBooking.beginTime), 'HH:mm')} - {format(new Date(selectedBooking.endTime), 'HH:mm')}
                    </p>
                    <p>
                      <span className="font-medium">Giá thuê:</span> {new Intl.NumberFormat('vi-VN').format(selectedBooking.price)} VNĐ
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">Trạng thái:</span>
                      <Badge className={getStatusBadgeColor(selectedBooking.status)}>
                        {getStatusLabel(selectedBooking.status)}
                      </Badge>
                    </div>
                    <p>
                      <span className="font-medium">Thanh toán:</span>{' '}
                      {selectedBooking.payDate ? (
                        <>
                          Đã thanh toán vào {format(new Date(selectedBooking.payDate), 'dd/MM/yyyy HH:mm', { locale: vi })}
                          {selectedBooking.paymentMethod && (
                            <> qua {selectedBooking.paymentMethod}</>
                          )}
                        </>
                      ) : 'Chưa thanh toán'}
                    </p>
                    <p>
                      <span className="font-medium">Đánh giá:</span>{' '}
                      {selectedBooking.review ? (
                        <>
                          {selectedBooking.review.rating}/5 sao - {selectedBooking.review.text || 'Không có nhận xét'}
                        </>
                      ) : 'Chưa đánh giá'}
                    </p>
                  </div>
                </div>
                
                {/* Available Actions */}
                {getAvailableActions(selectedBooking).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Thao tác</h3>
                    <div className="mt-2 flex gap-2">
                      {getAvailableActions(selectedBooking).map((action, index) => (
                        <Button 
                          key={index}
                          onClick={() => {
                            handleUpdateStatus(selectedBooking.id, action.action as string);
                            setShowBookingDetail(false);
                          }}
                          className="flex items-center"
                        >
                          {action.icon}
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingManagementPage;