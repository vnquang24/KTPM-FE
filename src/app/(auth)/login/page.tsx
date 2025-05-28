'use client';

import React, {useEffect, useState} from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authenticate, isAuthenticated, getUserData } from '@/utils/auth';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';

const loginFormSchema = z.object({
  username: z.string().min(1, {
    message: 'Tên đăng nhập không được để trống',
  }),
  password: z.string().min(1, {
    message: 'Mật khẩu không được để trống',
  }),
});

type LoginFormType = z.infer<typeof loginFormSchema>;

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated()) {
      const userData = getUserData();
      if (userData && userData.role) {
        switch (userData.role) {
          case 'ADMIN':
            router.push('/admin/statistics');
            break;
          case 'OWNER':
            router.push('/owner/court-stats');
            break;
          case 'CUSTOMER':
            router.push('/customer/booking-history');
            break;
          default:
            router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [router]);
  
  const isDev = process.env.NODE_ENV === 'development';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormType>({
    resolver: zodResolver(loginFormSchema),
  });

  React.useEffect(() => {
    if (isDev) {
      setValue('username', 'admin');
      setValue('password', '1');
    }
  }, [isDev, setValue]);

  const onSubmit = async (data: LoginFormType) => {
    try {
      setIsLoading(true);
      setLoginError('');
      
      const success = await authenticate(data.username, data.password);
      
      if (success) {
        const userData = getUserData();
        
        if (userData && userData.role) {
          switch (userData.role) {
            case 'ADMIN':
              router.push('/admin/statistics');
              break;
            case 'OWNER':
              router.push('/owner/court-stats');
              break;
            case 'CUSTOMER':
              router.push('/customer/booking-history');
              break;
            default:
              setLoginError('Tài khoản không có quyền truy cập');
              return;
          }
          router.refresh(); // Refresh để đảm bảo middleware được chạy lại
        } else {
          setLoginError('Không lấy được thông tin người dùng');
        }
      } else {
        setLoginError('Sai tên đăng nhập hoặc mật khẩu');
      }
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      setLoginError('Có lỗi xảy ra khi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-blue-600 p-6 text-center">
          <h2 className="text-3xl font-bold text-white">PickleBall Court</h2>
          <p className="mt-2 text-blue-100">Đăng nhập để quản lý sân PickleBall</p>
        </div>
        
        <div className="p-8">
          {loginError && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
              <p>{loginError}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="mb-6">
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-gray-700">
                Tên đăng nhập
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  {...register('username')}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Nhập tên đăng nhập"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  {...register('password')}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 pr-10"
                  placeholder="Nhập mật khẩu"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

           

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-lg p-3 text-center font-medium text-white transition-colors ${
                isLoading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="mr-2 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đăng nhập...
                </span>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
          
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
