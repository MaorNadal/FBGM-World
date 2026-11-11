/* Pure: roster rows for one team and season from raw player records. Rating = latest ratings entry at or before the season. */
(function (root) {
  const PI = root.FBGMPlayerInfo || (typeof require !== 'undefined' ? require('./pinfo.js') : null);
  function roster(players, tid, season) {
    return players.filter(p => p.tid === tid).map(p => {
      const x = PI.row(p, season);
      const inj = p.injury && p.injury.gamesRemaining > 0 ? p.injury : null;
      return { pid: p.pid, name: ((p.firstName || '') + ' ' + (p.lastName || '')).trim() || p.name || '', pos: x.pos, ovr: x.ovr, pot: x.pot, age: x.age, country: x.country, iso: x.iso, loc: x.loc, college: x.college, height: x.height, weight: x.weight, amount: p.contract ? p.contract.amount : null, exp: p.contract ? p.contract.exp : null, face: p.face, injury: inj ? (inj.type || 'Injured') + ' (' + inj.gamesRemaining + ')' : '' };
    }).sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
  }
  const api = { roster };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMRoster = api;
})(typeof self !== 'undefined' ? self : this);
