/* Pure: every game of a season grouped by day (FR-SCH-2). Header teams[0] = home; remaining rows {gid, day, homeTid, awayTid}. Returns [{day, games:[{gid, home, away, hp, ap, played, playoffs}]}] by day. */
(function (root) {
  function byDay(games, remaining, season) {
    const D = {};
    for (const g of games) {
      if (g.season !== season || g.allStar || !g.teams || g.teams.length < 2) continue;
      (D[g.day] = D[g.day] || []).push({ gid: g.gid, home: g.teams[0].tid, away: g.teams[1].tid, hp: g.teams[0].pts, ap: g.teams[1].pts, played: true, playoffs: !!g.playoffs });
    }
    for (const m of remaining || []) (D[m.day] = D[m.day] || []).push({ gid: m.gid, home: m.homeTid, away: m.awayTid, played: false, playoffs: false });
    return Object.keys(D).map(Number).sort((a, b) => a - b).map(d => ({ day: d, games: D[d].sort((a, b) => a.gid - b.gid) }));
  }
  const api = { byDay };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMLeagueSchedule = api;
})(typeof self !== 'undefined' ? self : this);
