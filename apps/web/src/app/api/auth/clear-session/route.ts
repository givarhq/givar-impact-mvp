import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const url = new URL(request.url);

  const cookiesToClear = [
    'givar_token',
    'givar_user',
    'givar_view_mode',
    'givar_is_impersonating',
    'givar_admin_backup_token',
    'givar_admin_backup_user'
  ];

  // Hard clear all active session keys
  for (const cookieName of cookiesToClear) {
    cookieStore.set(cookieName, '', {
      path: '/',
      expires: new Date(0),
      maxAge: 0
    });
  }

  const loginUrl = new URL('/login', url.origin);
  loginUrl.searchParams.set('reason', 'session_expired');

  return NextResponse.redirect(loginUrl.toString());
}