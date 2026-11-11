# FBGM Hub

A multi-page static site like QB Master Class: plain HTML pages plus shared script files, no build step, hosted on GitHub Pages. The deployable version is the FLAT folder (all files in one folder, no sub-folders): `fbgm-hub-flat.zip`.

## Put it on GitHub Pages
1. Unzip `fbgm-hub-flat.zip` on the device (Android: Files by Google, tap the zip, Extract).
2. Open your repository on github.com (public, e.g. `fbgm-hub`). On a phone choose "Desktop site" in the browser menu.
3. Add file, Upload files, select ALL the extracted files, Commit changes. Files with the same name are replaced.
4. Settings, Pages: Source "Deploy from a branch", Branch main, folder / (root). The site appears after one or two minutes.
5. Open the site in a NORMAL browser tab (a private tab has too little storage), go to Tools / Import and choose the league .json file.

## Cloud sync of your own data (automatic)
Saves watch list, notes, album, coaches and show name to your Google Drive; every device with the same address loads them by itself. The league file is not synced.
1. script.google.com, New project, paste the content of `Code.gs`, save.
2. Deploy, New deployment, type Web app, Execute as: Me, Who has access: Anyone, Deploy. Allow access when asked.
3. Copy the web app address (ends with /exec).
4. On each device: Tools / Import, card 2, paste the address. The small dot in the top bar shows the state (green = synced, orange = working, red = error, grey = off).

## Faces (optional, recommended)
Faces are drawn with facesjs (Apache-2.0). By default the library is loaded from jsDelivr; for offline use put a copy of the library as `facesjs.js` (an ES module that exports `display`) next to the pages, and it is used first.

## Pages added in version 1.21
`charts.html` (Chart lab), `viz.js`, `metrics.js`, `leaguedata.js`, `teamdash.js`; `team.html`, `tstats.html`, `playoffs.html`, `diagnostics.html`, `faces.js`, `db.js` rewritten or extended. After uploading, import the league again is NOT required (the all-star flag is added when the data is read).

## Pages added in version 1.22
`depth.html` (Depth chart), `scout.html` (Player search), `alltime.html` (All-time records); saved charts in the Chart lab.

## Pages added in version 1.23
`leaguestats.html` (League stats), `splits.js` (standings detail); standings detail option in League, game log in the player page, bar-chart race in the Chart lab, injuries / contracts / news on Home.

## Pages added in version 1.24
`rivalries.html`, `franchises.html`, `drafts.html` (draft history and grades), `contracts.html` (contract value), `rivals.js`, `valuemodels.js`; Chart lab: heat map, distribution, radar; percentile card on player pages; ratings radar on Compare.

## Pages added in version 1.25
`milestones.html`, `timeline.html`, `recap.html` (season recap), `ngs.html` (Next Gen Stats), `matchup.html`, `settings.html`, `careers.js`; career story and player twins on player pages; chosen voices in the morning show; own theme colours kept.

## Install on the phone and offline use
Upload `manifest.webmanifest`, `sw.js`, `icon-192.png` and `icon-512.png` with the other files. Open the site over https (GitHub Pages is), then use the browser menu, Add to Home screen. Pages and scripts you have opened are kept and used when there is no network. After a release that must replace old copies, change `V` in `sw.js`.

## Tests (computer only)
`node tests/scanner.test.js` and the other files in `tests/` (source folder only). Version 1.21 adds `FBGM-hub-tests/metrics-teamdash.test.js` (53 checks of the metric formulas against values of the game, the team formation, unit ranks and form).

