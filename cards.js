/* Collectible cards: pure card data, SVG drawing and pack drawing. No faces yet (the face library licence is unverified): a silhouette stands in. */
(function (root) {
  const tier = o => o >= 80 ? 'gold' : o >= 70 ? 'silver' : o >= 60 ? 'bronze' : 'base', TC = { gold: '#ffd35a', silver: '#d3dbe6', bronze: '#d99562', base: '#7a8ba5' }, TN = { gold: 'Elite', silver: 'Starter', bronze: 'Role player', base: 'Reserve' };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])), hex = (c, d) => /^#[0-9a-f]{3,8}$/i.test(c || '') ? c : d;
  function cardData(p, team, P) {
    const sr = P.series(p), l = sr[sr.length - 1] || {}, c = P.career(p, false), last = c.rows[c.rows.length - 1] || {}, st = [];
    for (const [k, lab] of c.cols) if (last[k]) st.push([lab, last[k]]);
    return { pid: p.pid, name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || 'Player', pos: l.pos || '', ovr: l.ovr == null ? 0 : l.ovr, pot: l.pot == null ? 0 : l.pot, team: team ? (team.abbrev || '') : '', jersey: p.jerseyNumber || '', c1: hex(team && team.colors && team.colors[0], '#1b3a6b'), c2: hex(team && team.colors && team.colors[1], '#ffb81c'), stats: st.slice(0, 6), season: last.season || '', face: p.face };
  }
  function svg(c) {
    const t = tier(c.ovr), b = TC[t], n = esc(c.name), fs = c.name.length > 18 ? 20 : c.name.length > 13 ? 24 : 28, id = 'g' + c.pid;
    const cells = c.stats.map(([l, v], i) => `<g transform="translate(${30 + (i % 3) * 82},${338 + Math.floor(i / 3) * 40})"><text fill="#fff" font-size="17" font-weight="700">${esc(Math.round(v * 10) / 10)}</text><text y="14" fill="#ffffffaa" font-size="10">${esc(l)}</text></g>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="300" height="420" font-family="Bahnschrift,Roboto Condensed,Arial Narrow,sans-serif"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.c1}"/><stop offset="1" stop-color="#060a10"/></linearGradient></defs><rect x="4" y="4" width="292" height="412" rx="22" fill="url(#${id})" stroke="${b}" stroke-width="5"/><path d="M180 4h116v120z" fill="${c.c2}" opacity=".9"/><text x="28" y="66" fill="#fff" font-size="54" font-weight="800">${c.ovr}</text><text x="30" y="88" fill="${b}" font-size="13" letter-spacing="2">${esc(c.pos)} · OVR</text><text x="272" y="46" fill="#000" font-size="16" font-weight="700" text-anchor="end">${esc(c.team)}</text><circle cx="150" cy="190" r="48" fill="#ffffff22"/><path d="M62 308c6-52 46-70 88-70s82 18 88 70z" fill="#ffffff22"/>${c.faceSvg || ''}${!c.faceSvg && c.jersey !== '' ? `<text x="150" y="212" fill="#ffffffcc" font-size="58" font-weight="800" text-anchor="middle">${esc(c.jersey)}</text>` : ''}<rect x="14" y="296" width="272" height="34" fill="#000000aa"/><text x="150" y="320" fill="#fff" font-size="${fs}" font-weight="800" text-anchor="middle" textLength="${Math.min(250, n.length * fs * 0.52)}" lengthAdjust="spacingAndGlyphs">${n}</text>${cells}<text x="286" y="404" fill="${b}" font-size="11" text-anchor="end">${TN[t].toUpperCase()}${c.pot ? ' · POT ' + c.pot : ''}</text></svg>`;
  }
  function pack(pool, n, rng) {
    const P = pool.slice(), out = [];
    while (out.length < n && P.length) { const w = P.map(c => Math.exp(-((c.ovr || 0) - 45) / 10)), tot = w.reduce((a, b) => a + b, 0); let x = rng() * tot, i = 0; while (i < w.length - 1 && x >= w[i]) { x -= w[i]; i++; } out.push(P.splice(i, 1)[0]); }
    return out;
  }
  const api = { tier, TC, TN, cardData, svg, pack, esc };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMCards = api;
})(typeof self !== 'undefined' ? self : this);
