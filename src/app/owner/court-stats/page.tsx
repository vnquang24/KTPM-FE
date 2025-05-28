'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  useFindFirstOwner,
  useFindManyField,
  useFindManyBooking,
  useFindManySubField,
  useFindManyReview
} from '@/generated/hooks';
import { getUserId } from '@/utils/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { Calendar, ArrowUpDown, TrendingUp, Activity, Users, Star, DollarSign, BookOpen } from 'lucide-react';

const CourtStatsPage: React.FC = () => {
  const [selectedField, setSelectedField] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedQuarter, setSelectedQuarter] = useState<string>(`${new Date().getFullYear()}-Q${Math.floor(new Date().getMonth() / 3) + 1}`);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [customStartDate, setCustomStartDate] = useState<string>(format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));

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

  const { data: subfields } = useFindManySubField({
    where: {
      field: {
        ownerId: owner?.id,
        ...(selectedField !== 'all' ? { id: selectedField } : {})
      }
    },
    include: {
      field: true
    }
  }, {
    enabled: !!owner?.id,
  });

  const [startDate, endDate] = useMemo(() => {
    const today = new Date();

    if (selectedDateRange === 'month') {
      const [year, month] = selectedMonth.split('-').map(Number);
      const start = startOfMonth(new Date(year, month - 1));
      const end = endOfMonth(new Date(year, month - 1));
      return [start, end];
    } else if (selectedDateRange === 'quarter') {
      const [year, quarter] = selectedQuarter.split('-Q');
      const quarterNumber = parseInt(quarter) - 1; // 0-3 for quarters
      const start = startOfQuarter(new Date(parseInt(year), quarterNumber * 3, 1));
      const end = endOfQuarter(new Date(parseInt(year), quarterNumber * 3, 1));
      return [start, end];
    } else if (selectedDateRange === 'year') {
      const year = parseInt(selectedYear);
      const start = startOfYear(new Date(year, 0, 1));
      const end = endOfYear(new Date(year, 0, 1));
      return [start, end];
    } else if (selectedDateRange === 'custom') {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      return [start, end];
    }

    return [startOfMonth(today), endOfMonth(today)];
  }, [selectedDateRange, selectedMonth, selectedQuarter, selectedYear, customStartDate, customEndDate]);

  const { data: bookings } = useFindManyBooking({
    where: {
      subfield: {
        field: {
          ownerId: owner?.id,
          ...(selectedField !== 'all' ? { id: selectedField } : {})
        }
      },
      date: {
        gte: startDate,
        lte: endDate
      },
      status: {
        in: ['paid'] // Only count completed bookings 
      }
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
    }
  }, {
    enabled: !!owner?.id && !!startDate && !!endDate,
  });
  const { data: reviews } = useFindManyReview({
    where: {
      booking: {
        subfield: {
          field: {
            ownerId: owner?.id,
            ...(selectedField !== 'all' ? { id: selectedField } : {})
          }
        },
        date: {
          gte: startDate,
          lte: endDate
        }
      }
    },
    include: {
      booking: {
        include: {
          subfield: {
            include: {
              field: true
            }
          }
        }
      }
    }
  }, {
    enabled: !!owner?.id && !!startDate && !!endDate,
  });
  console.log(reviews);


  const bookingsPerCourt = useMemo(() => {
    if (!bookings || !fields) return [];

    const bookingCounts: Record<string, { id: string, name: string, shortName: string, count: number, revenue: number }> = {};

    fields.forEach(field => {
      const shortName = field.location.length > 15
        ? field.location.substring(0, 15) + '...'
        : field.location;

      bookingCounts[field.id] = {
        id: field.id,
        name: field.location,
        shortName: shortName,
        count: 0,
        revenue: 0
      };
    });

    bookings.forEach(booking => {
      const fieldId = booking.subfield?.fieldId;
      if (fieldId && bookingCounts[fieldId]) {
        bookingCounts[fieldId].count += 1;
        bookingCounts[fieldId].revenue += booking.price;
      }
    });

    return Object.values(bookingCounts);
  }, [bookings, fields]);

  const bookingsPerSubfield = useMemo(() => {
    if (!bookings || !subfields) return [];

    const subfieldBookings: Record<string, { id: string, name: string, fieldName: string, count: number, revenue: number }> = {};

    subfields.forEach(subfield => {
      const subfieldName = subfield.subfieldDescription
        ? subfield.subfieldDescription
        : `Sân ${subfield.id.substring(0, 4)}`;

      subfieldBookings[subfield.id] = {
        id: subfield.id,
        name: subfieldName,
        fieldName: subfield.field?.location || '',
        count: 0,
        revenue: 0
      };
    });

    bookings.forEach(booking => {
      const subfieldId = booking.subfieldId;
      if (subfieldId && subfieldBookings[subfieldId]) {
        subfieldBookings[subfieldId].count += 1;
        subfieldBookings[subfieldId].revenue += booking.price;
      }
    });

    return Object.values(subfieldBookings);
  }, [bookings, subfields]);

  const dailyBookingTrends = useMemo(() => {
    if (!bookings || !startDate || !endDate) return [];

    const dailyData: Record<string, { date: string, count: number, revenue: number }> = {};

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    days.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      dailyData[dateStr] = { date: format(day, 'dd/MM', { locale: vi }), count: 0, revenue: 0 };
    });

    bookings.forEach(booking => {
      const dateStr = format(new Date(booking.date), 'yyyy-MM-dd');
      if (dailyData[dateStr]) {
        dailyData[dateStr].count += 1;
        dailyData[dateStr].revenue += booking.price;
      }
    });

    return Object.values(dailyData);
  }, [bookings, startDate, endDate]);

  const revenueDistribution = useMemo(() => {
    if (!bookings || !fields) return [];

    const revenueData: { name: string, shortName: string, value: number, color: string }[] = [];
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

    const fieldRevenues: Record<string, number> = {};

    bookings.forEach(booking => {
      const fieldId = booking.subfield?.fieldId;
      if (fieldId) {
        if (!fieldRevenues[fieldId]) {
          fieldRevenues[fieldId] = 0;
        }
        fieldRevenues[fieldId] += booking.price;
      }
    });

    Object.keys(fieldRevenues).forEach((fieldId, index) => {
      const field = fields.find(f => f.id === fieldId);
      if (field) {
        const shortName = field.location.length > 15
          ? field.location.substring(0, 15) + '...'
          : field.location;

        revenueData.push({
          name: field.location,
          shortName: shortName,
          value: fieldRevenues[fieldId],
          color: colors[index % colors.length]
        });
      }
    });

    return revenueData;
  }, [bookings, fields]);

  const subFieldRevenueDistribution = useMemo(() => {
    if (!bookings || !fields) return {};

    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300',
      '#b19cd9', '#90ee90', '#ffb6c1', '#87ceeb', '#f08080', '#e6e6fa', '#d8bfd8', '#dda0dd'];

    const result: Record<string, {
      fieldName: string,
      totalRevenue: number,
      subfields: { name: string, value: number, color: string }[]
    }> = {};

    fields.forEach(field => {
      result[field.id] = {
        fieldName: field.location,
        totalRevenue: 0,
        subfields: []
      };

      if (field.subFields && field.subFields.length > 0) {
        field.subFields.forEach((subfield, index) => {
          const subfieldName = subfield.subfieldDescription
            ? subfield.subfieldDescription
            : `Sân ${subfield.id.substring(0, 4)}`;

          result[field.id].subfields.push({
            name: subfieldName,
            value: 0,
            color: colors[index % colors.length]
          });
        });
      }
    });

    bookings.forEach(booking => {
      const fieldId = booking.subfield?.fieldId;
      const subfieldId = booking.subfieldId;

      if (fieldId && result[fieldId]) {
        result[fieldId].totalRevenue += booking.price;

        const subfieldName = booking.subfield?.subfieldDescription
          ? booking.subfield.subfieldDescription
          : `Sân ${subfieldId.substring(0, 4)}`;

        const subfieldIndex = result[fieldId].subfields.findIndex(
          sf => sf.name === subfieldName
        );

        if (subfieldIndex >= 0) {
          result[fieldId].subfields[subfieldIndex].value += booking.price;
        } else {
          result[fieldId].subfields.push({
            name: subfieldName,
            value: booking.price,
            color: colors[result[fieldId].subfields.length % colors.length]
          });
        }
      }
    });

    Object.keys(result).forEach(fieldId => {
      if (result[fieldId].totalRevenue === 0) {
        delete result[fieldId];
      } else {
        result[fieldId].subfields = result[fieldId].subfields.filter(sf => sf.value > 0);
      }
    });

    return result;
  }, [bookings, fields]);

  const getDateRangeDisplay = useMemo(() => {
    if (selectedDateRange === 'month') {
      return `Tháng ${format(startDate, 'MM/yyyy')}`;
    } else if (selectedDateRange === 'quarter') {
      const quarterNumber = Math.floor(startDate.getMonth() / 3) + 1;
      return `Quý ${quarterNumber}/${startDate.getFullYear()}`;
    } else if (selectedDateRange === 'year') {
      return `Năm ${startDate.getFullYear()}`;
    } else if (selectedDateRange === 'custom') {
      return `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`;
    }
    return `${format(startDate, 'dd/MM/yyyy')} - ${format(endDate, 'dd/MM/yyyy')}`;
  }, [selectedDateRange, startDate, endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="text-sm">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-sm" style={{ color: entry.color }}>
              {entry.name === 'revenue' ? `Doanh thu: ${formatCurrency(entry.value)} VNĐ` : `Lượt đặt: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="container mx-auto py-4">
      <div className="flex flex-col space-y-5">
        <div>
          <p className="text-gray-500 mt-1">
            Xem thông tin thống kê lượt đặt và doanh thu theo sân ({getDateRangeDisplay})
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Bộ lọc</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid gap-4 ${selectedDateRange === 'custom' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
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
                <Label htmlFor="date-range" className="mb-2 block">Khoảng thời gian</Label>
                <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                  <SelectTrigger id="date-range">
                    <SelectValue placeholder="Chọn khoảng thời gian" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="month">Theo tháng</SelectItem>
                    <SelectItem value="quarter">Theo quý</SelectItem>
                    <SelectItem value="year">Theo năm</SelectItem>
                    <SelectItem value="custom">Tùy chọn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedDateRange === 'month' && (
                <div>
                  <Label htmlFor="month-select" className="mb-2 block">Tháng</Label>
                  <input
                    type="month"
                    id="month-select"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              )}

              {selectedDateRange === 'quarter' && (
                <div>
                  <Label htmlFor="quarter-select" className="mb-2 block">Quý</Label>
                  <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                    <SelectTrigger id="quarter-select">
                      <SelectValue placeholder="Chọn quý" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {[...Array(3)].map((_, yearOffset) => {
                        const year = new Date().getFullYear() - yearOffset;
                        return [1, 2, 3, 4].map(quarter => (
                          <SelectItem key={`${year}-Q${quarter}`} value={`${year}-Q${quarter}`}>
                            Quý {quarter}/{year}
                          </SelectItem>
                        ));
                      }).flat()}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedDateRange === 'year' && (
                <div>
                  <Label htmlFor="year-select" className="mb-2 block">Năm</Label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger id="year-select">
                      <SelectValue placeholder="Chọn năm" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {[...Array(5)].map((_, yearOffset) => {
                        const year = new Date().getFullYear() - yearOffset;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            Năm {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedDateRange === 'custom' && (
                <div className="col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date" className="mb-2 block">Từ ngày</Label>
                      <input
                        type="date"
                        id="start-date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="end-date" className="mb-2 block">Đến ngày</Label>
                      <input
                        type="date"
                        id="end-date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        min={customStartDate}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Lượt Đặt Theo Sân
              </CardTitle>
              <CardDescription>
                So sánh số lượt đặt giữa các sân - {getDateRangeDisplay}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={bookingsPerCourt}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortName" />
                    <YAxis />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-md shadow-md">
                              <p className="text-sm font-medium">{data.name}</p>
                              <p className="text-sm text-gray-600">Lượt đặt: {data.count}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" name="Lượt đặt" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Doanh Thu Theo Sân
              </CardTitle>
              <CardDescription>
                So sánh doanh thu giữa các sân - {getDateRangeDisplay}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={bookingsPerCourt}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="shortName" />
                    <YAxis
                      tickFormatter={(value) =>
                        value >= 1000000
                          ? `${value / 1000000}M`
                          : value >= 1000
                            ? `${value / 1000}K`
                            : value
                      }
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-md shadow-md">
                              <p className="text-sm font-medium">{data.name}</p>
                              <p className="text-sm text-gray-600">Doanh thu: {formatCurrency(data.revenue)} VNĐ</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Doanh thu" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Xu Hướng Lượt Đặt Sân Theo Ngày
              </CardTitle>
              <CardDescription>
                Số lượt đặt sân theo ngày - {getDateRangeDisplay}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyBookingTrends}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="count" name="Lượt đặt" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Xu Hướng Doanh Thu Theo Ngày
              </CardTitle>
              <CardDescription>
                Doanh thu theo ngày - {getDateRangeDisplay}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={dailyBookingTrends}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis
                      tickFormatter={(value) =>
                        value >= 1000000
                          ? `${value / 1000000}M`
                          : value >= 1000
                            ? `${value / 1000}K`
                            : value
                      }
                    />
                    <Tooltip
                      formatter={(value: number) => [`${formatCurrency(value)} VNĐ`, 'Doanh thu']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#82ca9d" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Phân Phối Doanh Thu Theo Sân
              </CardTitle>
              <CardDescription>
                Tỷ lệ đóng góp doanh thu của các sân - {getDateRangeDisplay}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      nameKey="shortName"
                      label={({ shortName, percent }) => `${shortName} ${(percent * 100).toFixed(0)}%`}
                    >
                      {revenueDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white p-3 border rounded-md shadow-md">
                              <p className="text-sm font-medium">{data.name}</p>
                              <p className="text-sm text-gray-600">Doanh thu: {formatCurrency(data.value)} VNĐ</p>
                              <p className="text-sm text-gray-600">Tỷ lệ: {(data.percent * 100).toFixed(1)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpDown className="h-5 w-5" />
                Phân Phối Doanh Thu Theo Sân Con
              </CardTitle>
              <CardDescription>
                Tỷ lệ đóng góp doanh thu của các sân con - {getDateRangeDisplay}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.keys(subFieldRevenueDistribution).length > 0 ? (
                  Object.keys(subFieldRevenueDistribution).map((fieldId) => {
                    const fieldData = subFieldRevenueDistribution[fieldId];
                    if (fieldData.subfields.length === 0) return null;

                    return (
                      <div key={fieldId} className="space-y-2">
                        <h4 className="text-sm font-medium">{fieldData.fieldName} - {formatCurrency(fieldData.totalRevenue)} VNĐ</h4>
                        <div className="h-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={fieldData.subfields}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={60}
                                paddingAngle={5}
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => {
                                  const displayName = name.length > 15 ? name.substring(0, 15) + '...' : name;
                                  return `${displayName} ${(percent * 100).toFixed(0)}%`;
                                }}
                              >
                                {fieldData.subfields.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                      <div className="bg-white p-3 border rounded-md shadow-md">
                                        <p className="text-sm font-medium">{data.name}</p>
                                        <p className="text-sm text-gray-600">Doanh thu: {formatCurrency(data.value)} VNĐ</p>
                                        <p className="text-sm text-gray-600">Tỷ lệ: {(data.percent * 100).toFixed(1)}%</p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <Separator className="my-2" />
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-60 text-gray-500">
                    <p>Không có dữ liệu doanh thu cho các sân con</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Chi Tiết Theo Sân Con
            </CardTitle>
            <CardDescription>
              Thống kê chi tiết theo từng sân con - {getDateRangeDisplay}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto border rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sân
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sân con
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lượt đặt
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doanh thu
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookingsPerSubfield.map((subfield) => {
                    const totalBookings = bookings?.length || 0;
                    const totalRevenue = bookings?.reduce((total, booking) => total + booking.price, 0) || 0;
                    const bookingPercentage = totalBookings > 0 ? (subfield.count / totalBookings) * 100 : 0;
                    const revenuePercentage = totalRevenue > 0 ? (subfield.revenue / totalRevenue) * 100 : 0;

                    return (
                      <tr key={subfield.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {subfield.fieldName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subfield.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {subfield.count} ({bookingPercentage.toFixed(1)}%)
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatCurrency(subfield.revenue)} VNĐ
                          <span className="text-xs text-green-600 ml-2">
                            ({revenuePercentage.toFixed(1)}% tổng doanh thu)
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CourtStatsPage;