import { requireUser } from '@/lib/auth';
import ProjectsBrowser from '@/components/ProjectsBrowser';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const { supabase } = await requireUser();
  const { data: projects } = await supabase.from('projects').select('*').order('name', { ascending: true });
  const { data: developers } = await supabase.from('developers').select('*').order('name', { ascending: true });

  return (
    <div className="stack">
      <div>
        <h1>Projects directory</h1>
        <p className="muted">Off-plan projects and developer profiles — browse, filter, and share with clients.</p>
      </div>
      <ProjectsBrowser projects={projects || []} developers={developers || []} />
    </div>
  );
}
