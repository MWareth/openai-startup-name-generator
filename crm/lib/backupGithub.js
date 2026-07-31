// Commits a database snapshot to a GitHub repository.
//
// ⚠️ The snapshot contains every lead: names, phone numbers, email addresses and
// notes. The target MUST be a PRIVATE repository, and it must NOT be the repo
// the CRM's own code lives in. Git keeps history forever — a file committed by
// mistake stays in the history even after it's deleted, so getting this wrong
// once is not something you can quietly undo.
//
// Needs:
//   BACKUP_GITHUB_TOKEN   fine-grained PAT, Contents: read & write, that repo only
//   BACKUP_GITHUB_REPO    owner/repo, e.g. MWareth/bullish-crm-backups
//   BACKUP_GITHUB_BRANCH  optional, defaults to main
//   BACKUP_GITHUB_PATH    optional folder, defaults to snapshots

const API = 'https://api.github.com';

export function githubBackupConfigured() {
  return Boolean(process.env.BACKUP_GITHUB_TOKEN && process.env.BACKUP_GITHUB_REPO);
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

/**
 * Writes (or overwrites) one file in the backup repo.
 * @returns {Promise<{ok: boolean, error?: string, url?: string}>}
 */
export async function putSnapshotToGithub(filename, buffer) {
  const token = process.env.BACKUP_GITHUB_TOKEN;
  const repo = process.env.BACKUP_GITHUB_REPO;
  if (!token || !repo) return { ok: false, error: 'GitHub backup not configured.' };

  const branch = process.env.BACKUP_GITHUB_BRANCH || 'main';
  const folder = (process.env.BACKUP_GITHUB_PATH || 'snapshots').replace(/^\/|\/$/g, '');
  const path = folder ? `${folder}/${filename}` : filename;
  const base = `${API}/repos/${repo}/contents/${path}`;

  try {
    // Re-running on the same day updates that day's file rather than failing.
    let sha;
    const head = await fetch(`${base}?ref=${encodeURIComponent(branch)}`, { headers: headers(token) });
    if (head.ok) {
      const existing = await head.json();
      sha = existing?.sha;
    } else if (head.status !== 404) {
      const detail = await head.text();
      return { ok: false, error: `GitHub read failed (${head.status}): ${detail.slice(0, 200)}` };
    }

    const res = await fetch(base, {
      method: 'PUT',
      headers: headers(token),
      body: JSON.stringify({
        message: `CRM snapshot ${filename}`,
        content: Buffer.from(buffer).toString('base64'),
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      return { ok: false, error: `GitHub write failed (${res.status}): ${detail.slice(0, 200)}` };
    }
    const out = await res.json();
    return { ok: true, url: out?.content?.html_url };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}
