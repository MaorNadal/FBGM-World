/* Shared navigation + theme, used by every page (same idea as QB Master Class nav.js). Add a page: set live:true and the file name. */
if (!window.FBGMPlayerInfo) document.write('<script src="pinfo.js"><\/script>');
(function () {
  const MENU = [
    ['Home', 'index.html', 1, '⌂'],
    ['#', 'League'], ['League', 'league.html', 1, '◉'], ['Playoffs', 'playoffs.html', 1, '♕'], ['Schedule', 'schedule.html', 1, '▤'], ['League schedule', 'leagueschedule.html', 1, '▦'], ['Power', 'power.html', 1, '↑'], ['Pulse', 'pulse.html', 1, '♥'], ['News', 'news.html', 1, '✉'], ['Records', 'records.html', 1, '★'], ['All-time records', 'alltime.html', 1, '∞'], ['Awards', 'awards.html', 1, '✦'], ['All-league', 'allleague.html', 1, '☆'], ['Super Bowl', 'superbowl.html', 1, '🏈'], ['Championships', 'honors.html', 1, '🏆'], ['Draft', 'draft.html', 1, '✓'], ['Draft history', 'drafts.html', 1, '⇅'], ['Draft lottery', 'lottery.html', 1, '🎲'], ['Rivalries', 'rivalries.html', 1, '⚔'], ['Timeline', 'timeline.html', 1, '⏳'], ['Season recap', 'recap.html', 1, '▣'], ['Milestones', 'milestones.html', 1, '⚑'], ['Franchises', 'franchises.html', 1, '⛨'], ['Greatest of all time', 'goat.html', 1, '✪'], ['History cards', 'anniversaries.html', 1, '✦'], ['Finances', 'finances.html', 1, '$'], ['Playoff picture', 'picture.html', 1, '⑦'], ['Playoff machine', 'machine.html', 1, '⚙'], ['Conferences', 'divisions.html', 1, '⬓'],
    ['#', 'Team'], ['Team', 'team.html', 1, '▣'], ['Team history', 'teamhist.html', 1, '↺'], ['Matchup', 'matchup.html', 1, '⚔'], ['Depth chart', 'depth.html', 1, '▥'], ['Cap', 'cap.html', 1, '$'], ['Contract value', 'contracts.html', 1, '±'], ['Retired numbers', 'retired.html', 1, '№'], ['Coaches', 'coaches.html', 1, '✎'], ['General managers', 'gms.html', 1, '☗'], ['Legends', 'legends.html', 1, '♛'],
    ['#', 'Players'], ['Players', 'players.html', 1, '☻'], ['Player search', 'scout.html', 1, '⌖'], ['Player bios', 'bios.html', 1, '☺'], ['Families', 'family.html', 1, '⚭'], ['Countries', 'countries.html', 1, '⚐'], ['Maps', 'maps.html', 1, '◎'], ['Compare', 'compare.html', 1, '⇄'], ['Watch list', 'watchlist.html', 1, '☆'], ['Hall of Fame', 'hof.html', 1, '♛'], ['Injuries', 'injuries.html', 1, '✚'], ['Trade', 'trade.html', 1, '⇆'], ['Cards', 'cards.html', 1, '▭'], ['Album', 'album.html', 1, '❖'], ['Sticker album', 'stickers.html', 1, '▣'],
    ['#', 'Stats'], ['Stats', 'stats.html', 1, '▦'], ['Game log', 'gamelog.html', 1, '☷'], ['Player ratings', 'ratings.html', 1, '▤'], ['Player stats', 'pstats.html', 1, '≣'], ['Statistical feats', 'feats.html', 1, '✸'], ['Super Bowl leaders', 'sbleaders.html', 1, '🏆'], ['Award races', 'awardraces.html', 1, '♚'], ['Team stats', 'tstats.html', 1, '◫'], ['League stats', 'leaguestats.html', 1, '≋'], ['Chart lab', 'charts.html', 1, '◔'], ['Fantasy', 'fantasy.html', 1, 'F'], ['Fantasy league', 'fleague.html', 1, '♛'], ['Next Gen Stats', 'ngs.html', 1, '◈'],
    ['#', 'Models'], ['Predictions', 'models.html', 1, '%'], ['Projection', 'projection.html', 1, '∑'], ['Ageing', 'aging.html', 1, '⌛'], ['Cap sandbox', 'capbox.html', 1, '⚖'],
    ['#', 'Media'], ['TV', 'tv.html', 1, '▶'], ['TV specials', 'tvspecial.html', 1, '🎆'], ['Morning show', 'morning.html', 1, '☀'], ['Social', 'social.html', 1, '☰'],
    ['#', 'Tools'], ['Search', 'search.html', 1, '⌕'], ['Notes', 'notes.html', 1, '✎'], ['Tools / Import', 'import.html', 1, '⚙'], ['Diagnostics', 'diagnostics.html', 1, '✔'], ['Player data check', 'pdata.html', 1, '☑'], ['Settings', 'settings.html', 1, '⚙']];
  try { const h = document.head; if (!document.querySelector('link[rel=manifest]')) { h.insertAdjacentHTML('beforeend', '<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#070b12"><link rel="apple-touch-icon" href="icon-192.png">'); }
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {}); } catch (e) {}
  const KEY = 'fbgmhub_';
  try { const t = JSON.parse(localStorage.getItem(KEY + 'theme') || 'null'); if (t) { const r = document.documentElement.style; r.setProperty('--c1', t[0]); r.setProperty('--c2', t[1]); } } catch (e) {}
  try { const nn = JSON.parse(localStorage.getItem(KEY + 'ngsname') || 'null'); if (nn && typeof nn === 'string') MENU.forEach(m => { if (m[1] === 'ngs.html') m[0] = nn; }); } catch (e) {}
  const cur = location.pathname.split('/').pop() || 'index.html';
  const li = MENU.map(([n, f, live, ic]) => n === '#' ? `<div class="sec">${f}</div>` : live ? `<a class="${f === cur ? 'on' : ''}" href="${f}"><i>${ic}</i>${n}</a>` : `<span class="soon"><i>${ic}</i>${n}<em>soon</em></span>`).join('');
  const bar = ['Home', 'League', 'Team', 'Players', 'Stats'].map(n => MENU.find(m => m[0] === n)).filter(m => m[2]).map(([n, f, , ic]) => `<a class="${f === cur ? 'on' : ''}" href="${f}"><i>${ic}</i><b>${n.split(' ')[0]}</b></a>`).join('');
  document.body.insertAdjacentHTML('afterbegin', `<header class="top"><button id="mb" aria-label="Menu">☰</button><a class="logo" href="index.html">FBGM <b>HUB</b></a><span id="tc"></span></header><nav id="dr">${li}</nav><div id="sc"></div><nav class="bot">${bar}</nav>`);
  const t = id => document.getElementById(id), tog = () => document.body.classList.toggle('open');
  t('mb').onclick = tog; t('sc').onclick = tog;
  const ink = c => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); if (!m) return '#fff'; const n = parseInt(m[1], 16), l = 0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255); return l > 150 ? '#000' : '#fff'; };
  const countUp = root => { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; (root || document).querySelectorAll('.tile b').forEach(b => { const txt = b.textContent.trim(); if (!/^[\d,]+$/.test(txt)) return; const to = +txt.replace(/,/g, ''), t0 = performance.now(); (function f(t) { const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3); b.textContent = Math.round(to * e).toLocaleString('en-US'); if (k < 1) requestAnimationFrame(f); })(t0); }); };
  window.Hub = { countUp, ink, KEY, setTitle: s => t('tc').textContent = s };
})();
/* FA-1: faces beside player names in every table, also on pages that did not load faces.js */
addEventListener('load', () => { if (!window.Faces && window.HubDB) { const x = document.createElement('script'); x.src = 'faces.js'; document.head.appendChild(x); } });
/* BK-1 (1.49): a reminder to back up the world data (coaches, fantasy leagues, watch list, notes, album) when it has never been saved to a file or not for two weeks */
addEventListener('load', () => { try { const L = localStorage, n = Object.keys(L).filter(k => k.startsWith('fbgmhub_') && !/theme|_t|cloudurl|lastbackup|snooze/.test(k)).length, last = +L.getItem('fbgmhub_lastbackup') || 0, sn = +L.getItem('bk_snooze') || 0;
  if (n < 2 || Date.now() - last < 14 * 864e5 || Date.now() - sn < 3 * 864e5 || /settings\.html|import\.html/.test(location.pathname)) return; const m = document.querySelector('main'); if (!m) return;
  const b = document.createElement('div'); b.className = 'card'; b.style.cssText = 'border-left:4px solid var(--c2);display:flex;gap:10px;align-items:center;flex-wrap:wrap'; b.innerHTML = '<span style="flex:1;min-width:200px"><b>Back up your world data.</b> Coaches, fantasy leagues, notes and the album live in this browser only. ' + (last ? 'The last file backup was ' + Math.round((Date.now() - last) / 864e5) + ' days ago.' : 'It has never been saved to a file.') + '</span><a class="btn" href="settings.html#backup">Save a file</a><button class="btn ghost" id="bks">Later</button>'; b.style.marginTop = '18px'; m.appendChild(b); b.querySelector('#bks').onclick = () => { L.setItem('bk_snooze', String(Date.now())); b.remove(); }; } catch (e) {} });
