import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

export function Logo({ tone = "dark" }: { tone?: "dark" | "light" | "white" }) {
  const isLight = tone === "light" || tone === "white";

  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-3 font-semibold", isLight ? "text-white" : "text-slate-950 dark:text-slate-50")}
    >
      <span className="relative block h-11 w-11 overflow-hidden rounded-2xl bg-white ring-1 ring-white/20">
        <Image src="/images/logo.png" alt="SplitBill AI logo" fill className="object-contain p-1.5" priority />
      </span>
      <span className="flex flex-col leading-tight">
        <span>SplitBill AI</span>
        <span className={cn("text-xs font-medium", isLight ? "text-blue-100" : "text-slate-500 dark:text-slate-400")}>
          Smart house electricity billing
        </span>
      </span>
    </Link>
  );
}

