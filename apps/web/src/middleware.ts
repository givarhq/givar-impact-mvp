import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('givar_token')?.value;
  const { pathname } = request.nextUrl;

  // 1. Protected Routes: /dashboard/*
  if (pathname.startsWith('/dashboard')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      // Optional: Add ?next=/dashboard to redirect back after login
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Auth Routes: /login, /signup (Redirect to dashboard if already logged in)
  if (pathname === '/login' || pathname === '/signup') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/signup'],
};