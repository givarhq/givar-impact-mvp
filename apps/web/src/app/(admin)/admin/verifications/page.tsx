import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { VerificationReviewRow } from '../../../../components/features/admin/verification-review-row';
import { Inbox, ShieldCheck } from 'lucide-react';

export default async function AdminVerificationQueuePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) return null;

  const pending = (await ApiService.organizations.getPending(token)) || [];

  return (
    <div className="space-y-8 pb-10">
      <div className="md:hidden flex flex-col gap-1 mb-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Verifications</h1>
        <p className="text-sm text-muted-foreground">Review organization KYC submissions.</p>
      </div>

      <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl flex items-start gap-4">
          <ShieldCheck className="h-6 w-6 text-primary shrink-0" />
          <div className="space-y-1">
              <h4 className="text-sm font-bold text-primary uppercase tracking-wider">KYC Verification Protocol</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                  Review legal documents carefully. Verifying an organization grants them high-trust status on the platform, allowing for direct-to-vendor payments.
              </p>
          </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-muted/40 text-muted-foreground border-b border-border">
                    <tr>
                        <th className="px-6 py-4 font-semibold uppercase tracking-tighter text-[11px]">Organization</th>
                        <th className="px-6 py-4 font-semibold uppercase tracking-tighter text-[11px]">Proposer</th>
                        <th className="px-6 py-4 font-semibold uppercase tracking-tighter text-[11px]">Documents</th>
                        <th className="px-6 py-4"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border">
                    {pending.length === 0 ? (
                        <tr>
                            <td colSpan={4} className="px-6 py-20 text-center text-muted-foreground font-medium">
                                <Inbox className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                No pending verifications.
                            </td>
                        </tr>
                    ) : (
                        pending.map((profile: any) => (
                            <VerificationReviewRow key={profile.id} profile={profile} />
                        ))
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}