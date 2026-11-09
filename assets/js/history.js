/* Pure: champions per season and all-time franchise table from team seasons.
   Champion = team with the highest playoffRoundsWon in a completed season; playoff team = playoffRoundsWon >= 0. */
(function (root) {
  function history(teams, current) {
    const by = {}, fr = [];
    for (const t of teams) {
      const f = { tid: t.tid, name: ((t.region || '') + ' ' + (t.name || '')).trim(), w: 0, l: 0, t: 0, po: 0, titles: 0, seasons: 0 };
      for (const s of t.seasons || []) {
        const g = (s.won || 0) + (s.lost || 0) + (s.tied || 0); if (!g) continue;
        f.w += s.won || 0; f.l += s.lost || 0; f.t += s.tied || 0; f.seasons++; if (s.playoffRoundsWon >= 0) f.po++;
        (by[s.season] = by[s.season] || []).push({ tid: t.tid, name: ((s.region || t.region || '') + ' ' + (s.name || t.name || '')).trim(), w: s.won || 0, l: s.lost || 0, t: s.tied || 0, r: s.playoffRoundsWon == null ? -1 : s.playoffRoundsWon });
      }
      fr.push(f);
    }
    const seasons = Object.keys(by).map(Number).sort((a, b) => b - a).map(y => {
      const L = by[y], max = Math.max(...L.map(x => x.r)), done = y !== current && max >= 0;
      const champ = done ? L.filter(x => x.r === max).sort((a, b) => b.w - a.w)[0] : null;
      const best = [...L].sort((a, b) => (b.w + b.t / 2) / Math.max(1, b.w + b.l + b.t) - (a.w + a.t / 2) / Math.max(1, a.w + a.l + a.t))[0];
      return { season: y, champ, best, teams: L.length };
    });
    seasons.forEach(s => { if (s.champ) { const f = fr.find(x => x.tid === s.champ.tid); if (f) f.titles++; } });
    fr.sort((a, b) => b.titles - a.titles || b.w - a.w);
    return { seasons, franchises: fr };
  }
  const api = { history };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMHistory = api;
})(typeof self !== 'undefined' ? self : this);
