import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import "@/app/globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { ToastProvider } from "@/components/shared/toast-provider";
import { appConfig } from "@/lib/config";

const manrope = Manrope({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
  icons: {
    icon: [
      { url: "/images/favicon32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/favicon16.png", sizes: "16x16", type: "image/png" }
    ],
    shortcut: "/images/favicon32.png",
    apple: "/images/favicon32.png"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={manrope.className}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
