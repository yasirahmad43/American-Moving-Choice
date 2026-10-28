/** Steps the scenarios share: accessibility checks, signing in and small date helpers. */
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";
import { APP_URL, seedLogin } from "./env";

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Fails on any serious or critical axe violation (WCAG 2.2 AA tags), naming the rule and nodes. */
export async function expectNoSeriousAxeViolations(page: Page, label = page.url()) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), `axe ${label}`).toEqual([]);
}

/** Fails on any axe violation at all (the quote pages are held to this). */
export async function expectNoAxeViolations(page: Page, label = page.url()) {
  const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`), `axe ${label}`).toEqual([]);
}

/** Signs the seeded mover owner (Demo Lone Star Relocation Co.) in to the portal. */
export async function signInMover(page: Page) {
  const { email, password } = seedLogin("mover");
  await page.goto(`${APP_URL}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(`${APP_URL}/portal`);
}

/** A local calendar date n days from today, as YYYY-MM-DD (for date inputs). */
export function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** A US phone number in the 555 range that's different on every run, so repeat-request grouping doesn't join runs. */
export function uniquePhone(areaCode = "214"): string {
  return `${areaCode}555${String(Math.floor(1000 + Math.random() * 8999))}`;
}

/** Letters only, for names that must be unique per run (the survey's name fields refuse digits). */
export function uniqueLetters(length = 6): string {
  return Array.from({ length }, () => String.fromCharCode(97 + Math.floor(Math.random() * 26))).join("");
}
