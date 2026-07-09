'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { logMessage } from '@/app/(app)/leads/actions';

// Buttons to log that a message was sent to the lead (WhatsApp / SMS). Shows the
// green confirmation inline (no redirect) so it always appears, then refreshes.
export default function MessageLogButtons({ leadId }) {
  const [msg, setMsg] = useState(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function log(channel) {
    const formData = new FormData();
    formData.set('lead_id', leadId);
    formData.set('channel', channel);
    startTransition(async () => {
      try {
        const res = await logMessage(null, formData);
        setMsg(res);
        if (res?.ok) router.refresh();
      } catch {
        setMsg({ error: 'Could not save — please try again.' });
      }
    });
  }

  return (
    <div style={{ marginTop: 8 }}>
      {msg?.ok ? <div className="alert ok" role="status">{msg.ok}</div> : null}
      {msg?.error ? <div className="alert error" role="alert">{msg.error}</div> : null}
      <div className="small muted" style={{ marginBottom: 4 }}>Log a message sent:</div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        <button type="button" className="btn ghost small" disabled={pending} onClick={() => log('whatsapp')}>
          📲 Sent WhatsApp
        </button>
        <button type="button" className="btn ghost small" disabled={pending} onClick={() => log('sms')}>
          ✉️ Sent SMS
        </button>
      </div>
    </div>
  );
}
