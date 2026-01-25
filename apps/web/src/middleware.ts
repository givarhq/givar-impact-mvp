import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('givar_token')?.value;
  const { pathname } = request.nextUrl;

  // Public vs. Protected Routes
  const publicPaths = ['/', '/login', '/signup'];
  const isPublicPath = publicPaths.includes(pathname);

  // 1. If user is logged in...
  if (token) {
    // ...and they are on a public page (like landing, login), redirect to dashboard.
    if (isPublicPath) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // 2. If user is NOT logged in...
  if (!token) {
    // ...and they are trying to access a protected page, redirect to login.
    if (!isPublicPath && pathname.startsWith('/dashboard')) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Otherwise, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/signup', '/dashboard/:path*', '/explore/:path*'],
};