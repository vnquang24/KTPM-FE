'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addHours, addDays, isSameDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {
  useFindFirstOwner,
  useFindManyField,
  useUpdateSubField,
  useFindManyOpeningHours,
  useCreateOpeningHours,
  useUpdateOpeningHours,
  useDeleteOpeningHours,
  useFindManyMaintenanceSchedule,
  useCreateMaintenanceSchedule,
  useUpdateMaintenanceSchedule,
  useDeleteMaintenanceSchedule,
  useFindManyBooking
} from '@/generated/hooks';
import { getUserId } from '@/utils/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';
import { Calendar as CalendarIcon, Clock, Settings, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  resourceId?: string; // For SubField ID
  status: string; // 'AVAILABLE', 'MAINTENANCE', 'RESERVED'
  type: 'operating-hours' | 'maintenance' | 'booking';
  allDay?: boolean;
  description?: string;
}

const ScheduleManagementPage: React.FC = () => {
  const [view, setView] = useState('week');
  const [date, setDate] = useState(new Date());
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [selectedSubField, setSelectedSubField] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState<{
    title: string;
    start: Date;
    end: Date;
    resourceId: string | null;
    status: string;
    type: 'operating-hours' | 'maintenance';
    reason?: string;
  }>({
    title: '',
    start: new Date(),
    end: addHours(new Date(), 1),
    resourceId: null,
    status: 'AVAILABLE',
    type: 'operating-hours',
    reason: ''
  });

  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const [operatingHours, setOperatingHours] = useState<Record<string, { start: string; end: string; enabled: boolean }>>({
    MONDAY: { start: '08:00', end: '22:00', enabled: true },
    TUESDAY: { start: '08:00', end: '22:00', enabled: true },
    WEDNESDAY: { start: '08:00', end: '22:00', enabled: true },
    THURSDAY: { start: '08:00', end: '22:00', enabled: true },
    FRIDAY: { start: '08:00', end: '22:00', enabled: true },
    SATURDAY: { start: '08:00', end: '22:00', enabled: true },
    SUNDAY: { start: '08:00', end: '22:00', enabled: true },
  });

  const userId = getUserId();

  useEffect(() => {
    console.log('userId:', userId);
  }, [userId]);

  const { data: owner, isLoading: isLoadingOwner } = useFindFirstOwner({
    where: {
      account: {
        id: userId || '',
      }
    },
    include: {
      account: true,
    }
  });

  useEffect(() => {
    console.log('owner:', owner);
  }, [owner]);

  const { data: fields, isLoading: isLoadingFields } = useFindManyField({
    where: {
      ownerId: owner?.id,
    },
    include: {
      subFields: true,
    },
  }, {
    enabled: !!owner?.id,
  });

  useEffect(() => {
    console.log('fields:', fields);
    console.log('ownerId:', owner?.id);
  }, [fields, owner?.id]);

  const { data: openingHoursData, isLoading: isLoadingOpeningHours, refetch: refetchOpeningHours } = useFindManyOpeningHours({
    where: {
      fieldId: selectedField || '',
    }
  }, {
    enabled: !!selectedField
  });

  const { data: maintenanceSchedules, isLoading: isLoadingMaintenance, refetch: refetchMaintenanceSchedules } = useFindManyMaintenanceSchedule({
    where: {
      subfield: {
        fieldId: selectedField || '',
        ...(selectedSubField ? { id: selectedSubField } : {})
      }
    }
  }, {
    enabled: !!selectedField
  });

  const { data: bookings, isLoading: isLoadingBookings } = useFindManyBooking({
    where: {
      subfield: {
        fieldId: selectedField || '',
        ...(selectedSubField ? { id: selectedSubField } : {})
      }
    },
    include: {
      subfield: true
    }
  }, {
    enabled: !!selectedField
  });

  const createOpeningHours = useCreateOpeningHours();
  const updateOpeningHours = useUpdateOpeningHours();
  const deleteOpeningHours = useDeleteOpeningHours();

  const createMaintenanceSchedule = useCreateMaintenanceSchedule();
  const updateMaintenanceSchedule = useUpdateMaintenanceSchedule();
  const deleteMaintenanceSchedule = useDeleteMaintenanceSchedule();

  const updateSubField = useUpdateSubField();

  const subFields = useMemo(() => {
    if (!fields || !selectedField) return [];
    const field = fields.find(f => f.id === selectedField);
    return field?.subFields || [];
  }, [fields, selectedField]);

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    if (!selectedField) {
      toast.error('Vui lòng chọn một sân trước khi tạo lịch');
      return;
    }

    setNewEvent({
      ...newEvent,
      start,
      end,
      resourceId: selectedSubField || selectedField,
    });
    setShowEventModal(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.resourceId) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      if (newEvent.type === 'maintenance') {
        await createMaintenanceSchedule.mutateAsync({
          data: {
            startDate: newEvent.start,
            endDate: newEvent.end,
            reason: newEvent.reason || newEvent.title,
            status: 'scheduled',
            subfield: {
              connect: { id: newEvent.resourceId }
            }
          }
        });

        await updateSubField.mutateAsync({
          where: { id: newEvent.resourceId },
          data: { status: 'MAINTENANCE' }
        });

        toast.success('Đã tạo lịch bảo trì và cập nhật trạng thái sân');
        refetchMaintenanceSchedules();
      }

      setShowEventModal(false);
      setNewEvent({
        title: '',
        start: new Date(),
        end: addHours(new Date(), 1),
        resourceId: null,
        status: 'AVAILABLE',
        type: 'operating-hours'
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error('Có lỗi khi tạo sự kiện');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      if (selectedEvent.type === 'maintenance') {
        await deleteMaintenanceSchedule.mutateAsync({
          where: { id: selectedEvent.id }
        });

        const otherMaintenances = maintenanceSchedules?.filter(
          m => m.id !== selectedEvent.id && m.subfieldId === selectedEvent.resourceId
        );

        if (!otherMaintenances || otherMaintenances.length === 0) {
          await updateSubField.mutateAsync({
            where: { id: selectedEvent.resourceId },
            data: { status: 'AVAILABLE' }
          });
        }

        toast.success('Đã xóa lịch bảo trì và cập nhật trạng thái sân');
        refetchMaintenanceSchedules();
      }

      setShowEventDetails(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Có lỗi khi xóa sự kiện');
    }
  };

  const handleUpdateOperatingHours = async () => {
    if (!selectedField) {
      toast.error('Vui lòng chọn một sân trước khi cập nhật giờ mở cửa');
      return;
    }

    try {
      const existingOpeningHours = openingHoursData || [];

      for (const [day, hours] of Object.entries(operatingHours)) {
        const existingDay = existingOpeningHours.find(oh => oh.dayOfWeek === day);

        if (existingDay) {
          await updateOpeningHours.mutateAsync({
            where: { id: existingDay.id },
            data: {
              openTime: hours.start,
              closeTime: hours.end,
              isOpen: hours.enabled
            }
          });
        } else {
          await createOpeningHours.mutateAsync({
            data: {
              dayOfWeek: day as any,
              openTime: hours.start,
              closeTime: hours.end,
              isOpen: hours.enabled,
              field: {
                connect: { id: selectedField }
              }
            }
          });
        }
      }

      toast.success('Đã cập nhật giờ mở cửa');
      refetchOpeningHours();
    } catch (error) {
      console.error('Error updating opening hours:', error);
      toast.error('Có lỗi khi cập nhật giờ mở cửa');
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    let style: React.CSSProperties = {
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: '0px',
      display: 'block',
    };

    if (event.type === 'operating-hours') {
      style.backgroundColor = '#4ade80'; // Green
    } else if (event.type === 'maintenance') {
      style.backgroundColor = '#f97316'; // Orange
    } else if (event.type === 'booking') {
      style.backgroundColor = '#3b82f6'; // Blue
    }

    return { style };
  };

  const CustomToolbar = ({ label, onView, onNavigate }: any) => {
    return (
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onNavigate('TODAY')}>
            Hôm nay
          </Button>
          <Button variant="outline" onClick={() => onNavigate('PREV')}>
            &lt;
          </Button>
          <Button variant="outline" onClick={() => onNavigate('NEXT')}>
            &gt;
          </Button>
          <h3 className="text-base font-semibold">{label}</h3>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={view === Views.MONTH ? "default" : "outline"}
            onClick={() => onView(Views.MONTH)}
          >
            Tháng
          </Button>
          <Button
            variant={view === Views.WEEK ? "default" : "outline"}
            onClick={() => onView(Views.WEEK)}
          >
            Tuần
          </Button>
          <Button
            variant={view === Views.DAY ? "default" : "outline"}
            onClick={() => onView(Views.DAY)}
          >
            Ngày
          </Button>
          <Button
            variant={view === Views.AGENDA ? "default" : "outline"}
            onClick={() => onView(Views.AGENDA)}
          >
            Lịch trình
          </Button>
        </div>
      </div>
    );
  };
  useEffect(() => {
    if (openingHoursData && openingHoursData.length > 0) {
      const newOperatingHours = { ...operatingHours };

      openingHoursData.forEach(oh => {
        newOperatingHours[oh.dayOfWeek] = {
          start: oh.openTime,
          end: oh.closeTime,
          enabled: oh.isOpen
        };
      });

      setOperatingHours(newOperatingHours);
    }
  }, [openingHoursData]);

  useEffect(() => {
    if (!selectedField) {
      setEvents([]);
      return;
    }

    const allEvents: CalendarEvent[] = [];

    if (openingHoursData && openingHoursData.length > 0) {
      for (let i = 0; i < 7; i++) {
        const currentDate = addDays(new Date(), i);
        const dayOfWeek = format(currentDate, 'EEEE').toUpperCase() as keyof typeof operatingHours;
        const daySettings = operatingHours[dayOfWeek];

        if (daySettings?.enabled) {
          const [startHour, startMinute] = daySettings.start.split(':').map(Number);
          const [endHour, endMinute] = daySettings.end.split(':').map(Number);

          const startDate = new Date(currentDate);
          startDate.setHours(startHour, startMinute, 0);

          const endDate = new Date(currentDate);
          endDate.setHours(endHour, endMinute, 0);

          if (subFields.length > 0) {
            subFields.forEach(subField => {
              if (!selectedSubField || selectedSubField === subField.id) {
                allEvents.push({
                  id: `operating-${i}-${subField.id}`,
                  title: 'Giờ mở cửa',
                  start: startDate,
                  end: endDate,
                  resourceId: subField.id,
                  status: 'AVAILABLE',
                  type: 'operating-hours'
                });
              }
            });
          } else {
            allEvents.push({
              id: `operating-${i}`,
              title: 'Giờ mở cửa',
              start: startDate,
              end: endDate,
              resourceId: selectedField,
              status: 'AVAILABLE',
              type: 'operating-hours'
            });
          }
        }
      }
    }

    if (maintenanceSchedules && maintenanceSchedules.length > 0) {
      maintenanceSchedules.forEach(maintenance => {
        if (!selectedSubField || selectedSubField === maintenance.subfieldId) {
          allEvents.push({
            id: maintenance.id,
            title: 'Bảo trì sân',
            start: new Date(maintenance.startDate),
            end: new Date(maintenance.endDate),
            resourceId: maintenance.subfieldId,
            status: 'MAINTENANCE',
            type: 'maintenance',
            description: maintenance.reason || ''
          });
        }
      });
    }

    if (bookings && bookings.length > 0) {
      bookings.forEach(booking => {
        if (!selectedSubField || selectedSubField === booking.subfieldId) {
          allEvents.push({
            id: booking.id,
            title: 'Đã đặt sân',
            start: new Date(booking.beginTime),
            end: new Date(booking.endTime),
            resourceId: booking.subfieldId,
            status: 'RESERVED',
            type: 'booking'
          });
        }
      });
    }

    setEvents(allEvents);
  }, [selectedField, selectedSubField, subFields, operatingHours, openingHoursData, maintenanceSchedules, bookings]);
  return (
    <div className="container mx-auto py-4">
      <div className="flex flex-col space-y-5">
        <div>
          <p className="text-gray-500 mt-1">
            Quản lý giờ mở cửa và lịch bảo trì cho các sân
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Lịch hoạt động</CardTitle>
                <CardDescription>
                  Xem và quản lý lịch hoạt động cho các sân
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="w-full md:w-48">
                    <Label htmlFor="field-select" className="mb-1 block">Chọn sân</Label>
                    <Select
                      value={selectedField || ''}
                      onValueChange={(value) => {
                        setSelectedField(value);
                        setSelectedSubField(null);
                      }}
                    >
                      <SelectTrigger id="field-select">
                        <SelectValue placeholder="Chọn sân" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        {fields && fields.length > 0 ? (
                          fields.map((field) => (
                            <SelectItem key={field.id} value={field.id}>
                              {field.location}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-fields" disabled>
                            Không có sân nào
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full md:w-48">
                    <Label htmlFor="subfield-select" className="mb-1 block">Chọn sân con</Label>
                    <Select
                      value={selectedSubField || 'all'}
                      onValueChange={(value) => {
                        setSelectedSubField(value === 'all' ? null : value);
                      }}
                      disabled={!selectedField || subFields.length === 0}
                    >
                      <SelectTrigger id="subfield-select">
                        <SelectValue placeholder="Tất cả sân con" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="all">Tất cả sân con</SelectItem>
                        {subFields.map((subField) => (
                          <SelectItem key={subField.id} value={subField.id}>
                            {subField.subfieldDescription}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div style={{ height: 700 }}>
                  {isLoadingOwner || isLoadingFields ? (
                    <div className="h-full flex items-center justify-center">
                      <p>Đang tải dữ liệu...</p>
                    </div>
                  ) : (
                    <Calendar
                      localizer={localizer}
                      events={events}
                      startAccessor="start"
                      endAccessor="end"
                      style={{ height: '100%' }}
                      views={['month', 'week', 'day', 'agenda']}
                      defaultView={Views.WEEK}
                      view={view as any}
                      onView={(view) => setView(view)}
                      date={date}
                      onNavigate={date => setDate(date)}
                      selectable
                      onSelectSlot={handleSelectSlot}
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
                        noEventsInRange: 'Không có sự kiện nào trong khoảng thời gian này',
                      }}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings size={16} /> Thiết lập
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <Tabs defaultValue="operating-hours">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="operating-hours">Giờ mở cửa</TabsTrigger>
                    <TabsTrigger value="maintenance">Bảo trì</TabsTrigger>
                  </TabsList>

                  <TabsContent value="operating-hours">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Thiết lập giờ mở cửa</h3>
                      </div>
                      {Object.entries(operatingHours).map(([day, hours]) => (
                        <div key={day} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4">
                            <Label className="capitalize">
                              {day === 'MONDAY' ? 'Thứ 2' :
                                day === 'TUESDAY' ? 'Thứ 3' :
                                  day === 'WEDNESDAY' ? 'Thứ 4' :
                                    day === 'THURSDAY' ? 'Thứ 5' :
                                      day === 'FRIDAY' ? 'Thứ 6' :
                                        day === 'SATURDAY' ? 'Thứ 7' : 'CN'}
                            </Label>
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="time"
                              value={hours.start}
                              onChange={(e) => setOperatingHours({
                                ...operatingHours,
                                [day]: { ...hours, start: e.target.value }
                              })}
                              disabled={!hours.enabled}
                            />
                          </div>
                          <div className="col-span-1 text-center">-</div>
                          <div className="col-span-3">
                            <Input
                              type="time"
                              value={hours.end}
                              onChange={(e) => setOperatingHours({
                                ...operatingHours,
                                [day]: { ...hours, end: e.target.value }
                              })}
                              disabled={!hours.enabled}
                            />
                          </div>
                          <div className="col-span-1 flex justify-end">
                            <input
                              type="checkbox"
                              checked={hours.enabled}
                              onChange={(e) => setOperatingHours({
                                ...operatingHours,
                                [day]: { ...hours, enabled: e.target.checked }
                              })}
                              className="h-4 w-4"
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        className="w-full mt-4"
                        onClick={handleUpdateOperatingHours}
                        disabled={!selectedField || isLoadingOpeningHours}
                      >
                        {isLoadingOpeningHours ? 'Đang tải...' : 'Cập nhật giờ mở cửa'}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="maintenance">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Lịch bảo trì</h3>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-gray-500">
                          Tạo lịch bảo trì cho sân bằng cách chọn khoảng thời gian trên lịch và
                          chọn loại sự kiện là "Bảo trì".
                        </p>

                        <div className="p-3 bg-orange-50 rounded-md">
                          <div className="flex gap-2 items-start">
                            <Wrench className="h-5 w-5 text-orange-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-orange-700">Lưu ý về bảo trì</p>
                              <p className="text-sm text-orange-600">
                                Khi tạo lịch bảo trì, trạng thái của sân sẽ được tự động cập nhật
                                thành "Bảo trì" trong khoảng thời gian đã chọn.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="outline"
                          className="w-full"
                          disabled={!selectedField || subFields.length === 0 || (!selectedSubField && selectedSubField !== null)}
                          onClick={() => {
                            if (selectedField && (selectedSubField || subFields.length === 0)) {
                              setNewEvent({
                                ...newEvent,
                                title: 'Bảo trì sân',
                                type: 'maintenance',
                                status: 'MAINTENANCE',
                                resourceId: selectedSubField || (subFields.length > 0 ? subFields[0].id : selectedField),
                              });
                              setShowEventModal(true);
                            } else {
                              toast.error('Vui lòng chọn sân và sân con trước khi tạo lịch bảo trì');
                            }
                          }}
                        >
                          Tạo lịch bảo trì mới
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Chú thích màu</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-green-500 rounded-sm"></div>
                    <span className="text-sm">Giờ mở cửa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-orange-500 rounded-sm"></div>
                    <span className="text-sm">Bảo trì</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 bg-blue-500 rounded-sm"></div>
                    <span className="text-sm">Đã đặt sân</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo sự kiện mới</DialogTitle>
            <DialogDescription>
              Vui lòng điền thông tin chi tiết cho sự kiện mới
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="event-title">Tiêu đề</Label>
              <Input
                id="event-title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="Nhập tiêu đề sự kiện"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="event-type">Loại sự kiện</Label>
              <Select
                value={newEvent.type}
                onValueChange={(value: 'operating-hours' | 'maintenance') => {
                  setNewEvent({
                    ...newEvent,
                    type: value,
                    status: value === 'maintenance' ? 'MAINTENANCE' : 'AVAILABLE'
                  });
                }}
              >
                <SelectTrigger id="event-type">
                  <SelectValue placeholder="Chọn loại sự kiện" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="operating-hours">Giờ mở cửa</SelectItem>
                  <SelectItem value="maintenance">Bảo trì</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="event-start">Thời gian bắt đầu</Label>
                <Input
                  id="event-start"
                  type="datetime-local"
                  value={format(newEvent.start, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setNewEvent({ ...newEvent, start: new Date(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="event-end">Thời gian kết thúc</Label>
                <Input
                  id="event-end"
                  type="datetime-local"
                  value={format(newEvent.end, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) => setNewEvent({ ...newEvent, end: new Date(e.target.value) })}
                />
              </div>
            </div>

            {newEvent.type === 'maintenance' && (
              <div className="grid gap-2">
                <Label htmlFor="event-reason">Lý do bảo trì</Label>
                <Textarea
                  id="event-reason"
                  value={newEvent.reason || ''}
                  onChange={(e) => setNewEvent({ ...newEvent, reason: e.target.value })}
                  placeholder="Nhập lý do bảo trì"
                  rows={3}
                />
              </div>
            )}

            {subFields.length > 0 && (
              <div className="grid gap-2">
                <Label htmlFor="event-subfield">Sân con</Label>
                <Select
                  value={newEvent.resourceId || ''}
                  onValueChange={(value) => setNewEvent({ ...newEvent, resourceId: value })}
                >
                  <SelectTrigger id="event-subfield">
                    <SelectValue placeholder="Chọn sân con" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {subFields.map((subField, index) => (
                      <SelectItem key={subField.id} value={subField.id}>
                        Sân con {index + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventModal(false)}>Hủy</Button>
            <Button onClick={handleCreateEvent}>Tạo sự kiện</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEventDetails} onOpenChange={setShowEventDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chi tiết sự kiện</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Tiêu đề</p>
                  <p className="font-medium">{selectedEvent.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Loại</p>
                  <p className="font-medium capitalize">
                    {selectedEvent.type === 'operating-hours' ? 'Giờ mở cửa' :
                      selectedEvent.type === 'maintenance' ? 'Bảo trì' : 'Đặt sân'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Thời gian bắt đầu</p>
                  <p className="font-medium">{format(selectedEvent.start, 'HH:mm - dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Thời gian kết thúc</p>
                  <p className="font-medium">{format(selectedEvent.end, 'HH:mm - dd/MM/yyyy')}</p>
                </div>
              </div>

              {selectedEvent.description && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500">Mô tả</p>
                  <p className="font-medium">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.type === 'booking' ? (
                <p className="text-sm text-center mt-2">
                  Xem chi tiết đặt sân tại trang quản lý đặt sân
                </p>
              ) : selectedEvent.type === 'maintenance' ? (
                <div className="flex justify-center mt-4">
                  <Button variant="destructive" onClick={handleDeleteEvent}>
                    Xóa lịch bảo trì
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleManagementPage;