/* RN-1: a player who was retired, brought back and retired again appears several times in a team's retired numbers.
   Same player id = one entry, with the LATEST retirement season. Without a player id the entry is merged only when the text (name) AND the number match,
   so two different players with the same name are never merged (they have different ids). Entries that cannot be identified are kept as they are. */
(function (root) {
  function dedupe(list) {
    const out = [], at = new Map();
    for (const r of Array.isArray(list) ? list : []) {
      if (!r) continue;
      const txt = typeof r.text === 'string' ? r.text.trim().toLowerCase() : '';
      const key = r.pid != null ? 'p' + r.pid : txt ? 't' + txt + '#' + r.number : null;
      if (key == null) { out.push(r); continue; }
      if (!at.has(key)) { at.set(key, out.length); out.push(r); continue; }
      const i = at.get(key); if ((+r.seasonRetired || 0) >= (+out[i].seasonRetired || 0)) out[i] = r;
    }
    return out;
  }
  const api = { dedupe };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMRetired = api;
})(typeof self !== 'undefined' ? self : this);
