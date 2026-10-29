import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = (process.env.E2E_WEB_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");

for (const route of ["/moving-costs/", "/movers/texas/austin/", "/routes/", "/explore/"]) {
  for (const width of [1440, 390]) {
    test(`distinct landmarks on ${route} at ${width}px`, async ({ browser }) => {
      // The names are native server markup; this context proves they do not depend on hydration.
      const native = await browser.newContext({ javaScriptEnabled: false, viewport: { width, height: width === 390 ? 844 : 1000 } });
      try {
        const page = await native.newPage();
        expect((await page.goto(base + route, { waitUntil: "domcontentloaded" }))?.status()).toBe(200);
        if (route === "/moving-costs/") {
          const regions = page.locator('.table-wrap[role="region"]');
          expect(await regions.count()).toBeGreaterThan(1);
          const labels = await regions.evaluateAll(nodes => nodes.map(node => node.getAttribute("aria-label")));
          expect(new Set(labels).size).toBe(labels.length);
          expect(labels.every(label => label && /: Table \d+ \(scrolls/.test(label))).toBe(true);
          await expect(regions.first().locator("table")).toBeAttached();
        } else if (route.includes("austin")) {
          const captions = await page.locator(".dt table > caption").allTextContents();
          expect(captions.length).toBeGreaterThan(1);
          expect(new Set(captions).size).toBe(captions.length);
          expect(captions.every(caption => caption.trim() && caption !== "Table")).toBe(true);
          expect(captions.some(caption => /Austin.*: table \d+\.\d+/.test(caption))).toBe(true);
        } else if (route === "/routes/") {
          await expect(page.getByRole("region", { name: "Published guides: Moving routes", exact: true })).toBeAttached();
          await expect(page.locator("#browse-guides")).not.toHaveAttribute("aria-label", "Moving routes");
        } else {
          await expect(page.locator(".catalog-controls")).toHaveJSProperty("tagName", "DIV");
          await expect(page.getByRole("navigation", { name: "Browse guide categories" })).toBeAttached();
          await expect(page.getByRole("search", { name: "Search all guides and public pages" })).toHaveAttribute("method", "get");
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
      } finally { await native.close(); }

      // axe injects its analyzer, so it runs separately in an enhanced context.
      const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, reducedMotion: "reduce" });
      try {
        const page = await context.newPage();
        await page.goto(base + route, { waitUntil: "domcontentloaded" });
        await page.evaluate(() => document.fonts.ready);
        const issues = (await new AxeBuilder({ page }).include("main").analyze()).violations;
        expect(issues.map(issue => ({ id: issue.id, impact: issue.impact, targets: issue.nodes.map(node => node.target) }))).toEqual([]);
      } finally { await context.close(); }
    });
  }
}
