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
  }).catch((error: unknown) => {
    loaded = null;
    throw error;
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
  let active = true;
  const originals = new Map<HTMLElement, string | null>();
  const belowFold = (el: HTMLElement) => el.getBoundingClientRect().top >= window.innerHeight * 0.92;

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

    // Entrances, once. Reading content stays visible even after a fast scroll or a delayed refresh.
    for (const el of document.querySelectorAll<HTMLElement>('[data-motion="rise"]')) {
      if (!belowFold(el)) continue;
      gsap.fromTo(el, { opacity: 1, y: 24 }, { opacity: 1, y: 0, duration: 0.65, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } });
    }
    for (const el of document.querySelectorAll<HTMLElement>('[data-motion="scale"]')) {
      if (!belowFold(el)) continue;
      gsap.fromTo(el, { opacity: 1, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.7, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } });
    }
    for (const el of document.querySelectorAll<HTMLElement>('[data-motion="stagger"]')) {
      const items = (Array.from(el.children) as HTMLElement[]).filter(belowFold);
      if (!items.length) continue;
      gsap.fromTo(items, { opacity: 1, y: 24 }, {
        opacity: 1,
        y: 0,
        duration: 0.75,
        ease: "power3.out",
        stagger: { each: Math.min(0.12, Math.max(0, Number(el.dataset.stagger ?? 0.06) || 0.06)), from: "start" },
        scrollTrigger: { trigger: items[0], start: "top 92%", once: true },
      });
    }
    // Scrubbed word reveal: words brighten one after another while the paragraph scrolls through.
    for (const el of document.querySelectorAll<HTMLElement>('[data-motion="words"]')) {
      const words = el.querySelectorAll<HTMLElement>(".word");
      if (!words.length) continue;
      gsap.fromTo(words, { y: 5 }, { y: 0, stagger: 0.04, ease: "none", scrollTrigger: { trigger: el, start: "top 85%", end: "bottom 55%", scrub: 0.4 } });
    }

    // Parallax layers: a layer moves at `speed` of the scroll distance of its section.
    for (const el of document.querySelectorAll<HTMLElement>("[data-parallax]")) {
      if (!finePointer || el.querySelector("input, select, textarea, form, button")) continue;
      const speed = Math.max(-0.2, Math.min(0.2, Number(el.dataset.parallax ?? 0.12) || 0));
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
      // Counter supplies a stable screen-reader value alongside the decorative moving number.
      originals.set(el, el.getAttribute("aria-label"));
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
      if (!belowFold(el)) continue;
      gsap.fromTo(el, { opacity: 0, scale: 1.25, rotation: -8 }, { opacity: 1, scale: 1, rotation: -4, duration: 0.5, ease: "back.out(1.6)", scrollTrigger: { trigger: el, start: "top 92%", once: true } });
    }

    // The pinned, scrubbed how-it-works sequence (desktop only; phones get staggered entrances).
    const mm = gsap.matchMedia();
    mm.add("(min-width: 64rem) and (min-height: 46rem) and (hover: hover) and (pointer: fine)", () => {
      for (const section of document.querySelectorAll<HTMLElement>("[data-pin-sequence]")) {
        const route = section.querySelector<SVGPathElement>("[data-pin-route]");
        const steps = Array.from(section.querySelectorAll<HTMLElement>("[data-pin-step]"));
        const dots = Array.from(section.querySelectorAll<HTMLElement>("[data-pin-dot]"));
        const counter = section.querySelector<HTMLElement>("[data-pin-counter]");
        const pinned = section.querySelector<HTMLElement>("[data-pin-target]") ?? section;
        if (!steps.length || pinned.scrollHeight > window.innerHeight - 96) continue;
        const activate = (index: number) => steps.forEach((step, i) => step.toggleAttribute("data-active-step", i === index));
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 88px",
            end: () => `+=${Math.min(steps.length * 150, window.innerHeight * 0.9)}`,
            pin: pinned,
            pinSpacing: true,
            scrub: 0.6,
            anticipatePin: 1,
            onUpdate: (self) => {
              const index = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
              activate(index);
              if (counter) counter.textContent = String(index + 1).padStart(2, "0");
            },
          },
        });
        if (route) {
          gsap.set(route, { strokeDasharray: 1, strokeDashoffset: 1 });
          tl.to(route, { strokeDashoffset: 0, duration: steps.length, ease: "none" }, 0);
        }
        steps.forEach((step, index) => {
          tl.fromTo(step, { y: 8 }, { y: 0, duration: 0.6, ease: "power2.out" }, index * 1 + 0.1);
          const dot = dots[index];
          if (dot) tl.fromTo(dot, { scale: 0.4, opacity: 0.4 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(3)" }, index * 1 + 0.05);
        });
        tl.to({}, { duration: 0.4 });
        cleanups.push(() => steps.forEach((step) => step.removeAttribute("data-active-step")));
      }
    });
    mm.add("(max-width: 63.99rem), (max-height: 45.99rem), (hover: none)", () => {
      for (const section of document.querySelectorAll<HTMLElement>("[data-pin-sequence]")) {
        const steps = section.querySelectorAll<HTMLElement>("[data-pin-step]");
        const route = section.querySelector<SVGPathElement>("[data-pin-route]");
        if (route) gsap.set(route, { strokeDasharray: 1, strokeDashoffset: 0 });
        steps.forEach((step, index) => {
          if (!belowFold(step)) return;
          gsap.fromTo(step, { opacity: 1, y: 18 }, { opacity: 1, y: 0, duration: 0.65, ease: "power3.out", delay: index * 0.04, scrollTrigger: { trigger: step, start: "top 92%", once: true } });
        });
      }
    });
    cleanups.push(() => mm.revert());
  });

  // Magnetic CTAs (fine pointers only): the button leans toward the pointer and springs back.
  if (finePointer) {
    for (const el of document.querySelectorAll<HTMLElement>("[data-magnetic]")) {
      const strength = Math.max(0, Math.min(0.14, Number(el.dataset.magnetic || 0.1) || 0));
      const move = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        el.style.setProperty("--mx", `${Math.max(-6, Math.min(6, dx * strength)).toFixed(1)}px`);
        el.style.setProperty("--my", `${Math.max(-4, Math.min(4, dy * strength)).toFixed(1)}px`);
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
  const refresh = () => { if (active) ScrollTrigger.refresh(); };
  const revealFocused = (event: FocusEvent) => {
    if (!(event.target instanceof HTMLElement)) return;
    const target = event.target.closest<HTMLElement>("[data-motion], [data-pin-step]");
    if (!target) return;
    const child = target.dataset.motion === "stagger" ? Array.from(target.children).find((element) => element.contains(event.target as Node)) : undefined;
    const reveal = child ? [target, child] : [target];
    gsap.killTweensOf(reveal);
    gsap.set(reveal, { opacity: 1, y: 0, scale: 1 });
  };
  document.addEventListener("focusin", revealFocused);
  cleanups.push(() => document.removeEventListener("focusin", revealFocused));
  document.fonts?.ready.then(refresh).catch(() => undefined);
  window.addEventListener("load", refresh);
  cleanups.push(() => window.removeEventListener("load", refresh));

  return () => {
    active = false;
    for (const fn of cleanups) fn();
    ctx.revert();
    for (const [el, label] of originals) {
      if (label === null) el.removeAttribute("aria-label");
      else el.setAttribute("aria-label", label);
      const value = Number(el.dataset.counter);
      if (Number.isFinite(value)) el.textContent = `${value.toLocaleString("en-US")}${el.dataset.counterSuffix ?? ""}`;
    }
    root.removeAttribute("data-gsap");
    root.removeAttribute("data-scrolled");
  };
}

export function MotionProvider() {
  const pathname = usePathname();
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    let generation = 0;
    let cancelIdle: (() => void) | undefined;
    const update = () => {
      const current = ++generation;
      cancelIdle?.();
      cleanup?.();
      cleanup = undefined;
      if (preference.matches) return;
      cancelIdle = idle(() => {
        loadGsap()
        .then(({ gsap, ScrollTrigger }) => {
          if (cancelled || current !== generation || preference.matches) return;
          const previousTriggers = new Set(ScrollTrigger.getAll());
          try {
            cleanup = choreograph(gsap, ScrollTrigger);
          } catch {
            // A failed animation must never leave otherwise usable content hidden.
            document.documentElement.removeAttribute("data-gsap");
            for (const trigger of ScrollTrigger.getAll()) if (!previousTriggers.has(trigger)) trigger.kill(true);
            for (const el of document.querySelectorAll<HTMLElement>("[data-motion], [data-motion] > *, [data-pin-step], [data-stamp]")) {
              gsap.killTweensOf(el);
              gsap.set(el, { clearProps: "opacity,transform" });
            }
          }
        })
        .catch(() => undefined);
      });
    };
    update();
    preference.addEventListener("change", update);
    return () => {
      cancelled = true;
      generation++;
      cancelIdle?.();
      cleanup?.();
      preference.removeEventListener("change", update);
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
