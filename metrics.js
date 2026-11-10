/* Pure: catalogues of team and player metrics for the Chart lab and the team and stats pages.
   Every definition uses formulas confirmed against the game (appendix A of the specification) or plain per-game and per-drive ratios of stored counters.
   A metric that cannot be computed from a record returns null and that record is left out of the chart (never a made-up zero). */
(function (root) {
  const D = (a, b) => b ? a / b : null, n = v => +v || 0, cl = v => Math.max(0, Math.min(2.375, v));
  const rating = (c, a, y, t, i) => a ? (cl((c / a - .3) * 5) + cl((y / a - 3) * .25) + cl(t / a * 20) + cl(2.375 - i / a * 25)) / 6 * 100 : null;
  /* ---------- team metrics: c = { s: stats row, ss: season record, pg: {g,pf,pa}, elo, ro: {age,top,pay,n} } ---------- */
  const T = (k, label, group, d, better, f, u, desc) => ({ k, label, group, d, better, f, u: u || '', desc: desc || '' });
  const gp = c => c.s && c.s.gp ? c.s.gp : null;
  const TEAM = [
    T('win', 'Win percentage', 'Results', 1, 'high', c => c.ss ? D(n(c.ss.won) + n(c.ss.tied) / 2, n(c.ss.won) + n(c.ss.lost) + n(c.ss.tied)) * 100 : null, '%'),
    T('wins', 'Wins', 'Results', 0, 'high', c => c.ss ? n(c.ss.won) : null),
    T('ppg', 'Points scored per game', 'Scoring', 1, 'high', c => c.pg && c.pg.g ? c.pg.pf / c.pg.g : (c.s ? D(n(c.s.pts), gp(c)) : null)),
    T('papg', 'Points allowed per game', 'Scoring', 1, 'low', c => c.pg && c.pg.g ? c.pg.pa / c.pg.g : null),
    T('mpg', 'Point margin per game', 'Scoring', 1, 'high', c => c.pg && c.pg.g ? (c.pg.pf - c.pg.pa) / c.pg.g : null),
    T('ypg', 'Total yards per game', 'Offence', 0, 'high', c => c.s ? D(n(c.s.pssYds) + n(c.s.rusYds), gp(c)) : null),
    T('pypg', 'Passing yards per game', 'Offence', 0, 'high', c => c.s ? D(n(c.s.pssYds), gp(c)) : null),
    T('rypg', 'Rushing yards per game', 'Offence', 0, 'high', c => c.s ? D(n(c.s.rusYds), gp(c)) : null),
    T('plg', 'Plays per game', 'Offence', 1, null, c => c.s ? D(n(c.s.pss) + n(c.s.rus) + n(c.s.pssSk), gp(c)) : null, '', 'attempts + rushes + sacks'),
    T('ypp', 'Yards per play', 'Offence', 2, 'high', c => c.s ? D(n(c.s.pssYds) + n(c.s.rusYds), n(c.s.pss) + n(c.s.rus) + n(c.s.pssSk)) : null),
    T('nya', 'Net yards per pass attempt', 'Offence', 2, 'high', c => c.s ? D(n(c.s.pssYds) - n(c.s.pssSkYds), n(c.s.pss) + n(c.s.pssSk)) : null),
    T('rya', 'Yards per rush', 'Offence', 2, 'high', c => c.s ? D(n(c.s.rusYds), n(c.s.rus)) : null),
    T('cmp', 'Completion percentage', 'Offence', 1, 'high', c => c.s ? D(n(c.s.pssCmp), n(c.s.pss)) * 100 : null, '%'),
    T('rtg', 'Team passer rating', 'Offence', 1, 'high', c => c.s ? rating(n(c.s.pssCmp), n(c.s.pss), n(c.s.pssYds), n(c.s.pssTD), n(c.s.pssInt)) : null),
    T('ptd', 'Passing touchdowns per game', 'Offence', 2, 'high', c => c.s ? D(n(c.s.pssTD), gp(c)) : null),
    T('rtd', 'Rushing touchdowns per game', 'Offence', 2, 'high', c => c.s ? D(n(c.s.rusTD), gp(c)) : null),
    T('skg', 'Sacks taken per game', 'Offence', 2, 'low', c => c.s ? D(n(c.s.pssSk), gp(c)) : null),
    T('skp', 'Sack percentage (of dropbacks)', 'Offence', 1, 'low', c => c.s ? D(n(c.s.pssSk), n(c.s.pss) + n(c.s.pssSk)) * 100 : null, '%'),
    T('tog', 'Turnovers per game', 'Ball security', 2, 'low', c => c.s ? D(n(c.s.pssInt) + n(c.s.fmbLost), gp(c)) : null, '', 'interceptions + fumbles lost'),
    T('intg', 'Interceptions thrown per game', 'Ball security', 2, 'low', c => c.s ? D(n(c.s.pssInt), gp(c)) : null),
    T('flg', 'Fumbles lost per game', 'Ball security', 2, 'low', c => c.s ? D(n(c.s.fmbLost), gp(c)) : null),
    T('peng', 'Penalties per game', 'Discipline', 1, 'low', c => c.s ? D(n(c.s.pen), gp(c)) : null),
    T('penyg', 'Penalty yards per game', 'Discipline', 1, 'low', c => c.s ? D(n(c.s.penYds), gp(c)) : null),
    T('drg', 'Drives per game', 'Drives', 1, null, c => c.s ? D(n(c.s.drives), gp(c)) : null),
    T('sc', 'Scoring drives (TD per drive)', 'Drives', 1, 'high', c => c.s ? D(n(c.s.pssTD) + n(c.s.rusTD), n(c.s.drives)) * 100 : null, '%', 'passing + rushing touchdowns per drive'),
    T('tod', 'Turnover drives', 'Drives', 1, 'low', c => c.s ? D(n(c.s.pssInt) + n(c.s.fmbLost), n(c.s.drives)) * 100 : null, '%'),
    T('start', 'Average drive start (yards)', 'Drives', 1, 'high', c => c.s ? D(n(c.s.totStartYds), n(c.s.drives)) : null),
    T('tpd', 'Minutes per drive', 'Drives', 1, null, c => c.s ? D(n(c.s.timePos), n(c.s.drives)) : null),
    T('pld', 'Plays per drive', 'Drives', 1, 'high', c => c.s ? D(n(c.s.pss) + n(c.s.rus) + n(c.s.pssSk), n(c.s.drives)) : null),
    T('yd', 'Yards per drive', 'Drives', 1, 'high', c => c.s ? D(n(c.s.pssYds) + n(c.s.rusYds), n(c.s.drives)) : null),
    T('ptd2', 'Points per drive', 'Drives', 2, 'high', c => c.s ? D(n(c.s.pts), n(c.s.drives)) : null),
    T('elo', 'Elo strength (own model)', 'Model', 0, 'high', c => c.elo != null ? c.elo : null, '', 'margin-adjusted Elo after the last game of the season, this app\'s own model'),
    T('age', 'Average roster age', 'Roster', 1, null, c => c.ro && c.ro.n ? c.ro.age : null, '', 'now, current rosters only'),
    T('top', 'Roster rating (top 22 average)', 'Roster', 1, 'high', c => c.ro && c.ro.n ? c.ro.top : null, '', 'now, current rosters only'),
    T('pay', 'Payroll ($M)', 'Roster', 1, null, c => c.ro && c.ro.n ? c.ro.pay / 1000 : null, '', 'now, current contracts only')
  ];
  const NOW_ONLY = new Set(['age', 'top', 'pay']);
  const TEAM_BY = Object.fromEntries(TEAM.map(m => [m.k, m]));

  /* one row per team for a season; ctx = { pg: {tid: {g,pf,pa}}, elo: {tid: rating}, ro: {tid: {...}} } */
  function teamRows(teams, season, po, ctx) {
    ctx = ctx || {}; const out = [];
    for (const t of teams) {
      const s = (t.stats || []).find(x => x.season === season && !!x.playoffs === !!po), ss = (t.seasons || []).find(x => x.season === season);
      if (!s && !ss) continue;
      const c = { s, ss, pg: (ctx.pg || {})[t.tid], elo: (ctx.elo || {})[t.tid], ro: (ctx.ro || {})[t.tid] }, v = {};
      for (const m of TEAM) { let x = null; try { x = m.f(c); } catch (e) {} v[m.k] = x != null && isFinite(x) ? x : null; }
      const nm = ss && (ss.region || ss.name) ? ((ss.region || t.region || '') + ' ' + (ss.name || t.name || '')).trim() : ((t.region || '') + ' ' + (t.name || '')).trim();
      out.push({ id: t.tid, tid: t.tid, name: nm, abbrev: (ss && ss.abbrev) || t.abbrev, team: t, v });
    }
    return out;
  }

  /* ---------- player metrics ---------- */
  const SUM = ['gp', 'gs', 'pssCmp', 'pss', 'pssYds', 'pssTD', 'pssInt', 'pssSk', 'rus', 'rusYds', 'rusTD', 'tgt', 'rec', 'recYds', 'recTD', 'defTckSolo', 'defTckAst', 'defTck', 'defSk', 'defInt', 'fmbLost', 'av'];
  const SKILLS = ['hgt', 'stre', 'spd', 'endu', 'thv', 'thp', 'tha', 'bsc', 'elu', 'rtr', 'hnd', 'rbk', 'pbk', 'pcv', 'tck', 'prs', 'rns', 'kpw', 'kac', 'ppw', 'pac'];
  const tck = r => r.defTckSolo || r.defTckAst ? n(r.defTckSolo) + n(r.defTckAst) : n(r.defTck);
  const fp = r => n(r.pssYds) * .04 + n(r.pssTD) * 4 - n(r.pssInt) * 2 + (n(r.rusYds) + n(r.recYds)) * .1 + (n(r.rusTD) + n(r.recTD)) * 6 - n(r.fmbLost) * 2;
  const P = (k, label, group, d, f, desc, gate) => ({ k, label, group, d, f, desc: desc || '', gate: gate || null, better: 'high', u: '' });
  const PLAYER = [
    P('pssYds', 'Passing yards', 'Passing', 0, r => r.pss ? r.pssYds : null), P('pssTD', 'Passing touchdowns', 'Passing', 0, r => r.pss ? r.pssTD : null), P('pssInt', 'Interceptions thrown', 'Passing', 0, r => r.pss ? r.pssInt : null),
    P('cmp', 'Completion percentage', 'Passing', 1, r => r.pss ? r.pssCmp / r.pss * 100 : null, '', 'pss'), P('ypa', 'Yards per attempt', 'Passing', 2, r => r.pss ? r.pssYds / r.pss : null, '', 'pss'),
    P('rtg', 'Passer rating', 'Passing', 1, r => r.pss ? rating(r.pssCmp, r.pss, r.pssYds, r.pssTD, r.pssInt) : null, 'standard formula, each part limited to 0 to 2.375', 'pss'),
    P('rusYds', 'Rushing yards', 'Rushing', 0, r => r.rus ? r.rusYds : null), P('rusTD', 'Rushing touchdowns', 'Rushing', 0, r => r.rus ? r.rusTD : null), P('ypc', 'Yards per carry', 'Rushing', 2, r => r.rus ? r.rusYds / r.rus : null, '', 'rus'),
    P('rec', 'Receptions', 'Receiving', 0, r => r.rec ? r.rec : null), P('recYds', 'Receiving yards', 'Receiving', 0, r => r.rec || r.recYds ? r.recYds : null), P('recTD', 'Receiving touchdowns', 'Receiving', 0, r => r.rec ? r.recTD : null), P('ypr', 'Yards per reception', 'Receiving', 1, r => r.rec ? r.recYds / r.rec : null, '', 'rec'),
    P('scrim', 'Yards from scrimmage', 'Receiving', 0, r => r.rusYds || r.recYds ? n(r.rusYds) + n(r.recYds) : null),
    P('tck', 'Total tackles', 'Defense', 0, r => tck(r) || null, 'solo + assisted'), P('sk', 'Sacks', 'Defense', 1, r => r.defSk || null), P('dint', 'Interceptions', 'Defense', 0, r => r.defInt || null),
    P('fp', 'Fantasy points (standard)', 'Value', 1, r => r.pss || r.rus || r.rec ? fp(r) : null, 'the game\'s standard weights'), P('av', 'Approximate value', 'Value', 1, r => r.av != null ? r.av : null),
    P('ovr', 'Overall rating', 'Ratings', 0, r => r.ovr), P('pot', 'Potential', 'Ratings', 0, r => r.pot), P('age', 'Age', 'Ratings', 0, r => r.age),
    P('amount', 'Contract ($M per year)', 'Ratings', 2, r => r.amount != null ? r.amount / 1000 : null), P('gp', 'Games played', 'Games', 0, r => r.gp)
  ];
  const PLAYER_BY = Object.fromEntries(PLAYER.map(m => [m.k, m]));

  /* sum of a player's stat rows of one season (stints with several teams are added; the team shown is the last one) */
  function playerSeason(p, season, po) {
    let e = null;
    for (const s of p.stats || []) { if (s.season !== season || !!s.playoffs !== !!po) continue; e = e || { tid: s.tid }; e.tid = s.tid; for (const k of SUM) e[k] = (e[k] || 0) + (+s[k] || 0); }
    return e;
  }
  function playerRows(players, season, po, o) {
    o = o || {}; const out = [];
    for (const p of players) {
      const e = playerSeason(p, season, po); if (!e) continue;
      const rs = (p.ratings || []).filter(r => r.season <= season), r = rs[rs.length - 1] || {};
      const row = Object.assign({ id: p.pid, pid: p.pid, season, name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim(), pos: r.pos || '', ovr: r.ovr == null ? null : r.ovr, pot: r.pot == null ? null : r.pot, age: p.born && p.born.year != null ? season - p.born.year : null, amount: p.contract ? p.contract.amount : null, face: p.face, player: p }, e);
      if (o.pos && row.pos !== o.pos) continue; if (o.minGp && !(row.gp >= o.minGp)) continue;
      const v = {}; for (const m of PLAYER) { let x = null; try { x = m.f(row); } catch (z) {} v[m.k] = x != null && isFinite(x) ? x : null; }
      row.v = v; out.push(row);
    }
    return out;
  }

  /* a slim copy of a player record: only what the metrics, rosters and faces need (the full records of 8,698 players are about 82 MB) */
  function slim(p) {
    const st = [];
    for (const s of p.stats || []) { const r = { season: s.season, playoffs: !!s.playoffs, tid: s.tid }; for (const k of SUM) if (s[k]) r[k] = s[k]; st.push(r); }
    return { pid: p.pid, firstName: p.firstName, lastName: p.lastName, tid: p.tid, born: p.born ? { year: p.born.year } : null, contract: p.contract ? { amount: p.contract.amount, exp: p.contract.exp } : null, face: p.face, jerseyNumber: p.jerseyNumber,
      injury: p.injury ? { type: p.injury.type, gamesRemaining: p.injury.gamesRemaining } : null, hof: p.hof, ratings: (p.ratings || []).map((r, i, A) => { const o = { season: r.season, pos: r.pos, ovr: r.ovr, pot: r.pot }; if (i === A.length - 1) for (const k of SKILLS) if (r[k] != null) o[k] = r[k]; return o; }), stats: st, awards: (p.awards || []).map(a => ({ type: a.type, season: a.season })), draft: p.draft ? { year: p.draft.year, round: p.draft.round, pick: p.draft.pick, tid: p.draft.tid, ovr: p.draft.ovr, pot: p.draft.pot } : null };
  }
  /* roster aggregates of every team from current player records */
  function rosterAgg(players, season) {
    const by = {};
    for (const p of players) { if (p.tid == null || p.tid < 0) continue; const rs = (p.ratings || []).filter(r => r.season <= season), r = rs[rs.length - 1] || {}; (by[p.tid] = by[p.tid] || []).push({ age: p.born && p.born.year != null ? season - p.born.year : null, ovr: r.ovr || 0, amount: p.contract ? +p.contract.amount || 0 : 0 }); }
    const out = {};
    for (const t in by) { const L = by[t], ag = L.filter(x => x.age != null), top = L.slice().sort((a, b) => b.ovr - a.ovr).slice(0, 22); out[t] = { n: L.length, age: ag.length ? ag.reduce((a, x) => a + x.age, 0) / ag.length : null, top: top.length ? top.reduce((a, x) => a + x.ovr, 0) / top.length : null, pay: L.reduce((a, x) => a + x.amount, 0) }; }
    return out;
  }

  /* points for and against per team from game headers (regular season or playoffs, all-star games excluded) */
  function pointsByTeam(games, season, po) {
    const m = {};
    for (const g of games) { if (g.season !== season || g.allStar || !!g.playoffs !== !!po || !g.teams || g.teams.length < 2) continue; g.teams.forEach((x, i) => { const e = m[x.tid] = m[x.tid] || { g: 0, pf: 0, pa: 0 }; e.g++; e.pf += +x.pts || 0; e.pa += +g.teams[1 - i].pts || 0; }); }
    return m;
  }

  /* Elo after the last game of the season, from elo.js run().games */
  function eloAtSeasonEnd(list, season) {
    const m = {}; for (const g of list) { if (g.season !== season) continue; m[g.home] = g.rhA; m[g.away] = g.raA; } return m;
  }

  /* rank (1 = best) and percentile (100 = best) of a value among rows, by the metric's direction */
  function standing(rows, key, id, better) {
    const L = rows.filter(r => r.v[key] != null); const me = L.find(r => r.id === id); if (!me) return null;
    const hi = better !== 'low', beat = L.filter(r => hi ? r.v[key] > me.v[key] : r.v[key] < me.v[key]).length;
    return { rank: beat + 1, of: L.length, pct: L.length > 1 ? (1 - beat / (L.length - 1)) * 100 : 100 };
  }
  function fmt(m, v) {
    if (v == null || !isFinite(v)) return '–'; const s = m.d ? v.toFixed(m.d) : Math.round(v).toLocaleString('en-US');
    return (m.k === 'pay' || m.k === 'amount' ? '$' : '') + s + (m.u || '') + (m.k === 'pay' || m.k === 'amount' ? 'M' : '');
  }
  function stats(rows, key) {
    const L = rows.map(r => r.v[key]).filter(x => x != null); if (!L.length) return null;
    const mean = L.reduce((a, b) => a + b, 0) / L.length, sd = Math.sqrt(L.reduce((a, b) => a + (b - mean) ** 2, 0) / L.length) || 1;
    return { mean, sd, min: Math.min(...L), max: Math.max(...L), n: L.length };
  }
  const api = { SKILLS, slim, TEAM, TEAM_BY, PLAYER, PLAYER_BY, NOW_ONLY, teamRows, playerRows, playerSeason, rosterAgg, pointsByTeam, eloAtSeasonEnd, standing, fmt, stats, rating };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMMetrics = api;
})(typeof self !== 'undefined' ? self : this);
