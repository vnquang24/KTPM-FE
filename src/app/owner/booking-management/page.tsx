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
  ClipboardList,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'react-hot-toast';

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

type BookingStatus = 'PENDING' | 'APPROVED' | 'CANCELED' | 'ALL';

const mapDatabaseToUIStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'PENDING',
    'paid': 'APPROVED',
    'cancel': 'CANCELED'
  };
  
  return statusMap[status.toLowerCase()] || 'PENDING';
};

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
  
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day' | 'agenda'>('week');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [showBookingId, setShowBookingId] = useState(false);
  
  // Thêm CSS cho thanh cuộn mỏng
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #cbd5e0 #f7fafc;
      }
      
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f7fafc;
        border-radius: 3px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e0;
        border-radius: 3px;
      }
      
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #a0aec0;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  const userId = getUserId();
  
  const { data: owner } = useFindFirstOwner({
    where: {
      account: {
        id: userId || '',
      }
    }
  });
  
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
  const updateBooking = useUpdateBooking();

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

  const filteredBookings = useMemo(() => {
    if (!bookings) return [];
    
    return bookings.filter(booking => {
      const customerName = booking.customUser?.account?.username?.toLowerCase() || '';
      const courtName = booking.subfield?.field?.location?.toLowerCase() || '';
      const bookingId = booking.id?.toLowerCase() || '';
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = customerName.includes(searchLower) || 
                           courtName.includes(searchLower) ||
                           bookingId.includes(searchLower);
      
      let matchesDate = true;
      if (dateFilter) {
        const bookingDate = new Date(booking.date);
        const filterDate = new Date(dateFilter);
        
        if (
          bookingDate.getFullYear() !== filterDate.getFullYear() ||
          bookingDate.getMonth() !== filterDate.getMonth() ||
          bookingDate.getDate() !== filterDate.getDate()
        ) {
          matchesDate = false;
        }
      }
      
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

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'APPROVED': return 'Đã thanh toán';
      case 'CANCELED': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'APPROVED': return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'CANCELED': return 'bg-red-500 text-white hover:bg-red-600';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getAvailableActions = (booking: any): { label: string; action: string; icon?: React.ReactNode; className?: string }[] => {
    const status = mapDatabaseToUIStatus(booking.status);
    switch (status) {
      case 'PENDING':
        return [
          { 
            label: 'Duyệt đặt sân', 
            action: 'APPROVED', 
            icon: <CheckCircle2 className="h-4 w-4 mr-2" />,
            className: 'bg-blue-500 hover:bg-blue-600 text-white'
          },
          { 
            label: 'Hủy đặt sân', 
            action: 'CANCELED', 
            icon: <X className="h-4 w-4 mr-2" />,
            className: 'bg-red-500 hover:bg-red-600 text-white'
          }
        ];
      default:
        return [];
    }
  };

  const resetFilters = () => {
    setStatusFilter('ALL');
    setSearchTerm('');
    setSelectedField('all');
    setDateFilter('');
    setTimeRangeFilter({ startTime: '', endTime: '' });
  };

  const calendarEvents = useMemo<CalendarEvent[]>(() => {
    if (!filteredBookings) return [];
    
    return filteredBookings.map(booking => {
      const bookingDate = new Date(booking.date);
      const beginTime = new Date(booking.beginTime);
      const endTime = new Date(booking.endTime);
      
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

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedBooking(event.bookingData);
    setShowBookingDetail(true);
  };

  return (
    <div className="container mx-auto py-4">
      <div className="flex flex-col space-y-5">
        <div>
          <p className="text-gray-500 mt-1">
            Xem và xử lý các đơn đặt sân
          </p>
        </div>
        
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
                        <TableHead>Ghi chú</TableHead>
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
                            <TableCell>
                              {(() => {
                                if (!booking.description) return 'Không có';
                                
                                // Parse description để tách ra thông tin ghi chú
                                const lines = booking.description.split('\n').filter((line: string) => line.trim());
                                const noteLineIndex = lines.findIndex((line: string) => line.startsWith('Ghi chú:'));
                                
                                if (noteLineIndex !== -1) {
                                  const noteLine = lines[noteLineIndex];
                                  const noteContent = noteLine.replace('Ghi chú:', '').trim();
                                  
                                  if (noteContent && noteContent !== 'Không có') {
                                    return noteContent.length > 30 ? `${noteContent.substring(0, 30)}...` : noteContent;
                                  }
                                }
                                
                                return 'Không có';
                              })()}
                            </TableCell>
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
                                      className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
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
                          <TableCell colSpan={9} className="text-center py-10">
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

      <Dialog open={showBookingDetail} onOpenChange={setShowBookingDetail}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Chi tiết đặt sân</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về đơn đặt sân #{selectedBooking?.id?.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-6 py-4">
              {/* Header với trạng thái và các action */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className={`${getStatusBadgeColor(mapDatabaseToUIStatus(selectedBooking.status))} text-sm px-3 py-1`}>
                    {getStatusLabel(mapDatabaseToUIStatus(selectedBooking.status))}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Đặt vào {format(new Date(selectedBooking.createdAt || selectedBooking.date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </span>
                </div>
                
                {getAvailableActions(selectedBooking).length > 0 && (
                  <div className="flex gap-2">
                    {getAvailableActions(selectedBooking).map((action, index) => (
                      <Button 
                        key={index}
                        size="sm"
                        onClick={() => {
                          handleUpdateStatus(selectedBooking.id, action.action as string);
                          setShowBookingDetail(false);
                        }}
                        className={`flex items-center gap-1 ${action.className || ''}`}
                      >
                        {action.icon}
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              {/* Thông tin chính */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cột trái */}
                <div className="space-y-6">
                  {/* Thông tin khách hàng */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-blue-600" />
                        Thông tin khách hàng
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tên khách hàng:</span>
                        <span className="font-semibold">{selectedBooking.customUser?.account?.username}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedBooking.customUser?.account?.email || 'Không có'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Số điện thoại:</span>
                        <span className="font-medium">{selectedBooking.customUser?.account?.phone || 'Không có'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Thông tin đặt sân và sân - Gộp lại */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-orange-600" />
                        Thông tin đặt sân & sân
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Thông tin đặt sân */}
                      <div className="space-y-3 pb-4 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Thông tin đặt sân</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Mã đặt sân:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold bg-gray-100 px-2 py-1 rounded">
                              {showBookingId ? selectedBooking.id : `${selectedBooking.id.substring(0, 8)}...`}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowBookingId(!showBookingId)}
                              className="h-8 w-8 p-0"
                            >
                              {showBookingId ? (
                                <EyeOff className="h-4 w-4 text-gray-500" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-500" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Ngày đặt:</span>
                          <span className="font-semibold text-blue-600">
                            {format(new Date(selectedBooking.date), 'EEEE, dd/MM/yyyy', { locale: vi })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Thời gian:</span>
                          <span className="font-semibold">
                            {format(new Date(selectedBooking.beginTime), 'HH:mm')} - {format(new Date(selectedBooking.endTime), 'HH:mm')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Thời lượng:</span>
                          <span className="font-medium">
                            {(() => {
                              const start = new Date(selectedBooking.beginTime);
                              const end = new Date(selectedBooking.endTime);
                              const diffInMs = end.getTime() - start.getTime();
                              const diffInHours = diffInMs / (1000 * 60 * 60);
                              return `${diffInHours} giờ`;
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* Thông tin sân */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">Thông tin sân</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Tên sân:</span>
                          <span className="font-semibold">{selectedBooking.subfield?.field?.location}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Loại sân:</span>
                          <span className="font-medium">{selectedBooking.subfield?.subfieldDescription || 'Sân tiêu chuẩn'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Đơn vị tính:</span>
                          <span className="font-medium">{selectedBooking.subfield?.unitOfTime || 'Giờ'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Cột phải */}
                <div className="space-y-6">
                  {/* Thông tin thanh toán */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Thông tin thanh toán
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Tổng tiền:</span>
                        <span className="font-bold text-xl text-emerald-600">
                          {new Intl.NumberFormat('vi-VN').format(selectedBooking.price)} VNĐ
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Phương thức:</span>
                        <span className="font-medium">
                          {selectedBooking.paymentMethod ? (
                            selectedBooking.paymentMethod === 'BANKING' ? 'Chuyển khoản' :
                            selectedBooking.paymentMethod === 'CASH' ? 'Tiền mặt' :
                            selectedBooking.paymentMethod === 'MOMO' ? 'Ví Momo' :
                            selectedBooking.paymentMethod === 'ZALOPAY' ? 'ZaloPay' : selectedBooking.paymentMethod
                          ) : 'Chưa xác định'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Thời gian thanh toán:</span>
                        <span className="font-medium">
                          {selectedBooking.payDate ? 
                            format(new Date(selectedBooking.payDate), 'dd/MM/yyyy HH:mm', { locale: vi }) : 
                            'Chưa thanh toán'
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ghi chú từ khách hàng */}
                  {selectedBooking.description && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-purple-600" />
                          Ghi chú từ khách hàng
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          {(() => {
                            // Parse description để tách ra thông tin
                            const lines = selectedBooking.description.split('\n').filter((line: string) => line.trim());
                            
                            // Tìm các thông tin cần thiết
                            const bookerLine = lines.find((line: string) => line.startsWith('Người đặt:'));
                            
                            const noteLine = lines.find((line: string) => line.startsWith('Ghi chú:'));
                            
                            const bookerName = bookerLine ? bookerLine.replace('Người đặt:', '').trim() : '';
                            
                            const noteContent = noteLine ? noteLine.replace('Ghi chú:', '').trim() : '';
                            
                            return (
                              <div className="space-y-4">
                                {(bookerName) && (
                                  <div>
                                    <p className="text-gray-700 font-medium mb-3 border-b border-gray-200 pb-2">Tên người đặt:</p>
                                    <div className="space-y-2 ml-4">
                                      {bookerName && (
                                        <div className="flex">
                                          <span className="text-gray-700">{bookerName}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                {noteContent && noteContent !== 'Không có' && (
                                  <div>
                                    <p className="text-gray-700 font-medium mb-2 border-b border-gray-200 pb-2">Ghi chú đặc biệt:</p>
                                    <p className="text-gray-700 italic ml-4">{noteContent}</p>
                                  </div>
                                )}
                                
                                {!bookerName && (!noteContent || noteContent === 'Không có') && (
                                  <div>
                                    <p className="text-gray-700 font-medium mb-2">Thông tin đặt sân:</p>
                                    <pre className="text-gray-700 whitespace-pre-wrap text-sm">{selectedBooking.description}</pre>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Đánh giá */}
                  {selectedBooking.review && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                          Đánh giá
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-5 h-5 ${star <= selectedBooking.review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="font-semibold">{selectedBooking.review.rating}/5</span>
                        </div>
                        {selectedBooking.review.text && (
                          <div className="bg-yellow-50 p-4 rounded-lg">
                            <p className="text-gray-700">{selectedBooking.review.text}</p>
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          Đánh giá vào {format(new Date(selectedBooking.review.date), 'dd/MM/yyyy HH:mm', { locale: vi })}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" onClick={() => setShowBookingDetail(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingManagementPage;