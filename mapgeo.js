/* Pure: geometry for the maps page (MP-1, version 1.41).
   The shapes are public-domain data kept in this folder (us-states.json: US Census states, us-atlas 3.0.1; world-countries.json: Natural Earth countries 1:110m, world-atlas 2.0.2), so the maps also work offline.
   decode(): a TopoJSON object into features { id, name, polys: [ [ring, ring...] ] } with rings of [lon, lat].
   albers(): the conic equal-area projection of the United States; fit(): scale and shift a set of projected points into a box.
   Small places (Guam, Hong Kong, Singapore, Malta ...) are not in the 110m shapes: the page lists them next to the map. */
(function (root) {
  function decode(topo, name) {
    const tf = topo.transform || { scale: [1, 1], translate: [0, 0] }, arcs = topo.arcs.map(a => { let x = 0, y = 0; return a.map(([dx, dy]) => { x += dx; y += dy; return [x * tf.scale[0] + tf.translate[0], y * tf.scale[1] + tf.translate[1]]; }); });
    const arc = i => i >= 0 ? arcs[i] : arcs[~i].slice().reverse();
    const ring = ids => { let out = []; ids.forEach(i => { const a = arc(i); out = out.concat(out.length ? a.slice(1) : a); }); return out; };
    return topo.objects[name].geometries.map(g => {
      const polys = g.type === 'Polygon' ? [g.arcs.map(ring)] : g.type === 'MultiPolygon' ? g.arcs.map(p => p.map(ring)) : [];
      return { id: g.id != null ? String(g.id) : '', name: (g.properties || {}).name || '', polys };
    });
  }
  const rad = Math.PI / 180;
  /* Albers equal-area conic. o: { lon0, lat0, p1, p2 }. Returns [x, y] in unit-sphere coordinates, y pointing up (flip when drawing). */
  function albers(o) {
    const n = (Math.sin(o.p1 * rad) + Math.sin(o.p2 * rad)) / 2, c = Math.cos(o.p1 * rad), C = c * c + 2 * n * Math.sin(o.p1 * rad), r0 = Math.sqrt(C - 2 * n * Math.sin(o.lat0 * rad)) / n;
    return (lon, lat) => { const r = Math.sqrt(C - 2 * n * Math.sin(lat * rad)) / n, t = n * (lon - o.lon0) * rad; return [r * Math.sin(t), r0 - r * Math.cos(t)]; };
  }
  /* the transform that fits the bounding box of pts into box [x0, y0, x1, y1], keeping the shape; y is flipped to the screen */
  function fit(pts, box) {
    let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity; for (const [x, y] of pts) { if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > d) d = y; }
    const k = Math.min((box[2] - box[0]) / (c - a || 1), (box[3] - box[1]) / (d - b || 1)), ox = box[0] + ((box[2] - box[0]) - (c - a) * k) / 2, oy = box[1] + ((box[3] - box[1]) - (d - b) * k) / 2;
    return ([x, y]) => [ox + (x - a) * k, oy + (d - y) * k];
  }
  const f1 = v => Math.round(v * 10) / 10;
  const path = (polys, pj) => polys.map(p => p.map(r => 'M' + r.map(([lo, la]) => pj(lo, la)).map(q => f1(q[0]) + ',' + f1(q[1])).join('L') + 'Z').join('')).join('');
  /* a united-states layout in a 960 x 600 box: the lower 48 big, Alaska and Hawaii as insets at the lower left. Returns { project(lon,lat) -> [x,y], paths: {fips: d} } */
  function usLayout(states) {
    const ok48 = new Set(Object.values(FIPS)), part = id => id === '02' ? 'ak' : id === '15' ? 'hi' : ok48.has(id) ? 'main' : 'skip'; /* territories (Puerto Rico, Guam, Samoa ...) are not drawn */
    const P = { main: albers({ lon0: -96, lat0: 37.5, p1: 29.5, p2: 45.5 }), ak: albers({ lon0: -154, lat0: 50, p1: 55, p2: 65 }), hi: albers({ lon0: -157, lat0: 20, p1: 8, p2: 18 }) };
    const pts = k => states.filter(s => part(s.id) === k).flatMap(s => s.polys.flatMap(p => p.flatMap(r => r.map(([lo, la]) => P[k](lo, la)))));
    const F = { main: fit(pts('main'), [20, 10, 950, 570]), ak: fit(pts('ak'), [20, 430, 230, 590]), hi: fit(pts('hi'), [250, 500, 380, 590]) };
    const proj = (k, lo, la) => F[k](P[k](lo, la));
    const paths = {}; states.forEach(s => { const k = part(s.id); if (k === 'skip') return; paths[s.id] = path(s.polys, (lo, la) => proj(k, lo, la)); });
    return { project: (lo, la) => la > 50 && lo < -125 ? proj('ak', lo, la) : la < 23 && lo < -150 ? proj('hi', lo, la) : proj('main', lo, la), paths };
  }
  /* world, equirectangular, 960 x 480 (latitude 84 north to 58 south: Antarctica is not drawn) */
  function worldLayout(countries) {
    const pj = (lo, la) => [(lo + 180) / 360 * 960, (84 - Math.max(-58, Math.min(84, la))) / 142 * 480], paths = {};
    countries.forEach(c => { if (c.name === 'Antarctica') return; paths[c.id || c.name] = path(c.polys, pj); });
    return { project: pj, paths };
  }
  const FIPS = { AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09', DE: '10', DC: '11', FL: '12', GA: '13', HI: '15', ID: '16', IL: '17', IN: '18', IA: '19', KS: '20', KY: '21', LA: '22', ME: '23', MD: '24', MA: '25', MI: '26', MN: '27', MS: '28', MO: '29', MT: '30', NE: '31', NV: '32', NH: '33', NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38', OH: '39', OK: '40', OR: '41', PA: '42', RI: '44', SC: '45', SD: '46', TN: '47', TX: '48', UT: '49', VT: '50', VA: '51', WA: '53', WV: '54', WI: '55', WY: '56' };
  /* ISO alpha-2 (lower case) to the numeric id of the world shapes; Kosovo has no id there and is matched by name */
  const ISO2N = { ae: '784', af: '004', al: '008', am: '051', ao: '024', ar: '032', at: '040', au: '036', az: '031', ba: '070', bd: '050', be: '056', bf: '854', bg: '100', bi: '108', bj: '204', bo: '068', br: '076', bs: '044', bw: '072', by: '112', ca: '124', cd: '180', cf: '140', cg: '178', ch: '756', ci: '384', cl: '152', cm: '120', cn: '156', co: '170', cr: '188', cu: '192', cy: '196', cz: '203', de: '276', dk: '208', do: '214', dz: '012', ec: '218', ee: '233', eg: '818', es: '724', et: '231', fi: '246', fj: '242', fr: '250', ga: '266', gb: '826', ge: '268', gh: '288', gl: '304', gm: '270', gn: '324', gr: '300', gt: '320', gw: '624', hn: '340', hr: '191', ht: '332', hu: '348', id: '360', ie: '372', il: '376', in: '356', iq: '368', ir: '364', is: '352', it: '380', jm: '388', jo: '400', jp: '392', ke: '404', kg: '417', kh: '116', kp: '408', kr: '410', kz: '398', lb: '422', lk: '144', lr: '430', lt: '440', lu: '442', lv: '428', ly: '434', ma: '504', md: '498', me: '499', mg: '450', mk: '807', ml: '466', mm: '104', mn: '496', mx: '484', my: '458', mz: '508', na: '516', ng: '566', ni: '558', nl: '528', no: '578', np: '524', nz: '554', pa: '591', pe: '604', pg: '598', ph: '608', pk: '586', pl: '616', pr: '630', pt: '620', py: '600', ro: '642', rs: '688', ru: '643', rw: '646', sa: '682', sd: '729', se: '752', si: '705', sk: '703', sl: '694', sn: '686', so: '706', ss: '728', sv: '222', tg: '768', th: '764', tn: '788', tr: '792', tt: '780', tw: '158', tz: '834', ua: '804', ug: '800', us: '840', uy: '858', uz: '860', ve: '862', vn: '704', za: '710', zm: '894', zw: '716', gf: '250', gp: '250' };
  /* well-known US cities: lat, lon (for the team map) */
  const CITY_SRC = 'Albuquerque:35.08,-106.65;Anchorage:61.22,-149.90;Atlanta:33.75,-84.39;Austin:30.27,-97.74;Baltimore:39.29,-76.61;Baton Rouge:30.45,-91.15;Birmingham:33.52,-86.80;Boise:43.62,-116.20;Boston:42.36,-71.06;Buffalo:42.89,-78.88;Charlotte:35.23,-80.84;Chicago:41.88,-87.63;Cincinnati:39.10,-84.51;Cleveland:41.50,-81.69;Colorado Springs:38.83,-104.82;Columbus:39.96,-83.00;Dallas:32.78,-96.80;Dayton:39.76,-84.19;Denver:39.74,-104.99;Des Moines:41.59,-93.62;Detroit:42.33,-83.05;El Paso:31.76,-106.49;Fort Worth:32.76,-97.33;Fresno:36.74,-119.79;Green Bay:44.51,-88.01;Hartford:41.76,-72.67;Honolulu:21.31,-157.86;Houston:29.76,-95.37;Indianapolis:39.77,-86.16;Jacksonville:30.33,-81.66;Kansas City:39.10,-94.58;Las Vegas:36.17,-115.14;Little Rock:34.75,-92.29;Los Angeles:34.05,-118.24;Louisville:38.25,-85.76;Memphis:35.15,-90.05;Miami:25.76,-80.19;Milwaukee:43.04,-87.91;Minneapolis:44.98,-93.27;Nashville:36.16,-86.78;New Orleans:29.95,-90.07;New York:40.71,-74.01;Newark:40.74,-74.17;Oakland:37.80,-122.27;Oklahoma City:35.47,-97.52;Omaha:41.26,-95.93;Orlando:28.54,-81.38;Philadelphia:39.95,-75.17;Phoenix:33.45,-112.07;Pittsburgh:40.44,-80.00;Portland:45.52,-122.68;Providence:41.82,-71.41;Raleigh:35.78,-78.64;Reno:39.53,-119.81;Richmond:37.54,-77.44;Rochester:43.16,-77.61;Sacramento:38.58,-121.49;Salt Lake City:40.76,-111.89;San Antonio:29.42,-98.49;San Diego:32.72,-117.16;San Francisco:37.77,-122.42;San Jose:37.34,-121.89;Seattle:47.61,-122.33;Spokane:47.66,-117.43;St. Louis:38.63,-90.20;St. Paul:44.95,-93.09;Tampa:27.95,-82.46;Toledo:41.65,-83.54;Tucson:32.22,-110.97;Tulsa:36.15,-95.99;Virginia Beach:36.85,-75.98;Washington:38.91,-77.04;Wichita:37.69,-97.34;Albany:42.65,-73.76;Akron:41.08,-81.52;Syracuse:43.05,-76.15;Norfolk:36.85,-76.29;Tacoma:47.25,-122.44;Long Beach:33.77,-118.19;Anaheim:33.84,-117.91;Arlington:32.74,-97.11;Lubbock:33.58,-101.86;Corpus Christi:27.80,-97.40;Knoxville:35.96,-83.92;Chattanooga:35.05,-85.31;Lexington:38.04,-84.50;Madison:43.07,-89.40;Grand Rapids:42.96,-85.67;Lincoln:40.81,-96.68;Sioux Falls:43.55,-96.73;Fargo:46.88,-96.79;Billings:45.78,-108.50;Cheyenne:41.14,-104.82;Burlington:44.48,-73.21;Manchester:42.99,-71.46;Charleston:32.78,-79.93;Columbia:34.00,-81.03;Savannah:32.08,-81.09;Jackson:32.30,-90.18;Montgomery:32.38,-86.30;Mobile:30.69,-88.04;Huntsville:34.73,-86.59;Tallahassee:30.44,-84.28;Gainesville:29.65,-82.32;Fort Lauderdale:26.12,-80.14;St. Petersburg:27.77,-82.64;Shreveport:32.53,-93.75;Wilmington:39.74,-75.55;Annapolis:38.98,-76.49;Worcester:42.26,-71.80;Cambridge:42.37,-71.11;Bridgeport:41.18,-73.19;New Haven:41.31,-72.92;Stamford:41.05,-73.54;Jersey City:40.73,-74.08;Santa Fe:35.69,-105.94;Fayetteville:36.06,-94.16;Fort Collins:40.59,-105.08;Boulder:40.01,-105.27;Aurora:39.73,-104.83;Riverside:33.95,-117.40;Stockton:37.96,-121.29;Bakersfield:35.37,-119.02;Santa Ana:33.75,-117.87;Irvine:33.68,-117.83;Pasadena:34.15,-118.14;Berkeley:37.87,-122.27;San Bernardino:34.11,-117.29;Mesa:33.42,-111.83;Scottsdale:33.49,-111.93;Tempe:33.43,-111.94;Glendale:33.54,-112.19;Chandler:33.31,-111.84;Dover:39.16,-75.52;Duluth:46.79,-92.10;Cedar Rapids:41.98,-91.67;Davenport:41.52,-90.58;Topeka:39.05,-95.68;Fort Wayne:41.08,-85.14;Evansville:37.97,-87.57;South Bend:41.68,-86.25;Flint:43.01,-83.69;Lansing:42.73,-84.56;Ann Arbor:42.28,-83.74;Peoria:40.69,-89.59;Rockford:42.27,-89.09;Naperville:41.79,-88.15;Springfield:39.80,-89.64;Eugene:44.05,-123.09;Salem:44.94,-123.04;Provo:40.23,-111.66;Plano:33.02,-96.70;Juneau:58.30,-134.42;Fairbanks:64.84,-147.72;Morgantown:39.63,-79.96;Biloxi:30.40,-88.89;Greensboro:36.07,-79.79;Durham:35.99,-78.90';
  const CITY = {}; CITY_SRC.split(';').forEach(e => { const i = e.indexOf(':'), q = e.slice(i + 1).split(',').map(Number); CITY[e.slice(0, i).toLowerCase()] = [q[0], q[1]]; });
  /* lat, lon of a team region such as "Los Angeles" (also "St Louis" without the dot), or null */
  const locate = region => { const k = String(region || '').trim().toLowerCase().replace(/^saint /, 'st. ').replace(/^st (?=[a-z])/, 'st. '); return CITY[k] || null; };
  /* a colour between dark blue and gold for 0..1 (the page colours regions by this) */
  const shade = t => { t = Math.max(0, Math.min(1, t)); const a = [27, 54, 86], b = [244, 197, 66], m = a.map((v, i) => Math.round(v + (b[i] - v) * t)); return 'rgb(' + m.join(',') + ')'; };
  const api = { decode, albers, fit, path, usLayout, worldLayout, FIPS, ISO2N, CITY, locate, shade };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMMapGeo = api;
})(typeof self !== 'undefined' ? self : this);
