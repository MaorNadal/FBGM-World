/* Pure: player page data. Stats rows are the game's per-season, per-team rows (playoffs flagged); stint rows of one season are summed. */
(function (root) {
  const COLS = [['gp', 'GP'], ['pssCmp', 'Cmp'], ['pss', 'Att'], ['pssYds', 'PassYds'], ['pssTD', 'PassTD'], ['pssInt', 'Int'], ['rus', 'Rush'], ['rusYds', 'RushYds'], ['rusTD', 'RushTD'], ['rec', 'Rec'], ['recYds', 'RecYds'], ['recTD', 'RecTD'], ['defTck', 'Tck'], ['defSk', 'Sck'], ['defInt', 'DefInt'], ['fg', 'FG'], ['xp', 'XP'], ['pnt', 'Punts']];
  function career(p, playoffs) {
    const by = {};
    for (const s of p.stats || []) {
      if (!!s.playoffs !== !!playoffs) continue;
      const e = by[s.season] = by[s.season] || { season: s.season, tid: s.tid };
      e.tid = s.tid; for (const [k] of COLS) e[k] = (e[k] || 0) + (+s[k] || 0);
    }
    const rows = Object.values(by).sort((a, b) => a.season - b.season);
    const cols = COLS.filter(([k]) => k === 'gp' || rows.some(r => r[k]));
    const tot = {}; cols.forEach(([k]) => tot[k] = rows.reduce((a, r) => a + (r[k] || 0), 0));
    return { rows, cols, tot };
  }
  function series(p) { return (p.ratings || []).filter(r => r.ovr != null).map(r => ({ season: r.season, ovr: r.ovr, pot: r.pot, pos: r.pos })); }
  function awards(p) { const m = {}; for (const a of p.awards || []) m[a.type] = (m[a.type] || 0) + 1; return Object.entries(m).sort((a, b) => b[1] - a[1]); }
  const api = { COLS, career, series, awards };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMPlayer = api;
})(typeof self !== 'undefined' ? self : this);
