// Condenses each site's capture.json into a compact evidence pack (short quotes only) that can be
// moved into the repo. Usage (in the capture sandbox): node pack.js   → out/<slug>/pack.md
'use strict';
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'out');
const KEY = /\$\s?\d|cost|price|estimate|quote|licensed|insured|insurance|guarantee|verified|vetted|screen|background|review|rating|stars?\b|broker|carrier|FMCSA|USDOT|DOT\b|\bMC\b|years|moves|compan(y|ies) (will|may)|contact you|partners?|commission|compensat|advertis|sponsor|affiliate|methodology|updated|written by|reviewed by|editor|data/i;
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
const host = (u) => { try { return new URL(u).pathname + (new URL(u).search || ''); } catch { return u; } };

function category(url) {
  const rules = [['quote', /quote|estimate|get-started|request/i], ['calculator', /calculator/i], ['provider', /for-pros|for-movers|partner|advertise|leads|join|become/i], ['disclosure', /disclos|advertis|editorial|methodology|how-we|rating|score|data-sources|certified/i], ['about', /about|contact/i], ['profile', /\/(company|companies|pros?|movers)\/[^/]+\/[^/]+\/?$|\/reviews?\/[a-z]/i], ['route', /route|-to-[a-z]|popular-routes/i], ['state_city', /\/[a-z]{2}\/|_[a-z]{2}\/?$|\/movers\/[a-z-]+\/?$/i], ['cost', /cost|price/i], ['best', /best-/i], ['guide', /blog|guide|advice|tips|articles/i], ['legal', /privacy|terms/i]];
  for (const [n, re] of rules) if (re.test(url)) return n;
  return url.replace(/^https?:\/\/[^/]+/, '') === '/' ? 'home' : 'other';
}

