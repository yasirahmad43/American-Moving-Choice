import { token } from "@/lib/content/pages";

/** Publish only owner-supplied business details. Missing values are never contact channels. */
export function BusinessIdentity() {
  const legalName = token("org.legal_name");
  const owner = token("org.owner");
  const address = token("org.address");
  return <>
    {legalName.kind === "value" ? legalName.text : "American Moving Choice"}
    {owner.kind === "value" ? `, owned by ${owner.text}` : ""}
    {address.kind === "value" ? `, ${address.text}` : ""}
  </>;
}

/** These supplemental channels appear once supplied; the existing report form stays available. */
export function BusinessContactChannels({ editorial = false }: { editorial?: boolean }) {
  const email = token(editorial ? "org.editorial_email" : "org.support_email");
  const phone = editorial ? null : token("org.support_phone");
  if (email.kind !== "value" && phone?.kind !== "value") return null;
  return <ul>
    {email.kind === "value" ? <li>Email: <a href={`mailto:${email.text}`}>{email.text}</a></li> : null}
    {phone?.kind === "value" ? <li>Phone: <a href={`tel:${phone.text.replace(/[^+\d]/g, "")}`}>{phone.text}</a></li> : null}
  </ul>;
}
