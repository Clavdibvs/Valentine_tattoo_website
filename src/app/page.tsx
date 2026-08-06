import { ScrollAnimations } from "@/components/animation/ScrollAnimations";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ChromeDefs } from "@/components/ornaments/ChromeDefs";
import { PageBackdrop } from "@/components/ornaments/PageBackdrop";
import { AboutSection } from "@/components/sections/AboutSection";
import { BookingSection } from "@/components/sections/BookingSection";
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

      <main id="main">
        <HeroSection />
        <AboutSection />
        <InstagramSection />
        <BookingSection />
      </main>

      <ScrollAnimations />
    </>
  );
}
