"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useFindManyField, useFindManySubField, useFindManyBooking } from "@/generated/hooks";
import { format, parse, isAfter, isBefore, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import {SubFieldStatus} from "@prisma/client"
// Component ảnh thay thế khi không thể sử dụng URL bên ngoài
const ImagePlaceholder = ({ 
  className, 
  alt,
  bgColor = "bg-gray-200" 
}: { 
  className?: string; 
  alt: string;
  bgColor?: string;
}) => {
  return (
    <div className={`relative w-full h-full ${bgColor} flex items-center justify-center ${className}`}>
      <span className="text-gray-400">{alt}</span>
    </div>
  );
};

// Module Tìm kiếm sân
const CourtSearchModule = () => {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [courtType, setCourtType] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [availableSubFields, setAvailableSubFields] = useState<any[]>([]);

  // Fetch tất cả các sân
  const { data: fields, isLoading: isLoadingFields } = useFindManyField({
    include: {
      subFields: true,
    },
  });
  console.log('fields:', fields);
  // Fetch tất cả các sub-fields để lọc
  const { data: subFields, isLoading: isLoadingSubFields } = useFindManySubField({
    where: {
      status: {
        notIn: ["MAINTENANCE", "CLOSED"]
      }
    },
    include: {
      field: true,
      bookings: {
        where: {
          status: {
            not: "CANCELED" // Không lấy các booking đã hủy
          }
        }
      }
    },
  });

  // Fetch tất cả bookings để kiểm tra trùng lịch
  const { data: bookings, isLoading: isLoadingBookings } = useFindManyBooking({
    where: {
      status: {
        not: "CANCELED" // Chỉ lấy các booking chưa bị hủy
      }
    },
    include: {
      subfield: {
        include: {
          field: true
        }
      }
    }
  });

  // Danh sách địa điểm (lấy từ dữ liệu thực tế)
  const locations = fields ? [...new Set(fields.map(field => field.location))] : [];

  // Phân loại giá sân
  const priceRanges = [
    { value: "", label: "Tất cả mức giá" },
    { value: "0-100000", label: "Dưới 100.000đ" },
    { value: "100000-200000", label: "100.000đ - 200.000đ" },
    { value: "200000-300000", label: "200.000đ - 300.000đ" },
    { value: "300000", label: "Trên 300.000đ" }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    if (!date || !location) {
      alert("Vui lòng chọn đầy đủ thông tin tìm kiếm");
      setIsSearching(false);
      return;
    }
    
    // Định dạng ngày tìm kiếm
    const searchDate = new Date(date);
    
    // Log dữ liệu tìm kiếm
    console.log('Thông tin tìm kiếm:', {
      location,
      date,
      priceRange,
      courtType,
      searchDate: searchDate.toISOString()
    });

    // Lọc các sub-fields có sẵn dựa trên điều kiện tìm kiếm
    if (subFields) {
      console.log('Dữ liệu sân:', subFields);

      const filteredSubFields = subFields.filter(subField => {
        console.log('Đang kiểm tra sân:', subField.id, subField.subfieldDescription);
        
        // Lọc theo địa điểm
        if (location) {
          const field = fields?.find(f => f.id === subField.fieldId);
          console.log('Kiểm tra địa điểm:', { 
            yêuCầu: location, 
            sânChính: field?.location, 
            khớp: field?.location === location 
          });
          if (!field || field.location !== location) {
            console.log('Loại: Không đúng địa điểm');
            return false;
          }
        }

        // Lọc theo phạm vi giá
        if (priceRange) {
          const [minPrice, maxPrice] = priceRange.split('-').map(Number);
          console.log('Kiểm tra giá:', { 
            giáSân: subField.price, 
            khoảngGiá: priceRange, 
            giáThấpNhất: minPrice, 
            giáCaoNhất: maxPrice 
          });
          if (maxPrice) {
            if (subField.price < minPrice || subField.price > maxPrice) {
              console.log('Loại: Không đúng khoảng giá');
              return false;
            }
          } else {
            // Trường hợp "Trên x đồng"
            if (subField.price < minPrice) {
              console.log('Loại: Giá thấp hơn yêu cầu');
              return false;
            }
          }
        }
        
        return true;
      });

      console.log('Kết quả lọc sân:', filteredSubFields);
      setAvailableSubFields(filteredSubFields);
    }

    setIsSearching(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 rounded-xl bg-white shadow-lg">
      <h2 className="text-2xl font-bold text-center mb-6">Tìm sân PickleBall</h2>
      <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Địa điểm</label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isLoadingFields}
          >
            <option value="">Chọn địa điểm</option>
            {locations.map((loc, index) => (
              <option key={index} value={loc}>{loc}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ngày</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            min={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Giá sân</label>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {priceRanges.map((range, index) => (
              <option key={index} value={range.value}>{range.label}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3 mt-2">
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
            disabled={isSearching || isLoadingFields || isLoadingSubFields || isLoadingBookings}
          >
            {isSearching ? "Đang tìm..." : "Tìm sân"}
          </Button>
        </div>
      </form>

      {/* Hiển thị kết quả tìm kiếm */}
      {availableSubFields.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-4">Sân có sẵn ({availableSubFields.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableSubFields.map((subField) => (
              <div key={subField.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between">
                  <div>
                    <h4 className="font-bold">{subField.field.location}</h4>
                    <p className="text-sm text-gray-600">{subField.subfieldDescription || "Sân tiêu chuẩn"}</p>
                    <div className="mt-1 flex items-center">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                      <span className="ml-1 text-sm text-gray-600">--</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-600 font-bold">{subField.price.toLocaleString()}đ/{subField.unitOfTime}</p>
                    <p className="text-xs text-gray-500">
                      {subField.haveToPayFirst ? "Thanh toán trước" : "Thanh toán sau"}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href={`/field-details/${subField.fieldId}?subfieldId=${subField.id}&date=${date}`}>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      Xem chi tiết
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hiển thị thông báo khi không tìm thấy sân */}
      {availableSubFields.length === 0 && isSearching === false && date && location && (
        <div className="mt-8 text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Không tìm thấy sân phù hợp với tiêu chí của bạn.</p>
          <p className="text-gray-600 mt-2">Vui lòng thử lại với ngày hoặc địa điểm khác.</p>
        </div>
      )}
    </div>
  );
};

// Module Thông tin chi tiết sân
const CourtInfoModule = () => {
  const courts = [
    {
      id: 1,
      name: "Sân PickleBall Quận 1",
      image: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2000&auto=format&fit=crop",
      address: "123 Nguyễn Huệ, Quận 1, TP. HCM",
      price: "150.000đ - 250.000đ/giờ",
      rating: 4.8,
      description: "Sân PickleBall tiêu chuẩn quốc tế, có mái che, hệ thống đèn chiếu sáng hiện đại.",
      amenities: ["Phòng thay đồ", "WiFi miễn phí", "Chỗ đậu xe", "Nước uống miễn phí"],
    },
    {
      id: 2,
      name: "Sân PickleBall Bình Thạnh",
      image: "https://images.unsplash.com/photo-1564226803039-3e218882a3e1?q=80&w=2000&auto=format&fit=crop",
      address: "456 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP. HCM",
      price: "130.000đ - 220.000đ/giờ",
      rating: 4.5,
      description: "Sân PickleBall rộng rãi, mặt sân chất lượng cao, phù hợp cho cả người mới bắt đầu.",
      amenities: ["Có huấn luyện viên", "Cho thuê dụng cụ", "Nước uống", "Bãi đậu xe"],
    },
    {
      id: 3,
      name: "Sân PickleBall Quận 7",
      image: "https://images.unsplash.com/photo-1598121876563-29e8e3f895ef?q=80&w=2000&auto=format&fit=crop",
      address: "789 Nguyễn Văn Linh, Quận 7, TP. HCM",
      price: "170.000đ - 280.000đ/giờ",
      rating: 4.9,
      description: "Khu phức hợp thể thao cao cấp với nhiều sân PickleBall đạt tiêu chuẩn thi đấu.",
      amenities: ["Phòng gym", "Hồ bơi", "Nhà hàng", "Cửa hàng thể thao"],
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Sân PickleBall nổi bật</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courts.map((court) => (
          <div key={court.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            <div className="relative h-48">
              <Image 
                src={court.image}
                alt={court.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority={court.id === 1}
              />
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-gray-800">{court.name}</h3>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                  </svg>
                  <span className="ml-1 text-gray-600 font-medium">{court.rating}</span>
                </div>
              </div>
              <p className="text-gray-600 mb-2">{court.address}</p>
              <p className="text-blue-600 font-semibold mb-3">{court.price}</p>
              <p className="text-gray-700 mb-4 line-clamp-2">{court.description}</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {court.amenities.map((amenity, index) => (
                  <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                    {amenity}
                  </span>
                ))}
              </div>
              <div className="flex justify-center">
                <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                  Xem chi tiết
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-8">
        <Button
          variant="outline"
          className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
        >
          Xem thêm sân
        </Button>
      </div>
    </div>
  );
};

// Module Đặt sân
const BookingModule = () => {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-xl overflow-hidden">
        <div className="md:flex">
          <div className="md:w-1/2 p-10 md:p-12 text-white">
            <h2 className="text-3xl font-bold mb-6">Tìm kiếm sân ngay hôm nay</h2>
            <p className="text-blue-100 mb-8 text-lg">
              Chỉ với vài bước đơn giản, bạn có thể tìm sân PickleBall chất lượng cao với giá ưu đãi.
            </p>
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-white rounded-full p-2 mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Tìm sân phù hợp</h3>
                  <p className="text-blue-100 mt-1">Chọn địa điểm và ngày bạn muốn chơi.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-white rounded-full p-2 mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Xem chi tiết sân</h3>
                  <p className="text-blue-100 mt-1">Xem thông tin chi tiết và chọn thời gian sử dụng.</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-white rounded-full p-2 mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-xl">Đặt sân dễ dàng</h3>
                  <p className="text-blue-100 mt-1">Đặt sân và thanh toán an toàn, tiện lợi.</p>
                </div>
              </div>
            </div>
            <div className="mt-10">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 font-bold text-lg">
                Tìm sân ngay
              </Button>
            </div>
          </div>
          <div className="hidden md:block md:w-1/2 relative">
            <div className="absolute inset-0 bg-black opacity-10 z-10"></div>
            <Image 
              src="https://images.unsplash.com/photo-1569863959165-306f4d93950a?q=80&w=2000&auto=format&fit=crop"
              alt="PickleBall Court"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Mục Giới thiệu về PickleBall
const AboutSection = () => {
  return (
    <div className="w-full max-w-7xl mx-auto" id="about">
      <div className="md:flex items-center gap-10">
        <div className="md:w-1/2 mb-8 md:mb-0">
          <h2 className="text-3xl font-bold mb-6">Về PickleBall</h2>
          <p className="text-gray-700 text-lg mb-4">
            PickleBall là môn thể thao kết hợp giữa tennis, bóng bàn và cầu lông, được chơi trên một sân có kích thước nhỏ hơn sân tennis, với vợt đặc biệt và bóng nhựa có lỗ.
          </p>
          <p className="text-gray-700 text-lg mb-4">
            Đây là môn thể thao phù hợp với mọi lứa tuổi, dễ học nhưng khó tinh thông, mang lại nhiều lợi ích sức khỏe và kết nối xã hội.
          </p>
          <p className="text-gray-700 text-lg mb-6">
            Tại Việt Nam, PickleBall đang ngày càng phát triển và thu hút nhiều người chơi với các sân chất lượng cao được xây dựng trên khắp các thành phố lớn.
          </p>
          <Link href="/about" className="inline-block text-blue-600 font-medium hover:underline">
            Tìm hiểu thêm về PickleBall &rarr;
          </Link>
        </div>
        <div className="md:w-1/2 relative rounded-xl overflow-hidden h-80">
          <Image 
            src="https://images.unsplash.com/photo-1627414374133-c940bd285232?q=80&w=2000&auto=format&fit=crop"
            alt="PickleBall Sport"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-20 py-12">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 py-20">
        <div className="container mx-auto px-4">
          <div className="md:flex items-center justify-between">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Khám phá niềm vui cùng 
                <span className="text-blue-600"> PickleBall</span>
              </h1>
              <p className="text-gray-700 text-lg mb-8">
                Tìm và đặt sân PickleBall chất lượng cao gần bạn. Trải nghiệm môn thể thao đang thịnh hành trên toàn thế giới.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 text-lg">
                  Tìm sân ngay
                </Button>
                <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold px-6 py-3 text-lg">
                  Tìm hiểu thêm
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="relative h-80 md:h-96 rounded-xl overflow-hidden shadow-xl">
                <Image 
                  src="https://images.unsplash.com/photo-1518093929702-c6f370c4e8a1?q=80&w=2000&auto=format&fit=crop"
                  alt="PickleBall Court"
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search Module Section */}
      <section id="search" className="-mt-10 w-full max-w-4xl mx-auto px-4">
        <CourtSearchModule />
      </section>

      {/* Court Info Section */}
      <section id="courts" className="w-full px-4 py-10">
        <CourtInfoModule />
      </section>

      {/* Booking Section */}
      <section id="booking" className="w-full px-4 py-10 bg-blue-50">
        <BookingModule />
      </section>

      {/* About Section */}
      <section id="about" className="w-full px-4 py-10">
        <AboutSection />
      </section>

      {/* Testimonials Section */}
      <section className="w-full px-4 py-10 bg-gray-50">
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Khách hàng nói gì về chúng tôi</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex items-center mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-6">"Dịch vụ đặt sân rất tiện lợi, sân chất lượng tốt và nhân viên phục vụ nhiệt tình. Tôi sẽ tiếp tục sử dụng dịch vụ này trong tương lai."</p>
                <div className="flex items-center">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4">
                    <Image 
                      src={`https://i.pravatar.cc/150?img=${item + 10}`}
                      alt="Avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold">Nguyễn Văn A</p>
                    <p className="text-gray-600 text-sm">Khách hàng thường xuyên</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
