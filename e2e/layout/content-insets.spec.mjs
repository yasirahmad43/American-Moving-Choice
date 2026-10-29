import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { inspectTextInsetContract } from "./content-inset-detector.mjs";

const css = readFileSync(new URL("../../apps/web/components/site/content-insets.css", import.meta.url), "utf8");
const base = (process.env.E2E_WEB_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");
const assertInsets = async page => {
  await page.evaluate(() => document.fonts.ready);
  const results = await page.evaluate(inspectTextInsetContract);
  expect(results.length).toBeGreaterThan(0);
  expect(results.filter(item => !item.pass), "Visible text must retain its inset from the painted shell").toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
};

test("inset protection survives token failure and conflicting late padding without padding image shells", async ({ page }) => {
  for (const tokens of ["", "--content-inset-card:initial;--content-inset-compact:initial", "--content-inset-card:0;--content-inset-compact:0", "--content-inset-card:broken;--content-inset-compact:broken"]) {
    for (const contractFirst of [false, true]) {
      const conflict = `.site-experience{${tokens}}#copy,#compact{padding:0}`;
      await page.setContent(`<style>*{box-sizing:border-box}body,h3,p{margin:0}body{font:16px/1.5 sans-serif}.outer{border:1px solid;width:280px}.image{height:50px;background:#ddd}${contractFirst ? css + conflict : conflict + css}</style><div class="site-experience"><article class="outer"><div class="image"></div><div id="copy" data-content-inset="card"><h3>Room to read</h3><p>Every line stays inside its card.</p></div></article><div class="outer" id="compact" data-content-inset="compact"><p>Compact record</p></div></div>`);
      await assertInsets(page);
      expect(await page.locator(".image").evaluate(e => e.getBoundingClientRect().left - e.parentElement.getBoundingClientRect().left)).toBe(1);
    }
  }
  // A closed disclosure still has visible summary text; its body stays excluded.
  await page.setContent(`<style>*{box-sizing:border-box}p{margin:0}${css}</style><div class="site-experience"><details data-content-inset="compact"><summary>Visible closed question</summary><p style="position:absolute;left:-99px">Hidden answer</p></details></div>`);
  const closed = await page.evaluate(inspectTextInsetContract);
  expect(closed).toHaveLength(1);
  expect(closed[0].pass).toBe(true);
  // Calibrate the test: it must catch both missing padding and visually projected copy.
  await page.setContent('<div class="site-experience"><div style="border:1px solid;padding:0" data-content-inset="card"><p>Too close</p></div></div>');
  expect((await page.evaluate(inspectTextInsetContract)).some(item => !item.pass)).toBe(true);
});

for (const width of [320, 390, 768, 1440]) {
  test(`public cards and client navigation keep readable insets at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    // Never send customer data while checking public layout.
    await context.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
    for (const path of ["/", "/get-quotes/", "/moving-costs/", "/explore/", "/routes/", "/which-companies-receive-my-request/"]) {
      await page.goto(base + path);
      await page.locator(".site-experience main").waitFor();
      await assertInsets(page);
      if (path === "/" && width < 1200) {
        // All state names must retain spacing when their native regions are opened.
        for (const summary of await page.locator(".state-guide-region > summary").all()) {
          await summary.click();
          await assertInsets(page);
        }
      }
    }
    await page.goto(base + "/");
    await page.locator('[data-vsh-starter][data-ready="true"]').first().waitFor();
    const timeOrigin = await page.evaluate(() => performance.timeOrigin);
    await page.locator('footer a[href="/get-quotes/"]').first().click();
    await page.waitForURL(base + "/get-quotes/");
    await page.locator(".quote-survey-full form").waitFor();
    await page.locator('header a[href="/"]').first().click();
    await page.waitForURL(base + "/");
    await page.locator('[data-vsh-starter][data-ready="true"]').first().waitFor();
    await page.locator(".home-benefit-grid").scrollIntoViewIfNeeded();
    await assertInsets(page);
    expect(await page.evaluate(() => performance.timeOrigin)).toBe(timeOrigin);
  });
}
