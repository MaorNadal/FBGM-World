/* Share a drawing as an image (FR-PLC-5): an SVG string becomes a PNG through a canvas, then goes to the phone's share sheet (messaging apps) or downloads as a file.
   If the browser refuses the canvas (a drawing that points at another site's image), the SVG file is saved instead. */
window.Share = (function () {
  const size = svg => { const m = /viewBox="[-\d.]+ [-\d.]+ ([\d.]+) ([\d.]+)"/.exec(svg); return m ? [+m[1], +m[2]] : [400, 560]; };
  const withNs = svg => /xmlns=/.test(svg.slice(0, 200)) ? svg : svg.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  async function png(svg, scale) {
    const [w, h] = size(svg), k = scale || 3, url = URL.createObjectURL(new Blob([withNs(svg)], { type: 'image/svg+xml' }));
    try {
      const img = new Image(); img.decoding = 'async'; await new Promise((ok, no) => { img.onload = ok; img.onerror = () => no(new Error('The drawing could not be rendered')); img.src = url; });
      const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      return await new Promise((ok, no) => c.toBlob(b => b ? ok(b) : no(new Error('empty image')), 'image/png'));
    } finally { URL.revokeObjectURL(url); }
  }
  function save(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); }
  /* returns 'shared', 'saved' or 'svg' */
  async function image(svg, name, title) {
    let blob; try { blob = await png(svg); } catch (e) { save(new Blob([withNs(svg)], { type: 'image/svg+xml' }), name + '.svg'); return 'svg'; }
    const file = new File([blob], name + '.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: title || name }); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'shared'; } }
    save(blob, name + '.png'); return 'saved';
  }
  /* a table as a drawing: spec {title, sub, cols:[{h, w, right}], rows:[[text...]], hl: row index to highlight}. Text only (no logos), so the canvas is never blocked. */
  const X = t => String(t == null ? '' : t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function table(sp) {
    const cols = sp.cols, W = 40 * 2 + cols.reduce((a, c) => a + c.w, 0), RH = 34, top = 130, H = top + 40 + sp.rows.length * RH + 40; let x = 40; const xs = cols.map(c => { const v = x; x += c.w; return v; });
    const head = cols.map((c, i) => `<text x="${c.right ? xs[i] + c.w - 8 : xs[i] + 8}" y="${top + 24}" fill="#9db6cc" font-size="14" font-weight="700" text-anchor="${c.right ? 'end' : 'start'}">${X(c.h)}</text>`).join('');
    const body = sp.rows.map((r, j) => `${j === sp.hl ? `<rect x="40" y="${top + 40 + j * RH}" width="${W - 80}" height="${RH}" fill="#f2b63233"/>` : j % 2 ? `<rect x="40" y="${top + 40 + j * RH}" width="${W - 80}" height="${RH}" fill="#ffffff0a"/>` : ''}` + r.map((v, i) => `<text x="${cols[i].right ? xs[i] + cols[i].w - 8 : xs[i] + 8}" y="${top + 40 + j * RH + 23}" fill="#fff" font-size="16" text-anchor="${cols[i].right ? 'end' : 'start'}">${X(v)}</text>`).join('')).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Segoe UI,Arial,sans-serif"><rect width="${W}" height="${H}" fill="#0e1f2e"/><rect width="${W}" height="8" fill="#f2b632"/><text x="40" y="62" fill="#fff" font-size="32" font-weight="800">${X(sp.title)}</text><text x="40" y="92" fill="#9db6cc" font-size="16">${X(sp.sub || 'FBGM Hub')}</text><line x1="40" x2="${W - 40}" y1="${top + 36}" y2="${top + 36}" stroke="#2b5275"/>${head}${body}</svg>`;
  }
  const tableImage = (sp, name) => image(table(sp), name, sp.title);
  /* any HTML table on the page as a picture: header and cell text only (logos and faces are dropped). max rows = 40 */
  function fromDom(t, o) {
    o = o || {}; const rows = [...t.querySelectorAll('tr')].map(r => [...r.children].map(c => (c.innerText || c.textContent || '').replace(/\s+/g, ' ').trim())).filter(r => r.some(Boolean));
    if (rows.length < 2) throw new Error('The table is empty'); const head = rows[0], body = rows.slice(1, 1 + (o.max || 40));
    const cols = head.map((h, i) => { const L = Math.max(h.length, ...body.map(r => String(r[i] || '').length)); const num = body.every(r => /^[-+–\d.,%\s:·/]*$/.test(String(r[i] || ''))); return { h, w: Math.min(260, Math.max(48, L * 9.5 + 20)), right: num }; });
    return table({ title: o.title || document.title.replace(/ · FBGM Hub$/, ''), sub: o.sub || 'FBGM Hub', cols, rows: body.map(r => head.map((_, i) => r[i] || '')) });
  }
  /* a "Share table as image" button after every table inside root that has at least 3 rows */
  function addButtons(root, title) {
    root.querySelectorAll('table:not([data-noshare])').forEach(t => {
      if (t.rows.length < 3 || (t.nextElementSibling && t.nextElementSibling.classList && t.nextElementSibling.classList.contains('shb'))) return;
      const p = document.createElement('p'); p.className = 'shb'; p.style.margin = '6px 0 14px'; p.innerHTML = '<button class="btn ghost" style="min-height:34px;padding:0 12px">Share table as image</button> <span class="mu"></span>';
      t.after(p); p.querySelector('button').onclick = async () => { const m = p.querySelector('span'); m.textContent = 'Drawing…'; try { const h = t.closest('.card') && t.closest('.card').querySelector('h2'), ti = (typeof title === 'function' ? title(t) : title) || (h ? h.textContent : '') || document.title; const r = await image(fromDom(t, { title: ti }), 'fbgm-table', ti); m.textContent = r === 'shared' ? 'Shared.' : r === 'saved' ? 'Saved as a PNG file.' : 'Saved as an SVG file.'; } catch (e) { m.textContent = 'Could not make the image: ' + e.message; } };
    });
  }
  return { png, image, size, table, tableImage, fromDom, addButtons };
})();
