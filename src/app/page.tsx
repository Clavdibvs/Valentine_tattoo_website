import { ScrollAnimations } from "@/components/animation/ScrollAnimations";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ChromeDefs } from "@/components/ornaments/ChromeDefs";
import { PageBackdrop } from "@/components/ornaments/PageBackdrop";
import { AboutSection } from "@/components/sections/AboutSection";
import { BookingSection } from "@/components/sections/BookingSection";
import { CollectionSection } from "@/components/sections/CollectionSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { InstagramSection } from "@/components/sections/InstagramSection";
import { a11yContent } from "@/content/site-content";

export default function Home() {
  return (
    <>
      {/* Shared SVG gradients/filters for every chrome ornament. */}
      <ChromeDefs />

      {/* Background atmosphere: base tone, vignette, grain. */}
      <div className="atmosphere" aria-hidden="true" data-decor="" />
      <div className="grain" aria-hidden="true" data-decor="" />

      {/* One continuous ornamental strip behind the entire document. */}
      <PageBackdrop />

      <a href="#main" className="skip-link">
        {a11yContent.skipToContent}
      </a>

      <SiteHeader />

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
      </main>

      {/* Closing line, below every section. */}
      <SiteFooter />

      <ScrollAnimations />
    </>
  );
}
