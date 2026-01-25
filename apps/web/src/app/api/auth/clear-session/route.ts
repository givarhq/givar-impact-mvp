import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function GET() {
  const cookieStore = await cookies();
  
  // Clear every single auth-related cookie
  cookieStore.delete('givar_token');
  cookieStore.delete('givar_refresh_token');
  cookieStore.delete('givar_user');
  
  redirect('/login?reason=session_expired');
}