function pack(dir) {
  const file = path.join(dir, 'capture.json');
  if (!fs.existsSync(file)) return null;
  const { site, pages, walks, note } = JSON.parse(fs.readFileSync(file, 'utf8'));
  const L = [];
  const ok = pages.filter((p) => !p.error && p.status && p.status < 400);
  L.push(`# Evidence pack: ${site.slug}`);
  L.push(`Pages captured OK: ${ok.length} of ${pages.length}. ${note || ''}`);
  L.push('\n## Page inventory');
  L.push('| # | HTTP | type | path | title | H1 | JSON-LD | words |');
  L.push('|---|---|---|---|---|---|---|---|');
  pages.forEach((p, i) => {
    if (p.error) { L.push(`| ${i + 1} | err | ${category(p.url)} | ${host(p.url)} | ${clip(p.error, 60)} | | | |`); return; }
    L.push(`| ${i + 1} | ${p.status} | ${category(p.finalUrl || p.url)} | ${host(p.finalUrl || p.url)} | ${clip(p.title, 70)} | ${clip((p.h1 || []).join(' / '), 60)} | ${clip((p.jsonld || []).map((j) => j.types.join(',')).join('; '), 60)} | ${(p.counts || {}).words || ''} |`);
  });
  const navLabels = [...new Set(ok.flatMap((p) => (p.nav || []).map((l) => l.t)).filter(Boolean))].slice(0, 35);
  const footLabels = [...new Set(ok.flatMap((p) => (p.footer || []).map((l) => l.t)).filter(Boolean))].slice(0, 50);
  L.push('\n## Navigation labels');
  L.push(`- Header: ${navLabels.map((t) => clip(t, 30)).join(' · ') || '(none captured)'}`);
  L.push(`- Footer: ${footLabels.map((t) => clip(t, 30)).join(' · ') || '(none captured)'}`);
  const hosts = [...new Set(ok.flatMap((p) => p.scriptHosts || []))].slice(0, 30);
  const certs = [...new Set(ok.flatMap((p) => p.consentTech || []))];
  L.push(`\n## Third-party scripts\n- Hosts: ${hosts.join(', ') || '(none)'}\n- Consent-certificate scripts: ${certs.join(', ') || '(none detected)'}`);
  const seen = new Set();
  L.push('\n## Per-page notes (short quotes only)');
  ok.forEach((p) => {
    const i = pages.indexOf(p) + 1;
    L.push(`\n### ${i}. ${host(p.finalUrl || p.url)} (${category(p.finalUrl || p.url)})`);
    if (p.metaDescription) L.push(`- Meta: "${clip(p.metaDescription, 200)}"`);
    if ((p.h2 || []).length) L.push(`- H2: ${p.h2.slice(0, 12).map((h) => clip(h, 60)).join(' / ')}`);
    const snips = (p.snippets || []).filter((s) => !seen.has(s)).slice(0, 6);
    snips.forEach((s) => seen.add(s));
    if (snips.length) L.push(`- Disclosure/consent/trust: ${snips.map((s) => `"${clip(s, 260)}"`).join(' | ')}`);
    const lines = (p.text || '').split(/(?<=[.!?])\s+/).filter((s) => s.length > 30 && KEY.test(s) && !seen.has(s)).slice(0, 6);
    lines.forEach((s) => seen.add(s));
    if (lines.length) L.push(`- Key lines: ${lines.map((s) => `"${clip(s, 180)}"`).join(' | ')}`);
    (p.forms || []).filter((f) => f.fields.some((x) => x.visible)).slice(0, 3).forEach((f) => {
      L.push(`- Form (${clip(f.buttons.join(' | '), 60)}): ${f.fields.filter((x) => x.visible).slice(0, 10).map((x) => `${x.type || x.tag}:${clip(x.label || x.placeholder || x.name || x.id || '', 40)}${x.options ? ` {${x.options.slice(0, 6).map((o) => clip(o, 18)).join('|')}}` : ''}`).join('; ')}`);
    });
    if ((p.looseFields || []).length) L.push(`- Fields outside forms: ${p.looseFields.slice(0, 10).map((x) => `${x.type || x.tag}:${clip(x.label || x.placeholder || x.aria || x.name || '', 40)}`).join('; ')}`);
    const atf = (a) => (a || []).slice(0, 10).map((x) => `${x.tag}:${clip(x.text, 50)}`).join(' > ');
    if (i <= 4 || /quote|calculator|profile/.test(category(p.finalUrl || p.url))) {
      L.push(`- Above the fold (desktop): ${atf(p.atfDesktop)}`);
      L.push(`- Above the fold (mobile): ${atf(p.atfMobile)}`);
    }
  });
  (walks || []).forEach((w) => {
    L.push(`\n## Automated quote-walk: ${w.name} (${host(w.url)})`);
    (w.steps || []).forEach((s) => {
      if (s.error) { L.push(`- Error: ${clip(s.error, 120)}`); return; }
      L.push(`- Step ${s.i}${s.note ? ` (${s.note})` : ''}: ${host(s.url || '')} | headings: ${clip((s.headings || []).join(' / '), 160)}`);
      if (s.fields) L.push(`  - Fields: ${s.fields.slice(0, 12).map((f) => `${f.type || f.tag}:"${clip(f.desc, 50)}"${f.contact ? ' [CONTACT]' : ''}${f.options ? ` {${f.options.slice(0, 6).map((o) => clip(o, 18)).join('|')}}` : ''}`).join('; ')}`);
      if (s.buttons && s.buttons.length) L.push(`  - Buttons: ${s.buttons.slice(0, 8).map((b) => clip(b.text, 40)).join(' | ')}`);
      if (s.consent && s.consent.length) L.push(`  - Consent/disclosure: ${s.consent.slice(0, 3).map((c) => `"${clip(c, 420)}"`).join(' | ')}`);
      if (s.actions) L.push(`  - Actions: ${clip(s.actions.join('; '), 300)}`);
      if (s.stop) L.push(`  - STOP: ${s.stop}`);
    });
  });
  return L.join('\n');
}

const summary = [];
for (const slug of fs.readdirSync(OUT)) {
  const dir = path.join(OUT, slug);
  if (!fs.statSync(dir).isDirectory()) continue;
  const text = pack(dir);
  if (!text) continue;
  fs.writeFileSync(path.join(dir, 'pack.md'), text);
  summary.push(`${slug}: ${text.length} chars`);
}
console.log(summary.join('\n'));
