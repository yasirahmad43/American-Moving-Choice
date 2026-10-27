// Direct observation of reference sites for the American Moving Choice reference review.
// Renders public pages in headless Chromium, extracts structure and text, and walks quote flows
// up to (never past) the step that asks for personal contact details. No personal data is typed.
// Run inside a Vercel Sandbox (Amazon Linux 2023): npm i puppeteer-core@23.11.1 @sparticuz/chromium@131.0.1
'use strict';
const fs = require('fs');
const path = require('path');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const OUT = path.join(__dirname, 'out');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const MAX_PAGES = 14;
const SITE_BUDGET_MS = 7 * 60 * 1000;
const TEST = { originZip: '30303', destZip: '33101', usDate: '12/15/2026', isoDate: '2026-12-15' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SITES = [
  { slug: 'consumermovingreviews', domain: 'consumermovingreviews.com', seeds: ['https://www.consumermovingreviews.com/'], walks: [{ name: 'Homepage quote form', url: 'https://www.consumermovingreviews.com/' }] },
  { slug: 'movebuddha', domain: 'movebuddha.com', seeds: ['https://www.movebuddha.com/', 'https://www.movebuddha.com/moving-cost-calculator/', 'https://www.movebuddha.com/movers/ca/los-angeles/long-distance/', 'https://www.movebuddha.com/movers/fl/orlando/long-distance/', 'https://www.movebuddha.com/movers/ri/', 'https://www.movebuddha.com/popular-routes/ca/fl/', 'https://www.movebuddha.com/blog/usdot-lookup/'], walks: [{ name: 'Moving cost calculator', url: 'https://www.movebuddha.com/moving-cost-calculator/' }, { name: 'Homepage', url: 'https://www.movebuddha.com/' }] },
  { slug: 'budgetvanlines', domain: 'budgetvanlines.com', seeds: ['https://www.budgetvanlines.com/'], walks: [{ name: 'Homepage quote form', url: 'https://www.budgetvanlines.com/' }] },
  { slug: 'hireahelper', domain: 'hireahelper.com', seeds: ['https://www.hireahelper.com/movers/dalton_ga/a-1-moving/', 'https://www.hireahelper.com/', 'https://www.hireahelper.com/movers/los-angeles_ca/', 'https://www.hireahelper.com/services/moving-companies/', 'https://www.hireahelper.com/movers/tallahassee_fl/'], walks: [{ name: 'Homepage search', url: 'https://www.hireahelper.com/' }, { name: 'Company profile CTA', url: 'https://www.hireahelper.com/movers/dalton_ga/a-1-moving/' }] },
  { slug: 'movingcom', domain: 'moving.com', seeds: ['https://www.moving.com/', 'https://www.moving.com/movers/moving-cost-calculator.asp'], walks: [] },
  { slug: 'homeguide', domain: 'homeguide.com', seeds: ['https://homeguide.com/moving-companies'], walks: [{ name: 'Moving companies hub', url: 'https://homeguide.com/moving-companies' }] },
  { slug: 'unpakt', domain: 'unpakt.com', seeds: ['https://www.unpakt.com/'], walks: [{ name: 'Homepage', url: 'https://www.unpakt.com/' }] },
  { slug: 'mygoodmovers', domain: 'mygoodmovers.com', seeds: ['https://quote.mygoodmovers.com/long-distance-moving/', 'https://www.mygoodmovers.com/'], walks: [{ name: 'Long-distance quote landing page', url: 'https://quote.mygoodmovers.com/long-distance-moving/' }] },
  { slug: 'energysage', domain: 'energysage.com', seeds: ['https://www.energysage.com/'], walks: [{ name: 'Homepage ZIP entry', url: 'https://www.energysage.com/' }] },
  { slug: 'consumeraffairs', domain: 'consumeraffairs.com', seeds: ['https://www.consumeraffairs.com/movers/best-long-distance-moving-companies.html'], walks: [] },
  { slug: 'moveorg', domain: 'move.org', seeds: ['https://www.move.org/', 'https://www.move.org/movers/', 'https://www.move.org/best-interstate-moving-companies/', 'https://www.move.org/moving-costs/', 'https://www.move.org/best-moving-container-companies/'], walks: [{ name: 'Movers hub', url: 'https://www.move.org/movers/' }, { name: 'Homepage', url: 'https://www.move.org/' }] },
];

// Discovery categories, in priority order.
const CATS = [
  ['quote', /quote|estimate|get-started|compare-quotes|request/i],
  ['provider', /for-pros|for-movers|for-installers|for-business|partner|advertise|leads|join|become-a|pro-signup|list-your/i],
  ['disclosure', /disclos|advertis|editorial|affiliate|how-we-make-money|business-model|methodology|how-we-rate|how-we-review|ratings/i],
  ['how', /how-it-works|how-we|process|our-guarantee|guarantee/i],
  ['about', /about|who-we-are|our-story|our-company/i],
  ['profile', /\/(company|companies|pros?|movers)\/[^/]+\/[^/]+\/?$/i],
  ['directory', /\/movers\/?$|moving-companies|\/companies\/?$/i],
  ['state_city', /\/(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)(\/|$)|_[a-z]{2}\/?$/i],
  ['route', /route|-to-[a-z]|\/to\//i],
  ['reviews', /review|rating/i],
  ['cost', /cost|price|pricing/i],
  ['calculator', /calculator/i],
  ['best', /best-/i],
  ['guide', /guide|blog|advice|tips|resources|checklist/i],
  ['faq', /faq|help|support/i],
  ['legal', /privacy|terms|tcpa|consent|do-not-sell/i],
];

function categorize(url) {
  for (const [name, re] of CATS) if (re.test(url)) return name;
  return 'other';
}

async function robotsRules(origin) {
  try {
    const res = await fetch(origin + '/robots.txt', { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const lines = (await res.text()).split(/\r?\n/);
    const rules = [];
    let applies = false;
    for (const raw of lines) {
      const line = raw.replace(/#.*/, '').trim();
      const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
      if (!m) continue;
      const key = m[1].toLowerCase();
      const val = m[2].trim();
      if (key === 'user-agent') applies = val === '*';
      else if (key === 'disallow' && applies && val) rules.push(new RegExp('^' + val.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$')));
    }
    return rules;
  } catch {
    return [];
  }
}

function allowed(url, rules) {
  try {
    const u = new URL(url);
    return !rules.some((re) => re.test(u.pathname + u.search));
  } catch {
    return false;
  }
}

// Runs in the page. Extracts structure, text, forms and disclosure/consent snippets.
function extractPage() {
  const vis = (el) => {
    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
  };
  const txt = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  const meta = (sel) => document.querySelector(sel)?.getAttribute('content') || null;
  const labelFor = (el) => {
    if (el.id) {
      const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l) return txt(l);
    }
    const p = el.closest('label');
    return p ? txt(p) : null;
  };
  const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].slice(0, 6).map((s) => {
    try {
      const data = JSON.parse(s.textContent);
      const types = [];
      const walk = (o) => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) return o.forEach(walk);
        if (o['@type']) types.push(...[].concat(o['@type']));
        if (o['@graph']) walk(o['@graph']);
        if (o.aggregateRating) types.push('aggregateRating(' + (o.aggregateRating.ratingValue ?? '?') + '/' + (o.aggregateRating.reviewCount ?? o.aggregateRating.ratingCount ?? '?') + ')');
      };
      walk(data);
      return { types, sample: s.textContent.replace(/\s+/g, ' ').slice(0, 700) };
    } catch {
      return { types: ['(unparseable)'], sample: s.textContent.slice(0, 200) };
    }
  });
  const links = (root, n) => root ? [...root.querySelectorAll('a[href]')].filter(vis).slice(0, n).map((a) => ({ t: txt(a).slice(0, 60), h: a.href })) : [];
  const header = document.querySelector('header') || document.querySelector('nav');
  const footer = document.querySelector('footer');
  const fieldInfo = (el) => ({
    tag: el.tagName.toLowerCase(), type: el.type || null, name: el.name || null, id: el.id || null,
    placeholder: el.placeholder || null, label: labelFor(el), aria: el.getAttribute('aria-label'),
    autocomplete: el.getAttribute('autocomplete'), required: !!el.required, visible: vis(el),
    options: el.tagName === 'SELECT' ? [...el.options].slice(0, 14).map((o) => o.text.trim()) : undefined,
  });
  const forms = [...document.querySelectorAll('form')].slice(0, 6).map((f) => ({
    action: f.getAttribute('action'), method: f.getAttribute('method'),
    fields: [...f.querySelectorAll('input:not([type=hidden]),select,textarea')].slice(0, 25).map(fieldInfo),
    buttons: [...f.querySelectorAll('button,input[type=submit]')].slice(0, 6).map((b) => txt(b) || b.value || null),
  }));
  const looseFields = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter((el) => !el.closest('form') && vis(el)).slice(0, 15).map(fieldInfo);
  const KEY = /by (clicking|submitting|continuing|pressing|tapping)|consent|agree to|TCPA|autodial|automated|prerecorded|not a condition|broker|carrier|licensed|FMCSA|USDOT|U\.S\. ?DOT|\bMC[ #-]?\d|advertis|compensat|paid partner|sponsored|affiliate|commission|referral fee|we may earn|not a moving company|do not transport|arrang|verified|vetted|background.?check|screened|guarantee/i;
  const seen = new Set();
  const snippets = [];
  for (const el of document.querySelectorAll('p,small,label,li,span,div,td')) {
    if (snippets.length >= 30) break;
    if (el.children.length > 6) continue;
    const t = txt(el);
    if (t.length < 25 || t.length > 900 || !KEY.test(t) || seen.has(t)) continue;
    if ([...seen].some((s) => s.includes(t) || t.includes(s))) continue;
    seen.add(t);
    snippets.push(t);
  }
  const atf = () => [...document.querySelectorAll('h1,h2,h3,button,a,input,select,img,video,iframe,label,p')]
    .filter((el) => { const r = el.getBoundingClientRect(); return vis(el) && r.top < window.innerHeight && r.bottom > 0; })
    .slice(0, 300)
    .map((el) => { const r = el.getBoundingClientRect(); return { y: Math.round(r.top), x: Math.round(r.left), w: Math.round(r.width), tag: el.tagName.toLowerCase(), text: (el.tagName === 'IMG' ? 'img alt=' + (el.alt || '') : el.tagName === 'INPUT' ? 'input ' + (el.type || '') + ' ' + (el.placeholder || el.name || '') : txt(el)).slice(0, 90) }; })
    .filter((i) => i.text)
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .slice(0, 45);
  const scripts = [...document.scripts].map((s) => s.src).filter(Boolean);
  const scriptHosts = [...new Set(scripts.map((s) => { try { return new URL(s).host; } catch { return ''; } }))].filter(Boolean).slice(0, 40);
  const consentTech = scripts.filter((s) => /trustedform|activeprospect|jornaya|leadid|leadconduit/i.test(s));
  const body = txt(document.body);
  return {
    title: document.title, metaDescription: meta('meta[name="description"]'),
    canonical: document.querySelector('link[rel="canonical"]')?.href || null, robots: meta('meta[name="robots"]'),
    h1: [...document.querySelectorAll('h1')].map(txt).filter(Boolean).slice(0, 5),
    h2: [...document.querySelectorAll('h2')].map(txt).filter(Boolean).slice(0, 30),
    h3: [...document.querySelectorAll('h3')].map(txt).filter(Boolean).slice(0, 30),
    jsonld, nav: links(header, 50), footer: links(footer, 70), forms, looseFields, snippets,
    atfDesktop: atf(), scriptHosts, consentTech,
    counts: { words: body.split(' ').length, links: document.links.length, images: document.images.length, imagesNoAlt: [...document.images].filter((i) => !i.alt).length, iframes: document.querySelectorAll('iframe').length },
    text: body.slice(0, 12000),
    links: [...document.links].map((a) => a.href).slice(0, 600),
  };
}

function extractAtf() {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const txt = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  return [...document.querySelectorAll('h1,h2,h3,button,a,input,select,img,video,label,p')]
    .filter((el) => { const r = el.getBoundingClientRect(); return vis(el) && r.top < window.innerHeight && r.bottom > 0; })
    .map((el) => { const r = el.getBoundingClientRect(); return { y: Math.round(r.top), tag: el.tagName.toLowerCase(), text: (el.tagName === 'IMG' ? 'img alt=' + (el.alt || '') : el.tagName === 'INPUT' ? 'input ' + (el.type || '') + ' ' + (el.placeholder || el.name || '') : txt(el)).slice(0, 90) }; })
    .filter((i) => i.text).sort((a, b) => a.y - b.y).slice(0, 30);
}

// Runs in the page during a quote-flow walk. Tags actionable elements with data-amc attributes.
function inspectStep() {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'; };
  const txt = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  const labelFor = (el) => {
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) return txt(l); }
    const p = el.closest('label'); return p ? txt(p) : '';
  };
  const CONTACT = /e-?mail|phone|\btel\b|mobile|cell|first.?name|last.?name|full.?name|your name|^name$|fname|lname/i;
  document.querySelectorAll('[data-amc]').forEach((el) => el.removeAttribute('data-amc'));
  const fields = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(vis).slice(0, 30);
  const info = fields.map((el, i) => {
    const desc = [el.name, el.id, el.placeholder, labelFor(el), el.getAttribute('aria-label'), el.getAttribute('autocomplete')].filter(Boolean).join(' | ');
    const contact = el.type === 'email' || el.type === 'tel' || CONTACT.test(desc);
    el.setAttribute('data-amc', 'f' + i);
    return { ref: 'f' + i, tag: el.tagName.toLowerCase(), type: el.type || '', desc: desc.slice(0, 160), contact, checked: !!el.checked, value: el.type === 'password' ? '' : (el.value || '').slice(0, 40), options: el.tagName === 'SELECT' ? [...el.options].slice(0, 14).map((o) => o.text.trim()) : undefined };
  });
  const CTA = /next|continue|get (my |your )?(free )?(quote|quotes|estimate|started|prices|pricing)|compare|start|see (my |your )?(price|quote|movers|results|cost)|search|calculate|find (movers|pros|my)|let.?s go|^go$|submit|view (prices|movers|quotes)|check (prices|availability)/i;
  const BAD = /log ?in|sign ?in|menu|close|cookie|accept|reject|privacy|terms|learn more|read more|call|chat/i;
  const buttons = [...document.querySelectorAll('button,input[type=submit],input[type=button],[role=button],a')].filter(vis)
    .map((el) => ({ el, t: (txt(el) || el.value || el.getAttribute('aria-label') || '').slice(0, 80) }))
    .filter((b) => b.t && CTA.test(b.t) && !BAD.test(b.t)).slice(0, 8);
  buttons.forEach((b, i) => b.el.setAttribute('data-amc', 'b' + i));
  const container = fields[0]?.closest('form') || fields[0]?.closest('section,main,div') || document.body;
  const KEY = /by (clicking|submitting|continuing|pressing|tapping)|consent|agree|TCPA|autodial|automated|prerecorded|not a condition|broker|carrier|licensed|FMCSA|USDOT|share your|partners?|contact you|may call|text/i;
  const consent = [...document.querySelectorAll('p,small,label,span,div')].filter(vis).map(txt).filter((t) => t.length > 30 && t.length < 1200 && KEY.test(t));
  const uniq = [];
  for (const t of consent) if (!uniq.some((u) => u.includes(t) || t.includes(u))) uniq.push(t);
  return {
    url: location.href, title: document.title,
    headings: [...document.querySelectorAll('h1,h2,h3,legend')].filter(vis).map(txt).filter(Boolean).slice(0, 10),
    fields: info, buttons: buttons.map((b, i) => ({ ref: 'b' + i, text: b.t })),
    stepText: txt(container).slice(0, 1800), consent: uniq.slice(0, 8),
    contactRequested: info.some((f) => f.contact),
  };
}

async function dismissOverlays(page) {
  try {
    await page.evaluate(() => {
      const re = /^(reject|decline|no thanks|close|dismiss|not now|×|x)$/i;
      for (const b of document.querySelectorAll('button,[role=button],a')) {
        const t = (b.innerText || b.getAttribute('aria-label') || '').trim();
        if (re.test(t) && b.getBoundingClientRect().width > 0) { b.click(); break; }
      }
    });
  } catch {}
}

async function fillStep(page, step) {
  const acted = [];
  const zipLike = step.fields.filter((f) => !f.contact && (f.type === 'text' || f.type === 'tel' || f.type === 'number' || f.type === 'search' || f.type === '') && f.tag === 'input' && /zip|postal|from|to\b|origin|destination|pick.?up|drop|moving|address|where|location|city/i.test(f.desc) && !f.value);
  for (let i = 0; i < zipLike.length && i < 2; i++) {
    const f = zipLike[i];
    const toField = /\bto\b|destination|drop|new home|moving to/i.test(f.desc) || (i === 1 && !/\bfrom\b|origin|pick/i.test(f.desc));
    const value = toField ? TEST.destZip : TEST.originZip;
    try {
      await page.click(`[data-amc="${f.ref}"]`, { clickCount: 3 });
      await page.type(`[data-amc="${f.ref}"]`, value, { delay: 60 });
      await sleep(1300);
      const picked = await page.evaluate(() => {
        const o = [...document.querySelectorAll('[role=option],.pac-item,li[id*=option],.autocomplete-suggestion,.suggestion')].find((x) => x.getBoundingClientRect().width > 0);
        if (o) { o.click(); return (o.innerText || '').trim().slice(0, 60); }
        return null;
      });
      acted.push(`typed ${value} into "${f.desc.slice(0, 50)}"${picked ? ` and picked suggestion "${picked}"` : ''}`);
    } catch (e) { acted.push('type failed: ' + e.message.slice(0, 60)); }
  }
  for (const f of step.fields.filter((x) => !x.contact && x.type === 'date' && !x.value)) {
    await page.$eval(`[data-amc="${f.ref}"]`, (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, TEST.isoDate).catch(() => {});
    acted.push('set date ' + TEST.isoDate);
  }
  for (const f of step.fields.filter((x) => !x.contact && x.tag === 'input' && x.type === 'text' && /date|when/i.test(x.desc) && !x.value)) {
    await page.type(`[data-amc="${f.ref}"]`, TEST.usDate, { delay: 40 }).catch(() => {});
    acted.push('typed date ' + TEST.usDate);
  }
  for (const f of step.fields.filter((x) => !x.contact && x.tag === 'select')) {
    const opts = f.options || [];
    let idx = opts.findIndex((o) => /2\s*-?\s*bed|two bed|2 ?br|2 bedroom/i.test(o));
    if (idx < 0) idx = Math.min(2, opts.length - 1);
    if (idx > 0) {
      await page.$eval(`[data-amc="${f.ref}"]`, (el, i) => { el.selectedIndex = i; el.dispatchEvent(new Event('change', { bubbles: true })); }, idx).catch(() => {});
      acted.push(`selected "${opts[idx]}" in "${f.desc.slice(0, 40)}"`);
    }
  }
  const radios = step.fields.filter((x) => !x.contact && x.type === 'radio');
  if (radios.length && !radios.some((r) => r.checked)) {
    const pick = radios.find((r) => /2\s*bed|two|long|interstate|out of state|yes|house|home/i.test(r.desc)) || radios[0];
    await page.click(`[data-amc="${pick.ref}"]`).catch(() => {});
    acted.push(`chose option "${pick.desc.slice(0, 50)}"`);
  }
  return acted;
}

async function walkFlow(browser, walk) {
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1366, height: 900 });
  const steps = [];
  try {
    const res = await page.goto(walk.url, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => null);
    if (res && res.status() >= 400) { steps.push({ i: 0, url: walk.url, stop: `HTTP ${res.status()} (${await page.title()})` }); return steps; }
    await sleep(2500);
    await dismissOverlays(page);
    for (let i = 0; i < 8; i++) {
      const step = await page.evaluate(inspectStep);
      const record = { i, ...step };
      steps.push(record);
      if (step.contactRequested) { record.stop = 'Contact details requested at this step. Walk stopped; no personal data entered.'; break; }
      record.actions = await fillStep(page, step);
      const fresh = await page.evaluate(inspectStep);
      const target = fresh.buttons[0];
      if (!target) { record.stop = 'No next/continue/quote button found.'; break; }
      record.actions.push(`clicked "${target.text}"`);
      const before = page.url();
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 12000 }).catch(() => {}),
        page.click(`[data-amc="${target.ref}"]`).catch((e) => record.actions.push('click failed: ' + e.message.slice(0, 60))),
      ]);
      await sleep(3000);
      const after = await page.evaluate(inspectStep);
      if (page.url() === before && JSON.stringify(after.fields.map((f) => f.desc)) === JSON.stringify(step.fields.map((f) => f.desc)) && after.stepText === step.stepText) {
        record.stop = 'Page did not change after clicking (validation or unsupported widget).';
        steps.push({ i: i + 1, ...after, note: 'state after failed advance' });
        break;
      }
    }
  } catch (e) {
    steps.push({ error: e.message.slice(0, 200) });
  } finally {
    await page.close().catch(() => {});
  }
  return steps;
}

