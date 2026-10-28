"use client";

import { Alert, Button, Field, Input, Select } from "@amc/ui";
import { useActionState, useId } from "react";
import { FormMessage, SubmitButton } from "@/components/form-controls";
import { cancelInvitationAction, inviteAction, memberAction } from "@/app/(portal)/portal/team/actions";
import { asFormState, idleState } from "./form-state";

export interface RoleOption {
  value: string;
  label: string;
}

export function InviteForm({ roles, roleHelp }: { roles: RoleOption[]; roleHelp: string }) {
  const [state, action] = useActionState(inviteAction, idleState);
  const value = (name: string) => {
    const v = state.status === "error" ? state.values?.[name] : undefined;
    return typeof v === "string" ? v : "";
  };
  return (
    <form action={action} noValidate className="grid gap-4">
      <FormMessage state={asFormState(state)} />
      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <Field id="invite-email" label="Email address" error={state.fieldErrors?.email} required>
          <Input type="email" name="email" inputMode="email" autoComplete="off" defaultValue={value("email")} key={`e-${state.attempt}`} />
        </Field>
        <Field id="invite-role" label="Role" help={roleHelp} error={state.fieldErrors?.role} required>
          <Select name="role" defaultValue={value("role") || roles.find((r) => r.value === "agent")?.value || roles[0]?.value} key={`r-${state.attempt}`}>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div>
        <SubmitButton>Send invitation</SubmitButton>
      </div>
    </form>
  );
}

/** Owner controls for one member: role, access and (for agents) purchasing. */
export function MemberControls({
  membershipId,
  name,
  role,
  status,
  canPurchase,
  roles,
}: {
  membershipId: string;
  name: string;
  role: string;
  status: "active" | "disabled";
  canPurchase: boolean;
  roles: RoleOption[];
}) {
  const [state, action, pending] = useActionState(memberAction, idleState);
  const id = useId();
  return (
    <div className="grid gap-2">
      <form action={action} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="membershipId" value={membershipId} />
        <input type="hidden" name="op" value="role" />
        <div className="grid gap-1">
          <label htmlFor={`${id}-role`} className="type-small font-semibold text-text-2">
            Role<span className="sr-only"> for {name}</span>
          </label>
          <Select id={`${id}-role`} name="role" defaultValue={role} className="min-w-36">
            {roles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" size="sm" variant="secondary" disabled={pending}>
          Change role<span className="sr-only"> for {name}</span>
        </Button>
      </form>
      <div className="flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="membershipId" value={membershipId} />
          <input type="hidden" name="op" value={status === "active" ? "disable" : "enable"} />
          <Button type="submit" size="sm" variant={status === "active" ? "danger" : "secondary"} disabled={pending}>
            {status === "active" ? "Turn off access" : "Turn access back on"}
            <span className="sr-only"> for {name}</span>
          </Button>
        </form>
        {role === "agent" && status === "active" ? (
          <form action={action}>
            <input type="hidden" name="membershipId" value={membershipId} />
            <input type="hidden" name="op" value={canPurchase ? "purchase_off" : "purchase_on"} />
            <Button type="submit" size="sm" variant="secondary" disabled={pending}>
              {canPurchase ? "Stop buying requests" : "Allow buying requests"}
              <span className="sr-only"> for {name}</span>
            </Button>
          </form>
        ) : null}
      </div>
      <div aria-live="polite" className="empty:hidden">
        {state.status !== "idle" && state.message ? (
          <Alert tone={state.status === "error" ? "error" : "success"} role="none" className="py-2">
            {state.message}
          </Alert>
        ) : null}
      </div>
    </div>
  );
}

export function CancelInvitationButton({ invitationId, email }: { invitationId: string; email: string }) {
  const [state, action, pending] = useActionState(cancelInvitationAction, idleState);
  return (
    <form action={action} className="grid gap-1">
      <input type="hidden" name="invitationId" value={invitationId} />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        Withdraw<span className="sr-only"> the invitation to {email}</span>
      </Button>
      <span aria-live="polite" className="type-small text-error empty:hidden">
        {state.status === "error" ? state.message : null}
      </span>
    </form>
  );
}

