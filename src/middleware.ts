import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Kiểm tra nếu đang ở trang chủ
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Lấy token xác thực từ cookies
  const isAuthenticated = request.cookies.get('auth')
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')

  // Lấy thông tin người dùng từ cookies (nếu có)
  const userDataCookie = request.cookies.get('userData')
  let userData = null
  
  if (userDataCookie) {
    try {
      userData = JSON.parse(userDataCookie.value)
    } catch (error) {
      console.error('Lỗi khi parse userData:', error)
    }
  }

  // Nếu đã đăng nhập và cố truy cập trang login
  if (isAuthenticated && isAuthPage) {
    // Chuyển hướng dựa vào role
    if (userData && userData.role) {
      switch (userData.role) {
        case 'ADMIN':
          return NextResponse.redirect(new URL('/admin/statistics', request.url))
        case 'OWNER':
          return NextResponse.redirect(new URL('/owner/court-stats', request.url))
        case 'CUSTOMER':
          return NextResponse.redirect(new URL('/customer/booking', request.url))
        default:
          return NextResponse.redirect(new URL('/login', request.url))
      }
    } else {
      // Nếu không có thông tin role, chuyển về trang home mặc định
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  // Nếu chưa đăng nhập và cố truy cập trang được bảo vệ
  if (!isAuthenticated && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Xử lý quyền truy cập dựa vào role
  if (isAuthenticated && userData && userData.role) {
    // Kiểm tra truy cập vào khu vực admin
    if (request.nextUrl.pathname.startsWith('/admin') && userData.role !== 'ADMIN') {
      // Chuyển hướng đến trang home phù hợp với role
      switch (userData.role) {
        case 'OWNER':
          return NextResponse.redirect(new URL('/owner/home', request.url))
        case 'CUSTOMER':
          return NextResponse.redirect(new URL('/customer/home', request.url))
        default:
          return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Kiểm tra truy cập vào khu vực owner
    if (request.nextUrl.pathname.startsWith('/owner') && 
        userData.role !== 'OWNER' && userData.role !== 'ADMIN') {
      // Chuyển hướng đến trang home phù hợp với role
      if (userData.role === 'CUSTOMER') {
        return NextResponse.redirect(new URL('/customer/home', request.url))
      } else {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Kiểm tra truy cập vào khu vực customer
    if (request.nextUrl.pathname.startsWith('/customer') && 
        userData.role !== 'CUSTOMER' && userData.role !== 'ADMIN') {
      // Admin có thể truy cập tất cả, nhưng owner chỉ truy cập được khu vực owner
      if (userData.role === 'OWNER') {
        return NextResponse.redirect(new URL('/owner/home', request.url))
      } else {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }
  }

  return NextResponse.next()
}

// Chỉ định các routes cần được middleware xử lý
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}