/* Pure: division order and playoff seeds under the league's tiebreaker list (FR-LG-1, FR-SIM-5).
   Regular-season games only, all-star games excluded; teams[0] of a game header is home. Criteria (names read from the league's list, default as section 3.6):
   head-to-head, division record, common opponents, conference record, strength of victory, strength of schedule, margin of victory, coin flip.
   Multi-team ties: after one team is placed the rest start again from the first criterion. The coin flip is a fixed hash (the same every time).
   Known limits: head-to-head needs every tied team to have played another tied team; common opponents have no minimum number of games; a wild-card tie inside one division is not narrowed to the division's best team first. */
(function (root) {
  const DEFAULT = ['headToHead', 'divisionRecord', 'commonOpponents', 'confRecord', 'strengthOfVictory', 'strengthOfSchedule', 'marginOfVictory', 'coinFlip'];
  const KEY = [[/head/i, 'h2h'], [/div/i, 'division'], [/common/i, 'common'], [/conf/i, 'conf'], [/margin|point|mov/i, 'mov'], [/victory/i, 'sov'], [/schedule/i, 'sos'], [/coin|random/i, 'coin']];
  const NAME = { h2h: 'head to head', division: 'division record', common: 'common opponents', conf: 'conference record', sov: 'strength of victory', sos: 'strength of schedule', mov: 'margin of victory', coin: 'coin flip' };
  const sum = a => a[0] + a[1] + a[2], pct = a => sum(a) ? (a[0] + a[2] / 2) / sum(a) : 0;
  function criteria(list) {
    const out = [];
    for (const n of (Array.isArray(list) ? list : DEFAULT)) { const k = typeof n === 'string' ? KEY.find(x => x[0].test(n)) : null; if (k && !out.includes(k[1])) out.push(k[1]); }
    return out.length ? out : DEFAULT.map(n => KEY.find(x => x[0].test(n))[1]);
  }
  function build(games, teams, season) {
    const cd = {}, R = {};
    for (const t of teams) { const s = (t.seasons || []).find(x => x.season === season); cd[t.tid] = { cid: s && s.cid != null ? s.cid : t.cid, did: s && s.did != null ? s.did : t.did }; R[t.tid] = { rec: [0, 0, 0], div: [0, 0, 0], conf: [0, 0, 0], pf: 0, pa: 0, opp: {} }; }
    for (const g of games) {
      if (g.season !== season || g.allStar || g.playoffs || !g.teams || g.teams.length !== 2 || g.teams[0].pts == null || g.teams[1].pts == null) continue;
      g.teams.forEach((x, i) => {
        const o = g.teams[1 - i], r = R[x.tid], q = R[o.tid]; if (!r || !q) return;
        const k = x.pts > o.pts ? 0 : x.pts < o.pts ? 1 : 2, a = cd[x.tid], b = cd[o.tid];
        r.rec[k]++; r.pf += x.pts; r.pa += o.pts; (r.opp[o.tid] = r.opp[o.tid] || [0, 0, 0])[k]++;
        if (a.did != null && a.did === b.did) r.div[k]++;
        if (a.cid != null && a.cid === b.cid) r.conf[k]++;
      });
    }
    return { R, cd, season };
  }
  const flip = (tid, season) => ((tid * 2654435761 + season * 97) >>> 0) % 1000003;
  const CR = {
    h2h(g, C) { const s = {}; for (const a of g) { const t = [0, 0, 0]; for (const b of g) if (b !== a && C.R[a].opp[b]) C.R[a].opp[b].forEach((v, i) => t[i] += v); if (!sum(t)) return null; s[a] = pct(t); } return s; },
    division(g, C) { const d = C.cd[g[0]].did; if (d == null || g.some(a => C.cd[a].did !== d)) return null; const s = {}; for (const a of g) { if (!sum(C.R[a].div)) return null; s[a] = pct(C.R[a].div); } return s; },
    common(g, C) {
      let com = null;
      for (const a of g) { const k = Object.keys(C.R[a].opp).filter(x => !g.includes(+x)); com = com ? com.filter(x => k.includes(x)) : k; }
      if (!com || !com.length) return null;
      const s = {}; for (const a of g) { const t = [0, 0, 0]; com.forEach(o => C.R[a].opp[o].forEach((v, i) => t[i] += v)); s[a] = pct(t); } return s;
    },
    conf(g, C) { const s = {}; for (const a of g) { if (!sum(C.R[a].conf)) return null; s[a] = pct(C.R[a].conf); } return s; },
    sov(g, C) { const s = {}; for (const a of g) { let n = 0, v = 0; for (const o in C.R[a].opp) { const w = C.R[a].opp[o][0] + C.R[a].opp[o][2] / 2; n += w; v += w * pct(C.R[o].rec); } s[a] = n ? v / n : 0; } return s; },
    sos(g, C) { const s = {}; for (const a of g) { let n = 0, v = 0; for (const o in C.R[a].opp) { const c = sum(C.R[a].opp[o]); n += c; v += c * pct(C.R[o].rec); } s[a] = n ? v / n : 0; } return s; },
    mov(g, C) { const s = {}; for (const a of g) { const n = sum(C.R[a].rec); s[a] = n ? (C.R[a].pf - C.R[a].pa) / n : 0; } return s; }
  };
  /* order a group that is level on record: [{tid, why}] best first; why = the rule that put the team ahead of those still in the group */
  function order(group, C, crit) {
    let rest = group.slice(); const out = [];
    while (rest.length > 1) {
      let cand = rest.slice(), why = '';
      for (const c of crit) {
        if (cand.length < 2 || c === 'coin') continue;
        const sc = CR[c](cand, C); if (!sc) continue;
        const best = Math.max(...cand.map(a => sc[a])), nx = cand.filter(a => Math.abs(sc[a] - best) < 1e-9);
        if (nx.length < cand.length) { cand = nx; why = NAME[c]; }
      }
      let pick = cand[0];
      if (cand.length > 1) { pick = cand.slice().sort((a, b) => flip(a, C.season) - flip(b, C.season))[0]; why = NAME.coin; }
      out.push({ tid: pick, why }); rest = rest.filter(a => a !== pick);
    }
    if (rest.length) out.push({ tid: rest[0], why: '' });
    return out;
  }
  function rank(tids, C, crit) {
    const by = tids.slice().sort((a, b) => pct(C.R[b].rec) - pct(C.R[a].rec) || a - b), out = [];
    for (let i = 0; i < by.length;) {
      let j = i; while (j < by.length && Math.abs(pct(C.R[by[j]].rec) - pct(C.R[by[i]].rec)) < 1e-9) j++;
      const g = by.slice(i, j); if (g.length === 1) out.push({ tid: g[0], why: '' }); else out.push(...order(g, C, crit)); i = j;
    }
    return out;
  }
  /* o: { confs:[{cid,name}], divs:[{did,cid,name}], nPlayoff, byes, byConf, divFirst, tiebreakers } */
  function seeds(games, teams, season, o) {
    const C = build(games, teams, season), crit = criteria(o.tiebreakers), confs = o.byConf !== false && (o.confs || []).length ? o.confs : [{ cid: null, name: 'League' }], res = [];
    for (const c of confs) {
      const mine = teams.filter(t => (c.cid == null || C.cd[t.tid].cid === c.cid) && sum(C.R[t.tid].rec) > 0).map(t => t.tid), dv = {};
      mine.forEach(t => (dv[C.cd[t].did] = dv[C.cd[t].did] || []).push(t));
      const divisions = Object.keys(dv).map(d => ({ did: d === 'undefined' || d === 'null' ? null : +d, name: ((o.divs || []).find(x => String(x.did) === d) || {}).name || '', order: rank(dv[d], C, crit) }));
      const winners = divisions.map(d => d.order[0]).filter(Boolean), wl = rank(winners.map(w => w.tid), C, crit), wset = new Set(winners.map(w => w.tid));
      const wild = rank(mine.filter(t => !wset.has(t)), C, crit);
      const nPer = Math.max(1, Math.round((o.nPlayoff || 0) / confs.length)), byePer = Math.round((o.byes || 0) / confs.length);
      /* o.divFirst === false: the whole group is ranked by record and tiebreakers alone (this league: 14 teams from the whole league, 2 byes) */
      const line = o.divFirst === false ? rank(mine, C, crit).map(x => Object.assign({ divWinner: wset.has(x.tid) }, x)) : wl.map(x => Object.assign({ divWinner: true }, x)).concat(wild.map(x => Object.assign({ divWinner: false }, x)));
      const all = line.map((x, i) => ({ seed: i + 1, tid: x.tid, divWinner: x.divWinner, bye: i < byePer, in: i < nPer, why: x.why, rec: C.R[x.tid].rec, pf: C.R[x.tid].pf, pa: C.R[x.tid].pa }));
      res.push({ cid: c.cid, name: c.name, n: nPer, byes: byePer, seeds: all, divisions });
    }
    return res;
  }
  const api = { seeds, rank, build, criteria, DEFAULT, NAME, pct };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMTiebreak = api;
})(typeof self !== 'undefined' ? self : this);
