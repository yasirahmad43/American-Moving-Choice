/**
 * Slice S3 scenarios: the moving cost calculator on the demo seed, and a rate-card edit in the
 * portal that supersedes the old card and changes the calculator's output (build plan §7.3).
 */
import { expect, test, type Page } from "@playwright/test";
import { APP_URL, WEB_URL, seedLogin } from "./env";
import { inDays } from "./helpers";

const CALCULATOR = `${WEB_URL}/moving-cost-calculator/`;

async function calculate(page: Page, origin: string, destination: string, size: string) {
  await page.goto(CALCULATOR);
  await page.getByLabel("Moving from (ZIP)").fill(origin);
  await page.getByLabel("Moving to (ZIP)").fill(destination);
  await expect(page.getByTestId("route-summary")).toBeVisible();
  await page.getByRole("radio", { name: size }).check();
  await page.getByRole("button", { name: "Calculate the range" }).click();
}

/** The range in the label, such as "$3,000 to $3,200". */
async function rangeShown(page: Page): Promise<string> {
  const text = (await page.getByTestId("range-label").textContent()) ?? "";
  const match = /\$[\d,]+ to \$[\d,]+/.exec(text);
  if (!match) throw new Error(`no range in "${text}"`);
  return match[0];
}

test.describe("moving cost calculator", () => {
  test("Dallas 75201 to Houston 77002, 2 bedrooms, shows a labeled range from at least 5 movers", async ({ page }) => {
    await page.goto(CALCULATOR);
    await expect(page.getByRole("heading", { level: 1, name: "Moving cost calculator" })).toBeVisible();
    // Nothing preselected; the hint lists every missing answer.
    await expect(page.getByTestId("progress")).toHaveText("Still needed: moving-from ZIP code, moving-to ZIP code and move size");
    expect(await page.getByRole("radio", { checked: true }).count()).toBe(0);
    expect(await page.getByRole("checkbox", { checked: true }).count()).toBe(0);

    await page.getByLabel("Moving from (ZIP)").fill("75201");
    await expect(page.getByText("Dallas, TX", { exact: true })).toBeVisible();
    await page.getByLabel("Moving to (ZIP)").fill("77002");
    const summary = page.getByTestId("route-summary");
    await expect(summary).toContainText("Dallas, TX to Houston, TX");
    await expect(summary).toContainText(/\d+ miles in a straight line between ZIP code centers/);
    await expect(summary).toContainText("In-state long distance");

    // Submitting without a size names the problem and focuses it.
    await page.getByRole("button", { name: "Calculate the range" }).click();
    await expect(page.getByText("Choose a move size.")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Studio" })).toBeFocused();

    await page.getByRole("radio", { name: "2 bedrooms" }).check();
    await expect(page.getByTestId("progress")).toHaveText("Nothing else needed.");
    await page.getByRole("button", { name: "Calculate the range" }).click();

    const heading = page.getByRole("heading", { level: 2, name: "Result for this move" });
    await expect(heading).toBeFocused();
    const label = page.getByTestId("range-label");
    await expect(label).toContainText("Planning range, not a quote:");
    await expect(label).toContainText("for a 2-bedroom home, in-state long distance, 0 to 250 miles");
    await expect(label).toContainText(/model cost-model-v1/);
    const basis = /rate cards from (\d+) movers serving Texas/.exec((await label.textContent()) ?? "");
    expect(Number(basis?.[1])).toBeGreaterThanOrEqual(5);
    await expect(label.getByRole("link", { name: "How this range is calculated" })).toHaveAttribute("href", "/moving-cost-calculator/method/#how-is-the-range-built");
    await expect(page.getByTestId("st-6")).toContainText("Movers set their own prices.");
    await expect(page.getByRole("heading", { level: 3, name: "What the range leaves out" })).toBeVisible();
    await expect(page.getByTestId("money-line")).toContainText("Free to request.");
    // Answers never reach the address.
    expect(page.url()).toBe(CALCULATOR);

    // A changed answer dims the result and hides the call to action until the reader calculates again.
    await page.getByRole("checkbox", { name: "Packing" }).check();
    await expect(page.getByText("You changed an answer. Calculate the range again to update it.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Request moving quotes" })).toHaveCount(0);
    await page.getByRole("button", { name: "Calculate the range" }).click();
    await expect(page.getByText("Services: packing", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Request moving quotes" }).click();
    await expect(page).toHaveURL(`${WEB_URL}/get-quotes/`);
    // The survey reads the calculator's prefill once (then clears it) and shows every carried
    // answer for confirmation, starting at Where.
    await expect(page.getByText("Check the answers we carried over")).toBeVisible();
    expect(await page.evaluate(() => sessionStorage.getItem("amc.survey.prefill"))).toBeNull();
    await expect(page.getByLabel("ZIP code you're moving from")).toHaveValue("75201");
    await expect(page.getByLabel("ZIP code you're moving to")).toHaveValue("77002");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel("Move date").fill(inDays(30));
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByLabel("2 bedrooms")).toBeChecked();
    await expect(page.getByLabel("Packing")).toBeChecked();
  });

  test("a Wyoming ZIP pair shows the not-enough-data state with the next step", async ({ page }) => {
    await calculate(page, "82001", "82601", "2 bedrooms");
    await expect(page.getByRole("heading", { level: 2, name: "Not enough data for a range yet" })).toBeFocused();
    await expect(page.getByText(/A range needs rate cards from at least 5 different movers/)).toBeVisible();
    await expect(page.getByText("Continue with your move details and choose your contact preferences.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Request moving quotes" })).toBeVisible();
    await expect(page.getByTestId("range-label")).toHaveCount(0);
  });

  test("ZIP problems are named with the copy's errors", async ({ page }) => {
    await page.goto(CALCULATOR);
    await page.getByLabel("Moving from (ZIP)").fill("M5V 2T6");
    await page.getByLabel("Moving to (ZIP)").fill("99999");
    await expect(page.getByText("We can't find ZIP code 99999. Check the number.")).toBeVisible();
    await page.getByRole("button", { name: "Calculate the range" }).click();
    await expect(page.getByText("That isn't a US ZIP code. We can show ranges only for moves within the US.")).toBeVisible();
    await expect(page.getByLabel("Moving from (ZIP)")).toBeFocused();
    await page.getByRole("radio", { name: "Office" }).check();
    await page.getByLabel("Moving from (ZIP)").fill("75201");
    await page.getByLabel("Moving to (ZIP)").fill("77002");
    await page.getByRole("button", { name: "Calculate the range" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "No range for this kind of move" })).toBeVisible();
  });
});

