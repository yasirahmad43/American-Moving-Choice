import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { APP_URL, WEB_URL } from "./env";
import { expectNoSeriousAxeViolations, signInMover } from "./helpers";

const proof = process.env.AMC_PROOF_DIR ?? resolve("test-results/design-pass-2");
async function capture(page: Page, name: string, fullPage = false) {
  await mkdir(proof, { recursive: true });
  await page.screenshot({ path: resolve(proof, name + ".png"), fullPage });
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

test.describe("design pass 2", () => {
  for (const width of [1440, 390]) {
    test("public design is accessible and quote-first at " + width + "px", async ({ page }) => {
      await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(WEB_URL + "/");
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(/A better move\.\s*On your terms\./);
      await expect(page.getByRole("button", { name: "Get my moving quotes" })).toBeVisible();
      await expect(page.locator('a[href^="/companies/"],a[href^="/directory/"]')).toHaveCount(0);
      await expectNoSeriousAxeViolations(page);
      await noOverflow(page);
      await capture(page, "home-" + (width > 1000 ? "desktop" : "mobile"));
      await capture(page, "home-" + (width > 1000 ? "desktop" : "mobile") + "-full", true);
      await page.goto(WEB_URL + "/get-quotes/");
      await expect(page.getByText(/Demo Lone Star|Preferred Mover/)).toHaveCount(0);
      await noOverflow(page);
      await capture(page, "quote-" + (width > 1000 ? "desktop" : "mobile"));
    });
  }

  test("ambient video pause survives scrolling and reduced motion removes playback", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(WEB_URL + "/");
    const video = page.locator(".home-hero-film video");
    const pause = page.getByRole("button", { name: "Pause background video", exact: true });
    await expect(video).toHaveJSProperty("paused", false, { timeout: 15000 });
    await pause.click();
    await expect(video).toHaveJSProperty("paused", true);
    await expect(page.getByRole("button", { name: "Play background video", exact: true })).toBeVisible();
    await page.getByRole("heading", { name: /Good questions\.\s*Clear answers\./ }).scrollIntoViewIfNeeded();
    await page.getByRole("heading", { level: 1 }).scrollIntoViewIfNeeded();
    await expect(video).toHaveJSProperty("paused", true);
    await page.getByRole("button", { name: "Play background video", exact: true }).click();
    await expect(video).toHaveJSProperty("paused", false);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(video).toHaveJSProperty("paused", true);
    await expect(video).not.toHaveAttribute("src", /.+/);
    await expect(page.getByRole("button", { name: /background video/ })).toHaveCount(0);
  });

  test("portal tables sort and remain readable in mobile card mode", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await signInMover(page);
    await capture(page, "portal-desktop");
    await page.goto(APP_URL + "/portal/leads");
    const sort = page.getByRole("button", { name: "Sort by Customer", exact: true });
    await expect(sort).toBeVisible();
    await sort.click();
    await expect(page.locator('th[aria-sort="ascending"]')).toHaveCount(1);
    const customerNames = await page.locator('tbody td[data-col="customer"] a').allTextContents();
    expect(customerNames.length).toBeGreaterThan(1);
    expect(customerNames).toEqual([...customerNames].sort((a, b) => a.localeCompare(b, "en", { numeric: true, sensitivity: "base" })));
    await capture(page, "purchased-requests-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole("combobox", { name: "Sort displayed rows" }).first()).toBeVisible();
    await noOverflow(page);
    await capture(page, "purchased-requests-mobile", true);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(APP_URL + "/portal/marketplace?view=list");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await noOverflow(page);
    await expectNoSeriousAxeViolations(page);
    await capture(page, "marketplace-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    await noOverflow(page);
    await expectNoSeriousAxeViolations(page);
    const select = page.getByRole("combobox", { name: "Sort displayed rows" }).first();
    if (await select.count()) await expect(select).toBeVisible();
    await capture(page, "marketplace-mobile", true);
  });
});
