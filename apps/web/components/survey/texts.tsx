/**
 * Stored texts the survey renders (content/stored-texts.md), passed from the server page to the
 * island so each surface quotes the record, never a paraphrase. "[Label]" parts become links.
 */
import Link from "next/link";

export type TextPart = { kind: "text"; text: string } | { kind: "link"; label: string };

export interface SurveyTexts {
  /** ST-1a: role-and-money statement (Review and send, confirmation). */
  st1a: string;
  /** ST-1b: money line under the first screen's heading. */
  st1b: TextPart[];
  /** ST-2: movers-only statement (Review and send, beside ST-1a). */
  st2: TextPart[];
  /** ST-4a: count-screen helper text. */
  st4a: string;
  /** ST-4b: short form for Review and send and the confirmation. */
  st4b: string;
}

const LINKS: Record<string, string> = {
  "How AMC makes money": "/advertising-disclosure/",
  "How we verify movers": "/how-we-verify-movers/",
};

export function StoredTextLine({ parts }: { parts: TextPart[] }) {
  return (
    <>
      {parts.map((part, index) => {
        if (part.kind === "text") return <span key={index}>{part.text}</span>;
        const href = LINKS[part.label];
        return href ? (
          <Link key={index} href={href} className="link">
            {part.label}
          </Link>
        ) : (
          <span key={index}>{part.label}</span>
        );
      })}
    </>
  );
}
