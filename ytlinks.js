/* Pure: YouTube links for the halftime show of each Super Bowl (1 to 3 per season, chosen by the owner).
   parse(url): the video id and the start second from a link in any of the usual forms; norm(list): at most three valid, different videos; store(World): reads and writes the links
   in the world data under 'sbhalf' as { "2042": [{ url, id, start, title, auto }] }, so they are remembered, synced with the cloud and carried by the world file.
   Nothing is fetched here: the title of a video is filled in by the page (YouTube's oEmbed address) or typed by the owner. */
(function (root) {
  const ID = /^[A-Za-z0-9_-]{11}$/;
  function secs(t) { if (t == null || t === '') return 0; if (/^\d+$/.test(t)) return +t; const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i.exec(String(t)); return m ? (+(m[1] || 0)) * 3600 + (+(m[2] || 0)) * 60 + (+(m[3] || 0)) : 0; }
  function parse(url) {
    if (typeof url !== 'string') return null; let s = url.trim(); if (!s) return null; if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
    let u; try { u = new URL(s); } catch (e) { return null; }
    const h = u.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '').replace(/^music\./, ''); let id = null;
    if (h === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (h === 'youtube.com' || h === 'youtube-nocookie.com') { if (u.pathname === '/watch') id = u.searchParams.get('v'); else { const m = /^\/(?:embed|shorts|live|v)\/([^/?#]+)/.exec(u.pathname); if (m) id = m[1]; } }
    if (!id || !ID.test(id)) return null;
    return { id, start: secs(u.searchParams.get('t') || u.searchParams.get('start') || (u.hash.match(/t=([^&]+)/) || [])[1]) };
  }
  const watch = id => 'https://www.youtube.com/watch?v=' + id;
  const embed = (id, start, auto) => 'https://www.youtube-nocookie.com/embed/' + id + '?rel=0&modestbranding=1&playsinline=1&enablejsapi=1' + (start ? '&start=' + start : '') + (auto ? '&autoplay=1' : '');
  /* list of strings or entries -> at most three valid, different videos, keeping a stored title */
  function norm(list) {
    const out = [], seen = new Set();
    for (const x of (Array.isArray(list) ? list : [])) {
      const url = typeof x === 'string' ? x : x && x.url, p = parse(url); if (!p || seen.has(p.id)) continue; seen.add(p.id);
      out.push({ url: url.trim(), id: p.id, start: p.start, title: x && typeof x === 'object' && x.title ? String(x.title).slice(0, 160) : '', auto: !!(x && typeof x === 'object' && x.auto) });
      if (out.length === 3) break;
    }
    return out;
  }
  const title = j => j && typeof j.title === 'string' ? j.title.trim().slice(0, 160) : '';
  function store(W) {
    const K = 'sbhalf', all = () => { const v = W.get(K, {}); return v && typeof v === 'object' && !Array.isArray(v) ? v : {}; };
    return {
      get: y => norm(all()[y]), all: () => Object.fromEntries(Object.keys(all()).map(k => [k, norm(all()[k])]).filter(x => x[1].length)),
      set(y, list) { const a = Object.assign({}, all()), n = norm(list); if (n.length) a[y] = n; else delete a[y]; W.set(K, a); return n; },
      copy(from, to) { return this.set(to, this.get(from)); }, clear(y) { return this.set(y, []); }
    };
  }
  const api = { parse, norm, embed, watch, store, title, secs };
  if (typeof module !== 'undefined') module.exports = api; else root.YTLinks = api;
})(typeof self !== 'undefined' ? self : this);
