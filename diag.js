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

  /* Team-age check: which way of averaging player ages reproduces the average age the save stores for each team season (spec open question, 8 candidates). */
  const STARTERS = { QB: 1, RB: 1, WR: 3, TE: 1, OL: 5, DL: 4, LB: 3, CB: 3, S: 3, K: 1, P: 1 };
  function teamAge(players, teams, season) {
    const key = (() => { for (const t of teams) { const s = (t.seasons || []).find(x => x.season === season); if (s) for (const k in s) if (/age/i.test(k) && typeof s[k] === 'number') return k; } return null; })();
    const by = {}; let missing = 0;
    for (const p of players) { if (p.tid == null || p.tid < 0) continue; if (!p.born || p.born.year == null) { missing++; continue; } const rs = (p.ratings || []).filter(r => r.season <= season), r = rs[rs.length - 1] || {}; (by[p.tid] = by[p.tid] || []).push({ age: season - p.born.year, ovr: r.ovr || 0, pos: r.pos }); }
    const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN, med = a => { const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length ? (b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2) : NaN; };
    const top = (L, n) => L.slice().sort((a, b) => b.ovr - a.ovr).slice(0, n);
    const starters = L => { const out = []; for (const pos in STARTERS) out.push(...L.filter(x => x.pos === pos).sort((a, b) => b.ovr - a.ovr).slice(0, STARTERS[pos])); return out; };
    const C = [['All rostered players', L => mean(L.map(x => x.age))], ['Top 22 by rating', L => mean(top(L, 22).map(x => x.age))], ['Top 32 by rating', L => mean(top(L, 32).map(x => x.age))], ['Top 46 by rating', L => mean(top(L, 46).map(x => x.age))], ['Starters (depth 25)', L => mean(starters(L).map(x => x.age))], ['Rating-weighted, all', L => { const w = L.reduce((a, x) => a + x.ovr, 0); return w ? L.reduce((a, x) => a + x.age * x.ovr, 0) / w : NaN; }], ['Median, all', L => med(L.map(x => x.age))], ['All except kickers and punters', L => mean(L.filter(x => x.pos !== 'K' && x.pos !== 'P').map(x => x.age))]];
    const res = C.map(([name, f]) => { let e = 0, n = 0; for (const t of teams) { const s = (t.seasons || []).find(x => x.season === season), L = by[t.tid]; if (!s || !L || key == null || typeof s[key] !== 'number') continue; const v = f(L); if (!isNaN(v)) { e += Math.abs(v - s[key]); n++; } } return { name, mae: n ? e / n : null, n }; });
    return { key, missingBorn: missing, candidates: res.sort((a, b) => (a.mae == null) - (b.mae == null) || a.mae - b.mae) };
  }
  function trim(o, d) { // keep structure, cut long arrays and deep nesting
    d = d || 0; if (Array.isArray(o)) return o.length > 2 ? [trim(o[o.length - 1], d + 1), '… ' + o.length + ' items'] : o.map(x => trim(x, d + 1));
    if (o && typeof o === 'object') { if (d > 3) return '{…}'; const r = {}; for (const k in o) r[k] = trim(o[k], d + 1); return r; } return o;
  }
  const api = { run, trim, CHECKS, teamAge };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMDiag = api;
})(typeof self !== 'undefined' ? self : this);
