/* Pure: a trade value calculator (TC-1, version 1.42). Our own model, not the game's trade AI: the game decides by its own rules when a trade is proposed.
   A player's worth comes from the `value` the game stores on him (a rating-and-age blend on a 0 to 100 scale; the rating of his last season when it is missing),
   turned into points by score = (value - 35)^2 / 10 so that stars count far more than depth; a young high-potential player gets a small bonus.
   A draft pick is worth the player expected at its place: the place comes from the stored pick number or, before the order is known, from the record of the team it belongs to
   (the worse the record, the earlier the pick), and the expected value falls from about 62 at pick 1 to about 40 at pick 100. */
(function (root) {
  const num = v => typeof v === 'number' && isFinite(v) ? v : null;
  const lastRating = p => { const R = (p && p.ratings || []).filter(r => r && num(r.ovr) != null); return R[R.length - 1] || null; };
  function playerValue(p, season) {
    const v = num(p && p.value); const r = lastRating(p), base = v != null ? v : r ? r.ovr : 40;
    const age = p && p.born && num(p.born.year) != null && season != null ? season - p.born.year : null, pot = r && num(r.pot) != null ? r.pot : base;
    const bonus = age != null && age <= 24 && pot > base ? Math.min(6, (pot - base) * 0.25) : 0;
    return base + bonus;
  }
  const score = v => Math.pow(Math.max(0, v - 35), 2) / 10;
  const pickValue = pickNo => 40 + 22 * Math.exp(-(Math.max(1, pickNo) - 1) / 30);
  /* the place of a pick (1 = first overall). o: { nTeams, rank } where rank = 1 for the team with the best record of the season it belongs to */
  function pickPlace(d, o) {
    const n = (o && o.nTeams) || 32, round = d.round || 1;
    if (num(d.pick) && d.pick > 0) return (round - 1) * n + d.pick;
    const rk = o && o.rank && o.rank[d.originalTid != null ? d.originalTid : d.tid], slot = rk != null ? n + 1 - rk : Math.ceil(n / 2);
    return (round - 1) * n + slot;
  }
  const pickScore = (d, o) => score(pickValue(pickPlace(d, o)));
  /* A and B: { players: [records], picks: [records], rank, nTeams, season }; each side GIVES these assets.
     Returns what each side receives in points, the difference and a verdict from the viewpoint of side A (who gets B's assets). */
  function evaluate(A, B, o) {
    const sum = S => (S.players || []).reduce((a, p) => a + score(playerValue(p, o && o.season)), 0) + (S.picks || []).reduce((a, d) => a + pickScore(d, o), 0);
    const salary = S => (S.players || []).reduce((a, p) => a + (p.contract ? +p.contract.amount || 0 : 0), 0);
    const gotA = sum(B), gotB = sum(A), tot = gotA + gotB, diff = gotA - gotB, share = tot ? gotA / tot : 0.5;
    const verdict = !tot ? 'nothing on the table' : Math.abs(share - 0.5) < 0.08 ? 'about even' : share > 0.5 ? (share > 0.7 ? 'side A wins clearly' : 'side A comes out ahead') : (share < 0.3 ? 'side B wins clearly' : 'side B comes out ahead');
    return { gotA, gotB, diff, share, verdict, salaryA: salary(B) - salary(A), salaryB: salary(A) - salary(B) };
  }
  /* 1.60: how the general manager of a team reads a deal (narrative; our own model, not the game's trade AI). share = the share of the total value that his team receives (0 to 1).
     gm: { trade (35-99), style }. He wants more than half when he is a hard bargainer and accepts a little less when he likes to deal. */
  function gmStance(gm, share) {
    const sk = gm && gm.trade != null ? gm.trade : 60, st = gm && gm.style || '';
    let need = 0.5 + 0.004 * (sk - 60); if (st === 'Trade-happy dealer') need -= 0.03; if (st === 'Win-now veteran buyer') need -= 0.01; if (st === 'Draft-and-develop') need += 0.01; need = Math.max(0.44, Math.min(0.58, need));
    const ok = share >= need, tone = sk >= 75 ? 'a hard bargainer' : sk >= 55 ? 'a fair dealer' : 'an easy touch';
    return { need, ok, tone, text: ok ? 'would take the deal' : share >= need - 0.05 ? 'is close and would ask for a little more' : 'would turn it down' };
  }
  const api = { gmStance, playerValue, score, pickValue, pickPlace, pickScore, evaluate };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMTradeCalc = api;
})(typeof self !== 'undefined' ? self : this);
