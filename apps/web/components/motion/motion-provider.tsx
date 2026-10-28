"use client";

/**
 * MotionProvider (pass 2): the one place GSAP runs on the public site. It is declarative: server
 * components mark elements with data attributes and this provider wires the choreography after
 * the page is idle, so nothing here is on the LCP path and the GSAP chunk loads lazily.
 *
 *   data-motion="rise" | "stagger" | "scale" | "words"   entrance (once) or scrubbed word reveal
 *   data-parallax="0.16"                                 layer speed relative to scroll
 *   data-counter="1234"                                  number counter (never money)
 *   data-stamp                                           ledger "Checked" stamp drops in
 *   data-magnetic                                        CTA follows the pointer slightly
 *   data-pin-sequence / data-pin-route / data-pin-step   the pinned, scrubbed how-it-works
 *   data-scroll-progress                                 the top progress line
 *
 * Reduced motion: the provider does nothing at all (no attribute, no GSAP download), so every
 * element stays in its static, visible state. Everything animates transform and opacity only.
 */
import { usePathname } from "next/navigation";
import { useEffect } from "react";

type Gsap = typeof import("gsap")["gsap"];
type ScrollTriggerType = typeof import("gsap/ScrollTrigger")["ScrollTrigger"];

let loaded: Promise<{ gsap: Gsap; ScrollTrigger: ScrollTriggerType }> | null = null;

function loadGsap() {
  loaded ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([core, st]) => {
    core.gsap.registerPlugin(st.ScrollTrigger);
    return { gsap: core.gsap, ScrollTrigger: st.ScrollTrigger };
  });
  return loaded;
}

