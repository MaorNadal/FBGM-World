/* Pure: who has clinched what, in a season in progress (FR-LG-1, clinching). A safe test that ignores tiebreakers: a team counts a rival as possibly ahead whenever the rival can reach (or already has) at least the team's current points.
   Points = wins + ties / 2. Per team: pts (now), max (pts + games left). In a group of teams that compete for nIn places (the whole league, or one conference), team A is
   - clinched in:   fewer than nIn rivals can still reach A's current points            (rivals with max >= pts(A))
   - clinched bye:  fewer than byes rivals can still reach A's current points
   - eliminated:    at least nIn rivals are already strictly above A's best case       (rivals with pts > max(A))
   - division winner clinched: no rival of the same division can still reach A's current points.
   Because ties are treated against the team in the first three and for the rival in the last, a team marked clinched really is; a team not marked may still be, once tiebreakers or the head-to-head games left are taken into account.
   teams: [{tid, w, l, t, left, did}]. groups: [{name, tids:[...], nIn, byes}]. Returns {tid: {pts, max, in, bye, out, div, rank}} and an ordered group list. */
(function (root) {
  function clinch(teams, groups) {
    const T = {}; for (const t of teams) { const pts = (t.w || 0) + (t.t || 0) / 2; T[t.tid] = { tid: t.tid, pts, max: pts + (t.left || 0), left: t.left || 0, w: t.w || 0, l: t.l || 0, t: t.t || 0, did: t.did }; }
    const out = {};
    for (const g of groups) {
      const ids = g.tids.filter(x => T[x]);
      for (const a of ids) {
        const A = T[a], others = ids.filter(b => b !== a).map(b => T[b]);
        const reach = others.filter(b => b.max >= A.pts).length, above = others.filter(b => b.pts > A.max).length;
        const sameDiv = A.did == null ? [] : others.filter(b => b.did === A.did);
        out[a] = Object.assign({}, A, { in: reach < g.nIn, bye: g.byes > 0 && reach < g.byes, out: above >= g.nIn, div: A.did != null && sameDiv.length > 0 && sameDiv.every(b => b.max < A.pts), group: g.name,
          status: reach < g.byes && g.byes > 0 ? 'bye' : reach < g.nIn ? 'in' : above >= g.nIn ? 'out' : 'alive' });
      }
    }
    return out;
  }
  const api = { clinch };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMClinch = api;
})(typeof self !== 'undefined' ? self : this);
