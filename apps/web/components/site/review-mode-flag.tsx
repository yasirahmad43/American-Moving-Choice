"use client";

/**
 * Development only: marks <html data-review="1"> while the URL carries ?review=1, which reveals
 * the reviewer notes that prose.css keeps hidden. Rendered nowhere in production builds.
 */
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function ReviewModeFlag() {
  const params = useSearchParams();
  const on = params?.get("review") === "1";
  useEffect(() => {
    if (on) document.documentElement.setAttribute("data-review", "1");
    else document.documentElement.removeAttribute("data-review");
  }, [on]);
  return null;
}
