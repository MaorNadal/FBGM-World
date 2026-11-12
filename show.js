/* Morning-show script from live league data, by templates (no AI). Hosts are invented characters. Output: segments of lines {host, text}. */
(function (root) {
  const HOSTS = [{ name: 'Dana Reeves' }, { name: 'Marcus Cole' }];
  const NAMES = ['Daybreak Drive', 'First Light Football', 'The Early Huddle', 'Sunrise Snap', 'Coffee and Kickoff'];
  const h = s => { let x = 7; for (const c of String(s)) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; }, pick = (a, k) => a[h(k) % a.length];
  const LAB = [['pssYds', 'passing yards'], ['pssTD', 'passing touchdowns'], ['rusYds', 'rushing yards'], ['rusTD', 'rushing touchdowns'], ['recYds', 'receiving yards'], ['rec', 'catches'], ['recTD', 'receiving touchdowns'], ['defSk', 'sacks'], ['defInt', 'interceptions']];
  const statLine = r => LAB.filter(([k]) => r[k]).slice(0, 3).map(([k, l]) => r[k] + ' ' + l).join(', ');
  function episode(o) {
    const A = (t) => ({ host: 0, text: t }), B = (t) => ({ host: 1, text: t }), seed = o.season + ':' + o.day, S = [];
    S.push({ title: 'Cold open', lines: [A(`Good morning, and welcome to ${o.name}.`), B(`${o.n} games on the slate for day ${o.day} of ${o.season}. Let us start with the biggest stories.`)] });
    const ps = o.posts.filter(p => p.kind !== 'final' && p.kind !== 'streak').slice(0, 3);
    const react = ['That one will be talked about all week.', 'Nobody had that on their card.', 'You cannot script this league.', 'A statement, plain and simple.'];
    S.push({ title: 'Headlines', lines: ps.length ? ps.flatMap((p, i) => [A(p.text), B(pick(react, seed + 'h' + i))]) : [A('A quiet day on the scoreboard, with results mostly going to form.'), B('Quiet days are when the standings quietly move.')] });
    if (o.potw) S.push({ title: 'Player of the week', lines: [A(`Our player of the day is ${o.potw.name} of ${o.potw.team}.`), B(`${o.potw.line}. That is ${o.potw.pts.toFixed(1)} fantasy points.`)] });
    if (o.power && o.power.length) { const L = [A('Power rankings. Our own index, margin and wins combined.'), B('Top five: ' + o.power.slice(0, 5).map((e, i) => `${i + 1}, ${e.name}`).join('; ') + '.')]; if (o.mover) L.push(A(`Biggest move: ${o.mover.name} ${o.mover.dir === 'up' ? 'up' : 'down'} ${o.mover.delta} ${o.mover.delta === 1 ? 'place' : 'places'}.`)); S.push({ title: 'Power rankings', lines: L }); }
    if (o.take) { const t = o.take; S.push({ title: 'Hot take', lines: t.win ? [A(`Hot take: is ${t.name} for real? Winners of ${t.n} straight.`), B(pick(['The numbers say yes, but the schedule has not pushed back yet.', 'I am buying it until someone proves me wrong.', 'Ask me again after the next two games.'], seed + 't'))] : [A(`Hot take: ${t.name} have lost ${t.n} in a row. Is the season already slipping away?`), B(pick(['Not yet, but the margin for error is gone.', 'Slumps end; the question is how much damage they do first.', 'Somebody in that building is nervous this morning.'], seed + 't'))] }); }
    if (o.trades && o.trades.length) S.push({ title: 'Trade talk', lines: o.trades.slice(0, 2).flatMap((t, i) => [A(t), B(pick(['Interesting. We will see who wins that one.', 'Both sides will say they did well.'], seed + 'x' + i))]) });
    if (o.front && o.front.length) S.push({ title: 'Front office', lines: o.front.slice(0, 3).flatMap((t, i) => [A(t), B(pick(['That changes the picture for next season.', 'Front-office moves like that never come quietly.', 'We will see whether it pays off.'], seed + 'f' + i))]) });
    S.push({ title: 'Sign-off', lines: [B('That is the show.'), A(`Thanks for starting your day with ${o.name}. See you tomorrow.`)] });
    return { title: o.name, hosts: HOSTS, segments: S };
  }
  function recap(g, nm) {
    const w = g.res === 1 ? g.home : g.away, l = g.res === 1 ? g.away : g.home, ws = Math.max(g.hp, g.ap), ls = Math.min(g.hp, g.ap), m = ws - ls;
    if (g.res === 0.5) return `${nm[g.home]} and ${nm[g.away]} finished level at ${g.hp}.`;
    return `${nm[w]} beat ${nm[l]}, ${ws} to ${ls}. ` + (m >= 21 ? 'A comfortable margin.' : m <= 3 ? 'It came down to the final possession.' : 'A solid win.');
  }
  const api = { episode, recap, statLine, HOSTS, NAMES };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMShow = api;
})(typeof self !== 'undefined' ? self : this);
