import { initBotId } from "botid/client/core";

// Server Actions post to the current page, including quote starters on public guides.
// Basic is explicitly selected on both sides so no paid analysis can be enabled here.
initBotId({
  protect: [{ path: "/*", method: "POST", advancedOptions: { checkLevel: "basic" } }],
});
