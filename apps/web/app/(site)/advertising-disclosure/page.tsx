import { permanentRedirect } from "next/navigation";

/** The owner retired this marketing topic; preserve incoming bookmarks. */
export default function RetiredDisclosure() { permanentRedirect("/about/"); }
