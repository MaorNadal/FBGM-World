/* Pure: player page data. Stats rows are the game's per-season, per-team rows (playoffs flagged); stint rows of one season are summed.
   PL-1 (version 1.38): more columns (starts, sacked, long plays, returns, solo and assisted tackles, tackles for loss, passes defended, forced fumbles, field goals, punting, penalties, AV),
   computed rates (completion %, yards per attempt, passer rating, yards per carry and catch, FG %, XP %, yards per punt), and the marks for career bests and league records. */
(function (root) {
  const D = 'd', MX = 'max', R1 = 'r1', PC = 'pc';
  /* [key, label, kind]: kind d = counting (summed), max = a longest play (largest), r1 = rate with one decimal, pc = percent */
  const COLS = [['gp', 'GP', D], ['gs', 'GS', D],
    ['pssCmp', 'Cmp', D], ['pss', 'Att', D], ['pssYds', 'PassYds', D], ['pssTD', 'PassTD', D], ['pssInt', 'Int', D], ['pssLng', 'PassLng', MX], ['pssSk', 'Sacked', D], ['pssSkYds', 'SackYds', D],
    ['rus', 'Rush', D], ['rusYds', 'RushYds', D], ['rusTD', 'RushTD', D], ['rusLng', 'RushLng', MX],
    ['tgt', 'Tgt', D], ['rec', 'Rec', D], ['recYds', 'RecYds', D], ['recTD', 'RecTD', D], ['recLng', 'RecLng', MX],
    ['pr', 'PR', D], ['prYds', 'PRYds', D], ['prTD', 'PRTD', D], ['kr', 'KR', D], ['krYds', 'KRYds', D], ['krTD', 'KRTD', D],
    ['defTck', 'Tck', D], ['defTckSolo', 'Solo', D], ['defTckAst', 'Ast', D], ['defTckLoss', 'TFL', D], ['defSk', 'Sck', D], ['defInt', 'DefInt', D], ['defIntYds', 'IntYds', D], ['defIntTD', 'IntTD', D], ['defPssDef', 'PD', D], ['defFmbFrc', 'FF', D], ['defFmbRec', 'FR', D], ['defSft', 'Saf', D],
    ['fg', 'FG', D], ['fga', 'FGA', D], ['fgLng', 'FGLng', MX], ['xp', 'XP', D], ['xpa', 'XPA', D],
    ['pnt', 'Punts', D], ['pntYds', 'PuntYds', D], ['pntLng', 'PuntLng', MX], ['pntTB', 'TB', D], ['pntIn20', 'In20', D],
    ['fmb', 'Fum', D], ['fmbLost', 'FumLost', D], ['pen', 'Pen', D], ['penYds', 'PenYds', D], ['av', 'AV', D]];
  /* keys that are sums of other stored keys */
  const FGK = ['fg0', 'fg20', 'fg30', 'fg40', 'fg50'], FGA = ['fga0', 'fga20', 'fga30', 'fga40', 'fga50'];
  const n = v => +v || 0, sumK = (s, ks) => ks.reduce((a, k) => a + n(s[k]), 0);
  const val = (s, k) => k === 'fg' ? (n(s.fg) || sumK(s, FGK)) : k === 'fga' ? (n(s.fga) || sumK(s, FGA)) : k === 'defTck' ? (n(s.defTck) || n(s.defTckSolo) + n(s.defTckAst)) : n(s[k]);
  const div = (a, b) => b > 0 ? a / b : null;
  const rating = (c, a, y, t, i) => { if (!(a > 0)) return null; const cl = x => Math.max(0, Math.min(2.375, x)); return (cl((c / a - .3) * 5) + cl((y / a - 3) * .25) + cl(t / a * 20) + cl(2.375 - i / a * 25)) / 6 * 100; };
  /* computed rates, from the summed row */
  const RATES = [['%cmp', 'Cmp%', PC, e => div(e.pssCmp * 100, e.pss)], ['ypa', 'Y/A', R1, e => div(e.pssYds, e.pss)], ['rtg', 'Rating', R1, e => rating(e.pssCmp, e.pss, e.pssYds, e.pssTD, e.pssInt)],
    ['ypc', 'Y/C', R1, e => div(e.rusYds, e.rus)], ['ypr', 'Y/R', R1, e => div(e.recYds, e.rec)], ['%fg', 'FG%', PC, e => div(e.fg * 100, e.fga)], ['%xp', 'XP%', PC, e => div(e.xp * 100, e.xpa)], ['ypp', 'Y/Punt', R1, e => div(e.pntYds, e.pnt)]];
  function fmt(v, kind) { if (v == null || !isFinite(v)) return ''; return kind === R1 ? v.toFixed(1) : kind === PC ? v.toFixed(1) + '%' : String(Math.round(v * 10) / 10); }
  function row(stats, e) { for (const [k, , kind] of COLS) { const v = val(stats, k); e[k] = kind === MX ? Math.max(e[k] || 0, v) : (e[k] || 0) + v; } }
  function career(p, playoffs) {
    const by = {};
    for (const s of p.stats || []) {
      if (!!s.playoffs !== !!playoffs) continue;
      const e = by[s.season] = by[s.season] || { season: s.season, tid: s.tid, _g: -1 };
      if (n(s.gp) >= e._g) { e.tid = s.tid; e._g = n(s.gp); } row(s, e);
    }
    const rows = Object.values(by).sort((a, b) => a.season - b.season);
    const base = COLS.filter(([k]) => k === 'gp' || rows.some(r => r[k]));
    const tot = {}; for (const [k, , kind] of base) tot[k] = kind === MX ? Math.max(0, ...rows.map(r => r[k] || 0)) : rows.reduce((a, r) => a + (r[k] || 0), 0);
    const rates = RATES.filter(([, , , f]) => rows.some(r => f(r) != null));
    rows.forEach(r => rates.forEach(([k, , , f]) => { r[k] = f(r); })); rates.forEach(([k, , , f]) => { tot[k] = f(tot); });
    const cols = base.concat(rates.map(([k, l, kind]) => [k, l, kind]));
    return { rows, cols, tot };
  }
  /* league-wide marks. P: slim players. For each counting key: the best single season (per season and of all time) and the career total, regular season or playoffs.
     ponytail: only keys kept by metrics.js slim (SUM) can be compared; long plays and rates have no league mark. */
  function leagueMax(P, keys, playoffs) {
    const season = {}, all = {}, car = {};
    for (const p of P) {
      const by = {}, tot = {};
      for (const s of p.stats || []) { if (!!s.playoffs !== !!playoffs) continue; const e = by[s.season] = by[s.season] || {}; for (const k of keys) { const v = val(s, k); if (v) { e[k] = (e[k] || 0) + v; tot[k] = (tot[k] || 0) + v; } } }
      for (const y in by) for (const k in by[y]) { const v = by[y][k], sm = season[y] = season[y] || {}; if (!sm[k] || v > sm[k].v) sm[k] = { v, pid: p.pid }; if (!all[k] || v > all[k].v) all[k] = { v, pid: p.pid, season: +y }; }
      for (const k in tot) if (!car[k] || tot[k] > car[k].v) car[k] = { v: tot[k], pid: p.pid };
    }
    return { season, all, car };
  }
  /* which cells of a player's table deserve a mark: best = his own best season in that column, lead = led the league that season, rec = league record for a season, car = league's career leader */
  /* no marks for volume or negative columns: games, starts, interceptions thrown, times sacked, fumbles, penalties */
  const NOMARK = ['gp', 'gs', 'pssInt', 'pssSk', 'pssSkYds', 'fmb', 'fmbLost', 'pen', 'penYds'];
  function marks(c, L, pid) {
    const out = { rows: {}, car: {} };
    for (const [k, , kind] of c.cols) {
      if (kind !== D || NOMARK.includes(k)) continue;
      const mx = Math.max(0, ...c.rows.map(r => r[k] || 0));
      for (const r of c.rows) {
        const m = out.rows[r.season] = out.rows[r.season] || {}, v = r[k] || 0; if (!v) continue; const f = [];
        if (v === mx && c.rows.length > 1) f.push('best');
        const s = L && L.season[r.season] && L.season[r.season][k]; if (s && s.pid === pid && s.v === v) f.push('lead');
        const a = L && L.all[k]; if (a && a.pid === pid && a.v === v && a.season === r.season) f.push('rec');
        if (f.length) m[k] = f;
      }
      const cc = L && L.car[k]; if (cc && cc.pid === pid && cc.v === c.tot[k]) out.car[k] = ['car'];
    }
    return out;
  }
  function series(p) { return (p.ratings || []).filter(r => r.ovr != null).map(r => ({ season: r.season, ovr: r.ovr, pot: r.pot, pos: r.pos })); }
  function awards(p) { const m = {}; for (const a of p.awards || []) m[a.type] = (m[a.type] || 0) + 1; return Object.entries(m).sort((a, b) => b[1] - a[1]); }
  /* injuries: games out (the save stores `games`; older shapes gamesRemaining) and the overall lost, from the rating entries of that season and the one before (or the stored drop) */
  function injuries(p) {
    const R = series(p), at = y => { let r = null; for (const x of R) if (x.season <= y) r = x; return r; };
    return (p.injuries || []).filter(Boolean).map(x => {
      const games = x.games != null ? x.games : x.gamesRemaining, a = at(x.season - 1), b = R.find(r => r.season === x.season) || at(x.season);
      const drop = x.ovrDrop != null ? +x.ovrDrop : (a && b && a !== b ? a.ovr - b.ovr : null);
      return { season: x.season, type: x.type, games, drop: drop != null && drop > 0 ? drop : null, from: a ? a.ovr : null, to: b ? b.ovr : null };
    });
  }
  const PHASE = { '-2': 'expansion draft', '-1': 'fantasy draft', 0: 'preseason', 1: 'regular season', 2: 'regular season', 3: 'playoffs', 4: 'draft lottery', 5: 'draft', 6: 'after the draft', 7: 're-signing', 8: 'free agency' };
  const TYPES = { draft: 'Drafted', freeAgent: 'Signed as a free agent', reSigned: 'Re-signed', trade: 'Traded', released: 'Released', retired: 'Retired', expansionDraft: 'Taken in the expansion draft', fantasyDraft: 'Fantasy draft pick', claimed: 'Claimed', waived: 'Waived', undrafted: 'Signed undrafted' };
  /* transactions, one readable line each; tn(tid) -> team name */
  function transactions(p, tn) {
    return (p.transactions || []).filter(Boolean).map(x => {
      const t = x.type || x.event || '', label = TYPES[t] || (t ? t.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase()) : 'Move'), d = p.draft || {}, bits = [];
      const to = x.tid != null ? tn(x.tid) : '', from = x.fromTid != null ? tn(x.fromTid) : (x.originalTid != null ? tn(x.originalTid) : '');
      if (t === 'draft') { if (to) bits.push('by ' + to); if (d.round != null && +d.year === +x.season) bits.push('round ' + d.round + ', pick ' + d.pick); }
      else if (t === 'trade') { if (from && to) bits.push('from ' + from + ' to ' + to); else if (to) bits.push('to ' + to); }
      else if (to) bits.push((t === 'released' || t === 'waived' ? 'by ' : t === 'reSigned' || t === 'freeAgent' ? 'with ' : 'to ') + to);
      if (x.amount != null) bits.push('$' + (x.amount / 1000).toFixed(2) + 'M' + (x.exp ? ' to ' + x.exp : ''));
      const known = ['season', 'type', 'event', 'tid', 'fromTid', 'originalTid', 'phase', 'amount', 'exp'], rest = Object.keys(x).filter(k => !known.includes(k) && x[k] != null && typeof x[k] !== 'object').map(k => k + ': ' + x[k]);
      return { season: x.season, phase: PHASE[x.phase] || '', label, text: bits.join(' · '), extra: rest.join(', ') };
    });
  }
  const RL = { hgt: 'Height', stre: 'Strength', spd: 'Speed', endu: 'Endurance', thv: 'Vision', thp: 'Throw power', tha: 'Accuracy', bsc: 'Ball security', elu: 'Elusiveness', rtr: 'Routes', hnd: 'Hands', rbk: 'Run block', pbk: 'Pass block', pcv: 'Coverage', tck: 'Tackling', prs: 'Pass rush', rns: 'Run stop', kpw: 'Kick power', kac: 'Kick accuracy', ppw: 'Punt power', pac: 'Punt accuracy' };
  const RS = { QB: ['thv', 'thp', 'tha', 'bsc', 'elu', 'spd'], RB: ['spd', 'elu', 'bsc', 'stre', 'hnd', 'rtr'], WR: ['rtr', 'hnd', 'spd', 'elu', 'bsc', 'hgt'], TE: ['rtr', 'hnd', 'rbk', 'stre', 'spd', 'bsc'], OL: ['rbk', 'pbk', 'stre', 'hgt', 'endu', 'spd'], DL: ['prs', 'rns', 'stre', 'tck', 'spd', 'hgt'], LB: ['tck', 'rns', 'pcv', 'prs', 'spd', 'stre'], CB: ['pcv', 'spd', 'tck', 'hgt', 'hnd', 'elu'], S: ['pcv', 'tck', 'spd', 'rns', 'hnd', 'hgt'], K: ['kpw', 'kac'], P: ['ppw', 'pac'] };
  function radar(p) { const rs = (p.ratings || []).filter(r => r.ovr != null), r = rs[rs.length - 1]; if (!r) return []; return (RS[r.pos] || []).filter(k => typeof r[k] === 'number').map(k => ({ k, label: RL[k], v: r[k] })); }
  const api = { NOMARK, COLS, RATES, career, leagueMax, marks, fmt, series, awards, injuries, transactions, radar };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMPlayer = api;
})(typeof self !== 'undefined' ? self : this);
