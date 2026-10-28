/**
 * ST-1b, the money line, rendered from its stored record with its link (content/stored-texts.md;
 * implications §3.4, §8.4).
 */
import Link from "next/link";
import { MONEY_LINK } from "@/lib/site";
import { storedTextParts } from "@/lib/stored-texts";

export function MoneyLine({ className, id }: { className?: string; id?: string }) {
  return (
    <p id={id} className={className}>
      {storedTextParts("ST-1b").map((part, index) =>
        part.kind === "text" ? (
          <span key={index}>{part.text}</span>
        ) : (
          <Link key={index} href={MONEY_LINK.href} className="link">
            {part.label}
          </Link>
        ),
      )}
    </p>
  );
}
