# Villa Leads — WhatsApp Re-engagement (standalone)

Re-engagement sender for warm villa / off-plan enquiry leads (Haven by Aldar
campaign, batch 2). Isolated from the other tools (own `haven-wa-*` localStorage
keys). Asks whether they're still investing or looking for a home, and offers
off-plan deals.

- `whatsapp-reengage-villa-leads.html` — the tool. 90 cleaned leads preloaded; 4 message presets.
- `haven-leads-full.csv` — reference list with full names and lead stage.
- Cleaning: dropped "Not Interested"/"Incorrect Contact" stages, junk names, and malformed numbers; deduped; title-cased.
