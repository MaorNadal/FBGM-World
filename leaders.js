/* Pure: season leaders from box rows. Field names follow the game's football stat keys (to be confirmed on the real save). */
(function (root) {
  const poOk = (a, m) => m === 'both' || m === 2 || m === '2' || !!a === !!m;
  const CATS = [['Passing yards', ['pssYds']], ['Passing TDs', ['pssTD']], ['Rushing yards', ['rusYds']], ['Rushing TDs', ['rusTD']], ['Receiving yards', ['recYds']], ['Receptions', ['rec']], ['Receiving TDs', ['recTD']], ['Sacks', ['defSk', 'sk']], ['Interceptions', ['defInt', 'int']], ['Tackles', ['defTck', 'defTckSolo', 'defTckAst']]];
  function leaders(rows, fields, n, playoffs, skip) {
    const m = new Map();
    for (const r of rows) {
      if (!poOk(r.playoffs, playoffs) || (skip && skip.has(r.gid))) continue;
      let v = 0; for (const f of fields) v += +r[f] || 0; if (!v) continue;
      const e = m.get(r.pid) || { pid: r.pid, v: 0, tid: r.tid, g: new Set() }; e.v += v; e.tid = r.tid; e.g.add(r.gid); m.set(r.pid, e);
    }
    return [...m.values()].map(e => ({ pid: e.pid, v: e.v, tid: e.tid, gp: e.g.size })).sort((a, b) => b.v - a.v).slice(0, n);
  }
  const api = { CATS, leaders };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMLeaders = api;
})(typeof self !== 'undefined' ? self : this);
