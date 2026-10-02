"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useRef } from "react";

import { BACKDROP_PARALLAX, BACKDROP_STRIP_SELECTOR } from "@/lib/backdrop-parallax";
import { onIntroCue } from "@/lib/intro-timing";

import { addArcReveal, addChildReveal, dropTransform, FORGE, frameClose, prime, queryAll } from "./motion-kit";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * The site's scroll-driven animation layer.
 *
 * GSAP owns scroll work — section reveals, the hero's light and exit, the
 * backdrop parallax, the chrome sweep, the portrait reveal. Interaction states
 * (buttons, menu, form, cards) belong to Motion or to their own components,
 * and nothing here touches those elements.
 *
 * Reveal start states live in CSS behind the `.js-motion` class, which a
 * pre-paint script adds only when motion will actually run — so content is
 * fully visible before hydration and stays visible if the script never runs.
 * The vocabulary of the reveals themselves is in `motion-kit.ts`.
 */
export function ScrollAnimations({ waitForIntro = false }: { waitForIntro?: boolean }) {
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
      /* The opening sequence                                                */
      /*                                                                     */
      /* Everything on screen at load plays as one sequence. It waits for     */
      /* the intro clip's cue when there is a clip, and for the fonts in any  */
      /* case: the titles are split into letters as they play, and a split   */
      /* measured in the fallback face would set every letter in the wrong   */
      /* place. Both waits are bounded — nothing is left to an event that     */
      /* might never fire.                                                    */
      /* ------------------------------------------------------------------ */
      const openings: Array<() => void> = [];
      let opened = false;
      const runOpenings = () => {
        if (opened) return;
        opened = true;
        while (openings.length) openings.shift()?.();
        heroLight();
      };

      const fonts: Promise<unknown> = Promise.race([
        document.fonts?.ready ?? Promise.resolve(),
        new Promise((resolve) => window.setTimeout(resolve, 1500)),
      ]);
      const open = () => {
        void fonts.then(runOpenings);
      };

      if (waitForIntro) {
        const fallback = window.setTimeout(open, 8000);
        onIntroCue(() => {
          window.clearTimeout(fallback);
          open();
        });
      } else {
        open();
      }

      /* ------------------------------------------------------------------ */
      /* Reveals                                                             */
      /* ------------------------------------------------------------------ */
      let openingDelay = 0.15;
      const blocks = queryAll<HTMLElement>("[data-reveal]");

      // Everything the reveals will move is read once, here, while nothing has
      // been written yet; their staged opacity (0, as the CSS already has it)
      // goes inline. Without this each reveal read its elements back as it
      // started, mid-frame, forcing a style and layout pass every time.
      prime(
        blocks.flatMap((block) => {
          const children = queryAll<HTMLElement>("[data-reveal-child]", block);
          return children.length ? children : [block];
        }),
        0,
      );
      prime(queryAll("[data-reveal] [data-draw]"));

      blocks.forEach((block) => {
        const children = queryAll<HTMLElement>("[data-reveal-child]", block);
        const arc = block.querySelector<SVGSVGElement>("svg[data-arc]");

        const build = (vars: gsap.TimelineVars) => {
          const tl = gsap.timeline(vars);
          // A heading's arc is drawn first; its eyebrow and title follow it.
          const offset = arc ? 0.3 : 0;
          if (arc) addArcReveal(tl, arc, 0);
          if (children.length === 0) {
            addChildReveal(tl, block, offset, block.dataset.reveal ?? "");
          } else {
            children.forEach((child, index) => addChildReveal(tl, child, offset + index * 0.14));
          }
          return tl;
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
          const delay = Number.isFinite(explicit) ? explicit : openingDelay;
          openings.push(() => build({ delay }));
          if (!Number.isFinite(explicit)) openingDelay += 0.12;
          return;
        }

        build({
          scrollTrigger: {
            trigger: block,
            /**
             * "top 88%" needs the page scrolled until the block's top sits 88%
             * down the viewport. For content in the last stretch of the
             * document — the final section's CTA, for instance — that scroll
             * position does not exist, so the trigger would never fire and the
             * element would stay invisible forever. When the threshold is out
             * of reach, fall back to revealing as soon as the block enters.
             *
             * A function keeps this correct across refreshes, since late-loading
             * images change the document height.
             */
            start: () => {
              const blockTop = block.getBoundingClientRect().top + window.scrollY;
              const required = blockTop - window.innerHeight * 0.88;
              return required <= ScrollTrigger.maxScroll(window) ? "top 88%" : "top bottom";
            },
            invalidateOnRefresh: true,
            once: true,
          },
        });
      });

      /* ------------------------------------------------------------------ */
      /* Frames close on their panels                                        */
      /*                                                                     */
      /* Every chrome panel that wears corner brackets has them converge onto */
      /* it as it arrives, and its nodes flash alight. The galleries stream   */
      /* in after this layer mounts, so they close their own frames.          */
      /* ------------------------------------------------------------------ */
      queryAll<HTMLElement>(".chrome-frame").forEach((frame) => {
        if (frame.closest("[data-gallery]")) return;
        if (!frame.querySelector(":scope > [data-frame-ornament]")) return;
        const close = frameClose(frame);
        ScrollTrigger.create({
          trigger: frame,
          start: "top 86%",
          once: true,
          onEnter: () => {
            close.play();
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
      /* bug rather than as easing.                                            */
      /* ------------------------------------------------------------------ */
      ctx.add("(min-width: 768px)", () => {
        queryAll<HTMLElement>("main > section").forEach((section, index) => {
          const inner = section.querySelector<HTMLElement>(".container");
          if (!inner) return;

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
           * `fromTo` with `immediateRender: false`, not `to`. Two tweens write
           * `y` on this element, and a plain `to` infers its start value from
           * whatever `y` holds when it first renders — which is the entry
           * tween's `from` value, applied at creation. The exit therefore
           * snapped the section downwards the moment its trigger activated.
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
      /* Backdrop parallax — unchanged: the plates' arrangement is the art.  */
      /*                                                                     */
      /* The ornamental strip drifts slower than the page, which is what      */
      /* gives the scroll its depth. Every strip moves, not just the first:  */
      /* the molten layer renders a second copy as its luminance matte, and  */
      /* the two must travel as one.                                         */
      /* ------------------------------------------------------------------ */
      const strips = queryAll(BACKDROP_STRIP_SELECTOR);
      if (strips.length) {
        gsap.to(strips, {
          yPercent: BACKDROP_PARALLAX.yPercent,
          ease: "none",
          scrollTrigger: {
            trigger: document.body,
            start: "top top",
            end: "bottom bottom",
            scrub: BACKDROP_PARALLAX.scrub,
          },
        });
      }

      /* ------------------------------------------------------------------ */
      /* Chrome highlight sweep — slow, continuous, paused off-screen        */
      /*                                                                     */
      /* It waits for the title's reveal to finish before it starts, so the   */
      /* letters are whole again when the light begins to move over them.     */
      /*                                                                      */
      /* Wide screens with a mouse only, and unhurried: every step of it      */
      /* repaints the title under its filters, which a phone pays for in      */
      /* battery and in the smoothness of the scroll around it. On a phone    */
      /* the highlight still runs once, as each title arrives.                */
      /* ------------------------------------------------------------------ */
      ctx.add("(min-width: 1024px) and (hover: hover)", () => {
        queryAll<HTMLElement>("[data-chrome-sweep]").forEach((element) => {
          // From the resting point (0.5) down, across, and back to rest, so the
          // loop begins and ends where the title already is — no jump when it
          // starts, none between cycles.
          const sweep = gsap.timeline({ repeat: -1, repeatDelay: 2.4, paused: true });
          sweep
            .to(element, { "--sweep-p": 0.92, duration: 2.2, ease: "sine.inOut" })
            .to(element, { "--sweep-p": 0.08, duration: 4.4, ease: "sine.inOut" })
            .to(element, { "--sweep-p": 0.5, duration: 2.2, ease: "sine.inOut" });

          let started = false;
          ScrollTrigger.create({
            trigger: element,
            start: "top bottom",
            end: "bottom top",
            onEnter: () => {
              if (started) return sweep.play();
              started = true;
              gsap.delayedCall(3, () => sweep.play());
            },
            onEnterBack: () => sweep.play(),
            onLeave: () => sweep.pause(),
            onLeaveBack: () => sweep.pause(),
          });
        });
      });

      /* ------------------------------------------------------------------ */
      /* Hero: the light on the lettering, and the exit                      */
      /* ------------------------------------------------------------------ */
      const hero = document.getElementById("home");
      const lettering = hero?.querySelector<HTMLElement>("[data-hero-title]");
      const glint = hero?.querySelector<HTMLElement>("[data-glint]");
      const glintBar = glint?.querySelector<HTMLElement>("[data-glint-bar]");
      /*
       * `at` is where the band of light sits across the lettering (0 its left
       * edge, 1 its right), `o` how bright it is. The bar is 2.8× the
       * lettering's width with the band at its middle, so placing the band at
       * `at` means shifting the bar by (at − 1.4) of the lettering — written as
       * a transform, so following the pointer never repaints the wordmark.
       */
      const glintState = { at: -0.6, o: 0 };
      const writeGlint = () => {
        if (!glint || !glintBar) return;
        glintBar.style.transform = `translate3d(${(((glintState.at - 1.4) / 2.8) * 100).toFixed(2)}%, 0, 0)`;
        glint.style.opacity = glintState.o.toFixed(3);
      };

      /** A bar of light crossing the chrome, as polished metal catches a lamp. */
      const glintPass = (delay = 0) =>
        gsap.fromTo(
          glintState,
          { at: -0.6, o: 1 },
          {
            at: 1.6,
            duration: 1.6,
            delay,
            ease: "power2.inOut",
            onUpdate: writeGlint,
            onComplete: () => {
              glintState.o = 0;
              writeGlint();
            },
          },
        );

      /** Called once the opening sequence starts. */
      function heroLight() {
        if (!glint) return;
        glintPass(1.35);
      }

      // Pointer: the reflection follows the eye across the lettering, and the
      // letters turn very slightly toward it.
      ctx.add("(min-width: 1024px) and (pointer: fine)", () => {
        if (!hero || !lettering || !glint) return;
        gsap.set(lettering, { transformPerspective: 900 });
        const toAt = gsap.quickTo(glintState, "at", { duration: 0.9, ease: "power3", onUpdate: writeGlint });
        const toO = gsap.quickTo(glintState, "o", { duration: 0.6, ease: "power2", onUpdate: writeGlint });
        const tiltX = gsap.quickTo(lettering, "rotationX", { duration: 1.2, ease: "power3" });
        const tiltY = gsap.quickTo(lettering, "rotationY", { duration: 1.2, ease: "power3" });

        const onMove = (event: PointerEvent) => {
          const nx = event.clientX / window.innerWidth;
          const ny = event.clientY / window.innerHeight;
          // The bright band sits under the pointer, wherever it crosses.
          const box = lettering.getBoundingClientRect();
          toAt(gsap.utils.clamp(-0.4, 1.4, (event.clientX - box.left) / box.width));
          toO(0.65);
          tiltY((nx - 0.5) * 9);
          tiltX(-(ny - 0.5) * 7);
        };
        const onLeave = () => {
          toO(0);
          tiltX(0);
          tiltY(0);
        };

        hero.addEventListener("pointermove", onMove, { passive: true });
        hero.addEventListener("pointerleave", onLeave);
        return () => {
          hero.removeEventListener("pointermove", onMove);
          hero.removeEventListener("pointerleave", onLeave);
        };
      });

      // Touch: the light passes on its own every few seconds while the hero is
      // on screen.
      ctx.add("(max-width: 1023px), (pointer: coarse)", () => {
        if (!hero || !glint) return;
        const loop = gsap.timeline({ repeat: -1, repeatDelay: 4.5, delay: 6, paused: true });
        loop.fromTo(
          glintState,
          { at: -0.6, o: 1 },
          { at: 1.6, duration: 1.8, ease: "power2.inOut", onUpdate: writeGlint },
        );
        loop.set(glintState, { o: 0, onComplete: writeGlint });
        ScrollTrigger.create({
          trigger: hero,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? loop.play() : loop.pause()),
        });
      });

      // Exit: the copy lifts away faster than the plate behind it and dims —
      // depth, without moving a pixel of the backdrop.
      const heroCopy = hero?.querySelector<HTMLElement>("[data-hero-copy]");
      if (hero && heroCopy) {
        gsap.fromTo(
          heroCopy,
          { yPercent: 0, opacity: 1 },
          {
            yPercent: -16,
            opacity: 0,
            ease: "none",
            immediateRender: false,
            scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 },
          },
        );
        queryAll<HTMLElement>("[data-scroll-fade]", hero).forEach((part) => {
          gsap.fromTo(
            part,
            { opacity: 1, y: 0 },
            {
              opacity: 0,
              y: 24,
              ease: "none",
              immediateRender: false,
              scrollTrigger: { trigger: hero, start: "top top", end: "18% top", scrub: 0.4 },
            },
          );
        });

        // The light running down the scroll cue is a CSS animation, and a
        // running CSS animation is restyled on every frame, seen or not. Once
        // the cue has faded out it stops, and starts again on the way back up.
        const pulse = hero.querySelector<HTMLElement>("[data-scroll-pulse]");
        if (pulse) {
          ScrollTrigger.create({
            trigger: hero,
            start: "18% top",
            onEnter: () => {
              pulse.style.animationPlayState = "paused";
            },
            onLeaveBack: () => {
              pulse.style.removeProperty("animation-play-state");
            },
          });
        }
      }

      /* ------------------------------------------------------------------ */
      /* About: the portrait opens like a cut                                */
      /*                                                                     */
      /* A blade-thin slit down the middle widens to the full frame — two     */
      /* dark leaves drawing apart — while the photograph settles back from   */
      /* close and comes up out of the dark. Transforms and opacity only: the */
      /* first version wiped a clip-path and filtered the photograph, which   */
      /* repainted it on every frame of the reveal.                           */
      /* ------------------------------------------------------------------ */
      const portraitMask = document.querySelector<HTMLElement>("[data-portrait-mask]");
      if (portraitMask) {
        const photo = portraitMask.querySelector<HTMLElement>("img");
        const blades = queryAll<HTMLElement>("[data-blade]", portraitMask);
        const veil = portraitMask.querySelector<HTMLElement>("[data-portrait-veil]");
        const tl = gsap.timeline({
          scrollTrigger: { trigger: portraitMask, start: "top 82%", once: true },
        });
        tl.fromTo(
          blades,
          { scaleX: 1, willChange: "transform" },
          { scaleX: 0, duration: 1.7, ease: "expo.inOut", clearProps: "willChange" },
        );
        if (photo) {
          tl.fromTo(
            photo,
            { scale: 1.32 },
            { scale: 1, duration: 2.4, ease: FORGE, onComplete: () => dropTransform([photo]) },
            0.15,
          );
        }
        if (veil) {
          tl.fromTo(
            veil,
            { opacity: 0.75, willChange: "opacity" },
            { opacity: 0, duration: 2.2, ease: "power2.out", clearProps: "willChange" },
            0.2,
          );
        }
      }

      /* ------------------------------------------------------------------ */
      /* About: the lead is read into the light                              */
      /*                                                                     */
      /* Each word brightens as the paragraph passes through the middle of    */
      /* the screen, scrubbed to the scroll — the reader's pace sets it.      */
      /* ------------------------------------------------------------------ */
      queryAll<HTMLElement>("[data-scrub-words]").forEach((paragraph) => {
        const split = SplitText.create(paragraph, { type: "words", aria: "none" });
        // The dim starting point is written straight onto each word, and the
        // scrub is a plain `to` from it: a fromTo re-records its start as each
        // word's turn comes, a forced style pass per word, mid-scroll.
        (split.words as HTMLElement[]).forEach((word) => {
          word.style.opacity = "0.18";
        });
        gsap.to(
          split.words,
          {
            opacity: 1,
            ease: "none",
            stagger: 0.1,
            // Fully lit by the time the paragraph's foot is three-quarters of
            // the way down the screen — where someone stops to read it.
            scrollTrigger: {
              trigger: paragraph,
              start: "top 92%",
              end: "bottom 74%",
              scrub: 0.6,
            },
          },
        );
      });

      // Late-arriving images (the Instagram feed streams in) change page height.
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);

      return () => {
        window.removeEventListener("load", refresh);
        ctx.revert();
      };
    },
    { scope, dependencies: [waitForIntro] },
  );

  // A zero-size scope node: the animations target the whole document, but
  // useGSAP still needs an element to own cleanup.
  return <div ref={scope} aria-hidden="true" style={{ display: "none" }} />;
}
