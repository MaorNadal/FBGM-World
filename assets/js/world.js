/* World data (yours, not the league's): watch list and player notes, in localStorage under fbgmhub_ so Cloud sync and the world file carry them. */
(function (root) {
  function make(st) {
    const P = 'fbgmhub_', rd = (k, d) => { try { const v = JSON.parse(st.getItem(P + k)); return v == null ? d : v; } catch (e) { return d; } }, wr = (k, v) => st.setItem(P + k, JSON.stringify(v));
    return {
      watch: () => rd('watch', []), isWatched: pid => rd('watch', []).includes(pid),
      toggle(pid) { const w = rd('watch', []), i = w.indexOf(pid); i < 0 ? w.push(pid) : w.splice(i, 1); wr('watch', w); return i < 0; },
      note: pid => rd('notes', {})[pid] || '', setNote(pid, t) { const n = rd('notes', {}); t.trim() ? n[pid] = t : delete n[pid]; wr('notes', n); },
      get: rd, set: wr,
      album: () => rd('album', []), addAlbum(a) { const cur = rd('album', []); let n = 0; for (const x of a) if (!cur.includes(x)) { cur.push(x); n++; } wr('album', cur); return n; },
      exportAll() { const d = {}; for (let i = 0; i < st.length; i++) { const k = st.key(i); if (k.startsWith(P) && k !== P + 'cloudurl') d[k] = st.getItem(k); } return JSON.stringify({ app: 'fbgm-hub-world', v: 1, t: Date.now(), d }, null, 1); },
      importAll(txt) { const o = JSON.parse(txt); if (o.app !== 'fbgm-hub-world' || !o.d) throw new Error('Not a world file'); let n = 0; for (const k in o.d) if (k.startsWith(P) && k !== P + 'cloudurl') { st.setItem(k, o.d[k]); n++; } return n; }
    };
  }
  const api = { make };
  if (typeof module !== 'undefined') module.exports = api; else { root.FBGMWorldLib = api; root.World = make(root.localStorage); }
})(typeof self !== 'undefined' ? self : this);
