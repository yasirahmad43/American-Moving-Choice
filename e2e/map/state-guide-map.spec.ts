import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base=(process.env.E2E_WEB_URL??"http://localhost:3000").replace(/\/+$/,"");

test("national map names all51 states/district with native links and northeastern callouts",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:"reduce"});
  expect((await page.goto(base+"/"))?.status()).toBe(200);
  const map=page.locator(".state-guide-map");
  await map.scrollIntoViewIfNeeded();
  await expect(map.locator("a.state-guide-map-link")).toHaveCount(51);
  await expect(map.locator("[data-state-name]")).toHaveCount(51);
  expect(await map.locator("[data-state-name]").evaluateAll(nodes=>new Set(nodes.map(node=>node.getAttribute("data-state-name"))).size)).toBe(51);
  await expect(map.locator(".state-guide-map-callout")).toHaveCount(9);
  for(const state of["California","Texas","North Carolina","Rhode Island","District of Columbia"]){
    const label=map.locator(`[data-state-name="${state}"]`);
    await expect(label).toBeVisible();
    expect((await label.boundingBox())!.height).toBeGreaterThan(10);
  }
  const hrefs=await map.locator("a.state-guide-map-link").evaluateAll(nodes=>nodes.map(node=>node.getAttribute("href")));
  expect(new Set(hrefs).size).toBe(51);
  expect(hrefs.every(href=>/^\/movers\/[a-z-]+\/$/.test(href??""))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  const axe=await new AxeBuilder({page}).include(".state-guide-map").analyze();
  expect(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
});

test("mobile map keeps readable names, keyboard scrolling and the native state selector",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(base+"/");
  const map=page.locator(".state-guide-map"),viewport=map.getByRole("region",{name:"State guide map and labels"});
  await viewport.scrollIntoViewIfNeeded();
  await viewport.focus();
  const before=await viewport.evaluate(node=>node.scrollLeft);
  await page.keyboard.press("ArrowRight");
  await expect.poll(()=>viewport.evaluate(node=>node.scrollLeft)).toBeGreaterThan(before);
  const rhode=map.locator('[data-state-code="RI"]');
  await rhode.focus();
  await expect(rhode).toBeFocused();
  await expect(rhode.locator("[data-state-name]")).toBeInViewport({ratio:.8});
  expect((await rhode.locator("[data-state-name]").boundingBox())!.height).toBeGreaterThan(12);
  await expect(page.locator("#home-guide-library-guide-state")).toBeAttached();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  const axe=await new AxeBuilder({page}).include(".state-guide-map").analyze();
  expect(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
});

test("a labeled state remains a working native link without JavaScript",async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:1000}});
  try{
    const page=await context.newPage();
    await page.goto(base+"/",{waitUntil:"domcontentloaded"});
    const link=page.locator('.state-guide-map [data-state-code="CA"]');
    await expect(link.locator('[data-state-name="California"]')).toBeVisible();
    await link.focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(base+"/movers/california/",{timeout:15_000});
    await expect(page.locator("h1")).toContainText("California");
  }finally{await context.close();}
});

for(const route of["/movers/texas/austin/","/for-movers/"])test(`all document IDs are distinct after the narrow fixes on ${route}`,async({page})=>{
  await page.goto(base+route);
  const duplicates=await page.evaluate(()=>{const ids=[...document.querySelectorAll<HTMLElement>("[id]")].map(node=>node.id);return[...new Set(ids.filter((id,index)=>ids.indexOf(id)!==index))];});
  expect(duplicates).toEqual([]);
  if(route.includes("austin")){
    const tables=page.locator(".dt[id]");
    expect(await tables.count()).toBeGreaterThan(1);
    const ids=await tables.evaluateAll(nodes=>nodes.map(node=>node.id));
    expect(ids.every(id=>/^seo-movers-texas-austin-s\d+-b\d+(?:-cost)?$/.test(id))).toBe(true);
  }else{
    await expect(page.locator("radialGradient#carrier-apply-route-glow")).toHaveCount(1);
    await expect(page.locator("radialGradient#site-footer-route-glow")).toHaveCount(1);
  }
});
