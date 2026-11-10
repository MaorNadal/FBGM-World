/* Player faces drawn by facesjs (Apache-2.0, the library the game uses) from the face object stored in the save, in the team's colours and jersey when a team is given.
   The library file is loaded from this site (facesjs.js, if you add it) or from jsDelivr; without it a silhouette is shown.
   The load is shared: every caller waits for the same promise (an earlier version let callers that arrived during the first load fall back to the silhouette). */
window.Faces = (function () {
  let libP = null, failAt = 0, real = false;
  const URLS = ['./facesjs.js', 'https://cdn.jsdelivr.net/npm/facesjs/+esm'];
  function load() {
    if (libP && (real || !failAt || Date.now() - failAt < 30000)) return libP;
    failAt = 0;
    return libP = (async () => {
      for (const u of URLS) { try { const m = await Promise.race([import(u), new Promise((_, no) => setTimeout(() => no(new Error('timeout')), 8000))]), d = m && (m.display || (m.default && m.default.display)); if (d) { real = true; return d; } } catch (e) {} }
      failAt = Date.now(); return null;
    })();
  }
  const sil = '<svg viewBox="0 0 100 130" style="width:100%;height:100%" aria-hidden="true"><circle cx="50" cy="42" r="26" fill="#ffffff2e"/><path d="M8 130c4-40 22-52 42-52s38 12 42 52z" fill="#ffffff2e"/></svg>';
  const jid = j => typeof j === 'string' ? j : (j && j.id) || null;
  /* the face object and the display overrides for a team (colours, jersey), or the face unchanged */
  function dressed(face, team) {
    const c = team && Array.isArray(team.colors) && team.colors.length ? team.colors : null; if (!face || !c) return { f: face };
    const f = Object.assign({}, face, { teamColors: c }), ov = { teamColors: c }, j = jid(team.jersey); if (j) { f.jersey = { id: j }; ov.jersey = { id: j }; } return { f, ov };
  }
  async function draw(el, face, team) {
    el.innerHTML = sil; const d = await load();
    if (d && face) { try { const x = dressed(face, team); d(el, x.f, x.ov); const s = el.querySelector('svg'); if (s) { s.removeAttribute('width'); s.removeAttribute('height'); s.style.cssText = 'width:100%;height:100%'; return true; } } catch (e) {} }
    el.innerHTML = sil; return false;
  }
  async function svgString(face, x, y, w, h, team) {
    const d = await load(); if (!d || !face) return '';
    const el = document.createElement('div'); el.style.cssText = 'position:absolute;left:-9999px;top:0;width:200px;height:300px'; document.body.appendChild(el);
    try { const k = dressed(face, team); d(el, k.f, k.ov); const s = el.querySelector('svg'); if (!s) return ''; return s.outerHTML.replace(/^<svg([^>]*)>/, (m, a) => '<svg' + a.replace(/\s(width|height|x|y)="[^"]*"/g, '') + ` x="${x}" y="${y}" width="${w}" height="${h}">`); } catch (e) { return ''; } finally { el.remove(); }
  }
  /* getFace(pid) -> face object, getTeam(pid) -> team record (optional) */
  function lazy(root, getFace, getTeam) {
    const els = root.querySelectorAll('.av[data-pid]'); if (!els.length) return;
    const go = el => { if (el.dataset.d) return; el.dataset.d = 1; draw(el, getFace(el.dataset.pid), getTeam ? getTeam(el.dataset.pid) : null); };
    if (!('IntersectionObserver' in window)) { els.forEach(go); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { go(e.target); io.unobserve(e.target); } }), { rootMargin: '200px' }); els.forEach(e => io.observe(e));
  }
  return { draw, lazy, svgString, load, dressed, silhouette: sil, isReal: () => real };
})();
