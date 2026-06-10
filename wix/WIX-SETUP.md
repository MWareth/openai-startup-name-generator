# Habit Tracker on Wix — Setup Guide

Get your morning habit tracker onto your Wix site so your streaks and progress
**sync across all your devices** (phone, laptop) under your Wix login.

Files in this folder:
- `habit-tracker-embed.html` — the tracker UI (goes in an HTML embed element)
- `page-code.js` — Velo page code (bridges UI ↔ database)
- `backend-habits.jsw` — backend data module
- `WIX-SETUP.md` — this guide

Total time: ~15–20 minutes. You do this once.

---

## Step 0 — Turn on Dev Mode (Velo)
In the Wix Editor, top menu → **Dev Mode** (or "Velo by Wix") → **Turn on Dev
Mode**. A code sidebar appears on the left and a code panel at the bottom.

## Step 1 — Enable Members & Login
Your data is tied to *you* via your Wix login, so add login if you don't have it:
- **Add** (+) → **Members** → add a **Login Bar** / **Login button** to your
  site header, or add a **Members Area**.
- Create your own member account and **log in** (you'll use this each device).
- Publish later; for now this just needs to exist.

> Why: when you're logged in, Wix automatically stamps each saved row with your
> member id (`_owner`) so only you see your data — and it follows you anywhere
> you log in.

## Step 2 — Create the database collection
Velo sidebar (left) → **Databases** → **+ Create Collection**.
- **Name:** `HabitDays`  (must match exactly)
- **Permissions:** choose **"Members can read/write their own content"**
  (a.k.a. *Member-Generated Content*). This is the key setting — it scopes data
  per member.
- Add these fields (Text type):

  | Field name   | Type  |
  |--------------|-------|
  | `date`       | Text  |
  | `doneIds`    | Text  |
  | `habitsJson` | Text  |

  (`_id` and `_owner` already exist automatically — leave them.)

## Step 3 — Add the backend module
Velo sidebar → **Backend** → **+ New .jsw file** → name it `habits`
(so the path is `backend/habits.jsw`).
Open `backend-habits.jsw` from this folder, copy ALL of it, paste it in, save.

## Step 4 — Add the HTML embed element (the UI)
- **Add** (+) → **Embed Code** → **Embed HTML** (the "HTML iframe" / Custom
  Element). Drag it onto the page where you want the tracker.
- Click it → **Enter Code** → choose **Code** (not "Website address").
- Open `habit-tracker-embed.html` from this folder, copy ALL of it, paste it in.
- Resize the box generously — about **560 px wide × 760 px tall** works well.
  (On mobile, Wix stacks it; make it tall enough to avoid an inner scrollbar.)
- In the element's settings, note/confirm its **ID is `html1`**. (Click the
  element → Properties panel → "ID". If it's different, change it in
  `page-code.js` where it says `#html1`.)

## Step 5 — Add the page code
At the bottom code panel, make sure you're on **this page's** code tab (not
`masterPage`/site code). Open `page-code.js` from this folder, copy ALL of it,
paste it in, save.

## Step 6 — Publish & test
- Click **Publish**.
- Open the published page, **log in** with your member account.
- The badge under the title should switch to **"✓ Synced to your account"**.
- Tick a few habits → open the same page on your **phone** (logged in) → your
  progress is there. 🎉

---

## How it behaves
- **Logged in** → saves to the `HabitDays` collection; syncs across devices;
  badge shows "✓ Synced to your account".
- **Not logged in / backend missing** → still fully works, but saves only on
  that device's browser; badge shows "● Saved on this device".
- It always paints instantly from a local cache first, then loads your synced
  data — so it never feels slow.

## Troubleshooting
- **Badge stays "Saved on this device":** you're not logged in, or the element
  ID isn't `html1`, or the collection name/permissions don't match Step 2.
- **No data after login:** confirm the collection is named exactly `HabitDays`
  and permissions are the per-member option; confirm `backend/habits.jsw` saved
  without errors (check the Velo console).
- **Nothing shows / iframe blank:** make sure you pasted into **Embed HTML →
  Code**, not "Website address", and the box is tall enough.

## Want a public phone shortcut?
Once published, add the page URL to your phone home screen ("Add to Home
Screen") for a one-tap morning check-in.
