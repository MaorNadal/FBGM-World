/* Player faces drawn by facesjs (Apache-2.0, the library the game uses) from the face object stored in the save. The library file is loaded from this site (facesjs.js, if you add it) or from jsDelivr; without it a silhouette is shown. */
window.Faces = (function () {
  let lib = null, tried = false;
  async function load() {
    if (lib || tried) return lib; tried = true;
    for (const u of ['./facesjs.js', 'https://cdn.jsdelivr.net/npm/facesjs/+esm']) { try { const m = await import(u); if (m && m.display) { lib = m; break; } } catch (e) {} }
    return lib;
  }
  const sil = '<svg viewBox="0 0 100 130" style="width:100%;height:100%" aria-hidden="true"><circle cx="50" cy="42" r="26" fill="#ffffff2e"/><path d="M8 130c4-40 22-52 42-52s38 12 42 52z" fill="#ffffff2e"/></svg>';
  async function draw(el, face) {
    const L = await load(); el.innerHTML = '';
    if (L && face) { try { L.display(el, face); const s = el.querySelector('svg'); if (s) { s.removeAttribute('width'); s.removeAttribute('height'); s.style.cssText = 'width:100%;height:100%'; return true; } } catch (e) {} }
    el.innerHTML = sil; return false;
  }
  async function svgString(face, x, y, w, h) {
    const L = await load(); if (!L || !face) return '';
    const d = document.createElement('div'); d.style.cssText = 'position:absolute;left:-9999px;top:0;width:200px;height:300px'; document.body.appendChild(d);
    try { L.display(d, face); const s = d.querySelector('svg'); if (!s) return ''; return s.outerHTML.replace(/^<svg([^>]*)>/, (m, a) => '<svg' + a.replace(/\s(width|height|x|y)="[^"]*"/g, '') + ` x="${x}" y="${y}" width="${w}" height="${h}">`); } catch (e) { return ''; } finally { d.remove(); }
  }
  return { draw, svgString, load, silhouette: sil, isReal: () => !!lib };
})();
