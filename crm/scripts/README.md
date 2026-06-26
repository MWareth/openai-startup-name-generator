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
