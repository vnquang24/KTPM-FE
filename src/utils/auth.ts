// Xử lí cookies 
import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import axios from 'axios';

// Định nghĩa interface cho response từ API
interface AuthResponse {
  message: string;
  user: {
    id: string;
    username: string;
    email?: string | null;
    phone?: string | null;
    role: 'ADMIN' | 'OWNER' | 'CUSTOMER';
    dateOfBirth?: string | null;
  };
}

interface LoginData {
  username: string;
  password: string;
}

// Tạo axios instance với các cấu hình mặc định
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Lưu trữ thông tin người dùng đã đăng nhập
export const setUserData = (userData: AuthResponse['user']) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userData', JSON.stringify(userData));
  }
  
  // Lưu userData vào cookie để middleware có thể đọc được
  setCookie('userData', JSON.stringify(userData), { 
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
    path: '/',
  });
};

// Lấy thông tin người dùng đã lưu
export const getUserData = (): AuthResponse['user'] | null => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  }
  
  // Fallback để đọc từ cookie nếu cần
  const userDataCookie = getCookie('userData');
  return userDataCookie ? JSON.parse(userDataCookie as string) : null;
};

// Lấy ID của người dùng
export const getUserId = (): string | null => {
  const userData = getUserData();
  return userData ? userData.id : null;
};

// Xác thực bằng API - gọi để đăng nhập
export const authenticate = async (username: string, password: string): Promise<boolean> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/login', {
      username,
      password
    });

    // Lưu thông tin người dùng nếu đăng nhập thành công
    if (response.data && response.data.user) {
      setUserData(response.data.user);
      setAuthenticated(); // Đặt cookie xác thực
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Đăng nhập thất bại:', error);
    return false;
  }
};

// Đăng ký tài khoản mới
export const register = async (registerData: {
  username: string;
  password: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  name?: string;
  role?: string;
}): Promise<boolean> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/register', registerData);
    
    if (response.data && response.data.user) {
      setUserData(response.data.user);
      setAuthenticated();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Đăng ký thất bại:', error);
    return false;
  }
};

// Đặt cookie xác thực
export const setAuthenticated = () => {
  setCookie('auth', 'true', { 
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
    path: '/',
  });
};

// Kiểm tra người dùng đã đăng nhập chưa
export const isAuthenticated = () => {
  return getCookie('auth') === 'true' && getUserData() !== null;
};

// Lấy role của người dùng hiện tại
export const getUserRole = (): 'ADMIN' | 'OWNER' | 'CUSTOMER' | null => {
  const userData = getUserData();
  return userData ? userData.role : null;
};

// Lấy username của người dùng
export const getUsername = (): string | null => {
  const userData = getUserData();
  return userData ? userData.username : null;
};

// Đăng xuất
export const logout = () => {
  deleteCookie('auth', { path: '/' });
  deleteCookie('userData', { path: '/' });
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userData');
  }
};

// Lấy username và password cho ZenStack API
export const getAuthDataForZenStack = () => {
  const userData = getUserData();
  if (!userData) return null;
  
  return {
    username: userData.username,
    password: '1' // Mật khẩu mặc định theo cấu hình hiện tại
  };
};