test.describe("rate-card editor", () => {
  test("saving a card supersedes the old one and changes the calculator's output", async ({ page }) => {
    await calculate(page, "75201", "77002", "2 bedrooms");
    const before = await rangeShown(page);

    const { email, password } = seedLogin("mover");
    await page.goto(`${APP_URL}/login`);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(`${APP_URL}/portal`);

    await page.goto(`${APP_URL}/portal/rates`);
    await expect(page.getByRole("heading", { level: 1, name: "Rate card" })).toBeVisible();
    await expect(page.getByText("Your card never affects placement.")).toBeVisible();
    // Move this mover's 0–250-mile rate to the far end of the area's rates (alternating ends, so a
    // rerun against the same database changes the range again).
    const field = page.getByLabel("0 to 250 miles ($ per 100 lb)");
    const current = Number((await field.inputValue()) || "0");
    await field.fill(current > 100 ? "40" : "250");
    // A validation problem first: an unreadable amount.
    await page.getByLabel("2 movers ($ per hour)").fill("12x");
    await page.getByRole("button", { name: "Save rate card" }).click();
    await expect(page.getByText("Enter an amount in dollars, such as 129 or 129.50.")).toBeVisible();
    await expect(page.getByLabel("2 movers ($ per hour)")).toBeFocused();
    await page.getByLabel("2 movers ($ per hour)").fill("129");
    await page.getByRole("button", { name: "Save rate card" }).click();
    await expect(page.getByText(/Rate card saved\./)).toBeVisible();
    await expect(page.getByRole("cell", { name: "Replaced" }).first()).toBeVisible();

    await calculate(page, "75201", "77002", "2 bedrooms");
    expect(await rangeShown(page)).not.toBe(before);
  });
});
