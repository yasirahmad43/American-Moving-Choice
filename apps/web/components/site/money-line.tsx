/**
 * ST-1b, the money line, rendered from its stored record with its link (content/stored-texts.md;
 * implications §3.4, §8.4).
 */
import { PUBLIC_REQUEST_ASSURANCE } from "@/lib/public-copy";

export function MoneyLine({ className, id }: { className?: string; id?: string }) {
  return (
    <p id={id} className={className}>
      {PUBLIC_REQUEST_ASSURANCE}
    </p>
  );
}
