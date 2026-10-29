import { expect, test, type Page } from "@playwright/test";

const base = (process.env.E2E_WEB_URL ?? "http://127.0.0.1:3000").replace(/\/+$/, "");
const local = ["127.0.0.1", "localhost", "[::1]"].includes(new URL(base).hostname);
const future = new Date(); future.setDate(future.getDate() + 30);
const date = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, "0")}-${String(future.getDate()).padStart(2, "0")}`;

async function completeStarter(page: Page, selector: string, origin = "75201", destination = "77002") {
  const starter = page.locator(selector);
  await expect(starter).toHaveAttribute("data-ready", "true");
  await expect(starter).toContainText("Step 1 of 7");
  await starter.getByLabel("Moving from · ZIP code").fill(origin);
  await starter.getByLabel("Moving to · ZIP code").fill(destination);
  await starter.locator('button[type="submit"]').click();
  await expect(starter).toContainText("Step 2 of 7");
  await starter.getByLabel("What are you moving?").selectOption("2br");
  // Required once here, rather than asking for it again after leaving this page.
  await starter.locator('button[type="submit"]').click();
  await expect(starter.getByLabel("Estimated move date")).toBeFocused();
  await expect(starter.getByLabel("What are you moving?")).toHaveValue("2br");
  await starter.getByLabel("Estimated move date").fill(date);
  await starter.locator('button[type="submit"]').click();
  await page.waitForURL(base + "/get-quotes/");
  const full = page.locator(".quote-survey-full");
  await expect(full.getByRole("heading", { name: "Anything else for your move?" })).toBeVisible();
  await expect(full).toContainText("Step 3 of 7");
  await expect(full.locator('input[name="originZip"],input[name="destZip"],input[name="moveDate"],input[name="moveSize"]')).toHaveCount(0);
  await expect(full.getByRole("region", { name: "Your saved move" })).toContainText(`${origin} → ${destination}`);
  await expect(full).toContainText("2 bedrooms");
  expect(new URL(page.url()).search).toBe("");
  return full;
}

for (const width of [319, 390, 1440]) {
  test(`hero and closing starters continue at step3 and retain answers at ${width}px`, async ({ page, context }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    // This handoff scenario needs only GETs; no customer request or coverage action is sent.
    await context.route("**/*", route => ["GET", "HEAD"].includes(route.request().method()) ? route.continue() : route.abort());
    await page.goto(base + "/");
    await completeStarter(page, "#hero-survey .vsh-start");
    await page.goBack();
    await page.waitForURL(base + "/");
    const returnedStarter = page.locator("#hero-survey .vsh-start");
    await expect(returnedStarter).toHaveAttribute("data-ready", "true");
    await expect(returnedStarter.locator('button[type="submit"]')).toBeEnabled();
    await page.goForward();
    await page.waitForURL(base + "/get-quotes/");
    await expect(page.locator(".quote-survey-full")).toContainText("Step 3 of 7");
    await page.reload();
    await expect(page.locator(".quote-survey-full")).toContainText("Step 3 of 7");
    await expect(page.getByRole("heading", { name: "Anything else for your move?" })).toBeVisible();
    // Return with normal client navigation, then submit another independently owned starter.
    await page.locator('header a[href="/"]').click();
    await page.waitForURL(base + "/");
    await completeStarter(page, ".closing-survey .vsh-start", "02108", "10001");
    const draft = await page.evaluate(() => JSON.parse(sessionStorage.getItem("amc.survey.draft")!));
    expect(draft).toMatchObject({ starterComplete: true, step: "size", originZip: "02108", destZip: "10001", moveDate: date, moveSize: "2br" });
    for (const key of ["email", "phone", "firstName", "lastName", "channels", "consentChecked", "termsAccepted"]) expect(draft).not.toHaveProperty(key);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
  });
}

test("completed starter advances services, coverage, details, count and review without a step-one loop", async ({ page }) => {
  test.skip(!local, "Coverage and synthetic contact entry are tested only against the isolated local site.");
  await page.setExtraHTTPHeaders({ "x-forwarded-for": "198.51.100.229" });
  await page.goto(base + "/");
  let full = await completeStarter(page, "#hero-survey .vsh-start");
  await full.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(full).toContainText("Step 4 of 7");
  await expect(full.getByRole("heading", { name: "Your move details", exact: true })).toBeVisible();
  await full.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(full).toContainText("Step 5 of 7");
  await expect(full.getByRole("heading", { name: "Your details", exact: true })).toBeVisible();
  await full.getByLabel("Phone calls", { exact: true }).check();
  await full.locator("#channel-email").check();
  await full.getByLabel("First name", { exact: true }).fill("Survey");
  await full.getByLabel("Last name", { exact: true }).fill("Verification");
  await full.locator("#email").fill("survey-continuity@example.com");
  await full.getByLabel("Phone number", { exact: true }).fill("2025550168");
  await full.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(full).toContainText("Step 6 of 7");
  await full.locator('label[for="limit-2"]').click();
  await full.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(full).toContainText("Step 7 of 7");
  await expect(full.getByRole("heading", { name: "Review and send" })).toBeVisible();
  await expect(full.locator("#consent")).not.toBeChecked();
  await expect(full.locator("#terms")).not.toBeChecked();
  // Back/Continue retain answers, while changing contact scope requires fresh permission.
  // The final Send button is never clicked.
  await full.locator("#consent").check();
  await full.locator("#terms").check();
  await full.getByRole("button", { name: "Back", exact: true }).click();
  await expect(full).toContainText("Step 6 of 7");
  await expect(full.locator('input[name="limit"]:checked')).toHaveValue("2");
  await full.getByRole("button", { name: "Back", exact: true }).click();
  await expect(full).toContainText("Step 5 of 7");
  await full.locator("#channel-sms").check();
  await full.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(full).toContainText("Step 6 of 7");
  await full.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(full).toContainText("Step 7 of 7");
  await expect(full.locator("#consent")).not.toBeChecked();
  await expect(full.locator("#terms")).toBeChecked();
  await page.reload();
  full = page.locator(".quote-survey-full");
  await expect(full).toContainText("Step 3 of 7");
  await expect(full.getByRole("heading", { name: "Anything else for your move?" })).toBeVisible();
  await expect(full.locator('input[type="email"],input[type="tel"]')).toHaveCount(0);
});

test("saved route, date and size can be edited deliberately without redoing the starter", async ({ page }) => {
  test.skip(!local, "ZIP helper lookups stay on the isolated local site.");
  await page.goto(base + "/");
  const full = await completeStarter(page, "#hero-survey .vsh-start");
  await full.getByRole("button", { name: "Edit route", exact: true }).click();
  await expect(full.getByLabel("ZIP code you're moving from", { exact: true })).toHaveValue("75201");
  await full.getByLabel("ZIP code you're moving to", { exact: true }).fill("78701");
  await full.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(full).toContainText("Step 3 of 7");
  await expect(full.getByRole("region", { name: "Your saved move" })).toContainText("75201 → 78701");
  await full.getByRole("button", { name: "Edit date", exact: true }).click();
  await expect(full.getByLabel("Move date", { exact: true })).toHaveValue(date);
  await full.getByLabel("My dates are flexible", { exact: true }).check();
  await full.getByLabel("Latest date", { exact: true }).fill(date);
  await full.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(full).toContainText("Step 3 of 7");
  await full.getByRole("button", { name: "Edit home size", exact: true }).click();
  await full.getByLabel("3 bedrooms", { exact: true }).check();
  await expect(full.getByRole("region", { name: "Your saved move" })).toContainText("3 bedrooms");
  await full.getByRole("button", { name: "Edit route", exact: true }).click();
  await full.getByRole("button", { name: "Not a household move?", exact: true }).click();
  await expect(full).toContainText("Step 1 of 8");
  await expect(full.locator('input[name="need"]:checked')).toHaveCount(0);
  await expect(full.getByRole("heading", { name: "What do you need help with?" })).toBeVisible();
});
