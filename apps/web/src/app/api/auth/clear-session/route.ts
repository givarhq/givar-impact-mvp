import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const url = new URL(request.url);

  // 1. Define all Givar-related keys to prevent "Ghost Sessions"
  const cookiesToClear = [
    'givar_token',
    'givar_refresh_token',
    'givar_user',
    'givar_view_mode',
    'givar_is_impersonating',
    'givar_admin_backup_token',
    'givar_admin_backup_user'
  ];

  // 2. Atomic Purge
  cookiesToClear.forEach(cookieName => {
    cookieStore.delete(cookieName);
  });

  // 3. Construct absolute redirect URL
  const loginUrl = new URL('/login', url.origin);
  loginUrl.searchParams.set('reason', 'session_expired');

  // 4. Return explicit redirect response (Prevents blank page in Route Handlers)
  return NextResponse.redirect(loginUrl.toString());
}