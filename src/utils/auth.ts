import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import axios from 'axios';

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

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const setUserData = (userData: AuthResponse['user']) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userData', JSON.stringify(userData));
  }
  
  setCookie('userData', JSON.stringify(userData), { 
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
    path: '/',
  });
};

export const getUserData = (): AuthResponse['user'] | null => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  }
  
  const userDataCookie = getCookie('userData');
  return userDataCookie ? JSON.parse(userDataCookie as string) : null;
};

export const getUserId = (): string | null => {
  const userData = getUserData();
  return userData ? userData.id : null;
};

export const authenticate = async (username: string, password: string): Promise<boolean> => {
  try {
    const response = await api.post<AuthResponse>('/api/auth/login', {
      username,
      password
    });

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

export const setAuthenticated = () => {
  setCookie('auth', 'true', { 
    maxAge: 60 * 60 * 24 * 7, // 7 ngày
    path: '/',
  });
};

export const isAuthenticated = () => {
  return getCookie('auth') === 'true' && getUserData() !== null;
};

export const getUserRole = (): 'ADMIN' | 'OWNER' | 'CUSTOMER' | null => {
  const userData = getUserData();
  return userData ? userData.role : null;
};

export const getUsername = (): string | null => {
  const userData = getUserData();
  return userData ? userData.username : null;
};

export const logout = () => {
  deleteCookie('auth', { path: '/' });
  deleteCookie('userData', { path: '/' });
  
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userData');
  }
};

export const getAuthDataForZenStack = () => {
  const userData = getUserData();
  if (!userData) return null;
  
  return {
    username: userData.username,
    password: '1' // Mật khẩu mặc định theo cấu hình hiện tại
  };
};

