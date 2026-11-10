/* Pure: one team's results and remaining games. Assumes header teams[0] = home, teams[1] = away; schedule rows {gid, day, homeTid, awayTid}. */
(function (root) {
  function schedule(games, remaining, tid, season) {
    const rows = [];
    for (const g of games) {
      if (g.season !== season || g.allStar || !g.teams || g.teams.length < 2) continue;
      const i = g.teams.findIndex(t => t.tid === tid); if (i < 0) continue;
      const me = g.teams[i], op = g.teams[1 - i], pf = me.pts, pa = op.pts;
      rows.push({ gid: g.gid, day: g.day, playoffs: !!g.playoffs, home: i === 0, opp: op.tid, played: true, pf, pa, res: pf > pa ? 'W' : pf < pa ? 'L' : 'T' });
    }
    for (const m of remaining || []) if (m.homeTid === tid || m.awayTid === tid) rows.push({ gid: m.gid, day: m.day, playoffs: false, home: m.homeTid === tid, opp: m.homeTid === tid ? m.awayTid : m.homeTid, played: false });
    rows.sort((a, b) => (a.day || 0) - (b.day || 0) || a.gid - b.gid);
    let w = 0, l = 0, t = 0; rows.forEach(r => { if (r.played && !r.playoffs) { r.res === 'W' ? w++ : r.res === 'L' ? l++ : t++; r.rec = w + '-' + l + (t ? '-' + t : ''); } });
    return rows;
  }
  const api = { schedule };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMSchedule = api;
})(typeof self !== 'undefined' ? self : this);
