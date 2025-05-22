"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useFindManyBooking, useCreateReview } from "@/generated/hooks";
import { getUserId } from "@/utils/auth";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import Link from "next/link";
import { Calendar, Clock, Filter, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import toast from 'react-hot-toast';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type BookingStatus = "pending" | "paid" | "cancel";

const BookingStatusBadge = ({ status }: { status: BookingStatus }) => {
  const statusConfig = {
    pending: { label: "Chờ xác nhận", className: "bg-yellow-100 text-yellow-800" },
    paid: { label: "Đã thanh toán", className: "bg-green-100 text-green-800" },
    cancel: { label: "Đã hủy", className: "bg-red-100 text-red-800" },
  };

  const config = statusConfig[status] || statusConfig.pending;
  
  return (
    <Badge className={config.className}>
      {config.label}
    </Badge>
  );
};

export default function BookingHistoryPage() {
  const userId = getUserId();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "ALL">("ALL");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const pageSize = 10;
  
  const { data: bookingsData, isLoading, refetch } = useFindManyBooking(
    {
      where: {
        customUser: {
          accountId: userId || "",
        },
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      },
      include: {
        subfield: {
          include: {
            field: true,
          },
        },
        review: true,
      },
      orderBy: {
        createdAt: sortOrder,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    },
    {
      enabled: !!userId,
    }
  );
  console.log("bookingsData", bookingsData);
  const { data: totalBookings } = useFindManyBooking(
    {
      where: {
        customUser: {
          accountId: userId || "",
        },
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
      },
      select: {
        id: true,
      },
    },
    {
      enabled: !!userId,
    }
  );

  const totalPages = Math.ceil((totalBookings?.length || 0) / pageSize);

  const formatDateTime = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return format(date, "EEEE, dd/MM/yyyy", { locale: vi });
  };

  const formatTime = (timeString: string | Date | null | undefined) => {
    if (!timeString) return "N/A";
    return typeof timeString === 'string' ? timeString.substring(0, 5) : 
           timeString instanceof Date ? format(timeString, "HH:mm") : "N/A";
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value as BookingStatus | "ALL");
    setPage(1);
  };

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value as "asc" | "desc");
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
     

      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle>Danh sách đơn đặt sân</CardTitle>
              <CardDescription>
                Quản lý tất cả các đơn đặt sân của bạn. Trạng thái đơn: chờ xác nhận (pending), 
                đã thanh toán (paid), đã hủy (cancel).
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <Select
                  defaultValue="ALL"
                  value={statusFilter}
                  onValueChange={handleStatusFilterChange}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    <SelectItem value="pending">Chờ xác nhận</SelectItem>
                    <SelectItem value="paid">Đã thanh toán</SelectItem>
                    <SelectItem value="cancel">Đã hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <Select
                  defaultValue="desc"
                  value={sortOrder}
                  onValueChange={handleSortOrderChange}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sắp xếp" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="desc">Mới nhất trước</SelectItem>
                    <SelectItem value="asc">Cũ nhất trước</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
                    <Link href="/home">
                        Đặt sân mới
                    </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {bookingsData && bookingsData.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Sân</TableHead>
                      <TableHead className="hidden md:table-cell">Ngày đặt</TableHead>
                      <TableHead>Khung giờ</TableHead>
                      <TableHead className="hidden md:table-cell">Phương thức thanh toán</TableHead>
                      <TableHead className="hidden md:table-cell">Tổng tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Đánh giá</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookingsData.map((booking, index) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {(page - 1) * pageSize + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {booking.subfield?.field?.location || "Không xác định"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {booking.subfield?.subfieldDescription || "Sân con"}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {formatDateTime(booking.date)}
                        </TableCell>
                        <TableCell>
                          {formatTime(booking.beginTime)} - {formatTime(booking.endTime)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell capitalize">
                          {booking.paymentMethod?.toLowerCase() || "Chưa thanh toán"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {(booking.price || 0).toLocaleString()}đ
                        </TableCell>
                        <TableCell>
                          <BookingStatusBadge status={booking.status as BookingStatus} />
                        </TableCell>
                        <TableCell>
                          {booking.status === "paid" && !booking.review ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Star className="h-3 w-3 mr-1" />
                                  Đánh giá
                                </Button>
                              </DialogTrigger>
                              <RatingDialog bookingId={booking.id} subfieldId={booking.subfieldId} refetch={refetch} />
                            </Dialog>
                          ) : booking.review ? (
                            <div className="flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < (booking.review?.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Chưa đánh giá
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Link href={`/customer/booking-details/${booking.id}`}>
                              <Button variant="outline" size="sm">
                                Chi tiết
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }).map((_, i) => {
                      if (
                        i === 0 || 
                        i === totalPages - 1 || 
                        (i >= page - 3 && i <= page + 1)
                      ) {
                        return (
                          <PaginationItem key={i}>
                            <PaginationLink
                              isActive={page === i + 1}
                              onClick={() => setPage(i + 1)}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      } else if (
                        (i === 1 && page > 4) || 
                        (i === totalPages - 2 && page < totalPages - 4)
                      ) {
                        return (
                          <PaginationItem key={i}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <Calendar className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">Chưa có lịch sử đặt sân</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                Bạn chưa có đơn đặt sân nào. Hãy đặt sân ngay để trải nghiệm dịch vụ của chúng tôi.
              </p>
              <Link href="/customer/court-search">
                <Button>Tìm sân ngay</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RatingDialog({ bookingId, subfieldId, refetch }: { bookingId: string, subfieldId: string, refetch: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createReview = useCreateReview();
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const loadingToast = toast.loading('Đang gửi đánh giá...');
    
    try {
      createReview.mutate(
        {
          data: {
            bookingId: bookingId,
            rating: rating,
            text: comment,
          },
        },
        {
          onSuccess: () => {
            toast.dismiss(loadingToast);
            toast.success('Đã gửi đánh giá của bạn thành công');
            
            refetch();
            setIsSubmitting(false);
          },
          onError: (error) => {
            console.error("Lỗi khi gửi đánh giá:", error);
            toast.dismiss(loadingToast);
            toast.error(`Không thể gửi đánh giá: ${error.message}`);
            setIsSubmitting(false);
          }
        }
      );
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      toast.dismiss(loadingToast);
      toast.error('Không thể gửi đánh giá. Vui lòng thử lại sau');
      setIsSubmitting(false);
    }
  };
  
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Đánh giá trải nghiệm đặt sân</DialogTitle>
        <DialogDescription>
          Hãy chia sẻ trải nghiệm của bạn về sân và dịch vụ để giúp chúng tôi cải thiện chất lượng.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="rating" className="text-center mb-2">Đánh giá của bạn</Label>
          <div className="flex justify-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-8 w-8 cursor-pointer ${
                  i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                }`}
                onClick={() => setRating(i + 1)}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="comment">Nhận xét</Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Nhập nhận xét của bạn về sân và dịch vụ..."
            rows={4}
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Hủy</Button>
        </DialogClose>
        <DialogClose asChild>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
} 