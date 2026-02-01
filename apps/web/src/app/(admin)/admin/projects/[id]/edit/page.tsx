import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ApiService } from '../../../../../../services/api';
import { AdminProjectForm } from '../../../../../../components/features/admin/project-form';
import { MilestoneManager } from '../../../../../../components/features/admin/milestone-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../../components/ui/tabs';
import { Button } from '../../../../../../components/ui/button';
import { ArrowLeft, Settings, Activity, Wallet } from 'lucide-react';
import Link from 'next/link';
import { DisbursementForm } from '../../../../../../components/features/admin/disbursement-form';

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
              <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Management
              </Button>
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-foreground md:hidden">Edit Project</h1>
            <p className="text-xs text-muted-foreground font-mono opacity-60">UUID: {id}</p>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full space-y-8">
          <div className="border-b border-border/50 pb-1">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-8 p-0">
              <TabsTrigger
                value="details"
                className="relative h-12 rounded-none border-b-2 border-transparent px-2 pb-4 pt-2 font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Settings className="mr-2 h-4 w-4" /> Project Details
              </TabsTrigger>
              <TabsTrigger
                value="execution"
                className="relative h-12 rounded-none border-b-2 border-transparent px-2 pb-4 pt-2 font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Activity className="mr-2 h-4 w-4" /> Execution & Milestones
              </TabsTrigger>
              <TabsTrigger
                value="disbursements"
                className="relative h-12 rounded-none border-b-2 border-transparent px-2 pb-4 pt-2 font-semibold text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Wallet className="mr-2 h-4 w-4" /> Disbursements
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="mt-0 border-none p-0 outline-none">
            <AdminProjectForm
              initialData={project}
              categories={categories || []}
            />
          </TabsContent>

          <TabsContent value="execution" className="mt-0 border-none p-0 outline-none">
            <div className="max-w-4xl mx-auto">
              <MilestoneManager
                projectId={id}
                timeline={project.executionTimeline || []}
              />
            </div>
          </TabsContent>

          <TabsContent value="disbursements" className="mt-0 border-none p-0 outline-none">
            <div className="max-w-4xl mx-auto">
              <DisbursementForm
                projectId={id}
                timeline={project.executionTimeline || []}
                disbursements={project.disbursements || []}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  } catch (error) {
    console.error("[EditProjectPage] Error:", error);
    notFound();
  }
}