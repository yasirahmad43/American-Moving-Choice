import { env } from "@amc/server/env";
import { MediaCreditLine, MediaFrame } from "@/components/media/media-frame";
import { mediaById } from "@/lib/media";
import { ClosingSurveyPanel } from "./closing-survey-panel";
import "./video-survey-hero.css";
import "./closing-survey.css";

function ClosingPhoto({ id }: { id: string }) {
  const asset = mediaById(id);
  if (!asset) throw new Error(`Closing survey image is missing: ${id}`);
  return <div className="closing-survey__photo" data-closing-photo={asset.id}>
    <MediaFrame asset={asset} sizes="(min-width: 1000px) 50vw, 100vw" />
    <MediaCreditLine asset={asset} className="closing-survey__credit" />
  </div>;
}

/** Curated chrome media stays on the server; the client only chooses its audience and form. */
export function ClosingSurvey() {
  return <ClosingSurveyPanel appUrl={env().APP_URL}
    consumerPhoto={<ClosingPhoto id="home-family-carrying-labeled-boxes-toward" />}
    carrierPhoto={<ClosingPhoto id="for-movers-fleet-of-white-moving-trucks" />} />;
}
