# Dee's Treats — Orders Log (web app)

A single-file order tracker you can open on any phone or laptop. Same columns as the
spreadsheet, but **delivery fee is its own column and is never deducted from Net Revenue**.

- `index.html` — the whole app. No install, no server, works offline.
- Data is saved in **your browser** on the device you use. Use **Export CSV** to back it up
  or move it to another device (then **Import CSV** there).

## How Net Revenue works here
```
Subtotal       = sum of item prices
After Discount  = Subtotal − Discount %
Net Revenue     = After Discount − Platform Commission %   ← delivery NOT subtracted
Delivery Fee    = its own column + its own total
```
The dashboard also shows **"Net after delivery absorbed"** so you can still see the true
bottom line when you cover delivery yourself.

## Two ways to use it

### A) Just open the file (fastest)
Download `index.html` and open it in any browser. Done.

### B) Get a permanent link (access anywhere) — GitHub Pages
1. On GitHub, open this repo → **Settings** → **Pages**.
2. Under "Build and deployment", set **Source = Deploy from a branch**.
3. Choose your branch and **folder = `/docs`**, then **Save**.
4. Wait ~1 minute. Your link appears at the top of the Pages screen, like:
   `https://<your-username>.github.io/openai-startup-name-generator/`
5. Open that link on your phone, add it to your home screen, and log orders anywhere.

> Note: with GitHub Pages the data still lives in each device's browser. If you want
> orders to **sync automatically across devices**, ask and I'll wire up free cloud storage.
