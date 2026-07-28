'use client';

import { useState, useTransition } from 'react';
import { saveTheme } from '@/app/(app)/profile/actions';

const THEMES = [
  { id: 'light', label: 'Light', hint: 'The current look', swatch: ['#f4f5f7', '#ffffff', '#0e2038'] },
  { id: 'dark', label: 'Dark', hint: 'Easy on the eyes at night', swatch: ['#0f1319', '#171d26', '#d9b95c'] },
  { id: 'blue', label: 'Blue', hint: 'House navy, softer than white', swatch: ['#eef4fd', '#ffffff', '#1c4e9c'] },
];

// Per-member colour theme. Applies instantly (so you see it while choosing),
// then saves to the profile so the choice follows you to any device.
export default function ThemeSwitcher({ current = 'light' }) {
  const [picked, setPicked] = useState(current || 'light');
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function choose(id) {
    setPicked(id);
    setSaved(false);
    // Apply immediately — no reload, no waiting for the server.
    document.documentElement.setAttribute('data-theme', id);
    startTransition(async () => {
      try {
        await saveTheme(id);
        setSaved(true);
      } catch (e) {
        // The look still applied for this session; it just didn't persist.
      }
    });
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      <div className="row" style={{ gap: 10 }}>
        {THEMES.map((t) => {
          const on = picked === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => choose(t.id)}
              aria-pressed={on}
              style={{
                flex: '1 1 150px',
                textAlign: 'left',
                cursor: 'pointer',
                padding: 12,
                borderRadius: 10,
                background: 'var(--panel-2)',
                border: on ? '2px solid var(--gold)' : '1px solid var(--border)',
                color: 'var(--text)',
              }}
            >
              <div className="row" style={{ gap: 4, marginBottom: 8 }}>
                {t.swatch.map((c) => (
                  <span
                    key={c}
                    style={{
                      width: 20, height: 20, borderRadius: 5,
                      background: c, border: '1px solid rgba(0,0,0,0.15)',
                    }}
                  />
                ))}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                {t.label} {on ? '✓' : ''}
              </div>
              <div className="small muted">{t.hint}</div>
            </button>
          );
        })}
      </div>
      <p className="small muted" style={{ margin: 0 }}>
        {pending ? 'Saving…' : saved ? 'Saved — this follows you on every device. ✅' : 'Pick a look. It applies straight away.'}
      </p>
    </div>
  );
}
