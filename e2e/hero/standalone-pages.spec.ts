import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = (process.env.E2E_WEB_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const pages = ["/get-quotes/", "/moving-cost-calculator/", "/verify-a-mover/"];
const tool = (path: string) => path === "/moving-cost-calculator/" ? { label: "Use cost calculator", target: "#planning-calculator" } : path === "/verify-a-mover/" ? { label: "Check a USDOT number", target: "#lookup-heading" } : null;

for (const path of pages) for (const width of [1440, 390]) {
  test(`${path} keeps a usable cinematic hero and five distinct photos at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    expect((await page.goto(base + path))?.status()).toBe(200);
    const hero = page.locator(".vsh");
    await expect(hero).toHaveCount(1);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(hero.locator("video[poster]")).toHaveCount(1);
    expect(await page.locator("[data-page-photo]").evaluateAll((nodes) => new Set(nodes.map((node) => node.getAttribute("data-page-photo"))).size)).toBeGreaterThanOrEqual(5);
    if (path === "/get-quotes/") {
      await expect(hero.locator(".vsh-start")).toHaveCount(0);
      await expect(hero.getByRole("radio", { name: "Moving my home", exact: false })).toBeVisible();
      await expect(hero.getByRole("button", { name: "Continue", exact: true })).toBeVisible();
    } else {
      await expect(hero.locator(".vsh-start")).toHaveAttribute("data-ready", "true");
      await expect(hero.getByLabel("Moving from · ZIP code")).toBeVisible();
    }
    if (width > 1000) {
      const form = await hero.locator("#hero-survey").boundingBox();
      const copy = await hero.locator(".vsh__copy").boundingBox();
      expect(form!.y).toBeLessThan(250);
      expect(form!.x).toBeGreaterThan(copy!.x + copy!.width);
      const task = tool(path);
      if (task) {
        const action = hero.getByRole("link", { name: task.label, exact: false });
        await expect(action).toHaveAttribute("href", task.target);
        expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        await action.click();
        await expect(page.locator(task.target)).toBeFocused();
      }
    } else {
      const task = tool(path);
      const action = hero.getByRole("link", { name: task?.label ?? "Plan my move", exact: false });
      const bounds = await action.boundingBox();
      expect(bounds!.height).toBeGreaterThanOrEqual(44);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
      await action.click();
      await expect(page.locator(task?.target ?? "#hero-survey")).toBeFocused();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter((v) => v.impact === "serious" || v.impact === "critical").map((v) => ({ id: v.id, targets: v.nodes.map((node) => node.target) }))).toEqual([]);
  });
}

test("the real quote survey keeps route validation and back navigation in its hero", async ({ page }) => {
  await page.goto(base + "/get-quotes/");
  const survey = page.locator("#hero-survey");
  await survey.getByRole("radio", { name: "Moving my home", exact: false }).check();
  await survey.getByRole("button", { name: "Continue", exact: true }).click();
  await survey.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(survey.getByLabel("ZIP code you're moving from", { exact: false })).toBeFocused();
  await survey.getByLabel("ZIP code you're moving from", { exact: false }).fill("75201");
  await survey.getByLabel("ZIP code you're moving to", { exact: false }).fill("77002");
  await survey.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(survey.getByRole("heading", { name: "When are you moving?" })).toBeVisible();
  await survey.getByRole("button", { name: "Back", exact: true }).click();
  await expect(survey.getByLabel("ZIP code you're moving from", { exact: false })).toHaveValue("75201");
  await expect(survey.getByLabel("ZIP code you're moving to", { exact: false })).toHaveValue("77002");
  expect(new URL(page.url()).search).toBe("");
});

test("the calculator still validates and calculates without a quote request", async ({ page }) => {
  await page.goto(base + "/moving-cost-calculator/");
  const calculator = page.locator("#planning-calculator");
  await expect(calculator.locator("[data-calculator-ready]")).toHaveAttribute("data-calculator-ready", "true");
  await calculator.getByRole("button", { name: "Calculate the range" }).click();
  await expect(calculator.getByLabel("Moving from (ZIP)")).toBeFocused();
  await calculator.getByLabel("Moving from (ZIP)").fill("75201");
  await calculator.getByLabel("Moving to (ZIP)").fill("77002");
  await calculator.getByRole("radio", { name: "2 bedrooms", exact: true }).check();
  await calculator.getByRole("button", { name: "Calculate the range" }).click();
  await expect(calculator.getByTestId("route-summary")).toContainText("Dallas");
  await expect(calculator.getByTestId("result-area")).toContainText(/Planning range|not enough|don't have enough|no range/i, { timeout: 20_000 });
  expect(new URL(page.url()).search).toBe("");
});

test("calculator answers cannot enter a native GET when JavaScript is unavailable", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(base + "/moving-cost-calculator/", { waitUntil: "domcontentloaded" });
    const calculator = page.locator("#planning-calculator");
    await expect(calculator.getByRole("button", { name: "Calculate the range" })).toBeDisabled();
    await calculator.getByLabel("Moving from (ZIP)").fill("75201");
    await calculator.getByLabel("Moving to (ZIP)").fill("77002");
    await calculator.getByRole("radio", { name: "2 bedrooms", exact: true }).check();
    expect(await calculator.locator("form").evaluate((form) => Array.from(new FormData(form as HTMLFormElement).keys()))).toEqual([]);
    await calculator.getByLabel("Moving to (ZIP)").focus();
    await page.keyboard.press("Enter");
    expect(new URL(page.url()).pathname).toBe("/moving-cost-calculator/");
    expect(new URL(page.url()).search).toBe("");
    await expect(calculator.locator("noscript")).toBeVisible();
    expect(await calculator.locator("noscript").textContent()).toContain("The calculator needs JavaScript.");
  } finally { await context.close(); }
});

test("the mover verification tool still reads a demo record without URL data", async ({ page }) => {
  await page.goto(base + "/verify-a-mover/");
  await page.getByLabel("USDOT or MC number").fill("9000001");
  await page.getByRole("button", { name: "Look up", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Result for USDOT 9000001" })).toBeVisible();
  await expect(page.getByText("Demo data: fictional records", { exact: true })).toBeVisible();
  expect(new URL(page.url()).search).toBe("");
});
