/* Pure (1.54, rewritten from 1.51): the general-manager market and the front-office carousel, built on the same logic as the coaches (coachcar.js). A NARRATIVE layer: it does not change the simulation.
   A GM: { name, role ('GM' or 'AGM', the assistant general manager / director of player personnel), style (his philosophy), eye (draft and scouting 35-99), cap (cap and contracts), trade (35-99), development (how he builds a roster),
           rep (reputation 0-100), age, retireAge, exp (years as GM), unit (AGM: percentile of the team's draft work, 0-1), idle (years without a job), clash (an abrasive trait), from, since }.
   A team seat: { tid, gm, agm, pct3 (win share of the last three seasons), grade (draft grade, mean overall minus the slot's usual), tenure, unit, ppct (win share of the season before the three) }.
   Like the coaches: nobody is drawn at random in a decision; hash-based "circumstance" terms break ties only. The owner's patience, the team's appeal, the candidate's reputation and what he is ready for decide.
   The NFL picture used (researched in the coach model): a few GM changes a year, usually together with or just after a head-coach change; assistant GMs and directors of player personnel are the main candidates;
   a fired GM often returns as an assistant. Rating of a GM = mean of eye, cap, trade, development. */
(function (root) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const STY = ['Draft-and-develop', 'Win-now veteran buyer', 'Cap wizard', 'Trade-happy dealer', 'Analytics-driven', 'Old-school scout'];
  const EXPECT = r => r === 1 ? 66 : r === 2 ? 58 : r === 3 ? 52 : 47;
  const rating = g => g ? Math.round((g.eye + g.cap + g.trade + (g.development != null ? g.development : (g.eye + g.cap) / 2)) / 4) : 0;
  const repOf = g => g.rep != null ? g.rep : Math.round(rating(g) * 0.8);
  const retireAgeOf = g => g.retireAge != null ? g.retireAge : 60 + Math.floor(hash('gra' + g.name) * 10) + (hash('grb' + g.name) > 0.88 ? 4 + Math.floor(hash('grc' + g.name) * 9) : 0);
  const clashOf = g => g.clash != null ? !!g.clash : hash('gcl' + g.name) > 0.94;
  const patience = tid => 0.25 + 0.65 * hash('gpat' + tid);
  const market = tid => hash('gmk' + tid);
  const teamStyle = tid => STY[Math.floor(hash('gts' + tid) * STY.length)];
  function gen(seed, tid, role) {
    const h = k => hash(seed + k), rt = k => 45 + Math.floor(h(k) * 41); role = role || 'GM';
    const nm = (root.FBGMCarousel && root.FBGMCarousel.newCoach) ? root.FBGMCarousel.newCoach('gm' + seed).name : 'Exec ' + seed;
    const g = { name: nm, role, eye: rt('e'), cap: rt('c'), trade: rt('t'), development: rt('d'), age: (role === 'GM' ? 42 : 34) + Math.floor(h('a') * 24), style: STY[Math.floor(h('s') * STY.length)], exp: 0, from: 'unknown', since: 'start' };
    g.rep = clamp(Math.round(rating(g) * 0.78 + (h('r') - 0.5) * 12), 0, 100); if (role === 'AGM') g.unit = Math.round(h('u') * 100) / 100; return g;
  }
  /* picks: [{round, ovr}]; mean (overall minus what the round usually gives), null when none */
  function draftGrade(picks) { const L = (picks || []).filter(p => p.ovr != null && p.round <= 4); return L.length ? L.reduce((a, p) => a + p.ovr - EXPECT(p.round), 0) / L.length : null; }
  const FIRE_AT = 0.5;
  /* pressure 0..1 on a sitting GM: a poor three-year record and poor drafts, weighed by the owner's patience; an abrasive one is let go even when not failing; the first two years are protected */
  function pressure(t) {
    const g = t.grade == null ? 0 : t.grade; let p = clamp((0.5 - t.pct3) / 0.3, 0, 1) * 0.7 + clamp(-g / 12, 0, 1) * 0.3;
    p *= 1.55 - patience(t.tid); if (t.gm && clashOf(t.gm) && t.pct3 < 0.6) p += 0.25; if (t.tenure != null && t.tenure < 2) p *= 0.6; if (t.pct3 >= 0.6 && !(t.gm && clashOf(t.gm))) p = Math.min(p, 0.15);
    return p + (hash('gc' + (t.gm ? t.gm.name : '') + t.tid) - 0.5) * 0.06;
  }
  /* yearly change: a good draft raises the eye and development, a winning team raises reputation, age erodes the trade market feel slowly; deterministic */
  function evolve(g, o) {
    const n = Object.assign({}, g), d = o.grade == null ? 0 : clamp(o.grade / 10, -1, 1), w = clamp((o.pct3 - 0.5) * 4, -1, 1), j = k => (hash(k + g.name + o.season) - 0.5) * 3, old = g.age >= 62 ? -1 : 0;
    n.eye = clamp(Math.round(g.eye + 3 * d + j('e')), 30, 99); n.cap = clamp(Math.round(g.cap + 1.5 * w + j('c')), 30, 99); n.trade = clamp(Math.round(g.trade + j('t') + old), 30, 99);
    n.development = clamp(Math.round((g.development != null ? g.development : 60) + 1.5 * d + 1 * w + j('d')), 30, 99); n.rep = clamp(Math.round(repOf(g) + 4 * w + 2 * d), 0, 100); n.age = g.age + 1; n.exp = (g.exp || 0) + (g.role === 'GM' ? 1 : 0); n.idle = 0; return n;
  }
  /* appeal of a team to a candidate */
  const appeal = t => clamp(0.6 * (t.pct3 != null ? t.pct3 : 0.5) + 0.25 * (t.grade == null ? 0.5 : clamp(0.5 + t.grade / 20, 0, 1)) + 0.15 * market(t.tid), 0, 1);
  /* may he take this seat (role 'GM' or 'AGM') at this team? { ok, why, alt } */
  function negotiate(t, g, role) {
    const rep = repOf(g), ap = appeal(t), amb = hash('gamb' + g.name), unproven = (g.exp || 0) === 0 && g.role === 'GM';
    if (role === 'GM') {
      if (g.role === 'AGM' && !((g.unit != null && g.unit >= 0.4) || rating(g) >= 62)) return { ok: false, why: 'He does not feel ready to run a front office yet.', alt: 'AGM' };
      if (g.role === 'GM' && unproven && amb < 0.6 && rep < 55) return { ok: false, why: 'He has never been a general manager and wants an assistant seat first.', alt: 'AGM' };
    } else {
      if (g.role === 'GM' && !unproven && rep >= 70 && !(g.idle >= 2)) return { ok: false, why: 'A general manager of his reputation does not take an assistant seat yet.', alt: 'GM' };
    }
    if (rep >= 75 && ap < 0.35) return { ok: false, why: 'He wants a team that can win now.' };
    if (rep >= 60 && patience(t.tid) < 0.3 && amb < 0.5) return { ok: false, why: 'He does not trust an owner who dismisses executives quickly.' };
    if (rating(g) >= 70 && ap < 0.15) return { ok: false, why: 'The team is too weak for him.' };
    if (clashOf(g) && patience(t.tid) > 0.8 && amb < 0.4) return { ok: false, why: 'A patient owner does not want a man who clashes.' };
    return { ok: true, why: 'He accepts.' };
  }
  /* what a team wants: rating, reputation, style that matches the owner's taste, for an AGM the draft work of his unit */
  function fit(t, g, role) {
    if (!negotiate(t, g, role).ok) return -Infinity; let v = rating(g) + 0.25 * repOf(g);
    if (g.style === teamStyle(t.tid)) v += 3; if (role === 'GM') { if (g.role === 'AGM') v += 40 * ((g.unit != null ? g.unit : 0.5) - 0.45) - 2; else v += 3; if ((t.pct3 || 0.5) < 0.4) v += g.age < 52 ? 3 : -2; if (g.age >= 64) v -= 3; } else v += (g.unit != null ? 10 * g.unit : 0);
    return v + (hash('gcirc' + g.name + t.tid) - 0.5) * 3;
  }
  /* the end-of-season carousel. seats: [{tid, gm, agm, pct3, grade, tenure, unit}]; pool: free executives; season: the season that ended.
     Returns { updates:[{tid, role, gm}], moves:[{type: retired|fired|promoted|hired|demoted|retained, tid, role, gm, from}], pool } */
  function carousel(seats, pool, season) {
    const moves = [], upd = {}, P = pool.map(x => Object.assign({}, x)), setU = (tid, role, g) => { (upd[tid] = upd[tid] || {})[role] = g; };
    const vac = [];
    for (const s of seats) {
      const g = s.gm; if (!g || g.vacant) { vac.push(s.tid); continue; }
      const stay = (s.pct3 >= 0.65 ? 3 : 0), ret = g.age >= retireAgeOf(g) + stay;
      if (ret) { moves.push({ type: 'retired', tid: s.tid, role: 'GM', gm: g }); setU(s.tid, 'GM', { vacant: true }); vac.push(s.tid); continue; }
      if (pressure(s) >= FIRE_AT) { moves.push({ type: 'fired', tid: s.tid, role: 'GM', gm: g }); setU(s.tid, 'GM', { vacant: true }); vac.push(s.tid); P.push(Object.assign({}, g, { role: 'GM', rep: Math.max(0, repOf(g) - 8), from: 'dismissed in ' + season, idle: 0, exp: (g.exp || 0) })); }
    }
    const by = Object.fromEntries(seats.map(s => [s.tid, s])), taken = new Set();
    const order = vac.slice().sort((a, b) => appeal(by[b]) - appeal(by[a]));
    for (const tid of order) {
      const s = by[tid], own = s.agm && !s.agm.vacant ? s.agm : null; let best = null, bv = -Infinity, src = null;
      if (own && hash('gint' + tid + own.name) < 0.45 && negotiate(s, own, 'GM').ok) { best = own; src = 'internal'; bv = Infinity; }
      if (!best) { for (const x of seats) { if (x.tid === tid || !x.agm || x.agm.vacant || taken.has(x.agm.name) || (x.unit != null ? x.unit : x.agm.unit || 0) < 0.65 || rating(x.agm) < 58) continue; const v = fit(s, x.agm, 'GM') + 3; if (v > bv) { bv = v; best = x.agm; src = 'poached:' + x.tid; } }
        for (const c of P) { if (taken.has(c.name) || (s.gm && c.name === s.gm.name)) continue; const v = fit(s, c, 'GM'); if (v > bv) { bv = v; best = c; src = 'pool'; } } }
      if (!best) { best = gen('n' + season + tid, tid, 'GM'); src = 'new'; }
      taken.add(best.name); const h = Object.assign({}, best, { role: 'GM', since: season + 1, idle: 0 }); setU(tid, 'GM', h);
      moves.push({ type: src === 'internal' ? 'promoted' : 'hired', tid, role: 'GM', gm: h, from: src });
      if (src === 'internal') setU(tid, 'AGM', { vacant: true }); else if (src.startsWith('poached:')) setU(+src.slice(8), 'AGM', { vacant: true });
    }
    /* assistant seats left empty: best candidate, a dismissed GM may drop to assistant */
    const left = P.filter(c => !taken.has(c.name));
    for (const s of seats) {
      const emptied = upd[s.tid] && upd[s.tid].AGM && upd[s.tid].AGM.vacant, empty = !s.agm || s.agm.vacant;
      if (!(emptied || empty)) continue; let best = null, bv = -Infinity;
      for (const c of left) { if (taken.has(c.name)) continue; const v = fit(s, c, 'AGM'); if (v > bv) { bv = v; best = c; } }
      let src = best ? 'pool' : 'new'; if (!best) best = gen('na' + season + s.tid, s.tid, 'AGM'); taken.add(best.name);
      const dem = best.role === 'GM', h = Object.assign({}, best, { role: 'AGM', since: season + 1, idle: 0, unit: best.unit != null ? best.unit : Math.round(hash('u' + best.name) * 100) / 100 }); setU(s.tid, 'AGM', h);
      moves.push({ type: dem ? 'demoted' : 'hired', tid: s.tid, role: 'AGM', gm: h, from: src });
    }
    for (const c of P) if (!taken.has(c.name)) c.idle = (c.idle || 0) + 1;
    const out = []; for (const tid of Object.keys(upd)) for (const role of Object.keys(upd[tid])) out.push({ tid: +tid, role, gm: upd[tid][role] });
    return { updates: out, moves, pool: P.filter(c => !taken.has(c.name) && (c.idle || 0) < 4 && !(c.age >= retireAgeOf(c))).slice(-14) };
  }
  const api = { gen, rating, repOf, retireAgeOf, clashOf, draftGrade, pressure, evolve, appeal, negotiate, fit, carousel, patience, teamStyle, FIRE_AT, STY };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMGM = api;
})(typeof self !== 'undefined' ? self : this);
