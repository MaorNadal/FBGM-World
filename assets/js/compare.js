/* Pure: side-by-side rows for two players (latest ratings, peak, career totals over the union of stat columns). */
(function (root) {
  function compare(a, b, P) {
    const sa = P.series(a), sb = P.series(b), la = sa[sa.length - 1] || {}, lb = sb[sb.length - 1] || {}, ca = P.career(a, false), cb = P.career(b, false);
    const peak = s => s.length ? Math.max(...s.map(x => x.ovr)) : null;
    const rows = [['Position', la.pos || '', lb.pos || ''], ['Overall', la.ovr, lb.ovr], ['Potential', la.pot, lb.pot], ['Peak overall', peak(sa), peak(sb)], ['Seasons with stats', ca.rows.length, cb.rows.length]];
    const keys = [...new Set([...ca.cols, ...cb.cols].map(c => c[0]))];
    for (const k of keys) { const lab = (ca.cols.concat(cb.cols).find(c => c[0] === k) || [k, k])[1]; rows.push([lab + ' (career)', ca.tot[k] || 0, cb.tot[k] || 0]); }
    return rows;
  }
  const api = { compare };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMCompare = api;
})(typeof self !== 'undefined' ? self : this);
