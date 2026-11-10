/* Pure: player and team stat tables from box rows and game headers. Stat keys follow the game's football keys (to be confirmed on the real save). */
(function (root) {
  const CATS = {
    Passing: { sum: ['pssCmp', 'pss', 'pssYds', 'pssTD', 'pssInt'], gate: 'pss', cols: [['pssCmp', 'Cmp'], ['pss', 'Att'], ['cmpPct', 'Cmp%'], ['pssYds', 'Yds'], ['ypa', 'Y/A'], ['pssTD', 'TD'], ['pssInt', 'Int'], ['rating', 'Rate']], sort: 'pssYds' },
    Rushing: { sum: ['rus', 'rusYds', 'rusTD', 'fmbLost'], gate: 'rus', cols: [['rus', 'Car'], ['rusYds', 'Yds'], ['ypc', 'Y/C'], ['rusTD', 'TD'], ['fmbLost', 'Fum']], sort: 'rusYds' },
    Receiving: { sum: ['tgt', 'rec', 'recYds', 'recTD'], gate: 'rec', cols: [['tgt', 'Tgt'], ['rec', 'Rec'], ['recYds', 'Yds'], ['ypr', 'Y/R'], ['recTD', 'TD']], sort: 'recYds' },
    Defense: { sum: ['defTck', 'defSk', 'defInt'], gate: null, any: ['defTck', 'defSk', 'defInt'], cols: [['defTck', 'Tck'], ['defSk', 'Sck'], ['defInt', 'Int']], sort: 'defTck' }
  };
  const clamp = v => Math.max(0, Math.min(2.375, v));
  function derive(e) {
    e.cmpPct = e.pss ? e.pssCmp / e.pss * 100 : 0; e.ypa = e.pss ? e.pssYds / e.pss : 0; e.ypc = e.rus ? e.rusYds / e.rus : 0; e.ypr = e.rec ? e.recYds / e.rec : 0;
    e.rating = e.pss ? (clamp((e.pssCmp / e.pss - 0.3) * 5) + clamp((e.pssYds / e.pss - 3) * 0.25) + clamp(e.pssTD / e.pss * 20) + clamp(2.375 - e.pssInt / e.pss * 25)) / 6 * 100 : 0;
  }
  function playerTable(rows, cat, o) {
    o = o || {}; const C = CATS[cat], m = new Map();
    for (const r of rows) {
      if (!!r.playoffs !== !!o.playoffs || (o.skip && o.skip.has(r.gid)) || (o.tid != null && r.tid !== o.tid)) continue;
      if (C.gate ? !(+r[C.gate] > 0) : !C.any.some(k => +r[k] > 0)) continue;
      const e = m.get(r.pid) || Object.assign({ pid: r.pid, tid: r.tid, gp: 0 }, ...C.sum.map(k => ({ [k]: 0 })));
      e.gp++; e.tid = r.tid; C.sum.forEach(k => e[k] += +r[k] || 0); m.set(r.pid, e);
    }
    const L = [...m.values()]; L.forEach(derive); return L.sort((a, b) => b[C.sort] - a[C.sort]);
  }
  function teamTable(games, rows, season, playoffs) {
    const T = {}, gs = new Set();
    const t = id => T[id] = T[id] || { tid: id, g: 0, w: 0, l: 0, t: 0, pf: 0, pa: 0, pssYds: 0, rusYds: 0, td: 0, to: 0, sk: 0 };
    for (const g of games) {
      if (g.season !== season || g.allStar || !!g.playoffs !== !!playoffs || !g.teams || g.teams.length < 2) continue; gs.add(g.gid);
      g.teams.forEach((x, i) => { const e = t(x.tid), o = g.teams[1 - i]; e.g++; e.pf += x.pts || 0; e.pa += o.pts || 0; x.pts > o.pts ? e.w++ : x.pts < o.pts ? e.l++ : e.t++; });
    }
    for (const r of rows) { if (!gs.has(r.gid)) continue; const e = t(r.tid); e.pssYds += +r.pssYds || 0; e.rusYds += +r.rusYds || 0; e.td += (+r.pssTD || 0) + (+r.rusTD || 0); e.to += (+r.pssInt || 0) + (+r.fmbLost || 0); e.sk += +r.defSk || 0; }
    return Object.values(T).map(e => Object.assign(e, { ppg: e.g ? e.pf / e.g : 0, papg: e.g ? e.pa / e.g : 0, diff: e.pf - e.pa, yds: e.pssYds + e.rusYds, ypg: e.g ? (e.pssYds + e.rusYds) / e.g : 0 }));
  }
  function rounds(games, season) {
    const P = games.filter(g => g.season === season && g.playoffs && !g.allStar && g.teams && g.teams.length === 2), days = [...new Set(P.map(g => g.day))].sort((a, b) => a - b);
    return days.map(d => P.filter(g => g.day === d).sort((a, b) => a.gid - b.gid));
  }
  const api = { CATS, playerTable, teamTable, rounds };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMStatsAgg = api;
})(typeof self !== 'undefined' ? self : this);
