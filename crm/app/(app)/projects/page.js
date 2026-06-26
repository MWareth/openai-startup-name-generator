import { requireUser } from '@/lib/auth';
import ProjectsBrowser from '@/components/ProjectsBrowser';
import { refreshProjects } from './actions';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({ searchParams }) {
  const { supabase } = await requireUser();
  const { data: projects } = await supabase.from('projects').select('*').order('name', { ascending: true });
  const { data: developers } = await supabase.from('developers').select('*').order('name', { ascending: true });

  return (
    <div className="stack">
      {searchParams?.ok ? <div className="alert ok">{searchParams.ok}</div> : null}
      {searchParams?.error ? <div className="alert error">{searchParams.error}</div> : null}
      <div className="spread">
        <div>
          <h1>Projects directory</h1>
          <p className="muted">Off-plan projects and developer profiles — browse, filter, and share with clients.</p>
        </div>
        <form action={refreshProjects}>
          <button className="btn secondary small" type="submit">⟳ Refresh</button>
        </form>
      </div>
      <ProjectsBrowser projects={projects || []} developers={developers || []} />
    </div>
  );
}
