/* Pure: two own models, both labelled as this app's estimates and not the game's.
   1. Draft grades: career approximate value (AV) of a pick against the average AV of picks around the same slot.
   2. Contract value: salary against the typical salary of players of the same position and rating. */
(function (root) {
  const med = a => { const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length ? (b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2) : null; };
  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const careerAV = p => (p.stats || []).reduce((a, s) => a + (!s.playoffs ? +s.av || 0 : 0), 0);
  const posAt = (p, season) => { const rs = (p.ratings || []).filter(r => r.season <= season), r = rs[rs.length - 1] || {}; return r; };

  /* ---------- draft ---------- */
  function draftRows(players, season) {
    const rows = [], per = {};
    for (const p of players) { const d = p.draft; if (!d || !(d.year > 0) || !(d.round > 0) || !(d.pick > 0)) continue; per[d.year] = per[d.year] || {}; per[d.year][d.round] = Math.max(per[d.year][d.round] || 0, d.pick); }
    for (const p of players) {
      const d = p.draft; if (!d || !(d.year > 0) || !(d.round > 0) || !(d.pick > 0)) continue;
      const pr = (per[d.year][1] || 32), overall = (d.round - 1) * pr + d.pick, r = posAt(p, season);
      rows.push({ pid: p.pid, name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim(), year: d.year, round: d.round, pick: d.pick, overall, tid: d.tid, pos: r.pos || '', ovr: r.ovr, face: p.face, av: careerAV(p), seasonsPlayed: new Set((p.stats || []).filter(s => !s.playoffs && (s.gp || 0) > 0).map(s => s.season)).size, age: p.tid >= 0 ? 1 : 0, active: p.tid >= 0 });
    }
    return rows;
  }
  /* expected AV by overall pick from picks that are old enough (minAge seasons), window of w slots on each side */
  function expected(rows, season, minAge, w) {
    minAge = minAge == null ? 3 : minAge; w = w || 3; const old = rows.filter(r => season - r.year >= minAge), by = {};
    old.forEach(r => (by[r.overall] = by[r.overall] || []).push(r.av));
    const mx = Math.max(0, ...rows.map(r => r.overall)), exp = {}, sd = {};
    for (let s = 1; s <= mx; s++) { let L = []; for (let k = Math.max(1, s - w); k <= s + w; k++) if (by[k]) L = L.concat(by[k]); if (L.length < 4) { L = []; for (let k = Math.max(1, s - 3 * w); k <= s + 3 * w; k++) if (by[k]) L = L.concat(by[k]); } const m = mean(L); exp[s] = m == null ? 0 : m; sd[s] = L.length > 1 ? Math.sqrt(L.reduce((a, x) => a + (x - m) ** 2, 0) / L.length) : 1; }
    return { exp, sd };
  }
  function grade(rows, season, minAge) {
    const E = expected(rows, season, minAge);
    return rows.map(r => { const e = E.exp[r.overall] || 0, sd = Math.max(1, E.sd[r.overall] || 1), mature = season - r.year >= (minAge == null ? 3 : minAge), delta = r.av - e, z = delta / sd; return Object.assign({}, r, { expected: e, delta, z, mature, label: !mature ? 'too early' : z >= 1 ? 'steal' : z <= -1 ? 'bust' : 'fair' }); });
  }
  /* draft class strength by team: sum of AV above expectation of the mature picks */
  function teamGrades(graded) {
    const m = {}; for (const r of graded) { if (!r.mature || r.tid == null) continue; const e = m[r.tid] = m[r.tid] || { tid: r.tid, picks: 0, delta: 0, steals: 0, busts: 0 }; e.picks++; e.delta += r.delta; if (r.label === 'steal') e.steals++; if (r.label === 'bust') e.busts++; }
    return Object.values(m).sort((a, b) => b.delta - a.delta);
  }

  /* ---------- contracts ---------- */
  /* typical salary for a position and rating: median of players within +-band rating points, made non-decreasing */
  function contractModel(rows, band) {
    band = band || 3; const ok = rows.filter(r => r.amount != null && r.ovr != null && r.pos), byPos = {};
    ok.forEach(r => (byPos[r.pos] = byPos[r.pos] || []).push(r));
    const curve = L => { const c = {}; let run = 0; for (let o = 20; o <= 100; o++) { const near = L.filter(r => Math.abs(r.ovr - o) <= band).map(r => r.amount); const m = near.length >= 4 ? med(near) : null; if (m != null) run = Math.max(run, m); c[o] = m == null ? null : run; } let last = null; for (let o = 20; o <= 100; o++) { if (c[o] == null) c[o] = last; else last = c[o]; } for (let o = 100; o >= 20; o--) if (c[o] == null) c[o] = c[o + 1] != null ? c[o + 1] : last; return c; };
    const all = curve(ok), cp = {}; for (const p in byPos) if (byPos[p].length >= 12) cp[p] = curve(byPos[p]);
    return { expected: (pos, ovr) => { const c = cp[pos] || all, o = Math.max(20, Math.min(100, Math.round(ovr))); return c[o] == null ? null : c[o]; }, positions: Object.keys(cp) };
  }
  function contractRows(players, season, model) {
    const out = [];
    for (const p of players) { if (p.tid == null || p.tid < 0 || !p.contract) continue; const r = posAt(p, season); if (r.ovr == null) continue; const e = model.expected(r.pos, r.ovr); if (e == null) continue;
      const left = Math.max(1, (p.contract.exp || season) - season + 1), amt = p.contract.amount; out.push({ pid: p.pid, name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim(), tid: p.tid, pos: r.pos, ovr: r.ovr, pot: r.pot, age: p.born && p.born.year != null ? season - p.born.year : null, amount: amt, exp: p.contract.exp, years: left, expected: e, surplus: e - amt, total: (e - amt) * left, face: p.face }); }
    return out;
  }
  const api = { careerAV, draftRows, expected, grade, teamGrades, contractModel, contractRows, med, mean };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMValue = api;
})(typeof self !== 'undefined' ? self : this);
