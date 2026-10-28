import { CONCERN_TYPES, CONCERN_TYPE_LABELS, DESCRIPTION_MAX } from "@amc/server/concerns";
import Link from "next/link";
import { PageFrame } from "@/components/site/page-frame";
import { pageMetadata } from "@/components/site/page-meta";
import { Note } from "@/components/site/review-notes";
import { ConcernForm } from "./concern-form";

const URL = "/report-a-concern/";
const TITLE = "Report a Concern or a Broker | American Moving Choice";
const DESCRIPTION =
  "Report a company that acted as a broker, contacted you without being named, showed wrong credentials or treated you badly. You get a case reference.";

export const metadata = pageMetadata(URL, TITLE, DESCRIPTION);

export default function ReportConcernPage() {
  const types = CONCERN_TYPES.map((value) => ({ value, ...CONCERN_TYPE_LABELS[value] }));
  return (
    <PageFrame
      url={URL}
      h1="Report a concern or a broker"
      description={DESCRIPTION}
      trail={[{ label: "Report a concern", href: URL }]}
      overline="Help"
      lede="Tell us about a company you heard from through American Moving Choice, a review, or how your details were used. You'll get a case reference straight away."
      waitingOn="Counsel reviews the form copy and the owner sets case-handling targets."
    >
      <p>
        If you&apos;re in danger or your belongings are being held, contact local law enforcement first. <Link href="/complaints/">Complaints</Link>{" "}
        also explains how to complain to FMCSA or your state. <Note kind="owner">case-handling targets; no timing promise until set (mover verification §7)</Note>
      </p>
      <div className="not-prose mt-6 max-w-[60ch]">
        <ConcernForm types={types} descriptionMax={DESCRIPTION_MAX} />
      </div>
    </PageFrame>
  );
}
