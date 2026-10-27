// Keeps one headless Chromium running so a guided quote walk can span several runplan.js calls.
// Usage: node browserd.js &   (run inside the capture sandbox; then AMC_ATTACH=1 node runplan.js '<plan>')
// Writes the DevTools endpoint to /tmp/amc-browser.ws and exits when the browser closes.
'use strict';
const fs = require('fs');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const WS_FILE = '/tmp/amc-browser.ws';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

(async () => {
  const browser = await puppeteer.launch({ args: chromium.args, executablePath: await chromium.executablePath(), headless: true });
  const page = (await browser.pages())[0] || (await browser.newPage());
  await page.setUserAgent(UA);
  await page.setViewport({ width: 1366, height: 900 });
  fs.writeFileSync(WS_FILE, browser.wsEndpoint());
  console.log('browser ready');
  browser.on('disconnected', () => process.exit(0));
})();
