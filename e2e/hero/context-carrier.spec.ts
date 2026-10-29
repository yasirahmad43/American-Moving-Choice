import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = (process.env.E2E_WEB_URL ?? "http://localhost:3000").replace(/\/+$/, "");

test("Austin's ZIP examples remain hints and never overwrite the visitor's route", async ({ page }) => {
  await page.goto(base + "/movers/texas/austin/");
  const form = page.locator(".vsh .vsh-start");
  await expect(form).toHaveAttribute("data-ready", "true");
  await expect(form.locator(".vsh-start__heading")).toContainText("Austin");
  const origin = form.getByLabel("Moving from · ZIP code");
  const destination = form.getByLabel("Moving to · ZIP code");
  await expect(origin).toHaveAttribute("placeholder", /^e\.g\. \d{5}$/);
  await expect(origin).not.toHaveAttribute("placeholder", "e.g. 02108");
  await expect(origin).toHaveValue("");
  await expect(destination).toHaveValue("");
  await origin.fill("75201");
  await destination.fill("77002");
  await form.getByRole("button", { name: "Continue to move details" }).click();
  await form.getByRole("button", { name: "Edit route" }).click();
  await expect(origin).toHaveValue("75201");
  await expect(destination).toHaveValue("77002");
  expect(await page.evaluate(() => sessionStorage.getItem("amc.survey.prefill"))).toBeNull();
  expect(new URL(page.url()).search).toBe("");
});

const retiredCompanyPages = [
  "/for-movers/",
  "/for-movers/moving-leads/",
  "/for-movers/pricing/",
  "/for-movers/eligibility/",
  "/for-movers/reviews-and-reputation/",
  "/for-movers/apply/",
  "/mover-terms/",
];

for (const path of retiredCompanyPages) test(`retired company page ${path} is unavailable rather than a sales page or signup redirect`, async ({ request }) => {
  const response = await request.get(base + path, { maxRedirects: 0 });
  expect(response.status()).toBe(404);
  expect(response.headers().location).toBeUndefined();
});

for (const width of [1440,390]) test(`public home keeps its consumer hero without company recruitment at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await page.goto(base + "/"))?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator(".vsh video[poster]")).toHaveCount(1);
  const form = page.locator('.vsh [data-vsh-starter="quote"]');
  await expect(form).toHaveAttribute("data-ready", "true");
  await expect(form).toHaveCount(1);
  await expect(page.locator("[data-carrier-starter]")).toHaveCount(0);
  await expect(form.getByLabel("Moving from · ZIP code")).toHaveValue("");
  await expect(form.getByLabel("Moving to · ZIP code")).toHaveValue("");
  await expect(page.locator('a[href^="/for-movers"],a[href^="/mover-terms"],a[href$="/signup"],a[href$="/signup/"]')).toHaveCount(0);
  if (width < 1000) {
    const action = page.locator(".vsh__mobile-action");
    await expect(action).toHaveText(/Plan my move/);
    const bounds = await action.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(44);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
    await action.click();
    await expect(page.locator("#hero-survey")).toBeFocused();
  } else {
    const formBounds = await form.boundingBox();
    const copyBounds = await page.locator(".vsh__copy").boundingBox();
    expect(formBounds!.x).toBeGreaterThan(copyBounds!.x + copyBounds!.width);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(v => v.impact === "serious" || v.impact === "critical").map(v => ({id:v.id,targets:v.nodes.map(n => n.target)}))).toEqual([]);
});

test("without JavaScript a retired pricing bookmark stays unavailable and offers consumer navigation", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    expect((await page.goto(base + "/for-movers/pricing/", { waitUntil: "domcontentloaded" }))?.status()).toBe(404);
    await expect(page).toHaveURL(base + "/for-movers/pricing/");
    await expect(page.getByRole("heading", { level: 1, name: "We can't find that page" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Go to the home page", exact: true })).toBeVisible();
    await expect(page.locator("[data-carrier-starter]")).toHaveCount(0);
    await expect(page.locator('a[href^="/for-movers"],a[href^="/mover-terms"],a[href$="/signup"],a[href$="/signup/"]')).toHaveCount(0);
    expect(new URL(page.url()).search).toBe("");
  } finally { await context.close(); }
});
