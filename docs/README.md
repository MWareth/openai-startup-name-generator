# Dee's Treats — Website & Orders Tool

This folder is published with GitHub Pages (Source: branch `master`, folder `/docs`).

## Two things live here

### 1. Public website — `index.html`
The customer-facing Dee's Treats site (hero, menu, story, gallery, reviews,
build-your-order, contact). This is your main link:
```
https://mwareth.github.io/openai-startup-name-generator/
```
- Edit menu items/prices/reviews in the `MENU` and `REVIEWS` lists inside `index.html`.
- Add your WhatsApp number: set `const WHATSAPP=''` near the top of the script to your
  number (country code, no `+`, e.g. `'9715XXXXXXXX'`).
- Add photos by dropping files into `img/` — see `img/README.md` for the file names.

### 2. Private orders tool — `orders.html`
Your internal order log (delivery tracked separately from net revenue, monthly totals,
CSV export). Bookmark it / add to home screen:
```
https://mwareth.github.io/openai-startup-name-generator/orders.html
```
Data is stored in your browser on each device. Use Export/Import CSV to move it.

## Logo & icon files (used by both)
- `dees-logo.png` — wide logo for the headers (transparent background ideal)
- `dees-icon.png` — square logo on a cream background, for the phone home-screen icon

Until these exist, a styled "dee's TREATS" text shows instead — nothing breaks.
