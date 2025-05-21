'use client';
import React, { useState } from 'react';
import {
  useFindManyAccount,
  useUpdateAccount,
  useDeleteAccount,
  useCreateCustomUser,
  useCreateOwner
} from '@/generated/hooks';
import { Role } from '@prisma/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff, Loader2, Search, UserCog, UserPlus } from 'lucide-react';
import axios from 'axios';

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<Role | undefined>(undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    role: Role.CUSTOMER as Role,
    // Thông tin bổ sung cho Customer
    customerDescription: '',
    // Thông tin bổ sung cho Owner
    ownerRanking: ''
  });

  // Load accounts with relations (chỉ hiển thị các tài khoản chưa bị xóa mềm)
  const { data: accounts, isLoading, refetch } = useFindManyAccount({
    include: {
      customUser: true,
      owner: true
    },
    where: {
      OR: [
        { username: { contains: searchQuery, mode: 'insensitive' } },
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { phone: { contains: searchQuery, mode: 'insensitive' } },
      ],
      role: filterRole ? { equals: filterRole } : undefined,
      deleted: null, // Chỉ hiển thị các tài khoản chưa bị xóa mềm
    },
    orderBy: { createdAt: 'desc' }
  });
  
  // Load tất cả tài khoản (bao gồm cả đã bị xóa mềm) để kiểm tra tính độc nhất
  const { data: allAccounts } = useFindManyAccount({
    select: {
      id: true,
      email: true,
      phone: true,
      deleted: true
    }
  });
 // Xóa tài khoản chỉ là update trường deleted
  const updateAccount = useUpdateAccount({
    onSuccess: () => {
      toast.success('Cập nhật người dùng thành công');
      refetch();
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(`Lỗi: ${error.message}`);
    }
  });

  // Mutation để tạo CustomUser
  const createCustomUser = useCreateCustomUser({
    onError: (error) => {
      toast.error(`Lỗi tạo thông tin khách hàng: ${error.message}`);
    }
  });

  // Mutation để tạo Owner
  const createOwner = useCreateOwner({
    onError: (error) => {
      toast.error(`Lỗi tạo thông tin chủ sân: ${error.message}`);
    }
  });

  // Reset form thêm người dùng mới
  const resetNewUserForm = () => {
    setNewUser({
      username: '',
      email: '',
      phone: '',
      password: '',
      role: Role.CUSTOMER,
      customerDescription: '',
      ownerRanking: ''
    });
  };

  const handleUpdateUser = () => {
    if (!editUser) return;

    updateAccount.mutate({
      where: { id: editUser.id },
      data: {
        username: editUser.username,
        email: editUser.email,
        phone: editUser.phone,
        role: editUser.role,
      }
    });
  };

  // Hàm tạo tên người dùng duy nhất dựa trên thời gian hiện tại
  const generateUniqueUsername = (baseUsername: string) => {
    const timestamp = new Date().getTime();
    const randomSuffix = Math.floor(Math.random() * 1000);
    return `${baseUsername}_${timestamp}_${randomSuffix}`;
  };
  
  // Kiểm tra tính độc nhất của email và số điện thoại dựa trên dữ liệu đã tải về
  const checkUserUniqueness = () => {
    let isValid = true;
    setEmailError(null);
    setPhoneError(null);
    
    // Kiểm tra email nếu có
    if (newUser.email && allAccounts) {
      setIsCheckingEmail(true);
      
      // Tìm kiếm trong tất cả tài khoản (bao gồm cả đã bị xóa mềm)
      const existingEmail = allAccounts.find(account => 
        account.email?.toLowerCase() === newUser.email.toLowerCase()
      );
      
      if (existingEmail) {
        setEmailError('Email này đã được sử dụng');
        isValid = false;
      }
      
      setIsCheckingEmail(false);
    }
    
    if (newUser.phone && allAccounts) {
      setIsCheckingPhone(true);
      
      const existingPhone = allAccounts.find(account => 
        account.phone?.toLowerCase() === newUser.phone.toLowerCase()
      );
      
      if (existingPhone) {
        setPhoneError('Số điện thoại này đã được sử dụng');
        isValid = false;
      }
      
      setIsCheckingPhone(false);
    }
    
    return isValid;
  };

  const handleAddUser = async () => {
    if (!newUser.password) {
      toast.error('Vui lòng nhập mật khẩu');
      return;
    }

    // Kiểm tra thông tin bổ sung cho từng vai trò
    if (newUser.role === Role.CUSTOMER && !newUser.customerDescription) {
      toast.error('Vui lòng nhập mô tả cho khách hàng');
      return;
    }

    const isUnique = checkUserUniqueness();
    
    if (!isUnique) {
      toast.error('Vui lòng kiểm tra lại thông tin đã nhập');
      return;
    }

    setIsSubmitting(true);

    try {
      const baseUsername = newUser.username.trim() || 'user';
      const uniqueUsername = generateUniqueUsername(baseUsername);
      
      // Chuẩn bị dữ liệu để gửi đến API register
      const registerData = {
        username: uniqueUsername,
        password: newUser.password,
        email: newUser.email || undefined,
        phone: newUser.phone || undefined,
        role: newUser.role,
        dateOfBirth: new Date().toISOString().split('T')[0] // Mặc định là ngày hiện tại
      };

      // Gọi API đăng ký
      const response = await axios.post(
        'http://localhost:8000/api/auth/register',
        registerData
      );

      if (!response.data || !response.data.user || !response.data.user.id) {
        toast.error('Không thể tạo tài khoản. Vui lòng thử lại sau.');
        setIsSubmitting(false);
        return;
      }

      const newAccountId = response.data.user.id;

      // Tạo thông tin bổ sung dựa trên vai trò
      if (newUser.role === Role.CUSTOMER) {
        await createCustomUser.mutateAsync({
          data: {
            description: newUser.customerDescription || `Khách hàng được tạo bởi Admin`,
            account: {
              connect: { id: newAccountId }
            }
          }
        });
        toast.success('Thêm người dùng và thông tin khách hàng thành công');
      } else if (newUser.role === Role.OWNER) {
        await createOwner.mutateAsync({
          data: {
            ranking: newUser.ownerRanking || undefined,
            account: {
              connect: { id: newAccountId }
            }
          }
        });
        toast.success('Thêm người dùng và thông tin chủ sân thành công');
      } else {
        toast.success('Thêm người dùng thành công');
      }

      refetch();
      setIsAdding(false);
      resetNewUserForm();
    } catch (error: any) {
      console.error("Lỗi khi tạo người dùng:", error);
      
      if (error.response && error.response.data) {
        toast.error(`Lỗi: ${error.response.data.message || 'Không thể tạo tài khoản'}`);
      } else {
        toast.error(`Lỗi: ${error.message || 'Không thể tạo tài khoản'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa người dùng này?')) {
      updateAccount.mutate({
        where: { id: userId },
        data: {
          deleted: new Date(),
        }
      }, {
        onSuccess: () => {
          toast.success('Xóa người dùng thành công');
          refetch();
        },
        onError: (error) => {
          toast.error(`Lỗi: ${error.message}`);
        }
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case Role.ADMIN:
        return 'bg-red-500 text-white';
      case Role.OWNER:
        return 'bg-blue-500 text-white';
      case Role.CUSTOMER: 
      default:
        return 'bg-green-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">Quản lý người dùng</CardTitle>
              <CardDescription>Quản lý tất cả người dùng trong hệ thống</CardDescription>
            </div>
            <Button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2"
            >
              <UserPlus size={18} />
              <span>Thêm người dùng</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="relative w-80">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Tìm theo tên, email, số điện thoại..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterRole} onValueChange={(value) => setFilterRole(value === "ALL" ? undefined : value as Role)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Lọc theo vai trò" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="ALL" className="bg-white">Tất cả</SelectItem>
                <SelectItem value={Role.ADMIN} className="bg-white">Quản trị viên</SelectItem>
                <SelectItem value={Role.OWNER} className="bg-white">Chủ sân</SelectItem>
                <SelectItem value={Role.CUSTOMER} className="bg-white">Khách hàng</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên đăng nhập</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-center">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts && accounts.length > 0 ? (
                    accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.username}</TableCell>
                        <TableCell>{account.email || 'N/A'}</TableCell>
                        <TableCell>{account.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getRoleBadgeColor(account.role)}>
                            {account.role === Role.ADMIN && 'Quản trị viên'}
                            {account.role === Role.OWNER && 'Chủ sân'}
                            {account.role === Role.CUSTOMER && 'Khách hàng'}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(account.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditUser({ ...account });
                                setIsEditing(true);
                              }}
                            >
                              <UserCog className="h-4 w-4 mr-1" />
                              Sửa
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="bg-red-600 text-white hover:bg-red-700"
                              onClick={() => handleDeleteUser(account.id)}
                            >
                              Xóa
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                        Không tìm thấy dữ liệu người dùng nào
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog chỉnh sửa người dùng */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông tin người dùng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho người dùng: {editUser?.username}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="username">Tên đăng nhập</label>
              <Input
                id="username"
                value={editUser?.username || ''}
                onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email">Email</label>
              <Input
                id="email"
                type="email"
                value={editUser?.email || ''}
                onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone">Số điện thoại</label>
              <Input
                id="phone"
                value={editUser?.phone || ''}
                onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="role">Vai trò</label>
              <Select
                value={editUser?.role}
                onValueChange={(value) => setEditUser({ ...editUser, role: value as Role })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.ADMIN}>Quản trị viên</SelectItem>
                  <SelectItem value={Role.OWNER}>Chủ sân</SelectItem>
                  <SelectItem value={Role.CUSTOMER}>Khách hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Hủy</Button>
            <Button onClick={handleUpdateUser}>Lưu thay đổi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog thêm người dùng mới */}
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm người dùng mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin để tạo tài khoản mới
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="new-username" className="font-medium">Tên đăng nhập <span className="text-gray-500 text-sm">(tự động tạo nếu để trống)</span></label>
              <Input
                id="new-username"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="Nhập tên đăng nhập hoặc để trống để tự động tạo"
              />
              <p className="text-xs text-gray-500 italic">Hệ thống sẽ tự động tạo tên đăng nhập duy nhất dựa trên tên bạn nhập hoặc 'user' nếu để trống</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="new-password" className="font-medium">Mật khẩu <span className="text-red-500">*</span></label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Nhập mật khẩu"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="new-email" className="font-medium">Email <span className="text-red-500">*</span></label>
              <Input
                id="new-email"
                type="email"
                value={newUser.email}
                onChange={(e) => {
                  setNewUser({ ...newUser, email: e.target.value });
                  setEmailError(null);
                }}
                placeholder="Nhập email"
                className={emailError ? "border-red-500" : ""}
              />
              {isCheckingEmail && <p className="text-xs text-blue-500 mt-1">Đang kiểm tra email...</p>}
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="new-phone" className="font-medium">Số điện thoại <span className="text-red-500">*</span></label>
              <Input
                id="new-phone"
                value={newUser.phone}
                onChange={(e) => {
                  setNewUser({ ...newUser, phone: e.target.value });
                  setPhoneError(null);
                }}
                placeholder="Nhập số điện thoại"
                className={phoneError ? "border-red-500" : ""}
              />
              {isCheckingPhone && <p className="text-xs text-blue-500 mt-1">Đang kiểm tra số điện thoại...</p>}
              {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="new-role" className="font-medium">Vai trò <span className="text-red-500">*</span></label>
              <Select
                value={newUser.role}
                onValueChange={(value) => setNewUser({ ...newUser, role: value as Role })}
              >
                <SelectTrigger id="new-role">
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value={Role.ADMIN} className="bg-white">Quản trị viên</SelectItem>
                  <SelectItem value={Role.OWNER} className="bg-white">Chủ sân</SelectItem>
                  <SelectItem value={Role.CUSTOMER} className="bg-white">Khách hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Thông tin bổ sung cho Customer */}
            {newUser.role === Role.CUSTOMER && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <label htmlFor="customer-description" className="font-medium">Mô tả khách hàng <span className="text-red-500">*</span></label>
                <Textarea
                  id="customer-description"
                  value={newUser.customerDescription}
                  onChange={(e) => setNewUser({ ...newUser, customerDescription: e.target.value })}
                  placeholder="Nhập mô tả về khách hàng"
                  className="min-h-[80px]"
                />
                <p className="text-xs text-blue-500 mt-1">
                  Thông tin này sẽ được lưu trong bảng CustomUser và liên kết với tài khoản
                </p>
              </div>
            )}

            {/* Thông tin bổ sung cho Owner */}
            {newUser.role === Role.OWNER && (
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <label htmlFor="owner-ranking" className="font-medium">Xếp hạng chủ sân</label>
                <Input
                  id="owner-ranking"
                  value={newUser.ownerRanking}
                  onChange={(e) => setNewUser({ ...newUser, ownerRanking: e.target.value })}
                  placeholder="Nhập xếp hạng của chủ sân (nếu có)"
                />
                <p className="text-xs text-blue-500 mt-1">
                  Thông tin này sẽ được lưu trong bảng Owner và liên kết với tài khoản
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdding(false)}>Hủy</Button>
            <Button 
              onClick={handleAddUser}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Thêm người dùng'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}