/* Pure: team metrics beyond the drive view, for Next Gen Stats (FR-NGS). From the season counters of a team (team.stats row of the season, regular season): defence per drive, special teams, discipline and ball security.
   A row s has the offence counters (pts, drives, pss, pssYds, rus, rusYds, pssTD, rusTD, pssInt, fmbLost, pen, penYds, fg0..fg50, fga0..fga50, xp, xpa, pnt, pntYds, pntIn20, pntTB, kr, krYds, krTD, pr, prYds, prTD, defSk, defInt, defPssDef, defFmbFrc, defFmbRec, gp)
   and the same for the opponent with the prefix opp (oppPts, oppDrives, oppPssYds, ...). Metrics return null when a counter is missing or a divisor is zero. */
(function (root) {
  const n = v => typeof v === 'number' && isFinite(v) ? v : null, sum = (s, ...k) => k.reduce((a, x) => a + (+s[x] || 0), 0), div = (a, b) => b ? a / b : null;
  const FG = ['fg0', 'fg20', 'fg30', 'fg40', 'fg50'], FGA = ['fga0', 'fga20', 'fga30', 'fga40', 'fga50'];
  /* k, label, group, decimals, better (high or low), the formula */
  const METRICS = [
    ['dpts', 'Points allowed per drive', 'Defence', 2, 'low', s => div(s.oppPts, s.oppDrives)],
    ['dyds', 'Yards allowed per drive', 'Defence', 1, 'low', s => div(sum(s, 'oppPssYds', 'oppRusYds'), s.oppDrives)],
    ['dsc', 'Opponent scoring drives (TD per drive, %)', 'Defence', 1, 'low', s => { const v = div(sum(s, 'oppPssTD', 'oppRusTD'), s.oppDrives); return v == null ? null : v * 100; }],
    ['dypp', 'Yards allowed per play', 'Defence', 2, 'low', s => div(sum(s, 'oppPssYds', 'oppRusYds'), sum(s, 'oppPss', 'oppRus', 'oppPssSk'))],
    ['dpass', 'Passing yards allowed per game', 'Defence', 1, 'low', s => div(s.oppPssYds, s.gp)],
    ['drush', 'Rushing yards allowed per game', 'Defence', 1, 'low', s => div(s.oppRusYds, s.gp)],
    ['dsk', 'Sacks per game', 'Defence', 2, 'high', s => div(s.defSk, s.gp)],
    ['dtfl', 'Tackles for loss per game', 'Defence', 2, 'high', s => div(s.defTckLoss, s.gp)],
    ['dpd', 'Passes defended per game', 'Defence', 2, 'high', s => div(s.defPssDef, s.gp)],
    ['dtk', 'Takeaways per drive against (%)', 'Defence', 1, 'high', s => { const v = div(sum(s, 'oppPssInt', 'oppFmbLost'), s.oppDrives); return v == null ? null : v * 100; }],
    ['fgp', 'Field goal %', 'Special teams', 1, 'high', s => { const a = sum(s, ...FGA); return a ? sum(s, ...FG) / a * 100 : null; }],
    ['fg50', 'Field goals from 50 or more', 'Special teams', 0, 'high', s => n(s.fg50)],
    ['xpp', 'Extra point %', 'Special teams', 1, 'high', s => s.xpa ? s.xp / s.xpa * 100 : null],
    ['pavg', 'Punt average (yards)', 'Special teams', 1, 'high', s => div(s.pntYds, s.pnt)],
    ['p20', 'Punts inside the 20 (%)', 'Special teams', 1, 'high', s => s.pnt ? s.pntIn20 / s.pnt * 100 : null],
    ['kra', 'Kick return average (yards)', 'Special teams', 1, 'high', s => div(s.krYds, s.kr)],
    ['pra', 'Punt return average (yards)', 'Special teams', 1, 'high', s => div(s.prYds, s.pr)],
    ['rtd', 'Return touchdowns', 'Special teams', 0, 'high', s => sum(s, 'krTD', 'prTD')],
    ['pen', 'Penalties per game', 'Discipline and ball security', 1, 'low', s => div(s.pen, s.gp)],
    ['peny', 'Penalty yards per game', 'Discipline and ball security', 1, 'low', s => div(s.penYds, s.gp)],
    ['give', 'Giveaways per game', 'Discipline and ball security', 2, 'low', s => div(sum(s, 'pssInt', 'fmbLost'), s.gp)],
    ['take', 'Takeaways per game', 'Discipline and ball security', 2, 'high', s => div(sum(s, 'oppPssInt', 'oppFmbLost'), s.gp)],
    ['tom', 'Turnover margin per game', 'Discipline and ball security', 2, 'high', s => s.gp ? (sum(s, 'oppPssInt', 'oppFmbLost') - sum(s, 'pssInt', 'fmbLost')) / s.gp : null],
    ['pace', 'Plays per game', 'Pace', 1, 'high', s => div(sum(s, 'pss', 'rus', 'pssSk'), s.gp)],
    ['pass', 'Pass share of plays (%)', 'Pace', 1, 'high', s => { const p = sum(s, 'pss', 'pssSk'), t = p + (+s.rus || 0); return t ? p / t * 100 : null; }]
  ].map(([k, label, group, d, better, f]) => ({ k, label, group, d, better, f }));
  const BY = Object.fromEntries(METRICS.map(m => [m.k, m])), GROUPS = [...new Set(METRICS.map(m => m.group))];
  /* rows [{tid, v:{k:value}}] for the teams' regular-season stat row of the season */
  function rows(teams, season) {
    const out = [];
    for (const t of teams || []) { const s = (t.stats || []).find(x => x.season === season && !x.playoffs); if (!s || !(s.gp > 0)) continue; const v = {}; for (const m of METRICS) { const x = m.f(s); v[m.k] = x == null || !isFinite(x) ? null : x; } out.push({ tid: t.tid, v }); }
    return out;
  }
  /* rank 1 = best (by the metric's direction) among the rows with a value; ties share the best rank; returns {rank, of, pct} (pct 100 = best) */
  function standing(R, k, tid) {
    const m = BY[k], L = R.filter(r => r.v[k] != null), me = L.find(r => r.tid === tid); if (!me) return null;
    const better = L.filter(r => m.better === 'low' ? r.v[k] < me.v[k] - 1e-12 : r.v[k] > me.v[k] + 1e-12).length;
    return { rank: better + 1, of: L.length, pct: L.length > 1 ? (1 - better / (L.length - 1)) * 100 : 100 };
  }
  const api = { METRICS, BY, GROUPS, rows, standing };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMNgsTeam = api;
})(typeof self !== 'undefined' ? self : this);
