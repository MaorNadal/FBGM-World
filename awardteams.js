/* Pure: personal awards counted per franchise (FR-HIS-3). An award goes to the team the player played most games for that season (his team of the year; falls back to his current team).
   Players are slim records: awards[{type,season}], stats[{season,playoffs,tid,gp}], tid. Returns { cats:[{k,label}], by:{tid:{k:count}}, total:{k:count} }. */
(function (root) {
  const CATS = [
    { k: 'mvp', label: 'MVP', re: /^most valuable player$/i },
    { k: 'fmvp', label: 'Finals MVP', re: /finals mvp|super bowl mvp/i },
    { k: 'opoy', label: 'Off. Player of the Year', re: /offensive player of the year/i },
    { k: 'dpoy', label: 'Def. Player of the Year', re: /defensive player of the year/i },
    { k: 'roy', label: 'Rookie of the Year', re: /rookie of the year/i },
    { k: 'all1', label: 'First-team All-League', re: /first team all-?league|all-?league first/i },
    { k: 'allL', label: 'All-League selections', re: /all-?league/i, not: /rookie/i },
    { k: 'allR', label: 'All-Rookie team', re: /all-?rookie|rookie team/i },
    { k: 'allS', label: 'All-Star selections', re: /all-?star/i, not: /mvp/i },
    { k: 'asmvp', label: 'All-Star MVP', re: /all-?star.*mvp|all-?star game mvp/i }
  ];
  const teamOf = (p, y) => {
    const by = {}; for (const s of (p && p.stats) || []) if (s.season === y && !s.playoffs && s.tid >= 0) by[s.tid] = (by[s.tid] || 0) + (s.gp || 0);
    const t = Object.keys(by).sort((a, b) => by[b] - by[a]); return t.length ? +t[0] : (p && p.tid >= 0 ? p.tid : null);
  };
  function aggregate(players) {
    const by = {}, total = {};
    for (const p of players || []) for (const a of p.awards || []) {
      const c = CATS.filter(x => x.re.test(a.type || '') && !(x.not && x.not.test(a.type || '')));
      if (!c.length) continue; const t = teamOf(p, a.season); if (t == null) continue;
      for (const x of c) { (by[t] = by[t] || {})[x.k] = (by[t][x.k] || 0) + 1; total[x.k] = (total[x.k] || 0) + 1; }
    }
    return { cats: CATS.map(({ k, label }) => ({ k, label })), by, total };
  }
  const api = { aggregate, CATS, teamOf };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMAwardTeams = api;
})(typeof self !== 'undefined' ? self : this);
