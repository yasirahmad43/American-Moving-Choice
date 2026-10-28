"use server";

import { audit } from "@amc/server/audit";
import { endSession, requestMeta } from "@amc/server/auth";
import { redirect } from "next/navigation";

/** Signs out: revokes the session row, clears the cookie and records it (build plan §6). */
export async function logout(): Promise<void> {
  const user = await endSession();
  if (user) {
    const { ip } = await requestMeta();
    await audit({ actorType: user.adminRole ? "admin" : "user", actorId: user.id, action: "auth.logout", entity: "user", entityId: user.id, ip });
  }
  redirect("/login?signed_out=1");
}
