import { initBotId } from "botid/client/core";

// Full request/concern actions run only on these pages. Never intercept the SDK's own
// challenge traffic or the optional postal helpers on other public pages.
// next.config derives this build value from the same flag used by server verification.
if (process.env.NEXT_PUBLIC_BOT_PROTECTION_ENABLED === "true") {
  initBotId({
    protect: ["/get-quotes", "/get-quotes/", "/report-a-concern", "/report-a-concern/"].map(path => ({
      path, method: "POST", advancedOptions: { checkLevel: "basic" },
    })),
  });
}
