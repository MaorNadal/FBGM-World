/* Pure: the owner's notes (FR-LG-8). The game's own notes are not part of the export, so notes here are the owner's: a note on a player (kept since 1.x in World 'notes', {pid: text}) and free notes
   (World 'fnotes', [{id, title, text, ts, tag, tid, pid, pinned}]; a free note may point at a team or a player). merge() puts both in one list; search() and toText() work on that list. */
(function (root) {
  /* pn: {pid: text}; fn: free notes; names: {player: pid => name, team: tid => name} */
  function merge(pn, fn, names) {
    names = names || {}; const out = [];
    for (const k of Object.keys(pn || {})) { const t = String(pn[k] || '').trim(); if (t) out.push({ id: 'p' + k, kind: 'player', pid: +k, title: (names.player && names.player(+k)) || 'Player ' + k, text: t, ts: 0, tag: '', pinned: false, editable: false }); }
    for (const n of fn || []) {
      if (!n || !(String(n.text || '').trim() || String(n.title || '').trim())) continue;
      out.push({ id: 'f' + n.id, kind: n.tid != null ? 'team' : n.pid != null ? 'player' : 'free', fid: n.id, tid: n.tid, pid: n.pid, title: String(n.title || '').trim() || (n.tid != null && names.team ? names.team(n.tid) : n.pid != null && names.player ? names.player(n.pid) : 'Note'),
        text: String(n.text || ''), ts: n.ts || 0, tag: String(n.tag || '').trim(), pinned: !!n.pinned, editable: true });
    }
    return out.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.ts - a.ts || a.title.localeCompare(b.title));
  }
  function search(list, q) {
    q = String(q || '').trim().toLowerCase(); if (!q) return list;
    return list.filter(n => [n.title, n.text, n.tag].some(x => String(x || '').toLowerCase().includes(q)));
  }
  const day = ts => ts ? new Date(ts).toISOString().slice(0, 10) : '';
  function toText(list) { return list.map(n => [(n.pinned ? '[pinned] ' : '') + n.title + (n.tag ? ' #' + n.tag : '') + (n.ts ? ' (' + day(n.ts) + ')' : '') + ' [' + n.kind + ']', n.text].join('\n')).join('\n\n---\n\n'); }
  const nextId = fn => (fn || []).reduce((m, n) => Math.max(m, +n.id || 0), 0) + 1;
  const api = { merge, search, toText, nextId };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMNotes = api;
})(typeof self !== 'undefined' ? self : this);
