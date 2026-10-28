import { CheckCircleIcon, IdCardIcon, RouteMapArt, RouteMark, SkipLink, Wordmark } from "@amc/ui";
import Image from "next/image";
import type { ReactNode } from "react";
import { PreviewStrip } from "./preview-strip";

const POINTS = [
  { icon: <IdCardIcon size={20} />, text: "Movers only. Carrier authority, no broker authority, rechecked every week." },
  { icon: <CheckCircleIcon size={20} />, text: "Requests from people who chose how many movers may contact them." },
  { icon: <RouteMark size={10} />, text: "Private prices, no subscriptions, nothing for sale but leads." },
];

/**
 * Branded split layout for sign-in, sign-up, reset, invitation and two-step pages: a navy media
 * panel with the brand's route art on the left, the form on the right. On phones the panel is a
 * compact band above the form. The media file is the app's own placeholder art until licensed
 * photography replaces it (public/media/placeholders/auth-panel.svg).
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-2">
      <SkipLink />
      <div className="grid flex-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <aside data-band="" className="relative isolate overflow-hidden mesh-navy text-on-band" aria-label="About the company portal">
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <Image src="/media/placeholders/auth-panel.svg" alt="" width={1200} height={1600} unoptimized priority className="h-full w-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(4,37,79,0.35),rgba(4,37,79,0.75))]" />
            <div className="absolute -bottom-20 -right-24 h-[28rem] w-[40rem] opacity-50 [mask-image:radial-gradient(closest-side,black,transparent)]">
              <RouteMapArt />
            </div>
          </div>
          <div className="mx-auto flex h-full max-w-[34rem] flex-col justify-between gap-10 px-6 py-8 sm:px-10 lg:py-14">
            <div className="flex items-center justify-between gap-4">
              <Wordmark href="/login" tone="reversed" size="lg" />
              <span className="rounded-pill bg-white/10 px-3 py-1 type-small font-semibold text-on-band ring-1 ring-white/20">Company portal</span>
            </div>
            <div className="hidden gap-6 lg:grid">
              <p className="type-display-l text-on-band">Leads from people who chose to hear from you.</p>
              <ul className="grid gap-4">
                {POINTS.map((point, index) => (
                  <li key={index} className="flex items-start gap-3 text-on-band-2">
                    <span className="mt-0.5 inline-grid size-8 shrink-0 place-items-center rounded-pill bg-white/10 text-on-band ring-1 ring-white/15">{point.icon}</span>
                    <span>{point.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="hidden type-small text-on-band-2/80 lg:block">Household-goods carriers only. Brokers and lead resellers can&apos;t join.</p>
          </div>
        </aside>
        <main id="main" tabIndex={-1} className="flex flex-col justify-center py-10 focus:outline-none sm:py-14">
          <div className="mx-auto w-full max-w-[34rem] gutter">{children}</div>
        </main>
      </div>
      <PreviewStrip />
    </div>
  );
}

/** The card holding one auth form, with its page H1. */
export function AuthCard({ title, description, children, footer }: { title: ReactNode; description?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="bezel">
      <div className="bezel-inner p-6 sm:p-9">
        <h1 className="type-display-l text-text">{title}</h1>
        {description ? <div className="mt-2 text-text-2">{description}</div> : null}
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6 border-t border-border pt-5 type-small text-text-2">{footer}</div> : null}
      </div>
    </div>
  );
}
