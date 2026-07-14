import Link from 'next/link';
import { requireUser, canRouteLeads } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { contentReady } from '@/lib/content';
import BrochureForm from '@/components/BrochureForm';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // brochure reads can take a while

export default async function ContentStudioPage({ searchParams }) {
  const { profile, supabase } = await requireUser();
  const isCreator = canRouteLeads(profile); // admin + support + marketing
  const ok = searchParams?.ok;
  const error = searchParams?.error;
  const ready = contentReady();

  const { data: projects } = await supabase
    .from('content_projects')
    .select('id, name, developer, area, created_at, creator:profiles!content_projects_created_by_fkey(full_name), content_scripts(id, language, status)')
    .order('created_at', { ascending: false });

  // Agents only care about projects that have at least one approved script.
  const visible = isCreator
    ? projects || []
    : (projects || []).filter((p) => (p.content_scripts || []).some((s) => s.status === 'approved'));

  return (
    <div className="stack">
      <div className="spread" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1>🎬 Content Studio</h1>
          <p className="muted">
            Upload a project brochure or renders — get a ready-to-film agent script, in any language.
            {isCreator ? ' Scripts start as drafts; approve them to publish to the agents.' : ' These scripts are approved by management — pick one and film.'}
          </p>
        </div>
        <Link className="btn secondary small" href="/content/videos">🎥 Videos →</Link>
      </div>
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      {isCreator && !ready ? (
        <div className="card" style={{ borderColor: 'var(--gold)' }}>
          <h3 style={{ marginTop: 0 }}>One-time setup needed</h3>
          <p className="small">
            The script writer needs an Anthropic API key. Get one at <strong>console.anthropic.com</strong> → API Keys,
            then in <strong>Vercel → Settings → Environment Variables</strong> add <code>ANTHROPIC_API_KEY</code> and redeploy.
            Each brochure costs roughly AED 1–2 to process; extra scripts a few fils each.
          </p>
        </div>
      ) : null}

      {isCreator ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>New project script</h3>
          <BrochureForm existingProjects={(projects || []).map((p) => ({ id: p.id, name: p.name }))} />
        </div>
      ) : null}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Project</th><th>Developer</th><th>Area</th><th>Scripts</th><th>By</th><th>Added</th></tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const scripts = p.content_scripts || [];
              const approved = scripts.filter((s) => s.status === 'approved').length;
              const langs = [...new Set(scripts.map((s) => s.language))].join(', ');
              return (
                <tr key={p.id}>
                  <td><Link href={`/content/${p.id}`}><strong>{p.name}</strong></Link></td>
                  <td className="small muted">{p.developer || '—'}</td>
                  <td className="small muted">{p.area || '—'}</td>
                  <td className="small">
                    {approved}/{scripts.length} approved{langs ? <span className="muted"> · {langs}</span> : null}
                  </td>
                  <td className="small muted">{p.creator?.full_name || '—'}</td>
                  <td className="small muted">{formatDate(p.created_at)}</td>
                </tr>
              );
            })}
            {visible.length === 0 ? (
              <tr><td colSpan={6} className="muted" style={{ padding: 16 }}>
                {isCreator ? 'No projects yet — upload your first brochure above.' : 'No approved scripts yet — check back soon.'}
              </td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
