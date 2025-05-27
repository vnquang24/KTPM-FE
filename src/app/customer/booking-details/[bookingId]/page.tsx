"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFindUniqueBooking, useUpdateBooking } from "@/generated/hooks";
import { getUserId } from "@/utils/auth";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast, useToast } from "@/components/ui/use-toast";
import {
  Calendar,
  Clock,
  CreditCard,
  MapPin,
  Star,
  User,
  Phone,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Info,
} from "lucide-react";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

type BookingStatus = "pending" | "paid" | "cancel";

// Hàm normalize để chuyển status về lowercase
const normalizeStatus = (status: string): BookingStatus => {
  return status.toLowerCase() as BookingStatus;
};

const BookingStatusBadge = ({ status }: { status: BookingStatus }) => {
  const normalizedStatus = normalizeStatus(status);
  const statusConfig = {
    pending: { label: "Chờ xác nhận", className: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-4 w-4 mr-1" /> },
    paid: { label: "Đã thanh toán", className: "bg-green-100 text-green-800", icon: <CheckCircle2 className="h-4 w-4 mr-1" /> },
    cancel: { label: "Đã hủy", className: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-4 w-4 mr-1" /> },
  };

  const config = statusConfig[normalizedStatus] || statusConfig.pending;
  
  return (
    <Badge className={`text-sm py-1 px-2 flex items-center ${config.className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};

// Component dialog hủy đặt sân với xác nhận hoàn tiền
function CancelBookingDialog({ booking, onCancel }: { booking: any, onCancel: () => void }) {
  const [isConfirmedRefund, setIsConfirmedRefund] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    if (!isConfirmedRefund) {
      toast({
        title: "Chưa xác nhận",
        description: "Vui lòng xác nhận đã nhận được tiền hoàn từ chủ sân",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onCancel();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle className="flex items-center text-red-600">
          <AlertTriangle className="h-5 w-5 mr-2" />
          Hủy đơn đặt sân
        </DialogTitle>
        <DialogDescription>
          Quy trình hủy đặt sân và hoàn tiền
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-medium text-blue-800">Hướng dẫn hủy đặt sân:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700">
                <li>Gọi điện trực tiếp cho chủ sân để thông báo hủy đặt sân</li>
                <li>Yêu cầu chủ sân hoàn lại tiền đặt</li>
                <li>Xác nhận đã nhận được tiền hoàn bên dưới</li>
                <li>Bấm "Xác nhận hủy" để hoàn tất quy trình</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border rounded-lg p-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Phone className="h-4 w-4 text-gray-500 mr-2" />
              <span className="font-medium">Thông tin liên hệ chủ sân:</span>
            </div>
            <div className="ml-6 space-y-1">
              <p><span className="font-medium">Tên:</span> {booking.subfield?.field?.owner?.account?.username || "Không có thông tin"}</p>
              <p><span className="font-medium">Số điện thoại:</span> 
                <a 
                  href={`tel:${booking.subfield?.field?.owner?.account?.phone}`}
                  className="text-blue-600 hover:underline ml-1 font-medium"
                >
                  {booking.subfield?.field?.owner?.account?.phone || "Không có thông tin"}
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="confirm-refund"
              checked={isConfirmedRefund}
              onCheckedChange={(checked) => setIsConfirmedRefund(checked as boolean)}
            />
            <div className="flex-1">
              <Label 
                htmlFor="confirm-refund" 
                className="text-sm font-medium cursor-pointer"
              >
                Tôi xác nhận đã liên hệ và nhận được tiền hoàn từ chủ sân
              </Label>
              <p className="text-xs text-gray-500 mt-1">
                Chỉ tick vào ô này khi bạn đã thực sự nhận được tiền hoàn từ chủ sân
              </p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="flex gap-2">
        <DialogClose asChild>
          <Button variant="outline">Đóng</Button>
        </DialogClose>
        <Button 
          onClick={handleCancel}
          disabled={!isConfirmedRefund || isSubmitting}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          {isSubmitting ? "Đang xử lý..." : "Xác nhận hủy"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;
  const userId = getUserId();
  
  const { data: booking, isLoading, refetch } = useFindUniqueBooking(
    {
      where: {
        id: bookingId,
      },
      include: {
        customUser: {
          include: {
            account: true,
          },
        },
        subfield: {
          include: {
            field: {
              include: {
                owner: {
                  include: {
                    account: true,
                  },
                },
              },
            },
          },
        },
        review: true,
      },
    },
    {
      enabled: !!bookingId && !!userId,
    }
  );
  console.log(booking);
  const updateBooking = useUpdateBooking();
  
  const cancelBooking = async () => {
    updateBooking.mutate(
      {
        where: {
          id: bookingId,
        },
        data: {
          status: "cancel",
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Thành công",
            description: "Đơn đặt sân đã được hủy thành công",
          });
          refetch();
        },
        onError: (error) => {
          toast({
            title: "Lỗi",
            description: `Không thể hủy đơn đặt sân: ${error.message}`,
            variant: "destructive",
          });
        },
      }
    );
  };
  
  const formatDateTime = (dateString: Date | string) => {
    return format(new Date(dateString), "EEEE, dd/MM/yyyy", { locale: vi });
  };

  const formatTime = (timeString: Date | string) => {
    if (timeString instanceof Date) {
      return format(timeString, "HH:mm");
    }
    return typeof timeString === 'string' ? timeString.substring(0, 5) : "";
  };
  
  if (isLoading) {
    return <div className="flex justify-center py-8">Đang tải...</div>;
  }
  
  if (!booking) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Không tìm thấy đơn đặt sân</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Đơn đặt sân bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền truy cập.
        </p>
        <Link href="/customer/booking-history">
          <Button>Quay lại lịch sử đặt sân</Button>
        </Link>
      </div>
    );
  }
  
  if (booking.customUser?.account?.id !== userId) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <AlertTriangle className="h-16 w-16 text-yellow-500 mb-4" />
        <h3 className="text-lg font-medium mb-2">Không có quyền truy cập</h3>
        <p className="text-muted-foreground text-center max-w-md mb-6">
          Bạn không có quyền xem thông tin đơn đặt sân này.
        </p>
        <Link href="/customer/booking-history">
          <Button>Quay lại lịch sử đặt sân</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button variant="ghost" className="mr-2" onClick={() => router.push("/customer/booking-history")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại
          </Button>
        </div>
        <BookingStatusBadge status={normalizeStatus(booking.status)} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin sân</CardTitle>
              <CardDescription>Chi tiết về sân đã đặt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between">
                <div className="space-y-1">
                  <div className="text-lg font-semibold">{booking.subfield?.field?.location || "Không có tên"}</div>
                  <div className="text-muted-foreground">{booking.subfield?.subfieldDescription}</div>
                </div>
                <div className="flex items-center mt-2 md:mt-0">
                  {normalizeStatus(booking.status) === "paid" ? (
                    booking.review ? (
                      <div className="flex items-center">
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
                        <span className="ml-2 text-sm text-muted-foreground">Đã đánh giá</span>
                      </div>
                    ) : (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Star className="h-4 w-4 mr-1" />
                            Đánh giá sân
                          </Button>
                        </DialogTrigger>
                        <RatingDialog bookingId={booking.id} subfieldId={booking.subfieldId} refetch={refetch} />
                      </Dialog>
                    )
                  ) : (
                    <span className="text-sm text-muted-foreground">Chưa thể đánh giá</span>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex items-start mb-2">
                  <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <div className="font-medium">Địa chỉ</div>
                    <div className="text-muted-foreground">{booking.subfield?.field?.location}</div>
                  </div>
                </div>
                <div className="flex items-start mb-2">
                  <User className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <div className="font-medium">Chủ sân</div>
                    <div className="text-muted-foreground">{booking.subfield?.field?.owner?.account?.username}</div>
                  </div>
                </div>
                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                  <div>
                    <div className="font-medium">Liên hệ</div>
                    <div className="text-muted-foreground">{booking.subfield?.field?.owner?.account?.phone || "Không có thông tin"}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết đặt sân</CardTitle>
              <CardDescription>Thông tin về đơn đặt sân của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start mb-2">
                <Calendar className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium">Ngày đặt sân</div>
                  <div className="text-muted-foreground">{formatDateTime(booking.date)}</div>
                </div>
              </div>
              <div className="flex items-start mb-2">
                <Clock className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium">Thời gian</div>
                  <div className="text-muted-foreground">
                    {formatTime(booking.beginTime)} - {formatTime(booking.endTime)}
                  </div>
                </div>
              </div>
              <div className="flex items-start mb-2">
                <User className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium">Người đặt</div>
                  <div className="text-muted-foreground">{booking.customUser?.account?.username}</div>
                </div>
              </div>
              <div className="flex items-start mb-2">
                <CreditCard className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <div className="font-medium">Phương thức thanh toán</div>
                  <div className="text-muted-foreground capitalize">{booking.paymentMethod?.toLowerCase() || "Chưa thanh toán"}</div>
                </div>
              </div>
              <div className="flex items-start">
                <div>
                  <div className="font-medium">Ghi chú</div>
                  <div className="text-muted-foreground">{booking.description || "Không có ghi chú"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin thanh toán</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between py-1">
                <span>Giá sân:</span>
                <span>{booking.subfield?.price?.toLocaleString()}đ/{booking.subfield?.unitOfTime}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Thời gian sử dụng:</span>
                <span>
                  {(() => {
                    const beginTime = booking.beginTime;
                    const endTime = booking.endTime;
                    
                    if (!beginTime || !endTime) return "N/A";
                    
                    const start = new Date(`2000-01-01T${formatTime(beginTime)}`);
                    const end = new Date(`2000-01-01T${formatTime(endTime)}`);
                    const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    return `${diffHours} giờ`;
                  })()}
                </span>
              </div>
              <div className="flex justify-between py-1 font-medium border-t border-dashed pt-2">
                <span>Tổng cộng:</span>
                <span className="text-lg">{booking.price?.toLocaleString()}đ</span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch space-y-2">
              {normalizeStatus(booking.status) === "pending" && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full bg-red-600 text-white hover:bg-red-700">
                      Hủy đơn đặt sân
                    </Button>
                  </DialogTrigger>
                  <CancelBookingDialog booking={booking} onCancel={cancelBooking} />
                </Dialog>
              )}
            </CardFooter>
          </Card>
          
          {normalizeStatus(booking.status) === "paid" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Lưu ý</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Đơn đặt sân của bạn đã được thanh toán và xác nhận. Vui lòng đến sân đúng giờ.
                  Nếu bạn cần hỗ trợ, vui lòng liên hệ trực tiếp với chủ sân theo số điện thoại được cung cấp.
                </p>
              </CardContent>
            </Card>
          )}
          
          {normalizeStatus(booking.status) === "cancel" && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Đơn đã bị hủy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-red-600">
                  Đơn đặt sân này đã bị hủy. Nếu bạn muốn đặt sân lại thì vui lòng thao tác lại ở trang chủ
                </p>
                <Link href="/" className="block mt-4">
                  <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                    Đặt sân lại
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function RatingDialog({ bookingId, subfieldId, refetch }: { bookingId: string, subfieldId: string, refetch: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId,
          subfieldId,
          rating,
          text: comment,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Không thể gửi đánh giá");
      }
      
      toast({
        title: "Thành công",
        description: "Đã gửi đánh giá của bạn",
      });
      
      refetch();
      setIsSubmitting(false);
    } catch (error) {
      console.error("Lỗi khi gửi đánh giá:", error);
      toast({
        title: "Lỗi",
        description: "Không thể gửi đánh giá",
        variant: "destructive",
      });
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
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
} 