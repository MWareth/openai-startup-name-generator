import Anthropic from '@anthropic-ai/sdk';

// Content Studio — brochure → agent video scripts, powered by the Claude API.
// Needs ANTHROPIC_API_KEY in the environment (Vercel → Settings → Env Vars).

const MODEL = 'claude-opus-4-8';

export const SCRIPT_LANGUAGES = ['English', 'Arabic', 'Russian', 'Hindi', 'Urdu', 'Chinese', 'Korean', 'Spanish'];
export const SCRIPT_TONES = [
  'Bullish default — short, punchy, direct',
  'Luxury — calm, premium, understated',
  'Investor — numbers-first, ROI-focused',
  'Energetic — high excitement, launch hype',
];
export const SCRIPT_DURATIONS = [30, 45, 60, 90];

export function contentReady() {
  return !!process.env.ANTHROPIC_API_KEY;
}

const SYSTEM = `You write short spoken-video scripts for real-estate agents at Bullish Team (Bridges & Allies Real Estate), a Dubai off-plan brokerage. Agents read the script to camera for Instagram/TikTok, so it must sound natural when spoken aloud.

Hard rules:
- Use ONLY facts given to you (brochure, renders, notes). NEVER invent prices, dates, sizes, ROI figures, rental yields, or guarantees. If a fact is missing, leave it out rather than guessing.
- No claims of guaranteed returns. No superlatives you cannot back with a provided fact.
- Structure: one punchy HOOK line, then 3 short selling points, then a clear CTA to send a WhatsApp/DM message to the agent.
- Spoken register: short sentences. No hashtags, no emojis, no stage directions, no camera notes, no headings — just the words the agent says.
- Length: about 130 spoken words per 60 seconds; scale to the requested duration.
- Write the script in the requested language, natural and native-sounding for a Dubai real-estate audience. Keep the project name, developer name, and area names as-is (do not translate proper nouns).`;

// One-call extraction + first script: reads the brochure/renders, pulls the
// facts, and writes the first script. Structured output = no parsing surprises.
const EXTRACT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['project_name', 'developer', 'location', 'handover', 'payment_plan', 'starting_price', 'unit_types', 'usps', 'script_body'],
  properties: {
    project_name: { type: 'string', description: 'Official project name; empty string if unknown' },
    developer: { type: 'string', description: 'Developer name; empty if unknown' },
    location: { type: 'string', description: 'Area/community in Dubai; empty if unknown' },
    handover: { type: 'string', description: 'Handover date/quarter as stated; empty if unknown' },
    payment_plan: { type: 'string', description: 'e.g. 60/40, 1% monthly; empty if unknown' },
    starting_price: { type: 'string', description: 'Starting price as stated, with currency; empty if unknown' },
    unit_types: { type: 'string', description: 'e.g. Studio–3BR apartments, townhouses; empty if unknown' },
    usps: { type: 'array', items: { type: 'string' }, description: 'Up to 6 short unique selling points taken from the material' },
    script_body: { type: 'string', description: 'The spoken script in the requested language' },
  },
};

const REGEN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['script_body'],
  properties: {
    script_body: { type: 'string', description: 'The spoken script in the requested language' },
  },
};

function anthropic() {
  return new Anthropic();
}

function textOf(response) {
  const block = (response.content || []).find((b) => b.type === 'text');
  return block ? block.text : '';
}

// files: [{ mediaType, base64 }] — PDFs and images from the upload form.
export async function extractAndWriteScript({ files, notes, language, tone, durationSec }) {
  const content = [];
  for (const f of files) {
    if (f.mediaType === 'application/pdf') {
      content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.base64 } });
    } else {
      content.push({ type: 'image', source: { type: 'base64', media_type: f.mediaType, data: f.base64 } });
    }
  }
  content.push({
    type: 'text',
    text:
      `Extract the project facts from the material above${notes ? ' and these notes' : ''}, then write the first agent script.\n` +
      (notes ? `\nExtra notes from the team (treat as facts):\n${notes}\n` : '') +
      `\nScript requirements:\n- Language: ${language}\n- Target duration: ${durationSec} seconds\n- Tone: ${tone}`,
  });

  const response = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: EXTRACT_SCHEMA } },
    system: SYSTEM,
    messages: [{ role: 'user', content }],
  });

  return JSON.parse(textOf(response));
}

// Cheap regeneration: new language/tone/length from the stored facts (no PDF re-read).
export async function writeScriptFromFacts({ facts, language, tone, durationSec }) {
  const response = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium', format: { type: 'json_schema', schema: REGEN_SCHEMA } },
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content:
          `Project facts (the ONLY facts you may use):\n${JSON.stringify(facts, null, 2)}\n\n` +
          `Write an agent script.\n- Language: ${language}\n- Target duration: ${durationSec} seconds\n- Tone: ${tone}`,
      },
    ],
  });

  return JSON.parse(textOf(response)).script_body;
}
