'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  useFindFirstOwner,
  useFindManyField, 
  useCreateField,
  useUpdateField,
  useDeleteField
} from '@/generated/hooks';
import { getUserId } from '@/utils/auth';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Plus, Edit, Trash2, LandPlot } from 'lucide-react';
import { toast } from 'react-hot-toast';

const CourtManagementPage: React.FC = () => {
  const [selectedField, setSelectedField] = useState<any>(null);
  const [newField, setNewField] = useState({
    location: '',
    fieldDescription: '',
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  const userId = getUserId();
  
  const { data: owner } = useFindFirstOwner({
    where: {
      account: {
        id: userId || '',
      }
    }
  });
  
  const { data: fields, refetch: refetchFields } = useFindManyField({
    where: {
      ownerId: owner?.id,
    },
    include: {
      subFields: true,
    },
  }, {
    enabled: !!owner?.id,
  });
  
  const createField = useCreateField();
  const updateField = useUpdateField();
  const deleteField = useDeleteField();

  const handleCreateField = async () => {
    if (!owner) return;
    
    try {
      await createField.mutateAsync({
        data: {
          location: newField.location,
          fieldDescription: newField.fieldDescription,
          owner: {
            connect: { id: owner.id }
          }
        }
      });
      toast.success('Tạo sân thành công');
      setIsAddModalOpen(false);
      setNewField({ location: '', fieldDescription: '' });
      refetchFields();
    } catch (error) {
      console.error('Lỗi khi tạo sân:', error);
      toast.error('Không thể tạo sân. Vui lòng thử lại.');
    }
  };

  const handleUpdateField = async () => {
    if (!selectedField) return;
    
    try {
      await updateField.mutateAsync({
        where: { id: selectedField.id },
        data: {
          location: selectedField.location,
          fieldDescription: selectedField.fieldDescription
        }
      });
      toast.success('Cập nhật sân thành công');
      setIsEditModalOpen(false);
      refetchFields();
    } catch (error) {
      console.error('Lỗi khi cập nhật sân:', error);
      toast.error('Không thể cập nhật sân. Vui lòng thử lại.');
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      await deleteField.mutateAsync({
        where: { id: fieldId }
      });
      toast.success('Xóa sân thành công');
      refetchFields();
    } catch (error) {
      console.error('Lỗi khi xóa sân:', error);
      toast.error('Không thể xóa sân. Vui lòng thử lại.');
    }
  };

  const router = useRouter();
  const navigateToSubfields = (fieldId: string) => {
    router.push(`/owner/court-management/sub-fields/${fieldId}`);
  };

  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={16} /> Thêm sân mới
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Thêm sân mới</DialogTitle>
              <DialogDescription>
                Vui lòng điền thông tin chi tiết cho sân mới
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="location">Vị trí</Label>
                <Input 
                  id="location" 
                  value={newField.location} 
                  onChange={(e) => setNewField({...newField, location: e.target.value})}
                  placeholder="Nhập vị trí sân" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea 
                  id="description" 
                  value={newField.fieldDescription} 
                  onChange={(e) => setNewField({...newField, fieldDescription: e.target.value})}
                  placeholder="Nhập mô tả về sân" 
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
              <Button onClick={handleCreateField} disabled={!newField.location}>Tạo sân</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {fields && fields.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map((field) => (
            <Card key={field.id} className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LandPlot className="h-5 w-5" /> {field.location}
                </CardTitle>
                <CardDescription>
                  {field.subFields?.length || 0} sân con • ID: {field.id.substring(0, 8)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {field.fieldDescription || 'Không có mô tả'}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => navigateToSubfields(field.id)}>
                  Quản lý sân con
                </Button>
                <div className="flex gap-2">
                  <Dialog open={isEditModalOpen && selectedField?.id === field.id} onOpenChange={(open) => !open && setSelectedField(null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => {
                        setSelectedField({...field});
                        setIsEditModalOpen(true);
                      }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Chỉnh sửa thông tin sân</DialogTitle>
                        <DialogDescription>
                          Cập nhật thông tin chi tiết cho sân
                        </DialogDescription>
                      </DialogHeader>
                      {selectedField && (
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="edit-location">Vị trí</Label>
                            <Input 
                              id="edit-location" 
                              value={selectedField.location} 
                              onChange={(e) => setSelectedField({...selectedField, location: e.target.value})}
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="edit-description">Mô tả</Label>
                            <Textarea 
                              id="edit-description" 
                              value={selectedField.fieldDescription || ''} 
                              onChange={(e) => setSelectedField({...selectedField, fieldDescription: e.target.value})}
                              rows={4}
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Hủy</Button>
                        <Button onClick={handleUpdateField}>Lưu thay đổi</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa sân?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Hành động này không thể hoàn tác. Điều này sẽ xóa vĩnh viễn sân
                          và tất cả các sân con thuộc sân này.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteField(field.id)}>Xóa</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <LandPlot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Chưa có sân nào</h3>
            <p className="mt-1 text-sm text-gray-500">
              Bắt đầu bằng cách tạo sân mới cho doanh nghiệp của bạn
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsAddModalOpen(true)}>
                Thêm sân mới
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtManagementPage;