/* Pure: the game's GOAT formula (given by the owner, FR-REC-4), evaluated term by term without eval.
   score = 0.00007 * ( av + mvp*1000 + champ*500 + finalsMvp*125 + dpoy*500 + oroy*150 + droy*150 + allStarMvp*75 + allLeague1*175 + allLeague2*175 + allRookie*50 + numSeasons*2
     + qbW - qbL*0.5 - fmbLost + pssYds*0.09 + pssTD*6 - pssInt*2 + (rusYds*1 + recYds*1.25)*0.3 + rec*0.25 + (rusTD + recTD*2 + prTD + krTD) + (prYds + krYds)*0.1
     + defInt*25 + (defIntTD + defFmbTD)*10 + defPssDef*5 + defFmbFrc*5 + defSk*18.5 + (defTckSolo + defTckAst)*2.5 + defTckLoss*7.5 + defSft*10
     + (fg0 + fg20 + fg30 + fg40*2 + fg50) + fgLng*2 + xp*5 - xpa*0.25 + pntYds*0.075 + pntIn20 ).
   Variables: career (or one season) totals of the player's stat rows (regular season, or regular season + playoffs), fgLng = the longest field goal (a maximum, not a sum), numSeasons = seasons with games, award counts from player.awards.
   Players are raw or slim records: stats[{season, playoffs, tid, gp, av, ...}], awards[{type, season}]. */
