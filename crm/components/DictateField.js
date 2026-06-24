'use client';

import { useRef, useState } from 'react';

// A notes textarea with a built-in speech-to-text "Dictate" button, so agents
// can speak an update instead of typing (e.g. between viewings / at a light).
// Uses the browser's native SpeechRecognition — best on Android/Chrome; on
// iPhone the phone keyboard's mic is the reliable fallback (hint shown).
export default function DictateField({ name, placeholder, required, rows = 3, defaultValue = '' }) {
  const [value, setValue] = useState(defaultValue);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [lang, setLang] = useState('en-US');
  const recRef = useRef(null);

  function toggle() {
    const SR =
      typeof window !== 'undefined' &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      setSupported(false);
      return;
    }
    if (listening) {
      if (recRef.current) recRef.current.stop();
      return;
    }
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let chunk = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) chunk += e.results[i][0].transcript;
      }
      if (chunk) setValue((v) => (v ? v.trim() + ' ' : '') + chunk.trim());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  return (
    <div>
      <textarea
        name={name}
        placeholder={placeholder}
        required={required}
        rows={rows}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="row" style={{ gap: 8, marginTop: 6 }}>
        {supported ? (
          <>
            <button
              type="button"
              onClick={toggle}
              className={`btn small ${listening ? 'danger' : 'secondary'}`}
            >
              {listening ? '⏹ Stop' : '🎤 Dictate'}
            </button>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              style={{ width: 130 }}
              aria-label="Dictation language"
            >
              <option value="en-US">English</option>
              <option value="ar-SA">Arabic</option>
            </select>
            {listening ? (
              <span className="small" style={{ color: 'var(--red)' }}>● listening…</span>
            ) : null}
          </>
        ) : (
          <span className="small muted">Tip: tap your phone keyboard&apos;s 🎤 to dictate.</span>
        )}
      </div>
    </div>
  );
}
