import type { HubSpec } from "./hub-page";
/** Shared by the HTML hub and core sitemap, so every bounded result page remains crawlable. */
export const ROUTES_PER_HUB_PAGE = 60;
export const ROUTES_HUB: HubSpec = {
  url: "/routes/", family: "route",
  title: "Moving Routes: State-to-State and City-to-City Moves | American Moving Choice",
  h1: "Moving routes",
  description: "Find a moving route by origin, destination or state. Compare sourced place facts, route assumptions and the questions to ask before booking.",
  lede: "Start with your origin or destination. Each published route explains its own sourced facts, distance assumptions and limits. Modelled road distance is kept separate from straight-line geography; a guide isn't a mover's quote or a promise of driving time. Company names are introduced when they contact you.",
  groupByState: true, perPage: ROUTES_PER_HUB_PAGE,
};
