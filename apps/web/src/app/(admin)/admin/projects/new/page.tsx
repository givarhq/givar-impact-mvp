import { cookies } from 'next/headers';
import { ApiService } from '../../../../../services/api';
import { AdminProjectForm } from '../../../../../components/features/admin/project-form';

export default async function NewProjectPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;

  const categories = await ApiService.projects.getCategories(token);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-foreground">Create New Project</h1>
      <AdminProjectForm categories={categories || []} />
    </div>
  );
}