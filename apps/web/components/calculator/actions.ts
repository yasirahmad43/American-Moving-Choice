"use server";

/**
 * Server actions for the calculator island. Answers arrive in the POST body only (never a URL),
 * aren't stored and aren't logged; errors are logged without them (build plan §5; method page,
 * "What happens to the answers you enter?").
 */
import {
  MOVE_TYPE_LABELS,
  moveTypeHelp,
  rangeLabel,
  resultLists,
  routeDistanceText,
  routeSummaryText,
  surveyPrefillFor,
  type NoDataCause,
  type RangeLabel,
  type ResultLists,
  type SurveyPrefill,
} from "@amc/core";
import { calculatorRange, checkRoute, type ZipCheck } from "@amc/server/rates";
import { z } from "zod";
import { token } from "./content";
import { errorText } from "./copy";

const answerText = z.string().max(64);
const answersSchema = z.object({
  origin: answerText,
  destination: answerText,
  size: z.string().max(32).nullable(),
  services: z.array(z.string().max(32)).max(8),
});

export type CalculatorAnswers = z.infer<typeof answersSchema>;

export type ZipView = { status: "empty" | "incomplete" } | { status: "error"; message: string } | { status: "resolved"; text: string };

export interface RouteView {
  summary: string;
  distance: string;
  typeLabel: string;
  typeHelp: string;
  sameZip: boolean;
}

export interface RouteCheckView {
  origin: ZipView;
  destination: ZipView;
  route: RouteView | null;
}

const zipView = (check: ZipCheck): ZipView => {
  switch (check.status) {
    case "empty":
    case "incomplete":
      return { status: check.status };
    case "error":
      return { status: "error", message: errorText(check.error.id, check.error.zip) };
    case "resolved":
      return { status: "resolved", text: `${check.location.city}, ${check.location.state}` };
  }
};

/** The route summary under the ZIP fields: each city once it resolves, the route once both do. */
export async function checkRouteAction(origin: unknown, destination: unknown): Promise<RouteCheckView | null> {
  const parsed = z.object({ origin: answerText, destination: answerText }).safeParse({ origin, destination });
  if (!parsed.success) return null;
  try {
    const check = await checkRoute(parsed.data.origin, parsed.data.destination);
    const route = check.route;
    return {
      origin: zipView(check.origin),
      destination: zipView(check.destination),
      route: route
        ? {
            summary: routeSummaryText(route),
            distance: routeDistanceText(route),
            typeLabel: MOVE_TYPE_LABELS[route.moveType],
            typeHelp: moveTypeHelp(route.moveType, check.localRadiusMiles),
            sameZip: route.origin.zip === route.destination.zip,
          }
        : null,
    };
  } catch {
    console.error("[calculator] route check failed");
    return null;
  }
}

export type CalculatorView =
  | { kind: "invalid"; errors: Partial<Record<"origin" | "destination" | "size", string>> }
  | { kind: "range"; label: RangeLabel; lists: ResultLists; prefill: SurveyPrefill }
  | { kind: "no_data"; cause: NoDataCause; prefill: SurveyPrefill }
  | { kind: "size_unpriced"; prefill: SurveyPrefill }
  | { kind: "error" };

/** The result for one set of answers (the widget path of cost-model-v1). */
export async function calculateAction(answers: unknown): Promise<CalculatorView> {
  const parsed = answersSchema.safeParse(answers);
  if (!parsed.success) return { kind: "error" };
  try {
    const outcome = await calculatorRange(parsed.data);
    if (outcome.status === "invalid") {
      const errors: Partial<Record<"origin" | "destination" | "size", string>> = {};
      for (const [field, error] of Object.entries(outcome.errors)) {
        if (error) errors[field as "origin" | "destination" | "size"] = errorText(error.id, error.zip);
      }
      return { kind: "invalid", errors };
    }
    const prefill = surveyPrefillFor(outcome.query);
    const result = outcome.result;
    switch (result.kind) {
      case "range":
        return {
          kind: "range",
          label: rangeLabel(result),
          lists: resultLists(result, outcome.route, {
            storageAssumption: token("cost.method.storage_assumption") ?? "[pending]",
            specialtyItems: token("cost.method.specialty_items") ?? "[pending]",
          }),
          prefill,
        };
      case "no_data":
        return { kind: "no_data", cause: result.cause, prefill };
      case "size_unpriced":
        return { kind: "size_unpriced", prefill };
    }
  } catch {
    console.error("[calculator] range failed");
    return { kind: "error" };
  }
}
