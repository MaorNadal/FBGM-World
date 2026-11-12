/* Pure: history cards, "on this day in the league" (FR-REC-8). For a current season, the seasons that sit a milestone number of years back (1, 5, 10, 15 ...) give cards:
   a title (champion, runner-up, final score), the best regular-season record, teams that joined or left, renames, and the major award winners.
   info = FBGMRivals.seasonsInfo output; awards = [{season, type, pid, name, tid}] (major awards only, made by the page). Returns [{years, season, kind, text, tid, opp, pid, score}] newest milestone first. */
(function (root) {
  const MILE = [1, 5, 10, 15, 20, 25, 30, 40, 50], KINDS = ['title', 'award', 'best', 'joined', 'left', 'renamed'];
  const ago = n => n === 1 ? 'Last season' : n + ' years ago';
  function cards(info, awards, current, o) {
    o = o || {}; const nm = o.name || (t => '#' + t), out = [];
    const ok = y => o.all ? current - y >= 1 : MILE.includes(current - y);
    for (const s of info || []) {
      if (!ok(s.season)) continue; const n = current - s.season, a = ago(n), base = { years: n, season: s.season };
      if (s.champion) out.push(Object.assign({ kind: 'title', tid: s.champion.tid, opp: s.champion.opp, score: s.champion.score, text: a + ': ' + nm(s.champion.tid) + ' won the ' + s.season + ' title, beating ' + nm(s.champion.opp) + ' ' + s.champion.score[0] + '–' + s.champion.score[1] }, base));
      if (s.best) out.push(Object.assign({ kind: 'best', tid: s.best.tid, text: a + ': ' + nm(s.best.tid) + ' had the best record of ' + s.season + ', ' + s.best.w + '–' + s.best.l + (s.best.t ? '–' + s.best.t : '') }, base));
      for (const t of s.added || []) out.push(Object.assign({ kind: 'joined', tid: t, text: a + ': ' + nm(t) + ' joined the league in ' + s.season }, base));
      for (const t of s.removed || []) out.push(Object.assign({ kind: 'left', tid: t, text: a + ': ' + nm(t) + ' left the league after ' + (s.season - 1) }, base));
      for (const r of s.renamed || []) out.push(Object.assign({ kind: 'renamed', tid: r.tid, text: a + ': ' + r.from + ' became the ' + r.to + ' in ' + s.season }, base));
    }
    for (const w of awards || []) if (ok(w.season)) out.push({ years: current - w.season, season: w.season, kind: 'award', pid: w.pid, tid: w.tid, text: ago(current - w.season) + ': ' + w.name + ' won ' + w.type + ' in ' + w.season });
    return out.sort((x, y) => x.years - y.years || KINDS.indexOf(x.kind) - KINDS.indexOf(y.kind));
  }
  const api = { cards, MILE };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMAnniv = api;
})(typeof self !== 'undefined' ? self : this);
