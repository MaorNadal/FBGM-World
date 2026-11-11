/* Pure: league finances from the nested season records of every team (FR-LG-4).
   Assumed shape (the game's own): season.revenues and season.expenses are objects whose values are numbers or { amount, rank }; season.cash; amounts in thousands.
   Nothing here is invented: a team season without these fields gives null, and fields() lists what the first record really holds so a wrong assumption is visible. */
(function (root) {
  const leaf = v => v == null ? null : typeof v === 'number' ? v : (typeof v === 'object' && typeof v.amount === 'number') ? v.amount : null;
  function parts(o) { const out = {}; if (o && typeof o === 'object') for (const k in o) { const x = leaf(o[k]); if (x != null) out[k] = x; } return out; }
  const total = p => { const v = Object.values(p); return v.length ? v.reduce((a, b) => a + b, 0) : null; };
  function row(t, s) {
    const rev = parts(s.revenues), exp = parts(s.expenses), R = total(rev), E = total(exp), g = (s.won || 0) + (s.lost || 0) + (s.tied || 0);
    return { tid: t.tid, season: s.season, name: ((s.region || t.region || '') + ' ' + (s.name || t.name || '')).trim(), abbrev: s.abbrev || t.abbrev,
      rev: R, exp: E, profit: R != null && E != null ? R - E : null, cash: typeof s.cash === 'number' ? s.cash : null, payroll: exp.salary != null ? exp.salary : (typeof s.payroll === 'number' ? s.payroll : null),
      revParts: rev, expParts: exp, w: s.won || 0, l: s.lost || 0, t: s.tied || 0, pct: g ? ((s.won || 0) + (s.tied || 0) / 2) / g : null, hype: typeof s.hype === 'number' ? s.hype : null, pop: typeof s.pop === 'number' ? s.pop : null, att: typeof s.att === 'number' ? s.att : null, games: g };
  }
  const table = (teams, season) => teams.map(t => { const s = (t.seasons || []).find(x => x.season === season); return s ? row(t, s) : null; }).filter(Boolean);
  /* league average by season, for the line over time; seasons without finance data are skipped */
  function series(teams) {
    const by = {};
    for (const t of teams) for (const s of (t.seasons || [])) { const r = row(t, s); if (r.rev == null && r.exp == null) continue; const e = by[s.season] = by[s.season] || { season: s.season, n: 0, rev: 0, exp: 0, cash: 0, nc: 0 }; e.n++; e.rev += r.rev || 0; e.exp += r.exp || 0; if (r.cash != null) { e.cash += r.cash; e.nc++; } }
    return Object.values(by).sort((a, b) => a.season - b.season).map(e => ({ season: e.season, n: e.n, rev: e.rev / e.n, exp: e.exp / e.n, profit: (e.rev - e.exp) / e.n, cash: e.nc ? e.cash / e.nc : null }));
  }
  /* what the first team season with any finance field holds, so a different shape can be reported */
  function fields(teams) {
    for (const t of teams) for (const s of (t.seasons || [])) if (s.revenues || s.expenses || s.cash != null) return { revenues: Object.keys(s.revenues || {}), expenses: Object.keys(s.expenses || {}), other: Object.keys(s).filter(k => !['revenues', 'expenses'].includes(k)).slice(0, 60), cash: s.cash };
    return null;
  }
  const money = v => v == null ? '–' : (v < 0 ? '−' : '') + '$' + (Math.abs(v) / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + 'M';
  const api = { leaf, parts, row, table, series, fields, money };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMFinance = api;
})(typeof self !== 'undefined' ? self : this);
