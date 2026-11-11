// Deploy: script.google.com > New project > paste > Deploy > New deployment > Web app > Execute as: Me, Who has access: Anyone. Copy the /exec address and paste it once on each device (Tools / Import page).
// Keeps one JSON file in your Drive; every key carries the time of its last change and the newest change wins.
const FILE = 'fbgm-hub-world.json';
function file_() { const f = DriveApp.getFilesByName(FILE); return f.hasNext() ? f.next() : DriveApp.createFile(FILE, '{"d":{}}', 'application/json'); }
function read_() { try { return JSON.parse(file_().getBlob().getDataAsString() || '{}').d || {}; } catch (x) { return {}; } }
function doGet() { return out_({ ok: true, d: read_() }); }
function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    const inc = JSON.parse(e.postData.contents).d || {}, cur = read_();
    for (const k in inc) { const a = inc[k], c = cur[k], ct = c && typeof c === 'object' ? c.t || 0 : 0; if (!c || (a.t || 0) > ct) cur[k] = { v: a.v, t: a.t || 0 }; }
    file_().setContent(JSON.stringify({ d: cur })); return out_({ ok: true });
  } catch (x) { return out_({ ok: false, error: String(x) }); } finally { lock.releaseLock(); }
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
