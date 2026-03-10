"use client"

import { usePathname } from "next/navigation"
import { Header } from "./header"
import { Sidebar } from "@/components/sidebar"
import { DashboardDataProvider } from "@/components/DashboardDataProvider"

const AUTH_PATHS = ["/login", "/register"]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = AUTH_PATHS.includes(pathname ?? "")

  if (isAuthPage) {
    return (
      <div className="min-h-svh bg-background">
        <main className="min-h-svh">{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-background">
      <Header />
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-14">
        <DashboardDataProvider>
          <div className="flex flex-1 gap-6 py-4">
            <Sidebar />
            <main className="min-w-0 flex-1 lg:ml-[220px]">{children}</main>
          </div>
        </DashboardDataProvider>
      </div>
    </div>
  )
}
