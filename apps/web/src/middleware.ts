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

    // Fixed logic: Respect viewMode for both ADMIN and SUPERADMIN roles.
    // This allows elevated accounts to use the "Giver Mode" perspective.
    const shouldBeInAdminEnv =
      (userRole === 'ADMIN' || userRole === 'SUPERADMIN') &&
      viewMode !== 'USER' &&
      !isImpersonating;

    // If an admin-level user is on a public page, redirect them to their home panel.
    if (isPublicPath) {
      const target = shouldBeInAdminEnv ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }

    // If an admin-level user tries to access the user dashboard while in Admin Mode, force them to Admin.
    if (pathname.startsWith('/dashboard') && shouldBeInAdminEnv) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // If any user tries to access an admin route while in User Mode or without permissions, redirect to dashboard.
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
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};