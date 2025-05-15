'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  useFindUniqueField,
  useFindManySubField,
  useCreateSubField,
  useUpdateSubField,
  useDeleteSubField
} from '@/generated/hooks';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Edit, Trash2, ArrowLeft, PenLine } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { SubFieldStatus } from '@prisma/client';

const SubFieldManagementPage: React.FC = () => {
  const params = useParams();
  const fieldId = params.fieldId as string;
  const router = useRouter();

  // States for subfield management
  const [selectedSubField, setSelectedSubField] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newSubField, setNewSubField] = useState({
    price: 0,
    status: 'AVAILABLE' as SubFieldStatus, 
    haveToPayFirst: true,
    subfieldDescription: '',
    ranking: '',
    unitOfTime: 'HOUR',
  });

  // Fetch the field and its subfields
  const { data: field } = useFindUniqueField({
    where: { id: fieldId },
  });

  const { data: subFields, refetch: refetchSubFields } = useFindManySubField({
    where: { fieldId },
    orderBy: { createdAt: 'desc' },
  });

  // Mutations for subfield operations
  const createSubField = useCreateSubField();
  const updateSubField = useUpdateSubField();
  const deleteSubField = useDeleteSubField();

  // Handle create subfield
  const handleCreateSubField = async () => {
    try {
      await createSubField.mutateAsync({
        data: {
          price: parseFloat(newSubField.price.toString()),
          status: newSubField.status,
          haveToPayFirst: newSubField.haveToPayFirst,
          subfieldDescription: newSubField.subfieldDescription,
          ranking: newSubField.ranking,
          unitOfTime: newSubField.unitOfTime,
          field: {
            connect: { id: fieldId }
          }
          
        }
      });
      toast.success('Tạo sân con thành công');
      setIsAddModalOpen(false);
      setNewSubField({
        price: 0,
        status: 'AVAILABLE' as SubFieldStatus,
        haveToPayFirst: true,
        subfieldDescription: '',
        ranking: '',
        unitOfTime: 'HOUR',
      });
      refetchSubFields();
    } catch (error) {
      console.error('Lỗi khi tạo sân con:', error);
      toast.error('Không thể tạo sân con. Vui lòng thử lại.');
    }
  };

  // Handle update subfield
  const handleUpdateSubField = async () => {
    if (!selectedSubField) return;

    try {
      await updateSubField.mutateAsync({
        where: { id: selectedSubField.id },
        data: {
          price: parseFloat(selectedSubField.price.toString()),
          status: selectedSubField.status,
          haveToPayFirst: selectedSubField.haveToPayFirst,
          subfieldDescription: selectedSubField.subfieldDescription,
          ranking: selectedSubField.ranking,
          unitOfTime: selectedSubField.unitOfTime
        }
      });
      toast.success('Cập nhật sân con thành công');
      setIsEditModalOpen(false);
      refetchSubFields();
    } catch (error) {
      console.error('Lỗi khi cập nhật sân con:', error);
      toast.error('Không thể cập nhật sân con. Vui lòng thử lại.');
    }
  };

  // Handle delete subfield
  const handleDeleteSubField = async (subFieldId: string) => {
    try {
      await deleteSubField.mutateAsync({
        where: { id: subFieldId }
      });
      toast.success('Xóa sân con thành công');
      refetchSubFields();
    } catch (error) {
      console.error('Lỗi khi xóa sân con:', error);
      toast.error('Không thể xóa sân con. Vui lòng thử lại.');
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800';
      case 'MAINTENANCE':
        return 'bg-orange-100 text-orange-800';
      case 'RESERVED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-4">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 mb-4"
          onClick={() => router.push('/owner/court-management')}
        >
          <ArrowLeft size={16} /> Quay lại quản lý sân
        </Button>
        
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">{field?.location || 'Đang tải...'}</h1>
            <p className="text-gray-500">{field?.fieldDescription}</p>
          </div>
          
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} /> Thêm sân con
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Thêm sân con mới</DialogTitle>
                <DialogDescription>
                  Vui lòng điền thông tin chi tiết cho sân con mới
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Giá thuê (VNĐ)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={newSubField.price}
                      onChange={(e) => setNewSubField({...newSubField, price: parseFloat(e.target.value)})}
                      min="0"
                      step="1000"
                      placeholder="Nhập giá thuê sân"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unitOfTime">Đơn vị thời gian</Label>
                    <Select
                      value={newSubField.unitOfTime}
                      onValueChange={(value) => setNewSubField({...newSubField, unitOfTime: value})}
                    >
                      <SelectTrigger id="unitOfTime">
                        <SelectValue placeholder="Chọn đơn vị thời gian" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="HOUR">Giờ</SelectItem>
                        <SelectItem value="DAY">Ngày</SelectItem>
                        <SelectItem value="WEEK">Tuần</SelectItem>
                        <SelectItem value="MONTH">Tháng</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ranking">Ranking</Label>
                  <Input
                    id="ranking"
                    type="text"
                    value={newSubField.ranking}
                    onChange={(e) => setNewSubField({...newSubField, ranking: e.target.value})}
                    placeholder="Nhập ranking cho sân con"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    value={newSubField.status}
                    onValueChange={(value) => setNewSubField({...newSubField, status: value as SubFieldStatus})}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="AVAILABLE">Sẵn sàng</SelectItem>
                      <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
                      <SelectItem value="RESERVED">Đã đặt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="payment-required" 
                    checked={newSubField.haveToPayFirst} 
                    onCheckedChange={(checked) => 
                      setNewSubField({...newSubField, haveToPayFirst: checked as boolean})
                    }
                  />
                  <label
                    htmlFor="payment-required"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Yêu cầu thanh toán trước
                  </label>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={newSubField.subfieldDescription || ''}
                    onChange={(e) => setNewSubField({...newSubField, subfieldDescription: e.target.value})}
                    placeholder="Nhập mô tả về sân con"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
                <Button onClick={handleCreateSubField}>Tạo sân con</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* SubFields List */}
      {subFields && subFields.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableCaption>Danh sách các sân con thuộc {field?.location}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Sân con</TableHead>
                <TableHead>Ranking</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-center">Thanh toán trước</TableHead>
                <TableHead className="text-right">Giá thuê</TableHead>
                <TableHead className="text-center">Đơn vị thời gian</TableHead>
                <TableHead className="text-center w-[20px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subFields.map((subField, index) => (
                <TableRow key={subField.id}>
                  <TableCell className="font-medium">{field?.location} - {index + 1}</TableCell>
                  <TableCell>{subField.ranking || '-'}</TableCell>
                  <TableCell>{subField.subfieldDescription || '(Không có mô tả)'}</TableCell>
                  <TableCell className="text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(subField.status)}`}>
                      {subField.status === 'AVAILABLE' ? 'Sẵn sàng' : 
                       subField.status === 'MAINTENANCE' ? 'Bảo trì' : 'Đã đặt'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{subField.haveToPayFirst ? 'Có' : 'Không'}</TableCell>
                  <TableCell className="text-right">{new Intl.NumberFormat('vi-VN').format(subField.price)}</TableCell>
                  <TableCell className="text-center">
                    {subField.unitOfTime === 'HOUR' ? 'Giờ' : 
                     subField.unitOfTime === 'DAY' ? 'Ngày' : 
                     subField.unitOfTime === 'WEEK' ? 'Tuần' : 
                     subField.unitOfTime === 'MONTH' ? 'Tháng' : 'Giờ'}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center space-x-2">
                      <Dialog open={isEditModalOpen && selectedSubField?.id === subField.id} onOpenChange={(open) => !open && setSelectedSubField(null)}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => {
                            setSelectedSubField({...subField});
                            setIsEditModalOpen(true);
                          }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Chỉnh sửa sân con</DialogTitle>
                            <DialogDescription>
                              Cập nhật thông tin chi tiết cho sân con
                            </DialogDescription>
                          </DialogHeader>
                          {selectedSubField && (
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-price">Giá thuê (VNĐ)</Label>
                                  <Input
                                    id="edit-price"
                                    type="number"
                                    value={selectedSubField.price}
                                    onChange={(e) => setSelectedSubField({...selectedSubField, price: parseFloat(e.target.value)})}
                                    min="0"
                                    step="1000"
                                  />
                                </div>
                                <div className="grid gap-2">
                                  <Label htmlFor="edit-unitOfTime">Đơn vị thời gian</Label>
                                  <Select
                                    value={selectedSubField.unitOfTime || 'HOUR'}
                                    onValueChange={(value) => setSelectedSubField({...selectedSubField, unitOfTime: value})}
                                  >
                                    <SelectTrigger id="edit-unitOfTime">
                                      <SelectValue placeholder="Chọn đơn vị thời gian" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                      <SelectItem value="HOUR">Giờ</SelectItem>
                                      <SelectItem value="DAY">Ngày</SelectItem>
                                      <SelectItem value="WEEK">Tuần</SelectItem>
                                      <SelectItem value="MONTH">Tháng</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-ranking">Ranking</Label>
                                <Input
                                  id="edit-ranking"
                                  type="text"
                                  value={selectedSubField.ranking || ''}
                                  onChange={(e) => setSelectedSubField({...selectedSubField, ranking: e.target.value})}
                                  placeholder="Nhập ranking cho sân con"
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-status">Trạng thái</Label>
                                <Select
                                  value={selectedSubField.status}
                                  onValueChange={(value) => setSelectedSubField({...selectedSubField, status: value as SubFieldStatus})}
                                >
                                  <SelectTrigger id="edit-status">
                                    <SelectValue placeholder="Chọn trạng thái" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    <SelectItem value="AVAILABLE">Sẵn sàng</SelectItem>
                                    <SelectItem value="MAINTENANCE">Bảo trì</SelectItem>
                                    <SelectItem value="RESERVED">Đã đặt</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="edit-payment-required"
                                  checked={selectedSubField.haveToPayFirst}
                                  onCheckedChange={(checked) =>
                                    setSelectedSubField({...selectedSubField, haveToPayFirst: checked as boolean})
                                  }
                                />
                                <label
                                  htmlFor="edit-payment-required"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Yêu cầu thanh toán trước
                                </label>
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-description">Mô tả</Label>
                                <Textarea
                                  id="edit-description"
                                  value={selectedSubField.subfieldDescription || ''}
                                  onChange={(e) => setSelectedSubField({...selectedSubField, subfieldDescription: e.target.value})}
                                  placeholder="Nhập mô tả về sân con"
                                  rows={3}
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
                            <Button onClick={handleUpdateSubField}>Lưu thay đổi</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa sân con?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Hành động này không thể hoàn tác. Điều này sẽ xóa vĩnh viễn sân con
                              và tất cả các lịch đặt sân liên quan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteSubField(subField.id)}>Xóa</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <PenLine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Chưa có sân con nào</h3>
            <p className="mt-1 text-sm text-gray-500">
              Bắt đầu bằng cách tạo sân con mới cho {field?.location}
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsAddModalOpen(true)}>
                Thêm sân con mới
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubFieldManagementPage;