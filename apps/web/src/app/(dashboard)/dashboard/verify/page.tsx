import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { VerificationWizard } from '../../../../components/features/organization/verification-wizard';

export default async function VerificationPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) return null;

  // SOTA: Server-side fetching of current verification status
  const profile = await ApiService.organizations.getMe(token);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      {/* Background Decorative Element */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-square bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full">
        <VerificationWizard initialProfile={profile} />
      </div>
    </div>
  );
}