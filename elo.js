/* Own models (NOT the game's): margin-adjusted Elo with home edge and carry-over between seasons, season simulation, league pulse, ageing curves.
   Assumes header teams[0] = home, teams[1] = away, pts per team. All functions are pure. */
(function (root) {
  const P = (rh, ra, H) => 1 / (1 + Math.pow(10, -((rh + H) - ra) / 400));
  function run(games, o) {
    o = Object.assign({ K: 20, H: 65, reg: 1 / 3, base: 1500 }, o || {});
    const R = {}, out = [], G = games.filter(g => !g.allStar && g.teams && g.teams.length === 2).sort((a, b) => a.season - b.season || (a.day || 0) - (b.day || 0) || a.gid - b.gid);
    let cur = null;
    for (const g of G) {
      if (g.season !== cur) { for (const k in R) R[k] += (o.base - R[k]) * o.reg; cur = g.season; }
      const h = g.teams[0], a = g.teams[1], rh = R[h.tid] ?? o.base, ra = R[a.tid] ?? o.base, H = g.neutralSite ? 0 : o.H, p = P(rh, ra, H);
      const res = h.pts > a.pts ? 1 : h.pts < a.pts ? 0 : 0.5, mov = Math.abs(h.pts - a.pts), wd = res === 1 ? rh + H - ra : res === 0 ? ra - rh - H : 0;
      const d = o.K * (Math.log(mov + 1) * 2.2 / (wd * 0.001 + 2.2)) * (res - p);
      R[h.tid] = rh + d; R[a.tid] = ra - d; const rhA = R[h.tid], raA = R[a.tid];
      out.push({ gid: g.gid, season: g.season, day: g.day, home: h.tid, away: a.tid, hp: h.pts, ap: a.pts, p, res, playoffs: !!g.playoffs, rhA, raA });
    }
    return { rating: R, games: out, opts: o };
  }
  function backtest(list) { const L = list.filter(x => x.res !== 0.5); if (!L.length) return { n: 0, acc: 0, brier: 0 }; return { n: L.length, acc: L.filter(x => (x.p > 0.5) === (x.res === 1)).length / L.length, brier: L.reduce((s, x) => s + (x.p - x.res) ** 2, 0) / L.length }; }
  function simulate(teams, remaining, prob, runs, rng, k) {
    const idx = {}; teams.forEach((t, i) => idx[t.tid] = i);
    const M = remaining.filter(m => idx[m.homeTid] != null && idx[m.awayTid] != null).map(m => [idx[m.homeTid], idx[m.awayTid], prob(m.homeTid, m.awayTid)]);
    const acc = teams.map(() => ({ ew: 0, div: 0, top: 0 })), cs = [...new Set(teams.map(t => t.cid))];
    for (let r = 0; r < runs; r++) {
      const w = teams.map(t => t.w + t.t / 2);
      for (const [h, a, p] of M) rng() < p ? w[h]++ : w[a]++;
      teams.forEach((t, i) => { acc[i].ew += w[i]; });
      const key = i => w[i] + rng() * 0.01;
      for (const c of cs) { const m = teams.map((t, i) => i).filter(i => teams[i].cid === c).sort((x, y) => key(y) - key(x)); m.slice(0, k).forEach(i => acc[i].top++); const seen = {}; m.forEach(i => { if (!seen[teams[i].did]) { seen[teams[i].did] = 1; acc[i].div++; } }); }
    }
    return teams.map((t, i) => ({ tid: t.tid, ew: acc[i].ew / runs, div: acc[i].div / runs, top: acc[i].top / runs }));
  }
  function pulse(list, season) {
    const L = list.filter(g => g.season === season), reg = L.filter(g => !g.playoffs), s = {};
    const by = f => L.reduce((b, g) => (b == null || f(g) > f(b)) ? g : b, null);
    for (const g of reg) for (const [t, win] of [[g.home, g.res === 1], [g.away, g.res === 0]]) { const e = s[t] = s[t] || { w: 0, l: 0, bw: 0, bl: 0 }; if (win) { e.w++; e.l = 0; e.bw = Math.max(e.bw, e.w); } else if (g.res !== 0.5) { e.l++; e.w = 0; e.bl = Math.max(e.bl, e.l); } else { e.w = 0; e.l = 0; } }
    const top = k => Object.entries(s).sort((a, b) => b[1][k] - a[1][k])[0];
    const up = reg.filter(g => g.res !== 0.5).reduce((b, g) => { const pw = g.res === 1 ? g.p : 1 - g.p; return (!b || pw < b.pw) ? { g, pw } : b; }, null);
    return { blowout: by(g => Math.abs(g.hp - g.ap)), shootout: by(g => g.hp + g.ap), upset: up, winStreak: top('bw'), loseStreak: top('bl'), active: Object.entries(s).filter(([, e]) => e.w >= 3 || e.l >= 3).map(([t, e]) => ({ tid: +t, w: e.w, l: e.l })).sort((a, b) => (b.w + b.l) - (a.w + a.l)), games: reg.length };
  }
  function aging(players, pos) {
    const m = {};
    for (const p of players) {
      if (!p.born || p.born.year == null) continue;
      const r = (p.ratings || []).filter(x => x.ovr != null).sort((a, b) => a.season - b.season);
      for (let i = 1; i < r.length; i++) { if (r[i].season - r[i - 1].season !== 1) continue; if (pos && r[i].pos !== pos) continue; const age = r[i - 1].season - p.born.year, e = m[age] = m[age] || { age, n: 0, s: 0 }; e.n++; e.s += r[i].ovr - r[i - 1].ovr; }
    }
    return Object.values(m).map(e => ({ age: e.age, n: e.n, mean: e.s / e.n })).sort((a, b) => a.age - b.age);
  }
  const api = { run, backtest, simulate, pulse, aging, P };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMModels = api;
})(typeof self !== 'undefined' ? self : this);
