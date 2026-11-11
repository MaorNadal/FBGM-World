/* Pure: every team's place in its division, its conference and the whole league, plus its playoff seed, all under the league's own tiebreaker list.
   ST-1: the League page used to order teams by win percentage alone, so teams with the same record (six teams at 14-5 in one test save) were in arbitrary order.
   Here the order comes from tiebreak.js (head to head, division record, ... as the league lists them), the same code the Playoff picture uses. */
(function (root) {
  const TB = typeof require !== 'undefined' && typeof module !== 'undefined' ? require('./tiebreak.js') : root.FBGMTiebreak;
  /* o: { confs:[{cid,name}], divs:[{did,cid,name}], tiebreakers, nPlayoff, byes, byConf } */
  function view(teams, games, season, o) {
    o = o || {};
    const C = TB.build(games, teams, season), crit = TB.criteria(o.tiebreakers);
    const have = teams.filter(t => (t.seasons || []).some(x => x.season === season));
    const row = {}; have.forEach(t => { row[t.tid] = { tid: t.tid, cid: C.cd[t.tid].cid, did: C.cd[t.tid].did, league: null, conf: null, div: null, why: '', seed: null, bye: false, in: false, divWinner: false }; });
    const place = (tids, field) => TB.rank(tids, C, crit).map((x, i) => { row[x.tid][field] = i + 1; if (x.why && field === 'league') row[x.tid].why = x.why; return x.tid; });
    const league = place(have.map(t => t.tid), 'league');
    const confs = (o.confs || []).map(c => ({ cid: c.cid, name: c.name, order: place(have.filter(t => C.cd[t.tid].cid === c.cid).map(t => t.tid), 'conf') }));
    const divs = (o.divs || []).map(d => ({ did: d.did, cid: d.cid, name: d.name, order: place(have.filter(t => C.cd[t.tid].did === d.did).map(t => t.tid), 'div') }));
    divs.forEach(d => { if (d.order[0] != null) row[d.order[0]].divWinner = true; });
    let seeds = [];
    try { seeds = TB.seeds(games, teams, season, { confs: o.confs || [], divs: o.divs || [], tiebreakers: o.tiebreakers, nPlayoff: o.nPlayoff || 0, byes: o.byes || 0, byConf: !!o.byConf, divFirst: !!o.byConf }); } catch (e) { seeds = []; }
    for (const g of seeds) for (const s of g.seeds) if (row[s.tid]) { row[s.tid].seed = s.seed; row[s.tid].bye = !!s.bye; row[s.tid].in = !!s.in; row[s.tid].seedGroup = g.name; }
    return { row, league, confs, divs, seeds, crit };
  }
  const api = { view };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMStandView = api;
})(typeof self !== 'undefined' ? self : this);
