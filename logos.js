/* Team logos: the address stored in the save (per season when it changed), with a drawn crest underneath that shows when the image is missing or blocked. */
window.Logo = (function () {
  const BASE = 'https://play.football-gm.com', M = {};
  const hex = (c, d) => /^#[0-9a-f]{6}$/i.test(c || '') ? c : d;
  const lum = c => { const n = parseInt(c.slice(1), 16); return 0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255); };
  function crest(t, size) {
    const c1 = hex(t.colors && t.colors[0], '#1b3a6b'), c2 = hex(t.colors && t.colors[1], '#ffb81c'), ab = String(t.abbrev || '').slice(0, 3).toUpperCase(), ink = lum(c1) > 150 ? '#000' : '#fff';
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4 L90 16 V52 C90 74 72 90 50 98 C28 90 10 74 10 52 V16 Z" fill="${c1}" stroke="${c2}" stroke-width="6"/><path d="M50 4 L90 16 V32 H10 V16 Z" fill="${c2}" opacity=".95"/><text x="50" y="68" text-anchor="middle" font-family="Bahnschrift,Arial Narrow,sans-serif" font-weight="800" font-size="${ab.length > 2 ? 28 : 34}" fill="${ink}">${ab}</text></svg>`;
  }
  function url(t, season) {
    const s = season != null ? (t.seasons || []).find(x => x.season === season) : null, u = (s && s.imgURL) || t.imgURL;
    if (!u) return ''; if (/^(https?:|data:)/i.test(u)) return u; return BASE + (u[0] === '/' ? u : '/' + u);
  }
  function html(t, size, season) {
    if (!t) return '';
    const u = url(t, season);
    return `<span class="lg" style="width:${size}px;height:${size}px">${crest(t, size)}${u ? `<img src="${u.replace(/"/g, '&quot;')}" alt="" loading="lazy" referrerpolicy="no-referrer" onload="this.previousElementSibling.style.visibility='hidden'" onerror="this.remove()">` : ''}</span>`;
  }
  const init = teams => { teams.forEach(t => M[t.tid] = t); };
  return { html, crest, url, init, t: (tid, size, season) => html(M[tid], size || 22, season) };
})();
