importScripts('scanner.js', 'transform.js');
const DB = 'fbgm-hub-league', STORES = { meta: 'k', players: 'pid', teams: 'tid', games: 'gid', box: ['gid', 'pid'], events: { keyPath: 'eid', autoIncrement: true }, misc: { autoIncrement: true } };
let db, buf = {}, fileCount = {}, seasonGames = {}, boxRead = 0, bytes = 0, total = 0, cancelled = false, ga = null, lastPost = 0, exportVersion = null;
const BIG = { players: 1, teams: 1, games: 1, events: 1 };
const open = () => new Promise((res, rej) => {
  const r = indexedDB.deleteDatabase(DB); r.onblocked = () => postMessage({ type: 'blocked' }); r.onsuccess = r.onerror = () => {
    const q = indexedDB.open(DB, 1);
    q.onupgradeneeded = () => { for (const s in STORES) { const o = STORES[s]; const d = q.result; typeof o === 'string' || Array.isArray(o) ? d.createObjectStore(s, { keyPath: o }) : d.createObjectStore(s, o); } q.transaction.objectStore('players').createIndex('tid', 'tid'); q.transaction.objectStore('games').createIndex('season', 'season'); q.transaction.objectStore('box').createIndex('pid', 'pid'); q.transaction.objectStore('box').createIndex('season', 'season'); q.transaction.objectStore('events').createIndex('season', 'season'); };
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error);
  };
});
const put = (s, rows) => new Promise((res, rej) => { const t = db.transaction(s, 'readwrite'), o = t.objectStore(s); rows.forEach(r => o.put(r)); t.oncomplete = res; t.onerror = () => rej(t.error); t.onabort = () => rej(t.error || new Error('Storage write aborted')); });
const count = s => new Promise(res => { const q = db.transaction(s).objectStore(s).count(); q.onsuccess = () => res(q.result); });
/* 1.72 (FR-IMP-6): the state of the import is kept in the league database, so an import that stopped (tab closed, browser killed) is recognised next time */
let stateInfo = null, lastState = 0;
const setState = (status, extra) => put('meta', [Object.assign({ k: 'importState', status, bytes, total }, stateInfo, extra || {})]).catch(() => {});
let chain = Promise.resolve();
function add(s, row) { (buf[s] = buf[s] || []).push(row); if (buf[s].length >= 1500) flush(s); }
function flush(s) { const rows = buf[s]; if (!rows || !rows.length) return; buf[s] = []; chain = chain.then(() => put(s, rows)); }
function post(force) { const n = Date.now(); if (stateInfo && n - lastState > 3000) { lastState = n; setState('running'); } if (force || n - lastPost > 250) { lastPost = n; postMessage({ type: 'progress', bytes, total, counts: Object.assign({ box: boxRead }, fileCount) }); } }
const handler = {
  arrayStart(k) { fileCount[k] = 0; },
  arrayEnd() {},
  item(k, t) {
    const o = JSON.parse(t); fileCount[k]++;
    if (k === 'games') {
      const { head, box } = FBGMTransform.gameToBox(o); add('games', head); box.forEach(r => add('box', r)); boxRead += box.length;
      seasonGames[o.season] = (seasonGames[o.season] || 0) + 1;
    } else if (BIG[k]) add(k, o); else add('misc', { src: k, v: o });
    if (k === 'gameAttributes') ga = (ga || []).concat([o]);
  },
  value(k, t) { const v = JSON.parse(t); if (k === 'version') exportVersion = v; if (k === 'gameAttributes') ga = v; add('misc', { src: k, v }); }
};
onmessage = async e => {
  if (e.data.type === 'cancel') { cancelled = true; return; }
  try {
    const file = e.data.file; total = file.size; db = await open(); stateInfo = { file: file.name, startedAt: Date.now() }; await setState('running');
    const sc = new FBGMScanner.Scanner(handler), dec = new TextDecoder(), rd = file.stream().getReader();
    for (;;) {
      const { done, value } = await rd.read(); if (done) break;
      if (cancelled) { await setState('cancelled'); postMessage({ type: 'cancelled' }); return; }
      bytes += value.length; sc.push(dec.decode(value, { stream: true })); post();
      await chain;
    }
    for (const s in buf) flush(s); await chain;
    const gmap = {}; if (Array.isArray(ga)) ga.forEach(a => { if (a && a.key) gmap[a.key] = a.value; }); else if (ga && typeof ga === 'object') Object.assign(gmap, ga); /* GA-1: the export may store gameAttributes as an object */
    const season = gmap.season, meta = { k: 'summary', leagueName: gmap.leagueName || '', season, phase: gmap.phase, userTid: FBGMTransform.attr(gmap.userTid, season), importedAt: Date.now(), size: total, seasonGames, fileCount, exportVersion };
    await put('meta', [meta, { k: 'gameAttributes', v: gmap }]);
    const stored = {}; for (const s of ['players', 'teams', 'games', 'box', 'events']) stored[s] = await count(s);
    const checks = [['players', fileCount.players || 0, stored.players], ['teams', fileCount.teams || 0, stored.teams], ['games', fileCount.games || 0, stored.games], ['box rows', boxRead, stored.box], ['events', fileCount.events || 0, stored.events]].map(([n, a, b]) => ({ name: n, file: a, stored: b, ok: a === b }));
    await setState('done'); post(true); postMessage({ type: 'done', meta, checks, stored });
  } catch (err) { try { await setState('failed', { error: String(err && err.message || err) }); } catch (x) {} const q = err && err.name === 'QuotaExceededError'; postMessage({ type: 'error', message: q ? 'The browser ran out of storage space for this site. Free some space on the device, or close other tabs, and try again.' : String(err && err.message || err) }); }
};
