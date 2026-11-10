/* Pure: build standings for one season (DR-1 all-star games excluded upstream; DR-2 conf/div resolved by caller; DR-4 season names). */
(function (root) {
  function standings(teams, season, confs, divs) {
    const rows = [];
    for (const t of teams) {
      const s = (t.seasons || []).find(x => x.season === season); if (!s) continue;
      const w = s.won || 0, l = s.lost || 0, ti = s.tied || 0, g = w + l + ti;
      rows.push({ tid: t.tid, name: ((s.region || t.region || '') + ' ' + (s.name || t.name || '')).trim(), abbrev: s.abbrev || t.abbrev, cid: s.cid != null ? s.cid : t.cid, did: s.did != null ? s.did : t.did, w, l, t: ti, pct: g ? (w + ti / 2) / g : 0, colors: t.colors });
    }
    rows.sort((a, b) => b.pct - a.pct || b.w - a.w || a.name.localeCompare(b.name));
    const out = [];
    for (const c of confs.length ? confs : [{ cid: null, name: 'League' }]) {
      const cd = (divs.length ? divs.filter(d => d.cid === c.cid) : [{ did: null, name: '' }]);
      out.push({ name: c.name, divisions: cd.map(d => ({ name: d.name, teams: rows.filter(r => (c.cid == null || r.cid === c.cid) && (d.did == null || r.did === d.did)) })) });
    }
    return out;
  }
  const api = { standings };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMStandings = api;
})(typeof self !== 'undefined' ? self : this);
