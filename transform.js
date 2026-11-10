/* Pure helpers: time-valued settings (DR-2) and game -> header + box rows (DR-6). */
(function (root) {
  function attr(v, season) { // value or list of {start,value}
    if (!Array.isArray(v) || !v.length || typeof v[0] !== 'object' || v[0] === null || !('value' in v[0])) return v;
    let out = v[0].value;
    for (const e of v) if (e.start == null || e.start <= season) out = e.value;
    return out;
  }
  function gameToBox(g) {
    const box = [], head = Object.assign({}, g);
    head.teams = (g.teams || []).map(t => { const c = Object.assign({}, t); delete c.players; return c; });
    (g.teams || []).forEach((t, i) => {
      const opp = g.teams[1 - i] ? g.teams[1 - i].tid : null;
      for (const p of t.players || []) {
        const r = { gid: g.gid, pid: p.pid, season: g.season, tid: t.tid, opp, playoffs: !!g.playoffs };
        for (const k in p) { if (k === 'pid') continue; const v = p[k]; if (v !== 0 && v !== null && v !== undefined) r[k] = v; }
        box.push(r);
      }
    });
    return { head, box };
  }
  const api = { attr, gameToBox };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMTransform = api;
})(typeof self !== 'undefined' ? self : this);
