/* Shared chart components (no library): scatter with logo or face markers and an infographic hover card, ranking bars, season lines, image and CSV export.
   Drawing helpers only; all numbers come from the caller. Markers are real elements (logos, crests) over an SVG grid; export redraws the chart as one SVG with crests so it can become a PNG. */
window.Viz = (function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const ord = n => { const t = n % 100; return n + (t >= 11 && t <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[n % 10] || 'th')); };
  const hex = (c, d) => /^#[0-9a-f]{6}$/i.test(c || '') ? c : d;
  function nice(lo, hi, n) {
    if (!(hi > lo)) { lo -= 1; hi += 1; } const step0 = (hi - lo) / (n || 5), mag = Math.pow(10, Math.floor(Math.log10(step0))), r = step0 / mag, step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
    const a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step, t = []; for (let v = a; v <= b + step * 1e-6; v += step) t.push(+v.toFixed(10)); return { a, b, t, step, dec: step < 1 ? Math.min(3, Math.ceil(-Math.log10(step) - 1e-9)) : 0 };
  }
  /* ---------- infographic card (hover and tap) ---------- */
  /* c = { title, sub, c1, c2, logo (html), face (element id fills later), big: [{label, value, rank, of, pct}], rows: [{label, value, rank, of, pct, good}], href, hrefLabel } */
  function card(c) {
    const big = (c.big || []).map(b => `<div class="vcb"><span>${esc(b.label)}</span><b>${esc(b.value)}</b>${b.rank ? `<i>${ord(b.rank)} of ${b.of}</i>` : ''}</div>`).join('');
    const rows = (c.rows || []).map(r => `<div class="vcr"><span>${esc(r.label)}</span><div class="vcbar"><u style="width:${Math.max(3, Math.min(100, r.pct == null ? 0 : r.pct)).toFixed(0)}%;background:${r.pct == null ? '#566680' : r.pct >= 67 ? 'var(--ok)' : r.pct >= 34 ? 'var(--c2)' : 'var(--bad)'}"></u></div><b>${esc(r.value)}</b><em>${r.rank ? ord(r.rank) : ''}</em></div>`).join('');
    return `<div class="vc" style="--k1:${hex(c.c1, '#1b3a6b')};--k2:${hex(c.c2, '#ffb81c')}"><div class="vch">${c.logo || ''}${c.face ? `<span class="vcf" id="${c.face}"></span>` : ''}<div><b>${esc(c.title)}</b><small>${esc(c.sub || '')}</small></div></div>${big ? `<div class="vcB">${big}</div>` : ''}${rows}${c.href ? `<a class="vca" href="${esc(c.href)}">${esc(c.hrefLabel || 'Open')} ›</a>` : ''}</div>`;
  }
  /* ---------- scatter ---------- */
  function scatter(box, o) {
    const S = { hl: null, pin: null }; let W = 0, H = 0, L = null;
    box.classList.add('vz'); box.innerHTML = '<svg class="vzs" role="img"></svg><div class="vzm"></div><div class="vzc" hidden></div>';
    const svg = box.querySelector('.vzs'), mk = box.querySelector('.vzm'), cd = box.querySelector('.vzc'), size = o.size || 30;
    svg.setAttribute('aria-label', o.title || (o.yl + ' against ' + o.xl));
    function layout() {
      W = Math.max(280, box.clientWidth); H = Math.round(W < 520 ? W * 0.95 : Math.max(340, W * 0.58)); box.style.height = H + 'px';
      const pts = o.points.filter(p => p.x != null && p.y != null && isFinite(p.x) && isFinite(p.y)), m = { l: 50, r: 16, t: 14, b: 44 };
      if (!pts.length) { L = { pts, m, X: { t: [] }, Y: { t: [] }, sx: () => 0, sy: () => 0, sz: () => size, mean: () => 0 }; return; }
      const ext = k => { const v = pts.map(p => p[k]), lo = Math.min(...v), hi = Math.max(...v), pad = (hi - lo || 1) * 0.08; return nice(lo - pad, hi + pad, k === 'x' ? Math.max(3, Math.round(W / 110)) : 5); };
      const X = ext('x'), Y = ext('y'), fx = !!o.flipX, fy = !!o.flipY, pw = W - m.l - m.r, ph = H - m.t - m.b;
      const sx = v => m.l + ((fx ? X.b - v : v - X.a) / (X.b - X.a)) * pw, sy = v => m.t + ((fy ? v - Y.a : Y.b - v) / (Y.b - Y.a)) * ph;
      const rs = pts.map(p => p.r).filter(r => r != null), r0 = Math.min(...rs), r1 = Math.max(...rs);
      const sz = p => p.r == null || !rs.length || r1 === r0 ? size : size * (0.75 + 0.6 * (p.r - r0) / (r1 - r0));
      L = { pts, m, X, Y, sx, sy, sz, pw, ph, mean: k => pts.reduce((a, p) => a + p[k], 0) / (pts.length || 1) };
    }
    function grid(svgMode) {
      const { m, X, Y, sx, sy, pts } = L, f = (v, d, fm) => fm ? fm(v) : v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
      let s = `<rect x="${m.l}" y="${m.t}" width="${W - m.l - m.r}" height="${H - m.t - m.b}" fill="#ffffff06"/>`;
      for (const v of X.t) s += `<line x1="${sx(v)}" x2="${sx(v)}" y1="${m.t}" y2="${H - m.b}" stroke="#1e2b40"/><text x="${sx(v)}" y="${H - m.b + 16}" fill="#8ea0b8" font-size="11" text-anchor="middle">${esc(f(v, X.dec, o.xFmt))}</text>`;
      for (const v of Y.t) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${sy(v)}" y2="${sy(v)}" stroke="#1e2b40"/><text x="${m.l - 7}" y="${sy(v) + 4}" fill="#8ea0b8" font-size="11" text-anchor="end">${esc(f(v, Y.dec, o.yFmt))}</text>`;
      if (o.mean !== false && pts.length > 2) { const mx = L.mean('x'), my = L.mean('y'); s += `<line x1="${sx(mx)}" x2="${sx(mx)}" y1="${m.t}" y2="${H - m.b}" stroke="#5c7090" stroke-dasharray="5 4"/><line x1="${m.l}" x2="${W - m.r}" y1="${sy(my)}" y2="${sy(my)}" stroke="#5c7090" stroke-dasharray="5 4"/><text x="${W - m.r - 4}" y="${sy(my) - 5}" fill="#8ea0b8" font-size="10" text-anchor="end">league average</text>`; }
      if (o.quad) { const q = o.quad; s += `<text x="${W - m.r - 6}" y="${m.t + 15}" fill="var(--ok)" font-size="11" font-weight="700" text-anchor="end" opacity=".85">${esc(q.tr || '')}</text><text x="${m.l + 6}" y="${m.t + 15}" fill="#8ea0b8" font-size="11" text-anchor="start" opacity=".8">${esc(q.tl || '')}</text><text x="${W - m.r - 6}" y="${H - m.b - 8}" fill="#8ea0b8" font-size="11" text-anchor="end" opacity=".8">${esc(q.br || '')}</text><text x="${m.l + 6}" y="${H - m.b - 8}" fill="var(--bad)" font-size="11" font-weight="700" text-anchor="start" opacity=".85">${esc(q.bl || '')}</text>`; }
      s += `<text x="${(m.l + W - m.r) / 2}" y="${H - 6}" fill="#c9d4e4" font-size="12" font-weight="700" text-anchor="middle">${esc(o.xl)}${o.xNote ? ' · ' + esc(o.xNote) : ''}</text><text transform="translate(13 ${(m.t + H - m.b) / 2}) rotate(-90)" fill="#c9d4e4" font-size="12" font-weight="700" text-anchor="middle">${esc(o.yl)}${o.yNote ? ' · ' + esc(o.yNote) : ''}</text>`;
      return s;
    }
    function markers() {
      mk.innerHTML = ''; const { pts, sx, sy, sz } = L;
      const order = pts.slice().sort((a, b) => (b.y - a.y)); /* upper points first so lower ones sit on top */
      for (const p of order) {
        const z = Math.round(sz(p)), b = document.createElement('button'); b.type = 'button'; b.className = 'vzp'; b.dataset.id = p.id; b.setAttribute('aria-label', p.label + ': ' + o.xl + ' ' + p.x + ', ' + o.yl + ' ' + p.y);
        b.style.cssText = `left:${(sx(p.x) - z / 2).toFixed(1)}px;top:${(sy(p.y) - z / 2).toFixed(1)}px;width:${z}px;height:${z}px`;
        b.innerHTML = o.marker ? o.marker(p, z) : `<i style="background:${hex(p.color, '#ffb81c')}"></i>`;
        b.onmouseenter = () => { if (!S.pin) show(p); }; b.onmouseleave = () => { if (!S.pin) hide(); }; b.onfocus = () => { if (!S.pin) show(p); }; b.onblur = () => { if (!S.pin) hide(); };
        b.onclick = e => { e.stopPropagation(); if (S.pin === p.id) { S.pin = null; hide(); } else { S.pin = p.id; show(p); } };
        mk.appendChild(b);
      }
      dim();
    }
    function dim() { mk.querySelectorAll('.vzp').forEach(b => b.classList.toggle('dim', !!S.hl && !S.hl.has(b.dataset.id) && !S.hl.has(+b.dataset.id))); }
    function show(p) {
      cd.innerHTML = o.card ? o.card(p) : card({ title: p.label, rows: [{ label: o.xl, value: p.x }, { label: o.yl, value: p.y }] }); cd.hidden = false;
      const cw = Math.min(W - 16, 264), z = L.sz(p), px = L.sx(p.x), py = L.sy(p.y); cd.style.width = cw + 'px';
      if (W < 520) { cd.style.left = '8px'; cd.style.right = 'auto'; cd.style.top = (py > H / 2 ? 8 : H - cd.offsetHeight - 8) + 'px'; }
      else { const left = px + z / 2 + 10 + cw > W ? px - z / 2 - 10 - cw : px + z / 2 + 10; cd.style.left = Math.max(4, left) + 'px'; cd.style.top = Math.max(4, Math.min(H - cd.offsetHeight - 4, py - cd.offsetHeight / 2)) + 'px'; }
      mk.querySelectorAll('.vzp').forEach(b => b.classList.toggle('on', b.dataset.id == p.id)); if (o.onShow) o.onShow(p, cd);
    }
    function hide() { cd.hidden = true; mk.querySelectorAll('.vzp.on').forEach(b => b.classList.remove('on')); }
    function redraw() { if (!box.isConnected) return; layout(); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', W); svg.setAttribute('height', H); svg.innerHTML = L.pts.length ? grid() : `<text x="${W / 2}" y="${H / 2}" fill="#8ea0b8" text-anchor="middle">No data for this choice</text>`; markers(); hide(); const keep = S.pin, kp = keep != null && L.pts.find(q => q.id === keep); S.pin = null; if (kp) { S.pin = keep; show(kp); } }
    const out = {
      redraw, highlight(ids) { S.hl = ids && ids.size ? ids : null; dim(); },
      svgString() { layout(); const { sx, sy, sz, pts } = L; let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W * 2}" height="${H * 2}" font-family="Bahnschrift,Arial Narrow,Segoe UI,sans-serif"><rect width="${W}" height="${H}" fill="#0e1522"/>`;
        s += grid(); for (const p of pts) { const z = sz(p), x = sx(p.x) - z / 2, y = sy(p.y) - z / 2, c = o.crest ? o.crest(p) : ''; s += c ? c.replace(/^<svg /, `<svg x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${z}" height="${z}" `) : `<circle cx="${sx(p.x)}" cy="${sy(p.y)}" r="${z / 2}" fill="${hex(p.color, '#ffb81c')}"/>`; if (o.labels) s += `<text x="${sx(p.x)}" y="${sy(p.y) + z / 2 + 11}" fill="#c9d4e4" font-size="10" text-anchor="middle">${esc(p.short || '')}</text>`; }
        return s + `<text x="${W - 8}" y="${H - 4}" fill="#566680" font-size="9" text-anchor="end">FBGM Hub</text></svg>`; },
      destroy() { ro && ro.disconnect(); document.removeEventListener('click', away); }
    };
    const away = e => { if (S.pin && !box.contains(e.target)) { S.pin = null; hide(); } }; document.addEventListener('click', away);
    cd.addEventListener('click', e => e.stopPropagation());
    let ro = null; if ('ResizeObserver' in window) { let last = 0; ro = new ResizeObserver(() => requestAnimationFrame(() => { const w = box.clientWidth; if (Math.abs(w - last) > 4) { last = w; redraw(); } })); ro.observe(box); }
    redraw(); return out;
  }
  /* ---------- ranking bars: rows = [{ id, label, value, logo (html), c1, href, sub }] ---------- */
  function bars(box, rows, o) { box.style.height = ''; box.classList.remove('vz'); /* CL-1: a scatter leaves its fixed height on the box; other charts must not inherit it */
    o = o || {}; const L = rows.filter(r => r.value != null && isFinite(r.value)), hi = o.better !== 'low', top = o.top || L.length;
    L.sort((a, b) => hi ? b.value - a.value : a.value - b.value); const S = L.slice(0, top); const mx = Math.max(...S.map(r => Math.abs(r.value)), 1e-9), mn = Math.min(0, ...S.map(r => r.value)), span = Math.max(...S.map(r => r.value), 0) - mn || 1;
    box.classList.add('vbars'); const fm = o.fmt || (v => v.toLocaleString('en-US'));
    box.innerHTML = S.map((r, i) => { const w = ((r.value - mn) / span * 100).toFixed(1); return `<${r.href ? 'a href="' + esc(r.href) + '"' : 'div'} class="vbr${o.mine != null && r.id === o.mine ? ' me' : ''}" style="--w:${w}%;--k:${hex(r.c1, '#0b6cff')};--d:${Math.min(i, 30) * 18}ms"><span class="vbn">${i + 1}</span><span class="vbl">${r.logo || ''}<b>${esc(r.label)}</b></span><span class="vbb"><u></u></span><span class="vbv">${esc(fm(r.value))}</span></${r.href ? 'a' : 'div'}>`; }).join('') || '<p class="mu">No data for this choice.</p>';
  }
  /* ---------- season lines: series = [{ id, label, c1, pts: [[season, value]] }], hl = id ---------- */
  function lines(box, series, o) { box.style.height = ''; box.classList.remove('vz'); /* CL-1: a scatter leaves its fixed height on the box; other charts must not inherit it */
    o = o || {}; const W = Math.max(280, box.clientWidth || 600), H = Math.round(W < 520 ? 260 : 330), m = { l: 46, r: 56, t: 14, b: 30 };
    const all = series.flatMap(s => s.pts).filter(p => p[1] != null && isFinite(p[1])); if (!all.length) { box.innerHTML = '<p class="mu">No data for this choice.</p>'; return; }
    const xs = all.map(p => p[0]), X0 = Math.min(...xs), X1 = Math.max(...xs), ys = nice(Math.min(...all.map(p => p[1])), Math.max(...all.map(p => p[1])), 5);
    const sx = v => m.l + (X1 === X0 ? 0.5 : (v - X0) / (X1 - X0)) * (W - m.l - m.r), sy = v => H - m.b - (v - ys.a) / (ys.b - ys.a) * (H - m.t - m.b), f = o.fmt || (v => v.toFixed(ys.dec));
    let s = ''; for (const v of ys.t) s += `<line x1="${m.l}" x2="${W - m.r}" y1="${sy(v)}" y2="${sy(v)}" stroke="#1e2b40"/><text x="${m.l - 6}" y="${sy(v) + 4}" fill="#8ea0b8" font-size="11" text-anchor="end">${esc(f(v))}</text>`;
    const step = Math.max(1, Math.ceil((X1 - X0 + 1) / Math.max(3, Math.floor(W / 60)))); for (let x = X0; x <= X1; x += step) s += `<text x="${sx(x)}" y="${H - 8}" fill="#8ea0b8" font-size="11" text-anchor="middle">${x}</text>`;
    const draw = (se, strong) => { const pts = se.pts.filter(p => p[1] != null), c = hex(se.c1, '#0b6cff'); if (!pts.length) return ''; const d = pts.map((p, i) => (i ? 'L' : 'M') + sx(p[0]).toFixed(1) + ',' + sy(p[1]).toFixed(1)).join(' '), last = pts[pts.length - 1]; return `<path d="${d}" fill="none" stroke="${strong ? c : '#5c7090'}" stroke-width="${strong ? 3.2 : 1.2}" opacity="${strong ? 1 : .45}" stroke-linejoin="round"/>` + (strong ? pts.map(p => `<circle cx="${sx(p[0]).toFixed(1)}" cy="${sy(p[1]).toFixed(1)}" r="3.5" fill="${c}"><title>${esc(se.label)} ${p[0]}: ${esc(f(p[1]))}</title></circle>`).join('') + `<text x="${sx(last[0]) + 7}" y="${sy(last[1]) + 4}" fill="${c}" font-size="12" font-weight="700">${esc(se.short || se.label)}</text>` : ''); };
    const hl = o.hl; s += series.filter(x => x.id !== hl).map(x => draw(x, false)).join('') + series.filter(x => x.id === hl).map(x => draw(x, true)).join('');
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="${esc(o.title || 'Seasons')}">${s}</svg>`;
  }
  /* ---------- bar-chart race: frames = [{ label, rows: [{ id, label, value, logo, c1 }] }] ---------- */
  function race(box, frames, o) { box.style.height = ''; box.classList.remove('vz'); /* CL-1: a scatter leaves its fixed height on the box; other charts must not inherit it */
    o = o || {}; const N = Math.min(o.top || 10, 16), fm = o.fmt || (v => Math.round(v).toLocaleString('en-US')), RH = 36, hi = o.better !== 'low';
    if (!frames.length) { box.innerHTML = '<p class="mu">No data for this choice.</p>'; return { stop() {} }; }
    box.classList.add('vrace'); let i = 0, timer = null, ms = 1200;
    const ids = new Map(); frames.forEach(f => f.rows.forEach(r => { if (!ids.has(r.id)) ids.set(r.id, r); }));
    const gmax = Math.max(1e-9, ...frames.flatMap(f => f.rows.map(r => r.value)));
    box.innerHTML = `<div class="vrh"><b class="vrl"></b><div class="vrc"><button class="btn" data-a="p" type="button">▶ Play</button><input type="range" min="0" max="${frames.length - 1}" value="0" aria-label="Season"><select data-a="s" aria-label="Speed"><option value="1200">Normal</option><option value="2200">Slow</option><option value="600">Fast</option></select></div></div><div class="vrb" style="height:${N * RH}px">${[...ids.values()].map(r => `<div class="vrr" data-id="${esc(r.id)}" style="--k:${hex(r.c1, '#0b6cff')}"><span class="vrn"></span><span class="vrg">${r.logo || ''}<b>${esc(r.label)}</b></span><span class="vrbar"><u></u></span><span class="vrv"></span></div>`).join('')}</div>`;
    const el = {}; box.querySelectorAll('.vrr').forEach(e => el[e.dataset.id] = e);
    const rng = box.querySelector('input'), btn = box.querySelector('button'), lab = box.querySelector('.vrl');
    function show(k) {
      i = k; rng.value = k; const f = frames[k]; lab.textContent = f.label;
      const L = f.rows.slice().sort((a, b) => hi ? b.value - a.value : a.value - b.value).slice(0, N), mx = Math.max(1e-9, o.fixed ? gmax : Math.max(...L.map(r => r.value)));
      const on = new Set(L.map(r => String(r.id)));
      for (const id in el) { if (!on.has(id)) { el[id].style.opacity = 0; el[id].style.top = N * RH + 'px'; el[id].style.pointerEvents = 'none'; } }
      L.forEach((r, n) => { const e = el[r.id]; e.style.opacity = 1; e.style.top = n * RH + 'px'; e.style.pointerEvents = ''; e.querySelector('.vrn').textContent = n + 1; e.querySelector('u').style.width = Math.max(1, r.value / mx * 100) + '%'; e.querySelector('.vrv').textContent = fm(r.value); });
    }
    function stop() { clearInterval(timer); timer = null; btn.textContent = '▶ Play'; }
    function play() { if (i >= frames.length - 1) show(0); btn.textContent = '⏸ Pause'; timer = setInterval(() => { if (i >= frames.length - 1) { stop(); return; } show(i + 1); }, ms); }
    btn.onclick = () => timer ? stop() : play(); rng.oninput = () => { stop(); show(+rng.value); };
    box.querySelector('select').onchange = e => { ms = +e.target.value; if (timer) { stop(); play(); } };
    show(0); return { stop, show };
  }
  /* ---------- heat map: rows = [{ id, label, logo, vals: [number|null] }], cols = [label] ---------- */
  function heat(box, rows, cols, o) { box.style.height = ''; box.classList.remove('vz'); /* CL-1: a scatter leaves its fixed height on the box; other charts must not inherit it */
    o = o || {}; const hi = o.better !== 'low', fm = o.fmt || (v => v.toFixed(1)), all = rows.flatMap(r => r.vals).filter(v => v != null && isFinite(v));
    if (!all.length) { box.innerHTML = '<p class="mu">No data for this choice.</p>'; return; }
    const lo = Math.min(...all), mx = Math.max(...all), mid = (lo + mx) / 2;
    const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t)), BAD = [255, 84, 104], MID = [35, 51, 73], GOOD = [39, 209, 127];
    const col = v => { if (v == null) return 'transparent'; let t = mx === lo ? .5 : (v - lo) / (mx - lo); if (!hi) t = 1 - t; const c = t < .5 ? mix(BAD, MID, t * 2) : mix(MID, GOOD, (t - .5) * 2); return `rgb(${c.join(',')})`; };
    const R = rows.slice(); if (o.sort !== false) R.sort((a, b) => { const f = r => { const x = r.vals.filter(v => v != null); return x.length ? x.reduce((p, q) => p + q, 0) / x.length : -1e9; }; return hi ? f(b) - f(a) : f(a) - f(b); });
    box.classList.add('vheat');
    box.innerHTML = `<div class="vhs"><table><tr><th></th>${cols.map(c => `<th>${esc(c)}</th>`).join('')}<th>Avg</th></tr>${R.map(r => { const x = r.vals.filter(v => v != null), avg = x.length ? x.reduce((p, q) => p + q, 0) / x.length : null; return `<tr data-id="${esc(r.id)}"><td class="vhl">${r.logo || ''}<b>${esc(r.label)}</b></td>${r.vals.map((v, i) => `<td style="background:${col(v)}" title="${esc(r.label)} · ${esc(cols[i])}: ${v == null ? '–' : esc(fm(v))}">${v == null ? '' : esc(fm(v))}</td>`).join('')}<td class="vha">${avg == null ? '' : esc(fm(avg))}</td></tr>`; }).join('')}</table></div><p class="mu vhk"><span>${hi ? 'weak' : 'strong'}</span><i></i><span>${hi ? 'strong' : 'weak'}</span> · colours compare all cells of the table; rows ordered by average</p>`;
    box.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => tr.classList.toggle('sel'));
  }
  /* ---------- histogram: items = [{ id, label, value }], hl = Set of ids to mark ---------- */
  function hist(box, items, o) { box.style.height = ''; box.classList.remove('vz'); /* CL-1: a scatter leaves its fixed height on the box; other charts must not inherit it */
    o = o || {}; const L = items.filter(x => x.value != null && isFinite(x.value));
    if (L.length < 3) { box.innerHTML = '<p class="mu">Not enough data for a distribution.</p>'; return; }
    const W = Math.max(280, box.clientWidth || 600), H = Math.round(W < 520 ? 260 : 320), m = { l: 40, r: 12, t: 22, b: 34 }, vs = L.map(x => x.value).sort((a, b) => a - b);
    const nb = o.bins || Math.max(6, Math.min(16, Math.round(Math.sqrt(L.length) * 1.4))), ext = nice(vs[0], vs[vs.length - 1], nb), step = (ext.b - ext.a) / nb, bins = Array.from({ length: nb }, (_, i) => ({ a: ext.a + i * step, b: ext.a + (i + 1) * step, n: 0, items: [] }));
    L.forEach(x => { const k = Math.min(nb - 1, Math.max(0, Math.floor((x.value - ext.a) / step))); bins[k].n++; bins[k].items.push(x); });
    const my = Math.max(...bins.map(b => b.n)), sx = v => m.l + (v - ext.a) / (ext.b - ext.a) * (W - m.l - m.r), sy = n => H - m.b - n / my * (H - m.t - m.b), f = o.fmt || (v => v.toFixed(ext.dec)), hl = o.hl || new Set();
    const mean = vs.reduce((a, b) => a + b, 0) / vs.length, med = vs.length % 2 ? vs[vs.length >> 1] : (vs[vs.length / 2 - 1] + vs[vs.length / 2]) / 2;
    let s = ''; for (let k = 0; k <= 4; k++) { const n = Math.round(my * k / 4); s += `<line x1="${m.l}" x2="${W - m.r}" y1="${sy(n)}" y2="${sy(n)}" stroke="#1e2b40"/><text x="${m.l - 6}" y="${sy(n) + 4}" fill="#8ea0b8" font-size="11" text-anchor="end">${n}</text>`; }
    s += bins.map(b => { const has = b.items.some(x => hl.has(x.id)); return `<rect x="${(sx(b.a) + 1).toFixed(1)}" y="${sy(b.n).toFixed(1)}" width="${Math.max(1, sx(b.b) - sx(b.a) - 2).toFixed(1)}" height="${(H - m.b - sy(b.n)).toFixed(1)}" rx="3" fill="${has ? 'var(--c2)' : 'var(--c1)'}" opacity="${has ? 1 : .8}"><title>${esc(f(b.a))} to ${esc(f(b.b))}: ${b.n}${b.n && b.n <= 6 ? ' · ' + esc(b.items.map(x => x.label).join(', ')) : ''}</title></rect>`; }).join('');
    for (let k = 0; k <= nb; k += Math.ceil(nb / 8)) { const v = ext.a + k * step; s += `<text x="${sx(v).toFixed(1)}" y="${H - 16}" fill="#8ea0b8" font-size="11" text-anchor="middle">${esc(f(v))}</text>`; }
    s += `<line x1="${sx(mean)}" x2="${sx(mean)}" y1="${m.t - 8}" y2="${H - m.b}" stroke="#fff" stroke-dasharray="5 4" opacity=".7"/><text x="${sx(mean)}" y="${m.t - 11}" fill="#c9d4e4" font-size="10" text-anchor="middle">average ${esc(f(mean))}</text>`;
    L.filter(x => hl.has(x.id)).forEach((x, i) => { s += `<path d="M${sx(x.value)},${H - m.b} l-6,10 h12 z" fill="var(--c2)"/><text x="${sx(x.value)}" y="${H - m.b + 22 + (i % 2) * 0}" fill="var(--c2)" font-size="11" font-weight="700" text-anchor="middle">${esc(x.short || x.label)}</text>`; });
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto" role="img" aria-label="${esc(o.title || 'Distribution')}">${s}</svg><p class="mu">${L.length} values · median ${esc(f(med))} · lowest ${esc(f(vs[0]))} · highest ${esc(f(vs[vs.length - 1]))}</p>`;
    return { mean, median: med, n: L.length };
  }
  /* ---------- radar: axes = [label], series = [{ id, label, color, values: [0-100], raw: [text] }] ---------- */
  function radar(box, axes, series, o) { box.style.height = ''; box.classList.remove('vz'); /* CL-1: a scatter leaves its fixed height on the box; other charts must not inherit it */
    o = o || {}; const W = 360, H = 330, cx = 180, cy = 165, r = 112, n = axes.length, pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n, k = Math.max(0, Math.min(100, v)) / 100; return [cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]; };
    const ring = v => axes.map((_, i) => pt(i, v).map(x => x.toFixed(1)).join(',')).join(' ');
    let s = [25, 50, 75, 100].map(v => `<polygon points="${ring(v)}" fill="none" stroke="#223049"/>`).join('') + `<text x="${cx + 3}" y="${cy - r * .5 + 3}" fill="#566680" font-size="9">50</text>`;
    s += axes.map((a, i) => { const [x, y] = pt(i, 100), [lx, ly] = pt(i, 118); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#223049"/><text x="${lx.toFixed(1)}" y="${(ly + 3).toFixed(1)}" fill="#8ea0b8" font-size="10" text-anchor="${lx < cx - 8 ? 'end' : lx > cx + 8 ? 'start' : 'middle'}">${esc(a)}</text>`; }).join('');
    s += series.map(se => { const c = hex(se.color, '#ffb81c'); return `<polygon points="${se.values.map((v, i) => pt(i, v == null ? 0 : v).map(x => x.toFixed(1)).join(',')).join(' ')}" fill="${c}" fill-opacity=".2" stroke="${c}" stroke-width="2.5"/>` + se.values.map((v, i) => { const [x, y] = pt(i, v == null ? 0 : v); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${c}"><title>${esc(se.label)} · ${esc(axes[i])}: ${esc(se.raw ? se.raw[i] : v)}${v == null ? '' : ' (' + Math.round(v) + 'th percentile)'}</title></circle>`; }).join(''); }).join('');
    box.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="max-width:440px;margin:auto;display:block" role="img" aria-label="${esc(o.title || 'Profile')}">${s}</svg><div class="vrl2">${series.map(se => `<span><i style="background:${hex(se.color, '#ffb81c')}"></i>${esc(se.label)}</span>`).join('')}</div>`;
  }
  /* ---------- exports ---------- */
  function savePng(svgStr, name) {
    return new Promise((ok, no) => { const w = +(/width="(\d+)"/.exec(svgStr) || [0, 1200])[1], h = +(/height="(\d+)"/.exec(svgStr) || [0, 800])[1], img = new Image(); img.onload = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d').drawImage(img, 0, 0, w, h); const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = name || 'chart.png'; a.click(); ok(); }; img.onerror = () => no(new Error('The browser could not draw the image')); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr); });
  }
  function csv(name, head, rows) {
    const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"', a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + [head].concat(rows).map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  return { scatter, bars, lines, race, heat, hist, radar, card, nice, ord, esc, hex, savePng, csv };
})();
