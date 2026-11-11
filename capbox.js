/* Pure: contract and cap sandbox (FR-SIM-4). Never writes anything; the page keeps the moves in memory only.
   Rules read from the league settings: hard cap, minimum payroll, roster limits, minimum contract. Assumptions, to verify against the game:
   (1) a player released keeps counting against the cap (dead money) when deadMoney is true; (2) in a hard-cap league a signing may not take payroll above the cap, except a contract at the league minimum.
   Amounts are in thousands, as stored. */
(function (root) {
  function evaluate(roster, released, signed, lim, deadMoney) {
    const rel = new Set(released || []), keep = roster.filter(p => !rel.has(p.pid)), amt = p => +(p.contract && p.contract.amount) || 0;
    const dead = deadMoney ? roster.filter(p => rel.has(p.pid)).reduce((a, p) => a + amt(p), 0) : 0;
    const payroll = keep.reduce((a, p) => a + amt(p), 0) + (signed || []).reduce((a, p) => a + amt(p), 0) + dead, n = keep.length + (signed || []).length, issues = [];
    if (n < lim.minRoster) issues.push('Roster has ' + n + ' players; the league needs at least ' + lim.minRoster + '.');
    if (n > lim.maxRoster) issues.push('Roster has ' + n + ' players; the league allows at most ' + lim.maxRoster + '.');
    if (payroll > lim.cap) issues.push('Payroll is over the hard cap by ' + (payroll - lim.cap).toLocaleString('en-US') + '.');
    if (lim.min && payroll < lim.min) issues.push('Payroll is under the minimum payroll by ' + (lim.min - payroll).toLocaleString('en-US') + ' (the game charges the difference).');
    const byPos = {}; for (const p of keep.concat(signed || [])) { const k = p.pos || '?'; byPos[k] = (byPos[k] || 0) + 1; }
    return { payroll, space: lim.cap - payroll, n, dead, issues, byPos, ok: !issues.length };
  }
  /* can this free agent be signed on top of the current state? */
  function canSign(state, p, lim) {
    const a = +(p.contract && p.contract.amount) || 0;
    if (state.n >= lim.maxRoster) return { ok: false, why: 'Roster is full (' + lim.maxRoster + ').' };
    if (state.payroll + a > lim.cap && a > (lim.minContract || 0)) return { ok: false, why: 'Over the hard cap by ' + (state.payroll + a - lim.cap).toLocaleString('en-US') + '.' };
    return { ok: true, why: '' };
  }
  const api = { evaluate, canSign };
  if (typeof module !== 'undefined') module.exports = api; else root.FBGMCapBox = api;
})(typeof self !== 'undefined' ? self : this);
