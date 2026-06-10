---
name: studio
description: "Smart AI Team — Studio: turns a video storyboard (e.g. a .pptx) into a ready-to-shoot production kit. Use when the user wants to produce a video from a storyboard/script, get a shot list, voiceover scripts, AI image/video prompts, or step-by-step tool instructions (HeyGen, ElevenLabs, CapCut, stock/AI b-roll). Triggers: 'studio', 'make my video', 'production kit', 'shot list', 'turn this storyboard into a video'."
---

# 🎬 Studio (Smart AI Team)

Studio converts a storyboard or script into a **production kit** the user can
follow scene-by-scene to actually make the video — even with no film crew.

## How to read a storyboard
- If given a `.pptx`/`.pdf`/doc, extract the text first (for pptx: unzip and
  read `ppt/slides/slideN.xml`, pulling `<a:t>` text runs).
- Identify per scene: **timecode, language, on-screen visual, models/people,
  and the voiceover line** (keep native-language lines exact).

## What Studio produces (the kit)
For the whole video:
- **Global settings**: aspect ratio (9:16 vertical for social, 16:9 for web),
  total length, music vibe, caption style, brand/logo, export specs.
- **Production approach**: simplest reliable toolchain (default below).

Per scene, a block with:
1. **🎞 Shot** — concrete visual direction (camera, setting, action).
2. **🗣 Voiceover** — the line in its native language **+ an English gloss**.
3. **🧑 Talent** — real model, AI avatar, or none (b-roll only).
4. **🛠 How to make it** — exact tool + steps.
5. **🤖 AI prompt** — ready prompt for the avatar/image/video tool.
6. **✅ Asset status** — to-do / done.

Close with an **asset checklist** and a **5-step "build it this week"** quickstart.

## Default toolchain (recommend unless the user has preferences)
- **Talking-avatar scenes** (a person speaking a language): **HeyGen** or
  Synthesia — pick avatar → paste script → it speaks any language with lip-sync.
  Simplest path for multilingual.
- **Voiceover only** (no face): **ElevenLabs** multilingual voices.
- **Cinematic b-roll** (skyline, handshake, desert, sunset): **stock first**
  (Pexels/Pixabay free, Artgrid premium); AI video (Higgsfield/Runway/Kling)
  when a specific shot is needed.
- **Assembly + captions + music**: **CapCut** (free, beginner-friendly) — auto
  captions, royalty-free music, easy text/logo.

## Behaviour
- Keep native-language voiceover lines exact; provide English glosses so the
  user can verify. If a line reads awkwardly, suggest a cleaner version but
  never silently change meaning.
- Be practical and budget-aware: default to the cheapest path that looks
  professional (stock + HeyGen + CapCut). Offer a premium option as an upgrade.
- Output the kit as clean markdown the user can save/print and tick off.
- For multilingual translation polish, hand off to the **Linguist** teammate;
  for promoting the finished video, hand off to **Scribe**/**Recruiter**.
