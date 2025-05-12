"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import * as React from "react";
import { 
  useFindUniqueField, 
  useFindManySubField, 
  useFindManyReview,
  useFindManyBooking 
} from "@/generated/hooks";
import image6 from "../../../../../public/6.jpg"

const FieldDetailsPage = () => {
  const params = useParams();
  const fieldId = params.fieldId as string;
  console.log("fieldId", fieldId);
  const searchParams = useSearchParams();
  const subfieldId = searchParams.get("subfieldId");
  const date = searchParams.get("date");
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  const [selectedSubfield, setSelectedSubfield] = useState<string>(subfieldId || "");
  const [selectedDate, setSelectedDate] = useState<string>(date || format(new Date(), 'yyyy-MM-dd'));
  const [selectedStartTime, setSelectedStartTime] = useState<string>(startTime || "");
  const [selectedEndTime, setSelectedEndTime] = useState<string>(endTime || "");
  const [activeTab, setActiveTab] = useState<"info" | "reviews" | "location">("info");

  // Fetch thông tin chi tiết về sân
  const { data: field, isLoading: isLoadingField } = useFindUniqueField({
    where: {
      id: fieldId
    },
    include: {
      owner: {
        include: {
          account: true
        }
      },
      openingHours: true,
      subFields: true,
    }
  });

  // Fetch thông tin về sub-fields của sân này
  const { data: subfields, isLoading: isLoadingSubfields } = useFindManySubField({
    where: {
      fieldId: fieldId
    },
    include: {
      bookings: true,
      maintenanceSchedules: true
    }
  });

  // Fetch đánh giá của sân
  const { data: reviews, isLoading: isLoadingReviews } = useFindManyReview({
    where: {
      booking: {
        subfield: {
          fieldId: fieldId
        }
      }
    },
    include: {
      booking: {
        include: {
          customUser: {
            include: {
              account: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  // Fetch bookings để kiểm tra khả dụng của sân
  const { data: bookings, isLoading: isLoadingBookings } = useFindManyBooking({
    where: {
      subfieldId: selectedSubfield || undefined,
      status: {
        not: "CANCELED"
      }
    }
  });

  // Tính rating trung bình của sân
  const averageRating = reviews && reviews.length > 0
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "Chưa có đánh giá";

  // Tính tổng giá tiền dựa trên khoảng thời gian
  const calculateTotalPrice = (startTime: string, endTime: string, pricePerHour: number) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    // Tính số giờ (có thể là số thập phân)
    const hours = (endHour - startHour) + (endMinute - startMinute) / 60;
    
    // Tính tổng giá
    return Math.round(pricePerHour * hours);
  };

  // Danh sách giờ có thể chọn
  const timeSlots = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00","23:00"
  ];

  // Lấy giờ mở cửa và đóng cửa cho ngày đã chọn
  const getOpeningHoursForDate = (dateStr: string) => {
    if (!field || !field.openingHours || field.openingHours.length === 0) {
      // Nếu không có dữ liệu giờ mở cửa, trả về giá trị mặc định
      return { openTime: "06:00", closeTime: "22:00", isOpen: true };
    }

    const selectedDate = new Date(dateStr);
    const dayOfWeek = selectedDate.getDay();
    
    // Map thứ trong tuần từ JavaScript sang format trong data
    const dayMapping: Record<number, string> = {
      0: "SUNDAY",
      1: "MONDAY",
      2: "TUESDAY",
      3: "WEDNESDAY",
      4: "THURSDAY",
      5: "FRIDAY",
      6: "SATURDAY"
    };
    
    // Tìm thông tin giờ mở cửa cho ngày đã chọn
    const openingHourForDay = field.openingHours.find(oh => 
      oh.dayOfWeek === dayMapping[dayOfWeek]
    );
    
    if (openingHourForDay && openingHourForDay.isOpen) {
      return {
        openTime: openingHourForDay.openTime.substring(0, 5), 
        closeTime: openingHourForDay.closeTime.substring(0, 5),
        isOpen: true
      };
    } else {
      // Nếu ngày này đóng cửa hoặc không tìm thấy thông tin
      return { openTime: "", closeTime: "", isOpen: false };
    }
  };

  // Lọc danh sách giờ có thể chọn dựa trên giờ mở cửa
  const getAvailableTimeSlots = (dateStr: string) => {
    const { openTime, closeTime, isOpen } = getOpeningHoursForDate(dateStr);
    
    if (!isOpen) return [];
    
    return timeSlots.filter(time => {
      // Bao gồm cả giờ mở cửa và cho phép chọn giờ đóng cửa làm giờ kết thúc
      return time >= openTime && time <= closeTime;
    });
  };

  // Danh sách giờ khả dụng cho ngày đã chọn
  const availableTimeSlots = getAvailableTimeSlots(selectedDate);

  // Cập nhật giờ kết thúc khi giờ bắt đầu thay đổi
  useEffect(() => {
    if (selectedStartTime) {
      const startIndex = timeSlots.findIndex(time => time === selectedStartTime);
      if (startIndex !== -1 && startIndex < timeSlots.length - 1) {
        // Tìm giờ kết thúc gần nhất sau giờ bắt đầu mà vẫn trong giờ mở cửa
        const { closeTime } = getOpeningHoursForDate(selectedDate);
        // Đảm bảo có thể chọn cả thời gian đóng cửa
        const availableEndTimes = timeSlots.slice(startIndex + 1).filter(time => {
          // So sánh giờ theo định dạng hh:mm
          const [timehour, timeminute] = time.split(':').map(Number);
          const [closehour, closeminute] = closeTime.split(':').map(Number);
          
          // Tạo Date object để so sánh
          const timeDate = new Date();
          timeDate.setHours(timehour, timeminute, 0, 0);
          
          const closeDate = new Date();
          closeDate.setHours(closehour, closeminute, 0, 0);
          
          // Cho phép chọn thời gian nhỏ hơn hoặc bằng thời gian đóng cửa
          return timeDate <= closeDate;
        });
        
        if (availableEndTimes.length > 0) {
          setSelectedEndTime(availableEndTimes[0]);
        } else {
          setSelectedEndTime("");
        }
      }
    } else {
      setSelectedEndTime("");
    }
  }, [selectedStartTime, selectedDate]);

  // Kiểm tra xem subfield có khả dụng để đặt không - cho phép status AVAILABLE hoặc RESERVED
  const isSubfieldAvailable = (subfieldId: string) => {
    if (!subfields) return false;
    
    const subfield = subfields.find(sf => sf.id === subfieldId);
    if (!subfield) return false;
    
    return subfield.status === "AVAILABLE" || subfield.status === "RESERVED";
  };

  // Kiểm tra xem một khoảng thời gian có khả dụng không với lý do cụ thể
  const isTimeRangeAvailable = (startTime: string, endTime: string, subfieldId: string, dateStr: string) => {
    if (!bookings || !subfieldId || !dateStr || !startTime || !endTime) return true;
    
    // Kiểm tra subfield có ở trạng thái AVAILABLE hoặc RESERVED không
    if (!isSubfieldAvailable(subfieldId)) return false;
    
    const selectedDateTime = new Date(dateStr);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const rangeStartTime = new Date(selectedDateTime);
    rangeStartTime.setHours(startHour, startMinute, 0, 0);
    
    const rangeEndTime = new Date(selectedDateTime);
    rangeEndTime.setHours(endHour, endMinute, 0, 0);

    // Kiểm tra nếu giờ kết thúc trước giờ bắt đầu
    if (rangeEndTime <= rangeStartTime) return false;

    // Kiểm tra thời gian mở cửa của sân
    if (!isWithinOpeningHours(rangeStartTime, rangeEndTime, selectedDateTime)) return false;

    // Kiểm tra xung đột lịch đặt sân
    return !hasBookingConflict(subfieldId, selectedDateTime, rangeStartTime, rangeEndTime);
  };

  // Kiểm tra xem một slot thời gian có khả dụng không
  const isTimeSlotAvailable = (time: string, subfieldId: string, dateStr: string) => {
    if (!bookings || !subfieldId || !dateStr) return true;
    
    // Kiểm tra subfield có ở trạng thái AVAILABLE hoặc RESERVED không
    if (!isSubfieldAvailable(subfieldId)) return false;
    
    const selectedDateTime = new Date(dateStr);
    const [hours] = time.split(':').map(Number);
    
    const startTime = new Date(selectedDateTime);
    startTime.setHours(hours, 0, 0, 0);
    
    const endTime = new Date(selectedDateTime);
    endTime.setHours(hours + 1, 0, 0, 0);

    // Kiểm tra thời gian mở cửa của sân
    if (!isWithinOpeningHours(startTime, endTime, selectedDateTime)) return false;

    // Kiểm tra xung đột lịch đặt sân
    return !hasBookingConflict(subfieldId, selectedDateTime, startTime, endTime);
  };

  // Kiểm tra xem thời gian có nằm trong giờ mở cửa không
  const isWithinOpeningHours = (startTime: Date, endTime: Date, dateTime: Date) => {
    if (!field || !field.openingHours || field.openingHours.length === 0) {
      // Nếu không có dữ liệu giờ mở cửa, mặc định là được
      return true;
    }

    // Lấy thứ trong tuần (0 = Sunday, 1 = Monday, ...)
    const dayOfWeek = dateTime.getDay();
    
    // Map thứ trong tuần từ JavaScript sang format trong data
    const dayMapping: Record<number, string> = {
      0: "SUNDAY",
      1: "MONDAY",
      2: "TUESDAY",
      3: "WEDNESDAY",
      4: "THURSDAY",
      5: "FRIDAY",
      6: "SATURDAY"
    };
    
    // Tìm thông tin giờ mở cửa của ngày đã chọn
    const openingHourForDay = field.openingHours.find(oh => 
      oh.dayOfWeek === dayMapping[dayOfWeek] && oh.isOpen
    );
    
    if (openingHourForDay) {
      // Lấy giờ mở cửa và đóng cửa
      const [openHour, openMinute] = openingHourForDay.openTime.substring(0, 5).split(':').map(Number);
      const [closeHour, closeMinute] = openingHourForDay.closeTime.substring(0, 5).split(':').map(Number);
      
      // Tạo datetime mở cửa và đóng cửa
      const openTime = new Date(dateTime);
      openTime.setHours(openHour, openMinute, 0, 0);
      
      const closeTime = new Date(dateTime);
      closeTime.setHours(closeHour, closeMinute, 0, 0);
      
      // Kiểm tra nếu thời gian đặt nằm ngoài giờ mở cửa
      return !(startTime < openTime || endTime > closeTime);
    } else {
      // Không tìm thấy thông tin giờ mở cửa cho ngày đã chọn hoặc sân đóng cửa vào ngày này
      return false;
    }
  };

  // Kiểm tra xung đột lịch đặt sân
  const hasBookingConflict = (subfieldId: string, selectedDateTime: Date, startTime: Date, endTime: Date) => {
    if (!bookings) return false;
    
    return bookings.some(booking => {
      if (booking.subfieldId !== subfieldId) return false;
      
      const bookingDate = new Date(booking.date);
      // Kiểm tra nếu không cùng ngày
      if (bookingDate.getDate() !== selectedDateTime.getDate() || 
          bookingDate.getMonth() !== selectedDateTime.getMonth() || 
          bookingDate.getFullYear() !== selectedDateTime.getFullYear()) {
        return false;
      }
      
      const bookingStartTime = new Date(booking.beginTime);
      const bookingEndTime = new Date(booking.endTime);
      
      // Kiểm tra xem thời gian có trùng nhau không
      // Nếu booking bắt đầu trước khi kết thúc tìm kiếm và booking kết thúc sau khi bắt đầu tìm kiếm
      return (bookingStartTime < endTime && bookingEndTime > startTime);
    });
  };

  // Tiện ích của sân (tùy thuộc vào loại sân)
  const getAmenities = (field: any) => {
    const baseAmenities = ["Phòng thay đồ", "Nước uống miễn phí", "Wifi"];
    
    if (field?.ranking === "PREMIUM") {
      return [...baseAmenities, "Nhà hàng", "Phòng tắm VIP", "Huấn luyện viên", "Cho thuê dụng cụ"];
    } else if (field?.ranking === "STANDARD") {
      return [...baseAmenities, "Cho thuê dụng cụ", "Bãi đậu xe"];
    } else {
      return baseAmenities;
    }
  };

  if (isLoadingField) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!field) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy sân</h1>
        <Link href="/home">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Quay lại trang chủ</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="relative h-80 rounded-xl overflow-hidden mb-4">
          <Image
            src={image6}
            alt={field.description || "PickleBall Court"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">{field.description}</h1>
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              <span className="ml-1 font-medium">{averageRating}</span>
              <span className="mx-2">•</span>
              <span>{field.location}</span>
              <span className="mx-2">•</span>
              <span className="capitalize">{field.ranking?.toLowerCase() || "standard"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Info */}
        <div className="lg:col-span-2">
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab("info")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "info"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Thông tin
              </button>
              <button
                onClick={() => setActiveTab("reviews")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "reviews"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Đánh giá ({reviews?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("location")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "location"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Vị trí & liên hệ
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="pb-8">
            {activeTab === "info" && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Giới thiệu</h2>
                <p className="text-gray-700 mb-6">
                  {field.fieldDescription || 
                    `Tọa lạc tại ${field.location}, sân PickleBall của chúng tôi cung cấp môi trường chơi chất lượng cao với các tiêu chuẩn quốc tế. Phù hợp cho cả người mới và người chơi chuyên nghiệp.`}
                </p>

                <h2 className="text-2xl font-bold mb-4">Loại sân</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {subfields?.map((subfield) => (
                    <div 
                      key={subfield.id} 
                      className={`border rounded-lg p-4 ${
                        selectedSubfield === subfield.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      } ${!isSubfieldAvailable(subfield.id) ? 'opacity-50' : ''}`}
                      onClick={() => isSubfieldAvailable(subfield.id) && setSelectedSubfield(subfield.id)}
                    >
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-semibold">{subfield.subfieldDescription || "Sân tiêu chuẩn"}</h3>
                          <p className="text-sm text-gray-600">
                            {subfield.description || "Sân đạt chuẩn quốc tế, phù hợp cho mọi trình độ chơi."}
                          </p>
                          {!isSubfieldAvailable(subfield.id) && (
                            <p className="text-sm text-red-500 mt-1">
                              {subfield.status === "MAINTENANCE" ? "Đang bảo trì" : 
                               subfield.status === "CLOSED" ? "Đã đóng cửa" : 
                               "Không khả dụng"}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-blue-600 font-bold">{subfield.price.toLocaleString()}đ/{subfield.unitOfTime}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <h2 className="text-2xl font-bold mb-4">Tiện ích</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {getAmenities(field).map((amenity, index) => (
                    <div key={index} className="bg-gray-100 rounded-lg p-3 text-center">
                      <span className="text-gray-800">{amenity}</span>
                    </div>
                  ))}
                </div>

                <h2 className="text-2xl font-bold mb-4">Giờ mở cửa</h2>
                <div className="bg-gray-100 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    {field.openingHours && field.openingHours.length > 0 ? (
                      field.openingHours.map((oh: any) => (
                        <div key={oh.id} className="flex justify-between border-b border-gray-200 py-2 last:border-0">
                          <span className="font-medium">{oh.dayOfWeek}:</span>
                          <span>{oh.openTime.substring(0, 5)} - {oh.closeTime.substring(0, 5)}</span>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="flex justify-between border-b border-gray-200 py-2">
                          <span className="font-medium">Thứ 2 - Thứ 6:</span>
                          <span>06:00 - 22:00</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-200 py-2">
                          <span className="font-medium">Thứ 7 - Chủ nhật:</span>
                          <span>08:00 - 20:00</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Đánh giá từ người chơi</h2>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">Viết đánh giá</Button>
                </div>

                {isLoadingReviews ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : reviews && reviews.length > 0 ? (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-0">
                        <div className="flex items-center mb-4">
                          <div className="relative w-10 h-10 mr-4 rounded-full overflow-hidden">
                            <Image
                              src={`https://i.pravatar.cc/150?u=${review.bookingId}`}
                              alt="Avatar"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold">{review.booking?.customUser?.account?.username || "Người dùng ẩn danh"}</p>
                            <div className="flex items-center">
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating ? "text-yellow-400" : "text-gray-300"
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm text-gray-500 ml-2">
                                {new Date(review.createdAt).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.text || "Không có nội dung đánh giá"}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">Chưa có đánh giá nào cho sân này.</p>
                    <p className="text-gray-600 mt-2">Hãy là người đầu tiên đánh giá!</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "location" && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Địa chỉ & liên hệ</h2>
                <p className="text-gray-700 mb-4">
                  <strong>Địa chỉ:</strong> {field.location}
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>Số điện thoại:</strong> {field.owner?.account?.phone || "Chưa cập nhật"}
                </p>
                <p className="text-gray-700 mb-6">
                  <strong>Email:</strong> {field.owner?.account?.email || "Chưa cập nhật"}
                </p>

                <div className="bg-gray-200 h-80 rounded-lg flex items-center justify-center mb-6">
                  <p className="text-gray-600">Bản đồ hiện chưa khả dụng</p>
                </div>

                <h3 className="text-xl font-bold mb-3">Hướng dẫn đi đến</h3>
                <p className="text-gray-700 mb-2">
                  <strong>Từ trung tâm thành phố:</strong> Di chuyển khoảng 15 phút bằng xe máy.
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Phương tiện công cộng:</strong> Xe buýt số 8, 54 (trạm dừng cách 200m).
                </p>
                <p className="text-gray-700">
                  <strong>Bãi đậu xe:</strong> Có bãi đậu xe miễn phí cho khách.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Booking */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-lg sticky top-20">
            <h2 className="text-2xl font-bold mb-6 text-center">Đặt sân ngay</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngày đặt</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Giờ bắt đầu</label>
              <select
                value={selectedStartTime}
                onChange={(e) => setSelectedStartTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!selectedSubfield}
              >
                <option value="">Chọn giờ bắt đầu</option>
                {availableTimeSlots.map((time) => (
                  <option 
                    key={time} 
                    value={time}
                    disabled={!isTimeSlotAvailable(time, selectedSubfield, selectedDate)}
                  >
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Giờ kết thúc</label>
              <select
                value={selectedEndTime}
                onChange={(e) => setSelectedEndTime(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={!selectedStartTime || !selectedSubfield}
              >
                <option value="">Chọn giờ kết thúc</option>
                {selectedStartTime && availableTimeSlots
                  .filter(time => {
                    // Lọc ra các giờ kết thúc sau giờ bắt đầu đã chọn
                    const startIndex = timeSlots.findIndex(t => t === selectedStartTime);
                    const timeIndex = timeSlots.findIndex(t => t === time);
                    return timeIndex > startIndex;
                  })
                  .map((time) => (
                    <option 
                      key={time} 
                      value={time}
                      disabled={!isTimeRangeAvailable(selectedStartTime, time, selectedSubfield, selectedDate)}
                    >
                      {time}
                    </option>
                  ))
                }
              </select>
            </div>

            <div className="mb-6">
              <div className="flex justify-between py-3 border-t border-gray-200">
                <span className="font-medium">Giá sân</span>
                <span className="font-bold text-blue-600">
                  {selectedSubfield && subfields && selectedStartTime && selectedEndTime
                    ? `${calculateTotalPrice(selectedStartTime, selectedEndTime, subfields.find(sf => sf.id === selectedSubfield)?.price || 0).toLocaleString()}đ`
                    : "Vui lòng chọn sân và thời gian"}
                </span>
              </div>
            </div>

            <Link 
              href={selectedSubfield && selectedDate && selectedStartTime && selectedEndTime && isSubfieldAvailable(selectedSubfield)
                ? `/booking/new?subfieldId=${selectedSubfield}&date=${selectedDate}&startTime=${selectedStartTime}&endTime=${selectedEndTime}` 
                : "#"}
              className={selectedSubfield && selectedDate && selectedStartTime && selectedEndTime && isSubfieldAvailable(selectedSubfield) ? "" : "pointer-events-none"}
            >
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                disabled={!selectedSubfield || !selectedDate || !selectedStartTime || !selectedEndTime || !isSubfieldAvailable(selectedSubfield)}
              >
                Đặt sân ngay
              </Button>
            </Link>

            <p className="text-center text-sm text-gray-500 mt-4">
              Bạn chỉ phải thanh toán khi xác nhận đặt sân
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldDetailsPage;