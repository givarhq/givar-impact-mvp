import { cookies } from 'next/headers';
import { ApiService } from '../../../../services/api';
import { SmartCurrency } from '../../../../components/ui/smart-currency';
import { Badge } from '../../../../components/ui/badge';
import { AdminProjectActions } from '../../../../components/features/admin/project-actions'; // Correct import

export default async function AdminProjectsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;

  // Assuming ApiService.admin.getProjects points to the correct backend endpoint 
  // that returns all projects (including hidden ones)
  const result = await ApiService.admin.getProjects(token, new URLSearchParams());
  // Handle case where result might be { data: [], meta: {} } or just [] depending on your service implementation
  const projects = Array.isArray(result) ? result : (result?.data || []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-white">Project Management</h1>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
            <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800">
                <tr>
                <th className="px-6 py-4 font-medium">Project Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Financials</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 text-zinc-300">
                {projects.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-zinc-500">
                            No projects found.
                        </td>
                    </tr>
                ) : projects.map((project: any) => (
                <tr key={project.id} className="hover:bg-zinc-800/50 transition-colors group">
                    <td className="px-6 py-4">
                        <div className="font-medium text-white line-clamp-1">{project.title}</div>
                        <div className="text-xs text-zinc-500 mt-1 font-mono">{project.id.split('-')[0]}...</div>
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
                            <span className="text-white font-medium">
                                <SmartCurrency amount={project.raisedAmount} currency={project.currency} visible={true} size="default" className="text-sm" />
                            </span>
                            <span className="text-zinc-500 text-xs flex gap-1">
                                of <SmartCurrency amount={project.targetAmount} currency={project.currency} visible={true} size="default" className="text-xs" />
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