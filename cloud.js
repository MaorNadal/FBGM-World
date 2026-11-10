/* Automatic world-data sync through your own Google Apps Script web app. No buttons: it pulls on page load and on return to the tab, and pushes 1.5 s after any change. Newest change per key wins. The web-app address is kept per device (paste it once on each device). League data is never synced (re-import the save file). */
window.Cloud = (function () {
  const P = 'fbgmhub_', U = P + 'cloudurl', T = P + '_t', skip = k => !k.startsWith(P) || k === U || k === T || k === P + 'theme';
  const url = () => localStorage.getItem(U) || '', setUrl = v => { localStorage.setItem(U, (v || '').trim()); };
  const tmap = () => { try { return JSON.parse(localStorage.getItem(T) || '{}'); } catch (e) { return {}; } };
  let timer = null, busy = false, again = false;
  function dot(s, msg) { const e = document.getElementById('cd'); if (e) { e.style.background = { ok: '#27d17f', busy: '#ffb81c', err: '#ff5468', off: '#566680' }[s]; e.title = msg || s; } Cloud.status = { s, msg }; }
  const keys = () => Object.keys(localStorage).filter(k => !skip(k));
  async function sync() {
    if (!url()) { dot('off', 'Cloud sync is off (no address set)'); return 0; }
    if (busy) { again = true; return 0; }
    busy = true; dot('busy', 'Syncing…');
    try {
      const j = await (await fetch(url())).json(); if (!j.ok) throw new Error(j.error || 'refused');
      const rem = j.d || {}, t = tmap(), push = {}; let pulled = 0;
      for (const k in rem) {
        if (skip(k)) continue; const rv = rem[k], obj = rv && typeof rv === 'object', rt = obj ? rv.t || 0 : 0, val = obj ? rv.v : rv;
        if (rt > (t[k] || 0) && val != null) { localStorage.setItem(k, val); t[k] = rt; pulled++; }
      }
      for (const k of keys()) {
        const rv = rem[k], rt = rv && typeof rv === 'object' ? rv.t || 0 : 0;
        if (!t[k]) t[k] = Date.now();
        if (t[k] > rt) push[k] = { v: localStorage.getItem(k), t: t[k] };
      }
      localStorage.setItem(T, JSON.stringify(t));
      if (Object.keys(push).length) { const j2 = await (await fetch(url(), { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ d: push }) })).json(); if (!j2.ok) throw new Error(j2.error || 'refused'); }
      dot('ok', 'Synced ' + new Date().toLocaleTimeString() + (pulled ? ' · ' + pulled + ' items received' : ''));
      return pulled;
    } catch (e) { dot('err', 'Cloud sync failed: ' + e.message); throw e; }
    finally { busy = false; if (again) { again = false; setTimeout(() => sync().catch(() => {}), 500); } }
  }
  function touch(k) { if (skip(k)) return; const t = tmap(); t[k] = Date.now(); localStorage.setItem(T, JSON.stringify(t)); if (!url()) return; clearTimeout(timer); timer = setTimeout(() => sync().catch(() => {}), 1500); }
  function start() {
    const h = document.querySelector('header.top'); if (h && !document.getElementById('cd')) h.insertAdjacentHTML('beforeend', '<i id="cd" title="Cloud sync" style="width:10px;height:10px;border-radius:50%;background:#566680;display:inline-block;margin-left:10px"></i>');
    dot(url() ? 'busy' : 'off', url() ? 'Syncing…' : 'Cloud sync is off (no address set)');
    if (url()) sync().then(n => { if (n > 0 && Date.now() - (+sessionStorage.getItem(P + 'reloaded') || 0) > 20000) { sessionStorage.setItem(P + 'reloaded', Date.now()); location.reload(); } }).catch(() => {});
    document.addEventListener('visibilitychange', () => { if (!document.hidden && url()) sync().catch(() => {}); });
  }
  const api = { url, setUrl, sync, touch, start, status: { s: 'off' } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  return api;
})();
