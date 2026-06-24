import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const { supabase } = await requireUser();
  const { data: embeds } = await supabase
    .from('data_embeds')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  return (
    <div className="stack">
      <div>
        <h1>Projects directory</h1>
        <p className="muted">
          Off-plan projects, developers &amp; market data — live from Dubai Land Department open data.
        </p>
      </div>

      {embeds && embeds.length ? (
        embeds.map((e) => (
          <div key={e.id} className="card">
            <h3>{e.title}</h3>
            <iframe
              src={e.embed_url}
              width="100%"
              height={e.height || 900}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title={e.title}
              style={{ border: '1px solid var(--border)', borderRadius: 8, background: '#fff' }}
            />
          </div>
        ))
      ) : (
        <div className="card muted">
          No data sources yet. An admin can add Dubai open-data embeds from the Admin page.
        </div>
      )}
    </div>
  );
}
