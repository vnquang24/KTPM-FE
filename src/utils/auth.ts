import { setCookie, getCookie, deleteCookie } from 'cookies-next';

export const authenticate = (email: string, password: string) => {
  // Mock authentication - thay thế bằng API call thực tế sau này
  return email === 'admin@gmail.com' && password === '1';
};

export const setAuthenticated = () => {
  setCookie('auth', 'true', { 
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
};

export const isAuthenticated = () => {
  return getCookie('auth') === 'true';
};

export const logout = () => {
  deleteCookie('auth', { path: '/' });
};