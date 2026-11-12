/* Pure: injury history of the whole league (FR-ST-11). Rows: [{pid, name, pos, list:[{season, type, games, tid}]}]; one list entry per injury as the save stores it (player.injuries).
   aggregate(rows, season) -> totals, by type, by team, by season, the longest injuries and the most injured players; season null = every season. */
(function (root) {
  const top = (m, n, key) => Object.entries(m).map(([k, v]) => Object.assign({ k }, v)).sort((a, b) => b[key] - a[key] || b.n - a.n).slice(0, n);
  function aggregate(rows, season) {
    const type = {}, team = {}, ses = {}, long = [], per = {}; let n = 0, games = 0;
    for (const r of rows || []) for (const x of r.list || []) {
      if (!x || x.games == null) continue; const g = +x.games || 0;
      (ses[x.season] = ses[x.season] || { n: 0, games: 0 }); ses[x.season].n++; ses[x.season].games += g;
      if (season != null && x.season !== season) continue;
      n++; games += g; const t = x.type || 'Unknown';
      (type[t] = type[t] || { n: 0, games: 0 }); type[t].n++; type[t].games += g;
      if (x.tid != null && x.tid >= 0) { (team[x.tid] = team[x.tid] || { n: 0, games: 0 }); team[x.tid].n++; team[x.tid].games += g; }
      long.push({ pid: r.pid, name: r.name, pos: r.pos, season: x.season, type: t, games: g, tid: x.tid });
      (per[r.pid] = per[r.pid] || { n: 0, games: 0, name: r.name, pos: r.pos }); per[r.pid].n++; per[r.pid].games += g;
    }
    long.sort((a, b) => b.games - a.games || a.pid - b.pid);
    return { n, games, avg: n ? games / n : 0, type: top(type, 12, 'n'), team: top(team, 40, 'n'), seasons: Object.keys(ses).map(Number).sort((a, b) => a - b).map(y => Object.assign({ season: y }, ses[y])), longest: long.slice(0, 15), players: top(per, 15, 'n') };
  }
  const api = { aggregate };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMInjStats = api;
})(typeof self !== 'undefined' ? self : this);
