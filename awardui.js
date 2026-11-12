/* Pure helpers for the Awards and Award races pages: classify an award name, tier colours, a trophy drawing, the season stat line of a winner, ordinal counts.
   Works on slim player records (metrics.js slim): awards[{type,season}], stats[{season,playoffs,tid,gp,pss...}], ratings[{season,pos,ovr}]. */
(function (root) {
  const ord = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  /* group: major | allleague | allstar | leader | champ | other ; tier: gold | silver | bronze | blue | plain ; rank: 1 first team, 2 second ... */
  function classify(type) {
    const t = String(type || '');
    if (/all-?rookie|rookie team/i.test(t)) { const r = /second/i.test(t) ? 2 : 1; return { group: 'allleague', tier: r === 1 ? 'gold' : 'silver', rank: r, rookie: true }; }
    if (/all-?star/i.test(t)) return { group: 'allstar', tier: /mvp/i.test(t) ? 'gold' : 'blue', rank: 0 };
    if (/team all-?league|all-?league/i.test(t)) { const r = /first/i.test(t) ? 1 : /second/i.test(t) ? 2 : /third/i.test(t) ? 3 : 1; return { group: 'allleague', tier: r === 1 ? 'gold' : r === 2 ? 'silver' : 'bronze', rank: r }; }
    if (/won championship|champion/i.test(t) && !/mvp/i.test(t)) return { group: 'champ', tier: 'gold', rank: 0 };
    if (/leader/i.test(t)) return { group: 'leader', tier: 'blue', rank: 0 };
    if (/finals mvp|super bowl mvp|most valuable player|mvp/i.test(t)) return { group: 'major', tier: 'gold', rank: 0 };
    if (/of the year|rookie/i.test(t)) return { group: 'major', tier: /rookie/i.test(t) ? 'silver' : 'gold', rank: 0 };
    return { group: 'other', tier: 'plain', rank: 0 };
  }
  /* order of major awards on the page: MVP first, then Finals MVP, offence, defence, rookies, rest */
  const majorOrder = t => /^most valuable player$/i.test(t) ? 0 : /finals|super bowl/i.test(t) ? 1 : /offensive player/i.test(t) ? 2 : /defensive player/i.test(t) ? 3 : /offensive rookie/i.test(t) ? 4 : /defensive rookie/i.test(t) ? 5 : /rookie/i.test(t) ? 6 : 7;
  const COL = { gold: ['#ffe9a3', '#f4c542', '#a8761a'], silver: ['#f4f6fa', '#b9c2d0', '#6b7685'], bronze: ['#f6d2b0', '#cd7f32', '#7a4513'], blue: ['#cfe6ff', '#5aa9ff', '#1d4f91'], plain: ['#e8ecf2', '#9aa6b8', '#505a6b'] };
  /* a small trophy cup in tier colours; no gradient ids, so many can sit on one page */
  function trophy(tier, size) {
    const c = COL[tier] || COL.plain, w = size || 34;
    return `<svg class="aw-tr" viewBox="0 0 40 46" width="${w}" height="${Math.round(w * 46 / 40)}" aria-hidden="true"><path d="M10 4h20v13c0 7-4.5 12-10 13-5.5-1-10-6-10-13z" fill="${c[1]}"/><path d="M10 4h8v26c-5-1-8-6-8-13z" fill="${c[0]}" opacity=".55"/><path d="M10 8H3c0 8 3 12 8 13M30 8h7c0 8-3 12-8 13" fill="none" stroke="${c[1]}" stroke-width="3" stroke-linecap="round"/><rect x="17" y="30" width="6" height="8" fill="${c[2]}"/><rect x="11" y="38" width="18" height="5" rx="2" fill="${c[2]}"/></svg>`;
  }
  const num = v => (typeof v === 'number' && isFinite(v)) ? v : 0;
  /* the rating entry of a season (or the latest one before it) */
  const ratingAt = (p, y) => { let r = null; for (const x of (p && p.ratings) || []) if (x && (x.season == null || x.season <= y)) r = x; return r || ((p && p.ratings) || [])[0] || null; };
  /* season totals (regular season) and the team he played most games for */
  function season(p, y) {
    const t = { gp: 0, gs: 0 }, by = {};
    for (const s of (p && p.stats) || []) if (s.season === y && !s.playoffs) { for (const k in s) if (typeof s[k] === 'number' && k !== 'season' && k !== 'tid') t[k] = (t[k] || 0) + s[k]; by[s.tid] = (by[s.tid] || 0) + num(s.gp); }
    const tids = Object.keys(by).sort((a, b) => by[b] - by[a]);
    t.tid = tids.length ? +tids[0] : (p ? p.tid : null);
    return t;
  }
  const f = n => Math.round(n).toLocaleString('en-US');
  /* the line that tells why he won: chosen by what he produced */
  function statLine(p, y) {
    const t = season(p, y), o = [];
    if (num(t.pssYds) >= 300) o.push([f(t.pssYds), 'pass yds'], [num(t.pssTD), 'TD'], [num(t.pssInt), 'INT']);
    if (num(t.rusYds) >= 150 || (!o.length && num(t.rusYds) > 0)) o.push([f(t.rusYds), 'rush yds'], [num(t.rusTD), 'TD']);
    if (num(t.recYds) >= 150 || (!o.length && num(t.recYds) > 0)) o.push([f(t.recYds), 'rec yds'], [num(t.recTD), 'TD']);
    if (!o.length && (num(t.defSk) || num(t.defInt) || num(t.defTckSolo) + num(t.defTckAst) > 20)) o.push([f(num(t.defTckSolo) + num(t.defTckAst) || num(t.defTck)), 'tackles'], [num(t.defSk), 'sacks'], [num(t.defInt), 'INT']);
    if (!o.length && num(t.gp)) o.push([num(t.gp), 'games']);
    if (num(t.av)) o.push([num(t.av).toFixed(0), 'AV']);
    return o;
  }
  /* "3rd Most Valuable Player" for the winner of that award in that season, by his own count up to that season */
  function nth(p, type, y) { let n = 0; for (const a of (p && p.awards) || []) if (a.type === type && a.season <= y) n++; return n; }
  /* career totals of the major awards, for the all-time board */
  function board(players) {
    const out = [];
    for (const p of players) { let major = 0, mvp = 0, allL = 0, allS = 0, champ = 0; for (const a of p.awards || []) { const c = classify(a.type); if (c.group === 'major') { major++; if (/^most valuable player$/i.test(a.type)) mvp++; } else if (c.group === 'allleague') allL++; else if (c.group === 'allstar' && c.tier === 'blue') allS++; else if (c.group === 'champ') champ++; } if (major || allL) out.push({ pid: p.pid, major, mvp, allL, allS, champ }); }
    return out.sort((a, b) => b.major - a.major || b.mvp - a.mvp || b.allL - a.allL || a.pid - b.pid);
  }
  /* team colours for a card: the base is the first colour; the accent must be readable on a dark card, so the first of the other colours that is light enough is used, else gold */
  const hex = c => /^#[0-9a-f]{6}$/i.test(c || '') ? c.toLowerCase() : null;
  const lum = c => { const n = parseInt(c.slice(1), 16), f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(n >> 16) + .7152 * f((n >> 8) & 255) + .0722 * f(n & 255); };
  function palette(colors) { const c = (colors || []).map(hex).filter(Boolean); return { k1: c[0] || '#0b6cff', k2: c.slice(1).concat(c.slice(0, 1)).find(x => lum(x) >= .25) || '#f4c542' }; }
  const POS = ['QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'CB', 'S', 'K', 'P', 'KR', 'PR'];
  const api = { palette, lum, ord, classify, majorOrder, trophy, ratingAt, season, statLine, nth, board, POS, COL };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMAwardUI = api;
})(typeof self !== 'undefined' ? self : this);
