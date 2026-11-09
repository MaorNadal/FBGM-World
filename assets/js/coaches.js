/* Coaches are a NARRATIVE layer (they do not change the game's simulation). Names and ratings are generated from a seed, so they are stable without storage; hires and firings are stored as world data. */
(function (root) {
  const F = ['Dale', 'Marcus', 'Ray', 'Tom', 'Gene', 'Hank', 'Lou', 'Vince', 'Ed', 'Carl', 'Sam', 'Pete', 'Walt', 'Dick', 'Mike', 'Bruce', 'Nate', 'Rex', 'Gus', 'Dean', 'Frank', 'Jack', 'Leon', 'Otis', 'Pat', 'Ron', 'Seth', 'Wade', 'Abe', 'Cliff'];
  const L = ['Brennan', 'Okafor', 'Whitfield', 'Marsh', 'Delgado', 'Kowalski', 'Hargrove', 'Tanaka', 'Boyd', 'Ferraro', 'Lindqvist', 'Mercer', 'Odom', 'Pruitt', 'Quill', 'Reyes', 'Sutter', 'Thorne', 'Underhill', 'Vega', 'Walsh', 'Yates', 'Zimmer', 'Archer', 'Beckett', 'Crowe', 'Dunmore', 'Everly', 'Fontaine', 'Gallo'];
  const S = ['Disciplinarian', 'Players’ coach', 'Innovator', 'Defensive mind', 'Offensive guru', 'Developer of talent', 'Old school', 'Analytics-minded'];
  const R = { HC: 'Head coach', OC: 'Offensive coordinator', DC: 'Defensive coordinator' };
  const mul = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hash = str => { let h = 2166136261; for (const c of str) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
  function gen(seed, role) {
    const r = mul(hash(seed + '|' + role)), pick = a => a[Math.floor(r() * a.length)], rt = () => 45 + Math.floor(r() * 46);
    return { name: pick(F) + ' ' + pick(L), role, style: pick(S), plan: rt(), motivation: rt(), development: rt(), age: 38 + Math.floor(r() * 30) };
  }
  const pool = (seed, role, n) => Array.from({ length: n }, (_, i) => gen(seed + '#' + i, role));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lab = s => s >= 70 ? 'Safe' : s >= 50 ? 'Warm' : s >= 30 ? 'Hot seat' : 'Fired-watch';
  function security(i) {
    const f = Math.min(1, (i.g || 0) / 10); let s = 55;
    if (i.role === 'OC') s += f * clamp(3 * (i.ppg - i.lgppg), -30, 30);
    else if (i.role === 'DC') s += f * clamp(3 * (i.lgppg - i.papg), -30, 30);
    else {
      s += f * (150 * (i.pct - i.exp) + clamp(0.8 * i.mpg, -12, 12));
      if (i.po != null && i.po >= 0) s += 8 + 4 * i.po;
      if (i.lossStreak >= 4) s -= 2 * i.lossStreak;
      if (typeof i.mood === 'number') s += 2 * i.mood;
    }
    s = clamp(Math.round(s), 0, 100); return { score: s, label: lab(s) };
  }
  const api = { gen, pool, security, label: lab, ROLES: R };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMCoaches = api;
})(typeof self !== 'undefined' ? self : this);
