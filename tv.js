/* SIMULATED broadcast schedule (the save has no kickoff times or networks, spec 3.7). One league day becomes Thursday night, Sunday early, Sunday late, Sunday night and Monday night; marquee games (strong teams, close matchups) get the primetime slots. */
(function (root) {
  const SLOTS = ['Thursday night', 'Sunday early', 'Sunday late', 'Sunday night', 'Monday night'], CH = { 'Thursday night': 'Primetime', 'Sunday night': 'Primetime', 'Monday night': 'Primetime', 'Sunday early': 'Red Zone', 'Sunday late': 'Red Zone' };
  function slate(games, rating, H) {
    const val = g => { const a = rating[g.home] ?? 1500, b = rating[g.away] ?? 1500; return (a + b) / 2 - Math.abs(a + H - b) * 0.5; };
    const L = games.slice().sort((x, y) => val(y) - val(x) || x.gid - y.gid), out = [], n = L.length;
    const prime = n >= 6 ? ['Sunday night', 'Monday night', 'Thursday night'] : n >= 3 ? ['Sunday night', 'Monday night'] : n >= 1 ? ['Sunday night'] : [];
    prime.forEach((s, i) => { if (L[i]) out.push(Object.assign({}, L[i], { slot: s })); });
    const rest = L.slice(prime.length).sort((x, y) => x.gid - y.gid), half = Math.ceil(rest.length / 2);
    rest.forEach((g, i) => out.push(Object.assign({}, g, { slot: i < half ? 'Sunday early' : 'Sunday late' })));
    out.forEach(g => g.channel = CH[g.slot]);
    for (const s of ['Sunday early', 'Sunday late']) { const w = out.filter(g => g.slot === s).sort((x, y) => val(y) - val(x))[0]; if (w) w.featured = true; }
    return out.sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot) || (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || a.gid - b.gid);
  }
  const api = { slate, SLOTS };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMTV = api;
})(typeof self !== 'undefined' ? self : this);
