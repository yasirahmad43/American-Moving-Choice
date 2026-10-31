import {publicNetworkSummary,suppressUnverifiedNetworkEvidence} from "./public-network-evidence.ts";

const page=()=>({h1:"Movers in Austin, TX",title:"Movers in Austin, TX",metaDescription:"Austin moving guidance; 2 network movers cover interstate moves.",sources:[{label:"Census housing data",url:"https://www.census.gov/",accessedOn:"2026-10-28"}],content:{intro:{answer:"Austin has 74 ZIP codes and 967,862 residents in 466,428 housing units. As of today, 5 network movers can receive local moves and 2 network movers can receive interstate moves.",dataPoints:[{label:"ZIP codes",value:"74",basis:"GeoNames postal codes"},{label:"Movers for moves between states",value:"2",basis:"American Moving Choice coverage rules"}]},sections:[{id:"county",heading:"Travis County facts",blocks:[{type:"paragraph",text:"Travis County has 1,000 residents in 500 housing units; county-based coverage rules can include these places; the survey checks exact route eligibility."}]},{id:"zips",heading:"Austin ZIP codes",blocks:[{type:"table",columns:["ZIP","Population","Housing units","Local rule counts (named / total matches)"],rows:[["78704","51,000","25,000","0 named / 2 matches"]]}]}],faq:[{question:"How many movers cover Austin?",answer:"2 network movers cover these moves."}],quote:{text:"Choose the maximum number of participating companies that may contact you. Companies introduce themselves when they reach out."}}});

describe("public network evidence projection",()=>{
  it("normalizes full-page and catalog titles without claiming verified participants",()=>{
    for(const claim of ["Screened Carriers With Active Authority","Vetted Carriers","Verified Carriers","Network Movers"]){
      const source={title:`Interstate Movers: ${claim}`,h1:"Interstate movers",url:"/services/interstate/"};
      const result=publicNetworkSummary(source);
      expect(result.title).toBe("Interstate Movers");expect(result.h1).toBe(source.h1);expect(source.title).toContain(claim);
      expect(publicNetworkSummary(result)).toEqual(result);
    }
    expect(publicNetworkSummary({title:"Movers in Austin, TX: compare screened moving companies",h1:"Movers in Austin, TX: compare screened moving companies"}).h1).toBe("Movers in Austin, TX");
    const guidance={title:"How to check a mover's authority",h1:"How to verify a mover"};
    expect(publicNetworkSummary(guidance)).toEqual(guidance);
  });
  it("removes availability sentences and clauses while retaining genuine geographic facts",()=>{
    const source=page();
    source.content.sections.push({id:"legacy-count-note",heading:"Note",blocks:[{type:"note",text:"Coverage counts are recomputed when movers change their rules."}]});
    const before=JSON.stringify(source);const result=suppressUnverifiedNetworkEvidence(source);
    expect(result.content.intro.answer).toBe("Austin has 74 ZIP codes and 967,862 residents in 466,428 housing units.");
    expect(result.content.sections[0].blocks[0].text).toBe("Travis County has 1,000 residents in 500 housing units.");
    expect(result.content.intro.dataPoints).toEqual([source.content.intro.dataPoints[0]]);
    expect(result.metaDescription).toBe("Austin moving guidance.");
    expect(result.content.faq).toEqual([]);
    expect(result.content.sections.some(section=>section.id==="legacy-count-note")).toBe(false);
    expect(JSON.stringify(source)).toBe(before);
    expect(suppressUnverifiedNetworkEvidence(result)).toEqual(result);
  });
  it("removes internal count columns and retains postal, Census rows and actual contact-limit wording",()=>{
    const result=suppressUnverifiedNetworkEvidence(page());const table=result.content.sections[1].blocks[0];
    expect(table.columns).toEqual(["ZIP","Population","Housing units"]);
    expect(table.rows).toEqual([["78704","51,000","25,000"]]);
    expect(result.content.quote.text).toContain("maximum number of participating companies");
    expect(JSON.stringify(result)).not.toMatch(/network movers|rule counts|named.*matches|coverage rules/iu);
  });
  it("preserves legal insurance coverage, eligibility conditions and primary source monetary facts",()=>{
    const source=page();source.content.sections=[{id:"legal",heading:"Interstate protection",blocks:[{type:"paragraph",text:"Insurance coverage and mover valuation are different. A qualifying arbitration claim may be eligible under the program. Claims of $10,000 or less follow the stated federal conditions."}]}];
    expect(suppressUnverifiedNetworkEvidence(source).content.sections[0]).toEqual(source.content.sections[0]);
    expect(suppressUnverifiedNetworkEvidence(source).sources).toEqual(source.sources);
  });
});
