import type { Metadata } from "next";
import { connection } from "next/server";
import { HubPage, hubMetadata, type HubSpec } from "@/components/seo/hub-page";

const SPEC: HubSpec = {
  url: "/planning/",
  family: "planning",
  title: "Moving Planning Checklists Built on the Rules | American Moving Choice",
  h1: "Moving planning",
  description: "Checklists and timelines for a move, ordered around the documents an interstate mover owes you: survey, written estimate, booklets, bill of lading, weighing and delivery.",
  lede: "Practical checklists that follow the paperwork order federal rules set for interstate moves, with the practical steps around them.",
};

export const metadata: Metadata = hubMetadata(SPEC);

export default async function PlanningHub() {
  await connection();
  return <HubPage spec={SPEC} />;
}
