/**
 * UNIQUE TWELVE – Samity Finance Tracker
 * Free, permanent backend: Google Sheets + Google Drive + Google Apps Script
 *
 * WHAT YOU NEED: only a Google (Gmail) account. No API keys, no billing, no server.
 *
 * SETUP (one time, ~5 minutes)
 * 1. Go to sheets.google.com → create a blank sheet → name it "Unique Twelve Database".
 * 2. In that sheet: Extensions → Apps Script. Delete the sample code and paste this whole file.
 * 3. In Apps Script click  +  → HTML → name it exactly:  Index   → paste the whole Index.html into it.
 * 4. Click 💾 Save. In the toolbar pick the function "setup" and click ▶ Run.
 *    Google asks for permission → Review permissions → choose your account →
 *    "Advanced" → "Go to project (unsafe)" → Allow. (It is your own script, so this is normal.)
 * 5. Deploy → New deployment → ⚙ Select type: Web app
 *      Description: Unique Twelve      Execute as: Me      Who has access: Anyone
 *    Click Deploy → copy the Web app URL. That URL is your dashboard — share it with members.
 * 6. Open the URL → Admin Login (password 1535). The first time, it offers to create the 12 members
 *    and the resolution with all balances at ৳0.
 * 7. Change the admin password in Settings.
 *
 * UPDATING LATER: paste the new code → Save → Deploy → Manage deployments → ✏️ Edit →
 *   Version: "New version" → Deploy. (The URL stays the same.)
 *
 * FILES: photos, ID cards and documents are saved in your Google Drive in a folder named
 * "Unique Twelve Files". Profile photos are shared view-by-link so they can show in the dashboard.
 * ID cards and documents stay private. ID cards can only be opened with the admin password.
 *
 * Sheets are created automatically: members, payments, banks, expenses, assets, transfers, files, rules, income.
 * New columns added in future versions are appended automatically — your data is never moved.
 */

const TABLES = {
  members:   ['id','memberNo','name','nameBn','fatherName','fatherNameBn','phone','email','joinDate','bankId','status','photo','occupation','share','nominee','nomineeBn','nomineeRelation','address','note','soActive','soDay','soBankId','soAmount','payMethod','payFromBank','payFromAccount'],
  payments:  ['id','memberId','month','amount','date','bankId','type','note','method','fromBank','fromAccount','toAccount','ref'],
  banks:     ['id','name','type','accountNo','branch','openingBalance','rate','openDate','maturity','note','accountTitle','holders'],
  expenses:  ['id','date','category','amount','bankId','note'],
  assets:    ['id','name','type','date','cost','bankId','currentValue','status','saleDate','saleAmount','note'],
  transfers: ['id','date','fromBankId','toBankId','amount','note'],
  files:     ['id','fileId','name','mime','size','linkType','linkId','category','uploadedAt','url','note'],
  rules:     ['id','section','order','titleEn','titleBn','textEn','textBn'],
  income:    ['id','date','category','amount','bankId','note'],
  loans:     ['id','memberId','date','amount','bankId','rate','months','purpose','status','note'],
  loanPayments: ['id','loanId','date','amount','bankId','note'],
  recons:    ['id','bankId','date','statementBalance','note'],
  activity:  ['id','at','by','action','table','summary','data']
};
const NUMERIC = { months:1, statementBalance:1, memberNo:1, share:1, size:1, order:1, amount:1, openingBalance:1, rate:1, cost:1, currentValue:1, saleAmount:1 };
const DEFAULT_PASSWORD = '1535';

/* ---------- web app ---------- */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Unique Twelve – Samity Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setup() {
  Object.keys(TABLES).forEach(t => headers_(sheet_(t), t));
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('ADMIN_PASSWORD')) p.setProperty('ADMIN_PASSWORD', DEFAULT_PASSWORD);
  folder_(); // creates the Drive folder and asks for Drive permission
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

/* Returns the sheet's header row, appending any columns this version needs that are missing. */
function headers_(sh, t) {
  const lastCol = Math.max(sh.getLastColumn(), 1);
  const raw = sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
  let n = raw.length; while (n > 0 && raw[n - 1] === '') n--;
  const have = raw.slice(0, n);
  const missing = TABLES[t].filter(k => have.indexOf(k) < 0);
  if (missing.length) {
    sh.getRange(1, n + 1, 1, missing.length).setValues([missing]).setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
    sh.getRange(1, n + 1, sh.getMaxRows(), missing.length).setNumberFormat('@');
    return have.concat(missing);
  }
  return have;
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
  const sh = sheet_(t), h = headers_(sh, t);
  const last = sh.getLastRow();
  if (last < 2) return [];
  return sh.getRange(2, 1, last - 1, h.length).getValues()
    .filter(r => r[0] !== '')
    .map(r => { const o = {}; h.forEach((k, i) => { if (k) o[k] = cell_(k, r[i]); }); return o; });
}

function row_(h, rec) {
  return h.map(k => {
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
    const sh = sheet_(t), h = headers_(sh, t), idx = idIndex_(sh), toAppend = [];
    recs.forEach(rec => {
      if (!rec.id) throw new Error('Record has no id');
      const values = row_(h, rec);
      const r = idx[String(rec.id)];
      if (r) sh.getRange(r, 1, 1, values.length).setValues([values]);
      else toAppend.push(values);
    });
    if (toAppend.length) {
      const start = sh.getLastRow() + 1;
      sh.getRange(start, 1, toAppend.length, h.length).setNumberFormat('@').setValues(toAppend);
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
    Object.keys(TABLES).filter(t => t !== 'activity').forEach(t => {
      const sh = sheet_(t), h = headers_(sh, t);
      const last = sh.getLastRow();
      if (last > 1) sh.getRange(2, 1, last - 1, Math.max(sh.getLastColumn(), h.length)).clearContent();
      const rows = (data[t] || []).map(r => row_(h, r));
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
  const f = subfolder_('Backups').createFile(name, json, MimeType.PLAIN_TEXT);
  return f.getUrl();
}

/* Optional: run once to add a weekly automatic Drive backup every Sunday 2am */
function installWeeklyBackup() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'weeklyBackup_').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('weeklyBackup_').timeBased().onWeekDay(ScriptApp.WeekDay.SUNDAY).atHour(2).create();
}
function weeklyBackup_() {
  subfolder_('Backups').createFile('Unique Twelve Auto Backup ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd') + '.json',
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

/* Serves a file to the dashboard. Only files registered in this samity's sheets can be read,
   and ID cards (category member-id / nominee-id) need the admin password. */
function apiGetFile(fileId, pw) {
  fileId = String(fileId || '');
  const rec = read_('files').filter(f => f.fileId === fileId)[0];
  const isPhoto = !rec && read_('members').some(m => m.photo === 'drive:' + fileId);
  if (!rec && !isPhoto) throw new Error('File not found');
  if (rec && /-id$/.test(rec.category || '')) auth_(pw);
  const blob = DriveApp.getFileById(fileId).getBlob();
  return { mime: blob.getContentType(), b64: Utilities.base64Encode(blob.getBytes()), name: blob.getName() };
}

function apiTrashFile(pw, fileId) {
  auth_(pw);
  try { DriveApp.getFileById(String(fileId)).setTrashed(true); } catch (e) {}
  return true;
}
