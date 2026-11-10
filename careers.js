/* Pure: career-level helpers. Player twins (the most similar historical rating paths and what happened next), career story written from records,
   milestone watch (career totals against round numbers at the current pace). All estimates are this app's own. */
(function (root) {
  /* ---------- twins ---------- */
  function path(p) { const m = {}; if (!p.born || p.born.year == null) return m; for (const r of p.ratings || []) if (r.ovr != null) m[r.season - p.born.year] = r.ovr; return m; }
  function latestPos(p) { const r = (p.ratings || []).filter(x => x.pos); return r.length ? r[r.length - 1].pos : null; }
  /* target: slim player; pool: slim players. Returns { twins: [{ p, dist, now, next: {1,2,3}, peak, last }], project: {1,2,3} | null } */
  function twins(pool, target, o) {
    o = o || {}; const n = o.n || 5, span = o.span || 5, tp = path(target), ages = Object.keys(tp).map(Number).sort((a, b) => a - b);
    if (ages.length < 2) return { twins: [], project: null, age: null };
    const age = ages[ages.length - 1], use = ages.slice(-span), pos = latestPos(target), out = [];
    for (const c of pool) {
      if (c.pid === target.pid || (pos && latestPos(c) !== pos)) continue;
      const cp = path(c); if (cp[age] == null) continue;
      let sum = 0, k = 0; for (const a of use) if (cp[a] != null) { sum += (cp[a] - tp[a]) ** 2; k++; } if (k < Math.min(3, use.length)) continue;
      const next = {}; for (const d of [1, 2, 3]) if (cp[age + d] != null) next[d] = cp[age + d];
      const all = Object.keys(cp).map(Number); out.push({ p: c, dist: Math.sqrt(sum / k), overlap: k, now: cp[age], next, peak: Math.max(...Object.values(cp)), last: Math.max(...all) });
    }
    out.sort((a, b) => a.dist - b.dist || b.overlap - a.overlap); const T = out.slice(0, n), project = {};
    for (const d of [1, 2, 3]) { const L = T.filter(t => t.next[d] != null).map(t => t.next[d] - t.now); if (L.length >= 2) project[d] = { delta: L.reduce((a, b) => a + b, 0) / L.length, n: L.length, ovr: tp[age] + L.reduce((a, b) => a + b, 0) / L.length }; }
    return { twins: T, project: Object.keys(project).length ? project : null, age, ovr: tp[age] };
  }

  /* ---------- story ---------- */
  const KEY = { QB: [['pssYds', 'passing yards'], ['pssTD', 'passing touchdowns']], RB: [['rusYds', 'rushing yards'], ['rusTD', 'rushing touchdowns']], WR: [['recYds', 'receiving yards'], ['recTD', 'receiving touchdowns']], TE: [['recYds', 'receiving yards'], ['rec', 'catches']], DL: [['defSk', 'sacks'], ['defTckSolo', 'solo tackles']], LB: [['defTckSolo', 'solo tackles'], ['defSk', 'sacks']], CB: [['defInt', 'interceptions'], ['defTckSolo', 'solo tackles']], S: [['defInt', 'interceptions'], ['defTckSolo', 'solo tackles']] };
  const ordn = n => { const t = n % 100; return n + (t >= 11 && t <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th')); };
  function story(p, tn, season) {
    const L = [], nm = ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || 'This player', rs = (p.ratings || []).filter(r => r.ovr != null), last = rs[rs.length - 1], pos = last && last.pos;
    const age = p.born && p.born.year != null ? season - p.born.year : null;
    L.push(`${nm} is a ${pos || 'player'}${age != null ? ', born in ' + p.born.year + ' (age ' + age + ')' : ''}.`);
    const d = p.draft; if (d && d.year > 0 && d.round > 0) L.push(`Drafted in ${d.year}, round ${d.round}, pick ${d.pick}${d.tid != null && tn(d.tid) ? ' by ' + tn(d.tid) : ''}.`); else if (d) L.push('Entered the league undrafted.');
    const reg = (p.stats || []).filter(s => !s.playoffs && (s.gp || 0) > 0).sort((a, b) => a.season - b.season), stints = [];
    for (const s of reg) { const t = stints[stints.length - 1]; if (t && t.tid === s.tid) t.to = s.season; else stints.push({ tid: s.tid, from: s.season, to: s.season }); }
    if (stints.length) L.push('Career path: ' + stints.map(s => `${tn(s.tid) || 'a team'} (${s.from === s.to ? s.from : s.from + '–' + s.to})`).join(', then ') + '.');
    if (rs.length) { const pk = rs.reduce((a, b) => b.ovr > a.ovr ? b : a); L.push(`Peak rating ${pk.ovr} in ${pk.season}${p.born && p.born.year != null ? ' at age ' + (pk.season - p.born.year) : ''}${last && last !== pk ? '; now ' + last.ovr + '.' : '.'}`); }
    const seasons = {}; for (const s of reg) { const e = seasons[s.season] = seasons[s.season] || { season: s.season, av: 0, s: {} }; e.av += +s.av || 0; for (const k in s) if (typeof s[k] === 'number' && !['season', 'tid'].includes(k)) e.s[k] = (e.s[k] || 0) + s[k]; }
    const best = Object.values(seasons).sort((a, b) => b.av - a.av)[0];
    if (best && best.av > 0) { const one = (n, l) => n === 1 ? l.replace(/ches$/, 'ch').replace(/s$/, '') : l, ks = (KEY[pos] || []).filter(([k]) => best.s[k]).slice(0, 2).map(([k, l]) => `${best.s[k]} ${one(best.s[k], l)}`); L.push(`Best season: ${best.season} (approximate value ${best.av.toFixed(1)}${ks.length ? ', ' + ks.join(' and ') : ''}).`); }
    const aw = {}; for (const a of p.awards || []) aw[a.type] = (aw[a.type] || 0) + 1; const at = Object.entries(aw).sort((a, b) => b[1] - a[1]); if (at.length) L.push('Honours: ' + at.slice(0, 5).map(([t, c]) => c > 1 ? `${t} ×${c}` : t).join(', ') + '.');
    if (p.hof) L.push('Member of the Hall of Fame.');
    const tot = reg.reduce((a, s) => a + (s.gp || 0), 0); if (tot) L.push(`${tot} regular-season games over ${new Set(reg.map(s => s.season)).size} seasons.`);
    if (p.tid >= 0) L.push(`Currently with ${tn(p.tid) || 'a team'}${p.contract ? ', under contract through ' + p.contract.exp + ' at ' + (p.contract.amount / 1000).toFixed(2) + 'M a year' : ''}${p.injury && p.injury.gamesRemaining > 0 ? '. Out for ' + p.injury.gamesRemaining + ' more games (' + (p.injury.type || 'injury') + ')' : ''}.`);
    else if (p.tid === -1) L.push('Currently a free agent.'); else if (p.tid === -2) L.push('Currently a draft prospect.'); else if (p.tid === -3) L.push('Retired.');
    return L;
  }

  /* ---------- milestones ---------- */
  const STEPS = { pssYds: [5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000], pssTD: [50, 100, 150, 200, 250, 300, 400], rusYds: [2500, 5000, 7500, 10000, 12500, 15000], rusTD: [25, 50, 75, 100, 125, 150], recYds: [2500, 5000, 7500, 10000, 12500, 15000], rec: [250, 500, 750, 1000, 1250], recTD: [25, 50, 75, 100, 125], defSk: [25, 50, 75, 100, 125, 150], defInt: [10, 20, 30, 40, 50], tck: [250, 500, 750, 1000, 1500, 2000] };
  const LABEL = { pssYds: 'passing yards', pssTD: 'passing touchdowns', rusYds: 'rushing yards', rusTD: 'rushing touchdowns', recYds: 'receiving yards', rec: 'receptions', recTD: 'receiving touchdowns', defSk: 'sacks', defInt: 'interceptions', tck: 'tackles' };
  const cnt = (s, k) => k === 'tck' ? (s.defTckSolo || s.defTckAst ? (s.defTckSolo || 0) + (s.defTckAst || 0) : (s.defTck || 0)) : (+s[k] || 0);
  /* remaining: { tid: games left this season }; returns the nearest next milestone of each active player and statistic */
  function milestones(players, season, remaining, o) {
    o = o || {}; const out = [];
    for (const p of players) {
      if (p.tid == null || p.tid < 0) continue; const reg = (p.stats || []).filter(s => !s.playoffs);
      for (const k in STEPS) {
        const tot = reg.reduce((a, s) => a + cnt(s, k), 0); if (tot <= 0) continue; const thr = STEPS[k].find(t => t > tot); if (thr == null) continue;
        const recent = reg.filter(s => s.season >= season - 1 && (s.gp || 0) > 0), gp = recent.reduce((a, s) => a + s.gp, 0), rate = gp ? recent.reduce((a, s) => a + cnt(s, k), 0) / gp : 0;
        if (rate <= 0) continue; const need = thr - tot, games = need / rate, left = remaining ? (remaining[p.tid] || 0) : 0;
        if (o.maxGames && games > o.maxGames) continue;
        out.push({ pid: p.pid, tid: p.tid, name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim(), key: k, label: LABEL[k], total: tot, next: thr, need, rate, games, left, thisSeason: left > 0 && games <= left, pct: tot / thr });
      }
    }
    return out.sort((a, b) => a.games - b.games);
  }
  const api = { twins, story, milestones, path, STEPS, LABEL, ordn };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMCareers = api;
})(typeof self !== 'undefined' ? self : this);
