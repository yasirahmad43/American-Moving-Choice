import { describe, expect, it } from "vitest";
import { selectRouteCohort, type RouteEndpoint } from "../src/seo/route-cohort";
import { representativePoints } from "../src/seo/route-geography";

const endpoint = (id: number, stateCode: string, slug: string, lat: number, lng: number, population = 200_000): RouteEndpoint => ({ id, stateCode, slug, name: slug, lat, lng, population, placeGeoid: `${stateCode}-${slug}`, zips: [] });
describe("route cohort geography", () => {
  it("chooses real out-of-state endpoints and excludes noncontiguous/unknown geography", () => {
    const rows = [endpoint(1,"TX","origin",30,-97,20_000),endpoint(2,"OK","nearest",35,-97),endpoint(3,"NY","farther",41,-74),endpoint(4,"AK","alaska",61,-149),endpoint(5,"HI","hawaii",21,-157),endpoint(6,"XX","invalid",29,-96)];
    const cohort = selectRouteCohort(rows);
    expect(cohort.find((pair) => pair.origin.slug === "origin")!.destination.slug).toBe("nearest");
    expect(cohort.every((pair) => pair.origin.stateCode !== pair.destination.stateCode && !["AK","HI","XX"].includes(pair.origin.stateCode) && !["AK","HI","XX"].includes(pair.destination.stateCode))).toBe(true);
    expect(cohort.every((pair) => pair.distanceMiles > 0 && Number.isFinite(pair.distanceMiles))).toBe(true);
  });
  it("is independent of row order/IDs and deduplicates Census-place aliases semantically", () => {
    const first=endpoint(1,"TX","a-origin",30,-97,20_000),alias={...first,id:99,slug:"z-alias"};
    const rows=[first,alias,endpoint(2,"OK","destination",35,-97),endpoint(3,"NY","other",41,-74)];
    const select=(input:RouteEndpoint[])=>selectRouteCohort(input).map((pair)=>({slug:pair.slug,distance:pair.distanceMiles}));
    expect(select(rows)).toEqual(select([...rows].reverse().map((row,index)=>({...row,id:500+index}))));
    expect(selectRouteCohort(rows).filter((pair)=>pair.origin.placeGeoid===first.placeGeoid)).toHaveLength(1);
    expect(selectRouteCohort(rows).some((pair)=>pair.origin.slug==="z-alias")).toBe(false);
  });
  it("samples existing points across geography with stable order, no fabricated defaults or duplicate keys", () => {
    const points=[{key:"center",lat:30,lng:-97},{key:"east",lat:30,lng:-96},{key:"west",lat:30,lng:-98},{key:"near",lat:30,lng:-96.99},{key:"invalid",lat:NaN,lng:0}];
    const a=representativePoints(points,3,{lat:30,lng:-97}),b=representativePoints([...points].reverse(),3,{lat:30,lng:-97});
    expect(a).toEqual(b);
    expect(a.map((point)=>point.key)).toEqual(["center","east","west"]);
    expect(representativePoints([],8,{lat:30,lng:-97})).toEqual([]);
    expect(representativePoints(points,0,{lat:30,lng:-97})).toEqual([]);
  });
});