async function capturePage(browser, url, dir, n) {
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1366, height: 900 });
  try {
    const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 }).catch((e) => ({ status: () => 0, err: e.message }));
    await sleep(2000);
    const status = res && res.status ? res.status() : 0;
    const data = await page.evaluate(extractPage);
    await page.screenshot({ path: path.join(dir, `${n}-desktop.jpg`), type: 'jpeg', quality: 40 }).catch(() => {});
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await sleep(1500);
    data.atfMobile = await page.evaluate(extractAtf).catch(() => []);
    await page.screenshot({ path: path.join(dir, `${n}-mobile.jpg`), type: 'jpeg', quality: 40 }).catch(() => {});
    return { url, finalUrl: page.url(), status, ...data };
  } catch (e) {
    return { url, error: e.message.slice(0, 200) };
  } finally {
    await page.close().catch(() => {});
  }
}

function pickPages(site, seedPages, rules) {
  const chosen = [...site.seeds];
  const pool = new Map();
  for (const p of seedPages) for (const href of p.links || []) {
    try {
      const u = new URL(href);
      if (!u.hostname.endsWith(site.domain)) continue;
      u.hash = '';
      const clean = u.toString();
      if (/\.(pdf|jpg|png|svg|zip)$/i.test(u.pathname) || chosen.includes(clean) || !allowed(clean, rules)) continue;
      pool.set(clean, categorize(clean));
    } catch {}
  }
  const perCat = {};
  for (const [name] of CATS) {
    for (const [url, cat] of pool) {
      if (chosen.length >= MAX_PAGES) break;
      if (cat !== name || (perCat[cat] || 0) >= (cat === 'legal' ? 2 : 1)) continue;
      chosen.push(url);
      perCat[cat] = (perCat[cat] || 0) + 1;
    }
  }
  return chosen.slice(0, MAX_PAGES);
}

