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
          gsap.to(targets, { ...common, delay: openingDelay });
          openingDelay += 0.12;
          return;
        }

        gsap.to(targets, {
          ...common,
          scrollTrigger: { trigger: block, start: "top 92%", once: true },
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
      /* ------------------------------------------------------------------ */
      ctx.add("(min-width: 768px)", () => {
        queryAll<HTMLElement>("main > section").forEach((section, index) => {
          const inner = section.querySelector<HTMLElement>(".container");
          if (!inner) return;

          // Entry: rises the last stretch into place.
          if (index > 0) {
            gsap.fromTo(
              inner,
              { y: 46, autoAlpha: 0.55 },
              {
                y: 0,
                autoAlpha: 1,
                ease: "none",
                scrollTrigger: {
                  trigger: section,
                  start: "top 92%",
                  end: "top 52%",
                  scrub: 1.1,
                },
              },
            );
          }

          // Exit: drifts up and dims as the section leaves.
          gsap.to(inner, {
            y: -34,
            autoAlpha: 0.35,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "bottom 78%",
              end: "bottom 18%",
              scrub: 1.1,
            },
          });
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
        gsap.to(strip, {
          yPercent: -4,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.4,
          },
        });
      }

      /* ------------------------------------------------------------------ */
      /* Chrome highlight sweep — short, occasional, never a loop            */
      /* ------------------------------------------------------------------ */
      queryAll<HTMLElement>("[data-chrome-sweep]").forEach((element, index) => {
        const sweep = gsap.fromTo(
          element,
          { "--chrome-sweep": "14%" },
          {
            "--chrome-sweep": "86%",
            duration: 2.1,
            ease: "sine.inOut",
            paused: true,
            onComplete: () => gsap.set(element, { "--chrome-sweep": "50%" }),
          },
        );

        ScrollTrigger.create({
          trigger: element,
          start: "top 82%",
          once: true,
          onEnter: () => {
            gsap.delayedCall(0.35 + index * 0.1, () => sweep.restart());
          },
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
