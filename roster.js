/* Pure: roster rows for one team and season from raw player records. Rating = latest ratings entry at or before the season. */
(function (root) {
  function roster(players, tid, season) {
    return players.filter(p => p.tid === tid).map(p => {
      const rs = (p.ratings || []).filter(r => r.season <= season), r = rs[rs.length - 1] || {};
      const inj = p.injury && p.injury.gamesRemaining > 0 ? p.injury : null;
      return { pid: p.pid, name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || p.name || '', pos: r.pos || '', ovr: r.ovr == null ? null : r.ovr, pot: r.pot == null ? null : r.pot, age: p.born && p.born.year != null ? season - p.born.year : null, amount: p.contract ? p.contract.amount : null, exp: p.contract ? p.contract.exp : null, injury: inj ? (inj.type || 'Injured') + ' (' + inj.gamesRemaining + ')' : '' };
    }).sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
  }
  const api = { roster };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMRoster = api;
})(typeof self !== 'undefined' ? self : this);
