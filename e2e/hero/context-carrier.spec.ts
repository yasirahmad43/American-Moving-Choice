import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = (process.env.E2E_WEB_URL ?? "http://localhost:3000").replace(/\/+$/, "");

test("Austin's ZIP examples remain hints and never overwrite the visitor's route", async ({ page }) => {
  await page.goto(base + "/movers/texas/austin/");
  const form = page.locator(".vsh-start");
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

for (const width of [1440,390]) test(`carrier landing has its own usable right-hand check and five photos at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await page.goto(base + "/for-movers/"))?.status()).toBe(200);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator(".vsh video[poster]")).toHaveCount(1);
  const form = page.locator("[data-carrier-starter]");
  await expect(form).toHaveCount(1);
  await expect(page.locator(".vsh-start:not([data-carrier-starter])")).toHaveCount(0);
  await expect(form.getByLabel("Your company's authority")).toHaveValue("");
  expect(await page.locator("[data-page-photo]").evaluateAll(nodes => new Set(nodes.map(node => node.getAttribute("data-page-photo"))).size)).toBe(5);
  if (width < 1000) {
    const action = page.locator(".vsh__mobile-action");
    await expect(action).toHaveText(/Check carrier eligibility/);
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

test("carrier orientation distinguishes broker records without collecting or sending data", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", request => { if (request.method() === "POST") requests.push(request.url()); });
  await page.goto(base + "/for-movers/");
  const form = page.locator("[data-carrier-starter]");
  await form.getByRole("button", { name: "Check my next step" }).click();
  await expect(form.getByLabel("Your company's authority")).toBeFocused();
  await form.getByLabel("Your company's authority").selectOption("broker");
  await form.getByRole("button", { name: "Check my next step" }).click();
  await expect(form.getByRole("heading", { name: "Carrier authority only." })).toBeFocused();
  await expect(form.getByRole("link", { name: "Start my application" })).toHaveCount(0);
  await expect(form.getByRole("link", { name: "Read the eligibility rules" })).toHaveAttribute("href", "/for-movers/eligibility/");
  await form.getByRole("button", { name: "Change my answer" }).click();
  await expect(form.getByLabel("Your company's authority")).toBeFocused();
  await form.getByLabel("Your company's authority").selectOption("carrier");
  await form.getByRole("button", { name: "Check my next step" }).click();
  await expect(form.getByRole("link", { name: "Start my application" })).toHaveAttribute("href", /\/signup$/);
  await expect(form).toContainText("Approval still depends on our screening.");
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => sessionStorage.getItem("amc.survey.prefill"))).toBeNull();
  expect(new URL(page.url()).search).toBe("");
});

test("without JavaScript the carrier check opens the eligibility guide with a clean URL", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(base + "/for-movers/", { waitUntil: "domcontentloaded" });
    await page.getByLabel("Your company's authority").selectOption("carrier");
    await page.locator("[data-carrier-starter] button[type=submit]").focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/for-movers\/eligibility\/\??$/, { timeout: 15_000 });
    expect(new URL(page.url()).search).toBe("");
  } finally { await context.close(); }
});