(function (root) {
  const K = 0.00007;
  /* [key, label, group, per-unit weight] ; the weight of the term as it stands in the formula, before the 0.00007 */
  const TERMS = [
    ['av', 'Approximate value', 'Value', 1], ['numSeasons', 'Seasons played', 'Value', 2],
    ['mvp', 'MVP', 'Honours', 1000], ['champ', 'Titles', 'Honours', 500], ['finalsMvp', 'Finals MVP', 'Honours', 125], ['dpoy', 'Defensive Player of the Year', 'Honours', 500],
    ['oroy', 'Offensive Rookie of the Year', 'Honours', 150], ['droy', 'Defensive Rookie of the Year', 'Honours', 150], ['allStarMvp', 'All-Star MVP', 'Honours', 75],
    ['allLeague1', 'First-team All-League', 'Honours', 175], ['allLeague2', 'Second-team All-League', 'Honours', 175], ['allRookie', 'All-Rookie team', 'Honours', 50],
    ['qbW', 'Quarterback wins', 'Passing', 1], ['qbL', 'Quarterback losses', 'Passing', -0.5], ['pssYds', 'Passing yards', 'Passing', 0.09], ['pssTD', 'Passing TD', 'Passing', 6], ['pssInt', 'Interceptions thrown', 'Passing', -2],
    ['rusYds', 'Rushing yards', 'Rushing and receiving', 0.3], ['recYds', 'Receiving yards', 'Rushing and receiving', 0.375], ['rec', 'Receptions', 'Rushing and receiving', 0.25],
    ['rusTD', 'Rushing TD', 'Rushing and receiving', 1], ['recTD', 'Receiving TD', 'Rushing and receiving', 2], ['fmbLost', 'Fumbles lost', 'Rushing and receiving', -1],
    ['prTD', 'Punt return TD', 'Returns', 1], ['krTD', 'Kick return TD', 'Returns', 1], ['prYds', 'Punt return yards', 'Returns', 0.1], ['krYds', 'Kick return yards', 'Returns', 0.1],
    ['defInt', 'Interceptions', 'Defence', 25], ['defIntTD', 'Interception TD', 'Defence', 10], ['defFmbTD', 'Fumble return TD', 'Defence', 10], ['defPssDef', 'Passes defended', 'Defence', 5], ['defFmbFrc', 'Forced fumbles', 'Defence', 5],
    ['defSk', 'Sacks', 'Defence', 18.5], ['defTckSolo', 'Solo tackles', 'Defence', 2.5], ['defTckAst', 'Assisted tackles', 'Defence', 2.5], ['defTckLoss', 'Tackles for loss', 'Defence', 7.5], ['defSft', 'Safeties', 'Defence', 10],
    ['fg0', 'Field goals under 20 yards', 'Kicking', 1], ['fg20', 'Field goals 20 to 29', 'Kicking', 1], ['fg30', 'Field goals 30 to 39', 'Kicking', 1], ['fg40', 'Field goals 40 to 49', 'Kicking', 2], ['fg50', 'Field goals 50 and more', 'Kicking', 1],
    ['fgLng', 'Longest field goal', 'Kicking', 2], ['xp', 'Extra points made', 'Kicking', 5], ['xpa', 'Extra points attempted', 'Kicking', -0.25],
    ['pntYds', 'Punting yards', 'Punting', 0.075], ['pntIn20', 'Punts inside the 20', 'Punting', 1]
  ];
  const GROUPS = ['Value', 'Honours', 'Passing', 'Rushing and receiving', 'Returns', 'Defence', 'Kicking', 'Punting'];
  const SUMK = TERMS.map(t => t[0]).filter(k => !['numSeasons', 'mvp', 'champ', 'finalsMvp', 'dpoy', 'oroy', 'droy', 'allStarMvp', 'allLeague1', 'allLeague2', 'allRookie', 'fgLng'].includes(k));
  const AW = [['finalsMvp', /finals mvp|super bowl mvp/i], ['allStarMvp', /all-?star.*mvp|all-?star game mvp/i], ['mvp', /^most valuable player$/i], ['dpoy', /defensive player of the year/i],
    ['oroy', /offensive rookie of the year/i], ['droy', /defensive rookie of the year/i], ['allLeague1', /first team all-?league/i], ['allLeague2', /second team all-?league/i], ['allRookie', /all-?rookie/i], ['champ', /won championship/i]];
  /* the variables of the formula for these stat rows and awards. season = null: whole career. po: include playoff rows. */
  function vars(p, season, po) {
    const v = { numSeasons: 0 }; for (const t of TERMS) v[t[0]] = 0; const seen = new Set();
    for (const s of (p && p.stats) || []) {
      if (!s || (season != null && s.season !== season) || (s.playoffs && !po)) continue;
      for (const k of SUMK) v[k] += +s[k] || 0;
      if ((+s.fgLng || 0) > v.fgLng) v.fgLng = +s.fgLng;
      if (!s.playoffs && (+s.gp || 0) > 0) seen.add(s.season); else if (s.playoffs && (+s.gp || 0) > 0 && season == null && po) seen.add(s.season);
    }
    v.numSeasons = seen.size;
    for (const a of (p && p.awards) || []) { if (season != null && a.season !== season) continue; const t = String(a.type || ''), h = AW.find(x => x[1].test(t)); if (h) v[h[0]]++; }
    return v;
  }
  /* total and the contribution of every term; negative group sums are kept (shown), the bar uses the positive ones */
  function score(v) {
    const parts = {}, groups = {}; let sum = 0;
    for (const [k, , g, w] of TERMS) { const c = (v[k] || 0) * w; parts[k] = c * K; groups[g] = (groups[g] || 0) + c * K; sum += c; }
    return { total: sum * K, parts, groups };
  }
  /* rows best first: [{pid, season?, v, total, groups, parts}] ; season null = career */
  function rank(players, o) {
    o = o || {}; const out = [];
    for (const p of players || []) {
      const ys = o.season === 'each' ? [...new Set((p.stats || []).filter(s => s && (o.po || !s.playoffs)).map(s => s.season))] : [null];
      for (const y of ys) { const v = vars(p, y, !!o.po), sc = score(v); if (sc.total > 0) out.push({ pid: p.pid, season: y, v, total: sc.total, groups: sc.groups, parts: sc.parts }); }
    }
    return out.sort((a, b) => b.total - a.total || a.pid - b.pid || (a.season || 0) - (b.season || 0));
  }
  /* a compact copy of a raw player record with only what the formula, the list and the face need (the full records are about 82 MB) */
  const KEEP = SUMK.concat(['fgLng', 'gp']);
  function slim(p) {
    const rt = ((p.ratings || [])[(p.ratings || []).length - 1]) || {};
    return { pid: p.pid, firstName: p.firstName, lastName: p.lastName, tid: p.tid, face: p.face, hof: p.hof, pos: rt.pos || '', awards: (p.awards || []).map(a => ({ type: a.type, season: a.season })),
      stats: (p.stats || []).map(s => { const r = { season: s.season, playoffs: !!s.playoffs, tid: s.tid }; for (const k of KEEP) if (s[k]) r[k] = s[k]; return r; }) };
  }
  const api = { K, TERMS, GROUPS, vars, score, rank, slim };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMGoatF = api;
})(typeof self !== 'undefined' ? self : this);
