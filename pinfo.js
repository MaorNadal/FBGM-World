/* Pure: one place that reads a player's rating, position, age, country, college and body from a raw (or slim) player record, tolerant of the shapes the game uses.
   Rating: the ratings entry of the season (or the latest one before it, or the latest one at all); overall from `ovr`, else from `ovrs[pos]`, else the best of `ovrs`, else the record's own `ovr`.
   Age: season minus born.year, else the record's own `age`. Country: born.loc ("City, ST", "City, Country" or just a country) mapped to a country and an ISO code for the flag.
   Nothing is invented: a value that is not in the record is null. */
(function (root) {
  const num = v => typeof v === 'number' && isFinite(v) ? v : (typeof v === 'string' && v.trim() !== '' && isFinite(+v) ? +v : null);
  function ratingAt(p, season) {
    const R = (p && p.ratings) || []; if (!R.length) return null; let r = null;
    for (const x of R) if (x && (season == null || x.season == null || x.season <= season)) r = x;
    return r || R[R.length - 1];
  }
  function pick(r, p, k, ks) {
    if (!r) return num(p && p[k]);
    let v = num(r[k]); if (v != null) return v;
    const o = r[ks]; if (o && typeof o === 'object') { if (r.pos != null && num(o[r.pos]) != null) return num(o[r.pos]); const a = Object.values(o).map(num).filter(x => x != null); if (a.length) return Math.max(...a); }
    return num(p && p[k]);
  }
  const ovr = (p, season, r) => pick(r || ratingAt(p, season), p, 'ovr', 'ovrs'), pot = (p, season, r) => pick(r || ratingAt(p, season), p, 'pot', 'pots');
  function pos(p, season, r) { r = r || ratingAt(p, season); return (r && r.pos) || (p && p.pos) || ''; }
  function age(p, season) { if (!p) return null; const y = p.born && num(p.born.year); if (y != null && season != null) return season - y; return num(p.age); }
  const loc = p => (p && p.born && typeof p.born.loc === 'string' ? p.born.loc.trim() : '');
  const college = p => { const c = p && p.college; return typeof c === 'string' && c.trim() && !/^none$/i.test(c.trim()) ? c.trim() : ''; };
  const inch = p => num(p && p.hgt), lbs = p => num(p && p.weight);
  const height = p => { const h = inch(p); return h == null ? '' : Math.floor(h / 12) + "'" + Math.round(h % 12) + '"'; };

  /* ---- country of a birthplace ---- */
  const US = 'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(' ');
  const USN = 'alabama;alaska;arizona;arkansas;california;colorado;connecticut;delaware;florida;georgia;hawaii;idaho;illinois;indiana;iowa;kansas;kentucky;louisiana;maine;maryland;massachusetts;michigan;minnesota;mississippi;missouri;montana;nebraska;nevada;new hampshire;new jersey;new mexico;new york;north carolina;north dakota;ohio;oklahoma;oregon;pennsylvania;rhode island;south carolina;south dakota;tennessee;texas;utah;vermont;virginia;washington;west virginia;wisconsin;wyoming;district of columbia'.split(';');
  const CAP = 'ON QC BC AB MB SK NS NB NL PE'.split(' ');
  /* iso: names (lower case) */
  const NAMES = 'us:usa,united states,united states of america,u.s.,u.s.a.,america;ca:canada;mx:mexico;gb:uk,united kingdom,england,scotland,wales,great britain,northern ireland;ie:ireland;fr:france;de:germany;es:spain;it:italy;pt:portugal;nl:netherlands,holland;be:belgium;ch:switzerland;at:austria;se:sweden;no:norway;dk:denmark;fi:finland;is:iceland;pl:poland;cz:czech republic,czechia;sk:slovakia;hu:hungary;ro:romania;bg:bulgaria;gr:greece;tr:turkey;ru:russia;ua:ukraine;by:belarus;lt:lithuania;lv:latvia;ee:estonia;hr:croatia;rs:serbia;ba:bosnia and herzegovina,bosnia;si:slovenia;mk:north macedonia,macedonia;al:albania;me:montenegro;cy:cyprus;mt:malta;lu:luxembourg;ge:georgia (country);am:armenia;az:azerbaijan;il:israel;lb:lebanon;sa:saudi arabia;ae:united arab emirates,uae;ir:iran;iq:iraq;jo:jordan;eg:egypt;ma:morocco;dz:algeria;tn:tunisia;ly:libya;ng:nigeria;gh:ghana;ci:ivory coast,cote d\'ivoire,côte d\'ivoire;sn:senegal;cm:cameroon;cd:dr congo,democratic republic of the congo,congo (dr);cg:republic of the congo,congo;ke:kenya;et:ethiopia;ug:uganda;tz:tanzania;za:south africa;zw:zimbabwe;zm:zambia;ao:angola;mz:mozambique;sd:sudan;ss:south sudan;so:somalia;lr:liberia;sl:sierra leone;gn:guinea;ml:mali;bf:burkina faso;tg:togo;bj:benin;ga:gabon;na:namibia;bw:botswana;mg:madagascar;rw:rwanda;bi:burundi;cv:cape verde;gm:gambia;ar:argentina;br:brazil;cl:chile;co:colombia;pe:peru;ve:venezuela;ec:ecuador;uy:uruguay;py:paraguay;bo:bolivia;cr:costa rica;pa:panama;gt:guatemala;hn:honduras;sv:el salvador;ni:nicaragua;cu:cuba;do:dominican republic;ht:haiti;jm:jamaica;tt:trinidad and tobago,trinidad;bs:bahamas;bb:barbados;pr:puerto rico;vi:u.s. virgin islands,us virgin islands;gu:guam;as:american samoa;ws:samoa;to:tonga;fj:fiji;nz:new zealand;au:australia;pg:papua new guinea;jp:japan;kr:south korea,korea;kp:north korea;cn:china;tw:taiwan;hk:hong kong;mn:mongolia;in:india;pk:pakistan;bd:bangladesh;lk:sri lanka;np:nepal;th:thailand;vn:vietnam;ph:philippines;id:indonesia;my:malaysia;sg:singapore;kh:cambodia;mm:myanmar;kz:kazakhstan;uz:uzbekistan;af:afghanistan';
  const BY = {}; NAMES.split(';').forEach(e => { const i = e.indexOf(':'), iso = e.slice(0, i); e.slice(i + 1).split(',').forEach(n => BY[n.trim()] = iso); });
  const DISPLAY = { us: 'USA', gb: 'United Kingdom', ca: 'Canada', cd: 'DR Congo', ci: 'Ivory Coast', kr: 'South Korea', nz: 'New Zealand' };
  const title = t => t.replace(/(^|[\s(])[a-z]/g, c => c.toUpperCase());
  const nameOf = iso => DISPLAY[iso] || title(Object.keys(BY).find(k => BY[k] === iso && k.length > 3) || iso.toUpperCase());
  const cache = {};
  function country(p) {
    const L = typeof p === 'string' ? p : loc(p); if (!L) return { name: '', iso: '', state: '', raw: '' };
    if (cache[L]) return cache[L];
    const parts = L.split(',').map(s => s.trim()).filter(Boolean), last = parts[parts.length - 1] || '', lo = last.toLowerCase();
    let iso = '', state = '', name = '';
    if (BY[lo]) iso = BY[lo];
    else if (US.includes(last.toUpperCase()) && last.length === 2) { iso = 'us'; state = last.toUpperCase(); }
    else if (CAP.includes(last.toUpperCase()) && last.length === 2) iso = 'ca';
    else if (USN.includes(lo)) { iso = 'us'; state = last; }
    else for (const x of parts) { const y = x.toLowerCase(); if (BY[y]) { iso = BY[y]; break; } }
    if (iso === 'us' && !state && parts.length > 1 && US.includes(parts[parts.length - 2].toUpperCase())) state = parts[parts.length - 2].toUpperCase();
    name = iso ? nameOf(iso) : last;
    return cache[L] = { name, iso, state, raw: L };
  }
  const emoji = iso => iso && iso.length === 2 ? String.fromCodePoint(...iso.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) : '';
  /* flag as html: an image of the flag (needs internet) with the ISO letters as the fallback; nothing when the country is unknown */
  function flag(c, h) {
    if (!c || !c.iso) return ''; h = h || 14; const w = Math.round(h * 4 / 3), e = c.iso.toUpperCase(), t = (c.name || e).replace(/"/g, '&quot;');
    return `<img class="fl" src="https://flagcdn.com/w40/${c.iso}.png" width="${w}" height="${h}" alt="${e}" title="${t}" loading="lazy" referrerpolicy="no-referrer" style="vertical-align:-2px;border-radius:2px;object-fit:cover" onerror="this.outerHTML='<span title=&quot;${t}&quot; style=&quot;font-size:11px;font-weight:700;opacity:.8&quot;>${e}</span>'">`;
  }
  /* what the game's player rows need, in one object */
  function row(p, season) {
    const r = ratingAt(p, season), c = country(p);
    return { ovr: ovr(p, season, r), pot: pot(p, season, r), pos: pos(p, season, r), age: age(p, season), loc: loc(p), country: c.name, iso: c.iso, state: c.state, college: college(p), height: height(p), hgt: inch(p), weight: lbs(p) };
  }
  const api = { ratingAt, ovr, pot, pos, age, loc, college, height, country, flag, emoji, row, num, US, BY };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMPlayerInfo = api;
})(typeof self !== 'undefined' ? self : this);
