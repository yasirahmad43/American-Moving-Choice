/**
 * Shapes accepted from the survey island at the server-action boundary. These check types and
 * bounds only; the step rules (ZIPs, dates, names, phone, email, counts) are the @amc/core survey
 * parsers, which the submission re-runs on the parsed values.
 */
import { z } from "zod";

const shortText = (max: number) => z.string().max(max);

export const coverageRequestSchema = z.object({
  originZip: shortText(20),
  destZip: shortText(20),
  moveSize: shortText(20),
  services: z.array(shortText(30)).max(10),
  need: z.enum(["household", "loading_help", "vehicle_only", "truck_rental"]).nullable(),
  profileCompanyId: z.null(),
});
export type CoverageRequest = z.infer<typeof coverageRequestSchema>;

export const attributionSchema = z
  .object({
    referrerOrigin: shortText(300).nullable(),
    utmSource: shortText(200).nullable(),
    utmMedium: shortText(200).nullable(),
    utmCampaign: shortText(200).nullable(),
  })
  .partial();

export const submissionSchema = z.object({
  need: z.enum(["household", "loading_help", "vehicle_only", "truck_rental"]).nullable(),
  originZip: shortText(20),
  destZip: shortText(20),
  moveDate: shortText(10),
  flexible: z.boolean(),
  latestDate: shortText(10).nullable(),
  moveSize: shortText(20),
  services: z.array(shortText(30)).max(10),
  channels: z.array(shortText(10)).max(3),
  firstName: shortText(200),
  lastName: shortText(200),
  email: shortText(320),
  phone: shortText(40),
  limit: z.number().int().min(1).max(50),
  /** "Only this company" on a profile-started request (implications §11 Q3). */
  onlyProfileCompany: z.boolean(),
  /** Opaque recipient snapshot IDs from the coverage response; company identities are not displayed. */
  shownCompanyIds: z.array(z.uuid()).max(200),
  removedCompanyIds: z.array(z.uuid()).max(200),
  profileCompanyId: z.null(),
  consentChecked: z.boolean(),
  termsAccepted: z.boolean(),
  /** The consent version and the sha256 of the text the checkbox showed. */
  consentVersionId: shortText(100),
  renderedTextSha256: z.string().regex(/^[0-9a-f]{64}$/),
  /** Must stay empty: a field hidden from people (lead lifecycle §4, honeypot). */
  website: shortText(500),
  ticket: shortText(100),
  attribution: attributionSchema,
});
export type SubmissionInput = z.infer<typeof submissionSchema>;
