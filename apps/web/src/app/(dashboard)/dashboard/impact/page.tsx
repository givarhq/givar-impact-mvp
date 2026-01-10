import { cookies } from 'next/headers';
import { ImpactFeed } from '../../../../components/features/impact/impact-feed';
import { Project } from '../../../../types';

async function getProjects(): Promise<Project[]> {
  const cookieStore = cookies();
  const token = cookieStore.get('givar_token')?.value;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { tags: ['projects'], revalidate: 0 }, 
    });

    if (!res.ok) throw new Error('Failed to fetch projects');
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    return [];
  }
}

export default async function ImpactPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      
      {/* 
        Page Title
        - Visible on Mobile
        - Hidden on Desktop
      */}
      <div className="md:hidden flex flex-col gap-1 mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Make an Impact</h1>
        <p className="text-sm text-muted-foreground">
          Browse active causes and contribute directly from your wallet.
        </p>
      </div>

      <ImpactFeed projects={projects} />
    </div>
  );
}