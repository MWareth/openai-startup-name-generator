/**
 * DLD → Projects sheet importer (Google Apps Script)
 * ==================================================
 * Pulls the Dubai Land Department "projects" registry into your linked
 * projects Google Sheet, mapped to the columns the CRM expects:
 *
 *   B = Developer   C = Project name   D = Area   P = Notes   S = Emirate
 *
 * It is SAFE: it only APPENDS projects whose name isn't already in the sheet,
 * so your manually-curated rows (prices, payment plans, brochures) are never
 * touched or overwritten.
 *
 * ── Two ways to feed it data (Dubai Pulse downloads need a free login, so a
 *    fully-anonymous scheduled fetch usually won't work) ──
 *
 *   MODE A — Paste tab (most reliable):
 *     1. Log in to dubaipulse.gov.ae (free), open the DLD "Projects" dataset,
 *        download the CSV.
 *     2. Import/paste it into a tab named exactly  DLD_RAW  in THIS spreadsheet.
 *     3. Run  importDldProjects  (menu: "DLD Import → Import now").
 *
 *   MODE B — Public CSV URL (enables scheduling):
 *     1. Put the CSV somewhere publicly readable (e.g. upload to Google Sheets
 *        and File → Share → Publish to web → CSV), copy that link.
 *     2. Paste it into DATA_URL below.
 *     3. Run once, then "DLD Import → Schedule daily" to keep it updated.
 *
 * Install: Extensions → Apps Script in your sheet, paste this file, Save.
 */

// ---- CONFIG ----------------------------------------------------------------
var PROJECTS_TAB = 'Sheet1';   // the tab the CRM reads (change if yours differs)
var RAW_TAB      = 'DLD_RAW';  // tab where you paste the downloaded DLD CSV
var DATA_URL     = '';         // optional public CSV URL (Mode B)
var FIRST_DATA_ROW = 2;        // row 1 is headers
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('DLD Import')
    .addItem('Import now', 'importDldProjects')
    .addItem('Schedule daily', 'scheduleDaily')
    .addItem('Stop schedule', 'unschedule')
    .addToUi();
}

function importDldProjects() {
  var rows = readSource_();
  if (!rows || rows.length < 2) {
    notify_('No data found. Paste the DLD CSV into the "' + RAW_TAB + '" tab, or set DATA_URL.');
    return;
  }

  var header = rows[0].map(function (h) { return String(h).trim().toLowerCase(); });
  var col = {
    name:      pick_(header, ['project_name_en', 'project_name', 'project_en', 'project', 'name_en', 'master_project_en']),
    developer: pick_(header, ['developer_name_en', 'developer_name', 'developer_en', 'developer', 'master_developer_en']),
    area:      pick_(header, ['area_name_en', 'area_name', 'area_en', 'area', 'community', 'zone_en']),
    status:    pick_(header, ['project_status', 'project_status_en', 'status_en', 'status']),
    percent:   pick_(header, ['percent_completed', 'completion_percent', 'project_completion_percent', 'cnp_percent', 'progress'])
  };
  if (col.name === -1) {
    notify_('Could not find a project-name column. Headers seen: ' + header.join(', '));
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dest = ss.getSheetByName(PROJECTS_TAB);
  if (!dest) { notify_('Tab "' + PROJECTS_TAB + '" not found.'); return; }

  // Names already in the sheet (column C), lower-cased, to avoid duplicates.
  var existing = {};
  var lastRow = dest.getLastRow();
  if (lastRow >= FIRST_DATA_ROW) {
    var names = dest.getRange(FIRST_DATA_ROW, 3, lastRow - FIRST_DATA_ROW + 1, 1).getValues();
    names.forEach(function (r) {
      var n = String(r[0] || '').trim().toLowerCase();
      if (n) existing[n] = true;
    });
  }

  var toAppend = [];
  var seenThisRun = {};
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    var name = String(r[col.name] || '').trim();
    if (!name) continue;
    var key = name.toLowerCase();
    if (existing[key] || seenThisRun[key]) continue;
    seenThisRun[key] = true;

    var note = 'Imported from DLD';
    if (col.status !== -1 && r[col.status]) note += ' · ' + String(r[col.status]).trim();
    if (col.percent !== -1 && r[col.percent] !== '' && r[col.percent] != null) note += ' · ' + String(r[col.percent]).trim() + '% complete';

    // 19 columns A..S; fill B(dev), C(name), D(area), P(notes), S(emirate).
    var row = new Array(19).fill('');
    row[1]  = col.developer !== -1 ? String(r[col.developer] || '').trim() : '';
    row[2]  = name;
    row[3]  = col.area !== -1 ? String(r[col.area] || '').trim() : '';
    row[15] = note;
    row[18] = 'Dubai';
    toAppend.push(row);
  }

  if (!toAppend.length) {
    notify_('Up to date — no new projects to add (' + Object.keys(existing).length + ' already in the sheet).');
    return;
  }

  dest.getRange(dest.getLastRow() + 1, 1, toAppend.length, 19).setValues(toAppend);
  notify_('Added ' + toAppend.length + ' new project(s) from DLD.');
}

// ---- helpers ---------------------------------------------------------------
function readSource_() {
  if (DATA_URL) {
    var res = UrlFetchApp.fetch(DATA_URL, { muteHttpExceptions: true, followRedirects: true });
    var text = res.getContentText();
    if (res.getResponseCode() !== 200 || /<html|<!doctype/i.test(text)) {
      notify_('DATA_URL did not return a public CSV (got HTTP ' + res.getResponseCode() +
              '). Use the "' + RAW_TAB + '" paste tab instead.');
      return null;
    }
    return parseCsv_(text);
  }
  var raw = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(RAW_TAB);
  if (!raw) return null;
  return raw.getDataRange().getValues();
}

function pick_(header, candidates) {
  for (var i = 0; i < candidates.length; i++) {
    var idx = header.indexOf(candidates[i]);
    if (idx !== -1) return idx;
  }
  return -1;
}

function parseCsv_(text) {
  return Utilities.parseCsv(text);
}

function notify_(msg) {
  try { SpreadsheetApp.getActiveSpreadsheet().toast(msg, 'DLD Import', 8); } catch (e) {}
  Logger.log(msg);
}

function scheduleDaily() {
  unschedule();
  ScriptApp.newTrigger('importDldProjects').timeBased().everyDays(1).atHour(6).create();
  notify_('Scheduled: daily import at ~6am. (Needs DATA_URL set for unattended runs.)');
}

function unschedule() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'importDldProjects') ScriptApp.deleteTrigger(t);
  });
}
