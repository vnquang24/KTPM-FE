import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  const isAuthenticated = request.cookies.get('auth')
  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isHomePage = request.nextUrl.pathname === '/home'
  
  const isHomeGroupPath = request.nextUrl.pathname.startsWith('/field-details/') || 
                          request.nextUrl.pathname.startsWith('/booking/')

  const userDataCookie = request.cookies.get('userData')
  let userData = null
  
  if (userDataCookie) {
    try {
      userData = JSON.parse(userDataCookie.value)
    } catch (error) {
      console.error('Lỗi khi parse userData:', error)
    }
  }

  if (isHomePage || isHomeGroupPath) {
    return NextResponse.next()
  }

  if (isAuthenticated && isAuthPage) {
    if (userData && userData.role) {
      switch (userData.role) {
        case 'ADMIN':
          return NextResponse.redirect(new URL('/admin/statistics', request.url))
        case 'OWNER':
          return NextResponse.redirect(new URL('/owner/court-stats', request.url))
        case 'CUSTOMER':
          return NextResponse.redirect(new URL('/customer/booking-history', request.url))
        default:
          return NextResponse.redirect(new URL('/home', request.url))
      }
    } else {
      return NextResponse.redirect(new URL('/home', request.url))
    }
  }

  if (!isAuthenticated && !isAuthPage && !isHomePage && !isHomeGroupPath) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  if (isAuthenticated && userData && userData.role) {
    if (request.nextUrl.pathname.startsWith('/admin') && userData.role !== 'ADMIN') {
      switch (userData.role) {
        case 'OWNER':
          return NextResponse.redirect(new URL('/owner/booking-management', request.url))
        case 'CUSTOMER':
          return NextResponse.redirect(new URL('/customer/booking-detail', request.url))
        default:
          return NextResponse.redirect(new URL('/home', request.url))
      }
    }

    if (request.nextUrl.pathname.startsWith('/owner') && 
        userData.role !== 'OWNER' && userData.role !== 'ADMIN') {
      if (userData.role === 'CUSTOMER') {
        return NextResponse.redirect(new URL('/customer/booking-detail', request.url))
      } else {
        return NextResponse.redirect(new URL('/home', request.url))
      }
    }

    if (request.nextUrl.pathname.startsWith('/customer') && 
        userData.role !== 'CUSTOMER' && userData.role !== 'ADMIN') {
      if (userData.role === 'OWNER') {
        return NextResponse.redirect(new URL('/owner/booking-management', request.url))
      } else {
        return NextResponse.redirect(new URL('/home', request.url))
      }
    }
  }

  return NextResponse.next()
}

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