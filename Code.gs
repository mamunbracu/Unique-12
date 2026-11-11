/**
 * UNIQUE TWELVE – Samity Finance Tracker
 * Free, permanent backend: Google Sheets + Google Apps Script
 *
 * SETUP (one time, ~5 minutes)
 * 1. Create a new Google Sheet (name it "Unique Twelve Database").
 * 2. Extensions → Apps Script. Delete the sample code and paste this whole file into Code.gs.
 * 3. Click  +  → HTML, name it exactly:  Index   → paste the whole Index.html file into it.
 * 4. Select the function "setup" in the toolbar and click ▶ Run. Allow the permissions it asks for.
 * 5. Deploy → New deployment → type "Web app"
 *      Execute as: Me      Who has access: Anyone (or "Anyone with Google account")
 *    Click Deploy and copy the Web app URL. That URL is your dashboard — share it with members.
 * 6. Open the URL → Admin Login (password 1535) → Settings → "Load demo data" to try it,
 *    or start adding your real members, banks and payments.
 * 7. Change the admin password from Settings once you go live.
 *
 * FILES: profile photos and documents are saved in your Google Drive, in a folder named
 * "Unique Twelve Files" (subfolders: Profile Photos, Member, Asset, Expense, Bank / FDR, General).
 * Profile photos are shared as view-by-link so they can show in the dashboard.
 * Documents stay private and are only served through this web app.
 *
 * After editing code later: Deploy → Manage deployments → ✏️ → Version: New version → Deploy.
 */

const TABLES = {
  members:   ['id','name','phone','email','joinDate','bankId','status','photo','occupation','nominee','nomineeRelation','address','note'],
  payments:  ['id','memberId','month','amount','date','bankId','type','note'],
  banks:     ['id','name','type','accountNo','branch','openingBalance','rate','openDate','maturity','note'],
  expenses:  ['id','date','category','amount','bankId','note'],
  assets:    ['id','name','type','date','cost','bankId','currentValue','status','saleDate','saleAmount','note'],
  transfers: ['id','date','fromBankId','toBankId','amount','note'],
  files:     ['id','fileId','name','mime','size','linkType','linkId','uploadedAt','url','note']
};
const NUMERIC = { size:1, amount:1, openingBalance:1, rate:1, cost:1, currentValue:1, saleAmount:1 };
const DEFAULT_PASSWORD = '1535';

/* ---------- web app ---------- */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Unique Twelve – Samity Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setup() {
  Object.keys(TABLES).forEach(sheet_);
  folder_(); // creates the Drive folder and asks for Drive permission
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('ADMIN_PASSWORD')) p.setProperty('ADMIN_PASSWORD', DEFAULT_PASSWORD);
  return 'Setup complete';
}

/* ---------- helpers ---------- */
function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet_(name) {
  const ss = ss_();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    const h = TABLES[name];
    sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.getRange(1, 1, sh.getMaxRows(), h.length).setNumberFormat('@'); // keep dates/months as plain text
  }
  return sh;
}

function password_() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD') || DEFAULT_PASSWORD;
}

function auth_(pw) {
  if (String(pw) !== password_()) throw new Error('Not authorised – please log in as admin again.');
}

function checkTable_(t) {
  if (!TABLES[t]) throw new Error('Unknown table: ' + t);
}

function cell_(k, v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), k === 'month' ? 'yyyy-MM' : 'yyyy-MM-dd');
  }
  if (NUMERIC[k]) return v === '' || v === null ? 0 : Number(v);
  return v === null || v === undefined ? '' : String(v);
}

function read_(t) {
  const sh = sheet_(t);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const h = TABLES[t];
  return sh.getRange(2, 1, last - 1, h.length).getValues()
    .filter(r => r[0] !== '')
    .map(r => { const o = {}; h.forEach((k, i) => o[k] = cell_(k, r[i])); return o; });
}

function row_(t, rec) {
  return TABLES[t].map(k => {
    const v = rec[k];
    if (NUMERIC[k]) return Number(v) || 0;
    return v === null || v === undefined ? '' : String(v);
  });
}

function idIndex_(sh) {
  const last = sh.getLastRow();
  const map = {};
  if (last < 2) return map;
  sh.getRange(2, 1, last - 1, 1).getValues().forEach((r, i) => { if (r[0] !== '') map[String(r[0])] = i + 2; });
  return map;
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return fn(); } finally { lock.releaseLock(); }
}

/* ---------- API (called from Index.html via google.script.run) ---------- */
function apiLoad() {
  const out = {};
  Object.keys(TABLES).forEach(t => out[t] = read_(t));
  const s = PropertiesService.getScriptProperties().getProperty('SETTINGS');
  out.settings = s ? JSON.parse(s) : null;
  return out;
}

function apiLogin(pw) { return String(pw) === password_(); }

