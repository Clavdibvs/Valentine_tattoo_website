import { CursorFollower } from "@/components/animation/CursorFollower";
import { IntroOverlay } from "@/components/animation/IntroOverlay";
import { ScrollAnimations } from "@/components/animation/ScrollAnimations";
import { ScrollMeter } from "@/components/animation/ScrollMeter";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ChromeDefs } from "@/components/ornaments/ChromeDefs";
import { PageBackdrop } from "@/components/ornaments/PageBackdrop";
import { AboutSection } from "@/components/sections/AboutSection";
import { BookingSection } from "@/components/sections/BookingSection";
import { CollectionSection } from "@/components/sections/CollectionSection";
import { FaqSection } from "@/components/sections/FaqSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { HomeJournalSection } from "@/components/sections/HomeJournalSection";
import { InstagramSection } from "@/components/sections/InstagramSection";
import { a11yContent } from "@/content/site-content";
import { resolveIntro } from "@/lib/intro";

export default function Home() {
  // Decided on the server so the animation layer knows whether to wait before
  // it hydrates — no client-side race over who starts first.
  const intro = resolveIntro();

  return (
    <>
      {/* Shared SVG gradients/filters for every chrome ornament. */}
      <ChromeDefs />

      {/* Background atmosphere: base tone, vignette, grain. */}
      <div className="atmosphere" aria-hidden="true" data-decor="" />
      <div className="grain" aria-hidden="true" data-decor="" />

      {/* One continuous ornamental strip behind the entire document. */}
      <PageBackdrop waitForIntro={Boolean(intro)} />

      {/* Opening clip, when one has been supplied. Purely additive. */}
      {intro ? (
        <>
          {/*
            Starts the download during parse — but only for visitors who will
            actually see it, and only the cut their viewport needs. The video
            element itself gets its source on hydration; this just means the
            bytes are already arriving by then.
          */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{
if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var portrait=matchMedia('(max-width: 1023px)').matches;
var href=portrait?${JSON.stringify(intro.mobile ?? intro.desktop)}:${JSON.stringify(intro.desktop ?? intro.mobile)};
if(!href)return;
var l=document.createElement('link');l.rel='preload';l.as='video';l.href=href;
document.head.appendChild(l);}catch(e){}})();`,
            }}
          />
          <IntroOverlay intro={intro} />
        </>
      ) : null}

      <a href="#main" className="skip-link">
        {a11yContent.skipToContent}
      </a>

      <SiteHeader waitForIntro={Boolean(intro)} />

      {/*
        Section order: the work comes first, the booking invitation next, and
        the artist's story closes the page. About sits last by request.
      */}
      <main id="main">
        <HeroSection />
        <InstagramSection />
        <CollectionSection
          id="creazioni"
          railIndex="03"
          railWords={["CUSTOM", "SU MISURA"]}
        />
        <CollectionSection id="flash" railIndex="04" railWords={["FLASH", "READY TO INK"]} />
        <CollectionSection id="merch" railIndex="05" railWords={["MERCH", "WEAR THE MARK"]} />
        <BookingSection />
        <AboutSection />
        {/* Closes the page: the questions someone still has after reading it. */}
        <FaqSection />
        <HomeJournalSection />
      </main>

      {/* Closing line, below every section. */}
      <SiteFooter />

      <ScrollAnimations waitForIntro={Boolean(intro)} />

      {/* Interface light, drawn over everything and touching nothing: the
          charge running down the frame, and the follower ring. */}
      <ScrollMeter />
      <CursorFollower />
    </>
  );
}
