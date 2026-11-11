/* Pure: records of conferences and divisions for one season, from game headers (regular season, all-star games excluded; teams[0] is home).
   Conference and division are those of each team's season record (DR-2). Returns { conf: [...], div: [...], matrix, cross } with
   records as [wins, losses, ties]. The matrix has the record of the row division against the column division (row first). */
(function (root) {
  const z = () => [0, 0, 0], add = (a, k) => { a[k]++; }, pct = a => (a[0] + a[1] + a[2]) ? (a[0] + a[2] / 2) / (a[0] + a[1] + a[2]) : 0;
  function build(games, teams, season, o) {
    o = o || {}; const cd = {}, T = {};
    for (const t of teams) { const s = (t.seasons || []).find(x => x.season === season); if (!s) continue; cd[t.tid] = { cid: s.cid != null ? s.cid : t.cid, did: s.did != null ? s.did : t.did }; T[t.tid] = { tid: t.tid, rec: z(), pf: 0, pa: 0 }; }
    const C = {}, D = {}, M = {}, X = { east: null };
    const ce = c => C[c] || (C[c] = { cid: c, rec: z(), pf: 0, pa: 0, inside: z(), outside: z(), teams: [] }), de = d => D[d] || (D[d] = { did: d, cid: null, rec: z(), pf: 0, pa: 0, inside: z(), outside: z(), sameConf: z(), otherConf: z(), teams: [] });
    for (const tid in cd) { const e = cd[tid]; if (e.cid != null) ce(e.cid).teams.push(+tid); if (e.did != null) { const d = de(e.did); d.cid = e.cid; d.teams.push(+tid); } }
    for (const g of games) {
      if (g.season !== season || g.allStar || g.playoffs || !g.teams || g.teams.length !== 2 || g.teams[0].pts == null || g.teams[1].pts == null) continue;
      g.teams.forEach((x, i) => {
        const q = g.teams[1 - i], a = cd[x.tid], b = cd[q.tid]; if (!a || !b) return; const k = x.pts > q.pts ? 0 : x.pts < q.pts ? 1 : 2;
        T[x.tid].rec[k]++; T[x.tid].pf += x.pts; T[x.tid].pa += q.pts;
        if (a.cid != null) { const c = ce(a.cid); add(c.rec, k); c.pf += x.pts; c.pa += q.pts; add(a.cid === b.cid ? c.inside : c.outside, k); }
        if (a.did != null) { const d = de(a.did); add(d.rec, k); d.pf += x.pts; d.pa += q.pts; add(a.did === b.did ? d.inside : d.outside, k); if (a.did !== b.did) add(a.cid === b.cid ? d.sameConf : d.otherConf, k); if (b.did != null && a.did !== b.did) { const m = (M[a.did] = M[a.did] || {}); add(m[b.did] = m[b.did] || z(), k); } }
      });
    }
    const out = { conf: Object.values(C).map(c => Object.assign(c, { pct: pct(c.rec) })).sort((a, b) => a.cid - b.cid), div: Object.values(D).map(d => Object.assign(d, { pct: pct(d.rec), inPct: pct(d.inside) })).sort((a, b) => a.cid - b.cid || a.did - b.did), matrix: M, teams: T, cd };
    return out;
  }
  /* title count per conference over all seasons: champions = [{season, tid}], team season records give the conference of that season */
  function titles(champions, teams) {
    const n = {}; for (const c of champions) { const t = teams.find(x => x.tid === c.tid), s = t && (t.seasons || []).find(x => x.season === c.season), cid = s && s.cid != null ? s.cid : t && t.cid; if (cid != null) n[cid] = (n[cid] || 0) + 1; }
    return n;
  }
  const api = { build, titles, pct };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMDivStats = api;
})(typeof self !== 'undefined' ? self : this);
