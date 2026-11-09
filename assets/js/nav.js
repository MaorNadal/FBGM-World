/* Shared navigation + theme, used by every page (same idea as QB Master Class nav.js). Add a page: set live:true and the file name. */
(function () {
  const MENU = [
    ['Home', 'index.html', 1, '⌂'], ['League', 'league.html', 1, '◉'], ['Team', 'team.html', 1, '▣'], ['Schedule', 'schedule.html', 1, '▤'], ['Cap', 'cap.html', 1, '$'], ['Power', 'power.html', 1, '↑'], ['Predictions', 'models.html', 1, '%'], ['Projection', 'projection.html', 1, '∑'], ['Pulse', 'pulse.html', 1, '♥'], ['Ageing', 'aging.html', 1, '⌛'], ['Draft', 'draft.html', 1, '✓'], ['News', 'news.html', 1, '✉'], ['Players', 'players.html', 1, '☻'], ['Compare', 'compare.html', 1, '⇄'], ['Watch list', 'watchlist.html', 1, '☆'], ['Team history', 'teamhist.html', 1, '↺'], ['Search', 'search.html', 1, '⌕'], ['Hall of Fame', 'hof.html', 1, '♛'], ['Injuries', 'injuries.html', 1, '✚'],
    ['Stats', 'stats.html', 1, '▦'], ['Records', 'records.html', 1, '★'], ['Coaches', 'coaches.html', 1, '✎'], ['Social', 'social.html', 1, '☰'], ['Fantasy', 'fantasy.html', 1, 'F'], ['Cards', 'cards.html', 1, '▭'], ['Album', 'album.html', 1, '▤'],
    ['TV', 'tv.html', 1, '▶'], ['Morning show', 'morning.html', 1, '☀'], ['Awards', 'awards.html', 1, '✦'], ['Next Gen Stats', 'ngs.html', 0, '◈'], ['Tools / Import', 'import.html', 1, '⚙'], ['Diagnostics', 'diagnostics.html', 1, '✔']];
  const KEY = 'fbgmhub_';
  try { const t = JSON.parse(localStorage.getItem(KEY + 'theme') || 'null'); if (t) { const r = document.documentElement.style; r.setProperty('--c1', t[0]); r.setProperty('--c2', t[1]); } } catch (e) {}
  const cur = location.pathname.split('/').pop() || 'index.html';
  const li = MENU.map(([n, f, live, ic]) => live ? `<a class="${f === cur ? 'on' : ''}" href="${f}"><i>${ic}</i>${n}</a>` : `<span class="soon"><i>${ic}</i>${n}<em>soon</em></span>`).join('');
  const bar = ['Home', 'League', 'Team', 'Players', 'Stats'].map(n => MENU.find(m => m[0] === n)).filter(m => m[2]).map(([n, f, , ic]) => `<a class="${f === cur ? 'on' : ''}" href="${f}"><i>${ic}</i><b>${n.split(' ')[0]}</b></a>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `<header class="top"><button id="mb" aria-label="Menu">☰</button><a class="logo" href="index.html">FBGM <b>HUB</b></a><span id="tc"></span></header><nav id="dr">${li}</nav><div id="sc"></div><nav class="bot">${bar}</nav>`);
  const t = id => document.getElementById(id), tog = () => document.body.classList.toggle('open');
  t('mb').onclick = tog; t('sc').onclick = tog;
  const ink = c => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); if (!m) return '#fff'; const n = parseInt(m[1], 16), l = 0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255); return l > 150 ? '#000' : '#fff'; };
  window.Hub = { ink, KEY, setTitle: s => t('tc').textContent = s };
})();
