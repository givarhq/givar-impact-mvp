import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ApiService } from '../../../../../../services/api';
import { AdminProjectForm } from '../../../../../../components/features/admin/project-form';
import { Button } from '../../../../../../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function EditProjectPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('givar_token')?.value;

  if (!token) redirect('/login');

  try {
    const [project, categories] = await Promise.all([
      ApiService.admin.getProjectById(token, id),
      ApiService.projects.getCategories(token)
    ]);

    if (!project) notFound();

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <Link href="/admin/projects">
                    <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group">
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to Management
                    </Button>
                </Link>
                <h1 className="text-lg font-bold tracking-tight text-foreground">Edit Project</h1>
                <p className="text-sm text-muted-foreground font-mono">UUID: {id}</p>
            </div>
        </div>

        {/* Hydrate the form with existing data */}
        <AdminProjectForm 
          initialData={project} 
          categories={categories || []} 
        />
      </div>
    );
  } catch (error) {
    console.error("[EditProjectPage] Error:", error);
    notFound();
  }
}