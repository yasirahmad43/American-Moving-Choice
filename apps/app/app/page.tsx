import { getSessionUserUnverified, landingPath } from "@amc/server/auth";
import { redirect } from "next/navigation";

/** The app's root sends people where they belong: sign-in, two-step check, portal or admin. */
export default async function Home() {
  const user = await getSessionUserUnverified();
  redirect(user ? landingPath(user) : "/login");
}
