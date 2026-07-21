# Marwan Wareth — Portfolio (`marwanweb`)

Personal site for **Marwan Wareth — Creative Director & Visual Artist**, Dubai.
**One file, no dependencies, no Wix, no monthly fees.** Fully yours to edit and host free.

- `index.html` — the entire site (HTML + CSS + JS in one file). Style: **Noir** (dark).
- `img/` — drop your photos, logo and reel poster here; they appear automatically.
- `manifest.json` — home-screen / PWA metadata.

## Switch the style
The site ships in **Noir**. To try the other looks, open `index.html` and change one attribute:
`<div class="site" data-skin="noir" ...>` → `data-skin="mono"` or `data-skin="signal"`.

## Your logo
Drop **two files** in `img/` and the header swaps them automatically per style:
- `img/logo-light.svg` — your **white** logo (used on Noir / dark)
- `img/logo-dark.svg` — a **dark** version (used on Mono / Signal / light)

SVG is best (crisp at any size). PNG works too — just name them `logo-light.png` / `logo-dark.png`
and change the two `'img/logo-'+k+'.svg'` references in the script to `.png`.
Until they exist, the "Marwan Wareth" text wordmark shows — nothing breaks.

## Add your photos
Drop these into `img/`. They auto-load over the placeholders.

| File | Where it shows |
|------|----------------|
| `img/work-1.jpg … work-5.jpg` | "Recent frames" work grid + the hover-preview in the Index |
| `img/reel-cover.jpg` *(optional)* | Poster image behind the showreel play button |
| `img/og.jpg` | Social-share preview (WhatsApp / LinkedIn), 1200×630 |

Tip: `work-1.jpg` is the big wide featured tile — use a strong landscape image.

## Add your showreel
In `index.html`, find the `#reel` section, un-comment the `<iframe>` line and set its `src`
to your YouTube/Vimeo embed URL, then delete the `.play` + `.meta` divs.

## Edit the words
Plain text in `index.html` — search for what you want to change:
- **Name / roles** — the hero `<h1>` and the `.rot` rotator.
- **Studio / bio** — the `#studio` section.
- **Subjects** — the `.scat` blocks under `#shoot`.
- **Work titles** — the `work` and `idx` arrays in the script.
- **Contact links** — the `#contact` section (set real Instagram / WhatsApp / LinkedIn).

## Preview & host
Open `index.html` in a browser, or serve it: `cd marwanweb && python3 -m http.server 8080`.
Host free on **Netlify** (drag the folder), **GitHub Pages**, **Cloudflare Pages** or **Vercel** —
custom domain (e.g. `marwanwareth.com`) supported on all of them.
