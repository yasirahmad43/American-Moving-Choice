// Guarded step runner for quote-flow deep dives in the reference review.
// Usage: node runplan.js '<json array of actions>'   (run inside the capture sandbox)
// Actions: {"goto":url} {"inspect":true} {"type":{"selector":s,"text":t}} {"select":{"selector":s,"label"|"value"|"index":x}}
//          {"click":{"selector":s}|{"text":t}} {"check":{"selector":s}} {"press":key} {"wait":ms} {"scroll":px}
//          {"text":{"selector"?:s,"max"?:n}} {"links":{"match":regex}} {"screenshot":name}
// Safety: refuses to type into contact fields, refuses non-test values, never ticks consent/terms boxes,
// and refuses submit-like clicks once a contact step is on screen. Output lines are chunked so each
// arrives as a separate log item (stream with wait:true, logs:true).
'use strict';
const fs = require('fs');
const path = require('path');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CONTACT = /e-?mail|phone|\btel\b|mobile|cell|first.?name|last.?name|full.?name|your name|^name$|fname|lname|street|address line|address1|apartment/i;
const SAFE_TEXT = /^([0-9][0-9\/\- ]{0,11}|[A-Za-z][A-Za-z .,'-]{1,39})$/;
const CONSENT = /agree|consent|terms|privacy|tcpa|authori[sz]e|opt.?in|marketing|text me|call me/i;
const SUBMIT_LIKE = /submit|get (my |your )?(free )?quotes?|send|request|finish|complete|see (my )?(results|quotes|matches)|continue|next|compare/i;

async function say(obj) {
  const s = JSON.stringify(obj);
  for (let i = 0; i < s.length; i += 1700) {
    process.stdout.write(s.slice(i, i + 1700) + (i + 1700 >= s.length ? '\n' : ''));
    await sleep(400);
  }
}

function inspectPage() {
  const vis = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0'; };
  const txt = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  const sel = (el) => {
    if (el.id && document.querySelectorAll('#' + CSS.escape(el.id)).length === 1) return '#' + CSS.escape(el.id);
    if (el.name) { const s = `${el.tagName.toLowerCase()}[name="${el.name}"]`; if (document.querySelectorAll(s).length === 1) return s; }
    const parts = [];
    let cur = el;
    while (cur && cur.nodeType === 1 && parts.length < 6) {
      let p = cur.tagName.toLowerCase();
      const sib = cur.parentElement ? [...cur.parentElement.children].filter((c) => c.tagName === cur.tagName) : [];
      if (sib.length > 1) p += `:nth-of-type(${sib.indexOf(cur) + 1})`;
      parts.unshift(p);
      if (cur.id) { parts[0] = '#' + CSS.escape(cur.id); break; }
      cur = cur.parentElement;
    }
    return parts.join(' > ');
  };
  const labelFor = (el) => {
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) return txt(l); }
    const p = el.closest('label'); return p ? txt(p) : '';
  };
  const CONTACT_RE = /e-?mail|phone|\btel\b|mobile|cell|first.?name|last.?name|full.?name|your name|^name$|fname|lname|street|address line|address1|apartment/i;
  const fields = [...document.querySelectorAll('input:not([type=hidden]),select,textarea')].filter(vis).slice(0, 30).map((el) => {
    const desc = [el.name, el.id, el.placeholder, labelFor(el), el.getAttribute('aria-label'), el.getAttribute('autocomplete')].filter(Boolean).join(' | ').slice(0, 160);
    return { sel: sel(el), tag: el.tagName.toLowerCase(), type: el.type || '', desc, contact: el.type === 'email' || el.type === 'tel' || CONTACT_RE.test(desc), checked: !!el.checked, options: el.tagName === 'SELECT' ? [...el.options].slice(0, 16).map((o) => o.text.trim()) : undefined };
  });
  const buttons = [...document.querySelectorAll('button,input[type=submit],input[type=button],[role=button],[role=radio],[role=option],a.btn,a.button,label')].filter(vis)
    .map((el) => ({ sel: sel(el), text: (txt(el) || el.value || el.getAttribute('aria-label') || '').slice(0, 70) }))
    .filter((b) => b.text).slice(0, 40);
  const KEY = /by (clicking|submitting|continuing|pressing|tapping)|consent|agree|TCPA|autodial|automated|prerecorded|not a condition|broker|carrier|licensed|FMCSA|USDOT|share your|partners?|contact you|may call|text messages?/i;
  const consent = [];
  for (const t of [...document.querySelectorAll('p,small,label,span,div')].filter(vis).map(txt)) {
    if (t.length > 30 && t.length < 1500 && KEY.test(t) && !consent.some((c) => c.includes(t) || t.includes(c))) consent.push(t);
    if (consent.length >= 6) break;
  }
  return {
    url: location.href, title: document.title,
    headings: [...document.querySelectorAll('h1,h2,h3,legend')].filter(vis).map(txt).filter(Boolean).slice(0, 10),
    fields, buttons, consent, contactRequested: fields.some((f) => f.contact),
    stepText: txt(document.querySelector('main') || document.body).slice(0, 1200),
  };
}

async function elementInfo(page, selector) {
  return page.$eval(selector, (el) => {
    const txt = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim();
    let label = '';
    if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) label = txt(l); }
    if (!label && el.closest('label')) label = txt(el.closest('label'));
    return { type: el.type || '', desc: [el.name, el.id, el.placeholder, label, el.getAttribute('aria-label'), el.getAttribute('autocomplete')].filter(Boolean).join(' | '), text: txt(el).slice(0, 80) };
  });
}

