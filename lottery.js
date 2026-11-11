/* Pure: the draft lottery for the TV special (LT-1, version 1.40).
   stored(): reads a draftLotteryResults record of the save into rows { tid, orig, pick, chances, exp, moved } (exp = place by chances, moved = places gained).
   simulate(): a what-if lottery. The save's own rule is not read (draftType varies); this uses the common 14-team odds of the NBA 2019 lottery (the worst three teams 14%),
   draws the first four picks without replacement, and puts the others in order of record. With fewer teams the odds are scaled to the first n entries.
   order: teams sorted worst record first. rng: () => [0,1). */
(function (root) {
  const ODDS = [14, 14, 14, 12.5, 10.5, 9, 7.5, 6, 4.5, 3, 2, 1.5, 1, 0.5];
  function stored(rec) {
    const R = Array.isArray(rec && rec.result) ? rec.result : Array.isArray(rec && rec.results) ? rec.results : [];
    if (!R.length) return [];
    const by = R.map((r, i) => ({ r, i, c: +r.chances || 0 })).sort((a, b) => b.c - a.c || a.i - b.i), exp = {}; by.forEach((x, k) => { exp[x.i] = k + 1; });
    const hasP = R.some(r => r.pick != null);
    return R.map((r, i) => { const pick = hasP && r.pick != null ? +r.pick : i + 1; return { tid: r.tid, orig: r.originalTid != null ? r.originalTid : r.tid, pick, chances: +r.chances || 0, exp: exp[i], moved: exp[i] - pick }; }).sort((a, b) => a.pick - b.pick);
  }
  /* LT-2 (1.44): the odds come from the save. plan() reads, in this order: the chances stored in the latest lottery record (draftLotteryResults, the place-by-place weights the game really used),
     else the draft type of the league settings (draftType: nba2019, nba1994, randomLottery, coinFlip, noLottery, nfl ...), else the 2019 table. draws = how many of the first picks are drawn. */
  const TYPES = { nba2019: { odds: ODDS, draws: 4 }, nba1994: { odds: [25, 19.9, 15.6, 11.9, 8.8, 6.3, 4.3, 2.8, 1.7, 1.1, 0.8, 0.7, 0.6, 0.5], draws: 3 }, coinFlip: { odds: [50, 50], draws: 1 }, noLottery: { odds: [], draws: 0 }, nfl: { odds: [], draws: 0 }, freeAgents: { odds: [], draws: 0 }, randomLottery: { odds: 'equal', draws: 99 }, randomLotteryFirst4: { odds: 'equal', draws: 4 } };
  function plan(records, draftType) {
    const type = typeof draftType === 'string' ? draftType : null, T = type && TYPES[type];
    const rec = (records || []).filter(r => stored(r).some(x => x.chances > 0)).sort((a, b) => (b.season || 0) - (a.season || 0))[0];
    if (rec) { const w = stored(rec).map(x => x.chances).filter(c => c > 0).sort((a, b) => b - a); return { odds: w, draws: T ? T.draws : Math.min(4, w.length), src: 'the chances stored in the ' + rec.season + ' lottery of your save', type }; }
    if (T) return { odds: T.odds, draws: T.draws, src: 'the draft type "' + type + '" of your league settings', type, equal: T.odds === 'equal' };
    return { odds: ODDS, draws: 4, src: 'the 2019 table (the save names no draft type and holds no stored chances)', type };
  }
  function simulate(order, rng, pl) {
    pl = pl || { odds: ODDS, draws: 4 };
    const eq = pl.odds === 'equal', n = eq ? order.length : Math.min(order.length, pl.odds.length), none = n === 0 || pl.draws === 0;
    const pool = order.slice(0, n).map((o, i) => ({ tid: o.tid, w: eq ? 1 : pl.odds[i], exp: i + 1 })), picks = [], total = () => pool.reduce((a, x) => a + x.w, 0), draws = none ? 0 : Math.min(pl.draws, n);
    for (let k = 0; k < draws; k++) { let r = rng() * total(), j = 0; while (j < pool.length - 1 && r >= pool[j].w) { r -= pool[j].w; j++; } picks.push(pool.splice(j, 1)[0]); }
    const rest = pool.sort((a, b) => a.exp - b.exp).concat(order.slice(n).map((o, i) => ({ tid: o.tid, w: 0, exp: n + 1 + i })));
    const all = picks.concat(rest), sum = eq ? n : (pl.odds || []).reduce((a, b) => a + b, 0) || 1, chance = {};
    order.slice(0, n).forEach((o, i) => { chance[o.tid] = eq ? 1 : pl.odds[i]; });
    return all.map((x, i) => ({ tid: x.tid, orig: x.tid, pick: i + 1, chances: chance[x.tid] || 0, exp: x.exp, moved: x.exp - (i + 1) }));
  }
  const api = { ODDS, TYPES, stored, plan, simulate };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMLottery = api;
})(typeof self !== 'undefined' ? self : this);
