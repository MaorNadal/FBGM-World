/* Shared, memoised reads of the league database for pages that compare many teams or players (Chart lab, Team page).
   The player scan keeps a slim copy of each record (see metrics.js slim) so memory stays small on a phone. */
window.LeagueData = (function () {
  const memo = {}, once = (k, f) => memo[k] || (memo[k] = f());
  const api = {
    summary: () => once('s', () => HubDB.summary()),
    teams: () => once('t', () => HubDB.all('teams')),
    games: () => once('g', () => HubDB.all('games')),
    elo: () => once('e', async () => FBGMModels.run(await api.games())),
    players: () => once('p', () => HubDB.scanMap('players', FBGMMetrics.slim)),
    /* settings of the league (gameAttributes), season-valued entries resolved by the caller */
    attrs: () => once('a', async () => ((await HubDB.get('meta', 'gameAttributes')) || {}).v || {}),
    /* context for FBGMMetrics.teamRows of one season */
    async ctx(season, po, o) {
      const [games, M] = await Promise.all([api.games(), api.elo()]), c = { pg: FBGMMetrics.pointsByTeam(games, season, po), elo: FBGMMetrics.eloAtSeasonEnd(M.games, season) };
      if (o && o.roster) c.ro = FBGMMetrics.rosterAgg(await api.players(), season);
      return c;
    }
  };
  return api;
})();
