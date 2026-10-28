import type { HubSpec } from "./hub-page";
export const ROUTES_PER_HUB_PAGE = 400;
export const ROUTES_HUB: HubSpec = {
  url: "/routes/", family: "route",
  title: "Moving Routes: State-to-State and City-to-City Moves | American Moving Choice",
  h1: "Moving routes",
  description: "Moving route guides with coverage counts, cost factors and sourced geography. Choose your contact limit in one quote request.",
  lede: "Plan your route with straight-line distances, clearly labelled road-distance assumptions, coverage counts and the rules that apply. Company names are introduced when they contact you.",
  groupByState: true, perPage: ROUTES_PER_HUB_PAGE,
};
