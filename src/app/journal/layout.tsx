import type { ReactNode } from "react";
import { EditorialShell } from "@/components/editorial/EditorialShell";

export default function JournalLayout({ children }: { children: ReactNode }) {
  return <EditorialShell>{children}</EditorialShell>;
}
