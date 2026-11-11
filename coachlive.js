/* Pure: where every coach stands RIGHT NOW in the league, from the games played so far this season (regular season, all-star games excluded).
   Input: the games of the Elo model of elo.js ({ season, day, gid, home, away, hp, ap, p = home win chance before the game, res, playoffs }), so the expected wins are the sum of the pre-game chances.
   Nothing here decides the future; remaining games and projections are passed in by the page. */
(function (root) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function team(G, tid, y) {
    const L = G.filter(g => g.season === y && !g.playoffs && (g.home === tid || g.away === tid)).sort((a, b) => (a.day || 0) - (b.day || 0) || a.gid - b.gid);
    const e = { tid, g: L.length, w: 0, l: 0, t: 0, expW: 0, pf: 0, pa: 0, form: [], lastDay: null };
    for (const g of L) {
      const home = g.home === tid, pf = home ? g.hp : g.ap, pa = home ? g.ap : g.hp, k = pf > pa ? 'W' : pf < pa ? 'L' : 'T';
      e[k.toLowerCase()]++; e.pf += pf; e.pa += pa; e.form.push(k); e.lastDay = g.day;
    }
    e.expW = L.reduce((a, g) => a + (g.home === tid ? g.p : 1 - g.p), 0);
    e.over = e.w + e.t / 2 - e.expW; e.pct = e.g ? (e.w + e.t / 2) / e.g : 0; e.mpg = e.g ? (e.pf - e.pa) / e.g : 0; e.ppg = e.g ? e.pf / e.g : 0; e.papg = e.g ? e.pa / e.g : 0;
    e.last5 = e.form.slice(-5); const lastK = e.form[e.form.length - 1]; let n = 0; for (let i = e.form.length - 1; i >= 0 && e.form[i] === lastK; i--) n++; e.streak = { type: lastK || '', n };
    const l5 = e.last5; e.recent = l5.length ? (l5.filter(x => x === 'W').length + l5.filter(x => x === 'T').length / 2) / l5.length : null;
    return e;
  }
  const all = (G, teams, y) => Object.fromEntries(teams.map(t => [t.tid, team(G, t.tid, y)]));
  /* rank 1 = best (hi) or lowest (!hi) of f over the map; a team with no games is left out */
  function rank(M, f, hi) { const L = Object.values(M).filter(e => e.g > 0).sort((a, b) => hi ? f(b) - f(a) : f(a) - f(b)), R = {}; L.forEach((e, i) => R[e.tid] = i + 1); return R; }
  /* progress of the season: games played by the team with the most games, against the schedule length */
  function progress(M, numGames) { const g = Math.max(0, ...Object.values(M).map(e => e.g)); return { g, total: numGames || null, share: numGames ? clamp(g / numGames, 0, 1) : null }; }
  /* the state of the season from the game phase and the games played */
  function phaseNote(phase, prog) {
    if (phase >= 4) return 'The season is over: the figures are the final ones.'; if (phase === 3) return 'The playoffs are on: the regular season is complete.';
    if (!prog.g) return 'No game has been played yet: expectations come from the preseason strength of the teams.';
    return 'Week ' + prog.g + (prog.total ? ' of ' + prog.total : '') + (prog.share != null ? ' (' + Math.round(prog.share * 100) + '% of the season)' : '') + ': every figure is season-to-date and changes with each game.';
  }
  /* the three moods around a head coach, 0 to 100 (templates, not a model of real people)
     security: the meter of coaches.js; hype: 0 to 1 from the team season when stored (null = unknown) */
  function mood(e, security, hype) {
    const h = hype == null ? 0.5 : clamp(hype, 0, 1), loss = e.streak && e.streak.type === 'L' ? e.streak.n : 0, win = e.streak && e.streak.type === 'W' ? e.streak.n : 0;
    const fans = clamp(Math.round(30 + 55 * e.pct + 25 * (h - 0.5) + 3 * win - 3 * loss), 0, 100), media = clamp(Math.round(20 + 11 * loss + 9 * Math.max(0, -e.over) + (security < 30 ? 25 : 0) - 4 * win), 0, 100);
    const ow = security >= 70 ? 'The owner is happy and has no plans to change anything.' : security >= 50 ? 'The owner is watching and wants more.' : security >= 30 ? 'The owner is losing patience.' : 'The owner is discussing a change.';
    const fn = fans >= 70 ? 'The fans are packing the stands and believe.' : fans >= 45 ? 'The fans are waiting to see.' : 'The fans are restless.';
    const md = media >= 65 ? 'The media are calling for a change.' : media >= 40 ? 'The media are asking hard questions.' : 'The media coverage is calm.';
    return { owner: { score: Math.round(security), text: ow }, fans: { score: fans, text: fn }, media: { score: media, text: md } };
  }
  /* one sentence that ties the coach to the season so far */
  function headline(e, rankOver, nTeams) {
    if (!e.g) return 'No games yet.';
    const d = e.over, a = Math.abs(d).toFixed(1);
    const tone = d >= 1.5 ? 'well ahead of' : d >= 0.5 ? 'a little ahead of' : d > -0.5 ? 'about level with' : d > -1.5 ? 'a little behind' : 'well behind';
    return e.w + '-' + e.l + (e.t ? '-' + e.t : '') + ' after ' + e.g + ' games, ' + tone + (d > -0.5 && d < 0.5 ? ' the pace' : ' the pace the roster strength predicted') + ' (' + (d >= 0 ? '+' : '−') + a + ' wins against expectation, ' + (rankOver ? rankOver + ' of ' + nTeams + ' in the league' : 'no rank') + ').';
  }
  const api = { team, all, rank, progress, phaseNote, mood, headline };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMCoachLive = api;
})(typeof self !== 'undefined' ? self : this);
