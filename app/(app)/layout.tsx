import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { demoViewer } from "@/lib/demo/seed-data";
import { getHousesForViewer, getViewer } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/config";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();

  if (!viewer && isSupabaseConfigured) {
    redirect("/auth");
  }

  const resolvedViewer = viewer ?? demoViewer;
  const houses = await getHousesForViewer(resolvedViewer);

  return <AppShell viewer={resolvedViewer} houses={houses}>{children}</AppShell>;
}
