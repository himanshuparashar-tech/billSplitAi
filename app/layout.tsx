import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";

import "@/app/globals.css";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { ToastProvider } from "@/components/shared/toast-provider";
import { appConfig } from "@/lib/config";

const manrope = Manrope({ subsets: ["latin"] });
const themeInitScript = `
  (function () {
    try {
      var stored = localStorage.getItem("splitbill-theme") || localStorage.getItem("theme");
      var theme = stored === "dark" || stored === "light" ? stored : "light";
      var root = document.documentElement;
      root.classList.toggle("dark", theme === "dark");
      root.style.colorScheme = theme;
    } catch (error) {}
  })();
`;

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
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${manrope.className} bg-[color:var(--bg-primary)] text-[color:var(--text-primary)] transition-colors duration-300`}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