function apiSave(pw, t, rec) { return apiSaveMany(pw, t, [rec]); }

function apiSaveMany(pw, t, recs) {
  auth_(pw); checkTable_(t);
  return withLock_(() => {
    const sh = sheet_(t), idx = idIndex_(sh), toAppend = [];
    recs.forEach(rec => {
      if (!rec.id) throw new Error('Record has no id');
      const values = row_(t, rec);
      const r = idx[String(rec.id)];
      if (r) sh.getRange(r, 1, 1, values.length).setValues([values]);
      else toAppend.push(values);
    });
    if (toAppend.length) {
      const start = sh.getLastRow() + 1;
      sh.getRange(start, 1, toAppend.length, toAppend[0].length).setNumberFormat('@').setValues(toAppend);
    }
    return true;
  });
}

function apiDelete(pw, t, ids) {
  auth_(pw); checkTable_(t);
  ids = [].concat(ids).map(String);
  return withLock_(() => {
    const sh = sheet_(t), idx = idIndex_(sh);
    ids.map(id => idx[id]).filter(Boolean).sort((a, b) => b - a).forEach(r => sh.deleteRow(r));
    return true;
  });
}

function apiSettings(pw, settings) {
  auth_(pw);
  delete settings.adminPassword;
  PropertiesService.getScriptProperties().setProperty('SETTINGS', JSON.stringify(settings));
  return true;
}

function apiChangePassword(pw, newPw) {
  auth_(pw);
  if (!newPw || String(newPw).length < 4) throw new Error('Password must be at least 4 characters');
  PropertiesService.getScriptProperties().setProperty('ADMIN_PASSWORD', String(newPw));
  return true;
}

function apiRestore(pw, data) {
  auth_(pw);
  return withLock_(() => {
    Object.keys(TABLES).forEach(t => {
      const sh = sheet_(t), h = TABLES[t];
      const last = sh.getLastRow();
      if (last > 1) sh.getRange(2, 1, last - 1, sh.getLastColumn()).clearContent();
      const rows = (data[t] || []).map(r => row_(t, r));
      if (rows.length) sh.getRange(2, 1, rows.length, h.length).setNumberFormat('@').setValues(rows);
    });
    if (data.settings) {
      const s = data.settings; delete s.adminPassword;
      PropertiesService.getScriptProperties().setProperty('SETTINGS', JSON.stringify(s));
    }
    return true;
  });
}

function apiBackupToDrive(pw, json) {
  auth_(pw);
  const name = 'Unique Twelve Backup ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH-mm') + '.json';
  const f = DriveApp.createFile(name, json, MimeType.PLAIN_TEXT);
  return f.getUrl();
}

/* Optional: run once to add a weekly automatic Drive backup every Sunday 2am */
function installWeeklyBackup() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'weeklyBackup_').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('weeklyBackup_').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(2).create();
}
function weeklyBackup_() {
  DriveApp.createFile('Unique Twelve Auto Backup ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd') + '.json',
    JSON.stringify(apiLoad()), MimeType.PLAIN_TEXT);
}

/* ---------- Google Drive files ---------- */
function folder_() {
  const p = PropertiesService.getScriptProperties();
  const id = p.getProperty('FOLDER_ID');
  if (id) { try { const f = DriveApp.getFolderById(id); if (!f.isTrashed()) return f; } catch (e) {} }
  const f = DriveApp.createFolder('Unique Twelve Files');
  p.setProperty('FOLDER_ID', f.getId());
  return f;
}

function subfolder_(name) {
  const root = folder_();
  const it = root.getFoldersByName(name);
  return it.hasNext() ? it.next() : root.createFolder(name);
}

function apiUpload(pw, b64, mime, name, kind, isPublic) {
  auth_(pw);
  if (!b64) throw new Error('Empty file');
  const blob = Utilities.newBlob(Utilities.base64Decode(b64), mime || 'application/octet-stream', name || 'file');
  const file = subfolder_(String(kind || 'General').replace(/[\\/]/g, '-')).createFile(blob);
  if (isPublic) {
    try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { /* blocked by domain policy */ }
  }
  return { fileId: file.getId(), url: file.getUrl(), size: file.getSize() };
}

/* Serves a document to the dashboard. Only files registered in this samity's sheets can be read. */
function apiGetFile(fileId) {
  fileId = String(fileId || '');
  const known = read_('files').some(f => f.fileId === fileId) || read_('members').some(m => m.photo === 'drive:' + fileId);
  if (!known) throw new Error('File not found');
  const blob = DriveApp.getFileById(fileId).getBlob();
  return { mime: blob.getContentType(), b64: Utilities.base64Encode(blob.getBytes()), name: blob.getName() };
}

function apiTrashFile(pw, fileId) {
  auth_(pw);
  try { DriveApp.getFileById(String(fileId)).setTrashed(true); } catch (e) {}
  return true;
}
