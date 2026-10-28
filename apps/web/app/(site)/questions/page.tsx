import type { Metadata } from "next";
import { connection } from "next/server";
import { HubPage, hubMetadata, type HubSpec } from "@/components/seo/hub-page";

const SPEC: HubSpec = {
  url: "/questions/",
  family: "question",
  title: "Moving Questions Answered From the Rules | American Moving Choice",
  h1: "Moving questions",
  description: "Direct answers to common moving questions, each built on 49 CFR Part 375, FMCSA consumer guidance or the platform's own rules, with the source and the date it was read.",
  lede: "Every answer names its source and the date we read it. Where no rule exists, the page says so instead of guessing.",
};

export const metadata: Metadata = hubMetadata(SPEC);

export default async function QuestionsHub() {
  await connection();
  return <HubPage spec={SPEC} />;
}
