/* Template social feed from real results (no AI). Posts are built from the model's game list (elo.js run().games). */
(function (root) {
  function feed(list, season, day, nm, ab) {
    const streak = {}, posts = [], G = list.filter(g => g.season === season).sort((a, b) => (a.day || 0) - (b.day || 0) || a.gid - b.gid);
    const pick = (g, v) => v[g.gid % v.length], N = t => nm[t] || ('Team ' + t), A = t => ab[t] || String(t);
    for (const g of G) {
      const hw = g.res === 1, tie = g.res === 0.5, w = hw ? g.home : g.away, l = hw ? g.away : g.home, ws = hw ? g.hp : g.ap, ls = hw ? g.ap : g.hp, m = Math.abs(g.hp - g.ap);
      for (const t of [g.home, g.away]) { const e = streak[t] = streak[t] || { w: 0, l: 0 }, win = !tie && t === w; if (tie) { e.w = 0; e.l = 0; } else if (win) { e.w++; e.l = 0; } else { e.l++; e.w = 0; } }
      if (g.day !== day) continue;
      const add = (who, kind, text) => posts.push({ gid: g.gid, who, handle: '@' + A(who), kind, text });
      if (tie) { add(g.home, 'final', `${N(g.home)} and ${N(g.away)} finish level at ${g.hp}-${g.ap}.`); continue; }
      add(w, 'final', pick(g, [`FINAL: ${N(w)} ${ws}, ${N(l)} ${ls}.`, `${N(w)} get it done, ${ws}-${ls} over ${N(l)}.`, `That is a win. ${ws}-${ls} against ${N(l)}.`]));
      const pw = hw ? g.p : 1 - g.p;
      if (pw < 0.35) posts.push({ gid: g.gid, who: -1, handle: '@LeagueWire', kind: 'upset', text: `UPSET: ${N(w)} beat ${N(l)} ${ws}-${ls}. The model gave them ${(pw * 100).toFixed(0)}% before kickoff.` });
      if (m >= 21) posts.push({ gid: g.gid, who: -1, handle: '@LeagueWire', kind: 'blowout', text: `${N(w)} win by ${m} and leave no doubt.` });
      else if (m <= 3) posts.push({ gid: g.gid, who: -1, handle: '@LeagueWire', kind: 'close', text: `Decided by ${m}: ${N(w)} ${ws}, ${N(l)} ${ls}.` });
      if (streak[w].w >= 3) add(w, 'streak', `${N(w)} have now won ${streak[w].w} in a row.`);
      if (streak[l].l >= 3) add(l, 'streak', `${N(l)} have now lost ${streak[l].l} straight. Questions are coming.`);
    }
    return posts;
  }
  const api = { feed };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMSocial = api;
})(typeof self !== 'undefined' ? self : this);
