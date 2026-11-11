/* Pure: the league's championship games ("Super Bowl") with history, records and franchise totals.
   Input: the season honours of honors.js (champion {tid, opp, score, gid} per season), the teams (season records) and the games. Nothing is invented:
   the game number is the order of the finals found in the save (the first stored final is I), a final whose winner is unknown is not listed. */
(function (root) {
  const ROM = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  const roman = n => { let s = ''; for (const [v, r] of ROM) while (n >= v) { s += r; n -= v; } return s; };
  const pct = (w, l, t) => (w + l + t) ? (w + t / 2) / (w + l + t) : 0;
  function list(H, teams, games) {
    const T = Object.fromEntries(teams.map(t => [t.tid, t])), G = Object.fromEntries((games || []).map(g => [g.gid, g]));
    const rec = (tid, y) => { const s = ((T[tid] || {}).seasons || []).find(x => x.season === y); return s ? { w: s.won || 0, l: s.lost || 0, t: s.tied || 0, cid: s.cid, did: s.did } : null; };
    const rows = []; let prev = null; const titles = {};
    for (const h of H.filter(x => x.champion).sort((a, b) => a.season - b.season)) {
      const c = h.champion, W = rec(c.tid, h.season), L = rec(c.opp, h.season), all = teams.map(t => rec(t.tid, h.season)).filter(Boolean).map(r => pct(r.w, r.l, r.t)).sort((a, b) => b - a);
      const rk = r => r ? 1 + all.filter(p => p > pct(r.w, r.l, r.t) + 1e-9).length : null, g = G[c.gid];
      titles[c.tid] = (titles[c.tid] || 0) + 1;
      rows.push({ n: rows.length + 1, no: roman(rows.length + 1), season: h.season, gid: c.gid, w: c.tid, l: c.opp, ws: c.score[0], ls: c.score[1], margin: c.score[0] - c.score[1], total: c.score[0] + c.score[1],
        ot: !!(g && (g.overtimes > 0 || (g.teams && g.teams[0].ptsQtrs && g.teams[0].ptsQtrs.length > 4))), g, wRec: W, lRec: L, wRank: rk(W), lRank: rk(L), wPct: W ? pct(W.w, W.l, W.t) : null, lPct: L ? pct(L.w, L.l, L.t) : null,
        sameConf: !!(W && L && W.cid != null && W.cid === L.cid), confs: [W && W.cid, L && L.cid], titleNo: titles[c.tid], first: titles[c.tid] === 1, repeat: !!(prev && prev.w === c.tid), bestRecord: !!(W && rk(W) === 1), favourite: !!(W && L && pct(W.w, W.l, W.t) >= pct(L.w, L.l, L.t)) });
      prev = rows[rows.length - 1];
    }
    return rows;
  }
  /* per franchise (team id) */
  function franchises(rows, lastSeason) {
    const F = {}, e = t => F[t] || (F[t] = { tid: t, titles: 0, losses: 0, apps: 0, wYears: [], lYears: [], best: 0, streak: 0, firstApp: null, lastApp: null, margin: 0 });
    for (const r of rows) { const a = e(r.w), b = e(r.l); a.titles++; a.apps++; a.wYears.push(r.season); a.margin += r.margin; b.losses++; b.apps++; b.lYears.push(r.season); b.margin -= r.margin; for (const x of [a, b]) { if (x.firstApp == null) x.firstApp = r.season; x.lastApp = r.season; } }
    for (const t in F) { const f = F[t], y = f.wYears; let run = 0, best = 0, prev = null; for (const s of y) { run = prev != null && rows.some(r => r.season === s - 1 && r.w === +t) ? run + 1 : 1; best = Math.max(best, run); prev = s; } f.streak = best; f.pct = f.apps ? f.titles / f.apps : 0; f.since = f.wYears.length && lastSeason != null ? lastSeason - f.wYears[f.wYears.length - 1] : null; f.neverWon = !f.titles; }
    return F;
  }
  /* league-wide records and special statistics */
  function records(rows) {
    if (!rows.length) return null; const by = (f, hi) => rows.reduce((b, r) => (b == null || (hi ? f(r) > f(b) : f(r) < f(b))) ? r : b, null), n = rows.length, F = franchises(rows), fl = Object.values(F);
    const pairs = {}; rows.forEach(r => { const k = [r.w, r.l].sort((a, b) => a - b).join('-'); pairs[k] = (pairs[k] || 0) + 1; });
    const rem = Object.keys(pairs).filter(k => pairs[k] > 1).map(k => ({ tids: k.split('-').map(Number), n: pairs[k] })).sort((a, b) => b.n - a.n);
    const ranked = rows.filter(r => r.wRank != null);
    return { count: n, blowout: by(r => r.margin, true), closest: by(r => r.margin, false), highest: by(r => r.total, true), lowest: by(r => r.total, false), avgMargin: rows.reduce((a, r) => a + r.margin, 0) / n, avgTotal: rows.reduce((a, r) => a + r.total, 0) / n,
      ot: rows.filter(r => r.ot).length, oneScore: rows.filter(r => r.margin <= 8).length, bestRecordWon: ranked.filter(r => r.bestRecord).length, favouriteWon: rows.filter(r => r.wPct != null && r.lPct != null && r.wPct !== r.lPct).filter(r => r.favourite).length, decidedOnPct: rows.filter(r => r.wPct != null && r.lPct != null && r.wPct !== r.lPct).length,
      upset: ranked.reduce((b, r) => (b == null || r.wRank > b.wRank) ? r : b, null), sameConf: rows.filter(r => r.sameConf).length, repeats: rows.filter(r => r.repeat).length, firstTimers: rows.filter(r => r.first).length,
      dynasty: fl.reduce((b, f) => (b == null || f.streak > b.streak) ? f : b, null), mostApps: fl.reduce((b, f) => (b == null || f.apps > b.apps) ? f : b, null), mostTitles: fl.reduce((b, f) => (b == null || f.titles > b.titles) ? f : b, null),
      neverWon: fl.filter(f => f.neverWon).sort((a, b) => b.losses - a.losses), rematches: rem, winners: fl.filter(f => f.titles).length, finalists: fl.length };
  }
  /* the championship game of every season straight from the game headers: the last playoff game (latest day, then highest id) with a winner.
     skipSeason: a season whose playoffs are not over yet. Returns { gid: { season, w, l, ws, ls } } */
  function finalGames(games, skipSeason) {
    const last = {};
    for (const g of games) { if (g.allStar || !g.playoffs || !g.teams || g.teams.length !== 2 || g.teams[0].pts == null || g.season === skipSeason) continue; const e = last[g.season]; if (!e || (g.day || 0) > (e.day || 0) || ((g.day || 0) === (e.day || 0) && g.gid > e.gid)) last[g.season] = g; }
    const out = {};
    for (const y in last) { const g = last[y], [a, b] = g.teams; if (a.pts === b.pts) continue; const w = a.pts > b.pts ? a : b, l = w === a ? b : a; out[g.gid] = { season: +y, w: w.tid, l: l.tid, ws: w.pts, ls: l.pts }; }
    return out;
  }
  /* best single-game values over box rows (rows of final games): [{pid, v, gid, tid, season}] */
  function single(rows, fields, n, byGid) {
    const L = []; for (const r of rows) { let v = 0; for (const f of fields) v += +r[f] || 0; if (v) L.push({ pid: r.pid, v, gid: r.gid, tid: r.tid, season: r.season != null ? r.season : (byGid && byGid[r.gid] ? byGid[r.gid].season : null) }); }
    return L.sort((a, b) => b.v - a.v || (b.season || 0) - (a.season || 0)).slice(0, n);
  }
  /* appearances, wins and losses of each player over box rows of final games */
  function players(rows, byGid) {
    const m = new Map();
    for (const r of rows) { const f = byGid[r.gid]; if (!f) continue; const e = m.get(r.pid) || { pid: r.pid, apps: 0, wins: 0, losses: 0, years: [], tid: r.tid }; e.apps++; if (r.tid === f.w) e.wins++; else e.losses++; e.years.push(f.season); e.tid = r.tid; m.set(r.pid, e); }
    return [...m.values()].sort((a, b) => b.wins - a.wins || b.apps - a.apps);
  }
  const api = { roman, list, franchises, records, pct, finalGames, single, players };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMFinals = api;
})(typeof self !== 'undefined' ? self : this);
