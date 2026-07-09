// Transactional email sent through a normal mailbox over SMTP (e.g. the owner's
// Google Workspace account with an app password) — no domain/DNS setup needed.
// If SMTP_USER / SMTP_PASS aren't set the send is skipped, so the app keeps
// working before email is configured. Never throws.

import nodemailer from 'nodemailer';

// Base URL for building absolute links in emails (buttons must not be relative).
export function appUrl(path = '') {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://bullish-crm.vercel.app').replace(/\/$/, '');
  if (!path) return base;
  return base + (path.startsWith('/') ? path : '/' + path);
}

// Reused SMTP transport (cached across invocations). Null until creds are set.
let transporter = null;
function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    const secure = port === 465; // 465 = SSL; 587 = STARTTLS (Microsoft 365, etc.)
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure,
      requireTLS: !secure, // force STARTTLS on 587 (required by Office 365)
      auth: { user, pass },
    });
  }
  return transporter;
}

// Low-level send. to: string | string[]. Returns true on success.
export async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t || !to || !subject) return false;
  // Gmail/Workspace requires From to match the authenticated user (or an alias),
  // so default the From address to the SMTP account.
  const from = process.env.EMAIL_FROM || `Bridges & Allies <${process.env.SMTP_USER}>`;
  try {
    await t.sendMail({ from, to: Array.isArray(to) ? to.join(', ') : to, subject, html, text });
    return true;
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
