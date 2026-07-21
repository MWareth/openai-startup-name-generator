# Marwan Abdulwareth — Portfolio & Showreel (`marwanweb`)

A clean, modern, minimal portfolio site — **Artist · Broker · Creative Director**.
**One file, no dependencies, no Wix, no monthly fees.** Everything you own and can edit yourself.

- `index.html` — the entire site (HTML + CSS + JS in one file).
- `img/` — drop your photos here; they appear automatically.
- `manifest.json` — home-screen / PWA metadata.

## Add your photos (this is all you do)
Drop these files into `img/`. They auto-load — until they exist, tasteful placeholders show and **nothing breaks**.

| File | Where it shows | Ideal size |
|------|----------------|-----------|
| `img/marwan.jpg` | Big hero portrait | ~1000×1250 (4:5, portrait) |
| `img/artist.jpg` | "Marwan the Artist" card | ~1200×750 (16:10) |
| `img/broker.jpg` | "Marwan the Broker" card | ~1200×750 (16:10) |
| `img/director.jpg` | "Creative Director" card | ~1200×750 (16:10) |
| `img/photo-1.jpg … photo-6.jpg` | Photography gallery | any size (portrait looks best) |
| `img/reel-cover.jpg` *(optional)* | Poster behind the showreel play button | 1920×1080 (16:9) |
| `img/og.jpg` | Social-share preview (WhatsApp/LinkedIn) | 1200×630 |

You can grab your existing images straight off your Wix site (right-click → Save image), rename them
to the names above, and drop them in `img/`. Done.

## Add your showreel video
In `index.html`, find the `#showreel` section and un-comment the `<iframe>` line, setting its `src`
to your YouTube or Vimeo embed URL (e.g. `https://www.youtube.com/embed/XXXXXXXX`). Delete the
`reel-poster` div once the video is in. (Optional: drop `img/reel-cover.jpg` for a poster image first.)

## Edit the words
Everything is plain text inside `index.html` — just search for the phrase you want to change:
- **Name / roles** — the `#top`/hero `<h1>` and the `.roles` rotator (Artist / Broker / Creative Director).
- **Three sides of Marwan** — the three `<article class="card">` blocks under `#worlds`.
- **Your story** — the `#bio` section.
- **Contact links** — the `#contact` section. Set your real **WhatsApp** (`https://wa.me/9715XXXXXXXX`)
  and **LinkedIn** URLs where you see `href="#"`.

## Preview it locally
Just open `index.html` in a browser — that's it. Or serve the folder:
```bash
cd marwanweb && python3 -m http.server 8080   # then open http://localhost:8080
```

## Host it free
- **Netlify** (drag-and-drop the `marwanweb` folder) — free, custom domain supported.
- **GitHub Pages** — publish this folder, or point a custom domain (e.g. `marwanabdulwareth.com`) at it.
- **Cloudflare Pages / Vercel** — also free and instant.

No credits, no lock-in. If you buy a domain later, any of the above will connect it in minutes.
