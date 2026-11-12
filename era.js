/* Pure: era adjustment of counting records (FR-REC-2). The league grew from 20 to 32 teams and the scoring environment moves from season to season, so a raw total is not comparable across seasons.
   Method: for each season, the league production per team-game = the total of the statistic over every player (regular season) / the team-games played (sum of won + lost + tied of all teams).
   The reference is the mean of that figure over all seasons. A season's factor = reference / that season's figure; adjusted value = raw value x factor.
   It corrects the scoring environment (a 4,000-yard season in a low-passing year counts for more); it does not model the number of competitors. Rows: [{season, v}] for every player-season. */
(function (root) {
  function factors(rows, teams, key) {
    const tot = {}, tg = {};
    for (const r of rows || []) { const v = r.v && r.v[key]; if (typeof v === 'number' && isFinite(v)) tot[r.season] = (tot[r.season] || 0) + v; }
    for (const t of teams || []) for (const s of t.seasons || []) { const g = (s.won || 0) + (s.lost || 0) + (s.tied || 0); if (g) tg[s.season] = (tg[s.season] || 0) + g; }
    const env = {}, ys = Object.keys(tot).filter(y => tg[y]);
    for (const y of ys) env[y] = tot[y] / tg[y];
    const ok = ys.filter(y => env[y] > 0), ref = ok.length ? ok.reduce((a, y) => a + env[y], 0) / ok.length : 0, f = {};
    for (const y of ok) f[y] = ref / env[y];
    return { factor: f, env, ref };
  }
  const api = { factors };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMEra = api;
})(typeof self !== 'undefined' ? self : this);
