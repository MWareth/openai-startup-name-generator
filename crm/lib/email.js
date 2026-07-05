// Transactional email via Resend's REST API (no npm dependency — plain fetch,
// which is safe on Vercel). If RESEND_API_KEY isn't set the send is skipped, so
// the app keeps working before email is configured. Never throws.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

// Base URL for building absolute links in emails (buttons must not be relative).
export function appUrl(path = '') {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://bullish-crm.vercel.app').replace(/\/$/, '');
  if (!path) return base;
  return base + (path.startsWith('/') ? path : '/' + path);
}

// Low-level send. to: string | string[]. Returns true on success.
export async function sendEmail({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to || !subject) return false;
  const from = process.env.EMAIL_FROM || 'Bridges & Allies <alerts@bridgesandalliesre.com>';
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: Array.isArray(to) ? to : [to], subject, html, text }),
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

// Branded HTML wrapper for a simple notification email: a heading, a line of
// body text, and an optional call-to-action button.
export function notificationEmail({ title, body, link, cta = 'Open the CRM' }) {
  const url = link ? appUrl(link) : appUrl('/dashboard');
  const safe = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const button = `
    <a href="${url}" style="display:inline-block;background:#0f1b2d;color:#ffffff;text-decoration:none;
       padding:11px 22px;border-radius:8px;font-weight:600;font-size:15px">${safe(cta)}</a>`;
  const html = `
  <div style="background:#f4f5f7;padding:28px 0;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e6e8ec;border-radius:14px;overflow:hidden">
      <div style="background:#0f1b2d;padding:16px 24px">
        <span style="color:#c2a14d;font-weight:700;font-size:15px;letter-spacing:.02em">Bridges &amp; Allies CRM</span>
      </div>
      <div style="padding:24px">
        <h1 style="margin:0 0 8px;font-size:18px;color:#16223b;line-height:1.3">${safe(title)}</h1>
        ${body ? `<p style="margin:0 0 20px;color:#4a5568;font-size:15px;line-height:1.5">${safe(body)}</p>` : ''}
        ${button}
      </div>
      <div style="padding:14px 24px;border-top:1px solid #eef0f3;color:#9aa4b2;font-size:12px">
        You're receiving this because you're a member of the Bridges &amp; Allies CRM.
      </div>
    </div>
  </div>`;
  const plain = `${title}\n\n${body || ''}\n\n${cta}: ${url}`;
  return { html, text: plain };
}
