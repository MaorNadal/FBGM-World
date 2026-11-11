/* Pure engine of the fantasy league with AI managers (FR-FLG, first playable version 1.43). No real names, logos or text of any fantasy service are used; only the common rules of fantasy football.
   Scoring (all values are settings): 0.04 per passing yard, 4 per passing touchdown, -2 per interception, 0.1 per rushing or receiving yard, 6 per rushing or receiving touchdown, -2 per fumble lost,
   reception 0 / 0.5 / 1 (standard / half / full PPR); kicker: extra point 1, field goal 3 (under 40 yards), 4 (40 to 49), 5 (50 or more), a miss -1 (to verify against the owner's league: the kicker rules are the common ones);
   defence and special teams: sack 1, interception 2, fumble recovery 2, safety 2, defensive and return touchdown 6, points allowed tiers 10 / 7 / 4 / 1 / 0 / -1 / -4.
   Roster: QB, 2 RB, 2 WR, TE, FLEX (RB, WR or TE), D/ST, K and 7 bench players; snake draft; round-robin head-to-head weeks; the best 4 teams play two playoff weeks.
   Known limits of this version: no waivers or trades, lineups are set automatically from the projections (players who did not play that week are replaced by the best bench player of the position). */
(function (root) {
  const hash = s => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  const rng = seed => { let s = hash(seed) | 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  const n = v => +v || 0;
  const SLOTS = ['QB', 'RB', 'RB', 'WR', 'WR', 'TE', 'FLEX', 'DST', 'K'], BENCH = 7, ROUNDS = SLOTS.length + BENCH;
  const SCORING = { std: { label: 'Standard', rec: 0 }, half: { label: 'Half PPR', rec: 0.5 }, ppr: { label: 'Full PPR', rec: 1 } };
  /* points of one stat line (a box row or a season row) */
  function points(r, sc) {
    if (!r) return 0; const rec = sc && sc.rec != null ? sc.rec : 0;
    let p = n(r.pssYds) * .04 + n(r.pssTD) * 4 - n(r.pssInt) * 2 + (n(r.rusYds) + n(r.recYds)) * .1 + (n(r.rusTD) + n(r.recTD)) * 6 - n(r.fmbLost) * 2 + n(r.rec) * rec;
    p += n(r.xp) + (n(r.fg0) + n(r.fg20) + n(r.fg30)) * 3 + n(r.fg40) * 4 + n(r.fg50) * 5;
    p -= Math.max(0, n(r.fga0) - n(r.fg0)) + Math.max(0, n(r.fga20) - n(r.fg20)) + Math.max(0, n(r.fga30) - n(r.fg30)) + Math.max(0, n(r.fga40) - n(r.fg40)) + Math.max(0, n(r.fga50) - n(r.fg50));
    return Math.round(p * 100) / 100;
  }
  /* defence and special teams of one game: t = the team's own game object, allowed = the opponent's points */
  function dst(t, allowed) {
    if (!t) return 0; const a = n(allowed), tier = a === 0 ? 10 : a <= 6 ? 7 : a <= 13 ? 4 : a <= 20 ? 1 : a <= 27 ? 0 : a <= 34 ? -1 : -4;
    return n(t.defSk) + n(t.defInt) * 2 + n(t.defFmbRec) * 2 + n(t.defSft) * 2 + (n(t.defIntTD) + n(t.defFmbTD) + n(t.prTD) + n(t.krTD)) * 6 + tier;
  }
  /* best lineup of a roster. R: [{ id, pos, v }] where v is the value used to choose; ok(id) says whether the player can play (default all) */
  function lineup(R, ok) {
    const free = R.filter(x => !ok || ok(x.id)).sort((a, b) => b.v - a.v || String(a.id).localeCompare(String(b.id))), used = new Set(), out = [];
    for (const s of SLOTS) { if (s === 'FLEX') continue; const x = free.find(q => !used.has(q.id) && q.pos === s); if (x) { used.add(x.id); out.push({ slot: s, id: x.id }); } else out.push({ slot: s, id: null }); }
    const f = free.find(q => !used.has(q.id) && (q.pos === 'RB' || q.pos === 'WR' || q.pos === 'TE')); if (f) { used.add(f.id); out.splice(SLOTS.indexOf('FLEX'), 0, { slot: 'FLEX', id: f.id }); } else out.splice(SLOTS.indexOf('FLEX'), 0, { slot: 'FLEX', id: null });
    return out;
  }
  /* snake order: the manager index of every pick */
  function snake(nTeams, rounds) { const o = []; for (let r = 0; r < rounds; r++) for (let i = 0; i < nTeams; i++) o.push(r % 2 ? nTeams - 1 - i : i); return o; }
  /* round-robin (circle method): weeks x pairs of manager indices; an odd number of managers gives a bye (null) */
  function schedule(nTeams, weeks) {
    const t = Array.from({ length: nTeams }, (_, i) => i); if (nTeams % 2) t.push(null); const m = t.length, out = [];
    for (let w = 0; w < weeks; w++) {
      const r = w % (m - 1), rest = t.slice(1), rot = rest.map((_, i) => rest[(i + r) % (m - 1)]), arr = [t[0]].concat(rot), pairs = [];
      for (let i = 0; i < m / 2; i++) { const a = arr[i], b = arr[m - 1 - i]; if (a != null && b != null) pairs.push([a, b]); }
      out.push(pairs);
    }
    return out;
  }
  /* standings from results [{ a, b, pa, pb }]; wins, then points for */
  function standings(nTeams, results) {
    const S = Array.from({ length: nTeams }, (_, i) => ({ m: i, w: 0, l: 0, t: 0, pf: 0, pa: 0 }));
    for (const r of results) { const A = S[r.a], B = S[r.b]; A.pf += r.pa; A.pa += r.pb; B.pf += r.pb; B.pa += r.pa; if (r.pa > r.pb) { A.w++; B.l++; } else if (r.pa < r.pb) { B.w++; A.l++; } else { A.t++; B.t++; } }
    return S.sort((a, b) => (b.w + b.t / 2) - (a.w + a.t / 2) || b.pf - a.pf || a.m - b.m);
  }
  const STRAT = { bpa: { label: 'Best available' }, qb: { label: 'Quarterback early', b: { QB: 1.3 } }, rb: { label: 'Running backs first', b: { RB: 1.22 } }, wr: { label: 'Receivers first', b: { WR: 1.18, TE: 1.08 } }, upside: { label: 'Upside and rookies', b: { WR: 1.06, RB: 1.06 }, young: 1 }, vets: { label: 'Veterans', old: 1 }, contrarian: { label: 'Contrarian', random: 1 } };
  const MAXPOS = { QB: 3, RB: 6, WR: 6, TE: 2, K: 1, DST: 1 }, MIN = { QB: 1, RB: 2, WR: 2, TE: 1, K: 1, DST: 1 };
  /* one AI pick. mgr: { strat, risk }, mine: ids already on his roster, pool: all candidates [{ id, pos, proj, age }], taken: Set of ids, round: 1-based; r: random function */
  function aiPick(mgr, mine, pool, taken, round, rounds, r, byId) {
    const cnt = {}; mine.forEach(id => { const p = byId[id]; if (p) cnt[p.pos] = (cnt[p.pos] || 0) + 1; });
    const unfilled = Object.keys(MIN).filter(k => (cnt[k] || 0) < MIN[k]), left = rounds - round + 1, forced = unfilled.length >= left;
    const st = STRAT[mgr.strat] || STRAT.bpa; let best = null, bv = -Infinity;
    for (const p of pool) {
      if (taken.has(p.id)) continue; const c = cnt[p.pos] || 0;
      if (c >= (MAXPOS[p.pos] || 99)) continue; if (forced && !unfilled.includes(p.pos)) continue;
      if ((p.pos === 'K' || p.pos === 'DST') && round < rounds - 2 && !forced) continue;
      let v = p.proj, bias = st.b && st.b[p.pos] || 1; if (st.b && st.b.QB && p.pos === 'QB' && round > 5) bias = 1;
      if (st.young && p.age != null && p.age <= 24) bias *= 1.12; if (st.old && p.age != null && p.age >= 29) bias *= 1.08; if (st.random) bias *= 0.85 + r() * 0.3;
      if (unfilled.includes(p.pos)) bias *= 1.03;
      v = v * bias * (1 + (r() - 0.5) * (mgr.risk || 0.3) * 0.3);
      if (v > bv) { bv = v; best = p; }
    }
    return best;
  }
  /* run the AI picks from the current state until it is the owner's turn or the draft ends.
     L: { n, rounds, owner, seed, picks: [ids] }, mgrs: [{ strat, risk }], pool, byId. Returns the new picks array. */
  function advance(L, mgrs, pool, byId) {
    const order = snake(L.n, L.rounds), picks = L.picks.slice(), taken = new Set(picks);
    while (picks.length < order.length) {
      const k = picks.length, m = order[k]; if (m === L.owner) break;
      const mine = picks.filter((_, i) => order[i] === m), p = aiPick(mgrs[m], mine, pool, taken, Math.floor(k / L.n) + 1, L.rounds, rng(L.seed + '|' + k), byId);
      if (!p) break; picks.push(p.id); taken.add(p.id);
    }
    return picks;
  }
  /* rosters (ids by manager) from the picks */
  function rosters(L) { const order = snake(L.n, L.rounds), R = Array.from({ length: L.n }, () => []); L.picks.forEach((id, i) => R[order[i]].push(id)); return R; }
  /* playoffs: the top `k` of the standings, two rounds (semi-finals, final). Returns the seeds; the weekly points decide through play(). */
  function bracket(st, k) { return st.slice(0, k || 4).map(x => x.m); }
  const api = { SLOTS, BENCH, ROUNDS, SCORING, STRAT, points, dst, lineup, snake, schedule, standings, aiPick, advance, rosters, bracket, rng };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMFantasyLeague = api;
})(typeof self !== 'undefined' ? self : this);
