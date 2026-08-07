"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The site's scroll-driven animation layer.
 *
 * GSAP owns scroll work only — section reveals, parallax, ornamental drift,
 * line draws and the chrome sweep. Interaction states (buttons, menu, form,
 * cards) belong to Motion, and nothing here touches those elements.
 *
 * Reveal start states live in CSS behind the `.js-motion` class, which a
 * pre-paint script adds only when motion will actually run — so content is
 * fully visible before hydration and stays visible if the script never runs.
 */

/**
 * Selector strings resolved inside a `useGSAP` scope are scoped to that scope
 * element, which would silently match nothing here. Every lookup goes through
 * this document-level helper instead.
 */
function queryAll<T extends Element>(selector: string): T[] {
  return Array.from(document.querySelectorAll<T>(selector));
}

export function ScrollAnimations() {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = document.documentElement;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduce) {
        // Reduced motion: no parallax, no drift, no shimmer. The pre-paint
        // bootstrap never staged anything, so content is already final.
        root.classList.remove("js-motion");
        return;
      }

      // Tells the pre-paint watchdog that the animation layer is alive.
      root.setAttribute("data-motion-ready", "");

      const ctx = gsap.matchMedia();

      /* ------------------------------------------------------------------ */
      /* Section reveals — opacity + small translation, restrained easing    */
      /*                                                                     */
      /* Start states come from CSS (`.js-motion`), so GSAP only animates     */
      /* forwards. Each element is animated exactly once, by one library.     */
      /* ------------------------------------------------------------------ */
      const revealBlocks = queryAll<HTMLElement>("[data-reveal]");

      let openingDelay = 0.15;

      revealBlocks.forEach((block) => {
        const children = block.querySelectorAll<HTMLElement>("[data-reveal-child]");
        const targets = children.length > 0 ? Array.from(children) : [block];

        const common = {
          opacity: 1,
          y: 0,
          duration: 1.05,
          // A long, decelerating tail is what reads as "smooth"; power2 arrived
          // too abruptly at rest.
          ease: "expo.out",
          stagger: children.length > 0 ? 0.085 : 0,
          clearProps: "willChange",
        };

        // Anything already on screen at load plays as part of the opening
        // sequence. Waiting for a scroll trigger left elements pinned to the
        // bottom of the first viewport — the hero's scroll indicator among them —
        // stranded below the threshold and permanently invisible.
        if (block.getBoundingClientRect().top < window.innerHeight) {
          // `data-reveal-delay` overrides the running stagger, in seconds. The
          // scroll indicator uses it to arrive well after the copy, so the eye
          // reads the hero first and only then is invited to scroll.
          const explicit = Number.parseFloat(block.dataset.revealDelay ?? "");
          gsap.to(targets, {
            ...common,
            delay: Number.isFinite(explicit) ? explicit : openingDelay,
          });
          if (!Number.isFinite(explicit)) openingDelay += 0.12;
          return;
        }

        gsap.to(targets, {
          ...common,
          scrollTrigger: {
            trigger: block,
            /**
             * "top 92%" needs the page scrolled until the block's top sits 92%
             * down the viewport. For content in the last 8% of the document —
             * the final section's CTA, for instance — that scroll position does
             * not exist, so the trigger never fires and the element stays
             * invisible forever. When the threshold is out of reach, fall back
             * to revealing as soon as the block enters the viewport at all.
             *
             * A function keeps this correct across refreshes, since late-loading
             * images change the document height.
             */
            start: () => {
              const blockTop = block.getBoundingClientRect().top + window.scrollY;
              const required = blockTop - window.innerHeight * 0.92;
              return required <= ScrollTrigger.maxScroll(window) ? "top 92%" : "top bottom";
            },
            invalidateOnRefresh: true,
            once: true,
          },
        });
      });

      /* ------------------------------------------------------------------ */
      /* Section entry / exit                                                */
      /*                                                                     */
      /* Each section lifts and settles as it enters the viewport, and eases  */
      /* back out as it leaves. Scrubbed, so it tracks the scroll wheel       */
      /* exactly and reverses cleanly — never a one-shot that fights the      */
      /* user's direction. Movement is deliberately small; the perceived      */
      /* smoothness comes from the scrub inertia, not from distance.          */
      /*                                                                      */
      /* The scrub is short (0.45s) and the dimming shallow. At 1.1s the       */
      /* opacity took over a second to catch up after the wheel stopped, so    */
      /* scrolling back up left the whole page trailing dim — it read as a     */
      /* bug rather than as easing. Depth was cut for the same reason: any     */
      /* residual lag on a shallow fade is invisible.                          */
      /* ------------------------------------------------------------------ */
      ctx.add("(min-width: 768px)", () => {
        queryAll<HTMLElement>("main > section").forEach((section, index) => {
          const inner = section.querySelector<HTMLElement>(".container");
          if (!inner) return;

          // Entry: rises the last stretch into place.
          if (index > 0) {
            gsap.fromTo(
              inner,
              { y: 40, autoAlpha: 0.8 },
              {
                y: 0,
                autoAlpha: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top 95%",
                  end: "top 62%",
                  scrub: 0.45,
                },
              },
            );
          }

          /**
           * Exit: drifts up and dims as the section leaves.
           *
           * `fromTo` with `immediateRender: false`, not `to`. Two tweens write
           * `y` on this element, and a plain `to` infers its start value from
           * whatever `y` holds when it first renders — which is the entry
           * tween's `from` value, applied at creation. The exit therefore
           * snapped the section downwards the moment its trigger activated,
           * before animating up. Stating both ends explicitly, and refusing to
           * render before the trigger fires, removes the guesswork.
           */
          gsap.fromTo(
            inner,
            { y: 0, autoAlpha: 1 },
            {
              y: -30,
              autoAlpha: 0.62,
              ease: "none",
              immediateRender: false,
              scrollTrigger: {
                trigger: section,
                start: "bottom 62%",
                end: "bottom 12%",
                scrub: 0.45,
              },
            },
          );
        });
      });

      /* ------------------------------------------------------------------ */
      /* Backdrop parallax                                                   */
      /*                                                                     */
      /* The ornamental strip drifts slower than the page, which is what      */
      /* gives the scroll its depth. Scrubbed with a little inertia so it     */
      /* glides rather than tracks rigidly.                                   */
      /* ------------------------------------------------------------------ */
      const strip = document.querySelector<HTMLElement>("[data-backdrop-strip]");
      if (strip) {
        /*
         * The strip is 112% of the document tall (see PageBackdrop.module.css),
         * so it has 12% of spare height to travel through and still cover the
         * page at every scroll position. Moving it by 12/112 of its own height
         * spends exactly that slack: the backdrop ends up drifting 12% slower
         * than the content. At the previous 4% the effect was there but almost
         * invisible.
         */
        gsap.to(strip, {
          yPercent: -(12 / 112) * 100,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.2,
          },
        });
      }

      /* ------------------------------------------------------------------ */
      /* Chrome highlight sweep — slow, continuous, paused off-screen        */
      /* ------------------------------------------------------------------ */
      queryAll<HTMLElement>("[data-chrome-sweep]").forEach((element, index) => {
        // A slow, endlessly repeating pass. It used to fire once and stop dead,
        // which read as the metal "switching off". The long `repeatDelay` keeps
        // it a highlight travelling over the surface rather than a blink.
        const sweep = gsap.fromTo(
          element,
          { "--chrome-sweep": "8%" },
          {
            "--chrome-sweep": "92%",
            duration: 3.4,
            ease: "sine.inOut",
            repeat: -1,
            // Travels back instead of restarting: without yoyo the tween snaps
            // from 92% to 8% each cycle, which reads as a flash.
            yoyo: true,
            repeatDelay: 1.1,
            paused: true,
          },
        );

        // Only animates while the heading is on screen: an off-screen tween
        // still burns frames.
        ScrollTrigger.create({
          trigger: element,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => gsap.delayedCall(0.25 + index * 0.12, () => sweep.play()),
          onEnterBack: () => sweep.play(),
          onLeave: () => sweep.pause(),
          onLeaveBack: () => sweep.pause(),
        });
      });

      /* ------------------------------------------------------------------ */
      /* Desktop-only: parallax + pointer response on the hero sigil         */
      /* ------------------------------------------------------------------ */
      ctx.add("(min-width: 1024px) and (pointer: fine)", () => {
        const sigil = document.querySelector<SVGSVGElement>("[data-hero-sigil]");
        if (!sigil) return;

        const quickX = gsap.quickTo(sigil, "x", { duration: 0.9, ease: "power3.out" });
        const quickY = gsap.quickTo(sigil, "y", { duration: 0.9, ease: "power3.out" });

        const onPointerMove = (event: PointerEvent) => {
          const nx = event.clientX / window.innerWidth - 0.5;
          const ny = event.clientY / window.innerHeight - 0.5;
          // Maximum displacement stays inside the 6–12px budget.
          quickX(nx * 22);
          quickY(ny * 18);
        };

        window.addEventListener("pointermove", onPointerMove, { passive: true });
        return () => window.removeEventListener("pointermove", onPointerMove);
      });

      /* ------------------------------------------------------------------ */
      /* Scroll-linked parallax on decorative layers                         */
      /* ------------------------------------------------------------------ */
      ctx.add("(min-width: 768px)", () => {
        queryAll<HTMLElement>("[data-parallax]").forEach((layer) => {
          const depth = Number(layer.dataset.parallax) || 1;
          gsap.to(layer, {
            yPercent: -6 * depth,
            ease: "none",
            scrollTrigger: {
              trigger: layer.closest("section") ?? layer,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.8,
            },
          });
        });
      });

      /* ------------------------------------------------------------------ */
      /* Slow ornamental drift — paused while off-screen                     */
      /* ------------------------------------------------------------------ */
      queryAll<HTMLElement>("[data-drift]").forEach((ornament, index) => {
        const tween = gsap.to(ornament, {
          y: index % 2 === 0 ? 12 : -12,
          rotation: index % 2 === 0 ? 1.1 : -1.1,
          duration: 9 + (index % 4),
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          paused: true,
        });

        ScrollTrigger.create({
          trigger: ornament.closest("section") ?? ornament,
          start: "top bottom",
          end: "bottom top",
          onEnter: () => tween.play(),
          onEnterBack: () => tween.play(),
          onLeave: () => tween.pause(),
          onLeaveBack: () => tween.pause(),
        });
      });

      /* ------------------------------------------------------------------ */
      /* About: portrait mask wipe + frame line draw                         */
      /* ------------------------------------------------------------------ */
      const portraitMask = document.querySelector<HTMLElement>("[data-portrait-mask]");
      if (portraitMask) {
        gsap.fromTo(
          portraitMask,
          { clipPath: "inset(0% 0% 100% 0%)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1.35,
            ease: "expo.out",
            scrollTrigger: { trigger: portraitMask, start: "top 86%", once: true },
          },
        );
      }

      /* ------------------------------------------------------------------ */
      /* Hairline rules draw in from the centre                              */
      /* ------------------------------------------------------------------ */
      queryAll<HTMLElement>("[data-line-draw]").forEach((line) => {
        gsap.from(line, {
          scaleX: 0,
          transformOrigin: "center",
          duration: 1.2,
          ease: "expo.out",
          scrollTrigger: { trigger: line, start: "top 94%", once: true },
        });
      });

      // Late-arriving images (the Instagram feed streams in) change page height.
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);

      return () => {
        window.removeEventListener("load", refresh);
        ctx.revert();
      };
    },
    { scope },
  );

  // A zero-size scope node: the animations target the whole document, but
  // useGSAP still needs an element to own cleanup.
  return <div ref={scope} aria-hidden="true" style={{ display: "none" }} />;
}
