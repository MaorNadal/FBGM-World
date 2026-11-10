/* Pure: head-to-head records between teams and the franchise table, from game headers (all-star games excluded; teams[0] is home).
   Rivalry heat is this app's own index: many meetings, even records, close margins and playoff games. */
(function (root) {
  const key = (a, b) => a < b ? a + '-' + b : b + '-' + a;
  function pairs(games) {
    const P = {}, G = games.filter(g => !g.allStar && g.teams && g.teams.length === 2 && g.teams[0].pts != null && g.teams[1].pts != null && g.teams[0].tid >= 0 && g.teams[1].tid >= 0).sort((x, y) => x.season - y.season || (x.day || 0) - (y.day || 0) || x.gid - y.gid);
    for (const g of G) {
      const [h, a] = g.teams, lo = Math.min(h.tid, a.tid), hi = Math.max(h.tid, a.tid), e = P[key(lo, hi)] || (P[key(lo, hi)] = { a: lo, b: hi, g: 0, wa: 0, wb: 0, t: 0, pfa: 0, pfb: 0, po: 0, margin: 0, last: [] });
      const pa = h.tid === lo ? h.pts : a.pts, pb = h.tid === lo ? a.pts : h.pts;
      e.g++; e.pfa += pa; e.pfb += pb; e.margin += Math.abs(pa - pb); if (g.playoffs) e.po++;
      const w = pa > pb ? 'a' : pa < pb ? 'b' : 't'; w === 'a' ? e.wa++ : w === 'b' ? e.wb++ : e.t++;
      e.last.push({ gid: g.gid, season: g.season, w, pa, pb, po: !!g.playoffs });
    }
    for (const k in P) {
      const e = P[k], L = e.last, last = L[L.length - 1]; let n = 0; for (let i = L.length - 1; i >= 0 && L[i].w === last.w; i--) n++;
      e.streak = { who: last.w, n }; e.close = e.margin / e.g; e.recent = L.slice(-5);
      const bal = 1 - Math.abs(e.wa - e.wb) / Math.max(1, e.wa + e.wb); e.heat = e.g * (0.4 + 0.6 * bal) * (1 + e.po * 0.15) / (1 + e.close / 14);
    }
    return P;
  }
  /* the pair seen from team tid: { opp, g, w, l, t, pf, pa, ... } */
  function view(e, tid) {
    const me = e.a === tid; return { opp: me ? e.b : e.a, g: e.g, w: me ? e.wa : e.wb, l: me ? e.wb : e.wa, t: e.t, pf: me ? e.pfa : e.pfb, pa: me ? e.pfb : e.pfa, po: e.po, close: e.close, heat: e.heat, streakWho: e.streak.who === 't' ? 't' : (e.streak.who === 'a') === me ? 'w' : 'l', streakN: e.streak.n, recent: e.recent.map(r => ({ gid: r.gid, season: r.season, po: r.po, res: r.w === 't' ? 'T' : (r.w === 'a') === me ? 'W' : 'L', pf: me ? r.pa : r.pb, pa: me ? r.pb : r.pa })) };
  }
  function vs(P, tid) { return Object.values(P).filter(e => e.a === tid || e.b === tid).map(e => view(e, tid)); }
  /* one row per franchise: seasons, record, playoffs, finals, titles, best-record seasons, names */
  function franchises(teams, games, current) {
    const fin = {}, bySeason = {};
    for (const g of games) { if (g.allStar || !g.playoffs || !g.teams || g.teams.length !== 2) continue; const e = fin[g.season]; if (!e || (g.day || 0) > (e.day || 0) || ((g.day || 0) === (e.day || 0) && g.gid > e.gid)) fin[g.season] = g; }
    const rows = teams.map(t => { const r = { tid: t.tid, name: ((t.region || '') + ' ' + (t.name || '')).trim(), names: [], seasons: 0, w: 0, l: 0, t: 0, po: 0, finals: 0, titles: 0, best: 0, titleYears: [], bestPct: 0, bestYear: null, first: null, last: null };
      for (const s of (t.seasons || [])) { const g = (s.won || 0) + (s.lost || 0) + (s.tied || 0); if (!g) continue; const nm = ((s.region || t.region || '') + ' ' + (s.name || t.name || '')).trim(); if (!r.names.includes(nm)) r.names.push(nm);
        r.seasons++; r.w += s.won || 0; r.l += s.lost || 0; r.t += s.tied || 0; if (s.playoffRoundsWon >= 0) r.po++; const pct = ((s.won || 0) + (s.tied || 0) / 2) / g; if (pct > r.bestPct) { r.bestPct = pct; r.bestYear = s.season; }
        r.first = r.first == null ? s.season : Math.min(r.first, s.season); r.last = r.last == null ? s.season : Math.max(r.last, s.season); (bySeason[s.season] = bySeason[s.season] || []).push({ tid: t.tid, pct, w: s.won || 0 }); }
      return r; });
    const by = Object.fromEntries(rows.map(r => [r.tid, r]));
    for (const y in bySeason) { const L = bySeason[y], mx = Math.max(...L.map(x => x.pct)); L.filter(x => x.pct === mx).forEach(x => by[x.tid].best++); }
    for (const y in fin) { const g = fin[y]; if (+y === current) continue; /* the current season is not counted until it is over */ g.teams.forEach(x => { if (by[x.tid]) by[x.tid].finals++; }); const w = g.teams[0].pts > g.teams[1].pts ? g.teams[0].tid : g.teams[1].pts > g.teams[0].pts ? g.teams[1].tid : null; if (w != null && by[w]) { by[w].titles++; by[w].titleYears.push(+y); } }
    rows.forEach(r => { r.pct = (r.w + r.t / 2) / Math.max(1, r.w + r.l + r.t); r.titleYears.sort((a, b) => a - b); });
    return rows;
  }
  /* one entry per season: number of teams, teams that joined or left, renames, champion with the final score, best record */
  function seasonsInfo(teams, games, current) {
    const name = (t, s) => ((s.region || t.region || '') + ' ' + (s.name || t.name || '')).trim(), by = {}, fin = {};
    for (const g of games) { if (g.allStar || !g.playoffs || !g.teams || g.teams.length !== 2) continue; const e = fin[g.season]; if (!e || (g.day || 0) > (e.day || 0) || ((g.day || 0) === (e.day || 0) && g.gid > e.gid)) fin[g.season] = g; }
    for (const t of teams) for (const s of (t.seasons || [])) { if (((s.won || 0) + (s.lost || 0) + (s.tied || 0)) === 0) continue; const e = by[s.season] = by[s.season] || { season: s.season, list: [] }; e.list.push({ tid: t.tid, name: name(t, s), pct: ((s.won || 0) + (s.tied || 0) / 2) / ((s.won || 0) + (s.lost || 0) + (s.tied || 0)), w: s.won || 0, l: s.lost || 0, t: s.tied || 0 }); }
    const years = Object.keys(by).map(Number).sort((a, b) => a - b), out = []; let prev = null;
    for (const y of years) {
      const L = by[y].list, ids = new Set(L.map(x => x.tid)), pids = prev ? new Set(prev.list.map(x => x.tid)) : new Set(), pn = prev ? Object.fromEntries(prev.list.map(x => [x.tid, x.name])) : {};
      const best = L.slice().sort((a, b) => b.pct - a.pct || b.w - a.w)[0], g = fin[y]; let champ = null;
      if (g && y !== current) { const [a, b] = g.teams; if (a.pts !== b.pts) { const w = a.pts > b.pts ? a : b, l = w === a ? b : a; champ = { tid: w.tid, opp: l.tid, score: [w.pts, l.pts], gid: g.gid }; } }
      out.push({ season: y, teams: L.length, added: prev ? [...ids].filter(t => !pids.has(t)) : [], removed: prev ? [...pids].filter(t => !ids.has(t)) : [], renamed: prev ? L.filter(x => pn[x.tid] && pn[x.tid] !== x.name).map(x => ({ tid: x.tid, from: pn[x.tid], to: x.name })) : [], champion: champ, best, current: y === current });
      prev = by[y];
    }
    return out;
  }
  const api = { pairs, view, vs, franchises, seasonsInfo };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMRivals = api;
})(typeof self !== 'undefined' ? self : this);
