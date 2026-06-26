# Data import scripts

## Import Dubai areas & buildings (DLD open data)

The CRM ships with a starter list of Dubai communities (see migration
`0008_areas_buildings.sql`). To load the **full** emirate, import an official
Dubai Land Department dataset.

### 1. Get the data
Download a community/building dataset as **CSV** from Dubai Pulse
(<https://www.dubaipulse.gov.ae> → search "areas" or "buildings" under the
DLD / Land Registry category). These are free, official open-data files.

### 2. Run the importer
From the `crm/` folder, with your Supabase keys set:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
node scripts/import_dld_areas.mjs ~/Downloads/dld_areas.csv
```

The script auto-detects common DLD column names. If yours differ, point it at
the right columns:

```bash
node scripts/import_dld_areas.mjs file.csv --area-col=AREA_EN --building-col=BUILDING_EN
```

It upserts (skips duplicates), so it's safe to re-run when DLD updates the data.

> The service-role key bypasses row-level security — only run this on a trusted
> machine, never in the browser.

---

## Fill the projects Google Sheet from DLD (Apps Script)

`dld_projects_appsscript.gs` is a **Google Apps Script** that imports the Dubai
Land Department projects registry into your linked projects Google Sheet
(mapping to the columns the CRM reads: B=Developer, C=Project, D=Area, S=Emirate).
It only **appends new projects**, so your manually-curated rows are never
overwritten.

**Important:** Dubai Pulse downloads require a free login, so a fully-anonymous
scheduled fetch usually returns a login page, not CSV. Two ways to use it:

- **Paste tab (reliable):** log in to dubaipulse.gov.ae, download the DLD
  "Projects" CSV, paste it into a tab named `DLD_RAW` in the spreadsheet, then
  run **DLD Import → Import now**.
- **Public CSV URL (schedulable):** publish the CSV (e.g. import it to a Google
  Sheet → File → Share → Publish to web → CSV), put that link in `DATA_URL`, then
  **DLD Import → Schedule daily**.

Install: in the sheet, **Extensions → Apps Script**, paste the file, Save, reload
the sheet, and use the new **DLD Import** menu.

> This only fills the registry fields (developer, project, area, status). Prices,
> payment plans and brochures aren't in the free DLD data — keep curating those
> in the sheet by hand.
