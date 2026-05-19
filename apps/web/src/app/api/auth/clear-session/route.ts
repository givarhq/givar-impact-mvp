import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const url = new URL(request.url);
  const reason = url.searchParams.get('reason') || 'session_expired';

  const cookiesToClear = [
    'givar_token',
    'givar_user',
    'givar_view_mode',
    'givar_is_impersonating',
    'givar_admin_backup_token',
    'givar_admin_backup_user',
    'givar_impersonation_expiry'
  ];

  // Hard clear all active session keys securely on the server
  for (const cookieName of cookiesToClear) {
    cookieStore.set(cookieName, '', {
      path: '/',
      expires: new Date(0),
      maxAge: 0
    });
  }

  const loginUrl = new URL('/login', url.origin);

  if (reason === 'account_deleted') {
    loginUrl.searchParams.set('deleted', 'true');
  } else if (reason === 'logged_out') {
    loginUrl.searchParams.set('loggedOut', 'true');
  } else {
    loginUrl.searchParams.set('reason', reason);
  }

  return NextResponse.redirect(loginUrl.toString());
}