/* Pure helpers for the statistical-feats page (playerFeats records of the save).
   FF-1: in the save `score` is usually the RESULT TEXT of the game ("W 24-17"), not a number, so the page must not treat it as one (it showed NaN).
   A feat has no number of its own, so `value` is a points figure computed from its stat line, used only to rank feats. */
(function (root) {
  const LAB = { pssCmp: 'cmp', pss: 'att', pssYds: 'pass yds', pssTD: 'pass TD', pssInt: 'int', pssSk: 'sacked', rus: 'car', rusYds: 'rush yds', rusTD: 'rush TD', rec: 'rec', recYds: 'rec yds', recTD: 'rec TD', tgt: 'tgt', defTckSolo: 'solo tkl', defTckAst: 'ast tkl', defTck: 'tkl', defSk: 'sacks', defInt: 'int', defFmbFrc: 'forced fum', defFmbRec: 'fum rec', fmbLost: 'fum lost', defTckLoss: 'TFL', defPssDef: 'pass def', defSft: 'safeties', defTD: 'def TD', krYds: 'kr yds', prYds: 'pr yds', fgm: 'fg', fga: 'fg att', xpm: 'xp', pnt: 'punts', pntYds: 'punt yds' };
  const num = v => (typeof v === 'number' && isFinite(v)) ? v : (typeof v === 'string' && v.trim() !== '' && isFinite(+v)) ? +v : null;
  const live = st => Object.keys(st || {}).filter(k => num(st[k]) != null && +st[k] !== 0);
  const kind = st => { const k = live(st); return k.some(x => /^pss/.test(x) && x !== 'pssSk') ? 'pass' : k.some(x => /^rus/.test(x)) ? 'rush' : k.some(x => /^rec|^tgt/.test(x)) ? 'rec' : k.some(x => /^def/.test(x)) ? 'def' : ''; };
  const g = (st, k) => num(st && st[k]) || 0;
  /* ranking figure: fantasy-style points for offence, a similar weighting for defence */
  const value = st => g(st, 'pssYds') * .04 + g(st, 'pssTD') * 4 - g(st, 'pssInt') * 2 + g(st, 'rusYds') * .1 + g(st, 'rusTD') * 6 + g(st, 'recYds') * .1 + g(st, 'recTD') * 6 - g(st, 'fmbLost') * 2
    + g(st, 'defSk') * 4 + g(st, 'defInt') * 5 + g(st, 'defTckSolo') * .8 + g(st, 'defTckAst') * .4 + g(st, 'defFmbFrc') * 3 + g(st, 'defFmbRec') * 3 + g(st, 'defIntTD') * 6 + g(st, 'defTD') * 6 + g(st, 'defSft') * 4;
  /* result text: the stored string, or built from won/pts/oppPts when those exist, else '' */
  const result = f => { if (!f) return ''; if (typeof f.score === 'string' && f.score.trim()) return f.score.trim(); const a = num(f.pts), b = num(f.oppPts); if (a != null && b != null) return (f.won === false || a < b ? 'L ' : a === b ? 'T ' : 'W ') + a + '-' + b; return ''; };
  const rating = f => (f && typeof f.score === 'number' && isFinite(f.score)) ? f.score : null;
  const line = (st, lab) => live(st).map(k => ({ k, label: (lab || LAB)[k] || k, v: +st[k] }));
  /* stat keys worth sorting by: most frequent first */
  const sortKeys = L => { const c = {}; for (const f of L) for (const k of live(f.stats)) c[k] = (c[k] || 0) + 1; return Object.keys(c).sort((a, b) => c[b] - c[a]).slice(0, 14); };
  const sorter = (key, dir) => {
    const val = f => key === 'value' ? value(f.stats) : key === 'season' ? (f.season || 0) : g(f.stats, key);
    return (a, b) => (dir === 'asc' ? val(a) - val(b) : val(b) - val(a)) || value(b.stats) - value(a.stats) || (b.season || 0) - (a.season || 0);
  };
  /* players with the most feats; ties broken by their best single feat */
  const leaders = L => { const m = new Map(); for (const f of L) { if (f.pid == null) continue; let e = m.get(f.pid); if (!e) m.set(f.pid, e = { pid: f.pid, n: 0, best: 0, f }); e.n++; const v = value(f.stats); if (v > e.best) { e.best = v; e.f = f; } } return [...m.values()].sort((a, b) => b.n - a.n || b.best - a.best); };
  const api = { LAB, kind, value, result, rating, line, sortKeys, sorter, leaders, live };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMFeats = api;
})(typeof self !== 'undefined' ? self : this);