/* 1.74 (FR-NAV-2): the season you pick on a page is remembered and used by the other pages that have a season box (id "y", every option a four-digit year) unless the address names a season itself.
   A small chip in the top bar shows the remembered season; a click forgets it. */
(function () {
  const KEY = 'fbgmhub_season'; let chip = null;
  const get = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const put = v => { try { v ? localStorage.setItem(KEY, v) : localStorage.removeItem(KEY); } catch (e) {} };
  const show = () => {
    const v = get(); if (!v) { if (chip) chip.hidden = true; return; }
    if (!chip) { const h = document.querySelector('header.top'); if (!h) return; chip = document.createElement('button'); chip.id = 'sy'; chip.style.cssText = 'margin-left:auto;background:#ffffff14;color:inherit;border:1px solid #ffffff33;border-radius:99px;padding:2px 10px;font:600 12px var(--f);cursor:pointer;min-height:28px'; chip.title = 'The season you chose is remembered for the other pages. Click to forget it.'; chip.onclick = () => { put(null); chip.hidden = true; location.reload(); }; h.appendChild(chip); }
    chip.hidden = false; chip.textContent = 'Season ' + v + ' ✕';
  };
  const NAMED = /(^|[?&#])y=\d{4}/.test(location.search + location.hash); /* read once, at load: a page may write the season into the address itself later */
  const isSeasonBox = s => s && s.tagName === 'SELECT' && s.id === 'y' && s.options.length > 1 && [...s.options].every(o => /^\d{4}$/.test(o.value || o.text));
  function hook(sel) {
    if (sel.__sh || !isSeasonBox(sel)) return; sel.__sh = 1;
    const want = get();
    if (want && !NAMED && sel.value !== want && [...sel.options].some(o => (o.value || o.text) === want)) { sel.value = want; sel.dispatchEvent(new Event('change', { bubbles: true })); }
    sel.addEventListener('change', () => { put(sel.value); show(); });
    show();
  }
  const scan = () => { const s = document.getElementById('y'); if (s) hook(s); };
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  addEventListener('load', () => { scan(); show(); });
})();