const idle = (callback: () => void): (() => void) => {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
  if (w.requestIdleCallback) {
    const id = w.requestIdleCallback(callback, { timeout: 1200 });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(callback, 350);
  return () => window.clearTimeout(id);
};

function choreograph(gsap: Gsap, ScrollTrigger: ScrollTriggerType): () => void {
  const root = document.documentElement;
  root.setAttribute("data-gsap", "1");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const cleanups: (() => void)[] = [];

  const ctx = gsap.context(() => {
    // Scroll progress line and the header's scrolled state.
    const progress = document.querySelector<HTMLElement>("[data-scroll-progress]");
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        progress?.style.setProperty("--progress", self.progress.toFixed(4));
        root.toggleAttribute("data-scrolled", self.scroll() > 24);
      },
    });

    // Entrances, once.
    for (const el of document.querySelectorAll<HTMLElement>('[data-motion="rise"]')) {
      gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    }
    for (const el of document.querySelectorAll<HTMLElement>('[data-motion="scale"]')) {
      gsap.to(el, { opacity: 1, scale: 1, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    }
    for (const el of document.querySelectorAll<HTMLElement>('[data-motion="stagger"]')) {
      const items = Array.from(el.children) as HTMLElement[];
      if (!items.length) continue;
      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: { each: Number(el.dataset.stagger ?? 0.08), from: "start" },
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    }
    // Scrubbed word reveal: words brighten one after another while the paragraph scrolls through.
    for (const el of document.querySelectorAll<HTMLElement>('[data-motion="words"]')) {
      const words = el.querySelectorAll<HTMLElement>(".word");
      if (!words.length) continue;
      gsap.to(words, { opacity: 1, stagger: 0.04, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.4 } });
    }

    // Parallax layers: a layer moves at `speed` of the scroll distance of its section.
    for (const el of document.querySelectorAll<HTMLElement>("[data-parallax]")) {
      const speed = Number(el.dataset.parallax ?? 0.15);
      const section = el.closest<HTMLElement>("section, header, figure, div[data-parallax-scope]") ?? el;
      const atTop = section.getBoundingClientRect().top + window.scrollY < window.innerHeight * 0.5;
      gsap.fromTo(
        el,
        { y: atTop ? 0 : () => -speed * window.innerHeight * 0.5 },
        {
          y: () => speed * window.innerHeight * (atTop ? 1 : 0.5),
          ease: "none",
          scrollTrigger: { trigger: section, start: atTop ? "top top" : "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
        },
      );
    }

    // Counters: count up from zero to the server-rendered value (counts only, never money).
    for (const el of document.querySelectorAll<HTMLElement>("[data-counter]")) {
      const target = Number(el.dataset.counter ?? 0);
      const suffix = el.dataset.counterSuffix ?? "";
      if (!Number.isFinite(target)) continue;
      const state = { v: 0 };
      gsap.to(state, {
        v: target,
        duration: Math.min(2.2, 0.8 + Math.log10(Math.max(10, target)) * 0.4),
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => {
          el.textContent = `${Math.round(state.v).toLocaleString("en-US")}${suffix}`;
        },
        onComplete: () => {
          el.textContent = `${target.toLocaleString("en-US")}${suffix}`;
        },
      });
    }

    // Ledger stamp.
    for (const el of document.querySelectorAll<HTMLElement>("[data-stamp]")) {
      gsap.to(el, { opacity: 1, scale: 1, rotation: -4, duration: 0.55, ease: "back.out(2.2)", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    }

    // The pinned, scrubbed how-it-works sequence (desktop only; phones get staggered entrances).
    const mm = gsap.matchMedia();
    mm.add("(min-width: 64rem)", () => {
      for (const section of document.querySelectorAll<HTMLElement>("[data-pin-sequence]")) {
        const route = section.querySelector<SVGPathElement>("[data-pin-route]");
        const steps = Array.from(section.querySelectorAll<HTMLElement>("[data-pin-step]"));
        const dots = Array.from(section.querySelectorAll<HTMLElement>("[data-pin-dot]"));
        const counter = section.querySelector<HTMLElement>("[data-pin-counter]");
        const pinned = section.querySelector<HTMLElement>("[data-pin-target]") ?? section;
        if (!steps.length) continue;
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${steps.length * 70}%`,
            pin: pinned,
            pinSpacing: true,
            scrub: 0.6,
            anticipatePin: 1,
            onUpdate: (self) => {
              if (counter) counter.textContent = String(Math.min(steps.length, Math.max(1, Math.ceil(self.progress * steps.length + 0.0001)))).padStart(2, "0");
            },
          },
        });
        if (route) {
          gsap.set(route, { strokeDasharray: 1, strokeDashoffset: 1 });
          tl.to(route, { strokeDashoffset: 0, duration: steps.length, ease: "none" }, 0);
        }
        steps.forEach((step, index) => {
          tl.to(step, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power2.out" }, index * 1 + 0.1);
          const dot = dots[index];
          if (dot) tl.fromTo(dot, { scale: 0.4, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(3)" }, index * 1 + 0.05);
        });
        tl.to({}, { duration: 0.4 });
      }
    });
    mm.add("(max-width: 63.99rem)", () => {
      for (const section of document.querySelectorAll<HTMLElement>("[data-pin-sequence]")) {
        const steps = section.querySelectorAll<HTMLElement>("[data-pin-step]");
        const route = section.querySelector<SVGPathElement>("[data-pin-route]");
        if (route) gsap.set(route, { strokeDasharray: 1, strokeDashoffset: 0 });
        steps.forEach((step, index) => {
          gsap.to(step, { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out", delay: index * 0.05, scrollTrigger: { trigger: step, start: "top 88%", once: true } });
        });
      }
    });
    cleanups.push(() => mm.revert());
  });

  // Magnetic CTAs (fine pointers only): the button leans toward the pointer and springs back.
  if (finePointer) {
    for (const el of document.querySelectorAll<HTMLElement>("[data-magnetic]")) {
      const strength = Number(el.dataset.magnetic || 0.22);
      const move = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        el.style.setProperty("--mx", `${(dx * strength).toFixed(1)}px`);
        el.style.setProperty("--my", `${(dy * strength).toFixed(1)}px`);
      };
      const leave = () => {
        el.style.setProperty("--mx", "0px");
        el.style.setProperty("--my", "0px");
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerleave", leave);
        leave();
      });
    }
  }

  // Fonts and lazy images change layout after the first measurement.
  const refresh = () => ScrollTrigger.refresh();
  document.fonts?.ready.then(refresh).catch(() => undefined);
  window.addEventListener("load", refresh);
  cleanups.push(() => window.removeEventListener("load", refresh));

  return () => {
    for (const fn of cleanups) fn();
    ctx.revert();
    root.removeAttribute("data-gsap");
    root.removeAttribute("data-scrolled");
  };
}

export function MotionProvider() {
  const pathname = usePathname();
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const cancelIdle = idle(() => {
      loadGsap()
        .then(({ gsap, ScrollTrigger }) => {
          if (cancelled) return;
          cleanup = choreograph(gsap, ScrollTrigger);
        })
        .catch(() => undefined);
    });
    return () => {
      cancelled = true;
      cancelIdle();
      cleanup?.();
    };
  }, [pathname]);
  return null;
}

/** Wraps each word of a sentence for the scrubbed word reveal (data-motion="words"). */
export function Words({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, index) =>
        /^\s+$/.test(part) ? (
          part
        ) : (
          <span key={index} className="word">
            {part}
          </span>
        ),
      )}
    </>
  );
}
