import { cookies } from 'next/headers';
import { ApiService } from '../../../../../services/api';
import { AdminProjectForm } from '../../../../../components/features/admin/project-form';
import { Button } from '../../../../../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Create new project',
  description: 'Initialize a new impact cause on the Givar platform.',
};

export default async function NewProjectPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;
  if (!token) return null;

  const categories = await ApiService.projects.getCategories(token);

  return (
    <div className="w-full min-w-0 space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header and Navigation */}
      <div className="flex flex-col gap-4 px-1 min-w-0">
        <Link href="/admin/projects" className="w-fit">
          <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-3xl">
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to management
          </Button>
        </Link>

        <div className="md:hidden">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Create new project</h1>
        </div>
      </div>

      <div className="w-full min-w-0">
        <AdminProjectForm categories={categories || []} />
      </div>
    </div>
  );
}