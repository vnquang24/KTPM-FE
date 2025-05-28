"use client";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useFindManyField, useFindManySubField, useFindManyBooking, useFindManyReview } from "@/generated/hooks";
import { format } from "date-fns";
import image2 from "../../../../public/2.jpg"
import image5 from "../../../../public/5.jpg"
import image3 from "../../../../public/3.webp"
import image6 from "../../../../public/6.jpg"
const CourtSearchModule = () => {
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [availableSubFields, setAvailableSubFields] = useState<any[]>([]);

  const { data: fields, isLoading: isLoadingFields } = useFindManyField({
    include: {
      subFields: true,
    },
  });

  const { data: subFields, isLoading: isLoadingSubFields } = useFindManySubField({
    where: {
      status: {
        not: "CLOSED"
      }
    },
    include: {
      field: true,
      bookings: {
          include: {
            review: true
          }
      }
    },
  });

  
  const locations = fields ? [...new Set(fields.map(field => field.location))] : [];

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
  
    if (subFields) {
      const filteredSubFields = subFields.filter(subField => {
        if (location) {
          const field = fields?.find(f => f.id === subField.fieldId);
          if (!field || field.location !== location) {
            return false;
          }
        }
  
        if (priceRange) {
          const [minPrice, maxPrice] = priceRange.split('-').map(Number);
          if (maxPrice) {
            if (subField.price < minPrice || subField.price > maxPrice) {
              console.log('Loại: Không đúng khoảng giá');
              return false;
            }
          } else {
            if (subField.price < minPrice) {
              console.log('Loại: Giá thấp hơn yêu cầu');
              return false;
            }
          }
        }
  
        return true;
      });
  
      // Sắp xếp theo giá từ cao đến thấp (cao nhất trước)
      const sortedSubFields = filteredSubFields.sort((a, b) => b.price - a.price);
  
      console.log('Kết quả lọc sân:', sortedSubFields);
      setAvailableSubFields(sortedSubFields);
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
            disabled={isSearching || isLoadingFields || isLoadingSubFields}
          >
            {isSearching ? "Đang tìm..." : "Tìm sân"}
          </Button>
        </div>
      </form>

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
                    {subField.status === "MAINTENANCE" && (
                      <p className="text-xs text-yellow-600">
                        Đang bảo trì
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <Link href={`/field-details/${subField.fieldId}?subfieldId=${subField.id}&date=${date}`}>
                    <Button className="bg-blue-600 text-white hover:bg-blue-700">
                      Đặt sân
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {availableSubFields.length === 0 && isSearching === false && date && location && (
        <div className="mt-8 text-center p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Không tìm thấy sân phù hợp với tiêu chí của bạn.</p>
          <p className="text-gray-600 mt-2">Vui lòng thử lại với ngày hoặc địa điểm khác.</p>
        </div>
      )}
    </div>
  );
};

const CourtInfoModule = () => {
  const { data: fields, isLoading: isLoadingFields } = useFindManyField({
    include: {
      subFields: {
        include: {
          bookings: {
            include: {
              review: true
            }
          }
        }
      }
    },
    take: 3,
    orderBy: {
      createdAt: 'desc'
    }
  });

  const topRatedFields = fields?.map(field => {
    const allReviews = field.subFields?.flatMap(subField =>
      subField.bookings?.filter(booking => booking.review !== null)
        .map(booking => booking.review) || []
    ) || [];

    const averageRating = allReviews.length > 0
      ? allReviews.reduce((sum, review) => sum + (review?.rating || 0), 0) / allReviews.length
      : 0;

    const priceRange = field.subFields && field.subFields.length > 0
      ? {
        min: Math.min(...field.subFields.map(sub => sub.price)),
        max: Math.max(...field.subFields.map(sub => sub.price))
      }
      : { min: 0, max: 0 };

    const amenities = ["Phòng thay đồ", "WiFi miễn phí", "Chỗ đậu xe", "Nước uống miễn phí"];

    return {
      id: field.id,
      fieldName: field.fieldDescription || field.location,
      location: field.location,
      description: field.fieldDescription,
      rating: averageRating.toFixed(1),
      priceRange: `${priceRange.min.toLocaleString()}đ - ${priceRange.max.toLocaleString()}đ/giờ`,
      amenities,
      image: image6
    };
  }) || [];

  topRatedFields.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

  return (
    <div className="w-full max-w-7xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8">Sân PickleBall nổi bật</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {isLoadingFields ? (
          Array(3).fill(0).map((_, idx) => (
            <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-md animate-pulse">
              <div className="h-48 bg-gray-200"></div>
              <div className="p-5">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
                <div className="h-16 bg-gray-200 rounded mb-4"></div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-6 w-20 bg-gray-200 rounded-full"></div>
                  ))}
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))
        ) : topRatedFields.length > 0 ? (
          topRatedFields.map((field) => (
            <div key={field.id} className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              <div className="relative h-48">
                <Image
                  src={field.image}
                  alt={field.fieldName}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  priority={field.id === topRatedFields[0]?.id}
                />
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{field.fieldName}</h3>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                    <span className="ml-1 text-gray-600 font-medium">{field.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-2">{field.location}</p>
                <p className="text-blue-600 font-semibold mb-3">{field.priceRange}</p>
                <p className="text-gray-700 mb-4 line-clamp-2">{field.description || "Sân PickleBall tiêu chuẩn, chất lượng cao, phù hợp cho mọi trình độ người chơi."}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {field.amenities.map((amenity, index) => (
                    <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                      {amenity}
                    </span>
                  ))}
                </div>
                <div className="flex justify-center">
                  <Link href={`/field-details/${field.id}`}>
                    <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                      Đặt sân
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-10">
            <p className="text-gray-500">Không tìm thấy sân nào</p>
          </div>
        )}
      </div>
      
    </div>
  );
};

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
              src={image3}

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
          <Link
            href="https://vi.wikipedia.org/wiki/Pickleball"
            className="inline-block text-blue-600 font-medium hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Tìm hiểu thêm về PickleBall &rarr;
          </Link>
        </div>
        <div className="md:w-1/2 relative rounded-xl overflow-hidden h-80">
          <Image
            src={image2}
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
                  <Link
                    href="https://vi.wikipedia.org/wiki/Pickleball"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Tìm hiểu thêm &rarr;
                  </Link>
                </Button>
              </div>
            </div>
            <div className="md:w-1/2">
              <div className="relative h-80 md:h-96 rounded-xl overflow-hidden shadow-xl">
                <Image
                  src={image5}
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

      <section id="search" className="-mt-10 w-full max-w-4xl mx-auto px-4">
        <CourtSearchModule />
      </section>

      <section id="courts" className="w-full px-4 py-10">
        <CourtInfoModule />
      </section>

      <section id="booking" className="w-full px-4 py-10 bg-blue-50">
        <BookingModule />
      </section>

      <section id="about" className="w-full px-4 py-10">
        <AboutSection />
      </section>

      <section className="w-full px-4 py-10 bg-gray-50">
        <div className="w-full max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Khách hàng nói gì về chúng tôi</h2>
          <TestimonialsSection />
        </div>
      </section>

    </div>
  );
}

