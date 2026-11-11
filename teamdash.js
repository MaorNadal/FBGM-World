/* Pure: data for the team dashboard. Formation slots on a field, unit strength against the league, team leaders, recent form.
   Positions and counts follow the game's default formations (offence 1 QB, 1 RB, 3 WR, 1 TE, 5 OL; defence 4 DL, 3 LB, 2 CB, 2 S). */
(function (root) {
  /* x and y are percent of the field box; the line of scrimmage is at about y = 51; defence is drawn above it, offence below */
  const SLOTS = {
    DL: [[26, 45], [42, 45], [58, 45], [74, 45]], LB: [[28, 34], [50, 34], [72, 34]], CB: [[8, 22], [92, 22]], S: [[36, 11], [64, 11]],
    OL: [[22, 60], [34, 60], [46, 60], [58, 60], [70, 60]], TE: [[82, 60]], WR: [[7, 61], [94, 63], [22, 72]], QB: [[46, 72]], RB: [[46, 84]], K: [[12, 92]], P: [[88, 92]]
  };
  const SIDE = { DL: 'D', LB: 'D', CB: 'D', S: 'D', OL: 'O', TE: 'O', WR: 'O', QB: 'O', RB: 'O', K: 'S', P: 'S' };
  const UNITS = [['QB', ['QB'], 1], ['Skill', ['RB', 'WR', 'TE'], 5], ['Offensive line', ['OL'], 5], ['Front seven', ['DL', 'LB'], 7], ['Secondary', ['CB', 'S'], 4], ['Special teams', ['K', 'P'], 2]];
  const PI = root.FBGMPlayerInfo || (typeof require !== 'undefined' ? require('./pinfo.js') : null);
  const lastRating = (p, season) => PI.ratingAt(p, season) || {};

  /* roster rows of one team (position = the rating position at the season) */
  function rosterOf(players, tid, season) {
    return players.filter(p => p.tid === tid).map(p => { const r = lastRating(p, season), inj = p.injury && p.injury.gamesRemaining > 0 ? p.injury : null; return { pid: p.pid, name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim(), last: p.lastName || '', pos: PI.pos(p, season, r), ovr: PI.ovr(p, season, r), pot: PI.pot(p, season, r), age: PI.age(p, season), country: PI.country(p).name, iso: PI.country(p).iso, college: PI.college(p), amount: p.contract ? p.contract.amount : null, exp: p.contract ? p.contract.exp : null, injury: inj ? (inj.type || 'Injured') + ' (' + inj.gamesRemaining + ')' : '', hurt: !!inj, face: p.face, jersey: p.jerseyNumber, player: p }; });
  }
  /* filled slots; depth = team.depth ({ QB: [pid, ...], ... }) when valid, otherwise the best players at the position */
  function formation(roster, depth) {
    const by = {}, pid = {}; roster.forEach(r => { pid[r.pid] = r; (by[r.pos] = by[r.pos] || []).push(r); }); for (const k in by) by[k].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
    const out = [], used = new Set(); let fromDepth = 0, fallback = 0;
    for (const pos in SLOTS) {
      const want = SLOTS[pos].length, list = [];
      const d = depth && Array.isArray(depth[pos]) ? depth[pos] : null;
      if (d) for (const id of d) { const r = pid[id]; if (r && !used.has(r.pid) && !list.includes(r)) { list.push(r); if (list.length === want) break; } }
      fromDepth += list.length;
      for (const r of by[pos] || []) { if (list.length >= want) break; if (!used.has(r.pid) && !list.includes(r)) { list.push(r); fallback++; } }
      list.forEach(r => used.add(r.pid));
      SLOTS[pos].forEach((xy, i) => out.push({ slot: pos + (want > 1 ? i + 1 : ''), pos, side: SIDE[pos], x: xy[0], y: xy[1], p: list[i] || null }));
    }
    return { slots: out, fromDepth, fallback };
  }
  /* strength of each unit for every team: average rating of the top n players of the unit; rank 1 = strongest */
  function unitStrength(players, season) {
    const by = {}; for (const p of players) { if (p.tid == null || p.tid < 0) continue; const r = lastRating(p, season); if (r.ovr == null) continue; ((by[p.tid] = by[p.tid] || {})[r.pos] = (by[p.tid][r.pos] || [])).push(r.ovr); }
    const val = {}; for (const t in by) { val[t] = {}; for (const [name, pos, n] of UNITS) { const L = [].concat(...pos.map(q => by[t][q] || [])).sort((a, b) => b - a).slice(0, n); val[t][name] = L.length ? L.reduce((a, b) => a + b, 0) / L.length : null; } }
    const res = {}, tids = Object.keys(val);
    for (const t of tids) { res[t] = {}; for (const [name] of UNITS) { const v = val[t][name], all = tids.map(x => val[x][name]).filter(x => x != null); res[t][name] = { v, rank: v == null ? null : all.filter(x => x > v).length + 1, of: all.length, avg: all.length ? all.reduce((a, b) => a + b, 0) / all.length : null }; } }
    return res;
  }
  /* best players of the team in the main stat categories for the season */
  function leaders(players, tid, season, M) {
    const rows = M.playerRows(players.filter(p => p.tid === tid), season, false), cats = [['Passing yards', 'pssYds'], ['Rushing yards', 'rusYds'], ['Receiving yards', 'recYds'], ['Tackles', 'tck'], ['Sacks', 'sk'], ['Interceptions', 'dint']], out = [];
    for (const [label, k] of cats) { const r = rows.filter(x => x.v[k] != null && x.v[k] > 0).sort((a, b) => b.v[k] - a.v[k])[0]; if (r) out.push({ label, k, value: r.v[k], name: r.name, pid: r.pid, pos: r.pos, face: r.face, player: r.player }); }
    return out;
  }
  /* last results and the record, from the team's played games of the season (all-star games excluded) */
  function form(games, tid, season, n) {
    const L = games.filter(g => g.season === season && !g.allStar && g.teams && g.teams.length === 2 && g.teams.some(t => t.tid === tid)).sort((a, b) => (a.day || 0) - (b.day || 0) || a.gid - b.gid);
    return L.slice(-(n || 5)).map(g => { const i = g.teams.findIndex(t => t.tid === tid), me = g.teams[i], op = g.teams[1 - i]; return { gid: g.gid, opp: op.tid, home: i === 0, pf: me.pts, pa: op.pts, res: me.pts > op.pts ? 'W' : me.pts < op.pts ? 'L' : 'T', po: !!g.playoffs }; });
  }
  /* win percentage per season, with the playoff result, from the team's season records */
  function seasonsOf(t) {
    return (t.seasons || []).map(s => ({ season: s.season, w: s.won || 0, l: s.lost || 0, t: s.tied || 0, po: s.playoffRoundsWon })).filter(s => s.w + s.l + s.t > 0).sort((a, b) => a.season - b.season).map(s => Object.assign(s, { pct: (s.w + s.t / 2) / (s.w + s.l + s.t) }));
  }
  const api = { SLOTS, UNITS, rosterOf, formation, unitStrength, leaders, form, seasonsOf, lastRating };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMTeamDash = api;
})(typeof self !== 'undefined' ? self : this);
