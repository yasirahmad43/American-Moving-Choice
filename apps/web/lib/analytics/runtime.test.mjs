import {vi} from "vitest";

function browser(choice="granted",path="/get-quotes/"){
  const local=new Map(),session=new Map(),timers=[];
  if(choice)local.set("amc.analytics.consent.v1",JSON.stringify({version:1,choice,savedAt:Date.now()}));
  const store=map=>({getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)});
  const window={location:{pathname:path,hostname:"www.americanmovingchoice.com",reload:vi.fn()},localStorage:store(local),sessionStorage:store(session),setTimeout:fn=>{timers.push(fn);return timers.length;},dispatchEvent:vi.fn()};
  const document={referrer:"https://search.example/find?email=private@example.com",cookie:"",createElement:()=>({}),head:{appendChild:vi.fn()}};
  vi.stubGlobal("window",window);vi.stubGlobal("document",document);vi.stubGlobal("navigator",{});
  return {window,document,timers,local,session};
}
afterEach(()=>{vi.unstubAllGlobals();vi.resetModules();});
describe("consent-gated GTM runtime",()=>{
  it("does not load or queue measurement before permission or on a private page",async()=>{
    const first=browser(null);const runtime=await import("./runtime.ts");
    expect(runtime.initializeAnalytics("GTM-TEST1234","https://www.americanmovingchoice.com")).toBe(false);
    expect(first.document.head.appendChild).not.toHaveBeenCalled();expect(first.window.dataLayer).toBeUndefined();
    vi.resetModules();const second=browser("granted","/my-request/private-token/");const next=await import("./runtime.ts");
    expect(next.initializeAnalytics("GTM-TEST1234","https://www.americanmovingchoice.com")).toBe(false);
    expect(second.document.head.appendChild).not.toHaveBeenCalled();
  });
  it("initializes consent before the container and emits one pageview per public route",async()=>{
    const {window,document}=browser();const runtime=await import("./runtime.ts");
    expect(runtime.initializeAnalytics("GTM-TEST1234","https://www.americanmovingchoice.com")).toBe(true);
    runtime.initializeAnalytics("GTM-TEST1234","https://www.americanmovingchoice.com");
    expect(document.head.appendChild).toHaveBeenCalledTimes(1);
    expect(Array.from(window.dataLayer[0])).toEqual(["consent","default",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"}]);
    expect(runtime.trackPageView()).toBe(true);expect(runtime.trackPageView()).toBe(false);
    window.location.pathname="/movers/texas/austin/";expect(runtime.trackPageView()).toBe(true);
    window.location.pathname="/my-request/private-token/";expect(runtime.trackPageView()).toBe(false);
    expect(window.dataLayer.filter(item=>item.event==="page_view")).toHaveLength(2);
    expect(JSON.stringify(window.dataLayer)).not.toMatch(/private@example|private-token/iu);
  });
  it("exposes the literal grant to Consent Initialization before the container script can execute",async()=>{
    const {window,document}=browser();const runtime=await import("./runtime.ts");
    document.head.appendChild.mockImplementation(()=>{
      const marker=window.dataLayer.findIndex(item=>item.amc_analytics_consent==="granted");
      const start=window.dataLayer.findIndex(item=>item.event==="gtm.js");
      expect(marker).toBeGreaterThanOrEqual(0);expect(start).toBeGreaterThan(marker);
      expect(window.dataLayer[marker]).toEqual({amc_analytics_consent:"granted"});
    });
    expect(runtime.initializeAnalytics("GTM-TEST1234","https://www.americanmovingchoice.com")).toBe(true);
    runtime.initializeAnalytics("GTM-TEST1234","https://www.americanmovingchoice.com");
    expect(document.head.appendChild).toHaveBeenCalledTimes(1);
    expect(window.dataLayer.filter(item=>item.amc_analytics_consent==="granted")).toHaveLength(1);
  });
  it("keeps consent API privacy controls out of ordinary measurement defaults",async()=>{
    const {window}=browser();const runtime=await import("./runtime.ts");
    runtime.initializeAnalytics("GTM-TEST1234","https://www.americanmovingchoice.com");
    const initial=window.dataLayer.find(item=>item[0]==="set");
    expect(Array.from(initial)).toEqual(["set",{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false}]);
    runtime.trackPageView();
    for(const command of window.dataLayer.filter(item=>item[0]==="set")){
      expect(typeof command[1]).toBe("object");
      expect(command[1]).not.toHaveProperty("ads_data_redaction");
      expect(command[1]).not.toHaveProperty("url_passthrough");
    }
  });
  it("never publishes a grant marker for refused, absent or browser-overridden permission",async()=>{
    for(const choice of [null,"denied","granted"]){
      vi.resetModules();const {window,document}=browser(choice);
      vi.stubGlobal("navigator",choice==="granted"?{globalPrivacyControl:true}:{});
      const runtime=await import("./runtime.ts");
      expect(runtime.initializeAnalytics("GTM-TEST1234","https://www.americanmovingchoice.com")).toBe(false);
      expect(window.dataLayer).toBeUndefined();expect(document.head.appendChild).not.toHaveBeenCalled();
    }
  });
  it("never loads a Google runtime or queues events in fresh private documents after opt-in",async()=>{
    for(const path of ["/get-quotes/confirmation/","/my-request/private-token/","/report-a-concern/"]){
      vi.resetModules(); const {window,document}=browser("granted",path); const runtime=await import("./runtime.ts");
      expect(runtime.initializeAnalytics("GTM-TEST1234","https://www.americanmovingchoice.com"),path).toBe(false);
      expect(runtime.trackSurveyStart("survey")).toBe(false); expect(runtime.trackSurveyStep("contact","survey")).toBe(false);
      expect(window.dataLayer).toBeUndefined(); expect(document.head.appendChild).not.toHaveBeenCalled();
    }
  });
  it("records a conversion only after accepted submission and invokes private navigation once",async()=>{
    const {window,timers}=browser();const runtime=await import("./runtime.ts");runtime.initializeAnalytics("GTM-TEST1234","https://www.americanmovingchoice.com");
    const navigate=vi.fn();expect(runtime.completeLeadAnalytics(false,navigate)).toBe(false);
    expect(window.dataLayer.some(item=>item.event==="generate_lead")).toBe(false);
    expect(runtime.completeLeadAnalytics(true,navigate)).toBe(true);expect(runtime.completeLeadAnalytics(true,navigate)).toBe(true);
    const conversions=window.dataLayer.filter(item=>item.event==="generate_lead");expect(conversions).toHaveLength(1);
    conversions[0].eventCallback();timers.forEach(timer=>timer());expect(navigate).toHaveBeenCalledTimes(1);
    expect(Object.keys(conversions[0]).sort()).toEqual(["event","eventCallback","eventTimeout","page_location","page_path","page_referrer","page_title"].sort());
  });
  it("respects withdrawal and browser privacy preferences without forwarding late survey events",async()=>{
    const {window,local}=browser();const runtime=await import("./runtime.ts");runtime.initializeAnalytics("GTM-TEST1234","https://www.americanmovingchoice.com");
    local.set("amc.analytics.consent.v1",JSON.stringify({version:1,choice:"denied",savedAt:Date.now()}));
    expect(runtime.trackSurveyStart("survey")).toBe(false);expect(runtime.trackSurveyStep("contact","survey")).toBe(false);
    runtime.revokeAnalytics();expect(window.location.reload).toHaveBeenCalledOnce();
    vi.resetModules();browser();vi.stubGlobal("navigator",{globalPrivacyControl:true});const next=await import("./runtime.ts");
    expect(next.initializeAnalytics("GTM-TEST1234","https://www.americanmovingchoice.com")).toBe(false);
  });
  it("denies the sandbox bridge before the fallback consent command and private reload",async()=>{
    const {window,local}=browser();const runtime=await import("./runtime.ts");
    runtime.initializeAnalytics("GTM-TEST1234","https://www.americanmovingchoice.com");
    local.set("amc.analytics.consent.v1",JSON.stringify({version:1,choice:"denied",savedAt:Date.now()}));
    window.location.reload.mockImplementation(()=>{
      const control=window.dataLayer.findIndex(item=>item.event==="amc_analytics_consent_update");
      expect(window.dataLayer[control]).toEqual({event:"amc_analytics_consent_update",amc_analytics_consent:"denied"});
      expect(Array.from(window.dataLayer[control+1])).toEqual(["consent","update",{analytics_storage:"denied",ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied"}]);
    });
    runtime.revokeAnalytics();
    expect(window.location.reload).toHaveBeenCalledOnce();
    expect(runtime.trackPageView()).toBe(false);expect(runtime.trackSurveyStart("survey")).toBe(false);
    expect(runtime.trackSurveyStep("contact","survey")).toBe(false);
    expect(window.dataLayer.some(item=>item.event==="generate_lead")).toBe(false);
    vi.resetModules();const fresh=browser("denied");const inactive=await import("./runtime.ts");
    inactive.revokeAnalytics();expect(fresh.window.dataLayer).toBeUndefined();
    expect(fresh.window.location.reload).not.toHaveBeenCalled();
  });
});
