import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = (process.env.E2E_WEB_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const target = base + (process.env.AMC_HERO_TEST_PATH ?? "/moving-costs/");
const prefillKey = "amc.survey.prefill";

for (const width of [1440, 390, 360]) {
  test(`cinematic hero has one video/H1, usable starter and no accessibility failures at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect((await page.goto(target))?.status()).toBe(200);
    const hero = page.locator(".vsh");
    await expect(hero).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    const video = hero.locator("video");
    await expect(video).toHaveCount(1);
    await expect(video).toHaveAttribute("poster", /\S+/);
    await expect(video).not.toHaveAttribute("src", /\S+/);
    await expect(hero.getByRole("button", { name: /background video/ })).toHaveCount(0);
    const starter = hero.locator(".vsh-start");
    await expect(starter).toHaveAttribute("data-ready", "true");
    await expect(starter.getByLabel("Moving from · ZIP code")).toBeVisible();
    await expect(starter.locator('input[type="email"],input[type="tel"],input[type="checkbox"]')).toHaveCount(0);
    expect(await starter.getByLabel("Moving from · ZIP code").evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    if (width > 1000) {
      const copy = await hero.locator(".vsh__copy").boundingBox();
      const survey = await hero.locator(".vsh__survey").boundingBox();
      expect(survey!.x).toBeGreaterThan(copy!.x + copy!.width);
      expect(survey!.y).toBeLessThan(copy!.y + 70);
    } else {
      const action = hero.getByRole("link", { name: "Plan my move", exact: false });
      const bounds = await action.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
      await action.click();
      await expect(hero.locator("#hero-survey")).toBeFocused();
      await expect(starter.getByLabel("Moving from · ZIP code")).toBeInViewport();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const axe = await new AxeBuilder({ page }).include(".vsh").analyze();
    expect(axe.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) }))).toEqual([]);
  });
}

test("starter validates, preserves back-navigation and hands only move details to the real survey", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "amc.survey.prefill") original.call(this, "test.hero-prefill", value);
      return original.call(this, key, value);
    };
  });
  await page.goto(target);
  const starter = page.locator(".vsh-start");
  await expect(starter).toHaveAttribute("data-ready", "true");
  await starter.getByRole("button", { name: "Continue to move details" }).click();
  await expect(starter.getByLabel("Moving from · ZIP code")).toBeFocused();
  await starter.getByLabel("Moving from · ZIP code").fill("02108");
  await starter.getByLabel("Moving to · ZIP code").fill("10001");
  await starter.getByRole("button", { name: "Continue to move details" }).click();
  await expect(starter.getByRole("heading", { name: "Make it your move." })).toBeFocused();
  await expect(starter.getByLabel("What are you moving?")).toHaveValue("");
  await starter.getByRole("button", { name: "Edit route" }).click();
  await expect(starter.getByLabel("Moving from · ZIP code")).toHaveValue("02108");
  await expect(starter.getByLabel("Moving to · ZIP code")).toHaveValue("10001");
  await starter.getByRole("button", { name: "Continue to move details" }).click();
  await starter.getByRole("button", { name: "Continue to my request" }).click();
  await expect(starter.getByLabel("What are you moving?")).toBeFocused();
  await starter.getByLabel("What are you moving?").selectOption("2br");
  const future = new Date(); future.setDate(future.getDate() + 30);
  const moveDate = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;
  await starter.getByLabel("Move date · optional").fill(moveDate);
  await starter.getByRole("button", { name: "Continue to my request" }).click();
  await expect(page).toHaveURL(base + "/get-quotes/");
  expect(new URL(page.url()).search).toBe("");
  const carried = await page.evaluate(() => JSON.parse(sessionStorage.getItem("test.hero-prefill")!));
  expect(carried).toEqual({ entry: "household", originZip: "02108", destZip: "10001", moveSize: "2br", moveDate });
  await expect.poll(() => page.evaluate(() => JSON.parse(sessionStorage.getItem("amc.survey.draft") ?? "{}").moveDate)).toBe(moveDate);
  const draft = await page.evaluate(() => JSON.parse(sessionStorage.getItem("amc.survey.draft")!));
  expect(draft).toMatchObject({ originZip: "02108", destZip: "10001", moveSize: "2br", moveDate });
  expect(Object.keys(draft).filter((key) => ["firstName", "lastName", "email", "phone", "consent", "termsAccepted", "channels"].includes(key))).toEqual([]);
});

test("blocked session storage still opens the survey without putting move data in its URL", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "amc.survey.prefill") throw new DOMException("Storage blocked", "SecurityError");
      return original.call(this, key, value);
    };
  });
  await page.goto(target);
  const starter = page.locator(".vsh-start");
  await expect(starter).toHaveAttribute("data-ready", "true");
  await starter.getByLabel("Moving from · ZIP code").fill("02108");
  await starter.getByLabel("Moving to · ZIP code").fill("10001");
  await starter.getByRole("button", { name: "Continue to move details" }).click();
  await starter.getByLabel("What are you moving?").selectOption("studio");
  await starter.getByRole("button", { name: "Continue to my request" }).click();
  await expect(page).toHaveURL(base + "/get-quotes/");
  expect(new URL(page.url()).search).toBe("");
  expect(await page.evaluate((key) => sessionStorage.getItem(key), prefillKey)).toBeNull();
});

test("without JavaScript the starter opens a clean quote URL and keeps the still poster", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(target, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".vsh video")).toHaveAttribute("poster", /\S+/);
    await page.getByLabel("Moving from · ZIP code").fill("02108");
    await page.getByLabel("Moving to · ZIP code").fill("10001");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/get-quotes\/\??$/, { timeout: 15_000 });
    expect(new URL(page.url()).search).toBe("");
  } finally { await context.close(); }
});

test("video controls stay reachable, preserve Pause and stop playback for reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(target);
  const video = page.locator(".vsh__media video");
  const pause = page.getByRole("button", { name: "Pause background video", exact: true });
  await expect(pause).toBeVisible();
  expect(await pause.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
  expect(await pause.evaluate((el) => {
    const box = el.getBoundingClientRect();
    return el.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  })).toBe(true);
  await expect(video).toHaveJSProperty("paused", false, { timeout: 20_000 });
  await pause.click();
  await expect(video).toHaveJSProperty("paused", true);
  await page.locator("footer").last().scrollIntoViewIfNeeded();
  await page.locator(".vsh").scrollIntoViewIfNeeded();
  await expect(video).toHaveJSProperty("paused", true);
  await page.getByRole("button", { name: "Play background video", exact: true }).click();
  await expect(video).toHaveJSProperty("paused", false);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(video).toHaveJSProperty("paused", true);
  await expect(video).not.toHaveAttribute("src", /\S+/);
});
