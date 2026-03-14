"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function createSupabaseBrowserClient() {
  return getSupabaseBrowserClient();
}
