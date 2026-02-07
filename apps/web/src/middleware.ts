import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('givar_token')?.value;
  const userCookie = request.cookies.get('givar_user')?.value;
  const viewMode = request.cookies.get('givar_view_mode')?.value;
  const isImpersonating = request.cookies.get('givar_is_impersonating')?.value === 'true';

  const { pathname } = request.nextUrl;

  // Public vs. Protected Routes
  const publicPaths = ['/', '/login', '/signup', '/about'];
  const isPublicPath = publicPaths.includes(pathname);

  // 1. If user is logged in...
  if (token) {
    // Determine the "Home" base based on role and view state
    let userRole = 'USER';
    try {
      if (userCookie) {
        const user = JSON.parse(decodeURIComponent(userCookie));
        userRole = user.role;
      }
    } catch (e) {
      // Fallback to user if cookie is mangled
    }

    const isAdminInAdminMode = userRole === 'ADMIN' && viewMode !== 'USER' && !isImpersonating;

    // ...and they are on a public page, redirect to their respective primary dashboard.
    if (isPublicPath) {
      const target = isAdminInAdminMode ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }

    // Protect /admin routes from non-admins
    if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 2. If user is NOT logged in...
  if (!token) {
    // ...and they are trying to access a protected page, redirect to login.
    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
    if (isProtectedRoute) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/signup', '/about', '/dashboard/:path*', '/admin/:path*', '/explore/:path*'],
};