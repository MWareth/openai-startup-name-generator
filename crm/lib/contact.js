// Shared "did the client actually respond?" reading of an agent's call note.
// Used by the auto New→Contacted advance and the newcomer-program conversation
// counter. Phrases below mean the client was NOT reached — no answer,
// voicemail, or the agent only sent a message.

export const NO_CONTACT_RX = new RegExp(
  [
    "(no|didn'?t|did not|does ?n'?t|not)\\s*(answer|ans\\b|pick|reply|respon)",
    'no-?answer', 'unreach', 'not reachable', 'switch(ed)?\\s?off', 'phone (was )?off',
    'voice\\s?mail', '\\bvm\\b', 'line busy', 'busy tone', 'rang out', 'no pick\\s?up',
    'wrong number', 'invalid number', 'number (is )?(wrong|invalid|off)',
    'left (a )?(message|voicemail)', '(sent|dropped|shot) (him |her |them )?(a )?(message|msg|text|sms|whats?app)',
    "whats?app(ed)?( (sent|msg|message))?", '\\bmessaged\\b', '\\btexted\\b',
    'لم يرد', 'ما رد', 'مغلق',
  ].join('|'),
  'i'
);

// True when a call note reads like a real conversation happened. An empty
// note gives us nothing to read, so it doesn't count.
export function isRealContact(body) {
  const text = String(body || '').trim();
  return !!text && !NO_CONTACT_RX.test(text);
}
