import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { ThemeProvider } from "@/components/theme-provider"
import { Aperture } from "lucide-react";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "osu! Collab Tools",
  description: "一个 Collab 工具箱，助力你做出还不错的 osu! 赛博合影",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Navbar />
          <main>{children}</main>
          <footer className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Aperture className="w-5 h-5 text-white"/>
                    </div>
                    <span className="text-xl font-bold">Collab Tools</span>
                  </div>
                  <p className="text-gray-400 mb-4">助力你做出还不错的 osu! 赛博合影</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-4">工具</h3>
                  <ul className="space-y-2 text-gray-400">
                    <li>
                      <Link href="/editor" className="hover:text-white transition-colors">
                        ImageMap 编辑器
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs" className="hover:text-white transition-colors">
                        使用文档
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                <p>&copy; 2025 CloneWith</p>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}
