import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const base=(process.env.E2E_WEB_URL??"http://localhost:3000").replace(/\/+$/,"");

test("national map names all51 states/district with native links and northeastern callouts",async({page})=>{
  await page.setViewportSize({width:1440,height:1000});
  await page.emulateMedia({reducedMotion:"reduce"});
  expect((await page.goto(base+"/"))?.status()).toBe(200);
  const map=page.locator(".state-guide-map"),national=map.locator(".state-guide-map-viewport");
  await map.scrollIntoViewIfNeeded();
  await expect(national).toBeVisible();
  await expect(national.locator("a.state-guide-map-link")).toHaveCount(51);
  await expect(national.locator("[data-state-name]")).toHaveCount(51);
  expect(await national.locator("[data-state-name]").evaluateAll(nodes=>new Set(nodes.map(node=>node.getAttribute("data-state-name"))).size)).toBe(51);
  await expect(national.locator(".state-guide-map-callout")).toHaveCount(9);
  for(const state of["California","Texas","North Carolina","Rhode Island","District of Columbia"]){
    const label=national.locator(`[data-state-name="${state}"]`);
    await expect(label).toBeVisible();
    expect((await label.boundingBox())!.height).toBeGreaterThan(10);
  }
  const hrefs=await national.locator("a.state-guide-map-link").evaluateAll(nodes=>nodes.map(node=>node.getAttribute("href")));
  expect(new Set(hrefs).size).toBe(51);
  expect(hrefs.every(href=>/^\/movers\/[a-z-]+\/$/.test(href??""))).toBe(true);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  const axe=await new AxeBuilder({page}).include(".state-guide-map").analyze();
  expect(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
});

for(const width of[320,390,768])test(`state atlas fits ${width}px without sideways scrolling and keeps native names`,async({page})=>{
  await page.setViewportSize({width,height:844});
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto(base+"/");
  const map=page.locator(".state-guide-map"),atlas=map.getByRole("group",{name:"State guides by region"});
  await atlas.scrollIntoViewIfNeeded();
  await expect(map.locator(".state-guide-map-viewport")).not.toBeVisible();
  await expect(atlas.locator(".state-guide-atlas-link")).toHaveCount(51);
  await expect(atlas.locator("details")).toHaveCount(5);
  const hrefs=await atlas.locator(".state-guide-atlas-link").evaluateAll(nodes=>nodes.map(node=>node.getAttribute("href")));
  expect(new Set(hrefs).size).toBe(51);
  await atlas.locator("summary").filter({hasText:"Northeast"}).click();
  const rhode=atlas.locator('[data-state-code="RI"]');
  await rhode.focus();
  await expect(rhode).toBeFocused();
  await expect(rhode.locator("[data-state-name]")).toBeInViewport({ratio:.8});
  expect((await rhode.locator("[data-state-name]").boundingBox())!.height).toBeGreaterThan(12);
  await atlas.locator("summary").filter({hasText:"Southwest"}).click();
  await expect(atlas.locator("details[open]")).toHaveCount(1);
  await expect(atlas.locator('[data-state-code="TX"]')).toBeVisible();
  const overflow=await map.evaluate(node=>[node,...node.querySelectorAll<HTMLElement>("*")].filter(element=>element instanceof HTMLElement&&element.getClientRects().length&&getComputedStyle(element).display!=="none").filter(element=>element.scrollWidth>element.clientWidth+1).map(element=>({tag:element.tagName,className:element.className,extra:element.scrollWidth-element.clientWidth})));
  expect(overflow).toEqual([]);
  await expect(page.locator("#home-guide-library-guide-state")).toBeAttached();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth)).toBeLessThanOrEqual(1);
  const axe=await new AxeBuilder({page}).include(".state-guide-map").analyze();
  expect(axe.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))).toEqual([]);
});

for(const width of[390,1440])test(`a labeled state remains a working native link without JavaScript at ${width}px`,async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false,viewport:{width,height:1000}});
  try{
    const page=await context.newPage();
    await page.goto(base+"/",{waitUntil:"domcontentloaded"});
    if(width<900)await page.locator('.state-guide-map-atlas').getByText("West",{exact:true}).click();
    const link=page.locator(`.state-guide-map-${width<900?"atlas":"viewport"} [data-state-code="CA"]`);
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
