'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { saveAvatarRecording } from '@/app/(app)/content/actions';

// Safari records mp4, Chrome and Firefox record webm. Ask for mp4 first —
// it's the format the avatar vendor and every editor accept without a convert.
const MIME_CANDIDATES = [
  'video/mp4;codecs=h264,aac',
  'video/mp4',
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
];

const MAX_SECONDS = 300; // hard stop at 5 min — the read is a 2-minute script

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  return MIME_CANDIDATES.find((t) => {
    try {
      return MediaRecorder.isTypeSupported(t);
    } catch {
      return false;
    }
  }) || '';
}

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function AvatarRecorder({ userId, paragraphs = [] }) {
  const videoRef = useRef(null);
  const promptRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const rafRef = useRef(null);
  const scrollPos = useRef(0);
  const lastTick = useRef(0);
  const tickRef = useRef(null);

  const [phase, setPhase] = useState('idle'); // idle | ready | recording | review | uploading | done
  const [error, setError] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [speed, setSpeed] = useState(38); // px per second
  const [fontSize, setFontSize] = useState(24);
  const [scrolling, setScrolling] = useState(false);
  const [blob, setBlob] = useState(null);
  const [playbackUrl, setPlaybackUrl] = useState(null);
  const router = useRouter();

  // ---- teleprompter scroll -------------------------------------------------
  const step = useCallback((ts) => {
    const el = promptRef.current;
    if (!el) return;
    if (!lastTick.current) lastTick.current = ts;
    const dt = (ts - lastTick.current) / 1000;
    lastTick.current = ts;
    scrollPos.current += speed * dt;
    const max = el.scrollHeight - el.clientHeight;
    el.scrollTop = Math.min(scrollPos.current, max);
    if (scrollPos.current < max) rafRef.current = requestAnimationFrame(step);
    else setScrolling(false);
  }, [speed]);

  useEffect(() => {
    if (!scrolling) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTick.current = 0;
      return;
    }
    lastTick.current = 0;
    rafRef.current = requestAnimationFrame(step);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [scrolling, step]);

  function rewind() {
    scrollPos.current = 0;
    if (promptRef.current) promptRef.current.scrollTop = 0;
  }

  // ---- camera --------------------------------------------------------------
  async function enableCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser can’t use the camera. Try Chrome, or Safari on iPhone.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }
      setPhase('ready');
    } catch (e) {
      setError(
        e?.name === 'NotAllowedError'
          ? 'Camera blocked. Allow camera and microphone for this site, then tap again.'
          : `Couldn’t start the camera: ${e?.message || e}`
      );
    }
  }

  // Release the camera when leaving the page — the light must not stay on.
  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (tickRef.current) clearInterval(tickRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // ---- record --------------------------------------------------------------
  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = pickMime();
    if (mime === null) {
      setError('This browser can’t record video. On iPhone use Safari (iOS 14.3+), on desktop use Chrome.');
      return;
    }
    chunksRef.current = [];
    let rec;
    try {
      rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    } catch {
      rec = new MediaRecorder(stream); // let the browser choose
    }
    rec.ondataavailable = (e) => e.data?.size && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const type = rec.mimeType || 'video/webm';
      const b = new Blob(chunksRef.current, { type });
      setBlob(b);
      setPlaybackUrl(URL.createObjectURL(b));
      setPhase('review');
      setScrolling(false);
    };
    recorderRef.current = rec;
    rec.start(1000);
    setSeconds(0);
    setPhase('recording');
    rewind();
    setScrolling(true);
    tickRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) stopRecording();
        return s + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (tickRef.current) clearInterval(tickRef.current);
    setScrolling(false);
    try {
      recorderRef.current?.state !== 'inactive' && recorderRef.current?.stop();
    } catch {}
  }

  function retake() {
    if (playbackUrl) URL.revokeObjectURL(playbackUrl);
    setBlob(null);
    setPlaybackUrl(null);
    setSeconds(0);
    rewind();
    setPhase('ready');
  }

  // ---- upload --------------------------------------------------------------
  async function upload() {
    if (!blob) return;
    setPhase('uploading');
    setError(null);
    try {
      const ext = (blob.type || '').includes('mp4') ? 'mp4' : 'webm';
      const path = `${userId}/take-${Date.now()}.${ext}`;
      const supabase = createClient();
      // Straight to Storage from the browser: a 2-minute video is far larger
      // than the request-body limit a server action could accept.
      const { error: upErr } = await supabase.storage
        .from('avatar-recordings')
        .upload(path, blob, { contentType: blob.type || 'video/webm', upsert: true });
      if (upErr) throw upErr;

      const res = await saveAvatarRecording(path);
      if (res && res.ok === false) throw new Error(res.error || 'Could not save the recording.');
      setPhase('done');
      streamRef.current?.getTracks().forEach((t) => t.stop());
      router.refresh();
    } catch (e) {
      setPhase('review');
      const msg = String(e?.message || e);
      setError(
        /bucket|not found/i.test(msg)
          ? 'Storage isn’t set up yet — run migration 0041_avatar_recordings.sql. Your recording is still here, don’t close the page.'
          : `Upload failed: ${msg}`
      );
    }
  }

  // ---- UI ------------------------------------------------------------------
  if (phase === 'done') {
    return (
      <div className="card" style={{ borderColor: 'var(--green)' }}>
        <h3 style={{ marginTop: 0 }}>✅ Recording sent</h3>
        <p className="muted" style={{ margin: 0 }}>
          Your take is uploaded and the team has been notified. You can record a better one any time —
          just reload this page.
        </p>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: 12 }}>
      {error ? (
        <div className="alert" style={{ background: '#fde4e4', border: '1px solid var(--red)', color: '#7f1d1d', padding: '10px 14px', borderRadius: 10 }}>
          {error}
        </div>
      ) : null}

      <div className="recorder-stage">
        {/* Live camera (mirrored, so it feels like a mirror — the FILE is not
            mirrored, only this preview). */}
        <video
          ref={videoRef}
          playsInline
          muted
          className="recorder-video"
          style={{ display: phase === 'review' ? 'none' : 'block' }}
        />
        {playbackUrl && phase === 'review' ? (
          <video src={playbackUrl} controls playsInline className="recorder-video" style={{ transform: 'none' }} />
        ) : null}

        {phase === 'idle' ? (
          <div className="recorder-overlay-center">
            <button className="btn" type="button" onClick={enableCamera}>🎥 Turn on camera</button>
            <p className="small" style={{ color: '#fff', marginTop: 10, maxWidth: 320 }}>
              Works on your phone or laptop. You&apos;ll be asked to allow camera and microphone.
            </p>
          </div>
        ) : null}

        {/* Teleprompter — top middle, over the picture, so your eyes stay on
            the lens instead of dropping to a script below. */}
        {phase !== 'idle' && phase !== 'review' ? (
          <div className="teleprompter" ref={promptRef} style={{ fontSize }}>
            <div style={{ padding: '40% 0 60%' }}>
              {paragraphs.map((p, i) => (
                <p key={i} style={{ marginBottom: '0.9em' }}>{p}</p>
              ))}
            </div>
          </div>
        ) : null}

        {phase === 'recording' ? (
          <div className="recorder-rec">● REC {mmss(seconds)}</div>
        ) : null}
      </div>

      {/* Controls */}
      {phase === 'ready' || phase === 'recording' ? (
        <div className="card" style={{ padding: 12 }}>
          <div className="row" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {phase === 'ready' ? (
              <button className="btn" type="button" onClick={startRecording}>⏺️ Start recording</button>
            ) : (
              <button className="btn danger" type="button" onClick={stopRecording}>⏹️ Stop</button>
            )}
            <button className="btn ghost small" type="button" onClick={() => setScrolling((v) => !v)}>
              {scrolling ? '⏸️ Pause text' : '▶️ Scroll text'}
            </button>
            <button className="btn ghost small" type="button" onClick={rewind}>⏮️ Back to top</button>

            <label className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              Speed
              <input type="range" min="12" max="90" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} style={{ width: 110 }} />
            </label>
            <label className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
              Text size
              <input type="range" min="16" max="40" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} style={{ width: 90 }} />
            </label>
          </div>
          <p className="small muted" style={{ margin: '8px 0 0' }}>
            Look at the <strong>camera lens</strong>, not at yourself. The text scrolls automatically once
            you hit record — adjust the speed until it matches how you talk.
          </p>
        </div>
      ) : null}

      {phase === 'review' ? (
        <div className="card" style={{ padding: 12 }}>
          <p style={{ marginTop: 0 }}>
            Watch it back. Happy with it? Send it — otherwise record another take.
          </p>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn" type="button" onClick={upload}>📤 Send this recording</button>
            <button className="btn secondary" type="button" onClick={retake}>🔄 Record again</button>
            {blob ? (
              <a className="btn ghost small" href={playbackUrl} download={`avatar-take.${(blob.type || '').includes('mp4') ? 'mp4' : 'webm'}`}>
                ⬇️ Save a copy
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {phase === 'uploading' ? (
        <div className="card" style={{ padding: 12 }}>
          <strong>Uploading…</strong>
          <p className="small muted" style={{ margin: '4px 0 0' }}>
            Keep this page open — a two-minute video takes a moment on mobile data.
          </p>
        </div>
      ) : null}
    </div>
  );
}
