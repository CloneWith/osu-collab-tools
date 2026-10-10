import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Footer from "@/app/footer";
import { IntlProvider } from "@/components/providers/intl-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "osu! Collab Tools",
  description: "A simple, easy-to-use collab toolbox site",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  // Suppressing hydration warning due to dark mode class
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <IntlProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <TooltipProvider delayDuration={300}>
              <Navbar />
              <main>{children}</main>
              <Toaster />
              <Footer />
            </TooltipProvider>
          </ThemeProvider>
        </IntlProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