function list(items, fmt) { return items && items.length ? items.map(fmt).join('\n') : '- (none)'; }

function digest(site, pages, walks, note) {
  const L = [];
  L.push(`# Direct capture: ${site.slug}`);
  L.push(`Captured ${new Date().toISOString()} with headless Chromium 131 in a Vercel Sandbox (iad1). Desktop 1366x900 and mobile 390x844. ${note || ''}`);
  for (const [n, p] of pages.entries()) {
    L.push(`\n## Page ${n + 1}: ${p.url}`);
    if (p.error) { L.push(`Error: ${p.error}`); continue; }
    L.push(`- Final URL: ${p.finalUrl} | HTTP ${p.status}`);
    L.push(`- Title: ${p.title}`);
    L.push(`- Meta description: ${p.metaDescription || '(none)'}`);
    L.push(`- Canonical: ${p.canonical || '(none)'} | Robots meta: ${p.robots || '(none)'}`);
    L.push(`- Counts: ${JSON.stringify(p.counts)}`);
    L.push(`- H1: ${p.h1.join(' / ') || '(none)'}`);
    L.push(`- H2: ${p.h2.join(' / ') || '(none)'}`);
    if (p.h3.length) L.push(`- H3: ${p.h3.join(' / ')}`);
    L.push(`- JSON-LD types: ${p.jsonld.map((j) => j.types.join(',')).join(' ; ') || '(none)'}`);
    L.push(`- Consent-certificate scripts: ${p.consentTech.join(', ') || '(none detected)'}`);
    L.push(`- Third-party script hosts: ${p.scriptHosts.join(', ') || '(none)'}`);
    L.push(`- Header/nav links: ${p.nav.map((l) => `${l.t} <${l.h}>`).join(' · ') || '(none)'}`);
    L.push(`- Footer links: ${p.footer.map((l) => `${l.t} <${l.h}>`).join(' · ') || '(none)'}`);
    L.push(`- Forms:`);
    L.push(list(p.forms, (f) => `  - form action=${f.action} method=${f.method} buttons=[${f.buttons.join(' | ')}] fields: ${f.fields.map((x) => `${x.tag}:${x.type}:${x.name || x.id || ''}${x.placeholder ? ` "${x.placeholder}"` : ''}${x.label ? ` [${x.label.slice(0, 60)}]` : ''}${x.required ? ' *' : ''}${x.options ? ` {${x.options.join('|')}}` : ''}${x.visible ? '' : ' (hidden)'}`).join('; ')}`));
    if (p.looseFields.length) L.push(`- Fields outside forms: ${p.looseFields.map((x) => `${x.tag}:${x.type}:${x.name || x.id || ''} "${x.placeholder || x.label || x.aria || ''}"`).join('; ')}`);
    L.push(`- Disclosure / consent / trust snippets (verbatim):`);
    L.push(list(p.snippets, (s) => `  - "${s}"`));
    L.push(`- Above the fold, desktop (y: element: text):`);
    L.push(list(p.atfDesktop, (i) => `  - ${i.y}: ${i.tag}: ${i.text}`));
    L.push(`- Above the fold, mobile:`);
    L.push(list(p.atfMobile, (i) => `  - ${i.y}: ${i.tag}: ${i.text}`));
    L.push(`- Visible text (first 3500 chars):\n\n> ${(p.text || '').slice(0, 3500)}`);
  }
  for (const w of walks) {
    L.push(`\n## Quote-flow walk: ${w.name} (${w.url})`);
    L.push(`Test inputs: origin ZIP ${TEST.originZip}, destination ZIP ${TEST.destZip}, date ${TEST.isoDate}, 2-bedroom where offered. Contact fields are never filled.`);
    for (const s of w.steps) {
      if (s.error) { L.push(`- Error: ${s.error}`); continue; }
      L.push(`\n### Step ${s.i} ${s.note ? `(${s.note})` : ''}`);
      L.push(`- URL: ${s.url}`);
      if (s.title) L.push(`- Title: ${s.title}`);
      if (s.headings) L.push(`- Headings: ${s.headings.join(' / ') || '(none)'}`);
      if (s.fields) L.push(`- Fields: ${s.fields.map((f) => `${f.tag}:${f.type} "${f.desc}"${f.contact ? ' [CONTACT]' : ''}${f.options ? ` {${f.options.join('|')}}` : ''}`).join('; ') || '(none)'}`);
      if (s.buttons) L.push(`- Buttons: ${s.buttons.map((b) => b.text).join(' | ') || '(none)'}`);
      if (s.consent && s.consent.length) L.push(`- Consent / disclosure text (verbatim):\n${s.consent.map((c) => `  - "${c}"`).join('\n')}`);
      if (s.stepText) L.push(`- Step text: > ${s.stepText}`);
      if (s.actions) L.push(`- Actions taken: ${s.actions.join('; ')}`);
      if (s.stop) L.push(`- STOP: ${s.stop}`);
    }
  }
  return L.join('\n');
}

