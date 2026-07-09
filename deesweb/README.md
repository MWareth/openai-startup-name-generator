# Dee's Treats — Website (deesweb)

The clean, canonical home for Dee's Treats' online storefront. Free to host and edit — no paid builders, no credits.

- `index.html` — customer ordering page (menu → cart → Ziina card payment). Orders sync to Firebase.
- `orders.html` — private orders dashboard (Firebase login). Live across all devices.
- `manifest.json` — home-screen app metadata.

## Product photos
The menu auto-loads a photo per item named by its key, e.g. `sansebastian.jpg`, `pavlova.jpg`,
`lazycake.jpg`, `carrotcake.jpg`, `carrotballs.jpg`, `cremebrulee.jpg`, `bundle.jpg`.
Drop those files in this folder and they appear automatically (emoji shows until a photo exists).
Optional: `hero.jpg` (top banner), `dees-logo.png` / `dees-icon.png` (dashboard logo/icon).

## Hosting (free)
Netlify free tier → publish directory = `deesweb`. Or GitHub Pages from repo root/docs.
