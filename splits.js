/* Pure: standings detail derived from game headers (regular season, all-star games excluded; teams[0] is home).
   Home, road, division and conference records, points for and against, current streak, last ten. Division and conference are those of the team's season record. */
(function (root) {
  function splits(games, teams, season) {
    const cd = {}; for (const t of teams) { const s = (t.seasons || []).find(x => x.season === season); if (s) cd[t.tid] = { cid: s.cid != null ? s.cid : t.cid, did: s.did != null ? s.did : t.did }; }
    const G = games.filter(g => g.season === season && !g.allStar && !g.playoffs && g.teams && g.teams.length === 2 && g.teams[0].pts != null && g.teams[1].pts != null).sort((a, b) => (a.day || 0) - (b.day || 0) || a.gid - b.gid);
    const R = {}, e = t => R[t] || (R[t] = { home: [0, 0, 0], road: [0, 0, 0], div: [0, 0, 0], conf: [0, 0, 0], pf: 0, pa: 0, seq: [] });
    for (const g of G) g.teams.forEach((x, i) => {
      const o = g.teams[1 - i], r = e(x.tid), k = x.pts > o.pts ? 0 : x.pts < o.pts ? 1 : 2, a = cd[x.tid], b = cd[o.tid];
      r[i === 0 ? 'home' : 'road'][k]++; if (a && b && a.did != null && a.did === b.did) r.div[k]++; if (a && b && a.cid != null && a.cid === b.cid) r.conf[k]++;
      r.pf += x.pts; r.pa += o.pts; r.seq.push(k);
    });
    for (const t in R) {
      const r = R[t], q = r.seq; let n = 0; const last = q[q.length - 1];
      for (let i = q.length - 1; i >= 0 && q[i] === last; i--) n++;
      r.streak = q.length ? (last === 0 ? 'W' : last === 1 ? 'L' : 'T') + n : '';
      const l10 = [0, 0, 0]; q.slice(-10).forEach(k => l10[k]++); r.l10 = l10; delete r.seq;
    }
    return R;
  }
  const api = { splits };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMSplits = api;
})(typeof self !== 'undefined' ? self : this);
