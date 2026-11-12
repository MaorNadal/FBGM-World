/* Pure: the coaching market and the coaching carousel (a NARRATIVE layer, like coaches.js; none of it changes the game's simulation).
   CC-3 (version 1.45) replaces the random draws of 1.39 to 1.44 by decisions that follow from what each coach and each team IS, modelled on how the NFL works
   (researched 2026-11-12: five to nine head-coach changes a year, a few of them in the middle of the season after a bad start, for example a coach let go after 1 win in 6 games or 2 in 10;
   the assistant coach, usually a coordinator, takes over as interim head coach; fired head coaches often return as coordinators; the best coordinators are the most wanted head-coach candidates).
   A coach: { name, role (HC, OC, DC), style (his personality), plan, motivation, development (35 to 99, they rise and fall with the years), rep (reputation 0 to 100), age, retireAge, exp (years as head coach),
              unit (coordinators: percentile of his unit in the league, 0 to 1), idle (years without a job), clash (an abrasive trait that costs jobs), interim, from, pid }.
   A team: its own owner trait, a stable patience, a preferred style, a market size; the owner's patience changes how much a bad result weighs.
   Nothing is drawn at random in a decision. Small "circumstance" terms come from a hash of the names (the same every time) and only break ties between close cases. */
(function (root) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = str => { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  const rating = c => c ? (c.plan + c.motivation + c.development) / 3 : 0;
  const STY = ['Disciplinarian', 'Players’ coach', 'Innovator', 'Defensive mind', 'Offensive guru', 'Developer of talent', 'Old school', 'Analytics-minded'];
  const OFF = ['Offensive guru', 'Innovator', 'Analytics-minded'], DEF = ['Defensive mind', 'Disciplinarian', 'Old school'];
  const STYLE = { QB: 'Offensive guru', WR: 'Offensive guru', RB: 'Offensive guru', TE: 'Offensive guru', OL: 'Disciplinarian', DL: 'Defensive mind', LB: 'Defensive mind', CB: 'Defensive mind', S: 'Defensive mind', K: 'Analytics-minded', P: 'Analytics-minded' };
  /* ---- what a coach is ---- */
  const repOf = c => c.rep != null ? c.rep : Math.round(rating(c) * 0.85);
  /* the age at which he stops: most between 60 and 69, a tail to the late seventies; a successful coach goes on a little longer (see wantsToStay) */
  const retireAgeOf = c => c.retireAge != null ? c.retireAge : 60 + Math.floor(hash('ra' + c.name) * 10) + (hash('rb' + c.name) > 0.88 ? 4 + Math.floor(hash('rc' + c.name) * 9) : 0);
  const clashOf = c => c.clash != null ? !!c.clash : hash('cl' + c.name) > 0.93;
  /* ---- what a team is ---- */
  const teamTrait = tid => ({ patience: 0.25 + 0.65 * hash('pat' + tid), prefStyle: STY[Math.floor(hash('sty' + tid) * STY.length)], market: hash('mk' + tid) });
  const appealOf = t => clamp(0.6 * (t.pct || 0) + 0.2 * ((t.po != null && t.po >= 0) ? 1 : 0) + 0.2 * teamTrait(t.tid).market, 0, 1);
  /* ---- pressure on a coach ---- */
  /* end of season: sec = the job-security meter 0 to 100 of coaches.js; a patient owner (0.9) waits, an impatient one (0.25) does not; an abrasive coach is let go even when winning */
  function pressure(sec, patience, o) {
    o = o || {}; let p = clamp((55 - sec) / 55, 0, 1) * (1.55 - patience);
    if (o.clash && sec < 80) p += 0.3 * (1.55 - patience) / 1.05; if (o.firstYear) p *= 0.7; p += ((o.circ == null ? 0.5 : o.circ) - 0.5) * 0.1; if (sec >= 70 && !(o.clash)) p = Math.min(p, 0.1);
    return p;
  }
  const FIRE_AT = 0.45;
  /* in the middle of the season: s = { g games, w, l, t, exp expected win share before the season, mpg margin per game, lossStreak, patience, clash, firstYear }.
     A season that has gone far below the expectation (a team expected to win about 60 percent that is 1-6 or 1-9) crosses the line; a mere bad start does not. */
  function inSeasonPressure(s) {
    if (!s || s.g < 5) return 0; const pct = (s.w + (s.t || 0) / 2) / s.g, gap = Math.max(0, s.exp - pct), weight = Math.min(1, s.g / 9);
    let p = gap * weight * (1.6 - s.patience); if (s.lossStreak >= 5) p += 0.1; if (s.mpg < -10) p += 0.08; if (s.clash) p += 0.1; if (s.firstYear) p *= 0.65; return p;
  }
  const FIRE_IN = 0.55;
  /* ---- the yearly change of a coach: perf from -1 (a disaster) to +1 (a triumph) ---- */
  function evolve(c, perf, season) {
    const age = c.age, g = age < 48 ? 1.4 : age < 56 ? 0.6 : age < 63 ? 0 : -0.7, step = (k, w) => clamp(Math.round(c[k] + (g + 2.2 * perf) * w), 35, 99);
    return Object.assign({}, c, { plan: step('plan', 1), motivation: step('motivation', age >= 62 ? 0.3 : 0.8), development: step('development', age < 50 ? 1.2 : 0.5), rep: clamp(Math.round(repOf(c) + 6 * perf - (age > 66 ? 1 : 0)), 0, 100), age: age + 1, agedIn: season,
      idle: c.idle != null ? c.idle : 0, retireAge: retireAgeOf(c), clash: clashOf(c), exp: (c.exp || 0) + (c.role === 'HC' ? 1 : 0) });
  }
  const wantsToStay = (c, successful) => c.age < retireAgeOf(c) + (successful ? 3 : 0);
  /* ---- the negotiation (1.47): a coach may refuse a seat or a team. t needs { tid, pct, po }. Returns { ok, why, alt } where alt is the role he would take instead. ---- */
  function negotiate(t, c, role) {
    const rep = repOf(c), tr = teamTrait(t.tid), ap = appealOf(t), amb = hash('amb' + c.name), unproven = (c.exp || 0) === 0 && c.role === 'HC', natural = OFF.includes(c.style) ? 'OC' : DEF.includes(c.style) ? 'DC' : 'OC';
    if (role === 'HC') {
      if (unproven && amb < 0.65 && rep < 55) return { ok: false, why: 'He has never coached at this level and wants a coordinator job first.', alt: natural };
      if (c.role !== 'HC' && !(c.unit != null && c.unit >= 0.4) && rating(c) < 58) return { ok: false, why: 'He does not feel ready for a head-coach job yet.', alt: c.role };
    } else {
      if (c.role !== 'HC' && c.role !== role) return { ok: false, why: 'He is ' + (c.role === 'OC' ? 'an offensive' : 'a defensive') + ' specialist.', alt: c.role };
      if (c.role === 'HC' && !unproven && rep >= 70 && !(c.idle >= 2)) return { ok: false, why: 'A head coach of his reputation does not take a coordinator job yet.', alt: 'HC' };
    }
    if (rep >= 75 && ap < 0.35) return { ok: false, why: 'He wants a team that can win now.' };
    if (rep >= 60 && tr.patience < 0.3 && amb < 0.5) return { ok: false, why: 'He does not trust an owner who fires coaches quickly.' };
    if (rating(c) >= 70 && ap < 0.15) return { ok: false, why: 'The team is too weak for him.' };
    return { ok: true, why: 'He accepts.' };
  }
  /* ---- how much a team wants a candidate for a seat ---- */
  /* 1.55: the general manager's philosophy leans the hiring: the coach styles that go with each GM style (a bonus in fit, never a veto) */
  const GMPREF = { 'Draft-and-develop': ['Developer of talent'], 'Win-now veteran buyer': ['Old school', 'Disciplinarian'], 'Cap wizard': ['Analytics-minded'], 'Trade-happy dealer': ['Innovator', 'Offensive guru'], 'Analytics-driven': ['Analytics-minded', 'Innovator'], 'Old-school scout': ['Old school', 'Players’ coach'] };
  function fit(t, c, role) {
    if (!negotiate(t, c, role).ok) return -Infinity;
    const tr = teamTrait(t.tid); let v = rating(c) + 0.25 * repOf(c);
    if (role === 'HC') {
      if (c.role !== 'HC') v += 40 * ((c.unit != null ? c.unit : 0.5) - 0.45) - 2; else v += 3;
      if ((t.pct || 0) < 0.4) { v += c.age < 52 ? 4 : -2; if (c.style === 'Developer of talent') v += 3; } else if ((c.exp || 0) > 3) v += 2;
      if (c.age >= 64) v -= 3;
    } else {
      if (c.role === role) v += 6;
      else if (c.role === 'HC') { const nat = role === 'OC' ? OFF : DEF; if ((c.exp || 0) === 0) v += nat.includes(c.style) ? 1 : -3; else { v -= 6; if (!nat.includes(c.style)) v -= 4; } }
      else return -Infinity;
      if (c.clash) v -= 3;
    }
    if (c.style === tr.prefStyle) v += 5; if (t.gmStyle && (GMPREF[t.gmStyle] || []).includes(c.style)) v += 4; if (repOf(c) >= 75 && appealOf(t) < 0.35) return -Infinity;
    return v + (hash(c.name + '|' + t.tid) - 0.5) * 1.5;
  }
  const ROLES = ['HC', 'OC', 'DC'], KEY = { HC: 'coach', OC: 'oc', DC: 'dc' }, SEC = { HC: 'security', OC: 'secOC', DC: 'secDC' };
  const live = c => c && !c.vacant;
  /* tms: [{ tid, coach, oc, dc, security, secOC, secDC, pct, exp, po }]; pool: coaches without a job. Returns { moves, retired, pool, updates }.
     updates = every employed coach after his yearly change (the page stores them). */
  function carousel(tms, pool, season) {
    const out = { moves: [], retired: [], pool: [], updates: [] }, staff = {}, T = {}, note = (tid, role, type, coach, why, extra) => out.moves.push(Object.assign({ tid, role, type, coach, reason: why }, extra || {}));
    const perfOf = (t, role) => role === 'HC' ? clamp((((t.pct || 0) - (t.exp != null ? t.exp : 0.5)) * 2.2) + (t.po != null && t.po >= 0 ? 0.25 + 0.1 * t.po : 0), -1, 1) : clamp(((t[SEC[role]] == null ? 55 : t[SEC[role]]) - 55) / 45, -1, 1);
    for (const t of tms) { T[t.tid] = t; for (const k of ROLES) { const c = t[KEY[k]]; if (live(c)) { const e = c.agedIn === season ? c : evolve(c, perfOf(t, k), season); if (k !== 'HC') e.unit = clamp(0.5 + perfOf(t, k) / 2, 0, 1); staff[t.tid + k] = e; out.updates.push({ tid: t.tid, role: k, coach: e }); } else staff[t.tid + k] = null; } }
    const open = [];
    for (const t of tms) {
      const tr = teamTrait(t.tid);
      for (const k of ROLES) {
        const c = staff[t.tid + k], sec = t[SEC[k]] == null ? 55 : t[SEC[k]];
        if (!c) { open.push({ tid: t.tid, role: k, was: null }); continue; }
        const successful = k === 'HC' ? (t.pct || 0) >= 0.6 : sec >= 65;
        if (!wantsToStay(c, successful)) { staff[t.tid + k] = null; open.push({ tid: t.tid, role: k, was: c, retired: true }); note(t.tid, k, 'retired', c, 'age ' + c.age); continue; }
        if (k === 'HC' && c.interim) { if ((t.pct || 0) >= 0.5) { staff[t.tid + k] = Object.assign({}, c, { interim: false }); out.updates.find(u => u.tid === t.tid && u.role === 'HC').coach = staff[t.tid + k]; note(t.tid, k, 'retained', c, 'the interim coach earned the job'); continue; } staff[t.tid + k] = null; open.push({ tid: t.tid, role: k, was: c }); note(t.tid, k, 'fired', c, 'the interim coach is not kept'); continue; }
        const ct = contractOf(c, season), cf = ct && ct.left != null ? (ct.left > 0 ? 1 - 0.07 * Math.min(ct.left, 3) : 1.04) : 1; /* years left on the contract make an owner slower to pay him off; an expired one makes it easier */
        const p = cf * pressure(sec, tr.patience, { clash: clashOf(c) && k === 'HC', firstYear: (c.exp || 0) <= 1 && k === 'HC', circ: hash('c' + c.name + season) });
        if (p >= (k === 'HC' ? FIRE_AT : FIRE_AT + 0.05)) { staff[t.tid + k] = null; open.push({ tid: t.tid, role: k, was: c }); note(t.tid, k, 'fired', c, sec < 35 ? 'results far below the expectation' : sec < 55 ? 'the owner ran out of patience' : 'a clash with the owner'); }
      }
    }
    /* the market: the old pool grows a year older; those past their retirement age leave */
    const market = []; for (const c0 of pool) { const c = Object.assign({ role: 'HC' }, c0); const e = c.agedIn === season ? c : Object.assign({}, c, { age: c.age + 1, agedIn: season, idle: (c.idle || 0) + 1, rep: clamp(repOf(c) - 2, 0, 100), retireAge: retireAgeOf(c), clash: clashOf(c) }); if (e.age >= retireAgeOf(e) + 1 || e.idle > 5) out.retired.push(e); else market.push(e); }
    let k = 0; while (market.length < Math.max(12, open.length + 6)) { const role = market.filter(c => c.role === 'HC').length < 6 ? 'HC' : market.filter(c => c.role === 'OC').length < 4 ? 'OC' : market.filter(c => c.role === 'DC').length < 4 ? 'DC' : ROLES[k % 3]; market.push(Object.assign({ since: null }, newCoach('free' + season + ':' + (k++), role))); }
    const avoid = new Map(open.filter(o => o.was).map(o => [o.tid + o.role, o.was.name]));
    const queue = open.slice().sort((a, b) => (a.role === 'HC' ? 0 : 1) - (b.role === 'HC' ? 0 : 1) || appealOf(T[b.tid]) - appealOf(T[a.tid]) || a.tid - b.tid);
    let guard = 0;
    while (queue.length && guard++ < 300) {
      const o = queue.shift(), role = o.role, t = T[o.tid], cands = market.filter(c => c.name !== avoid.get(o.tid + role)).map(c => ({ c, v: fit(t, c, role), src: 'market' }));
      if (role === 'HC') for (const tt of tms) { if (tt.tid === o.tid) continue; for (const q of ['OC', 'DC']) { const c = staff[tt.tid + q]; if (c && c.unit != null && c.unit >= 0.7 && c.age < 60 && !queue.some(x => x.tid === tt.tid && x.role === q)) cands.push({ c, v: fit(t, c, 'HC'), src: 'staff', from: { tid: tt.tid, role: q } }); } }
      const best = cands.filter(x => x.v > -Infinity).sort((a, b) => b.v - a.v)[0]; if (!best) continue;
      const hired = Object.assign({}, best.c, { role, since: season, interim: false }), wasHC = best.c.role === 'HC' && role !== 'HC';
      if (best.src === 'market') market.splice(market.indexOf(best.c), 1); else { staff[best.from.tid + best.from.role] = null; queue.push({ tid: best.from.tid, role: best.from.role, was: null }); note(best.from.tid, best.from.role, 'promoted', best.c, 'a hot coordinator, hired as a head coach elsewhere'); }
      staff[o.tid + role] = hired; out.moves.push({ tid: o.tid, role, type: wasHC ? 'demoted' : 'hired', coach: hired, rating: Math.round(rating(hired)), reason: best.src === 'staff' ? 'promoted from another staff (unit ranked in the top ' + Math.max(1, Math.round((1 - best.c.unit) * 32)) + ')' : wasHC ? 'a former head coach takes a coordinator job' : (hired.from || '') });
      if (role === 'HC') for (const q of ['OC', 'DC']) { const cur = staff[o.tid + q], nat = q === 'OC' ? OFF : DEF; if (cur && nat.includes(hired.style) && cur.unit != null && cur.unit < 0.45 && !queue.some(x => x.tid === o.tid && x.role === q)) { staff[o.tid + q] = null; note(o.tid, q, 'fired', cur, 'the new head coach, ' + (q === 'OC' ? 'an offensive' : 'a defensive') + ' specialist, brings his own coordinator'); queue.push({ tid: o.tid, role: q, was: cur }); avoid.set(o.tid + q, cur.name); } }
    }
    for (const o of open) if (o.was && !o.retired) market.push(Object.assign({}, o.was, { from: (o.role === 'HC' ? 'fired ' : 'let go ') + season, idle: 0, rep: clamp(repOf(o.was) - (o.role === 'HC' ? 8 : 4), 0, 100), interim: false }));
    while (market.length < 12) { const role = market.filter(c => c.role === 'HC').length < 5 ? 'HC' : market.filter(c => c.role === 'OC').length < 3 ? 'OC' : market.filter(c => c.role === 'DC').length < 3 ? 'DC' : ROLES[k % 3]; market.push(Object.assign({ since: null }, newCoach('free' + season + ':' + (k++), role))); }
    out.updates = out.updates.map(u => ({ tid: u.tid, role: u.role, coach: staff[u.tid + u.role] })).filter(u => u.coach && out.updates.some(w => w.tid === u.tid && w.role === u.role && w.coach.name === u.coach.name));
    out.pool = market; return out;
  }
  /* the middle of the season: the teams whose season has collapsed. Returns [{ tid, fired, interim, from, pressure, why }]; the interim head coach is the coordinator with the better rating. */
  function inSeason(tms) {
    const res = [];
    for (const t of tms) {
      const c = t.coach; if (!live(c) || c.interim) continue; const tr = teamTrait(t.tid);
      const p = inSeasonPressure({ g: t.g, w: t.w, l: t.l, t: t.t, exp: t.exp, mpg: t.mpg, lossStreak: t.lossStreak || 0, patience: tr.patience, clash: clashOf(c), firstYear: (c.exp || 0) <= 1 });
      if (p < FIRE_IN) continue;
      const cand = [['OC', t.oc], ['DC', t.dc]].filter(x => live(x[1])).sort((a, b) => rating(b[1]) - rating(a[1]))[0];
      res.push({ tid: t.tid, fired: c, interim: cand ? Object.assign({}, cand[1], { role: 'HC', interim: true, since: null }) : null, from: cand ? cand[0] : null, pressure: Math.round(p * 100) / 100, why: t.w + '–' + t.l + (t.t ? '–' + t.t : '') + ' after ' + t.g + ' games against an expectation of ' + Math.round(t.exp * 100) + '%' });
    }
    return res.sort((a, b) => b.pressure - a.pressure);
  }
  /* ---- candidates ---- */
  function fromPlayer(p, season) {
    const R = (p.ratings || []).filter(r => r && typeof r.ovr === 'number'), peak = R.length ? Math.max(...R.map(r => r.ovr)) : 50, pos = (R[R.length - 1] || {}).pos || '';
    const av = (p.stats || []).filter(s => !s.playoffs).reduce((a, s) => a + (+s.av || 0), 0), aw = p.awards || [];
    const titles = aw.filter(a => /won championship/i.test(a.type)).length, honours = aw.filter(a => /most valuable|player of the year|all-league|finals mvp/i.test(a.type)).length;
    const years = new Set((p.stats || []).filter(s => (+s.gp || 0) > 0).map(s => s.season)).size, j = k => Math.round((hash('pc' + p.pid + k) - 0.5) * 10), smart = ['QB', 'OL', 'LB', 'S', 'K', 'P'].includes(pos) ? 4 : 0;
    const c = { name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || 'Player ' + p.pid, role: 'HC', style: STYLE[pos] || 'Players’ coach', plan: clamp(Math.round(40 + (peak - 55) * 0.7 + Math.min(10, av / 25) + smart + j(1)), 35, 95),
      motivation: clamp(Math.round(42 + 6 * Math.min(titles, 4) + 3 * Math.min(honours, 6) + j(2)), 35, 95), development: clamp(Math.round(42 + Math.min(14, years * 1.2) + (['QB', 'OL', 'K', 'P'].includes(pos) ? 4 : 0) + j(3)), 35, 95),
      age: p.born && p.born.year != null ? season - p.born.year : 45, pid: p.pid, exp: 0, from: 'former ' + (pos || 'player') + (titles ? ', ' + titles + ' title' + (titles === 1 ? '' : 's') : '') };
    c.rep = clamp(Math.round(rating(c) * 0.7 + titles * 4 + honours * 2), 0, 100); return c;
  }
  function playerPool(players, season, n) {
    return players.filter(p => p.tid === -3 && (p.ratings || []).length).map(p => { const c = fromPlayer(p, season), R = p.ratings; return { c, v: Math.max(...R.map(r => r.ovr || 0)) + (p.hof ? 10 : 0) + (p.awards || []).length * 1.5 }; }).filter(x => x.c.age >= 30 && x.c.age <= 75).sort((a, b) => b.v - a.v || a.c.pid - b.c.pid).slice(0, n).map(x => x.c);
  }
  const FN = ['Dale', 'Marcus', 'Ray', 'Tom', 'Gene', 'Hank', 'Lou', 'Vince', 'Ed', 'Carl', 'Sam', 'Pete', 'Walt', 'Nate', 'Rex', 'Gus', 'Dean', 'Frank', 'Jack', 'Leon'], LN = ['Brennan', 'Okafor', 'Whitfield', 'Marsh', 'Delgado', 'Kowalski', 'Hargrove', 'Tanaka', 'Boyd', 'Ferraro', 'Lindqvist', 'Mercer', 'Odom', 'Pruitt', 'Reyes', 'Sutter', 'Thorne', 'Vega', 'Walsh', 'Yates'];
  const ORIGIN = ['college coordinator', 'NFL position coach', 'longtime assistant', 'small-college head coach', 'analyst turned coach', 'special-teams coordinator'];
  function newCoach(seed, role) {
    const h = k => hash(seed + k), pick = (a, k) => a[Math.floor(h(k) * a.length)], rt = k => 45 + Math.floor(h(k) * 41); role = role || 'HC';
    const style = role === 'OC' ? pick(OFF.concat(['Old school']), 's') : role === 'DC' ? pick(DEF.concat(['Innovator']), 's') : pick(STY, 's');
    const c = { name: pick(FN, 'f') + ' ' + pick(LN, 'l'), role, style, plan: rt('p'), motivation: rt('m'), development: rt('d'), age: (role === 'HC' ? 42 : 36) + Math.floor(h('a') * 26), from: pick(ORIGIN, 'o'), exp: 0 };
    c.rep = clamp(Math.round(rating(c) * 0.75 + (h('r') - 0.5) * 12), 0, 100); return c;
  }
  const clashOfExport = clashOf;
  /* 1.57: a contract, from the coach and the year he took the seat (used by the carousel: years left lower the pressure to dismiss): a head coach 3 to 6 years (longer for a famous one), a coordinator 2 to 4;
     { years, from, ends, left (years left after the given season), owed (what a dismissal now would leave unpaid, in years) } */
  function contractOf(c, season) {
    if (!c || c.vacant) return null; const since = typeof c.since === 'number' ? c.since : null, r = c.role || 'HC', base = r === 'HC' ? 3 : 2, span = r === 'HC' ? 3 : 2;
    const years = base + Math.floor(hash('ct' + c.name) * span) + (repOf(c) >= 75 ? 1 : 0), from = since != null ? since : null, ends = from != null ? from + years - 1 : null;
    const left = ends != null && season != null ? Math.max(0, ends - season) : null; return { years, from, ends, left, owed: left };
  }
  const api = { contractOf, negotiate, clashOf: clashOfExport, rating, repOf, retireAgeOf, teamTrait, appealOf, pressure, inSeasonPressure, FIRE_AT, FIRE_IN, evolve, fit, carousel, inSeason, fromPlayer, playerPool, newCoach };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMCarousel = api;
})(typeof self !== 'undefined' ? self : this);
