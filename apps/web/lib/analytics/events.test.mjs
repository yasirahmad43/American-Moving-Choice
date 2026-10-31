import { analyticsPayload, publicAnalyticsPath, safeReferrerOrigin } from "./events.ts";
import { decodeAnalyticsConsent, CONSENT_MAX_AGE_MS } from "./consent.ts";

describe("privacy-safe analytics contract",()=>{
  it("allows public canonical pages while excluding private records and postal/token paths",()=>{
    for(const path of ["/","/get-quotes/","/movers/texas/austin/","/routes/austin-tx-to-dallas-tx/","/questions/what-is-the-110-percent-rule/","/planning/page/2/"])expect(publicAnalyticsPath(path),path).toBe(path);
    for(const path of ["/my-request/secret-token/","/get-quotes/confirmation/","/admin/","/report-a-concern/","/companies/provider/review/","/movers/texas/78704/","/get-quotes/?email=owner@example.com","/questions/0123456789abcdef0123456789abcdef/","/questions/2026-11-01/","/unknown/"])expect(publicAnalyticsPath(path),path).toBeNull();
  });
  it("constructs an allowlisted payload and cannot forward answers or private referrer details",()=>{
    const extra={step:"contact",placement:"survey",email:"private@example.com",phone:"2025550123",zip:"78704",moveDate:"2026-11-01",moveSize:"studio",leadId:"private-request-id",url:"https://example.test/my-request/private-token/"};
    const payload=analyticsPayload("survey_step","/get-quotes/","https://www.americanmovingchoice.com","https://search.example/find?email=private@example.com#private-token",extra);
    expect(payload).toEqual({event:"survey_step",page_location:"https://www.americanmovingchoice.com/get-quotes/",page_path:"/get-quotes/",page_referrer:"https://search.example",page_title:"American Moving Choice | Quote request",step_name:"contact",form_placement:"survey"});
    expect(JSON.stringify(payload)).not.toMatch(/private|2025550123|78704|2026-11|studio/iu);
    expect(safeReferrerOrigin("https://www.americanmovingchoice.com/my-request/private-token/","https://www.americanmovingchoice.com")).toBe("");
  });
  it("rejects unknown event values and permits conversion only on the public submission page",()=>{
    expect(analyticsPayload("form_submit","/get-quotes/","https://amc.example","",{})).toBeNull();
    expect(analyticsPayload("survey_step","/get-quotes/","https://amc.example","",{step:"private@example.com"})).toBeNull();
    for(const path of ["/","/get-quotes/confirmation/","/my-request/token/"])expect(analyticsPayload("generate_lead",path,"https://amc.example","")).toBeNull();
    expect(analyticsPayload("generate_lead","/get-quotes/","https://amc.example","").event).toBe("generate_lead");
  });
  it("keeps optional measurement off for absent, malformed, future or expired preferences",()=>{
    const now=1_800_000_000_000;
    expect(decodeAnalyticsConsent(null,now)).toBeNull();expect(decodeAnalyticsConsent("not JSON",now)).toBeNull();
    expect(decodeAnalyticsConsent(JSON.stringify({version:1,choice:"granted",savedAt:now}),now)).toBe("granted");
    expect(decodeAnalyticsConsent(JSON.stringify({version:1,choice:"denied",savedAt:now}),now)).toBe("denied");
    for(const savedAt of [now+1,now-CONSENT_MAX_AGE_MS-1])expect(decodeAnalyticsConsent(JSON.stringify({version:1,choice:"granted",savedAt}),now)).toBeNull();
  });
});
