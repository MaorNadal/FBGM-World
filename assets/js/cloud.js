/* World-data sync through a Google Apps Script web app (your own Drive). Syncs every localStorage key starting with fbgmhub_ (except the web-app URL). */
window.Cloud = (function () {
  const P = 'fbgmhub_', U = P + 'cloudurl';
  const url = () => localStorage.getItem(U) || '', setUrl = v => localStorage.setItem(U, v.trim());
  const keys = () => Object.keys(localStorage).filter(k => k.startsWith(P) && k !== U);
  async function save() { const d = {}; keys().forEach(k => d[k] = localStorage.getItem(k)); const r = await fetch(url(), { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ t: Date.now(), d }) }); const j = await r.json(); if (!j.ok) throw new Error(j.error || 'refused'); return Object.keys(d).length; }
  async function load() { const r = await fetch(url()); const j = await r.json(); if (!j.ok) throw new Error(j.error || 'refused'); const d = j.d || {}; Object.keys(d).forEach(k => k.startsWith(P) && k !== U && localStorage.setItem(k, d[k])); return Object.keys(d).length; }
  return { url, setUrl, save, load };
})();
