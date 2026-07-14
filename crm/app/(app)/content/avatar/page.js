import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import CopyButton from '@/components/CopyButton';
import { giveAvatarConsent } from '../actions';

export const dynamic = 'force-dynamic';

// The 2-minute calibration read: natural, varied delivery in the register the
// avatar will speak in later (real-estate video scripts). Pause cues sit
// between paragraphs so nobody reads them aloud.
const READ_PARAGRAPHS = [
  'Hi, my name is [your name], and I’m a property consultant with Bullish Team at Bridges and Allies Real Estate, here in Dubai.',
  'I help investors and families find the right home, in the right community, at the right price. Whether it’s a waterfront apartment with a view of the skyline, or a quiet townhouse near great schools, my job is to make the process simple and clear.',
  'Dubai’s property market moves fast. New projects launch every month, payment plans change, and the best units go quickly. That’s exactly why I keep my clients one step ahead — with real numbers, honest advice, and quick answers.',
  'Every project I share comes with the full details: the developer, the handover date, the payment plan, and the starting price. No surprises, and no pressure. Just clear information, so you can decide what works for you and your family.',
  'Let me tell you what I love about this city. The energy. The architecture. The fact that you can live by the beach, work downtown, and still be home in twenty minutes. There is truly no place like it.',
  'If you’re thinking about buying, selling, or just exploring your options — send me a message. I’ll get back to you the same day, with everything you need to make a confident decision. Thank you for watching, and I’ll see you in the next video.',
];

export default async function AvatarStudioPage({ searchParams }) {
  const { user, supabase } = await requireUser();
  const ok = searchParams?.ok;
  const error = searchParams?.error;

  const { data: av } = await supabase
    .from('avatar_profiles')
    .select('consent_at, avatar_id, voice_id')
    .eq('user_id', user.id)
    .maybeSingle()
    .then((r) => r, () => ({ data: null }));

  const consented = !!av?.consent_at;
  const ready = !!(av?.avatar_id && av?.voice_id);
  const step = ready ? 3 : consented ? 2 : 1;

  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <div>
        <Link className="small muted" href="/content">← Content Studio</Link>
        <h1>🎥 Avatar Recording Studio</h1>
        <p className="muted">
          One 2-minute recording, once — then the CRM can turn any approved script into a video of <strong>you</strong>,
          speaking in <strong>your voice</strong>, without filming again.
        </p>
      </div>
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      {/* Progress */}
      <div className="card">
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {[
            [1, 'Consent'],
            [2, 'Record & send'],
            [3, 'Ready'],
          ].map(([n, label]) => (
            <span
              key={n}
              className="badge"
              style={{
                padding: '6px 12px',
                background: step > n ? '#16a34a' : step === n ? 'var(--brand)' : 'var(--panel-2)',
                color: step >= n ? '#fff' : 'var(--text)',
              }}
            >
              {step > n ? '✓' : n}. {label}
            </span>
          ))}
        </div>
        {ready ? (
          <p className="small" style={{ marginTop: 10, marginBottom: 0 }}>
            ✅ <strong>You’re all set.</strong> Open <Link href="/content">Content Studio</Link>, pick an approved script,
            and tap <strong>🎥 Make my video</strong>.
          </p>
        ) : null}
      </div>

      {/* Step 1 — consent */}
      {!consented ? (
        <div className="card" style={{ borderColor: 'var(--gold)' }}>
          <h3 style={{ marginTop: 0 }}>Step 1 · Consent</h3>
          <form action={giveAvatarConsent} className="stack" style={{ gap: 10 }}>
            <input type="hidden" name="back" value="/content/avatar" />
            <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <input type="checkbox" name="consent" required style={{ marginTop: 3 }} />
              <span>
                I agree that Bullish Team may create AI-generated marketing videos using my likeness and voice,
                for company marketing only. I can withdraw this anytime by telling my admin.
              </span>
            </label>
            <button className="btn" type="submit">Agree & continue to recording</button>
          </form>
        </div>
      ) : null}

      {/* Step 2 — the recording guide (always visible once consented, for reference) */}
      {consented && !ready ? (
        <>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Step 2 · Set up your shot 🎬</h3>
            <ul className="small" style={{ margin: '0 0 0 18px', lineHeight: 1.8 }}>
              <li><strong>Light:</strong> face a window (daylight on your face, never behind you).</li>
              <li><strong>Background:</strong> plain and tidy — a wall beats a busy office.</li>
              <li><strong>Phone:</strong> vertical, propped up (don’t hold it), lens at eye level, about 1 metre away.</li>
              <li><strong>Framing:</strong> chest-up, a little space above your head.</li>
              <li><strong>Sound:</strong> quiet room, AC off if possible, phone on Do Not Disturb.</li>
              <li><strong>You:</strong> dress like you would for a client meeting. No sunglasses, no cap, nothing covering your face.</li>
            </ul>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Body language — do & don’t 🙌</h3>
            <div className="grid grid-2">
              <div>
                <div className="small" style={{ fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>DO</div>
                <ul className="small" style={{ margin: '0 0 0 18px', lineHeight: 1.8 }}>
                  <li>Look straight into the lens — that’s your client’s eyes</li>
                  <li>Relax your shoulders, stand or sit tall</li>
                  <li>Small natural hand gestures around chest level</li>
                  <li>Gentle head nods while making a point</li>
                  <li>Between paragraphs: <strong>pause, close your lips, smile for 2 seconds</strong></li>
                </ul>
              </div>
              <div>
                <div className="small" style={{ fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>DON’T</div>
                <ul className="small" style={{ margin: '0 0 0 18px', lineHeight: 1.8 }}>
                  <li>Touch your face or hair</li>
                  <li>Hold anything (phone, pen, coffee)</li>
                  <li>Walk around or sway</li>
                  <li>Look away from the lens or at notes</li>
                  <li>Rush — slower than feels natural is perfect</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="card" style={{ borderColor: 'var(--brand)' }}>
            <div className="spread">
              <h3 style={{ margin: 0 }}>Step 2 · What to say (read this) 📖</h3>
              <CopyButton text={READ_PARAGRAPHS.join('\n\n')} label="📋 Copy text" />
            </div>
            <p className="small muted">
              Read it naturally, like you’re talking to one client — not announcing. Where you see the 😊 line:
              pause, close your lips, and smile for two seconds, then continue. Total should be about 2 minutes.
            </p>
            <div className="stack" style={{ gap: 4 }}>
              {READ_PARAGRAPHS.map((p, i) => (
                <div key={i}>
                  <p style={{ fontSize: '1.05rem', lineHeight: 1.7, margin: '8px 0' }}>{p}</p>
                  {i < READ_PARAGRAPHS.length - 1 ? (
                    <p className="small muted" style={{ margin: 0 }}>😊 pause · lips closed · smile 2 seconds</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Step 3 · Send it in 📤</h3>
            <ul className="small" style={{ margin: '0 0 0 18px', lineHeight: 1.8 }}>
              <li>Watch it back once — good light, clear sound, you looked at the lens? If not, one more take.</li>
              <li>Send the file to your admin on WhatsApp (<strong>as a document</strong>, so quality isn’t compressed) or a Google Drive link.</li>
              <li>That’s it. Your admin finishes the setup — this page will show <strong>Ready</strong> when your avatar is live.</li>
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
}
