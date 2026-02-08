import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('givar_token')?.value;
  const userCookie = request.cookies.get('givar_user')?.value;
  const viewMode = request.cookies.get('givar_view_mode')?.value;
  const isImpersonating = request.cookies.get('givar_is_impersonating')?.value === 'true';

  const { pathname } = request.nextUrl;

  const publicPaths = ['/', '/login', '/signup', '/about', '/explore'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path) && (path === '/' ? pathname.length === 1 : true));

  // 1. If user is logged in...
  if (token) {
    let userRole = 'USER';
    try {
      if (userCookie) {
        // Decode to handle potentially URI encoded cookies
        const user = JSON.parse(decodeURIComponent(userCookie));
        userRole = user.role;
      }
    } catch (e) {
      // Fallback if cookie is malformed
    }

    // Determine if the user belongs in the admin environment.
    // SUPERADMIN is always true. ADMIN depends on view mode and impersonation status.
    const shouldBeInAdminEnv =
      userRole === 'SUPERADMIN' ||
      (userRole === 'ADMIN' && viewMode !== 'USER' && !isImpersonating);

    // If an admin-level user is on a public page, redirect them to their home panel.
    if (isPublicPath) {
      const target = shouldBeInAdminEnv ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }

    // If an admin-level user tries to access the user dashboard, force them back to the admin panel.
    if (pathname.startsWith('/dashboard') && shouldBeInAdminEnv) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // If a non-admin user tries to access any admin route, send them to their dashboard.
    if (pathname.startsWith('/admin') && !shouldBeInAdminEnv) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 2. If user is NOT logged in...
  if (!token) {
    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
    if (isProtectedRoute) {
      // Redirect to login, but remember where they were trying to go.
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Apply middleware to all routes except for API calls, static files, and image optimization.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};