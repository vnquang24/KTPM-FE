"use client"

import { useState, useEffect } from "react"
import { useFindManyReview } from "@/generated/hooks/review"
import { useFindManyField } from "@/generated/hooks/field"

import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
import { getUserId } from "@/utils/auth"
import { useFindFirstOwner } from "@/generated/hooks/owner"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReviewsPage() {
  const [selectedFieldId, setSelectedFieldId] = useState<string | "all">("all")
  const userId = getUserId();
  
  const { data: owner } = useFindFirstOwner({
    where: {
      account: {
        id: userId || '',
      }
    }
  });
  // Lấy danh sách các sân của owner
  const { data: ownerFields, isLoading: isLoadingFields } = useFindManyField({
    where: {
      ownerId: owner?.id
    },
    include: {
      subFields: true
    }
  })

  // Lấy tất cả reviews từ các sân của owner
  const { data: reviews, isLoading: isLoadingReviews } = useFindManyReview({
    where: {
      booking: {
        subfield: {
          field: {
            ownerId: owner?.id,
            ...(selectedFieldId !== "all" ? { id: selectedFieldId } : {})
          }
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
          },
          customUser: {
            include: {
              account: true
            }
          }
        }
      }
    },
    orderBy: {
      date: 'desc'
    }
  })

  // Xử lý thống kê dữ liệu
  const ratingDistribution = [0, 0, 0, 0, 0] // Đếm số lượng ratings 1-5 sao
  const fieldRatings: Record<string, {count: number, sum: number, name: string}> = {}

  if (reviews) {
    reviews.forEach(review => {
      ratingDistribution[review.rating - 1]++
      
      const fieldId = review.booking.subfield.field.id
      const fieldName = review.booking.subfield.field.location
      
      if (!fieldRatings[fieldId]) {
        fieldRatings[fieldId] = { count: 0, sum: 0, name: fieldName }
      }
      
      fieldRatings[fieldId].count++
      fieldRatings[fieldId].sum += review.rating
    })
  }

  const ratingDistributionData = [
    { name: '1 Sao', count: ratingDistribution[0] },
    { name: '2 Sao', count: ratingDistribution[1] },
    { name: '3 Sao', count: ratingDistribution[2] },
    { name: '4 Sao', count: ratingDistribution[3] },
    { name: '5 Sao', count: ratingDistribution[4] }
  ]

  const fieldRatingData = Object.values(fieldRatings).map(field => ({
    name: field.name,
    rating: field.count > 0 ? (field.sum / field.count).toFixed(1) : 0,
    count: field.count
  }))

  if (isLoadingFields || isLoadingReviews) {
    return <div className="flex items-center justify-center min-h-screen">Đang tải...</div>
  }
  return (
    <div className="container mx-auto py-6">
      
      <div className="mb-6">
        <Select 
          value={selectedFieldId} 
          onValueChange={(value) => setSelectedFieldId(value as "all" | string)}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Chọn sân để lọc" />
          </SelectTrigger>
          <SelectContent className="bg-white">
            <SelectItem value="all">Tất cả các sân</SelectItem>
            {ownerFields?.map(field => (
              <SelectItem key={field.id} value={field.id}>
                {field.location}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="statistics" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="statistics">Thống kê</TabsTrigger>
          <TabsTrigger value="details">Chi tiết đánh giá</TabsTrigger>
        </TabsList>
        
        <TabsContent value="statistics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Tổng quan Đánh giá</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-medium text-blue-700">Tổng số đánh giá</h3>
                    <p className="text-3xl font-bold">{reviews?.length || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-medium text-green-700">Đánh giá trung bình</h3>
                    <p className="text-3xl font-bold">
                      {reviews && reviews.length > 0 
                        ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
                        : "N/A"}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <h3 className="text-lg font-medium text-purple-700">Đánh giá 5 sao</h3>
                    <p className="text-3xl font-bold">
                      {ratingDistribution[4]} 
                      <span className="text-sm font-normal">
                        ({reviews && reviews.length > 0 
                          ? ((ratingDistribution[4] / reviews.length) * 100).toFixed(0) 
                          : 0}%)
                      </span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Phân bố Đánh giá</CardTitle>
                <CardDescription>Số lượng đánh giá theo sao</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={ratingDistributionData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Số lượng" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Đánh giá Trung bình theo Sân</CardTitle>
                <CardDescription>Điểm đánh giá trung bình cho từng sân</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={fieldRatingData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="rating" name="Đánh giá TB" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Tỷ lệ Đánh giá theo Sao</CardTitle>
                <CardDescription>Phân bố đánh giá theo số sao</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ratingDistributionData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {ratingDistributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            
          </div>
        </TabsContent>
        
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết Đánh giá</CardTitle>
              <CardDescription>
                {selectedFieldId !== "all" 
                  ? `Đánh giá cho sân: ${ownerFields?.find(f => f.id === selectedFieldId)?.location}`
                  : 'Tất cả đánh giá'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Khách hàng</TableHead>
                    <TableHead>Sân</TableHead>
                    <TableHead>Sân phụ</TableHead>
                    <TableHead>Đánh giá</TableHead>
                    <TableHead>Nhận xét</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviews && reviews.length > 0 ? (
                    reviews.map((review) => (
                      <TableRow key={review.id}>
                        <TableCell>
                          {new Date(review.date).toLocaleDateString('vi-VN')}
                        </TableCell>
                        <TableCell>
                          {review.booking.customUser.account.username}
                        </TableCell>
                        <TableCell>
                          {review.booking.subfield.field.location}
                        </TableCell>
                        <TableCell>
                          {review.booking.subfield.subfieldDescription || `Sân phụ #${review.booking.subfieldId.slice(-5)}`}
                        </TableCell>
                        <TableCell>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span key={i} className="text-xl">
                                {i < review.rating ? '★' : '☆'}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          {review.text || <span className="text-gray-400">Không có nhận xét</span>}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        Chưa có đánh giá nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
