/* Pure: checks the field names the pages assume against real samples, and trims samples for a report. */
(function (root) {
  const get = (o, path) => path.split('.').reduce((a, k) => { if (a == null) return undefined; if (Array.isArray(a)) a = /^\d+$/.test(k) ? a[+k] : a[a.length - 1]; return a == null ? undefined : a[k]; }, o);
  const CHECKS = [
    ['Standings', 'team season: won, lost, cid, did', 'team', ['seasons.won', 'seasons.lost', 'seasons.cid', 'seasons.did']],
    ['Records', 'team season: playoffRoundsWon', 'team', ['seasons.playoffRoundsWon']],
    ['Team page', 'team: region, name, abbrev, colors', 'team', ['region', 'name', 'abbrev', 'colors']],
    ['Roster', 'player: names, ratings ovr/pot/pos, born.year, contract', 'player', ['firstName', 'lastName', 'ratings.ovr', 'ratings.pot', 'ratings.pos', 'born.year', 'contract.amount', 'contract.exp']],
    ['Roster', 'player: injury type and games remaining', 'player', ['injury.type', 'injury.gamesRemaining']],
    ['Player page', 'player: stats season/tid/playoffs/gp, draft, awards', 'player', ['stats.season', 'stats.tid', 'stats.playoffs', 'stats.gp', 'draft.year', 'draft.round', 'draft.pick']],
    ['Leaders', 'box row: playoffs, season, tid and a yards stat', 'box', ['playoffs', 'season', 'tid', 'pssYds|rusYds|recYds']],
    ['Schedule, Predictions', 'game header: day, team ids and points (teams[0] is assumed home)', 'game', ['day', 'teams.tid', 'teams.pts', 'allStar?', 'neutralSite?', 'playoffs?']],
    ['Fantasy', 'box row: fumbles lost', 'box', ['fmbLost?']],
    ['Cards, Player page', 'player: jersey number, Hall of Fame flag, awards', 'player', ['jerseyNumber?', 'hof?', 'awards.type?']],
    ['News', 'event: season, type, text, team ids', 'event', ['season', 'type?', 'text?', 'tids?']],
    ['Schedule, Draft', 'remaining game: gid, day, homeTid, awayTid', 'sched', ['gid', 'day', 'homeTid', 'awayTid']],
    ['Draft', 'draft pick: season, round, team', 'pick', ['season', 'round', 'tid', 'pick?', 'originalTid?']],
    ['Coaches', 'team season: owner mood', 'team', ['seasons.ownerMood?']],
    ['Cap', 'settings: salaryCap, minPayroll, luxuryPayroll', 'ga', ['salaryCap?', 'minPayroll?', 'luxuryPayroll?']],
    ['Settings', 'gameAttributes: season, phase, userTid, confs, divs', 'ga', ['season', 'phase', 'userTid', 'confs', 'divs']]];
  function run(S) {
    return CHECKS.map(([page, what, key, paths]) => {
      const o = S[key], miss = [], opt = [];
      for (const p of paths) { const q = p.endsWith('?') ? p.slice(0, -1) : p, bad = !o || !q.split('|').some(x => get(o, x) !== undefined); if (bad) (p.endsWith('?') ? opt : miss).push(q); }
      return { page, what, ok: !!o && !miss.length, missing: miss, optional: opt };
    });
  }
  function trim(o, d) { // keep structure, cut long arrays and deep nesting
    d = d || 0; if (Array.isArray(o)) return o.length > 2 ? [trim(o[o.length - 1], d + 1), '… ' + o.length + ' items'] : o.map(x => trim(x, d + 1));
    if (o && typeof o === 'object') { if (d > 3) return '{…}'; const r = {}; for (const k in o) r[k] = trim(o[k], d + 1); return r; } return o;
  }
  const api = { run, trim, CHECKS };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMDiag = api;
})(typeof self !== 'undefined' ? self : this);
