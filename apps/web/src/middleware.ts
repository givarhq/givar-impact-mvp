import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function applySecurityHeaders(response: NextResponse) {
  const isDev = process.env.NODE_ENV === 'development';

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'",
    isDev && "'unsafe-eval'",
    "https://js.paystack.co",
    "https://*.i.posthog.com",
  ]
    .filter(Boolean)
    .join(' ');

  let apiOrigin = 'http://localhost:3001';
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_API_URL);
      apiOrigin = url.origin;
    } catch {
      apiOrigin = process.env.NEXT_PUBLIC_API_URL;
    }
  }

  const cspHeader = `
    default-src 'self';
    script-src ${scriptSrc};
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://images.unsplash.com https://res.cloudinary.com https://*.idrivee2-pt.com https://*.idrivee2.com;
    media-src 'self' blob: data: https://*.idrivee2-pt.com https://*.idrivee2.com https://res.cloudinary.com;
    font-src 'self' data:;
    connect-src 'self'
      https://api.paystack.co
      https://api.cloudinary.com
      https://open.er-api.com
      https://*.i.posthog.com
      https://*.idrivee2-pt.com
      https://*.idrivee2.com
      https://freeipapi.com
      https://ipapi.co
      https://ipwho.is
      ${apiOrigin};
    frame-src 'self' https://js.paystack.co https://checkout.paystack.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    worker-src 'self' blob:;
  `
    .replace(/\s{2,}/g, ' ')
    .trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );

  return response;
}

function redirect(request: NextRequest, path: string) {
  return applySecurityHeaders(
    NextResponse.redirect(new URL(path, request.url))
  );
}

function next() {
  return applySecurityHeaders(NextResponse.next());
}

function getUserRole(userCookie?: string): string {
  if (!userCookie) return 'USER';

  try {
    const user = JSON.parse(decodeURIComponent(userCookie));
    return user?.role || 'USER';
  } catch {
    return 'USER';
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('givar_token')?.value;
  const userCookie = request.cookies.get('givar_user')?.value;
  const viewMode = request.cookies.get('givar_view_mode')?.value;
  const isImpersonating =
    request.cookies.get('givar_is_impersonating')?.value === 'true';

  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname === '/' || pathname === '/login' || pathname === '/signup';

  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(
    getUserRole(userCookie)
  );

  const shouldBeInAdminEnv =
    isAdmin && viewMode !== 'USER' && !isImpersonating;

  if (token) {
    if (isAuthPage) {
      return redirect(
        request,
        shouldBeInAdminEnv ? '/admin' : '/dashboard'
      );
    }

    if (!shouldBeInAdminEnv) {
      if (pathname.startsWith('/explore')) {
        return redirect(
          request,
          pathname.replace('/explore', '/dashboard/impact')
        );
      }

      if (pathname === '/records') {
        return redirect(request, '/dashboard/history');
      }
    }

    if (pathname.startsWith('/dashboard') && shouldBeInAdminEnv) {
      return redirect(request, '/admin');
    }

    if (pathname.startsWith('/admin') && !shouldBeInAdminEnv) {
      return redirect(request, '/dashboard');
    }

    return next();
  }

  const protectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin');

  if (protectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);

    return applySecurityHeaders(
      NextResponse.redirect(loginUrl)
    );
  }

  return next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif)$).*)',
  ],
};