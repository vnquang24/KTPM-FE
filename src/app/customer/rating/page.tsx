"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFindManyReview, useFindManyBooking, useCreateReview, useUpdateReview, useDeleteReview } from "@/generated/hooks";
import { getUserId } from "@/utils/auth";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Star, Edit, Trash, Filter } from "lucide-react";
import Link from "next/link";
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
import toast from 'react-hot-toast';


export default function RatingPage() {
  const userId = getUserId() || "";
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useState<"my-reviews" | "pending">("my-reviews");

  const { data: reviewsData, isLoading: isLoadingReviews, refetch: refetchReviews } = useFindManyReview(
    {
      where: {
        booking: {
          customUser: {
            accountId: userId,
          },
        },
      },
      include: {
        booking: {
          include: {
            subfield: {
              include: {
                field: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: sortOrder,
      },
    },
    {
      enabled: !!userId,
    }
  );

  const { data: pendingReviewsData, isLoading: isLoadingPending, refetch: refetchPending } = useFindManyBooking(
    {
      where: {
        customUser: {
          accountId: userId,
        },
        status: "paid",
        review: {
          is: null,
        },
      },
      include: {
        subfield: {
          include: {
            field: true,
          },
        },
      },
      orderBy: {
        date: sortOrder,
      },
    },
    {
      enabled: !!userId,
    }
  );

  const deleteReview = useDeleteReview();

  const handleSortOrderChange = (value: string) => {
    setSortOrder(value as "asc" | "desc");
  };

  const handleDeleteReview = async (reviewId: string) => {
    deleteReview.mutate(
      {
        where: {
          id: reviewId,
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã xóa đánh giá thành công');
          
          refetchReviews();
          refetchPending();
        },
        onError: (error) => {
          toast.error(`Không thể xóa đánh giá: ${error.message}`);
        }
      }
    );
  };

  const formatDate = (dateString: Date | string | null | undefined) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "dd/MM/yyyy", { locale: vi });
  };

  if (isLoadingReviews || isLoadingPending) {
    return <div className="flex justify-center py-8">Đang tải...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
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
        </div>
      </div>

      <Tabs defaultValue="my-reviews" value={activeTab} onValueChange={(value) => setActiveTab(value as "my-reviews" | "pending")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-reviews">
            Đánh giá của tôi ({reviewsData?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Chờ đánh giá ({pendingReviewsData?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-reviews">
          {reviewsData && reviewsData.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {reviewsData.map((review) => (
                <Card key={review.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{review.booking?.subfield?.field?.location || "Không có tên"}</CardTitle>
                        <CardDescription>{review.booking?.subfield?.subfieldDescription}</CardDescription>
                      </div>
                      <div className="flex space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <EditReviewDialog 
                            review={review} 
                            refetch={() => {
                              refetchReviews();
                              refetchPending();
                            }} 
                          />
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa đánh giá</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteReview(review.id)}>
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-2 flex items-center">
                      <div className="flex mr-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Ngày đánh giá: {formatDate(review.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      {review.text || "Không có nhận xét"}
                    </p>
                    <div className="mt-4 text-sm text-muted-foreground">
                      <p>Ngày đặt sân: {formatDate(review.booking?.date)}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Star className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Chưa có đánh giá</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Bạn chưa đánh giá sân nào. Sau khi sử dụng dịch vụ, hãy để lại đánh giá để giúp cải thiện chất lượng.
                </p>
                <Button onClick={() => setActiveTab("pending")} disabled={!pendingReviewsData?.length}>
                  Xem các sân chờ đánh giá
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending">
          {pendingReviewsData && pendingReviewsData.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {pendingReviewsData.map((booking) => (
                <Card key={booking.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{booking.subfield?.field?.description || "Không có tên"}</CardTitle>
                    <CardDescription>{booking.subfield?.subfieldDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <p>Ngày đặt: {formatDate(booking.date)}</p>
                        <p>Thời gian: {formatTime(booking.beginTime)} - {formatTime(booking.endTime)}</p>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button className="w-full mt-4">
                            <Star className="h-4 w-4 mr-2" />
                            Đánh giá ngay
                          </Button>
                        </DialogTrigger>
                        <RatingDialog 
                          bookingId={booking.id} 
                          refetch={() => {
                            refetchReviews();
                            refetchPending();
                          }} 
                        />
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Star className="h-16 w-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Không có sân chờ đánh giá</h3>
                <p className="text-muted-foreground text-center max-w-md mb-6">
                  Hiện tại bạn không có sân nào cần đánh giá.
                </p>
                <Link href="/customer/booking-history">
                  <Button>Xem lịch sử đặt sân</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

const formatTime = (timeDate: Date | string | null | undefined) => {
  if (!timeDate) return "N/A";
  if (timeDate instanceof Date) {
    return format(timeDate, "HH:mm");
  }
  return typeof timeDate === 'string' ? timeDate.substring(0, 5) : "N/A";
};

function RatingDialog({ bookingId, refetch }: { bookingId: string, refetch: () => void }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createReview = useCreateReview();
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    createReview.mutate(
      {
        data: {
          booking: {
            connect: {
              id: bookingId,
            }
          },
          rating: rating,
          text: comment,
        }
      },
      {
        onSuccess: () => {
          toast.success('Đã gửi đánh giá của bạn thành công');
          
          refetch();
          setIsSubmitting(false);
        },
        onError: (error) => {
          console.error("Lỗi khi gửi đánh giá:", error);
          toast.error(`Không thể gửi đánh giá: ${error.message}`);
          setIsSubmitting(false);
        }
      }
    );
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

function EditReviewDialog({ review, refetch }: { review: any, refetch: () => void }) {
  const [rating, setRating] = useState(review.rating);
  const [comment, setComment] = useState(review.text || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const updateReview = useUpdateReview();
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    updateReview.mutate(
      {
        where: {
          id: review.id,
        },
        data: {
          rating: rating,
          text: comment,
        },
      },
      {
        onSuccess: () => {
          toast.success('Đã cập nhật đánh giá của bạn thành công');
          
          refetch();
          setIsSubmitting(false);
        },
        onError: (error) => {
          console.error("Lỗi khi cập nhật đánh giá:", error);
          toast.error(`Không thể cập nhật đánh giá: ${error.message}`);
          setIsSubmitting(false);
        }
      }
    );
  };
  
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Chỉnh sửa đánh giá</DialogTitle>
        <DialogDescription>
          Cập nhật đánh giá của bạn về sân và dịch vụ.
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
            {isSubmitting ? "Đang cập nhật..." : "Cập nhật đánh giá"}
          </Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
} 