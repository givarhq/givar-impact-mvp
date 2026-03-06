import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('givar_token')?.value;
  const userCookie = request.cookies.get('givar_user')?.value;
  const viewMode = request.cookies.get('givar_view_mode')?.value;
  const isImpersonating = request.cookies.get('givar_is_impersonating')?.value === 'true';

  const { pathname } = request.nextUrl;

  // Logic: Only redirect from these specific entry points if authenticated.
  // This allows authenticated users to browse /about, /explore, /legal, etc.
  const authRedirectPaths = ['/', '/login', '/signup'];
  const isAuthRedirectPath = authRedirectPaths.includes(pathname);

  // 1. Authenticated Logic
  if (token) {
    let userRole = 'USER';
    if (userCookie) {
      try {
        const user = JSON.parse(decodeURIComponent(userCookie));
        userRole = user.role;
      } catch (e) { /* ignore malformed */ }
    }

    // Logic: Respect viewMode for both ADMIN and SUPERADMIN roles.
    const shouldBeInAdminEnv =
      (userRole === 'ADMIN' || userRole === 'SUPERADMIN') &&
      viewMode !== 'USER' &&
      !isImpersonating;

    // Redirect away from guest entry pages to the respective dashboard
    if (isAuthRedirectPath) {
      const target = shouldBeInAdminEnv ? '/admin' : '/dashboard';
      return NextResponse.redirect(new URL(target, request.url));
    }

    // Forced context switching for Admin vs Giver perspectives
    if (pathname.startsWith('/dashboard') && shouldBeInAdminEnv) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    if (pathname.startsWith('/admin') && !shouldBeInAdminEnv) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 2. Unauthenticated Logic
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
  // Logic: Exclude all static assets and API routes from middleware processing to minimize TTFB
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};