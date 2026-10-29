import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base = (process.env.E2E_WEB_URL ?? "http://localhost:3000").replace(/\/+$/, "");
const families = ["/", "/moving-costs/", "/movers/texas/austin/", "/routes/", "/explore/", "/get-quotes/", "/privacy/", "/for-movers/", "/mover-terms/"];

for (const path of families) for (const width of [1440,390]) test(`closing survey is usable before the footer on ${path} at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width > 1000 ? 1000 : 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect((await page.goto(base + path))?.status()).toBe(200);
  const closing = page.locator("#main > [data-closing-survey]");
  await expect(closing).toHaveCount(1);
  expect(await closing.evaluate(node => node === document.querySelector("#main")?.lastElementChild && document.querySelector("#main")?.nextElementSibling?.tagName === "FOOTER")).toBe(true);
  const carrier = path.startsWith("/for-movers/") || path === "/mover-terms/";
  await expect(closing).toHaveAttribute("data-audience", carrier ? "carrier" : "consumer");
  await expect(closing.locator(`[data-vsh-starter="${carrier ? "carrier" : "quote"}"]`)).toHaveCount(1);
  await expect(closing.locator('input[type="email"],input[type="tel"],input[type="checkbox"]')).toHaveCount(0);
  await closing.scrollIntoViewIfNeeded();
  await expect(closing.locator("[data-closing-photo] img")).toBeVisible();
  const action = closing.getByRole("button", { name: carrier ? "See my carrier next step" : "Add details to my move", exact: true });
  expect((await action.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const duplicates = await page.evaluate(() => {
    const allIds = [...document.querySelectorAll<HTMLElement>("[id]")].map(node => node.id);
    const formIds = [...document.querySelectorAll<HTMLElement>(".vsh form [id],.vsh form[id],[data-closing-survey] [id]")].map(node => node.id);
    return [...new Set(formIds.filter(id => allIds.filter(other => other === id).length > 1))];
  });
  expect(duplicates).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  const axe = await new AxeBuilder({ page }).include("[data-closing-survey]").analyze();
  expect(axe.violations.map(issue => ({id:issue.id,targets:issue.nodes.map(node => node.target)}))).toEqual([]);
});

test("the closing starter keeps its route independent and carries only approved move fields without POST", async ({ page }) => {
  const posts: string[] = [];
  page.on("request", request => { if (request.method() === "POST") posts.push(new URL(request.url()).pathname); });
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key,value) { if(key === "amc.survey.prefill") original.call(this,"test.closing-prefill",value); return original.call(this,key,value); };
  });
  await page.goto(base + "/moving-costs/");
  const hero = page.locator(".vsh .vsh-start");
  const closing = page.locator("[data-closing-survey] [data-vsh-starter=quote]");
  await expect(closing).toHaveAttribute("data-ready","true");
  await hero.getByLabel("Moving from · ZIP code").fill("02108");
  await hero.getByLabel("Moving to · ZIP code").fill("10001");
  await closing.getByRole("button", {name:"Add details to my move"}).click();
  await expect(closing.getByLabel("Moving from · ZIP code")).toBeFocused();
  await closing.getByLabel("Moving from · ZIP code").fill("75201");
  await closing.getByLabel("Moving to · ZIP code").fill("77002");
  await expect(hero.getByLabel("Moving from · ZIP code")).toHaveValue("02108");
  await expect(hero.getByLabel("Moving to · ZIP code")).toHaveValue("10001");
  await closing.getByRole("button", {name:"Add details to my move"}).click();
  await closing.getByLabel("What are you moving?").selectOption("2br");
  await closing.getByRole("button", {name:"Change these ZIP codes"}).click();
  await expect(closing.getByLabel("Moving from · ZIP code")).toHaveValue("75201");
  await closing.getByRole("button", {name:"Add details to my move"}).click();
  await closing.getByRole("button", {name:"Open my moving request"}).click();
  await expect(page).toHaveURL(base + "/get-quotes/");
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("test.closing-prefill")!))).toEqual({entry:"household",originZip:"75201",destZip:"77002",moveSize:"2br"});
  expect(posts).toEqual([]);
  expect(new URL(page.url()).search).toBe("");
});

test("the closing carrier check is independent and never submits company information", async ({ page }) => {
  const posts: string[] = [];
  page.on("request",request => {if(request.method()==="POST")posts.push(request.url());});
  await page.goto(base + "/for-movers/");
  const hero=page.locator(".vsh [data-carrier-starter]");
  const closing=page.locator("[data-closing-survey] [data-carrier-starter]");
  await expect(closing).toHaveAttribute("data-ready","true");
  await closing.getByLabel("Your company's authority").selectOption("broker");
  await closing.getByRole("button",{name:"See my carrier next step"}).click();
  await expect(closing.getByRole("heading",{name:"Carrier authority only."})).toBeFocused();
  await expect(hero.getByLabel("Your company's authority")).toHaveValue("");
  await expect(closing.getByRole("link",{name:"Continue to carrier application"})).toHaveCount(0);
  expect(posts).toEqual([]);
});

test("the closing starter on the quote page re-enters the real survey with its new move details", async ({ page }) => {
  await page.goto(base + "/get-quotes/");
  const closing=page.locator("[data-closing-survey] [data-vsh-starter=quote]");
  await expect(closing).toHaveAttribute("data-ready","true");
  await closing.getByLabel("Moving from · ZIP code").fill("75201");
  await closing.getByLabel("Moving to · ZIP code").fill("77002");
  await closing.getByRole("button",{name:"Add details to my move"}).click();
  await closing.getByLabel("What are you moving?").selectOption("2br");
  await closing.getByRole("button",{name:"Open my moving request"}).click();
  const real=page.locator("#hero-survey");
  await expect(real.getByLabel("ZIP code you're moving from")).toHaveValue("75201");
  await expect(real.getByLabel("ZIP code you're moving to")).toHaveValue("77002");
  await expect(real).toContainText("Check the answers we carried over");
  expect(await page.evaluate(()=>sessionStorage.getItem("amc.survey.prefill"))).toBeNull();
  expect(new URL(page.url()).search).toBe("");
});

test("without JavaScript the closing starter keeps the native quote handoff free of query data", async ({ browser }) => {
  const context=await browser.newContext({javaScriptEnabled:false});
  try{
    const page=await context.newPage();
    await page.goto(base+"/privacy/",{waitUntil:"domcontentloaded"});
    const closing=page.locator("[data-closing-survey] [data-vsh-starter=quote]");
    await closing.getByLabel("Moving from · ZIP code").fill("75201");
    await closing.getByLabel("Moving to · ZIP code").fill("77002");
    expect(await closing.evaluate(form=>[...new FormData(form as HTMLFormElement).keys()])).toEqual([]);
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/get-quotes\/\??$/,{timeout:15_000});
    expect(new URL(page.url()).search).toBe("");
  }finally{await context.close();}
});