## Pages added in version 1.26
`gamelog.html` (Game log), `feats.html` (Statistical feats), `finances.html` (League finances), `awardraces.html` (Award races with back-test), `retired.html` (Retired numbers and trophy room), `capbox.html` (Cap sandbox), `picture.html` (Playoff picture with the league's tiebreakers and a check against every finished season), `trade.html` (open trade and saved trading block, read-only); modules `tiebreak.js`, `finance.js`, `awardrace.js`, `capbox.js`; new menu entries. Import again is NOT required.
Tests: `node FBGM-hub-tests/round26.test.js` (56 checks). To try the pages without the real save, serve the parent folder (`python -m http.server 8765`), open `http://localhost:8765/FBGM-hub-tests/seed.html` once (it fills a small invented league into the browser database of that address), then open the pages under `http://localhost:8765/FBGM-hub-flat/`. Import the real league again afterwards.

## Pages added in version 1.27
`bios.html` (Player bios: flag, country, birthplace, college, height, weight, draft), `countries.html` (countries, US states and colleges), `ratings.html` (Player ratings by season, 21 skills), `divisions.html` (Conferences and divisions), `machine.html` (Playoff machine), `pdata.html` (Player data check, a report to send to Claude if an age or a rating shows empty); modules `pinfo.js` (one tolerant reader for age, rating, position, origin, college, height; loaded by `nav.js` on every page), `divstats.js`. Country and college columns added to Players, Player search and the Team roster; country line on the player page. Playoff picture and Projection now treat the league as one pool (2 byes, then the next 12), with a check of both formats against every finished season. `db.js` repairs a missing or text overall, potential or birth year when it reads players. Import again is NOT required.
Tests: `node FBGM-hub-tests/round27.test.js` (57 checks).

## Pages added in version 1.28
`honors.html` (Championships: division, conference and league champions per season and per franchise), `family.html` (Families and family trees), `allleague.html` (all-league and all-rookie teams and awards), `lottery.html` (Draft lottery); `honors.js`. `origins.html` is now `countries.html` (the columns say Country). Division and conference champions also appear on Conferences and divisions, Team history and Season recap; the player page has salary history, injury history, transactions and relatives. Delete the old `origins.html` from the site when you upload. Import again is NOT required.
Tests: `node FBGM-hub-tests/round28.test.js` (19 checks).

## Pages added in version 1.29
`superbowl.html` (the Super Bowl: history of every final, featured game, trophy case, records, charts, MVPs), `finals.js`. Championships now shows Super Bowl titles, appearances and record. League leaders, Player stats, Fantasy, All-time records and the Chart lab (players) have a third choice, regular season + playoffs, and the player page has a combined career table. Import again is NOT required.
Tests: `node FBGM-hub-tests/round29.test.js` (35 checks).

## Pages added in version 1.30
`sbleaders.html` (Super Bowl leaders: career, best single game, one game, rings), `tvspecial.html` (TV specials: Super Bowl night and Awards night, a broadcast with confetti, optional voices, full screen); Super Bowl card on the player page; `finals.js` gained `finalGames`, `single`, `players`. The fantasy league is specified in the specification (section 5.14a) and not built yet. Import again is NOT required.
Tests: `node FBGM-hub-tests/round29.test.js` (40 checks).

## Pages added in version 1.31
`legends.html` (coach legends, the coaching carousel, Hall of Fame players), `coachhist.js` (head-coach lineage of every franchise), `coachlive.js` (every coach against the league right now). The Coaches page shows the live context (banner, Coaches on the clock, a Right now card, the head coaches of the team); TV specials gained Draft night. Import again is NOT required.
Tests: `node FBGM-hub-tests/round30.test.js` (56 checks).

## Version 1.32
TV specials: the whole first round on Draft night (one scene per pick, value labels, draft board), a network ident, a pre-game show with the model's win chance, keys to the game, the scoring summary (when the game record has one), nominees on Awards night, fireworks, optional sound effects and a scene list to jump to any scene. No new files; import again is NOT required.

## Version 1.33
`tvpacks.js` (new): the festive TV packages. TV specials now has nine tabs: Super Bowl night (with a halftime show, the parade and the locker room), Awards night, Draft night, Press conference, Hall of Fame night, All-Star game, Trade deadline day, Retirement ceremonies and Game replay. Import again is NOT required.
Tests: `node FBGM-hub-tests/round31.test.js` (45 checks).

## Version 1.34
`ytlinks.js` (new). TV specials, Super Bowl night: a panel to add one to three YouTube song links as the halftime show of each Super Bowl (remembered per Super Bowl in your world data, synced like your other data, the title taken from YouTube or typed by you). Without links the halftime is the generated one. Needs internet to play. Import again is NOT required.
Tests: `node FBGM-hub-tests/round32.test.js` (52 checks).

## Version 1.35
Repairs from the 1.34 test document. Root cause of many problems: league settings (season, phase, user team, conferences, divisions, tiebreakers) were not read from the save; they are now rebuilt on every read from the raw copy in the database, so importing again is NOT required (the importer is fixed too). TV specials no longer collapse. New: `feats.js` (Statistical feats rewritten), `standview.js` (standings in division, conference and league view with the league's tiebreakers), `retired.js` (duplicate retired numbers merged). Updated: League, Playoff bracket (seeds, bye card), Team (record, ranks, last five games, season schedule), Countries and colleges (all rows, games, AV, titles, US states), Super Bowl, Milestone watch, League timeline.
Tests: `node FBGM-hub-tests/round35.test.js` (24 checks). After uploading, reload the page twice so the new service-worker copy replaces the old one.

## Version 1.36
`awardui.js` and `awardui.css` (new). Awards: a spotlight for the MVP, trophy player cards for every major award, All-League lineups, league leaders, an all-time board. Award races use the same cards. Import again is NOT required.
Tests: `node FBGM-hub-tests/round36.test.js` (16 checks).

## Version 1.37
Season recap (winner cards, individual awards), Championships (conference and division champion cards), Team history rewritten (trophy cabinet, gold champion seasons, franchise record holders, all-time player table). Import again is NOT required.

## Version 1.38
Player page: many more stat columns and rates, marks for career bests and league records, a Legacy card (team record in his games, titles, awards, retired numbers, records held), injury history with games out and rating drop, readable transactions. Tests: `node FBGM-hub-tests/round37.test.js` (18 checks). Import again is NOT required.

## Version 1.39
`coachcar.js` (new). Coaches: a coaching market (coaches without a job, former players as candidates), fire and hire for any team (tick "Manage any team"), a coaching carousel with preview and apply, coordinator numbers. Tests: `node FBGM-hub-tests/round38.test.js` (13 checks). Import again is NOT required.

## Version 1.40
`lottery.js` (new). TV specials: Draft lottery night (replay of the stored lottery or a what-if simulation). Playoff machine buttons visible again. Hero text no longer runs under the face or stripe at the right edge. Tests: `node FBGM-hub-tests/round39.test.js` (9 checks). Import again is NOT required.

## Version 1.41
Maps (new page): teams on a US map, players by US state, players by country, with zoom. New files: `maps.html`, `mapgeo.js`, `us-states.json`, `world-countries.json` (upload all four). Tests: `node FBGM-hub-tests/round40.test.js` (14 checks). Import again is NOT required.

## Version 1.42
`tradecalc.js` (new). Trade calculator on the Trade page (own value model, nothing is executed); Super Bowl seeds and seed-based record cards; Chart lab Ranking no longer overlaps the next card. Tests: `node FBGM-hub-tests/round41.test.js` (13 checks). Import again is NOT required.

## Version 1.43
Fantasy league (new page, menu: Fantasy league): a real snake draft against AI managers named after your league's Hall of Fame players, a season of head-to-head weeks from the real games of the season you choose, standings, playoffs and a champion. New files: `fleague.html`, `fleague.js`. Tests: `node FBGM-hub-tests/round42.test.js` (221 checks). Not yet: waivers, trades, manual lineups. Import again is NOT required.

## Version 1.44
Fixes: Trade calculator and Super Bowl chart no longer write into the top bar; checkboxes have a normal size. Draft lottery uses the odds stored in your save. Coaches: realistic dismissals, retirements, coordinators and hires. Fantasy league: faces, manual lineups, free agents, trades with the AI managers, a TV championship night. Tests: rounds 30, 38, 39, 42 updated. Import again is NOT required.

## Version 1.45
Coaches: no random draws. Every coach has ratings that change with the years, a reputation, a personality and a retirement age; every team has an owner with his own patience and a preferred style. Mid-season firings after a collapse against the expectation (interim head coach from the coordinators), hot coordinators as the most wanted head-coach candidates, failed head coaches returning as coordinators. Tests: `node FBGM-hub-tests/round38.test.js` (38 checks). Import again is NOT required.

## Version 1.46
A face beside every player name in every table (automatic, on every page). Fantasy league: waivers with a rolling priority, the AI managers use the wire, coach legends as managers. Import again is NOT required.