(async () => {
  let plan;
  try { plan = JSON.parse(process.argv[2]); } catch (e) { await say({ error: 'plan is not valid JSON: ' + e.message }); process.exit(1); }
  const browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1366, height: 900 });
  let lastInspect = null;
  for (const [i, a] of plan.entries()) {
    const k = Object.keys(a)[0];
    const v = a[k];
    try {
      if (k === 'goto') {
        const r = await page.goto(v, { waitUntil: 'networkidle2', timeout: 60000 }).catch(() => null);
        await sleep(2000);
        await say({ i, goto: v, status: r ? r.status() : null, url: page.url(), title: await page.title() });
      } else if (k === 'inspect') {
        lastInspect = await page.evaluate(inspectPage);
        await say({ i, inspect: lastInspect });
      } else if (k === 'type') {
        const info = await elementInfo(page, v.selector);
        if (info.type === 'email' || info.type === 'tel' || info.type === 'password' || CONTACT.test(info.desc)) { await say({ i, refused: 'contact/personal field', field: info.desc }); continue; }
        if (!SAFE_TEXT.test(String(v.text))) { await say({ i, refused: 'only test ZIPs, dates, numbers or place names may be typed' }); continue; }
        await page.click(v.selector, { clickCount: 3 }).catch(() => {});
        await page.type(v.selector, String(v.text), { delay: 60 });
        await sleep(1200);
        await say({ i, typed: v.text, into: info.desc });
      } else if (k === 'select') {
        const info = await elementInfo(page, v.selector);
        if (CONTACT.test(info.desc)) { await say({ i, refused: 'contact/personal field', field: info.desc }); continue; }
        const chosen = await page.$eval(v.selector, (el, o) => {
          let idx = -1;
          if (o.index !== undefined) idx = o.index;
          else if (o.value !== undefined) idx = [...el.options].findIndex((x) => x.value === o.value);
          else if (o.label !== undefined) idx = [...el.options].findIndex((x) => x.text.trim().toLowerCase().includes(String(o.label).toLowerCase()));
          if (idx < 0) return null;
          el.selectedIndex = idx;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return el.options[idx].text.trim();
        }, v);
        await sleep(800);
        await say({ i, selected: chosen, in: info.desc });
      } else if (k === 'check') {
        const info = await elementInfo(page, v.selector);
        if (CONSENT.test(info.desc + ' ' + info.text)) { await say({ i, refused: 'consent/terms/marketing boxes are never ticked', field: info.desc }); continue; }
        await page.click(v.selector);
        await sleep(800);
        await say({ i, checked: info.desc || info.text });
      } else if (k === 'click') {
        const current = await page.evaluate(inspectPage);
        let selector = v.selector;
        if (!selector && v.text) {
          selector = await page.evaluate((t) => {
            const want = t.toLowerCase();
            const els = [...document.querySelectorAll('button,a,[role=button],[role=radio],[role=option],label,input[type=submit],input[type=button],div,span,li')]
              .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; })
              .filter((el) => ((el.innerText || el.value || '').replace(/\s+/g, ' ').trim().toLowerCase() === want));
            const el = els.sort((a, b) => a.children.length - b.children.length)[0];
            if (!el) return null;
            el.setAttribute('data-amc-click', '1');
            return '[data-amc-click="1"]';
          }, v.text);
        }
        if (!selector) { await say({ i, error: 'no visible element with that text' }); continue; }
        const info = await elementInfo(page, selector);
        if (current.contactRequested && SUBMIT_LIKE.test(info.text || info.desc)) { await say({ i, refused: 'contact details are requested on this screen; not clicking a submit-like control', control: info.text }); continue; }
        await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}), page.click(selector)]);
        await sleep(2500);
        await page.evaluate(() => document.querySelectorAll('[data-amc-click]').forEach((e) => e.removeAttribute('data-amc-click')));
        await say({ i, clicked: info.text || info.desc, url: page.url() });
      } else if (k === 'press') {
        await page.keyboard.press(v);
        await sleep(1500);
        await say({ i, pressed: v });
      } else if (k === 'wait') {
        await sleep(Math.min(+v, 15000));
        await say({ i, waited: v });
      } else if (k === 'scroll') {
        await page.evaluate((y) => window.scrollBy(0, y), +v);
        await sleep(800);
        await say({ i, scrolled: v });
      } else if (k === 'text') {
        const out = await page.evaluate((o) => { const el = o.selector ? document.querySelector(o.selector) : document.querySelector('main') || document.body; return el ? (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, o.max || 1500) : null; }, v || {});
        await say({ i, text: out });
      } else if (k === 'links') {
        const re = v.match || '.';
        const out = await page.evaluate((r) => [...new Set([...document.links].map((a) => a.href).filter((h) => new RegExp(r, 'i').test(h)))].slice(0, 60), re);
        await say({ i, links: out });
      } else if (k === 'screenshot') {
        const dir = path.join(__dirname, 'agents');
        fs.mkdirSync(dir, { recursive: true });
        await page.screenshot({ path: path.join(dir, String(v).replace(/[^a-z0-9_-]/gi, '_') + '.jpg'), type: 'jpeg', quality: 45 });
        await say({ i, screenshot: v });
      } else {
        await say({ i, error: 'unknown action ' + k });
      }
    } catch (e) {
      await say({ i, action: k, error: e.message.slice(0, 300) });
    }
  }
  await browser.close();
  await say({ done: true });
})();
