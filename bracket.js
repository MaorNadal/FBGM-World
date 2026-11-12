/* Pure: a playoff bracket tree from a seed list (FR-LG-1). Standard fixed bracket: slots are laid out 1 v P, 8 v 9 ...; a seed above the field size is empty, so the top seeds meet no one in round 1 and show as a bye (this is how the game fills n teams and b byes: seeds b+1..n play, 1..b wait).
   seeds: [{seed,tid,...}] best first, only the teams that are in; n = number of teams in; games: playoff games [{teams:[{tid,pts},{tid,pts}]}] used to fill winners and scores (optional).
   Returns rounds: [[{a,b,bye,w,sc}]] where a and b are a seed entry or null, w the winning tid or null, sc [ptsA, ptsB] or null. */
(function (root) {
  const order = P => { let o = [1]; while (o.length < P) { const m = o.length * 2 + 1; o = o.flatMap(x => [x, m - x]); } return o; };
  function build(seeds, n, games) {
    const P = Math.max(2, Math.pow(2, Math.ceil(Math.log2(Math.max(2, n))))), by = {}; seeds.slice(0, n).forEach(s => by[s.seed] = s);
    const find = (x, y) => (games || []).find(g => g.teams && g.teams.some(t => t.tid === x) && g.teams.some(t => t.tid === y));
    let cur = order(P).map(s => by[s] || null); const rounds = [];
    while (cur.length > 1) {
      const R = [], nx = [];
      for (let i = 0; i < cur.length; i += 2) {
        const a = cur[i], b = cur[i + 1], m = { a, b, bye: !rounds.length && !!(a && !b || b && !a), w: null, sc: null };
        if (m.bye) m.w = (a || b).tid; else if (a && b) { const g = find(a.tid, b.tid); if (g) { const ta = g.teams.find(t => t.tid === a.tid), tb = g.teams.find(t => t.tid === b.tid); m.sc = [ta.pts, tb.pts]; m.w = ta.pts === tb.pts ? null : ta.pts > tb.pts ? a.tid : b.tid; } }
        R.push(m); nx.push(m.w == null ? null : (a && a.tid === m.w ? a : b));
      }
      rounds.push(R); cur = nx;
    }
    return rounds;
  }
  const api = { build, order };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMBracket = api;
})(typeof self !== 'undefined' ? self : this);
