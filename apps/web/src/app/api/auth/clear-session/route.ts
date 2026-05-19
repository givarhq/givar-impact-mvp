import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';

  // 1. Standard Authentication
  if (body.action === 'login' || body.action === 'signup') {
    cookieStore.set('givar_token', body.token, {
      httpOnly: false, // CRITICAL FIX: Allow client-side JS to read the token for cross-origin Axios calls
      secure: isProd,
      sameSite: 'lax',
      maxAge: 86400, // 24 hours
      path: '/'
    });
    cookieStore.set('givar_user', JSON.stringify(body.user), {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 86400,
      path: '/'
    });
  }

  // 2. Proxy Initiation (Admin Side)
  if (body.action === 'impersonate') {
    const currentToken = cookieStore.get('givar_token')?.value;
    const currentUser = cookieStore.get('givar_user')?.value;

    // Securely backup the true Admin session on the server
    if (currentToken) {
      cookieStore.set('givar_admin_backup_token', currentToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 mins timeout
        path: '/'
      });
    }
    if (currentUser) {
      cookieStore.set('givar_admin_backup_user', currentUser, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 15 * 60,
        path: '/'
      });
    }

    // Apply the restricted proxy session
    cookieStore.set('givar_token', body.token, {
      httpOnly: false, // CRITICAL FIX
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/'
    });
    cookieStore.set('givar_user', JSON.stringify(body.user), {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/'
    });
    cookieStore.set('givar_is_impersonating', 'true', {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/'
    });
    cookieStore.set('givar_impersonation_expiry', (Date.now() + 15 * 60 * 1000).toString(), {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/'
    });
  }

  // 3. Proxy Revocation (Admin Side)
  if (body.action === 'stop_impersonation') {
    const backupToken = cookieStore.get('givar_admin_backup_token')?.value;
    const backupUser = cookieStore.get('givar_admin_backup_user')?.value;

    // Restore Admin Session
    if (backupToken) {
      cookieStore.set('givar_token', backupToken, {
        httpOnly: false, // CRITICAL FIX
        secure: isProd,
        sameSite: 'lax',
        maxAge: 86400,
        path: '/'
      });
    } else {
      cookieStore.delete('givar_token');
    }

    if (backupUser) {
      cookieStore.set('givar_user', backupUser, {
        httpOnly: false,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 86400,
        path: '/'
      });
    } else {
      cookieStore.delete('givar_user');
    }

    // Clean up proxy context variables
    cookieStore.delete('givar_is_impersonating');
    cookieStore.delete('givar_impersonation_expiry');
    cookieStore.delete('givar_admin_backup_token');
    cookieStore.delete('givar_admin_backup_user');
  }

  return NextResponse.json({ success: true });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const url = new URL(request.url);
  const reason = url.searchParams.get('reason');

  // Logic: Securely purge all session data
  cookieStore.delete('givar_token');
  cookieStore.delete('givar_user');
  cookieStore.delete('givar_is_impersonating');
  cookieStore.delete('givar_impersonation_expiry');
  cookieStore.delete('givar_admin_backup_token');
  cookieStore.delete('givar_admin_backup_user');
  cookieStore.delete('givar_view_mode');

  return NextResponse.redirect(new URL(`/login?reason=${reason || 'logged_out'}`, request.url));
}