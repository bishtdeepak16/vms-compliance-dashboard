/* VMS Compliance Dashboard - DEMO backend
 * Everything here is SYNTHETIC. It replaces the real Apps Script + BigQuery layer so the
 * dashboard can run as a static page. Same actions and response shapes as the real backend.
 */
(function () {
  const G = typeof window !== 'undefined' ? window : globalThis;
  const API_PREFIX = 'demo://api';

  // ---------- deterministic random ----------
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  const rnd = mulberry32(20260101);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // ---------- dimensions (anonymised) ----------
  const FCS = ['FC-01', 'FC-02', 'FC-03', 'FC-04', 'FC-05', 'FC-06', 'FC-07'];
  const FCW = [1.5, 1.3, 1.1, 1.0, 0.9, 0.7, 0.5];
  const CLIENTS = [
    { n: 'Brand A', ch: 'FLIPKART', w: 1.6 }, { n: 'Brand B', ch: 'FLIPKART', w: 1.2 },
    { n: 'Brand C', ch: 'AMAZON', w: 1.5 }, { n: 'Brand D', ch: 'AMAZON', w: 1.0 },
    { n: 'Brand E', ch: 'MYNTRA', w: 0.9 }, { n: 'Brand F', ch: 'D2C', w: 0.8 },
    { n: 'Brand G', ch: 'AMAZON', w: 0.7 }, { n: 'Brand H', ch: 'D2C', w: 0.6 },
    { n: 'Brand I', ch: 'MYNTRA', w: 0.5 }, { n: 'Brand J', ch: 'D2C', w: 0.4 }, { n: 'Brand K', ch: 'AMAZON', w: 0.3 }
  ];
  const FLIPKART_NAMES = CLIENTS.filter(c => c.ch === 'FLIPKART').map(c => c.n.toUpperCase());
  const platOf = ch => ch === 'FLIPKART' ? 'FKVMS' : 'SMOOTHOPS';

  // which FC serves which client
  const PAIRS = [];
  CLIENTS.forEach((c, i) => {
    const k = 3 + (i % 3);
    for (let j = 0; j < k; j++) {
      const f = (i + j * 2) % FCS.length;
      if (!PAIRS.some(p => p.f === f && p.c === i)) PAIRS.push({ f, c: i, fe: (rnd() - 0.5) * 0.16, ce: (rnd() - 0.5) * 0.12 });
    }
  });
  const FC_EFFECT = [0.03, -0.02, 0.05, -0.06, 0.01, -0.09, 0.02];
  const MONTH_VOL = [1.0, 1.35, 2.4, 3.1, 2.5, 2.3, 2.1, 2.6, 3.2, 3.6, 3.4, 3.3];
  const MONTH_CMP = [0.76, 0.73, 0.72, 0.74, 0.79, 0.72, 0.60, 0.62, 0.66, 0.74, 0.75, 0.76];
  const DOW_VOL = [1.0, 1.05, 1.05, 1.0, 1.0, 0.9, 0.55];      // Mon..Sun

  // ---------- date helpers ----------
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const NOW = new Date();
  const TODAY = iso(NOW);
  const YEAR = NOW.getFullYear();
  const END = new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 1);

  // ---------- generate fact tables ----------
  const OB = [], RET = [];
  const wsum = PAIRS.reduce((a, p) => a + FCW[p.f] * CLIENTS[p.c].w, 0);
  for (let d = new Date(YEAR, 0, 1); d <= END; d.setDate(d.getDate() + 1)) {
    const ds = iso(d), m = d.getMonth(), dow = (d.getDay() + 6) % 7;
    const dayTotal = 1000 * MONTH_VOL[m] * DOW_VOL[dow];
    PAIRS.forEach(p => {
      const share = FCW[p.f] * CLIENTS[p.c].w / wsum;
      const t = Math.max(0, Math.round(dayTotal * share * (0.85 + rnd() * 0.3)));
      if (!t) return;
      const c = clamp(MONTH_CMP[m] + FC_EFFECT[p.f] + p.fe + p.ce + (rnd() - 0.5) * 0.08, 0.2, 0.99);
      OB.push({ d: ds, fc: FCS[p.f], cl: CLIENTS[p.c].n, ch: CLIENTS[p.c].ch, t, s: Math.round(t * c) });
      const rt = Math.round(t * (0.10 + rnd() * 0.04));
      if (rt) {
        const rc = clamp(c - 0.05 + (rnd() - 0.5) * 0.08, 0.2, 0.99);
        RET.push({ d: ds, fc: FCS[p.f], cl: CLIENTS[p.c].n, ch: CLIENTS[p.c].ch, t: rt, s: Math.round(rt * rc) });
      }
    });
  }

  // ---------- filtering / aggregation ----------
  function filt(rows, c) {
    return rows.filter(r =>
      r.d >= c.from && r.d <= c.to &&
      (!c.clients.length || c.clients.includes(r.cl)) &&
      (!c.locs.length || c.locs.includes(r.fc)) &&
      (!c.channels.length || c.channels.includes(r.ch)) &&
      (!c.platform.length || c.platform.includes(platOf(r.ch)) || (c.platform.includes('FLIPKART') && r.ch === 'FLIPKART')));
  }
  const pct2 = (s, t) => t > 0 ? Math.round(s / t * 10000) / 100 : null;
  function group(rows, keyFn, keyNames) {
    const m = new Map();
    rows.forEach(r => {
      const k = keyFn(r);
      let o = m.get(k);
      if (!o) { o = { keys: keyNames(r), t: 0, s: 0 }; m.set(k, o); }
      o.t += r.t; o.s += r.s;
    });
    return [...m.values()];
  }
  const split = v => v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : [];

  function shape(kind, rows, keysSpec, sortFn) {
    const tcol = kind === 'ob' ? 'total_shipments' : 'total_returns';
    const out = group(rows, r => keysSpec.map(k => r[k.src]).join('|'), r => keysSpec.map(k => r[k.src]))
      .map(o => {
        const row = {};
        keysSpec.forEach((k, i) => row[k.out] = o.keys[i]);
        row[tcol] = o.t; row.vms_scanned = o.s; row.compliance_pct = pct2(o.s, o.t);
        return row;
      });
    return out.sort(sortFn || ((a, b) => String(a[keysSpec[0].out]).localeCompare(String(b[keysSpec[0].out])) || String(a[keysSpec[1] ? keysSpec[1].out : keysSpec[0].out]).localeCompare(String(b[keysSpec[1] ? keysSpec[1].out : keysSpec[0].out]))));
  }

  // ---------- ISO week + comparison windows (ported from the real Apps Script) ----------
  function isoWeek(ms) {
    const DAY = 86400000, d = new Date(ms), day = (d.getUTCDay() + 6) % 7;
    const th = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3), y = new Date(th).getUTCFullYear();
    const j4 = Date.UTC(y, 0, 4), j1m = j4 - ((new Date(j4).getUTCDay() + 6) % 7) * DAY;
    return Math.round((th - j1m) / (7 * DAY)) + 1;
  }
  function cmpDates(mode, anchor) {
    const parts = (anchor || TODAY).split('-').map(Number);
    const T = Date.UTC(parts[0], parts[1] - 1, parts[2]), DAY = 86400000;
    const isoS = ms => new Date(ms).toISOString().slice(0, 10);
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const lab = ms => { const d = new Date(ms); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; };
    if (mode === 'mom') {
      const y = parts[0], m = parts[1] - 1, d = parts[2];
      const per = k => {
        const mm = m - k, yy = mm < 0 ? y - 1 : y, mo = (mm + 12) % 12, len = new Date(Date.UTC(yy, mo + 1, 0)).getUTCDate();
        const s0 = Date.UTC(yy, mo, 1), e0 = k === 0 ? T : Date.UTC(yy, mo, Math.min(d, len));
        return { s: isoS(s0), e: isoS(e0), label: MON[mo] + ' MTD', range: lab(s0) + ' – ' + lab(e0) };
      };
      const c = per(0), p = per(1), q = per(2);
      return { mode, cs: c.s, ce: c.e, ps: p.s, pe: p.e, qs: q.s, qe: q.e, curLabel: c.label, prevLabel: p.label, prev2Label: q.label, curRange: c.range, prevRange: p.range, prev2Range: q.range };
    }
    const dow = (new Date(T).getUTCDay() + 6) % 7, thisMon = T - dow * DAY;
    const per = k => { const s0 = thisMon - 7 * (k + 1) * DAY, e0 = s0 + 6 * DAY; return { s: isoS(s0), e: isoS(e0), label: 'Week-' + isoWeek(s0), range: lab(s0) + ' – ' + lab(e0) }; };
    const c = per(0), p = per(1), q = per(2);
    return { mode: 'wow', cs: c.s, ce: c.e, ps: p.s, pe: p.e, qs: q.s, qe: q.e, curLabel: c.label, prevLabel: p.label, prev2Label: q.label, curRange: c.range, prevRange: p.range, prev2Range: q.range };
  }
  function cmpData(kind, ctx, mode) {
    const W = cmpDates(mode === 'mom' ? 'mom' : 'wow', TODAY);
    const rows = filt(kind === 'ob' ? OB : RET, Object.assign({}, ctx, { from: W.qs, to: W.ce }));
    const m = new Map();
    rows.forEach(r => {
      const k = r.fc + '|' + r.cl;
      let o = m.get(k) || { fc: r.fc, client: r.cl, ct: 0, cs: 0, pt: 0, ps: 0, qt: 0, qs: 0 };
      if (r.d >= W.cs && r.d <= W.ce) { o.ct += r.t; o.cs += r.s; }
      if (r.d >= W.ps && r.d <= W.pe) { o.pt += r.t; o.ps += r.s; }
      if (r.d >= W.qs && r.d <= W.qe) { o.qt += r.t; o.qs += r.s; }
      m.set(k, o);
    });
    return { meta: W, rows: [...m.values()].filter(o => o.ct || o.pt || o.qt).sort((a, b) => a.fc.localeCompare(b.fc) || a.client.localeCompare(b.client)) };
  }

  // ---------- sample weekly email report ----------
  const lvl = p => p == null ? { n: '—', bg: '#eef0f3', c: '#586174' } : p >= 90 ? { n: 'Excellent', bg: '#dcfce7', c: '#166534' } : p >= 85 ? { n: 'Good', bg: '#e0f2fe', c: '#075985' } : p >= 70 ? { n: 'Bad', bg: '#fef3c7', c: '#92400e' } : { n: 'Severe', bg: '#fee2e2', c: '#991b1b' };
  const F = 'font-family:Arial,Helvetica,sans-serif;';
  const fmtN = n => Number(n).toLocaleString('en-IN');
  const pt = p => p == null ? '—' : p.toFixed(1) + '%';
  const badge = p => { const l = lvl(p); return `<span style="display:inline-block;padding:2px 9px;border-radius:99px;background:${l.bg};color:${l.c};${F}font-size:10.5px;font-weight:700">${l.n}</span>`; };
  const delta = (c, p) => { if (c == null || p == null) return '<span style="color:#94a3b8">—</span>'; const d = c - p, up = d >= 0; return `<span style="color:${up ? '#15803d' : '#b91c1c'};font-weight:700">${up ? '▲' : '▼'} ${Math.abs(d).toFixed(1)}</span>`; };
  const bar = (p, color) => `<div style="background:#eef0f3;border-radius:4px;height:10px;width:100%"><div style="background:${color};height:10px;border-radius:4px;width:${Math.max(2, Math.min(100, Math.round(p || 0)))}%"></div></div>`;

  function buildReportHtml(scope) {
    const W = cmpDates('wow', TODAY);
    const inScope = r => scope === 'ALL' || r.fc === scope;
    const win = (rows, s, e) => rows.filter(r => inScope(r) && r.d >= s && r.d <= e);
    const sum = rows => rows.reduce((a, r) => (a.t += r.t, a.s += r.s, a), { t: 0, s: 0 });
    const wk = [[W.cs, W.ce], [W.ps, W.pe], [W.qs, W.qe]];
    const ob = wk.map(([s, e]) => sum(win(OB, s, e))), rt = wk.map(([s, e]) => sum(win(RET, s, e)));
    const P = x => x.t ? x.s / x.t * 100 : null;
    const fcs = scope === 'ALL' ? FCS : [scope];

    // FC scorecard
    const fcRow = f => {
      const o = wk.map(([s, e]) => sum(OB.filter(r => r.fc === f && r.d >= s && r.d <= e)));
      const r = wk.map(([s, e]) => sum(RET.filter(x => x.fc === f && x.d >= s && x.d <= e)));
      return { f, o, r };
    };
    const rows = fcs.map(fcRow).filter(x => x.o[0].t || x.r[0].t);
    const weakest = rows.filter(x => P(x.o[0]) != null).sort((a, b) => P(a.o[0]) - P(b.o[0]));
    const best = weakest.slice().reverse()[0];

    // attention list: FC-client pairs under 85% (outbound), most unscanned first
    const pairs = new Map();
    OB.filter(r => inScope(r) && r.d >= W.cs && r.d <= W.ce).forEach(r => { const k = r.fc + '|' + r.cl; const o = pairs.get(k) || { fc: r.fc, cl: r.cl, t: 0, s: 0 }; o.t += r.t; o.s += r.s; pairs.set(k, o); });
    const attn = [...pairs.values()].filter(o => o.t >= 50 && o.s / o.t * 100 < 85).sort((a, b) => (b.t - b.s) - (a.t - a.s)).slice(0, 8);

    // headline (rule-based text in this demo)
    const w0 = weakest[0];
    const headline = w0 ? `${w0.f} needs attention: ${pt(P(w0.o[0]))} outbound compliance in ${W.curLabel}` : `Compliance steady in ${W.curLabel}`;
    const summary = w0
      ? `Overall outbound compliance was ${pt(P(ob[0]))} (${delta(P(ob[0]), P(ob[1])).replace(/<[^>]+>/g, '')} pts vs ${W.prevLabel}). ${w0.f} is the weakest FC with ${fmtN(w0.o[0].t - w0.o[0].s)} unscanned shipments` + (attn.find(o => o.fc === w0.f) ? `, led by ${attn.find(o => o.fc === w0.f).cl}.` : '.') + (best ? ` ${best.f} is the strongest at ${pt(P(best.o[0]))}.` : '')
      : 'No data for this period.';

    const kpi = (title, color, a) => `<td width="50%" style="padding:6px"><div style="border:1px solid #e2e8f0;border-top:4px solid ${color};border-radius:8px;padding:14px;${F}"><div style="font-size:11px;letter-spacing:.8px;color:#64748b;font-weight:700">${title}</div><div style="font-size:30px;font-weight:800;color:#0f172a;margin:4px 0">${pt(P(a[0]))}</div><div style="font-size:12px;color:#475569">${fmtN(a[0].s)} of ${fmtN(a[0].t)} scanned &nbsp; ${delta(P(a[0]), P(a[1]))} pts vs ${W.prevLabel}</div></div></td>`;

    const th = t => `<th style="${F}text-align:left;padding:8px 10px;font-size:11px;color:#64748b;border-bottom:2px solid #e2e8f0;letter-spacing:.5px">${t}</th>`;
    const td = (t, x) => `<td style="${F}padding:8px 10px;font-size:12.5px;color:#0f172a;border-bottom:1px solid #eef0f3;${x || ''}">${t}</td>`;

    const scorecard = `<table width="100%" cellspacing="0" cellpadding="0"><tr>${th('FC')}${th('OUTBOUND ' + W.curLabel.toUpperCase())}${th('VS PREV')}${th('RATING')}${th('RETURNS')}${th('VS PREV')}</tr>` +
      rows.map(x => `<tr>${td('<b>' + x.f + '</b>')}${td(pt(P(x.o[0])))}${td(delta(P(x.o[0]), P(x.o[1])))}${td(badge(P(x.o[0])))}${td(pt(P(x.r[0])))}${td(delta(P(x.r[0]), P(x.r[1])))}</tr>`).join('') + '</table>';

    const attnHtml = attn.length ? `<table width="100%" cellspacing="0" cellpadding="0"><tr>${th('FC')}${th('CLIENT')}${th('COMPLIANCE')}${th('UNSCANNED')}</tr>` +
      attn.map(o => `<tr>${td('<b>' + o.fc + '</b>')}${td(o.cl)}${td(pt(o.s / o.t * 100) + ' ' + badge(o.s / o.t * 100))}${td('<b>' + fmtN(o.t - o.s) + '</b>')}</tr>`).join('') + '</table>' : '<div style="' + F + 'font-size:13px;color:#166534">No FC–client pair is below 85% this week.</div>';

    // 3-week bars (outbound | returns)
    const half = (name, color, a) => `<td width="50%" style="padding:6px;vertical-align:top"><div style="${F}font-size:11px;font-weight:700;color:#64748b;margin-bottom:6px">${name}</div>` +
      [2, 1, 0].map(i => `<div style="${F}font-size:11.5px;color:#334155;margin:5px 0">${[W.prev2Label, W.prevLabel, W.curLabel][2 - i]} · <b>${pt(P(a[i]))}</b>${bar(P(a[i]), color)}</div>`).join('') + '</td>';

    // FC -> client W-O-W (outbound)
    const wowRows = [];
    fcs.forEach(f => {
      const per = new Map();
      OB.filter(r => r.fc === f && r.d >= W.qs && r.d <= W.ce).forEach(r => {
        const o = per.get(r.cl) || { c: [0, 0], p: [0, 0], q: [0, 0] };
        const tgt = r.d >= W.cs ? o.c : r.d >= W.ps ? o.p : o.q; tgt[0] += r.t; tgt[1] += r.s; per.set(r.cl, o);
      });
      [...per.entries()].sort((a, b) => b[1].c[0] - a[1].c[0]).forEach(([cl, o], i) => wowRows.push(`<tr>${td(i ? '' : '<b>' + f + '</b>')}${td(cl)}${td(pt(o.q[0] ? o.q[1] / o.q[0] * 100 : null))}${td(pt(o.p[0] ? o.p[1] / o.p[0] * 100 : null))}${td('<b>' + pt(o.c[0] ? o.c[1] / o.c[0] * 100 : null) + '</b>')}${td(delta(o.c[0] ? o.c[1] / o.c[0] * 100 : null, o.p[0] ? o.p[1] / o.p[0] * 100 : null))}</tr>`));
    });
    const wow = `<table width="100%" cellspacing="0" cellpadding="0"><tr>${th('FC')}${th('CLIENT')}${th(W.prev2Label.toUpperCase())}${th(W.prevLabel.toUpperCase())}${th(W.curLabel.toUpperCase())}${th('Δ WoW')}</tr>${wowRows.join('')}</table>`;

    const sec = (t, inner) => `<div style="margin:18px 0 6px;${F}font-size:13px;font-weight:800;color:#0f172a;border-left:4px solid #f97316;padding-left:8px">${t}</div>${inner}`;

    const subject = (scope === 'ALL' ? 'Admin View - All FC' : 'FC View (' + scope + ')') + ' | VMS Compliance Report — WEEK ' + W.curLabel.replace('Week-', '');
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;background:#f1f5f9"><div style="max-width:760px;margin:0 auto;background:#fff">
<div style="background:linear-gradient(90deg,#0f172a,#1e3a8a);padding:22px 24px;${F}color:#fff"><div style="font-size:11px;letter-spacing:1.4px;opacity:.8">VMS COMPLIANCE · WEEKLY REPORT</div><div style="font-size:22px;font-weight:800;margin-top:4px">${scope === 'ALL' ? 'All FCs' : scope} · ${W.curLabel}</div><div style="font-size:12px;opacity:.85;margin-top:4px">${W.curRange} &nbsp;|&nbsp; vs ${W.prevLabel} (${W.prevRange}) &nbsp;|&nbsp; Demo data</div></div>
<div style="padding:18px 24px">
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px;${F}"><div style="font-size:10.5px;letter-spacing:1px;color:#c2410c;font-weight:700">✦ AI INSIGHT</div><div style="font-size:16px;font-weight:800;color:#0f172a;margin:4px 0">${headline}</div><div style="font-size:13px;line-height:1.55;color:#334155">${summary}</div></div>
<table width="100%" cellspacing="0" cellpadding="0" style="margin-top:12px"><tr>${kpi('OUTBOUND', '#f97316', ob)}${kpi('RETURNS', '#3b82f6', rt)}</tr></table>
${sec('FC scorecard', scorecard)}
${sec('Needs immediate attention (below 85%, most unscanned first)', attnHtml)}
${sec('3-week trend', `<table width="100%" cellspacing="0" cellpadding="0"><tr>${half('OUTBOUND', '#f97316', ob)}${half('RETURNS', '#3b82f6', rt)}</tr></table>`)}
${sec('Outbound · FC → client, week on week', wow)}
<div style="margin:22px 0 4px;text-align:center"><a href="#" style="display:inline-block;background:#f97316;color:#fff;${F}font-weight:700;font-size:13px;padding:10px 22px;border-radius:8px;text-decoration:none">Open dashboard</a></div>
<div style="${F}font-size:11px;color:#94a3b8;text-align:center;margin-top:14px">Sample report generated from synthetic demo data. Raw-data Excel is attached in the real system.</div>
</div></div></body></html>`;
    return { html, subject, W };
  }

  // ---------- users / settings (in-memory) ----------
  const USERS = [
    { email: 'admin@example.com', name: 'Demo Admin', role: 'admin', fcs: ['ALL'], active: true, locked: true },
    { email: 'ops.lead@example.com', name: 'Ops Lead', role: 'admin', fcs: ['ALL'], active: true, locked: false },
    { email: 'fc01.manager@example.com', name: 'FC-01 Manager', role: 'user', fcs: ['FC-01'], active: true, locked: false },
    { email: 'fc03.manager@example.com', name: 'FC-03 Manager', role: 'user', fcs: ['FC-03', 'FC-04'], active: true, locked: false }
  ];
  const SCHED = { enabled: true, hour: 9, excel: 'attach', fcUsers: true, day: 'Monday', canEdit: true };

  // ---------- request router ----------
  function route(url) {
    const q = new URLSearchParams(url.slice(url.indexOf('?') + 1));
    const a = q.get('action') || '';
    const ctx = { from: q.get('from') || (YEAR + '-01-01'), to: q.get('to') || TODAY, clients: split(q.get('clients')), locs: split(q.get('locs')), channels: split(q.get('channels')), platform: split(q.get('platform')) };
    const ok = data => ({ ok: true, data });
    switch (a) {
      case 'auth_me': return ok({ user: { email: 'admin@example.com', name: 'Demo Admin', role: 'admin', fcs: ['ALL'], all: true } });
      case 'auth_google': return ok({ token: 'demo-token', user: { email: 'admin@example.com', name: 'Demo Admin', role: 'admin', fcs: ['ALL'], all: true } });
      case 'filter_options': {
        const meta = rows => { const s = new Set(); rows.forEach(r => s.add(r.cl + '|' + r.fc + '|' + r.ch)); return [...s].map(x => x.split('|')); };
        const mo = meta(OB), mr = meta(RET);
        const side = (m, fcKey) => ({
          clients: [...new Set(m.map(r => r[0]))].sort(), [fcKey]: [...new Set(m.map(r => r[1]))].sort(),
          channels: [...new Set(m.map(r => r[2]))].sort(), platforms: [...new Set(m.map(r => platOf(r[2])))].sort(), rows: m.map(r => [r[0], r[1], r[2]])
        });
        return ok({ mappedFcs: FCS, outbound: side(mo, 'locations'), returns: side(mr, 'fcs') });
      }
      case 'ob_summary': case 'ret_summary': {
        const ob = a === 'ob_summary', r = filt(ob ? OB : RET, ctx); const t = r.reduce((x, y) => x + y.t, 0), s = r.reduce((x, y) => x + y.s, 0);
        return ok([{ [ob ? 'total_shipments' : 'total_returns']: t, vms_scanned: s, compliance_pct: pct2(s, t) }]);
      }
      case 'ob_by_client': return ok(shape('ob', filt(OB, ctx), [{ src: 'cl', out: 'client' }, { src: 'fc', out: 'location' }]));
      case 'ret_by_client': return ok(shape('ret', filt(RET, ctx), [{ src: 'cl', out: 'client' }, { src: 'fc', out: 'FC' }]));
      case 'ob_by_location': return ok(shape('ob', filt(OB, ctx), [{ src: 'fc', out: 'location' }, { src: 'cl', out: 'client' }]));
      case 'ret_by_location': return ok(shape('ret', filt(RET, ctx), [{ src: 'fc', out: 'FC' }, { src: 'cl', out: 'client' }]));
      case 'ob_trend': return ok(shape('ob', filt(OB, ctx), [{ src: 'd', out: 'date' }], (x, y) => x.date.localeCompare(y.date)));
      case 'ret_trend': return ok(shape('ret', filt(RET, ctx), [{ src: 'd', out: 'date' }], (x, y) => x.date.localeCompare(y.date)));
      case 'ob_client_chart': return ok(shape('ob', filt(OB, ctx), [{ src: 'cl', out: 'client' }], (x, y) => y.total_shipments - x.total_shipments));
      case 'ret_client_chart': return ok(shape('ret', filt(RET, ctx), [{ src: 'cl', out: 'client' }], (x, y) => y.total_returns - x.total_returns));
      case 'cmp_ob': return ok(cmpData('ob', ctx, q.get('mode')));
      case 'cmp_ret': return ok(cmpData('ret', ctx, q.get('mode')));
      case 'ob_export': case 'ret_export': {
        const ob = a === 'ob_export', rows = [], LIM = 20000;
        const types = ['PREPAID', 'COD'];
        outer: for (const r of filt(ob ? OB : RET, ctx)) {
          for (let i = 0; i < r.t; i++) {
            if (rows.length >= LIM) break outer;
            rows.push([r.cl, r.fc, r.d, (ob ? 'DMO' : 'DMR') + String(100000000 + Math.floor(rnd() * 899999999)), types[Math.floor(rnd() * 2)], i < r.s ? 'Y' : 'N', platOf(r.ch)]);
          }
        }
        return ok({ jobId: 'demo', location: '', total: rows.length, rows, pageToken: '' });
      }
      case 'export_page': return ok({ rows: [], pageToken: '' });
      case 'report_preview': {
        const scope = (q.get('scope') || 'ALL').toUpperCase() === 'ALL' ? 'ALL' : q.get('scope');
        const rep = buildReportHtml(scope);
        const recips = scope === 'ALL'
          ? USERS.filter(u => u.role === 'admin').map(u => ({ email: u.email, name: u.name, kind: 'admin', fcs: 'All FCs' }))
          : USERS.filter(u => u.role === 'user' && u.fcs.includes(scope)).map(u => ({ email: u.email, name: u.name, kind: 'fc', fcs: u.fcs.join(', ') }));
        const W = cmpDates('mom', TODAY);
        return ok({ html: rep.html, subject: rep.subject, ai: true, aiError: '', mtd: W.cs + ' to ' + W.ce, from: W.cs, to: W.ce, recipients: recips });
      }
      case 'report_send': throw new Error('Demo mode: no email is actually sent.');
      case 'report_schedule_get': return ok(Object.assign({}, SCHED));
      case 'report_schedule_set': SCHED.enabled = q.get('enabled') === 'Y'; SCHED.hour = Number(q.get('hour')) || 9; SCHED.excel = q.get('excel') || 'attach'; SCHED.fcUsers = q.get('fcUsers') !== 'N'; return ok(Object.assign({}, SCHED));
      case 'diagnose': return ok({ at: 'demo', checks: [
        { name: 'BigQuery access', ok: true, detail: 'Simulated in demo mode' },
        { name: 'Users sheet', ok: true, detail: USERS.length + ' demo users' },
        { name: 'AI summary service', ok: true, detail: 'Simulated (rule-based text in demo)' },
        { name: 'Email (MailApp)', ok: true, detail: 'Disabled in demo' },
        { name: 'Weekly trigger', ok: true, detail: 'Every Monday, 9 AM IST (simulated)' }] });
      case 'users_list': return ok(USERS.map(u => Object.assign({}, u)));
      case 'user_save': {
        const email = String(q.get('email') || '').toLowerCase(); if (!email) throw new Error('Email required');
        const fcs = split(q.get('fcs')); const u = USERS.find(x => x.email === email);
        const rec = { email, name: q.get('name') || email.split('@')[0], role: q.get('role') === 'admin' ? 'admin' : 'user', fcs: fcs.length ? fcs : ['ALL'], active: q.get('active') !== 'N', locked: false };
        if (u) Object.assign(u, rec); else USERS.push(rec);
        return ok(USERS.map(x => Object.assign({}, x)));
      }
      case 'user_remove': { const i = USERS.findIndex(x => x.email === String(q.get('email') || '').toLowerCase() && !x.locked); if (i >= 0) USERS.splice(i, 1); return ok(USERS.map(x => Object.assign({}, x))); }
      default: throw new Error('Unknown action: ' + a);
    }
  }
  function handle(url) {
    try { return route(url); } catch (e) { return { ok: false, error: e.message }; }
  }

  G.DemoBackend = { handle, buildReportHtml, TODAY };

  if (typeof window !== 'undefined' && window.fetch) {
    const real = window.fetch.bind(window);
    window.fetch = function (u, o) {
      if (typeof u === 'string' && u.indexOf(API_PREFIX) === 0) {
        const out = handle(u);
        return new Promise(res => setTimeout(() => res({ ok: true, json: async () => out }), 120));
      }
      return real(u, o);
    };
    try { localStorage.setItem('vms_session_v1', JSON.stringify({ token: 'demo-token', email: 'admin@example.com' })); } catch (e) {}
  }
})();
