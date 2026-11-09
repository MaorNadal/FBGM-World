/* Read side of the league database (same schema as import-worker.js). */
window.HubDB = (function () {
  let p; const open = () => p || (p = new Promise((res, rej) => { const q = indexedDB.open('fbgm-hub-league'); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); q.onupgradeneeded = () => { q.transaction.abort(); rej(new Error('empty')); }; }));
  const get = (s, k) => open().then(d => new Promise((res, rej) => { const q = d.transaction(s).objectStore(s).get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }));
  const all = s => open().then(d => new Promise((res, rej) => { const q = d.transaction(s).objectStore(s).getAll(); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }));
  const count = s => open().then(d => new Promise(res => { const q = d.transaction(s).objectStore(s).count(); q.onsuccess = () => res(q.result); }));
  const idx = (s, i, k) => open().then(d => new Promise((res, rej) => { const q = d.transaction(s).objectStore(s).index(i).getAll(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }));
  const scan = (st, keep, max) => open().then(d => new Promise((res, rej) => { const out = [], q = d.transaction(st).objectStore(st).openCursor(); q.onsuccess = () => { const c = q.result; if (!c || (max && out.length >= max)) return res(out); if (keep(c.value)) out.push(c.value); c.continue(); }; q.onerror = () => rej(q.error); }));
  return { get, all, count, idx, scan, summary: () => get('meta', 'summary').catch(() => null) };
})();
