/* Pure: division and conference honours of every season, and totals per franchise (needs tiebreak.js).
   Division champion: the team that ranks first in its division by record under the league's tiebreakers (regular season).
   Conference champion, regular season: the best record of the conference under the same tiebreakers.
   Conference champion, playoffs: in a league whose playoff field is one pool there is no conference bracket, so this is the team of the conference that went furthest
   in the playoffs (most playoff wins; level: better regular-season record). The league champion is the winner of the last playoff game.
   A season that has no playoff games yet shows the regular-season honours as provisional (current: true). */
(function (root) {
  const TB = root.FBGMTiebreak || (typeof require !== 'undefined' ? require('./tiebreak.js') : null);
  /* o: { confs, divs, tiebreakers } as resolved for the season */
  function season(games, teams, y, o, current) {
    const cfs = o.confs || [], base = { confs: cfs, divs: o.divs || [], nPlayoff: 1, byes: 0, tiebreakers: o.tiebreakers };
    const whole = TB.seeds(games, teams, y, Object.assign({}, base, { byConf: false, divFirst: false }))[0], C = TB.build(games, teams, y);
    const division = (whole ? whole.divisions : []).filter(d => d.order.length).map(d => { const t = d.order[0].tid; return { did: d.did, name: d.name, cid: C.cd[t] ? C.cd[t].cid : null, tid: t, rec: C.R[t].rec, why: d.order[1] ? d.order[0].why : '' }; });
    let conf = [];
    if (cfs.length) {
      const bc = TB.seeds(games, teams, y, Object.assign({}, base, { byConf: true, divFirst: false }));
      conf = bc.map(c => ({ cid: c.cid, name: c.name, best: c.seeds[0] ? { tid: c.seeds[0].tid, rec: c.seeds[0].rec } : null, playoff: null }));
    }
    const po = games.filter(g => g.season === y && g.playoffs && !g.allStar && g.teams && g.teams.length === 2 && g.teams[0].pts != null);
    const wins = {}, inPo = new Set(); let fin = null;
    for (const g of po) { g.teams.forEach(t => inPo.add(t.tid)); if (g.teams[0].pts !== g.teams[1].pts) { const w = g.teams[0].pts > g.teams[1].pts ? g.teams[0] : g.teams[1]; wins[w.tid] = (wins[w.tid] || 0) + 1; } if (!fin || (g.day || 0) > (fin.day || 0) || ((g.day || 0) === (fin.day || 0) && g.gid > fin.gid)) fin = g; }
    for (const c of conf) {
      const L = [...inPo].filter(t => C.cd[t] && C.cd[t].cid === c.cid).sort((a, b) => (wins[b] || 0) - (wins[a] || 0) || TB.pct(C.R[b].rec) - TB.pct(C.R[a].rec) || a - b);
      if (L.length) c.playoff = { tid: L[0], wins: wins[L[0]] || 0 };
    }
    let champion = null; if (fin && !current && fin.teams[0].pts !== fin.teams[1].pts) { const [a, b] = fin.teams, w = a.pts > b.pts ? a : b, l = w === a ? b : a; champion = { tid: w.tid, opp: l.tid, score: [w.pts, l.pts], gid: fin.gid }; }
    return { season: y, division, conf, champion, current: !!current, played: po.length > 0 };
  }
  /* seasons: list of years; optFn(y) -> options; currentYear: the season in progress or null */
  function all(games, teams, seasons, optFn, currentYear) { return seasons.map(y => season(games, teams, y, optFn(y), y === currentYear)); }
  /* per franchise (team id): counts over all seasons; the current season counts only when it already has playoff games */
  function franchises(H) {
    const F = {}, e = t => F[t] || (F[t] = { tid: t, div: 0, confSeason: 0, confPlayoff: 0, titles: 0, finals: 0, divYears: [], confYears: [], playoffConfYears: [], titleYears: [] });
    for (const h of H) {
      for (const d of h.division) { if (h.current && !h.played) continue; const x = e(d.tid); x.div++; x.divYears.push(h.season); }
      for (const c of h.conf) {
        if (c.best && !(h.current && !h.played)) { const x = e(c.best.tid); x.confSeason++; x.confYears.push(h.season); }
        if (c.playoff && h.champion) { const x = e(c.playoff.tid); x.confPlayoff++; x.playoffConfYears.push(h.season); }
      }
      if (h.champion) { const a = e(h.champion.tid), b = e(h.champion.opp); a.titles++; a.titleYears.push(h.season); b.finals++; a.finals++; }
    }
    return F;
  }
  const api = { season, all, franchises };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMHonors = api;
})(typeof self !== 'undefined' ? self : this);
