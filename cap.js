/* Pure: payroll per team against the cap, minimum payroll and luxury line (amounts in thousands, as stored). */
(function (root) {
  function capTable(players, teams, lim) {
    const by = {};
    for (const p of players) { if (p.tid == null || p.tid < 0 || !p.contract) continue; const e = by[p.tid] = by[p.tid] || { pay: 0, n: 0, exp: [] }; e.pay += +p.contract.amount || 0; e.n++; e.exp.push(p); }
    return teams.map(t => { const e = by[t.tid] || { pay: 0, n: 0, exp: [] }; return { tid: t.tid, name: ((t.region || '') + ' ' + (t.name || '')).trim(), abbrev: t.abbrev, pay: e.pay, n: e.n, space: lim.cap - e.pay, over: e.pay > lim.cap, under: e.pay < lim.min, lux: e.pay > lim.lux }; }).sort((a, b) => b.pay - a.pay);
  }
  function expiring(players, tid, season) {
    return players.filter(p => p.tid === tid && p.contract && p.contract.exp <= season).sort((a, b) => b.contract.amount - a.contract.amount);
  }
  const api = { capTable, expiring };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMCap = api;
})(typeof self !== 'undefined' ? self : this);
