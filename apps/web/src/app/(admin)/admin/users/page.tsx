import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { Badge } from '../../../../components/ui/badge';
import { formatDate } from '../../../../lib/utils/format';
import { CheckCircle2, XCircle, Shield, User } from 'lucide-react';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;

  const resolvedParams = await searchParams;
  const page = resolvedParams?.page ? Number(resolvedParams.page) : 1;

  // Fetch users
  const result = await ApiService.admin.getUsers(token, page);
  // Robustly handle if result is array or object based on backend implementation
  const users = Array.isArray(result) ? result : (result as any)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between md:hidden">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                <th className="px-6 py-4 font-medium">User Identity</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Joined</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {users.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                            No users found.
                        </td>
                    </tr>
                ) : users.map((user: any) => (
                <tr key={user.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div>
                                <div className="font-semibold text-foreground">{user.firstName} {user.lastName}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">{user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                            {user.role === 'ADMIN' ? (
                                <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                                    <Shield className="h-3 w-3 mr-1" /> Admin
                                </Badge>
                            ) : (
                                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                                    <User className="h-3 w-3 mr-1" /> User
                                </Badge>
                            )}
                        </div>
                    </td>
                    <td className="px-6 py-4">
                        {user.emailVerified ? (
                            <div className="flex items-center text-emerald-500 text-xs font-medium">
                                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Verified
                            </div>
                        ) : (
                            <div className="flex items-center text-amber-500 text-xs font-medium">
                                <XCircle className="h-4 w-4 mr-1.5" /> Pending
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground text-xs">
                        {formatDate(user.createdAt)}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        
        {/* Simple Pagination Footer */}
        <div className="bg-muted/30 border-t border-border p-4 flex justify-center text-xs text-muted-foreground">
            {/* Future: Add full pagination controls reusing the Pagination component */}
            Showing page {page}
        </div>
      </div>
    </div>
  );
}