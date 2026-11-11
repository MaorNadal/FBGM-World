/* Pure: award races with a back-test (FR-ST-13, FR-MOD-5). Our own model, not the game's voting.
   Score of a candidate = wAV * z(approximate value) + wP * z(production) + wW * (team win share - 0.5) * 4, z within the eligible pool of that season.
   Production is fantasy points for offence and a tackles/sacks/interceptions index for defence. The three weights are chosen per award by trying 26 combinations against
   the winners of all past seasons stored in the save (so the back-test is in-sample: it shows fit, not a forecast; the page says so).
   Award names are matched by words (most valuable, offensive/defensive player, offensive/defensive rookie) because the exact names are read from the save. */
(function (root) {
  const OFF = ['QB', 'RB', 'WR', 'TE', 'OL', 'K'], DEF = ['DL', 'LB', 'CB', 'S'];
  const KINDS = {
    mvp: { label: 'Most valuable player', re: /^(?!.*(final|super bowl|championship|playoff)).*(most valuable|\bmvp\b)/i, pos: null, rookie: false, prod: 'fp' },
    opoy: { label: 'Offensive player of the year', re: /offensive player/i, pos: OFF, rookie: false, prod: 'fp' },
    dpoy: { label: 'Defensive player of the year', re: /defensive player/i, pos: DEF, rookie: false, prod: 'def' },
    oroy: { label: 'Offensive rookie of the year', re: /offensive rookie/i, pos: OFF, rookie: true, prod: 'fp' },
    droy: { label: 'Defensive rookie of the year', re: /defensive rookie/i, pos: DEF, rookie: true, prod: 'def' }
  };
  const fpOf = s => (s.pssYds || 0) * .04 + (s.pssTD || 0) * 4 - (s.pssInt || 0) * 2 + (s.rusYds || 0) * .1 + (s.rusTD || 0) * 6 + (s.recYds || 0) * .1 + (s.recTD || 0) * 6 - (s.fmbLost || 0) * 2;
  const defOf = s => (s.defSk || 0) * 4 + (s.defInt || 0) * 5 + ((s.defTckSolo || 0) + (s.defTckAst || 0)) * .25;
  function line(p, season) {
    let e = null; for (const s of p.stats || []) { if (s.season !== season || s.playoffs) continue; e = e || { gp: 0, av: 0, fp: 0, def: 0, tid: s.tid }; e.tid = s.tid; e.gp += +s.gp || 0; e.av += +s.av || 0; e.fp += fpOf(s); e.def += defOf(s); }
    return e;
  }
  const firstSeason = p => { let m = null; for (const s of p.stats || []) if (!s.playoffs && (m == null || s.season < m)) m = s.season; return m; };
  const posAt = (p, season) => { let r = null; for (const x of p.ratings || []) if (x.season === season) r = x; r = r || (p.ratings || [])[(p.ratings || []).length - 1]; return r ? r.pos : null; };
  const z = (v, m, sd) => sd > 1e-9 ? (v - m) / sd : 0;
  function pool(players, season, kind, minGp) {
    const K = KINDS[kind], out = [];
    for (const p of players) {
      const l = line(p, season); if (!l || l.gp < minGp) continue; const pos = posAt(p, season);
      if (K.pos && !K.pos.includes(pos)) continue; if (K.rookie && firstSeason(p) !== season) continue;
      out.push({ pid: p.pid, name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim(), pos, tid: l.tid, gp: l.gp, av: l.av, prod: K.prod === 'fp' ? l.fp : l.def, fp: l.fp, def: l.def, p });
    }
    return out;
  }
  const stat = a => { const m = a.reduce((x, y) => x + y, 0) / (a.length || 1), sd = Math.sqrt(a.reduce((x, y) => x + (y - m) * (y - m), 0) / (a.length || 1)); return [m, sd]; };
  function score(L, teamPct, w) {
    const [ma, sa] = stat(L.map(x => x.av)), [mp, sp] = stat(L.map(x => x.prod));
    return L.map(x => Object.assign({}, x, { score: w[0] * z(x.av, ma, sa) + w[1] * z(x.prod, mp, sp) + w[2] * ((teamPct[x.tid] != null ? teamPct[x.tid] : .5) - .5) * 4 })).sort((a, b) => b.score - a.score || b.av - a.av);
  }
  function odds(L) { const m = L.length ? L[0].score : 0, e = L.map(x => Math.exp((x.score - m) * 1.2)), t = e.reduce((a, b) => a + b, 0) || 1; return L.map((x, i) => Object.assign({}, x, { prob: e[i] / t })); }
  const winners = players => { const out = {}; for (const k in KINDS) out[k] = {}; for (const p of players) for (const a of p.awards || []) for (const k in KINDS) if (KINDS[k].re.test(a.type || '')) (out[k][a.season] = out[k][a.season] || []).push(p.pid); return out; };
  /* teamPctBy(season) -> { tid: win share } ; returns { w, seasons:[{season, winner, rank, top}], hit1, hit3, n } */
  function backtest(players, teamPctBy, kind, win, current, minGp) {
    const W = []; for (const a of [0, 1, 2]) for (const b of [0, 1, 2]) for (const c of [0, 1, 2]) if (a + b + c) W.push([a, b, c]);
    const seasons = Object.keys(win[kind] || {}).map(Number).filter(s => s !== current).sort((a, b) => a - b), pools = {};
    seasons.forEach(s => pools[s] = pool(players, s, kind, minGp));
    let best = null;
    for (const w of W) {
      let h1 = 0, h3 = 0, n = 0, rk = 0; const rows = [];
      for (const s of seasons) {
        const P = pools[s]; if (!P.length) continue; const S = score(P, teamPctBy(s), w), ids = win[kind][s];
        const i = S.findIndex(x => ids.includes(x.pid)); if (i < 0) continue;
        n++; rk += i + 1; if (i === 0) h1++; if (i < 3) h3++; rows.push({ season: s, winner: S[i].name, rank: i + 1, top: S[0].name, pool: S.length });
      }
      const r = { w, hit1: h1, hit3: h3, n, avg: n ? rk / n : 0, seasons: rows };
      if (!best || r.hit1 > best.hit1 || (r.hit1 === best.hit1 && (r.hit3 > best.hit3 || (r.hit3 === best.hit3 && r.avg < best.avg)))) best = r;
    }
    return best || { w: [1, 1, 1], hit1: 0, hit3: 0, n: 0, avg: 0, seasons: [] };
  }
  const api = { KINDS, pool, score, odds, winners, backtest, line, fpOf, defOf };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMAwardRace = api;
})(typeof self !== 'undefined' ? self : this);