function writeParts(dir, text, size = 13000) {
  const lines = text.split('\n');
  const parts = [];
  let cur = '';
  for (const line of lines) {
    const chunk = line.length > size ? line.slice(0, size) + ' [truncated]' : line;
    if (cur.length + chunk.length + 1 > size) { parts.push(cur); cur = ''; }
    cur += chunk + '\n';
  }
  if (cur) parts.push(cur);
  parts.forEach((p, i) => fs.writeFileSync(path.join(dir, `digest-part-${String(i + 1).padStart(2, '0')}.md`), p));
  return parts.length;
}

async function runSite(browser, site) {
  const dir = path.join(OUT, site.slug);
  fs.mkdirSync(dir, { recursive: true });
  const origin = new URL(site.seeds[0]).origin;
  const rules = await robotsRules(origin);
  const seedPages = [];
  for (const [i, url] of site.seeds.entries()) {
    if (!allowed(url, rules)) { seedPages.push({ url, error: 'Disallowed by robots.txt; not captured.' }); continue; }
    seedPages.push(await capturePage(browser, url, dir, i + 1));
  }
  const blocked = seedPages.every((p) => p.error || p.status === 403 || /denied|interruption|captcha|attention required/i.test(p.title || ''));
  let pages = seedPages;
  let note = '';
  if (blocked) {
    note = 'The site refused automated access (bot protection or HTTP 403). No attempt was made to bypass it.';
  } else {
    const targets = pickPages(site, seedPages, rules).filter((u) => !site.seeds.includes(u));
    for (const [i, url] of targets.entries()) pages.push(await capturePage(browser, url, dir, site.seeds.length + i + 1));
  }
  const walks = [];
  if (!blocked) for (const w of site.walks) walks.push({ ...w, steps: await walkFlow(browser, w) });
  fs.writeFileSync(path.join(dir, 'capture.json'), JSON.stringify({ site, pages, walks, note }, null, 1));
  const parts = writePartsSafe(dir, digest(site, pages, walks, note));
  return { slug: site.slug, pages: pages.length, ok: pages.filter((p) => !p.error && p.status && p.status < 400).length, walks: walks.map((w) => ({ name: w.name, steps: w.steps.length, stop: (w.steps[w.steps.length - 1] || {}).stop || null })), blocked, parts };
}

function writePartsSafe(dir, text) {
  try { return writeParts(dir, text); } catch (e) { fs.writeFileSync(path.join(dir, 'digest-part-01.md'), 'Digest error: ' + e.message); return 1; }
}

(async () => {
  const only = process.argv.slice(2);
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
  const summary = [];
  for (const site of SITES.filter((s) => !only.length || only.includes(s.slug))) {
    const t0 = Date.now();
    try {
      const r = await Promise.race([runSite(browser, site), sleep(SITE_BUDGET_MS).then(() => ({ slug: site.slug, error: 'site time budget exceeded' }))]);
      summary.push({ ...r, seconds: Math.round((Date.now() - t0) / 1000) });
    } catch (e) {
      summary.push({ slug: site.slug, error: e.message.slice(0, 200) });
    }
    fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(summary, null, 1));
    console.log(JSON.stringify(summary[summary.length - 1]));
  }
  await browser.close();
})();