const TestimonialsSection = () => {
  const { data: reviews, isLoading } = useFindManyReview({
    where: {
      rating: {
        gte: 4 // Chỉ lấy các đánh giá từ 4 sao trở lên
      }
    },
    include: {
      booking: {
        include: {
          customUser: {
            include: {
              account: true
            }
          },
          subfield: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 3
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-white p-6 rounded-xl shadow-md animate-pulse">
            <div className="flex items-center mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div key={star} className="w-5 h-5 bg-gray-200 rounded-full mr-1"></div>
                ))}
              </div>
            </div>
            <div className="h-20 bg-gray-200 rounded mb-6"></div>
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
              <div>
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Chưa có đánh giá nào</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {reviews.map((review) => {
        const booking = review.booking;
        const username = booking?.customUser?.account?.username || 'Khách hàng ẩn danh';
        const userInitial = username.charAt(0);
        const subfieldDesc = booking?.subfield?.subfieldDescription || 'Sân tiêu chuẩn';

        return (
          <div key={review.id} className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    
                  </svg>
                ))}
              </div>
            </div>
            <p className="text-gray-700 mb-6 line-clamp-4">"{review.text || review.description || 'Trải nghiệm rất tốt'}"</p>
            <div className="flex items-center">
              <div className="relative w-12 h-12 rounded-full overflow-hidden mr-4 bg-gray-200">
                <div className="flex items-center justify-center h-full text-xl font-bold text-gray-500">
                  {userInitial}
                </div>
              </div>
              <div>
                <p className="font-semibold">{username}</p>
                <p className="text-gray-600 text-sm">
                  {`Đã đặt sân ${subfieldDesc}`}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
