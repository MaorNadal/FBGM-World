/* PO-1 (1.47): a full-body player figure, drawn in SVG, in the team's colours: legs, jersey with shoulder pads and number, arms in a pose, and a head that is either the player's face (from facesjs) or a helmet with a facemask.
   Poses: stand, celebrate (arms up), throw (right arm cocked back), run (legs apart, arms bent), carry (ball under the arm). Pure: returns an SVG string; the face part is given as an SVG string (Faces.svgString) or left out.
   A drawing, not a model of the player: only the colours, the number, the pose and the face come from the data. */
(function (root) {
  const esc = x => String(x == null ? '' : x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const hex = c => /^#[0-9a-f]{6}$/i.test(c || '') ? c : null;
  const shade = (c, k) => { const n = parseInt(c.slice(1), 16), f = v => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + [n >> 16, (n >> 8) & 255, n & 255].map(f).map(v => v.toString(16).padStart(2, '0')).join(''); };
  const lum = c => { const n = parseInt(c.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000; };
  const POSES = ['stand', 'celebrate', 'throw', 'run', 'carry'];
  /* arms: [left upper+forearm path, right] as paths from the shoulders (left shoulder 72,118; right shoulder 128,118), legs likewise from the hips */
  const ARMS = {
    stand: ['M72 120 L54 168 L58 204', 'M128 120 L146 168 L142 204'],
    celebrate: ['M72 118 L46 80 L40 40', 'M128 118 L154 80 L160 40'],
    throw: ['M72 120 L50 150 L66 176', 'M128 118 L158 96 L176 56'],
    run: ['M72 120 L48 150 L68 176', 'M128 120 L152 142 L138 112'],
    carry: ['M72 120 L50 160 L64 190', 'M128 120 L134 160 L96 170']
  };
  const LEGS = {
    stand: ['M86 206 L84 300', 'M114 206 L116 300'],
    celebrate: ['M86 206 L78 300', 'M114 206 L122 300'],
    throw: ['M86 206 L80 300', 'M114 206 L124 296'],
    run: ['M86 206 L66 270 L50 300', 'M114 206 L132 258 L150 296'],
    carry: ['M86 206 L74 300', 'M114 206 L124 300']
  };
  /* o: { c1, c2 team colours, number, pose, helmet (true: helmet, false: face), face (svg string positioned for a 100 x 120 box at the head, optional), skin, ball (true: draw a football for carry and throw) } */
  function figure(o) {
    o = o || {}; const c1 = hex(o.c1) || '#0b6cff', c2 = hex(o.c2) || '#f4c542', pose = POSES.includes(o.pose) ? o.pose : 'stand', skin = hex(o.skin) || '#b98866', ink = lum(c1) > 150 ? '#111' : '#fff';
    const arm = (d, k) => `<path d="${d}" fill="none" stroke="${skin}" stroke-width="15" stroke-linecap="round" stroke-linejoin="round"/><path d="${d.split(' L')[0]} L${d.split(' L')[1]}" fill="none" stroke="${c1}" stroke-width="19" stroke-linecap="round"/>`;
    const leg = d => `<path d="${d}" fill="none" stroke="${shade(c2, 0.9)}" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/><path d="${d.split(' L').slice(-2).map((x, i) => (i ? 'L' : 'M') + x.replace(/^M/, '')).join(' ')}" fill="none" stroke="#e8e8e8" stroke-width="12" stroke-linecap="round"/>`;
    const head = o.helmet !== false
      ? `<g><ellipse cx="100" cy="64" rx="36" ry="38" fill="${c2}" stroke="${shade(c2, 0.6)}" stroke-width="2"/><path d="M64 60 Q100 20 136 60" fill="none" stroke="${c1}" stroke-width="7"/><path d="M100 28 L100 52" stroke="${c1}" stroke-width="6"/><path d="M118 70 L146 74 M118 82 L144 88 M120 94 L138 98" stroke="#d8d8d8" stroke-width="4" stroke-linecap="round"/><path d="M114 66 L120 100" stroke="#d8d8d8" stroke-width="4"/><ellipse cx="86" cy="70" rx="7" ry="9" fill="${c1}" opacity=".85"/></g>`
      : (o.face ? `<g>${o.face}</g>` : `<g><circle cx="100" cy="66" r="30" fill="${skin}"/></g>`);
    const ball = (pose === 'carry' || pose === 'throw') && o.ball !== false ? (pose === 'carry' ? '<ellipse cx="98" cy="170" rx="16" ry="9" fill="#8a4b25" stroke="#5d3015" stroke-width="2" transform="rotate(-14 98 170)"/><path d="M90 168 L106 172" stroke="#fff" stroke-width="2"/>' : '<ellipse cx="178" cy="52" rx="14" ry="8" fill="#8a4b25" stroke="#5d3015" stroke-width="2" transform="rotate(-50 178 52)"/>') : '';
    return `<svg class="po-fig" viewBox="0 0 200 320" role="img" aria-label="Player figure, ${esc(pose)}" xmlns="http://www.w3.org/2000/svg">${LEGS[pose].map(leg).join('')}<path d="M70 112 Q100 100 130 112 L136 142 L130 212 L70 212 L64 142 Z" fill="${c1}" stroke="${shade(c1, 0.6)}" stroke-width="2"/><path d="M66 114 Q100 98 134 114 L138 130 Q100 118 62 130 Z" fill="${shade(c1, 1.18)}" opacity=".9"/><rect x="70" y="196" width="60" height="14" fill="${c2}"/>${ARMS[pose].map(a => arm(a)).join('')}<text x="100" y="176" text-anchor="middle" font-family="system-ui,Arial" font-weight="900" font-size="38" fill="${ink}" stroke="${c2}" stroke-width=".8">${esc(o.number == null ? '' : o.number)}</text>${head}${ball}</svg>`;
  }
  /* a facesjs svg string (from Faces.svgString) cropped to the head and placed at the head of the figure */
  const faceFit = raw => raw ? raw.replace(/\sx="[^"]*"|\sy="[^"]*"|\swidth="[^"]*"|\sheight="[^"]*"/g, '').replace(/viewBox="[^"]*"/, 'viewBox="50 14 300 310" preserveAspectRatio="xMidYMin meet"').replace(/^<svg/, '<svg x="52" y="16" width="96" height="100"') : '';
  const api = { POSES, figure, faceFit };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMPose = api;
})(typeof self !== 'undefined' ? self : this);
