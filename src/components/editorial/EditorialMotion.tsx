"use client";

import { usePathname } from "next/navigation";
import { ScrollAnimations } from "@/components/animation/ScrollAnimations";

/** Re-initialize the existing motion layer when a Journal route changes. */
export function EditorialMotion() {
  return <ScrollAnimations key={usePathname()} />;
}
