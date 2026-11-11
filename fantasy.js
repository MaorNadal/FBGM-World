/* Standard fantasy scoring (spec appendix A, Confirmed): 0.04 per pass yard, 4 per pass TD, -2 per interception, 0.1 per rush and receiving yard, 6 per rush and receiving TD, -2 per fumble lost. */
(function (root) {
  const poOk = (a, m) => m === 'both' || m === 2 || m === '2' || !!a === !!m;
  const W = { pssYds: 0.04, pssTD: 4, pssInt: -2, rusYds: 0.1, rusTD: 6, recYds: 0.1, recTD: 6, fmbLost: -2 };
  const pts = r => { let s = 0; for (const k in W) s += (+r[k] || 0) * W[k]; return s; };
  function season(rows, playoffs, skip) {
    const m = new Map();
    for (const r of rows) { if (!poOk(r.playoffs, playoffs) || (skip && skip.has(r.gid))) continue; const p = pts(r); if (!p && !Object.keys(W).some(k => r[k])) continue; const e = m.get(r.pid) || { pid: r.pid, tid: r.tid, pts: 0, gp: 0, best: -1e9 }; e.pts += p; e.gp++; e.tid = r.tid; e.best = Math.max(e.best, p); m.set(r.pid, e); }
    return [...m.values()].map(e => Object.assign(e, { ppg: e.pts / e.gp })).sort((a, b) => b.pts - a.pts);
  }
  function games(rows, dayOf, playoffs, skip) {
    const L = []; for (const r of rows) { if (!poOk(r.playoffs, playoffs) || (skip && skip.has(r.gid))) continue; const p = pts(r); if (p) L.push({ pid: r.pid, tid: r.tid, gid: r.gid, day: dayOf[r.gid], pts: p }); }
    return L.sort((a, b) => b.pts - a.pts);
  }
  const api = { W, pts, season, games };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMFantasy = api;
})(typeof self !== 'undefined' ? self : this);
