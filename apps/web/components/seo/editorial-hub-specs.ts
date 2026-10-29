import type { HubSpec } from "./hub-page";

/** Shared by the HTML hubs and sitemap, so every bounded results page is discoverable. */
export const EDITORIAL_HUB_PAGE_SIZE = 60;
export const QUESTIONS_HUB: HubSpec = {
  url: "/questions/", family: "question",
  title: "Moving Questions Answered From the Rules | American Moving Choice",
  h1: "Moving questions",
  description: "Direct answers to common moving questions, each built on 49 CFR Part 375, FMCSA consumer guidance or the platform's own rules, with the source and the date it was read.",
  lede: "Every answer names its source and the date we read it. Where no rule exists, the page says so instead of guessing.",
  perPage: EDITORIAL_HUB_PAGE_SIZE, pageJump: true,
};

export const PLANNING_HUB: HubSpec = {
  url: "/planning/", family: "planning",
  title: "Moving Planning Checklists Built on the Rules | American Moving Choice",
  h1: "Moving planning",
  description: "Checklists and timelines for a move, ordered around the documents an interstate mover owes you: survey, written estimate, booklets, bill of lading, weighing and delivery.",
  lede: "Practical checklists that follow the paperwork order federal rules set for interstate moves, with the practical steps around them.",
  perPage: EDITORIAL_HUB_PAGE_SIZE, pageJump: true,
};
