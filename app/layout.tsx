import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Footer from "@/app/footer";

const inter = Inter({subsets: ["latin"]});

export const metadata: Metadata = {
  title: "osu! Collab Tools",
  description: "A simple, easy-to-use collab toolbox site",
};

export default function RootLayout({
                                     children,
                                   }: {
  children: React.ReactNode
}) {
  // Suppressing hydration warning due to dark mode class
  return (
    <html lang="zh-CN" suppressHydrationWarning>
    <body className={inter.className}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider delayDuration={300}>
        <Navbar/>
        <main>{children}</main>
        <Toaster/>
        <Footer/>
      </TooltipProvider>
    </ThemeProvider>
    </body>
    </html>
  );
}
