/* Streaming scanner for one huge JSON object. Emits arrays element by element, other top-level values whole. */
(function (root) {
  function Scanner(h) {
    let depth = 0, inStr = false, esc = false, isKey = false, keyBuf = '', key = null, expectKey = false;
    let inArr = false, cap = false, capDepth = 0, capStr = false, capScalar = false, parts = [], from = 0, kind = 0;
    function begin(i, d, str, scalar, k) { cap = true; capDepth = d; capStr = str; capScalar = scalar; kind = k; from = i; parts = []; }
    function end(s, i) {
      parts.push(s.slice(from, i)); cap = false;
      const t = parts.join(''); parts = [];
      kind === 2 ? h.item(key, t) : h.value(key, t);
    }
    this.push = function (s) {
      from = 0;
      for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        if (inStr) {
          if (isKey) { if (esc) { keyBuf += s[i]; esc = false; } else if (c === 92) esc = true; else if (c === 34) { inStr = false; isKey = false; key = keyBuf; } else keyBuf += s[i]; continue; }
          if (esc) esc = false; else if (c === 92) esc = true;
          else if (c === 34) { inStr = false; if (cap && capStr && depth === capDepth) end(s, i + 1); }
          continue;
        }
        if (c === 32 || c === 10 || c === 13 || c === 9) { if (cap && capScalar) end(s, i); continue; }
        const atVal = !cap && ((depth === 1 && !expectKey) || (depth === 2 && inArr));
        switch (c) {
          case 34:
            if (depth === 1 && expectKey) { inStr = true; isKey = true; keyBuf = ''; }
            else { if (atVal) begin(i, depth, true, false, depth === 1 ? 1 : 2); inStr = true; }
            break;
          case 123: case 91:
            if (depth === 0) { depth = 1; expectKey = true; break; }
            if (atVal && depth === 1 && c === 91) { inArr = true; depth = 2; h.arrayStart(key); break; }
            if (atVal) begin(i, depth, false, false, depth === 1 ? 1 : 2);
            depth++; break;
          case 125: case 93:
            if (cap && capScalar) end(s, i);
            depth--;
            if (cap && !capStr && !capScalar && depth === capDepth) end(s, i + 1);
            else if (!cap && inArr && depth === 1) { inArr = false; h.arrayEnd(key); }
            break;
          case 44:
            if (cap && capScalar) end(s, i);
            if (depth === 1) expectKey = true; break;
          case 58: if (depth === 1) expectKey = false; break;
          default:
            if (atVal) begin(i, depth, false, true, depth === 1 ? 1 : 2);
        }
      }
      if (cap) parts.push(s.slice(from));
    };
  }
  const api = { Scanner };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMScanner = api;
})(typeof self !== 'undefined' ? self : this);
