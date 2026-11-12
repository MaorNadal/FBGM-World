/* Pure: player efficiency leaders for one season (FR-NGS-4). Rates from the stored season counters of slim players (stats[{season,playoffs,tid,gp,pss,pssCmp,...}]).
   Minimums are written for a 17-game season and scaled by the most games any player has played that season, so a season in progress still gives a list.
   Returns [{k,label,note,d,suffix,better,list:[{pid,tid,v,n}]}]. */
(function (root) {
  const S = (r, ...k) => k.reduce((a, x) => a + (+r[x] || 0), 0);
  const CATS = [
    { k: 'ypa', label: 'Yards per pass attempt', min: ['att', 150], d: 1, f: r => r.pssYds / r.pss, n: r => r.pss, ok: r => r.pss },
    { k: 'cmp', label: 'Completion %', min: ['att', 150], d: 1, suffix: '%', f: r => r.pssCmp / r.pss * 100, n: r => r.pss, ok: r => r.pss },
    { k: 'tdi', label: 'Touchdown passes per interception', min: ['att', 150], d: 1, f: r => r.pssTD / Math.max(1, r.pssInt), n: r => r.pss, ok: r => r.pss },
    { k: 'skr', label: 'Sack rate (lowest is best)', note: 'sacks per 100 dropbacks', min: ['att', 150], d: 1, better: 'low', f: r => r.pssSk / (r.pss + r.pssSk) * 100, n: r => r.pss + r.pssSk, ok: r => r.pss + r.pssSk },
    { k: 'ypc', label: 'Yards per carry', min: ['car', 60], d: 1, f: r => r.rusYds / r.rus, n: r => r.rus, ok: r => r.rus },
    { k: 'ypr', label: 'Yards per reception', min: ['rec', 25], d: 1, f: r => r.recYds / r.rec, n: r => r.rec, ok: r => r.rec },
    { k: 'catch', label: 'Catch rate', note: 'receptions per target', min: ['tgt', 40], d: 1, suffix: '%', f: r => r.rec / r.tgt * 100, n: r => r.tgt, ok: r => r.tgt },
    { k: 'ypt', label: 'Yards per target', min: ['tgt', 40], d: 1, f: r => r.recYds / r.tgt, n: r => r.tgt, ok: r => r.tgt },
    { k: 'tpg', label: 'Tackles per game', min: ['gp', 8], d: 1, f: r => (r.defTckSolo + r.defTckAst) / r.gp, n: r => r.gp, ok: r => r.gp },
    { k: 'skg', label: 'Sacks per game', min: ['gp', 8], d: 2, f: r => r.defSk / r.gp, n: r => r.gp, ok: r => r.gp },
    { k: 'pdg', label: 'Passes defended per game', min: ['gp', 8], d: 2, f: r => r.defPssDef / r.gp, n: r => r.gp, ok: r => r.gp },
    { k: 'fgp', label: 'Field goal %', min: ['fga', 12], d: 1, suffix: '%', f: r => r.fg / r.fga * 100, n: r => r.fga, ok: r => r.fga }
  ];
  const KEYS = ['gp', 'pss', 'pssCmp', 'pssYds', 'pssTD', 'pssInt', 'pssSk', 'rus', 'rusYds', 'rec', 'recYds', 'tgt', 'defTckSolo', 'defTckAst', 'defSk', 'defPssDef'];
  function season(players, y) {
    const out = [];
    for (const p of players || []) {
      const r = {}; KEYS.forEach(k => r[k] = 0); r.fg = 0; r.fga = 0; const by = {}; let any = false;
      for (const s of p.stats || []) {
        if (s.season !== y || s.playoffs) continue; any = true;
        KEYS.forEach(k => r[k] += +s[k] || 0); r.fg += S(s, 'fg0', 'fg20', 'fg30', 'fg40', 'fg50'); r.fga += S(s, 'fga0', 'fga20', 'fga30', 'fga40', 'fga50'); by[s.tid] = (by[s.tid] || 0) + (+s.gp || 0);
      }
      if (!any) continue; const t = Object.keys(by).sort((a, b) => by[b] - by[a]); r.pid = p.pid; r.tid = t.length ? +t[0] : p.tid; r.car = r.rus; out.push(r);
    }
    return out;
  }
  function leaders(players, y, top) {
    const R = season(players, y), mg = Math.max(1, ...R.map(r => r.gp)), sc = Math.min(1, mg / 17);
    return CATS.map(c => {
      const need = Math.max(1, Math.round(c.min[1] * sc)), list = R.filter(r => c.ok(r) >= need && r.gp > 0).map(r => ({ pid: r.pid, tid: r.tid, v: c.f(r), n: c.n(r) })).filter(x => isFinite(x.v)).sort((a, b) => c.better === 'low' ? a.v - b.v : b.v - a.v).slice(0, top || 10);
      return { k: c.k, label: c.label, note: c.note || '', d: c.d, suffix: c.suffix || '', better: c.better || 'high', need, unit: c.min[0], list };
    });
  }
  const api = { leaders, season, CATS };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMNgsPlayers = api;
})(typeof self !== 'undefined' ? self : this);
