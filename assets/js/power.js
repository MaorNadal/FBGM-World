/* Pure: own power index (NOT the game's) = 60% points margin per game, 40% win percentage, as z-scores scaled to mean 50, sd 15. */
(function (root) {
  function power(games, teams, season) {
    const m = {}; teams.forEach(t => m[t.tid] = { tid: t.tid, name: ((t.region || '') + ' ' + (t.name || '')).trim(), abbrev: t.abbrev, g: 0, w: 0, l: 0, t: 0, pf: 0, pa: 0 });
    for (const g of games) {
      if (g.season !== season || g.allStar || g.playoffs || !g.teams || g.teams.length < 2) continue;
      g.teams.forEach((x, i) => { const e = m[x.tid], o = g.teams[1 - i]; if (!e) return; e.g++; e.pf += x.pts || 0; e.pa += o.pts || 0; x.pts > o.pts ? e.w++ : x.pts < o.pts ? e.l++ : e.t++; });
    }
    const R = Object.values(m).filter(e => e.g).map(e => Object.assign(e, { mpg: (e.pf - e.pa) / e.g, pct: (e.w + e.t / 2) / e.g }));
    const z = k => { const mu = R.reduce((a, e) => a + e[k], 0) / R.length, sd = Math.sqrt(R.reduce((a, e) => a + (e[k] - mu) ** 2, 0) / R.length) || 1; return e => (e[k] - mu) / sd; };
    const zm = z('mpg'), zp = z('pct'); R.forEach(e => e.power = 50 + 15 * (0.6 * zm(e) + 0.4 * zp(e)));
    return R.sort((a, b) => b.power - a.power);
  }
  const api = { power };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMPower = api;
})(typeof self !== 'undefined' ? self : this);
