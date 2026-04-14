import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('givar_token')?.value;
  const userCookie = request.cookies.get('givar_user')?.value;
  const viewMode = request.cookies.get('givar_view_mode')?.value;
  const isImpersonating = request.cookies.get('givar_is_impersonating')?.value === 'true';

  const { pathname } = request.nextUrl;

  const authRedirectPaths = ['/', '/login', '/signup'];
  const isAuthRedirectPath = authRedirectPaths.includes(pathname);

  if (token) {
    let userRole = 'USER';
    if (userCookie) {
      try {
        const user = JSON.parse(decodeURIComponent(userCookie));
        userRole = user.role;
      } catch (e) { /* ignore malformed */ }
    }

    const shouldBeInAdminEnv =
      (userRole === 'ADMIN' || userRole === 'SUPERADMIN') &&
      viewMode !== 'USER' &&
      !isImpersonating;

    if (isAuthRedirectPath) {
      const target = shouldBeInAdminEnv ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }

    // --- Perspective Redirection ---
    // If an authenticated user hits a public cause or record path, move them to the dashboard equivalent
    // to ensure the shell layout and props (like isPublic) are correctly synchronized.
    if (!shouldBeInAdminEnv) {
      if (pathname.startsWith('/explore')) {
        const dashboardPath = pathname.replace('/explore', '/dashboard/impact');
        return NextResponse.redirect(new URL(dashboardPath, request.url));
      }
      if (pathname === '/records') {
        return NextResponse.redirect(new URL('/dashboard/history', request.url));
      }
    }

    if (pathname.startsWith('/dashboard') && shouldBeInAdminEnv) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    if (pathname.startsWith('/admin') && !shouldBeInAdminEnv) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (!token) {
    const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
    if (isProtectedRoute) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};