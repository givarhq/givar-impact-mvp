import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ApiService } from '../../../../../../services/api';
import { AdminProjectForm } from '../../../../../../components/features/admin/project-form';
import { MilestoneManager } from '../../../../../../components/features/admin/milestone-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../../../components/ui/tabs';
import { Button } from '../../../../../../components/ui/button';
import { ArrowLeft, Settings, Activity, Wallet, Fingerprint, Sparkles, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { DisbursementForm } from '../../../../../../components/features/admin/disbursement-form';
import { ProjectVisibilityForm } from '../../../../../../components/features/admin/visibility/project-visibility-form';
import { FeedbackThread } from '../../../../../../components/features/communication/feedback-thread';

export const metadata = {
  title: 'Edit Project',
  description: 'Manage project details, disbursements, and discovery visibility.',
};

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
    const [project, categories, globalConfig] = await Promise.all([
      ApiService.admin.getProjectById(token, id),
      ApiService.projects.getCategories(token),
      ApiService.admin.getConfig(token)
    ]);

    if (!project) notFound();

    return (
      <div className="w-full min-w-0 space-y-4 md:space-y-6 animate-in fade-in duration-500 pb-20">

        <div className="flex flex-col gap-4 px-1 min-w-0">
          <Link href="/admin/projects" className="w-fit">
            <Button variant="ghost" size="sm" className="pl-0 text-muted-foreground hover:text-foreground group rounded-3xl">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to management
            </Button>
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-w-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-foreground md:hidden truncate">
                {project.title}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-3xl bg-muted border border-border/40 text-[11px] font-mono text-muted-foreground shrink-0">
                  <Fingerprint className="h-3 w-3" />
                  {id}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="details" className="w-full space-y-8 min-w-0">
          <div className="border-b border-border/40 pb-1 overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent h-12 w-full justify-start gap-8 p-0 border-none shadow-none rounded-none">
              <TabsTrigger
                value="details"
                className="relative h-12 rounded-none border-b-2 border-transparent px-2 pb-4 pt-2 font-bold text-xs text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all"
              >
                <Settings className="mr-2 h-3.5 w-3.5" /> Project Details
              </TabsTrigger>

              <TabsTrigger
                value="disbursements"
                className="relative h-12 rounded-none border-b-2 border-transparent px-2 pb-4 pt-2 font-bold text-xs text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all"
              >
                <Wallet className="mr-2 h-3.5 w-3.5" /> Disbursements
              </TabsTrigger>

              <TabsTrigger
                value="execution"
                className="relative h-12 rounded-none border-b-2 border-transparent px-2 pb-4 pt-2 font-bold text-xs text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all"
              >
                <Activity className="mr-2 h-3.5 w-3.5" /> Execution
              </TabsTrigger>

              <TabsTrigger
                value="discovery"
                className="relative h-12 rounded-none border-b-2 border-transparent px-2 pb-4 pt-2 font-bold text-xs text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all"
              >
                <Sparkles className="mr-2 h-3.5 w-3.5" /> Discovery
              </TabsTrigger>

              <TabsTrigger
                value="communication"
                className="relative h-12 rounded-none border-b-2 border-transparent px-2 pb-4 pt-2 font-bold text-xs text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none transition-all"
              >
                <MessageSquare className="mr-2 h-3.5 w-3.5" /> Communication
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="w-full min-w-0">
            <TabsContent value="details" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AdminProjectForm initialData={project} categories={categories || []} />
            </TabsContent>

            <TabsContent value="disbursements" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="max-w-4xl min-w-0">
                <DisbursementForm
                  projectId={id}
                  timeline={project.executionTimeline || []}
                  disbursements={project.disbursements || []}
                />
              </div>
            </TabsContent>

            <TabsContent value="execution" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="max-w-4xl min-w-0">
                <MilestoneManager
                  projectId={id}
                  timeline={project.executionTimeline || []}
                  projectStatus={project.status}
                  waitlistCount={project.waitlistEmails?.length || 0}
                />
              </div>
            </TabsContent>

            <TabsContent value="discovery" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ProjectVisibilityForm
                project={project}
                globalConfig={globalConfig}
              />
            </TabsContent>

            <TabsContent value="communication" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="max-w-4xl min-w-0">
                <FeedbackThread
                  projectId={id}
                  title="Direct line with owner"
                />
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    );
  } catch (error) {
    notFound();
  }
}