'use client';

import React, {useEffect} from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authenticate, setAuthenticated, isAuthenticated, setUserData, getUserData } from '@/utils/auth';
import { useState } from 'react';

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

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-semibold text-center mb-6">Đăng nhập</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Tên đăng nhập
            </label>
            <input
              type="text"
              id="username"
              {...register('username')}
              className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Nhập tên đăng nhập"
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">{errors.username.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Mật khẩu
            </label>
            <input
              type="password"
              id="password"
              {...register('password')}
              className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Nhập mật khẩu"
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {loginError && (
            <p className="text-red-500 text-sm mb-4">{loginError}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${isLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} text-white p-2 rounded-lg mt-4 focus:outline-none`}
          >
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
