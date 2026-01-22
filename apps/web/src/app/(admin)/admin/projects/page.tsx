import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { SmartCurrency } from '../../../../components/ui/smart-currency';
import { Badge } from '../../../../components/ui/badge';
import { AdminProjectActions } from '../../../../components/features/admin/project-actions';

export default async function AdminProjectsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;

  const result = await ApiService.admin.getProjects(token, new URLSearchParams());
  const projects = Array.isArray(result) ? result : (result?.data || []);

  return (
    <div className="space-y-6">
      
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                <th className="px-6 py-4 font-medium">Project Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Financials</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {projects.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                            No projects found.
                        </td>
                    </tr>
                ) : projects.map((project: any) => (
                <tr key={project.id} className="hover:bg-muted/30 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="font-semibold text-foreground line-clamp-1">{project.title}</div>
                        <div className="text-xs text-muted-foreground mt-1 font-mono">{project.id.split('-')[0]}...</div>
                    </td>
                    <td className="px-6 py-4">
                        <Badge 
                            variant={project.status === 'ACTIVE' ? 'success' : 'secondary'} 
                            className="uppercase text-[10px] tracking-wider font-bold"
                        >
                            {project.status}
                        </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-foreground font-medium">
                                <SmartCurrency amount={project.raisedAmount} currency={project.currency} visible={true} size="small" className="text-sm" />
                            </span>
                            <span className="text-muted-foreground text-xs flex gap-1">
                                of <SmartCurrency amount={project.targetAmount} currency={project.currency} visible={true} size="small" className="text-xs" />
                            </span>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <AdminProjectActions id={project.id} status={project.status} />
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}