/**
 * Plain text with inline links written as [label](/path/) or [label](https://…). Internal links
 * become Next links; external ones open the official source in the same tab with rel=noopener.
 * Nothing else is interpreted, so stored content can never inject markup.
 */
import Link from "next/link";
import type { ReactNode } from "react";

const LINK = /\[([^\]]+)\]\((\/[^)\s]*|https?:\/\/[^)\s]+)\)/g;

export function InlineText({ text, allow }: { text: string; allow?: (href: string) => boolean }): ReactNode {
  const parts: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (let m = LINK.exec(text); m; m = LINK.exec(text)) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const [, label, href] = m as unknown as [string, string, string];
    if (href.startsWith("/")) {
      if (allow && !allow(href)) parts.push(label);
      else
        parts.push(
          <Link key={key++} href={href} className="link">
            {label}
          </Link>,
        );
    } else {
      parts.push(
        <a key={key++} href={href} className="link" rel="noopener">
          {label}
        </a>,
      );
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export function stripLinks(text: string): string {
  return text.replace(LINK, "$1");
}
