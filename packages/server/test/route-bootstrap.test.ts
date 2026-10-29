import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { closePool, getPool } from "../src/db/pool";
import { generateFamily } from "../src/seo/generate";
import { importGeo } from "../src/seo/geo-import";
import { publishPages } from "../src/seo/publish";
import { bootstrapRoutes, ROUTE_BOOTSTRAP_VERSION, validatePublishedRoutes } from "../src/seo/route-bootstrap";
import { resetDatabase } from "./helpers";

beforeAll(async()=>{await resetDatabase();await importGeo(getPool(),{metroCount:2,intrastatePerState:2,topPerStateForCities:0});});
afterAll(closePool);
describe("protected route expansion and resume",()=>{
  it("keeps saved route source/content unchanged even when imported geography changes",async()=>{
    const db=getPool();await generateFamily(db,"route",{only:["texas-to-colorado"],limit:1});await publishPages(db,{family:"route"});
    const snapshot=async()=> (await db.query("select title,meta_description,h1,content,content_hash,sources,media_ids,primary_keyword from seo_pages where url='/routes/texas-to-colorado/'")).rows[0];
    const before=await snapshot();await db.query("update seo_states set zip_count=zip_count+100 where code='TX'");
    const result=await generateFamily(db,"route",{only:["texas-to-colorado"],limit:1,preserveExisting:true,refreshQuality:true});
    expect(result.written).toBe(0);expect(await snapshot()).toEqual(before);
    expect((await db.query("select status,indexable,unique_share from seo_pages where url='/routes/texas-to-colorado/'")).rows[0]).toMatchObject({status:"published",indexable:true,unique_share:1});
  });
  it("scores saved interrupted drafts on resume without overwriting their content",async()=>{
    const db=getPool();await expect(generateFamily(db,"route",{only:["texas-to-florida"],limit:1,chunkSize:1,onProgress:async()=>{throw new Error("intentional interrupted chunk");}})).rejects.toThrow("intentional interrupted chunk");
    const before=(await db.query("select content_hash,content from seo_pages where url='/routes/texas-to-florida/'")).rows[0];
    expect((await db.query("select status,indexable from seo_pages where url='/routes/texas-to-florida/'")).rows[0]).toEqual({status:"draft",indexable:false});
    const result=await generateFamily(db,"route",{only:["texas-to-florida"],limit:1,preserveExisting:true,refreshQuality:true});expect(result.written).toBe(0);
    const after=(await db.query("select content_hash,content,unique_share,gate_results from seo_pages where url='/routes/texas-to-florida/'")).rows[0];
    expect({content_hash:after.content_hash,content:after.content}).toEqual(before);expect(after.unique_share).not.toBeNull();expect(after.gate_results.unique.detail).not.toContain("pending");
  });
  it("uses the new evidence brief for legacy candidate rows, including metadata",async()=>{
    const db=getPool();const candidate=(await db.query("select slug from seo_routes where reason='metro_pair' and origin_state not in('AK','HI') and destination_state not in('AK','HI') order by slug limit 1")).rows[0];
    await generateFamily(db,"route",{only:[candidate.slug],limit:1,routeEvidenceBrief:true});
    const page=(await db.query("select title,meta_description,content from seo_pages where url=$1",[`/routes/${candidate.slug}/`])).rows[0];
    expect(page.title).toContain("Distance, Housing & Planning");
    expect(page.meta_description).not.toMatch(/road miles|driving days/i);
    expect(JSON.stringify(page.content)).not.toMatch(/\b\d[\d,]*(?:\.\d+)?\s+(?:road (?:miles|mi)|driving days?)\b/i);
    expect(page.content.sections.some((section:{id:string})=>section.id==="zip-geography")).toBe(true);
    expect(page.content.sections.some((section:{id:string})=>section.id==="relocation-budget-context")).toBe(true);
  });
  it("refuses competing deployment leases and never lowers the two-thousand-route requirement",async()=>{
    const db=getPool();await db.query("insert into seo_bootstrap_runs(version,owner_token,lease_until)values($1,$2,now()+interval '10 minutes')",[ROUTE_BOOTSTRAP_VERSION,randomUUID()]);
    await expect(bootstrapRoutes(db,{log:()=>undefined})).rejects.toThrow("another deployment");
    await db.query("update seo_bootstrap_runs set completed_at=now(),owner_token=null,lease_until=null where version=$1",[ROUTE_BOOTSTRAP_VERSION]);
    await expect(validatePublishedRoutes(db)).rejects.toThrow("2000 required");await expect(bootstrapRoutes(db,{log:()=>undefined})).rejects.toThrow("2000 required");
  });
});
