import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { cn } from "@/lib/utils"
import { Providers } from "./providers"
import { Header } from "./header"
import { Sidebar } from "@/components/sidebar"
import { DashboardDataProvider } from "@/components/DashboardDataProvider"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        fontSans.variable
      )}
    >
      <body suppressHydrationWarning>
        <Providers>
          <div className="flex min-h-svh flex-col items-center bg-background">
            <div className="flex w-full max-w-[1440px] flex-1 flex-col px-4">
              <Header />
              <DashboardDataProvider>
                <div className="flex flex-1 gap-6 py-4">
                  <Sidebar />
                  <main className="flex-1">{children}</main>
                </div>
              </DashboardDataProvider>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
