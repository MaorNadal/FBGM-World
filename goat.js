/* Pure: a greatest-of-all-time score for every player (FR-REC-4). The game's own GOAT formula is not stored in the save (goatFormula is unset in the game's defaults), so this is OUR score, shown as such:
   score = sum of weight x count over these parts: approximate value (career, regular season), MVP, Finals MVP, Offensive/Defensive Player of the Year, Rookie of the Year, first-team All-League,
   other All-League selections, All-Star selections, titles won, Hall of Fame. The owner can change every weight. Players are slim records: awards[{type,season}], stats[{season,playoffs,av}], hof. */
(function (root) {
  const PARTS = [
    { k: 'av', label: 'Career approximate value', w: 1 },
    { k: 'mvp', label: 'MVP', w: 25 },
    { k: 'fmvp', label: 'Finals MVP', w: 15 },
    { k: 'poy', label: 'Offensive or Defensive Player of the Year', w: 12 },
    { k: 'roy', label: 'Rookie of the Year', w: 5 },
    { k: 'all1', label: 'First-team All-League', w: 8 },
    { k: 'allO', label: 'Other All-League selection', w: 4 },
    { k: 'allS', label: 'All-Star selection', w: 3 },
    { k: 'title', label: 'Title won', w: 10 },
    { k: 'hof', label: 'Hall of Fame', w: 20 }
  ];
  const W0 = () => Object.fromEntries(PARTS.map(p => [p.k, p.w]));
  function counts(p) {
    const c = { av: 0, mvp: 0, fmvp: 0, poy: 0, roy: 0, all1: 0, allO: 0, allS: 0, title: 0, hof: p && p.hof ? 1 : 0 };
    for (const s of (p && p.stats) || []) if (!s.playoffs) c.av += +s.av || 0;
    for (const a of (p && p.awards) || []) {
      const t = String(a.type || '');
      if (/finals mvp|super bowl mvp/i.test(t)) c.fmvp++;
      else if (/all-?star/i.test(t)) { if (!/mvp/i.test(t)) c.allS++; }
      else if (/rookie of the year/i.test(t)) c.roy++;
      else if (/all-?rookie|rookie team/i.test(t)) { /* not counted: a rookie team is not a career honour here */ }
      else if (/first team all-?league|all-?league first/i.test(t)) c.all1++;
      else if (/all-?league/i.test(t)) c.allO++;
      else if (/^most valuable player$/i.test(t)) c.mvp++;
      else if (/offensive player of the year|defensive player of the year/i.test(t)) c.poy++;
      else if (/won championship/i.test(t)) c.title++;
    }
    return c;
  }
  /* rows: [{pid, c (counts), total, parts:{k: weight x count}}] best first */
  function rank(players, w) {
    w = Object.assign(W0(), w || {});
    const rows = (players || []).map(p => { const c = counts(p), parts = {}; let total = 0; for (const x of PARTS) { parts[x.k] = c[x.k] * (+w[x.k] || 0); total += parts[x.k]; } return { pid: p.pid, c, parts, total }; });
    return rows.filter(r => r.total > 0).sort((a, b) => b.total - a.total || a.pid - b.pid);
  }
  const api = { PARTS, W0, counts, rank };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMGoat = api;
})(typeof self !== 'undefined' ? self : this);
