import { requireUser } from '@/lib/auth';
import ProjectsBrowser from '@/components/ProjectsBrowser';
import { refreshProjects } from './actions';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage({ searchParams }) {
  const { supabase } = await requireUser();
  const { data: projects } = await supabase.from('projects').select('*').order('name', { ascending: true });
  const { data: developers } = await supabase.from('developers').select('*').order('name', { ascending: true });

  // Merge Content Studio projects into the directory: a matching name gets a
  // 🎬 Scripts button on its existing card; unmatched ones get their own card.
  const { data: contentProjects } = await supabase
    .from('content_projects')
    .select('id, name, developer, area, facts, content_scripts(id, status)')
    .then((r) => r, () => ({ data: [] }));
  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const merged = [...(projects || [])];
  for (const cp of contentProjects || []) {
    const approved = (cp.content_scripts || []).filter((s) => s.status === 'approved').length;
    const extras = { content_id: cp.id, scripts_approved: approved };
    const hit = merged.find((p) => norm(p.name) === norm(cp.name));
    if (hit) Object.assign(hit, extras);
    else
      merged.push({
        id: 'content-' + cp.id,
        name: cp.name,
        developer: cp.developer,
        area: cp.area,
        status: 'Off-plan',
        price_text: cp.facts?.starting_price || null,
        handover: cp.facts?.handover || null,
        payment_plan: cp.facts?.payment_plan || null,
        ...extras,
      });
  }
  merged.sort((a, b) => String(a.name).localeCompare(String(b.name)));

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
      <ProjectsBrowser projects={merged} developers={developers || []} />
    </div>
  );
}
