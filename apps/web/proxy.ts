import { NextResponse, type NextRequest } from "next/server";
import { countryAccessResponse } from "@amc/server/access";

/** Next 16 proxy uses Node, and runs before static/cached page delivery. */
export function proxy(request: NextRequest): Response {
  return countryAccessResponse(request, { publicWeb: true }) ?? NextResponse.next();
}

export const config = {
  // Exact platform-managed BotID namespaces; never a general UUID/.well-known exemption.
  matcher: ["/((?!\\.well-known/vercel/security(?:/|$)|149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3(?:/|$)).*)"],
};
