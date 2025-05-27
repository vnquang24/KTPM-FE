"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format, parse, addHours } from "date-fns";
import { vi } from "date-fns/locale";
import { useFindUniqueSubField, useCreateBooking, useCreateCustomUser, useUpdateSubField, useFindFirstAccount, useFindUniqueCustomUser } from "@/generated/hooks";
import { getUserId, isAuthenticated, getUserData } from "@/utils/auth";
import axios from "axios";
import image6 from "../../../../../public/6.jpg"
import qr from "../../../../../public/qr.jpg"
type PaymentMethod = "BANKING" | "CASH" | "MOMO" | "ZALOPAY";

const BookingForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const subfieldId = searchParams.get("subfieldId");
  const dateParam = searchParams.get("date");
  const startTimeParam = searchParams.get("startTime");
  const endTimeParam = searchParams.get("endTime");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("BANKING");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [showPaymentQR, setShowPaymentQR] = useState(false);

  const [newAccountInfo, setNewAccountInfo] = useState<{
    username: string;
    password: string;
  } | null>(null);

  const [loggedIn, setLoggedIn] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { data: loggedInCustomUser, isLoading: isLoadingCustomUser } = useFindUniqueCustomUser({
    where: {
      accountId: currentUserId || ""
    }
  }, {
    enabled: !!currentUserId && currentUserId.length > 0
  });

  const { data: currentAccount } = useFindFirstAccount({
    where: {
      id: currentUserId || ""
    },
    select: {
      username: true,
      email: true,
      phone: true
    }
  }, {
    enabled: !!currentUserId && currentUserId.length > 0
  });

  useEffect(() => {
    const isUserLoggedIn = isAuthenticated();
    setLoggedIn(isUserLoggedIn);

    if (isUserLoggedIn) {
      const userData = getUserData();
      if (userData) {
        setCurrentUserId(userData.id);
      }
    }

    if (!subfieldId || !dateParam || !startTimeParam || !endTimeParam) {
      router.push("/home");
    }
  }, [subfieldId, dateParam, startTimeParam, endTimeParam, router]);

  useEffect(() => {
    if (currentAccount) {
      if (currentAccount.phone) setPhone(currentAccount.phone);
      if (currentAccount.email) setEmail(currentAccount.email);
    }
  }, [currentAccount]);

  const { data: subfield, isLoading } = useFindUniqueSubField({
    where: {
      id: subfieldId || ""
    },
    include: {
      field: true
    }
  });

  const createBookingMutation = useCreateBooking();

  const createCustomUserMutation = useCreateCustomUser();

  const updateSubFieldMutation = useUpdateSubField();

  const [checkEmail, setCheckEmail] = useState("");
  const { data: existingAccountWithEmail } = useFindFirstAccount({
    where: {
      email: checkEmail
    }
  }, {
    enabled: !!checkEmail && checkEmail.length > 0
  });

  const [checkPhone, setCheckPhone] = useState("");
  const { data: existingAccountWithPhone } = useFindFirstAccount({
    where: {
      phone: checkPhone
    }
  }, {
    enabled: !!checkPhone && checkPhone.length > 0
  });

  const [checkCustomUserId, setCheckCustomUserId] = useState<string | null>(null);
  const { data: existingCustomUser } = useFindUniqueCustomUser({
    where: {
      id: checkCustomUserId || ""
    }
  }, {
    enabled: !!checkCustomUserId
  });

  const generateUniqueUsername = (email: string, phone: string) => {
    const timestamp = new Date().getTime();
    const randomSuffix = Math.floor(Math.random() * 1000);

    if (email && email.trim()) {
      const emailPrefix = email.trim().split('@')[0];
      return `${emailPrefix}_${timestamp}_${randomSuffix}`;
    }

    return `user_${phone.trim()}_${timestamp}_${randomSuffix}`;
  };

  const calculateTotalPrice = (startTime: string, endTime: string, pricePerHour: number) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const hours = (endHour - startHour) + (endMinute - startMinute) / 60;

    return Math.round(pricePerHour * hours);
  };

  const calculateHours = (startTime: string, endTime: string) => {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const hours = (endHour - startHour) + (endMinute - startMinute) / 60;

    return hours.toFixed(1);
  };

  const handleCompletePayment = () => {
    setShowPaymentQR(false);
    setIsComplete(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBookingError("");

    if (!name.trim()) {
      setBookingError("Vui lòng nhập họ tên");
      setIsSubmitting(false);
      return;
    }

    if (!phone.trim()) {
      setBookingError("Vui lòng nhập số điện thoại");
      setIsSubmitting(false);
      return;
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(phone.trim())) {
      setBookingError("Số điện thoại không hợp lệ (phải có 10-11 chữ số)");
      setIsSubmitting(false);
      return;
    }

    if (email && !email.trim().match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
      setBookingError("Email không hợp lệ");
      setIsSubmitting(false);
      return;
    }

    if (!subfieldId || !dateParam || !startTimeParam || !endTimeParam) {
      setBookingError("Thiếu thông tin đặt sân");
      setIsSubmitting(false);
      return;
    }

    try {
      let customUserId = "";

      if (loggedIn && loggedInCustomUser) {
        customUserId = loggedInCustomUser.id;
      }
      else {
        const uniqueUsername = generateUniqueUsername(email || '', phone.trim());

        const randomPassword = Math.random().toString(36).slice(-8);


        const registerData = {
          username: uniqueUsername,
          password: randomPassword,
          email: email && email.trim() ? email.trim() : undefined,
          phone: phone.trim(),
          name: name.trim(),
          role: "CUSTOMER",
          dateOfBirth: new Date().toISOString().split('T')[0] // Mặc định là ngày hiện tại, format YYYY-MM-DD
        };


        const registerResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
          registerData
        );


        if (!registerResponse.data || !registerResponse.data.user || !registerResponse.data.user.id) {
          setBookingError("Không thể tạo tài khoản. Vui lòng thử lại sau.");
          setIsSubmitting(false);
          return;
        }

        const newAccount = registerResponse.data.user;

        setNewAccountInfo({
          username: uniqueUsername,
          password: randomPassword
        });

        const newCustomUser = await createCustomUserMutation.mutateAsync({
          data: {
            description: `Khách hàng tự động tạo từ đặt sân`,
            account: {
              connect: { id: newAccount.id }
            }
          }
        });

        if (!newCustomUser || !newCustomUser.id) {
          setBookingError("Không thể tạo thông tin người dùng. Vui lòng thử lại sau.");
          setIsSubmitting(false);
          return;
        }

        customUserId = newCustomUser.id;
      }

      const bookingDate = new Date(dateParam);
      const [startHour, startMinute] = startTimeParam.split(':').map(Number);
      const [endHour, endMinute] = endTimeParam.split(':').map(Number);

      const beginTime = new Date(bookingDate);
      beginTime.setHours(startHour, startMinute, 0, 0);

      const endTime = new Date(bookingDate);
      endTime.setHours(endHour, endMinute, 0, 0);

      const totalCost = calculateTotalPrice(
        startTimeParam,
        endTimeParam,
        subfield?.price || 0
      );

      const bookingDescription = `
Người đặt: ${name.trim()}
SĐT: ${phone.trim()}
Email: ${email ? email.trim() : "Không có"}
Ghi chú: ${note ? note.trim() : "Không có"}
      `;

      const bookingData: any = {
        date: bookingDate,
        beginTime: beginTime,
        endTime: endTime,
        status: "pending",
        description: bookingDescription.trim(),
        paymentMethod: paymentMethod,
        price: totalCost,
        subfieldId: subfieldId,
        customUserId: customUserId
      };


      const newBooking = await createBookingMutation.mutateAsync({
        data: bookingData
      });

      console.log("Tạo booking thành công:", newBooking);

      if (newBooking) {
        console.log("Đang cập nhật trạng thái sân thành RESERVED");
        await updateSubFieldMutation.mutateAsync({
          where: { id: subfieldId },
          data: {
            status: "RESERVED"
          }
        });
        console.log("Cập nhật trạng thái sân thành công");

        setBookingData(newBooking);
        
        if (paymentMethod !== "CASH") {
          setShowPaymentQR(true);
        } else {
          setIsComplete(true);
        }
      } else {
        setBookingError("Không thể tạo đặt sân. Vui lòng thử lại sau.");
      }
    } catch (error: any) {
      console.error("Lỗi khi đặt sân:", error);

      if (error.response && error.response.data) {
        const apiError = error.response.data;
        console.error("Lỗi API:", apiError);

        if (apiError.message) {
          setBookingError(apiError.message);
        } else if (apiError.error) {
          setBookingError(apiError.error);
        } else {
          setBookingError("Lỗi đăng ký tài khoản. Vui lòng thử lại sau.");
        }
      } else if (error.message?.includes('Email đã được sử dụng') ||
        error.message?.toLowerCase().includes('email')) {
        setBookingError("Email đã được sử dụng. Vui lòng sử dụng email khác.");
      } else if (error.message?.includes('Số điện thoại đã được sử dụng') ||
        error.message?.toLowerCase().includes('phone')) {
        setBookingError("Số điện thoại đã được sử dụng. Vui lòng sử dụng số khác.");
      } else if (error.message?.includes('Foreign key constraint violated') ||
        error.code === "P2003") {
        setBookingError("Lỗi khi liên kết dữ liệu. Vui lòng thử lại sau.");
      } else if (error.request) {
        setBookingError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.");
      } else {
        setBookingError(`Lỗi: ${error.message || "Đã xảy ra lỗi khi đặt sân. Vui lòng thử lại sau."}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!subfield) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Không tìm thấy sân</h1>
        <p className="text-gray-600 mb-6">Sân bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <Link href="/home">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">Quay lại trang chủ</Button>
        </Link>
      </div>
    );
  }

  if (showPaymentQR && bookingData) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Thanh toán đặt sân</h1>
            <p className="text-gray-600">Vui lòng thanh toán để hoàn tất đặt sân của bạn.</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 pb-3 border-b border-gray-200">Thông tin đặt sân</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-gray-600 text-sm mb-1">Mã đặt sân</p>
                <p className="font-semibold">{bookingData.id}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Ngày đặt</p>
                <p className="font-semibold">{format(new Date(bookingData.date), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Thời gian</p>
                <p className="font-semibold">
                  {format(new Date(bookingData.beginTime), 'HH:mm')} - {format(new Date(bookingData.endTime), 'HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Tổng tiền</p>
                <p className="font-bold text-blue-600">{bookingData.price.toLocaleString()}đ</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4 pb-3 border-b border-gray-200">Thông tin thanh toán</h2>

            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1">
                <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Ngân hàng:</span>
                    <span className="font-semibold">Vietcombank</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Số tài khoản:</span>
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">9333055410</span>
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          navigator.clipboard.writeText("9333055410");
                          alert("Đã sao chép số tài khoản!");
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Chủ tài khoản:</span>
                    <span className="font-semibold">CÔNG TY TNHH PICKLEBALL COURT</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Số tiền:</span>
                    <span className="font-bold text-blue-600">{bookingData.price.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Nội dung chuyển khoản:</span>
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">PBC {bookingData.id}</span>
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          navigator.clipboard.writeText(`PBC ${bookingData.id}`);
                          alert("Đã sao chép nội dung chuyển khoản!");
                        }}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col items-center">
                <div className="bg-white p-3 border border-gray-200 rounded-lg mb-3">
                  <div className="w-48 h-48 relative">
                    <Image
                      src={qr}
                      alt="QR Code"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center mb-2">Quét mã QR để thanh toán nhanh hơn</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Button 
              onClick={handleCompletePayment} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Đã thanh toán
            </Button>
            <Button 
              onClick={handleCompletePayment} 
              variant="outline" 
              className="flex-1"
            >
              Thanh toán sau
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isComplete && bookingData) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Đặt sân thành công!</h1>
            <p className="text-gray-600">Cảm ơn bạn đã đặt sân PickleBall. Dưới đây là chi tiết đặt sân của bạn.</p>
          </div>

          {newAccountInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-bold text-blue-800 mb-2">Thông tin tài khoản của bạn</h3>
              <p className="text-blue-800 mb-4">Chúng tôi đã tạo tài khoản cho bạn. Vui lòng lưu lại thông tin đăng nhập sau:</p>

              <div className="bg-white rounded-lg p-4 border border-blue-200 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-600">Tên đăng nhập:</span>
                  <div className="flex items-center">
                    <span className="font-semibold bg-gray-100 py-1 px-3 rounded mr-2">{newAccountInfo.username}</span>
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        navigator.clipboard.writeText(newAccountInfo.username);
                        alert("Đã sao chép tên đăng nhập!");
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Mật khẩu:</span>
                  <div className="flex items-center">
                    <span className="font-semibold bg-gray-100 py-1 px-3 rounded mr-2">{newAccountInfo.password}</span>
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        navigator.clipboard.writeText(newAccountInfo.password);
                        alert("Đã sao chép mật khẩu!");
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center bg-blue-100 p-3 rounded-lg text-blue-800">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                </svg>
                <span>Hãy lưu lại thông tin này để đăng nhập và quản lý đặt sân của bạn sau này.</span>
              </div>
            </div>
          )}
          <div className="border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 pb-3 border-b border-gray-200">Thông tin đặt sân</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">Mã đặt sân</p>
                <p className="font-semibold">{bookingData.id}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Trạng thái</p>
                <p className="inline-block bg-yellow-100 text-yellow-800 py-1 px-2 rounded-full text-xs font-semibold">
                  Chờ xác nhận
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Ngày đặt</p>
                <p className="font-semibold">{format(new Date(bookingData.date), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Thời gian</p>
                <p className="font-semibold">
                  {format(new Date(bookingData.beginTime), 'HH:mm')} - {format(new Date(bookingData.endTime), 'HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Sân</p>
                <p className="font-semibold">{subfield.field.location}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Loại sân</p>
                <p className="font-semibold">{subfield.subfieldDescription || "Sân tiêu chuẩn"}</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mt-6 mb-4 pb-3 border-b border-gray-200">Thông tin người đặt</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">Họ tên</p>
                <p className="font-semibold">{name}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Số điện thoại</p>
                <p className="font-semibold">{phone}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Email</p>
                <p className="font-semibold">{email || "Không có"}</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Ghi chú</p>
                <p className="font-semibold">{note || "Không có"}</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mt-6 mb-4 pb-3 border-b border-gray-200">Thông tin thanh toán</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">Tổng tiền</p>
                <p className="font-bold text-xl text-blue-600">{bookingData.price.toLocaleString()}đ</p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Trạng thái thanh toán</p>
                <p className="inline-block bg-red-100 text-red-800 py-1 px-2 rounded-full text-xs font-semibold">
                  {bookingData.status === "PENDING" ? "Chờ thanh toán" : "Chưa thanh toán"}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm mb-1">Phương thức thanh toán</p>
                <p className="font-semibold">
                  {bookingData.paymentMethod === "BANKING" ? "Chuyển khoản ngân hàng" :
                    bookingData.paymentMethod === "CASH" ? "Tiền mặt" :
                      bookingData.paymentMethod === "MOMO" ? "Ví Momo" : "ZaloPay"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Link href="/home" className="flex-1">
              <Button variant="outline" className="w-full">Quay lại trang chủ</Button>
            </Link>
            {loggedIn && (
              <Link href="/customer/booking-history" className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">Xem lịch sử đặt sân</Button>
              </Link>
            )}
            {newAccountInfo && (
              <Link href="/login" className="flex-1">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white">Đăng nhập ngay</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="md:flex">
          <div className="md:w-2/5 bg-gray-50 p-6">
            <h2 className="text-2xl font-bold mb-6">Thông tin đặt sân</h2>

            <div className="mb-6">
              <div className="relative h-48 rounded-lg overflow-hidden mb-4">
                <Image
                  src={image6}
                  alt={subfield.field.description || "Sân PickleBall"}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>

              <h3 className="font-bold text-lg">{subfield.field.description}</h3>
              <p className="text-gray-600 mb-2">{subfield.field.location}</p>
              <div className="flex items-center mb-4">
                <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                <span className="ml-1 text-sm text-gray-600">--</span>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-2">Chi tiết đặt sân</h4>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Loại sân:</span>
                  <span className="font-medium">{subfield.subfieldDescription || "Sân tiêu chuẩn"}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Ngày:</span>
                  <span className="font-medium">{dateParam ? format(new Date(dateParam), 'dd/MM/yyyy') : "N/A"}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-medium">
                    {startTimeParam && endTimeParam ?
                      `${calculateHours(startTimeParam, endTimeParam)} giờ` :
                      "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold mb-2">Thanh toán</h4>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Giá sân:</span>
                  <span className="font-medium">{subfield.price.toLocaleString()}đ/giờ</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-medium">
                    {startTimeParam && endTimeParam ?
                      `${calculateTotalPrice(startTimeParam, endTimeParam, subfield.price).toLocaleString()}đ` :
                      "N/A"}
                  </span>
                </div>
                <div className="border-t border-gray-200 my-2 pt-2"></div>
                <div className="flex justify-between">
                  <span className="font-semibold">Tổng tiền:</span>
                  <span className="font-bold text-blue-600">
                    {startTimeParam && endTimeParam ?
                      `${calculateTotalPrice(startTimeParam, endTimeParam, subfield.price).toLocaleString()}đ` :
                      "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-600">
                {subfield.haveToPayFirst
                  ? "* Sân này yêu cầu thanh toán trước để hoàn tất đặt sân"
                  : "* Bạn có thể thanh toán tại sân hoặc qua các phương thức thanh toán trực tuyến"}
              </p>
            </div>
          </div>

          <div className="md:w-3/5 p-6 md:p-8">
            <h2 className="text-2xl font-bold mb-6">Thông tin người đặt</h2>

            {bookingError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                <p>{bookingError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  placeholder="Nhập yêu cầu đặc biệt (nếu có)"
                ></textarea>
              </div>

              <div className="mb-8">
                <h3 className="font-semibold mb-2">Phương thức thanh toán</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div
                    className={`border rounded-lg p-3 cursor-pointer flex items-center ${paymentMethod === "BANKING" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                    onClick={() => setPaymentMethod("BANKING")}
                  >
                    <input
                      type="radio"
                      id="banking"
                      checked={paymentMethod === "BANKING"}
                      onChange={() => setPaymentMethod("BANKING")}
                      className="mr-2"
                    />
                    <label htmlFor="banking" className="cursor-pointer">Chuyển khoản</label>
                  </div>

                  <div
                    className={`border rounded-lg p-3 cursor-pointer flex items-center ${paymentMethod === "MOMO" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                    onClick={() => setPaymentMethod("MOMO")}
                  >
                    <input
                      type="radio"
                      id="momo"
                      checked={paymentMethod === "MOMO"}
                      onChange={() => setPaymentMethod("MOMO")}
                      className="mr-2"
                    />
                    <label htmlFor="momo" className="cursor-pointer">Ví Momo</label>
                  </div>

                  <div
                    className={`border rounded-lg p-3 cursor-pointer flex items-center ${paymentMethod === "ZALOPAY" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                    onClick={() => setPaymentMethod("ZALOPAY")}
                  >
                    <input
                      type="radio"
                      id="zalopay"
                      checked={paymentMethod === "ZALOPAY"}
                      onChange={() => setPaymentMethod("ZALOPAY")}
                      className="mr-2"
                    />
                    <label htmlFor="zalopay" className="cursor-pointer">ZaloPay</label>
                  </div>

                  <div
                    className={`border rounded-lg p-3 cursor-pointer flex items-center ${paymentMethod === "CASH" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      } ${subfield.haveToPayFirst ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !subfield.haveToPayFirst && setPaymentMethod("CASH")}
                  >
                    <input
                      type="radio"
                      id="cash"
                      checked={paymentMethod === "CASH"}
                      onChange={() => !subfield.haveToPayFirst && setPaymentMethod("CASH")}
                      disabled={subfield.haveToPayFirst}
                      className="mr-2"
                    />
                    <label
                      htmlFor="cash"
                      className={`${subfield.haveToPayFirst ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      Tiền mặt
                    </label>
                  </div>
                </div>
                {subfield.haveToPayFirst && (
                  <p className="text-sm text-red-600 mt-2">
                    * Sân này yêu cầu thanh toán trước, không hỗ trợ thanh toán tiền mặt.
                  </p>
                )}
              </div>

              <div className="flex flex-col space-y-4">
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang xử lý..." : "Hoàn tất đặt sân"}
                </Button>

                <Link href={`/field-details/${subfield.fieldId}`}>
                  <Button
                    variant="outline"
                    className="w-full"
                    type="button"
                  >
                    Quay lại
                  </Button>
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const NewBookingPage = () => {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <BookingForm />
    </Suspense>
  );
};

export default NewBookingPage; 